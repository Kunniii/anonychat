/**
 * Factory for creating lightweight in-memory IP cooldown rate limiters.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Minimum interval required between requests from the same IP (in ms)
 * @param {string} [options.errorMessage] - Custom error message for HTTP 429 response
 * @param {function} [options.keyGenerator] - Optional custom key generator (defaults to request IP)
 */
export function createRateLimiter({
  windowMs = 30 * 1000,
  errorMessage = 'Bạn thao tác quá nhanh. Vui lòng chờ một chút.',
  keyGenerator
} = {}) {
  const cooldowns = new Map();

  return function rateLimiterMiddleware(request, response, next) {
    const key = typeof keyGenerator === 'function'
      ? keyGenerator(request)
      : (request.ip || request.socket?.remoteAddress || 'unknown');

    const now = Date.now();
    const lastAt = cooldowns.get(key) ?? 0;

    if (now - lastAt < windowMs) {
      response.status(429).json({ error: errorMessage });
      return;
    }

    cooldowns.set(key, now);

    // Periodically clean stale records to prevent memory leak
    if (cooldowns.size > 5000) {
      for (const [k, timestamp] of cooldowns) {
        if (now - timestamp > windowMs * 2) {
          cooldowns.delete(k);
        }
      }
    }

    next();
  };
}

export default createRateLimiter;
