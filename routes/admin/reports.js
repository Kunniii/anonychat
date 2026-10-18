import { Router } from 'express';
import { readRecentReports, resolveReport, addToBlockList } from '../../reportLog.js';
import chatLogger from '../../logger.js';

export function createAdminReportsRouter({ broadcastBlockList }) {
  const router = Router();

  // GET /api/admin/reports
  router.get('/reports', async (request, response) => {
    try {
      const reports = await readRecentReports();
      response.json({ reports });
    } catch (error) {
      chatLogger.connectionError('admin-reports', error);
      response.status(500).json({ error: 'Không thể tải báo cáo.' });
    }
  });

  // POST /api/admin/reports/:id/resolve
  router.post('/reports/:id/resolve', async (request, response) => {
    const reportId = request.params.id;
    const action = typeof request.body?.action === 'string' ? request.body.action : 'resolved';
    const blockWord = typeof request.body?.blockWord === 'string' ? request.body.blockWord.trim() : '';

    try {
      let updatedBlockList = null;
      if (blockWord) {
        updatedBlockList = await addToBlockList(blockWord);
        if (typeof broadcastBlockList === 'function') {
          broadcastBlockList(updatedBlockList);
        }
      }
      const resolution = await resolveReport(reportId, {
        action,
        blockWord: blockWord || undefined
      });
      response.json({ ok: true, resolution, blockList: updatedBlockList });
    } catch (error) {
      chatLogger.connectionError('admin-reports-resolve', error);
      response.status(500).json({ error: 'Không thể xử lý báo cáo.' });
    }
  });

  return router;
}

export default createAdminReportsRouter;
