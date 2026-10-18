import { Router } from 'express';

export function createAdminStatsRouter({ getStats }) {
  const router = Router();

  // GET /api/admin/stats
  router.get('/stats', (request, response) => {
    const stats = typeof getStats === 'function'
      ? getStats()
      : { onlineCount: 0, waitingUsers: 0, activePairs: 0 };

    response.json(stats);
  });

  return router;
}

export default createAdminStatsRouter;
