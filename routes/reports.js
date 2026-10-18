import { Router } from 'express';
import { appendReport } from '../reportLog.js';
import chatLogger from '../logger.js';
import { createRateLimiter } from '../middlewares/rateLimiter.js';

export const MAX_REPORT_MESSAGE_LENGTH = 1000;
export const MAX_REPORT_REASON_LENGTH = 500;
export const REPORT_COOLDOWN_MS = 30 * 1000;

export function createReportsRouter() {
  const router = Router();

  const reportLimiter = createRateLimiter({
    windowMs: REPORT_COOLDOWN_MS,
    errorMessage: 'Bạn vừa gửi báo cáo. Vui lòng chờ một chút.'
  });

  router.post('/api/reports', reportLimiter, async (request, response) => {
    const reportedText = typeof request.body?.reportedText === 'string' ? request.body.reportedText.trim() : '';
    const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim() : '';

    if (!reportedText || reportedText.length > MAX_REPORT_MESSAGE_LENGTH) {
      response.status(400).json({
        error: `Nội dung báo cáo phải dài từ 1 đến ${MAX_REPORT_MESSAGE_LENGTH} ký tự.`
      });
      return;
    }
    if (reason.length > MAX_REPORT_REASON_LENGTH) {
      response.status(400).json({
        error: `Lý do tối đa ${MAX_REPORT_REASON_LENGTH} ký tự.`
      });
      return;
    }

    const now = Date.now();
    try {
      await appendReport({
        id: `rpt_${now}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
        reportedText,
        reason: reason || null,
        resolved: false
      });
      response.status(201).json({ ok: true });
    } catch (error) {
      chatLogger.connectionError('reports', error);
      response.status(500).json({ error: 'Chưa gửi được báo cáo. Bạn thử lại sau nhé.' });
    }
  });

  return router;
}

export default createReportsRouter;
