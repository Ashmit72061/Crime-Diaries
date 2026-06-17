function isIntranetIp(ip) {
  if (!ip) return false;
  let cleanIp = ip;
  if (ip.startsWith('::ffff:')) {
    cleanIp = ip.substring(7);
  }
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') return true;
  
  if (cleanIp.startsWith('10.')) return true;
  if (cleanIp.startsWith('192.168.')) return true;
  if (cleanIp.startsWith('172.')) {
    const parts = cleanIp.split('.');
    if (parts.length >= 2) {
      const secondPart = parseInt(parts[1], 10);
      if (secondPart >= 16 && secondPart <= 31) return true;
    }
  }
  return false;
}

export const ipAllowlistMiddleware = (req, res, next) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (process.env.NODE_ENV === 'test' || process.env.PHAROS_TEST === 'true') {
    return next();
  }
  
  const enforceIntranet = process.env.ENFORCE_INTRANET === 'true';
  if (enforceIntranet && !isIntranetIp(clientIp)) {
    return res.status(403).json({
      status: 'error',
      success: false,
      code: 'FORBIDDEN',
      message: `Access denied: IP address ${clientIp} is outside the allowed intranet range.`
    });
  }
  next();
};

export const csrfDoubleSubmitMiddleware = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  if (process.env.NODE_ENV === 'test' || process.env.PHAROS_TEST === 'true') {
    return next();
  }

  const csrfTokenCookie = req.cookies ? req.cookies['csrfToken'] : null;
  const csrfTokenHeader = req.headers['x-csrf-token'];

  if (!csrfTokenCookie || !csrfTokenHeader || csrfTokenCookie !== csrfTokenHeader) {
    return res.status(403).json({
      status: 'error',
      success: false,
      code: 'FORBIDDEN',
      message: 'CSRF token mismatch or missing. Double-submit token validation failed.'
    });
  }
  next();
};

const rateLimitStores = {};

export const roleRateLimitMiddleware = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  if (process.env.NODE_ENV === 'test' || process.env.PHAROS_TEST === 'true') {
    return next();
  }

  const userId = req.user.userId || req.user.id;
  const role = req.user.role;
  
  let limit = 100;
  if (role === 'HC') limit = 200;
  else if (role === 'SHO') limit = 150;
  else if (role === 'HQ_ANALYST' || role === 'HQ_ADMIN') limit = 300;
  else if (role === 'SYSTEM_ADMIN') limit = 50;

  const now = Date.now();
  if (!rateLimitStores[userId]) {
    rateLimitStores[userId] = [];
  }

  rateLimitStores[userId] = rateLimitStores[userId].filter(timestamp => now - timestamp < 60000);

  if (rateLimitStores[userId].length >= limit) {
    return res.status(429).json({
      status: 'error',
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests for your role. Please try again later.'
    });
  }

  rateLimitStores[userId].push(now);
  next();
};
