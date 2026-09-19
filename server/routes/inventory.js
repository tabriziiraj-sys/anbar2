import { Router } from 'express';
import { successResponse, errorResponse, requireAuth, calculateStock } from '../middleware.js';
import { sqlite } from '../db.js';
import { DOCUMENT_TYPES } from '../config.js';

const router = Router();

// Generate next document number
function getNextDocNumber(type) {
  const prefix = type === 'IN' ? 'IN' : type === 'OUT' ? 'OUT' : 'ADJ';
  const last = sqlite.prepare(`
    SELECT documentNumber FROM inventory_documents 
    WHERE type = ? ORDER BY id DESC LIMIT 1
  `).get(type);

  if (!last) return `${prefix}-1001`;
  const num = parseInt(last.documentNumber.split('-')[1]) + 1;
  return `${prefix}-${num}`;
}

// List documents
router.get('/api/inventory/documents', requireAuth, (req, res) => {
  try {
    const { type, warehouseId, fromDate, toDate } = req.query;
    let query = `
      SELECT d.*, w.name as warehouseName, u.name as creatorName
      FROM inventory_documents d
      LEFT JOIN warehouses w ON w.id = d.warehouseId
      LEFT JOIN user u ON u.id = d.createdBy
      WHERE 1=1
    `;
    const params = [];

    if (type) { query += ' AND d.type = ?'; params.push(type); }
    if (warehouseId) { query += ' AND d.warehouseId = ?'; params.push(warehouseId); }
    if (fromDate) { query += ' AND d.date >= ?'; params.push(fromDate); }
    if (toDate) { query += ' AND d.date <= ?'; params.push(toDate); }

    query += ' ORDER BY d.id DESC';
    const docs = sqlite.prepare(query).all(...params);

    // Get items for each document
    for (const doc of docs) {
      doc.items = sqlite.prepare(`
        SELECT di.*, p.name as productName, p.code as productCode
        FROM inventory_document_items di
        LEFT JOIN products p ON p.id = di.productId
        WHERE di.documentId = ?
      `).all(doc.id);
    }

    return successResponse(res, docs);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت اسناد', 500);
  }
});

// Get single document
router.get('/api/inventory/documents/:id', requireAuth, (req, res) => {
  try {
    const doc = sqlite.prepare(`
      SELECT d.*, w.name as warehouseName, u.name as creatorName
      FROM inventory_documents d
      LEFT JOIN warehouses w ON w.id = d.warehouseId
      LEFT JOIN user u ON u.id = d.createdBy
      WHERE d.id = ?
    `).get(req.params.id);

    if (!doc) return errorResponse(res, 'سند یافت نشد', 404);

    doc.items = sqlite.prepare(`
      SELECT di.*, p.name as productName, p.code as productCode
      FROM inventory_document_items di
      LEFT JOIN products p ON p.id = di.productId
      WHERE di.documentId = ?
    `).all(doc.id);

    return successResponse(res, doc);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت سند', 500);
  }
});

// Create document (IN/OUT/ADJUSTMENT) - uses transaction
router.post('/api/inventory/documents', requireAuth, (req, res) => {
  try {
    const { type, date, warehouseId, description, items } = req.body;

    if (!type || !date || !warehouseId || !items || items.length === 0) {
      return errorResponse(res, 'نوع سند، تاریخ، انبار و اقلام الزامی است');
    }

    if (!Object.values(DOCUMENT_TYPES).includes(type)) {
      return errorResponse(res, 'نوع سند نامعتبر است');
    }

    // For OUT documents, check stock availability
    if (type === DOCUMENT_TYPES.OUT) {
      for (const item of items) {
        const currentStock = calculateStock(item.productId, warehouseId);
        if (currentStock < item.quantity) {
          const product = sqlite.prepare('SELECT name FROM products WHERE id = ?').get(item.productId);
          return errorResponse(res, `موجودی "${product?.name || 'کالا'}" کافی نیست. موجودی فعلی: ${currentStock}`);
        }
      }
    }

    // Use transaction for atomic operation
    const createDoc = sqlite.transaction(() => {
      const docNumber = getNextDocNumber(type);
      const now = new Date().toISOString();

      const docResult = sqlite.prepare(`
        INSERT INTO inventory_documents (documentNumber, type, date, warehouseId, description, createdBy, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(docNumber, type, date, warehouseId, description || null, req.user.id, now);

      const docId = docResult.lastInsertRowid;

      const insertItem = sqlite.prepare(`
        INSERT INTO inventory_document_items (documentId, productId, quantity, unitPrice)
        VALUES (?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(docId, item.productId, item.quantity, item.unitPrice || null);
      }

      return docId;
    });

    const docId = createDoc();
    const doc = sqlite.prepare('SELECT * FROM inventory_documents WHERE id = ?').get(docId);
    doc.items = sqlite.prepare(`
      SELECT di.*, p.name as productName, p.code as productCode
      FROM inventory_document_items di
      LEFT JOIN products p ON p.id = di.productId
      WHERE di.documentId = ?
    `).all(docId);

    return successResponse(res, doc, 'سند با موفقیت ثبت شد');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در ثبت سند', 500);
  }
});

// Delete document
router.delete('/api/inventory/documents/:id', requireAuth, (req, res) => {
  try {
    // Transaction to delete document and items atomically
    const deleteDoc = sqlite.transaction(() => {
      sqlite.prepare('DELETE FROM inventory_document_items WHERE documentId = ?').run(req.params.id);
      sqlite.prepare('DELETE FROM inventory_documents WHERE id = ?').run(req.params.id);
    });
    deleteDoc();
    return successResponse(res, null, 'سند حذف شد');
  } catch (err) {
    return errorResponse(res, 'خطا در حذف سند', 500);
  }
});

// Get stock for all products in a warehouse
router.get('/api/inventory/stock', requireAuth, (req, res) => {
  try {
    const { warehouseId, search } = req.query;
    const whId = warehouseId || 1; // Default to first warehouse

    let query = `
      SELECT 
        p.id, p.code, p.name, p.minStock, p.isActive,
        c.name as categoryName,
        u.name as unitName,
        w.name as warehouseName,
        w.id as warehouseId,
        COALESCE(SUM(
          CASE WHEN d.type = 'IN' THEN di.quantity
               WHEN d.type = 'OUT' THEN -di.quantity
               WHEN d.type = 'ADJUSTMENT' THEN di.quantity
               ELSE 0
          END
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

    if (warehouseId) {
      query += ' AND w.id = ?';
      params.push(warehouseId);
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY p.id, w.id ORDER BY p.name';

    const stock = sqlite.prepare(query).all(...params);

    // Add status
    for (const item of stock) {
      item.status = item.currentStock <= item.minStock ? 'low' : 'ok';
    }

    return successResponse(res, stock);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت موجودی', 500);
  }
});

// Product ledger (گردش کالا)
router.get('/api/inventory/ledger/:productId', requireAuth, (req, res) => {
  try {
    const { productId } = req.params;
    const { warehouseId } = req.query;

    let query = `
      SELECT 
        d.date, d.documentNumber, d.type, d.description as docDescription,
        di.quantity, di.unitPrice,
        u.name as creatorName,
        w.name as warehouseName
      FROM inventory_document_items di
      JOIN inventory_documents d ON d.id = di.documentId
      LEFT JOIN user u ON u.id = d.createdBy
      LEFT JOIN warehouses w ON w.id = d.warehouseId
      WHERE di.productId = ?
    `;
    const params = [productId];

    if (warehouseId) {
      query += ' AND d.warehouseId = ?';
      params.push(warehouseId);
    }

    query += ' ORDER BY d.date ASC, d.id ASC';

    const movements = sqlite.prepare(query).all(...params);

    // Calculate running balance
    let balance = 0;
    const ledger = movements.map(m => {
      if (m.type === 'IN') balance += m.quantity;
      else if (m.type === 'OUT') balance -= m.quantity;
      else if (m.type === 'ADJUSTMENT') balance += m.quantity;

      return {
        ...m,
        inQty: m.type === 'IN' ? m.quantity : 0,
        outQty: m.type === 'OUT' ? m.quantity : 0,
        adjQty: m.type === 'ADJUSTMENT' ? m.quantity : 0,
        balance: balance,
      };
    });

    return successResponse(res, ledger);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت گردش کالا', 500);
  }
});

export default router;
