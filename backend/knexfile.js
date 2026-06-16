import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbClient = process.env.DB_CLIENT || 'sqlite3'; // 'pg' or 'sqlite3'
const databaseUrl = process.env.DATABASE_URL || 'postgresql://pharos:pharos@localhost:5432/pharos_db';

const config = {
  client: dbClient,
  connection: dbClient === 'sqlite3' ? {
    filename: process.env.SQLITE_DB_PATH || path.resolve(__dirname, 'database.sqlite')
  } : databaseUrl,
  useNullAsDefault: dbClient === 'sqlite3',
  pool: dbClient === 'sqlite3' ? undefined : {
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
    connection: dbClient === 'sqlite3' ? {
      filename: ':memory:'
    } : databaseUrl
  },
  production: config
};
