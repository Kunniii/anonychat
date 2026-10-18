/**
 * Sets no-store Cache-Control header for sensitive admin API responses.
 */
export function noCacheMiddleware(request, response, next) {
  response.set('Cache-Control', 'no-store');
  next();
}

export default noCacheMiddleware;
