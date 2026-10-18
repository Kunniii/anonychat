import { Router } from 'express';
import {
  isAdminPasswordValid,
  createAdminSession,
  revokeAdminSession,
  requireAdminAuth
} from '../../middlewares/adminAuth.js';

export function createAdminAuthRouter() {
  const router = Router();

  // POST /api/admin/login
  router.post('/login', (request, response) => {
    if (!process.env.ADMIN_PASSWORD) {
      response.status(503).json({ error: 'Trang admin chưa được cấu hình trên server.' });
      return;
    }
    if (typeof request.body?.password !== 'string' || !isAdminPasswordValid(request.body.password)) {
      response.status(401).json({ error: 'Mật khẩu admin không đúng.' });
      return;
    }

    const { token, expiresInSeconds } = createAdminSession();
    response.json({ token, expiresInSeconds });
  });

  // DELETE /api/admin/session (Logout)
  router.delete('/session', requireAdminAuth, (request, response) => {
    revokeAdminSession(request.adminToken);
    response.status(204).end();
  });

  return router;
}

export default createAdminAuthRouter;
