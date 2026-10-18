import { randomBytes, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const adminSessions = new Map();

/**
 * Validates a plaintext admin password against configured process.env.ADMIN_PASSWORD
 * using constant-time comparison to protect against timing attacks.
 */
export function isAdminPasswordValid(password) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (typeof configuredPassword !== 'string' || !configuredPassword) return false;

  const supplied = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * Creates and stores a new 64-hex-char admin session token.
 */
export function createAdminSession() {
  const now = Date.now();
  // Clean up expired sessions
  for (const [token, expiresAt] of adminSessions) {
    if (expiresAt <= now) adminSessions.delete(token);
  }

  const token = randomBytes(32).toString('hex');
  adminSessions.set(token, now + ADMIN_SESSION_TTL_MS);
  return { token, expiresInSeconds: ADMIN_SESSION_TTL_MS / 1000 };
}

/**
 * Revokes an existing admin session token.
 */
export function revokeAdminSession(token) {
  if (!token) return false;
  return adminSessions.delete(token);
}

/**
 * Extracts and validates bearer session token from request authorization header.
 */
export function getAdminSession(request) {
  const authorization = request.get('authorization') ?? '';
  const match = /^Bearer ([a-f0-9]{64})$/.exec(authorization);
  if (!match) return null;

  const token = match[1];
  const expiresAt = adminSessions.get(token);
  if (!expiresAt) return null;

  if (expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return null;
  }
  return token;
}

/**
 * Express middleware that protects admin routes.
 * Rejects with 401 if session token is missing or expired.
 */
export function requireAdminAuth(request, response, next) {
  const token = getAdminSession(request);
  if (!token) {
    response.status(401).json({ error: 'Phiên admin đã hết hạn. Vui lòng đăng nhập lại.' });
    return;
  }
  request.adminToken = token;
  next();
}

export default {
  isAdminPasswordValid,
  createAdminSession,
  revokeAdminSession,
  getAdminSession,
  requireAdminAuth
};
