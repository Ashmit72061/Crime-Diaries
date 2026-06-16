import dotenv from 'dotenv';
dotenv.config();

const getEnv = (key, fallback = '') => process.env[key] ?? fallback;

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '5000'), 10),
  JWT_SECRET: getEnv('JWT_SECRET', 'delhi_police_portal_secret_key_long_and_secure'),
  CLIENT_URL: getEnv('CLIENT_URL', 'http://localhost:5173'),
};
