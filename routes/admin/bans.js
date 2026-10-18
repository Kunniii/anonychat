import { Router } from 'express';
import {
  saveBannedUser,
  deleteBannedUser,
  loadActiveBannedUsers,
  getBannedUser
} from '../../sessionStore.js';
import chatLogger from '../../logger.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Creates the /api/admin/bans router for managing banned client UUIDs.
 *
 * @param {Object} [options]
 * @param {function} [options.disconnectBannedUser] Callback to disconnect and notify banned user in real-time
 */
export function createAdminBansRouter({ disconnectBannedUser } = {}) {
  const router = Router();

  // GET /api/admin/bans - List all unexpired banned users
  router.get('/bans', (request, response) => {
    try {
      const bans = loadActiveBannedUsers();
      response.json({ bans });
    } catch (error) {
      chatLogger.connectionError('admin-bans-list', error);
      response.status(500).json({ error: 'Không thể tải danh sách tài khoản bị khóa.' });
    }
  });

  // POST /api/admin/bans - Ban a client UUID
  router.post('/bans', (request, response) => {
    const clientId = typeof request.body?.clientId === 'string' ? request.body.clientId.trim() : '';
    const reason = typeof request.body?.reason === 'string' && request.body.reason.trim()
      ? request.body.reason.trim().slice(0, 300)
      : 'Vi phạm tiêu chuẩn cộng đồng';
    const rawMinutes = Number(request.body?.durationMinutes);
    const durationMinutes = Number.isFinite(rawMinutes) && rawMinutes > 0
      ? rawMinutes
      : 60; // Default 1 hour if unspecified

    if (!clientId || !UUID_REGEX.test(clientId)) {
      response.status(400).json({ error: 'Mã định danh Client UUID không hợp lệ.' });
      return;
    }

    const bannedAt = Date.now();
    const expiresAt = bannedAt + Math.round(durationMinutes * 60 * 1000);

    const banInfo = {
      clientId,
      reason,
      bannedAt,
      expiresAt,
      bannedBy: 'admin'
    };

    try {
      saveBannedUser(banInfo);

      // Trigger instant real-time disconnection and client notification if user is online
      if (typeof disconnectBannedUser === 'function') {
        disconnectBannedUser(clientId, banInfo);
      }

      response.status(201).json({ ok: true, ban: banInfo });
    } catch (error) {
      chatLogger.connectionError('admin-bans-save', error);
      response.status(500).json({ error: 'Lỗi khi lưu lệnh khóa tài khoản.' });
    }
  });

  // DELETE /api/admin/bans/:clientId - Unban a client UUID
  router.delete('/bans/:clientId', (request, response) => {
    const clientId = request.params.clientId?.trim();
    if (!clientId || !UUID_REGEX.test(clientId)) {
      response.status(400).json({ error: 'Mã định danh Client UUID không hợp lệ.' });
      return;
    }

    try {
      deleteBannedUser(clientId);
      response.json({ ok: true, unbannedClientId: clientId });
    } catch (error) {
      chatLogger.connectionError('admin-bans-delete', error);
      response.status(500).json({ error: 'Lỗi khi gỡ khóa tài khoản.' });
    }
  });

  return router;
}

export default createAdminBansRouter;
