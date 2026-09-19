import { Router } from 'express';
import { auth } from '../auth.js';
import { successResponse, errorResponse, requireAuth, requireAdmin } from '../middleware.js';
import { sqlite } from '../db.js';

const router = Router();

// List users (admin only)
router.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = sqlite.prepare(`
      SELECT id, name, email, role, banned, "banReason", "banExpires", createdAt, updatedAt
      FROM user ORDER BY createdAt DESC
    `).all();
    return successResponse(res, users);
  } catch (err) {
    return errorResponse(res, 'خطا در دریافت لیست کاربران', 500);
  }
});

// Create user (admin only) - uses Better Auth API
router.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return errorResponse(res, 'نام، ایمیل و رمز عبور الزامی است');
    }

    const result = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: role || 'user',
      },
      headers: req.headers,
    });

    return successResponse(res, result, 'کاربر با موفقیت ایجاد شد');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در ایجاد کاربر', 400);
  }
});

// Update user (admin only)
router.put('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    await auth.api.adminUpdateUser({
      body: {
        userId: id,
        data: { name, email, role },
      },
      headers: req.headers,
    });

    return successResponse(res, null, 'کاربر با موفقیت ویرایش شد');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در ویرایش کاربر', 400);
  }
});

// Set user role (admin only)
router.post('/api/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    await auth.api.setRole({
      body: { userId: id, role },
      headers: req.headers,
    });

    return successResponse(res, null, 'نقش کاربر تغییر یافت');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در تغییر نقش', 400);
  }
});

// Set user password (admin only)
router.post('/api/users/:id/password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    await auth.api.setUserPassword({
      body: { userId: id, newPassword },
      headers: req.headers,
    });

    return successResponse(res, null, 'رمز عبور تغییر یافت');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در تغییر رمز', 400);
  }
});

// Ban user (admin only)
router.post('/api/users/:id/ban', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { banReason } = req.body;

    await auth.api.banUser({
      body: { userId: id, banReason: banReason || 'توسط مدیر' },
      headers: req.headers,
    });

    return successResponse(res, null, 'کاربر مسدود شد');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در مسدودسازی', 400);
  }
});

// Unban user (admin only)
router.post('/api/users/:id/unban', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await auth.api.unbanUser({
      body: { userId: id },
      headers: req.headers,
    });

    return successResponse(res, null, 'کاربر از حالت مسدود خارج شد');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در رفع مسدودیت', 400);
  }
});

// List user sessions (admin only)
router.get('/api/users/:id/sessions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await auth.api.listUserSessions({
      body: { userId: id },
      headers: req.headers,
    });
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در دریافت جلسات', 400);
  }
});

// Revoke all user sessions (admin only)
router.post('/api/users/:id/revoke-sessions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await auth.api.revokeUserSessions({
      body: { userId: id },
      headers: req.headers,
    });
    return successResponse(res, null, 'تمام جلسات کاربر لغو شد');
  } catch (err) {
    return errorResponse(res, err.message || 'خطا در لغو جلسات', 400);
  }
});

export default router;
