import { Router } from 'express';

export function createHealthRouter({ getIsShuttingDown }) {
  const router = Router();

  router.get('/healthz', (request, response) => {
    const shuttingDown = typeof getIsShuttingDown === 'function' ? getIsShuttingDown() : false;
    response
      .status(shuttingDown ? 503 : 200)
      .type('text/plain')
      .send(shuttingDown ? 'shutting down' : 'ok');
  });

  return router;
}

export default createHealthRouter;
