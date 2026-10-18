import { Router } from 'express';
import { noCacheMiddleware } from '../../middlewares/noCache.js';
import { requireAdminAuth } from '../../middlewares/adminAuth.js';
import { createAdminAuthRouter } from './auth.js';
import { createAnnouncementsRouter } from './announcements.js';
import { createAdminFeedbackRouter } from './feedback.js';
import { createAdminStatsRouter } from './stats.js';
import { createAdminReportsRouter } from './reports.js';
import { createAdminBlockListRouter } from './blockList.js';
import { createAdminBansRouter } from './bans.js';

/**
 * Creates and configures the /api/admin router.
 *
 * @param {Object} services
 * @param {function} [services.broadcastAnnouncement]
 * @param {function} [services.getStats]
 * @param {function} [services.broadcastBlockList]
 * @param {function} [services.disconnectBannedUser]
 */
export function createAdminRouter({
  broadcastAnnouncement,
  getStats,
  broadcastBlockList,
  disconnectBannedUser
} = {}) {
  const router = Router();

  // Enforce no-cache header on all /api/admin requests
  router.use(noCacheMiddleware);

  // Auth routes: /login (public with password), /session (protected logout)
  router.use(createAdminAuthRouter());

  // Protected administration routes
  router.use(requireAdminAuth);
  router.use(createAnnouncementsRouter({ broadcastAnnouncement }));
  router.use(createAdminFeedbackRouter());
  router.use(createAdminStatsRouter({ getStats }));
  router.use(createAdminReportsRouter({ broadcastBlockList }));
  router.use(createAdminBlockListRouter({ broadcastBlockList }));
  router.use(createAdminBansRouter({ disconnectBannedUser }));

  return router;
}

export default createAdminRouter;
