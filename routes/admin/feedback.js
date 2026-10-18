import { Router } from 'express';
import { readRecentFeedback } from '../../feedbackLog.js';
import chatLogger from '../../logger.js';

export function createAdminFeedbackRouter() {
  const router = Router();

  // GET /api/admin/feedback
  router.get('/feedback', async (request, response) => {
    try {
      const feedback = await readRecentFeedback();
      response.json({ feedback });
    } catch (error) {
      chatLogger.connectionError('admin-feedback', error);
      response.status(500).json({ error: 'Không thể tải góp ý lúc này.' });
    }
  });

  return router;
}

export default createAdminFeedbackRouter;
