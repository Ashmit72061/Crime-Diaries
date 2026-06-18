import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbClient = process.env.DB_CLIENT || 'pg';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://pharos:pharos@localhost:5432/pharos_db';

const config = {
  client: dbClient,
  connection: databaseUrl,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds')
  }
};

export default {
  development: config,
  test: {
    ...config,
    connection: databaseUrl
  },
  production: config
};
