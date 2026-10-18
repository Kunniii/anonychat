import { Router } from 'express';
import { createHealthRouter } from './health.js';
import { createReportsRouter } from './reports.js';
import { createAdminRouter } from './admin/index.js';

/**
 * Creates and mounts all application routes.
 *
 * @param {Object} context
 * @param {function} context.getIsShuttingDown
 * @param {function} context.broadcastAnnouncement
 * @param {function} context.getStats
 * @param {function} context.broadcastBlockList
 */
export function createAppRouter({
  getIsShuttingDown,
  broadcastAnnouncement,
  getStats,
  broadcastBlockList
} = {}) {
  const router = Router();

  // /healthz
  router.use(createHealthRouter({ getIsShuttingDown }));

  // /api/reports
  router.use(createReportsRouter());

  // /api/admin/*
  router.use('/api/admin', createAdminRouter({
    broadcastAnnouncement,
    getStats,
    broadcastBlockList
  }));

  return router;
}

export default createAppRouter;
