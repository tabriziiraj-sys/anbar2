import { Router } from 'express';
import { successResponse, errorResponse, requireAuth } from '../middleware.js';
import { sqlite } from '../db.js';

const router = Router();

// List products with search and filters
router.get('/api/products', requireAuth, (req, res) => {
  try {
    const { search, categoryId, unitId, isActive } = req.query;
    let query = `
      SELECT p.*, c.name as categoryName, u.name as unitName
      FROM products p
      LEFT JOIN categories c ON c.id = p.categoryId
      LEFT JOIN units u ON u.id = p.unitId
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      query += ' AND p.categoryId = ?';
      params.push(categoryId);
    }
    if (unitId) {
      query += ' AND p.unitId = ?';
      params.push(unitId);
    }
    if (isActive !== undefined) {
      query += ' AND p.isActive = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    query += ' ORDER BY p.id DESC';
    const items = sqlite.prepare(query).all(...params);
    return successResponse(res, items);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت کالاها', 500);
  }
});

// Get single product
router.get('/api/products/:id', requireAuth, (req, res) => {
  try {
    const product = sqlite.prepare(`
      SELECT p.*, c.name as categoryName, u.name as unitName
      FROM products p
      LEFT JOIN categories c ON c.id = p.categoryId
      LEFT JOIN units u ON u.id = p.unitId
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) return errorResponse(res, 'کالا یافت نشد', 404);
    return successResponse(res, product);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت کالا', 500);
  }
});

// Create product
router.post('/api/products', requireAuth, (req, res) => {
  try {
    const { code, name, barcode, categoryId, unitId, minStock, description, isActive } = req.body;
    if (!code || !name) {
      return errorResponse(res, 'کد و نام کالا الزامی است');
    }

    const now = new Date().toISOString();
    const result = sqlite.prepare(`
      INSERT INTO products (code, name, barcode, categoryId, unitId, minStock, description, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, name, barcode || null, categoryId || null, unitId || null, minStock || 0, description || null, isActive !== false ? 1 : 0, now, now);

    const product = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    return successResponse(res, product, 'کالا با موفقیت ایجاد شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return errorResponse(res, 'کد کالا تکراری است');
    }
    return errorResponse(res, 'خطا در ایجاد کالا', 500);
  }
});

// Update product
router.put('/api/products/:id', requireAuth, (req, res) => {
  try {
    const { code, name, barcode, categoryId, unitId, minStock, description, isActive } = req.body;
    if (!code || !name) {
      return errorResponse(res, 'کد و نام کالا الزامی است');
    }

    const now = new Date().toISOString();
    sqlite.prepare(`
      UPDATE products SET code=?, name=?, barcode=?, categoryId=?, unitId=?, minStock=?, description=?, isActive=?, updatedAt=?
      WHERE id=?
    `).run(code, name, barcode || null, categoryId || null, unitId || null, minStock || 0, description || null, isActive !== false ? 1 : 0, now, req.params.id);

    const product = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    return successResponse(res, product, 'کالا با موفقیت ویرایش شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return errorResponse(res, 'کد کالا تکراری است');
    }
    return errorResponse(res, 'خطا در ویرایش کالا', 500);
  }
});

// Delete product
router.delete('/api/products/:id', requireAuth, (req, res) => {
  try {
    const movements = sqlite.prepare('SELECT COUNT(*) as count FROM inventory_document_items WHERE productId = ?').get(req.params.id);
    if (movements.count > 0) {
      return errorResponse(res, 'این کالا دارای گردش انبار است و قابل حذف نیست');
    }
    sqlite.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    return successResponse(res, null, 'کالا حذف شد');
  } catch (err) {
    return errorResponse(res, 'خطا در حذف کالا', 500);
  }
});

export default router;
