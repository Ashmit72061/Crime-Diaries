export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CASES: '/cases',
  ARRESTS: '/arrests',
  PCR: '/pcr',
  MISSING: '/missing',
  ANALYTICS: '/analytics',
  AUDIT_LOGS: '/audit-logs',
  ADMIN_PANEL: '/admin-panel',
  NOT_FOUND: '*',
};

export const API_BASE = '/api/v1';
export const API_ROUTES = {
  LOGIN: `${API_BASE}/auth/login`,
  LOGOUT: `${API_BASE}/auth/logout`,
  ME: `${API_BASE}/auth/me`,
  CASES: `${API_BASE}/records/cases`,
  ARRESTS: `${API_BASE}/records/arrests`,
  PCR: `${API_BASE}/records/pcr`,
  MISSING: `${API_BASE}/records/missing`,
  ANALYTICS: `${API_BASE}/analytics`,
  AUDIT: `${API_BASE}/audit`,
  ADMIN: `${API_BASE}/admin`,
};
