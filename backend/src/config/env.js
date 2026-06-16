import dotenv from 'dotenv';
dotenv.config();

<<<<<<< HEAD
const getEnv = (key, fallback = '') => process.env[key] ?? fallback;

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  DATABASE_URL: getEnv('DATABASE_URL', 'postgresql://pharos:pharos@localhost:5432/pharos_db'),
  DB_CLIENT: getEnv('DB_CLIENT', 'sqlite3'),
  RABBITMQ_URL: getEnv('RABBITMQ_URL', 'amqp://pharos:pharos123@localhost:5672'),
  REDIS_URL: getEnv('REDIS_URL', 'redis://localhost:6379'),
  JWT_SECRET: getEnv('JWT_SECRET', 'pharos_jwt_secret_key_extremely_long_and_safe'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', 'pharos_jwt_refresh_secret_key_extremely_long_and_safe'),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  REPORTS_OUTPUT_DIR: getEnv('REPORTS_OUTPUT_DIR', './reports/output'),
=======
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
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856
};
