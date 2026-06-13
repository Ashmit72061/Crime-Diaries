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
  PORT: parseInt(_optional('PORT', '5000'), 10),

  // MongoDB
  MONGO_URI: _required('MONGO_URI'),

  // JWT
  JWT_ACCESS_SECRET: _required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: _required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: _optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: _optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: _optional('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: _optional('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: _optional('CLOUDINARY_API_SECRET'),

  // Email (Nodemailer)
  SMTP_HOST: _optional('SMTP_HOST'),
  SMTP_PORT: parseInt(_optional('SMTP_PORT', '587'), 10),
  SMTP_USER: _optional('SMTP_USER'),
  SMTP_PASS: _optional('SMTP_PASS'),
  EMAIL_FROM: _optional('EMAIL_FROM', 'noreply@crimediaries.com'),

  // CORS
  CLIENT_URL: _optional('CLIENT_URL', 'http://localhost:5173'),

  get isDev() { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production'; },
};
