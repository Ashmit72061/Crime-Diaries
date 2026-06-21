import pg from 'pg';
import knex from 'knex';
import knexConfig from '../../knexfile.js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Return DATE columns as YYYY-MM-DD strings instead of JavaScript Date objects.
// Without this, node-postgres wraps dates in Date(), which JSON.stringify serialises
// as ISO-8601 timestamps (e.g. "2026-06-19T18:30:00.000Z" for a 2026-06-20 date in IST).
pg.types.setTypeParser(1082, val => val);

const environment = env.NODE_ENV || 'development';
const config = knexConfig[environment];

export const db = knex(config);

export const connectDB = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ PostgreSQL connected');
  } catch (err) {
    logger.error(`PostgreSQL connection error: ${err.message}`);
    process.exit(1);
  }
};

const shutdownDB = async (signal) => {
  logger.info(`${signal} received. Closing PostgreSQL connection...`);
  await db.destroy();
  logger.info('PostgreSQL connection closed.');
  process.exit(0);
};

process.on('SIGINT', () => shutdownDB('SIGINT'));
process.on('SIGTERM', () => shutdownDB('SIGTERM'));

export default db;
