import { auth } from './auth.js';
import { ROLES } from './config.js';
import { sqlite } from './db.js';

// Response helpers - SSOT for API response format
export function successResponse(res, data, message = 'عملیات با موفقیت انجام شد') {
  return res.json({ success: true, message, data });
}

export function errorResponse(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

// Auth middleware - checks session via Better Auth
export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return errorResponse(res, 'لطفاً وارد شوید', 401);
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (err) {
    return errorResponse(res, 'خطا در احراز هویت', 401);
  }
}

// Admin authorization middleware
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return errorResponse(res, 'دسترسی غیرمجاز', 403);
  }
  next();
}

// Global error handler
export function errorHandler(err, req, res, next) {
  console.error('Server Error:', err.message);
  const message = process.env.NODE_ENV === 'production'
    ? 'خطای داخلی سرور'
    : err.message;
  return res.status(500).json({ success: false, message });
}

// Number formatting utility
export function formatNumber(num) {
  if (num === null || num === undefined) return '۰';
  return new Intl.NumberFormat('fa-IR').format(num);
}

// Date formatting utility
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// Stock calculation from movements - SSOT
export function calculateStock(productId, warehouseId) {
  const result = sqlite.prepare(`
    SELECT COALESCE(SUM(
      CASE WHEN d.type = 'IN' THEN di.quantity
           WHEN d.type = 'OUT' THEN -di.quantity
           WHEN d.type = 'ADJUSTMENT' THEN di.quantity
           ELSE 0
      END
    ), 0) as stock
    FROM inventory_document_items di
    JOIN inventory_documents d ON d.id = di.documentId
    WHERE di.productId = ? AND d.warehouseId = ?
  `).get(productId, warehouseId);

  return result?.stock || 0;
}
