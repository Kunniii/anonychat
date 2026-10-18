import { Router } from 'express';

export const MAX_ADMIN_ANNOUNCEMENT_LENGTH = 1000;

export function createAnnouncementsRouter({ broadcastAnnouncement }) {
  const router = Router();

  // POST /api/admin/announcements
  router.post('/announcements', (request, response) => {
    const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';
    if (!message || message.length > MAX_ADMIN_ANNOUNCEMENT_LENGTH) {
      response.status(400).json({
        error: `Thông báo phải dài từ 1 đến ${MAX_ADMIN_ANNOUNCEMENT_LENGTH} ký tự.`
      });
      return;
    }

    const recipientCount = typeof broadcastAnnouncement === 'function'
      ? broadcastAnnouncement(message)
      : 0;

    response.json({ recipientCount });
  });

  return router;
}

export default createAnnouncementsRouter;
