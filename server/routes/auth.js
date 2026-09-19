import { Router } from 'express';
import { auth } from '../auth.js';
import { successResponse, errorResponse, requireAuth } from '../middleware.js';

const router = Router();

// Better Auth handler - handles all /api/auth/* routes
router.all('/api/auth/*', (req, res) => {
  auth.handler(req, res);
});

// Get current session
router.get('/api/session', requireAuth, (req, res) => {
  return successResponse(res, {
    user: req.user,
    session: req.session,
  });
});

// Logout
router.post('/api/auth/sign-out', (req, res) => {
  auth.handler(req, res);
});

export default router;
