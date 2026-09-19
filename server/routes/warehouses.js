import { Router } from 'express';
import { successResponse, errorResponse, requireAuth } from '../middleware.js';
import { sqlite } from '../db.js';

const router = Router();

router.get('/api/warehouses', requireAuth, (req, res) => {
  try {
    const items = sqlite.prepare('SELECT * FROM warehouses ORDER BY name').all();
    return successResponse(res, items);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت انبارها', 500);
  }
});

router.get('/api/warehouses/:id', requireAuth, (req, res) => {
  try {
    const item = sqlite.prepare('SELECT * FROM warehouses WHERE id = ?').get(req.params.id);
    if (!item) return errorResponse(res, 'انبار یافت نشد', 404);
    return successResponse(res, item);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت انبار', 500);
  }
});

router.post('/api/warehouses', requireAuth, (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    if (!code || !name) return errorResponse(res, 'کد و نام انبار الزامی است');
    const now = new Date().toISOString();
    const result = sqlite.prepare('INSERT INTO warehouses (code, name, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)').run(code, name, description || null, isActive !== false ? 1 : 0, now, now);
    const item = sqlite.prepare('SELECT * FROM warehouses WHERE id = ?').get(result.lastInsertRowid);
    return successResponse(res, item, 'انبار ایجاد شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return errorResponse(res, 'کد انبار تکراری است');
    return errorResponse(res, 'خطا در ایجاد انبار', 500);
  }
});

router.put('/api/warehouses/:id', requireAuth, (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    if (!code || !name) return errorResponse(res, 'کد و نام انبار الزامی است');
    const now = new Date().toISOString();
    sqlite.prepare('UPDATE warehouses SET code=?, name=?, description=?, isActive=?, updatedAt=? WHERE id=?').run(code, name, description || null, isActive !== false ? 1 : 0, now, req.params.id);
    const item = sqlite.prepare('SELECT * FROM warehouses WHERE id = ?').get(req.params.id);
    return successResponse(res, item, 'انبار ویرایش شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return errorResponse(res, 'کد انبار تکراری است');
    return errorResponse(res, 'خطا در ویرایش انبار', 500);
  }
});

router.delete('/api/warehouses/:id', requireAuth, (req, res) => {
  try {
    const used = sqlite.prepare('SELECT COUNT(*) as count FROM inventory_documents WHERE warehouseId = ?').get(req.params.id);
    if (used.count > 0) return errorResponse(res, 'این انبار دارای سند است و قابل حذف نیست');
    sqlite.prepare('DELETE FROM warehouses WHERE id = ?').run(req.params.id);
    return successResponse(res, null, 'انبار حذف شد');
  } catch (err) {
    return errorResponse(res, 'خطا در حذف انبار', 500);
  }
});

export default router;
