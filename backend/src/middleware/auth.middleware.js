import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { roleRateLimitMiddleware } from './security.middleware.js';

const isKeycloakEnabled = !!process.env.KEYCLOAK_URL;

let keycloak = null;
if (isKeycloakEnabled) {
  try {
    const { default: KeycloakConnect } = await import('keycloak-connect');
    keycloak = new KeycloakConnect({}, {
      realm: 'pharos',
      'auth-server-url': process.env.KEYCLOAK_URL,
      resource: 'pharos-api',
      'bearer-only': true
    });
  } catch (err) {
    logger.warn('[Auth] Failed to initialize keycloak-connect, falling back to JWT.', err.message);
  }
}

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required: Bearer token is missing'
    });
  }

  const token = authHeader.split(' ')[1];

  const proceed = () => {
    roleRateLimitMiddleware(req, res, next);
  };

  // 1. Try local custom JWT verification first (fallback/test suite compatibility)
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return proceed();
  } catch (error) {
    // 2. Custom JWT failed, try Keycloak if enabled
    if (isKeycloakEnabled && keycloak) {
      keycloak.grantManager.validateAccessToken(token)
        .then(userToken => {
          if (userToken) {
            const content = userToken.content;
            req.user = {
              userId: content.sub,
              id: content.sub,
              badgeNo: content.preferred_username || content.badgeNo || content.badge_no || '',
              badge_no: content.preferred_username || content.badgeNo || content.badge_no || '',
              role: content.role || (content.realm_access?.roles?.find(r => ['HC','SHO','DISTRICT_OFFICER','HQ_ANALYST','HQ_ADMIN','SYSTEM_ADMIN','JCP','SCP'].includes(r))) || 'HC',
              psId: content.psId || content.ps_id || null,
              ps_id: content.psId || content.ps_id || null,
              districtId: content.districtId || content.district_id || null,
              district_id: content.districtId || content.district_id || null,
              level: content.level || 'PS'
            };
            return proceed();
          } else {
            return res.status(401).json({
              status: 'error',
              success: false,
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired Keycloak token'
            });
          }
        })
        .catch(err => {
          return res.status(401).json({
            status: 'error',
            success: false,
            code: 'UNAUTHORIZED',
            message: 'Authentication token verification failed: ' + err.message
          });
        });
    } else {
      return res.status(401).json({
        status: 'error',
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token'
      });
    }
  }
};

export const requireAuth = () => authMiddleware;

/**
 * Lightweight JWT verifier for SSE connections.
 * EventSource cannot set custom headers, so the client passes
 * the access token as ?token= in the query string.
 */
export const sseAuthMiddleware = (req, res, next) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({
      status: 'error',
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required: token query param is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired SSE token'
    });
  }
};
