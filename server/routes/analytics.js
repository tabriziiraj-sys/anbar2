import { Router } from 'express';
import { successResponse, errorResponse, requireAuth } from '../middleware.js';
import { sqlite } from '../db.js';

const router = Router();

// Dashboard data
router.get('/api/dashboard', requireAuth, (req, res) => {
  try {
    const productCount = sqlite.prepare('SELECT COUNT(*) as count FROM products WHERE isActive = 1').get().count;
    const categoryCount = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const warehouseCount = sqlite.prepare('SELECT COUNT(*) as count FROM warehouses WHERE isActive = 1').get().count;
    const inDocCount = sqlite.prepare("SELECT COUNT(*) as count FROM inventory_documents WHERE type = 'IN'").get().count;
    const outDocCount = sqlite.prepare("SELECT COUNT(*) as count FROM inventory_documents WHERE type = 'OUT'").get().count;

    // Low stock products
    const lowStock = sqlite.prepare(`
      SELECT p.id, p.code, p.name, p.minStock, u.name as unitName,
        COALESCE(SUM(
          CASE WHEN d.type = 'IN' THEN di.quantity
               WHEN d.type = 'OUT' THEN -di.quantity
               WHEN d.type = 'ADJUSTMENT' THEN di.quantity
               ELSE 0 END
        ), 0) as currentStock
      FROM products p
      LEFT JOIN units u ON u.id = p.unitId
      LEFT JOIN inventory_document_items di ON di.productId = p.id
      LEFT JOIN inventory_documents d ON d.id = di.documentId
      WHERE p.isActive = 1
      GROUP BY p.id
      HAVING currentStock <= p.minStock
      ORDER BY currentStock ASC
      LIMIT 10
    `).all();

    // Recent movements
    const recentMovements = sqlite.prepare(`
      SELECT d.documentNumber, d.type, d.date, d.description,
        u.name as creatorName
      FROM inventory_documents d
      LEFT JOIN user u ON u.id = d.createdBy
      ORDER BY d.id DESC
      LIMIT 10
    `).all();

    return successResponse(res, {
      productCount,
      categoryCount,
      warehouseCount,
      inDocCount,
      outDocCount,
      lowStock,
      recentMovements,
    });
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت اطلاعات داشبورد', 500);
  }
});

// Reports
router.get('/api/reports/stock', requireAuth, (req, res) => {
  try {
    const { warehouseId, lowStockOnly } = req.query;
    let query = `
      SELECT p.id, p.code, p.name, p.minStock,
        c.name as categoryName, u.name as unitName,
        w.name as warehouseName, w.id as warehouseId,
        COALESCE(SUM(
          CASE WHEN d.type = 'IN' THEN di.quantity
               WHEN d.type = 'OUT' THEN -di.quantity
               WHEN d.type = 'ADJUSTMENT' THEN di.quantity
               ELSE 0 END
        ), 0) as currentStock
      FROM products p
      LEFT JOIN categories c ON c.id = p.categoryId
      LEFT JOIN units u ON u.id = p.unitId
      CROSS JOIN warehouses w
      LEFT JOIN inventory_document_items di ON di.productId = p.id
      LEFT JOIN inventory_documents d ON d.id = di.documentId AND d.warehouseId = w.id
      WHERE p.isActive = 1 AND w.isActive = 1
    `;
    const params = [];
    if (warehouseId) { query += ' AND w.id = ?'; params.push(warehouseId); }
    query += ' GROUP BY p.id, w.id';
    if (lowStockOnly === 'true') { query += ' HAVING currentStock <= p.minStock'; }
    query += ' ORDER BY p.name';

    const items = sqlite.prepare(query).all(...params);
    return successResponse(res, items);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت گزارش', 500);
  }
});

router.get('/api/reports/movements', requireAuth, (req, res) => {
  try {
    const { type, warehouseId, productId, fromDate, toDate } = req.query;
    let query = `
      SELECT d.id, d.documentNumber, d.type, d.date, d.description,
        w.name as warehouseName, u.name as creatorName,
        di.quantity, di.unitPrice,
        p.name as productName, p.code as productCode
      FROM inventory_documents d
      JOIN inventory_document_items di ON di.documentId = d.id
      LEFT JOIN products p ON p.id = di.productId
      LEFT JOIN warehouses w ON w.id = d.warehouseId
      LEFT JOIN user u ON u.id = d.createdBy
      WHERE 1=1
    `;
    const params = [];
    if (type) { query += ' AND d.type = ?'; params.push(type); }
    if (warehouseId) { query += ' AND d.warehouseId = ?'; params.push(warehouseId); }
    if (productId) { query += ' AND di.productId = ?'; params.push(productId); }
    if (fromDate) { query += ' AND d.date >= ?'; params.push(fromDate); }
    if (toDate) { query += ' AND d.date <= ?'; params.push(toDate); }
    query += ' ORDER BY d.date DESC, d.id DESC';

    const items = sqlite.prepare(query).all(...params);
    return successResponse(res, items);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت گزارش', 500);
  }
});

export default router;
