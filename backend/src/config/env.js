import dotenv from 'dotenv';
dotenv.config();

const _required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const _optional = (key, fallback = '') => process.env[key] ?? fallback;

export const env = {
  NODE_ENV: _optional('NODE_ENV', 'development'),
  PORT: parseInt(_optional('PORT', '3000'), 10),

  // Database
  DATABASE_URL: _required('DATABASE_URL'),

  // JWT
  JWT_ACCESS_SECRET: _required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: _required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES: _optional('JWT_ACCESS_EXPIRES', '1h'),
  JWT_REFRESH_EXPIRES: _optional('JWT_REFRESH_EXPIRES', '7d'),

  // Messaging & Cache
  RABBITMQ_URL: _required('RABBITMQ_URL'),
  REDIS_URL: _required('REDIS_URL'),

  // File Storage
  REPORTS_DIR: _optional('REPORTS_DIR', './generated-reports'),

  // CORS
  FRONTEND_URL: _optional('FRONTEND_URL', 'http://localhost:5173'),

  get isDev() { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production'; },
};
