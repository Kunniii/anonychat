import chatLogger from '../logger.js';

/**
 * Centralized Express error-handling middleware.
 */
export function errorHandler(error, request, response, next) {
  chatLogger.connectionError('http-router', error);

  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || error.status || 500;
  const message = statusCode === 500
    ? 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.'
    : error.message;

  response.status(statusCode).json({ error: message });
}

export default errorHandler;
