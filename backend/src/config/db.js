import knex from 'knex';
<<<<<<< HEAD
import knexConfig from '../../knexfile.js';
import { env } from './env.js';

const environment = env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

export default db;
=======
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: { min: 2, max: 10 }
});

export const connectDB = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('PostgreSQL connected');
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
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856
