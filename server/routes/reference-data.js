import { Router } from 'express';
import { successResponse, errorResponse, requireAuth } from '../middleware.js';
import { sqlite } from '../db.js';

const router = Router();

// ============ CATEGORIES ============
router.get('/api/categories', requireAuth, (req, res) => {
  try {
    const items = sqlite.prepare('SELECT * FROM categories ORDER BY name').all();
    return successResponse(res, items);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت دسته‌بندی‌ها', 500);
  }
});

router.post('/api/categories', requireAuth, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return errorResponse(res, 'نام دسته‌بندی الزامی است');
    const now = new Date().toISOString();
    const result = sqlite.prepare('INSERT INTO categories (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)').run(name, description || null, now, now);
    const item = sqlite.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    return successResponse(res, item, 'دسته‌بندی ایجاد شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return errorResponse(res, 'نام دسته‌بندی تکراری است');
    return errorResponse(res, 'خطا در ایجاد دسته‌بندی', 500);
  }
});

router.put('/api/categories/:id', requireAuth, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return errorResponse(res, 'نام دسته‌بندی الزامی است');
    const now = new Date().toISOString();
    sqlite.prepare('UPDATE categories SET name=?, description=?, updatedAt=? WHERE id=?').run(name, description || null, now, req.params.id);
    const item = sqlite.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    return successResponse(res, item, 'دسته‌بندی ویرایش شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return errorResponse(res, 'نام دسته‌بندی تکراری است');
    return errorResponse(res, 'خطا در ویرایش دسته‌بندی', 500);
  }
});

router.delete('/api/categories/:id', requireAuth, (req, res) => {
  try {
    const used = sqlite.prepare('SELECT COUNT(*) as count FROM products WHERE categoryId = ?').get(req.params.id);
    if (used.count > 0) return errorResponse(res, 'این دسته‌بندی دارای کالا است و قابل حذف نیست');
    sqlite.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    return successResponse(res, null, 'دسته‌بندی حذف شد');
  } catch (err) {
    return errorResponse(res, 'خطا در حذف دسته‌بندی', 500);
  }
});

// ============ UNITS ============
router.get('/api/units', requireAuth, (req, res) => {
  try {
    const items = sqlite.prepare('SELECT * FROM units ORDER BY name').all();
    return successResponse(res, items);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت واحدها', 500);
  }
});

router.post('/api/units', requireAuth, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return errorResponse(res, 'نام واحد الزامی است');
    const now = new Date().toISOString();
    const result = sqlite.prepare('INSERT INTO units (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)').run(name, description || null, now, now);
    const item = sqlite.prepare('SELECT * FROM units WHERE id = ?').get(result.lastInsertRowid);
    return successResponse(res, item, 'واحد ایجاد شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return errorResponse(res, 'نام واحد تکراری است');
    return errorResponse(res, 'خطا در ایجاد واحد', 500);
  }
});

router.put('/api/units/:id', requireAuth, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return errorResponse(res, 'نام واحد الزامی است');
    const now = new Date().toISOString();
    sqlite.prepare('UPDATE units SET name=?, description=?, updatedAt=? WHERE id=?').run(name, description || null, now, req.params.id);
    const item = sqlite.prepare('SELECT * FROM units WHERE id = ?').get(req.params.id);
    return successResponse(res, item, 'واحد ویرایش شد');
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return errorResponse(res, 'نام واحد تکراری است');
    return errorResponse(res, 'خطا در ویرایش واحد', 500);
  }
});

router.delete('/api/units/:id', requireAuth, (req, res) => {
  try {
    const used = sqlite.prepare('SELECT COUNT(*) as count FROM products WHERE unitId = ?').get(req.params.id);
    if (used.count > 0) return errorResponse(res, 'این واحد دارای کالا است و قابل حذف نیست');
    sqlite.prepare('DELETE FROM units WHERE id = ?').run(req.params.id);
    return successResponse(res, null, 'واحد حذف شد');
  } catch (err) {
    return errorResponse(res, 'خطا در حذف واحد', 500);
  }
});

export default router;
