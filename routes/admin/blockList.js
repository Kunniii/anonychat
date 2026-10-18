import { Router } from 'express';
import { readBlockList, addToBlockList, removeFromBlockList } from '../../reportLog.js';
import chatLogger from '../../logger.js';

export function createAdminBlockListRouter({ broadcastBlockList }) {
  const router = Router();

  // GET /api/admin/block-list
  router.get('/block-list', async (request, response) => {
    try {
      const list = await readBlockList();
      response.json({ blockList: list });
    } catch (error) {
      chatLogger.connectionError('admin-block-list', error);
      response.status(500).json({ error: 'Không thể tải danh sách từ chặn.' });
    }
  });

  // POST /api/admin/block-list
  router.post('/block-list', async (request, response) => {
    const word = typeof request.body?.word === 'string' ? request.body.word.trim() : '';
    if (!word || word.length > 100) {
      response.status(400).json({ error: 'Từ không hợp lệ.' });
      return;
    }
    try {
      const updated = await addToBlockList(word);
      if (typeof broadcastBlockList === 'function') {
        broadcastBlockList(updated);
      }
      response.json({ blockList: updated });
    } catch (error) {
      chatLogger.connectionError('admin-block-list-add', error);
      response.status(500).json({ error: 'Không thể thêm từ vào danh sách.' });
    }
  });

  // DELETE /api/admin/block-list/:word
  router.delete('/block-list/:word', async (request, response) => {
    const word = request.params.word?.trim()?.toLowerCase();
    if (!word) {
      response.status(400).json({ error: 'Từ không hợp lệ.' });
      return;
    }
    try {
      const updated = await removeFromBlockList(word);
      if (typeof broadcastBlockList === 'function') {
        broadcastBlockList(updated);
      }
      response.json({ blockList: updated });
    } catch (error) {
      chatLogger.connectionError('admin-block-list-remove', error);
      response.status(500).json({ error: 'Không thể xóa từ khỏi danh sách.' });
    }
  });

  return router;
}

export default createAdminBlockListRouter;
