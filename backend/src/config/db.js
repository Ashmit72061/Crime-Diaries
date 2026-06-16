import knex from 'knex';
import knexConfig from '../../knexfile.js';
import { env } from './env.js';

const environment = env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

export default db;
