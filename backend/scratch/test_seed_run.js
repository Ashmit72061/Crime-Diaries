import knex from 'knex';
import config from '../knexfile.js';
import { seed } from '../seeds/seed.js';

const db = knex(config.development);

async function test() {
  console.log('Running test seed...');
  try {
    await seed(db);
    console.log('Seed ran successfully!');
  } catch (error) {
    console.error('Seed failed with error:');
    console.error(error);
    if (error.detail) {
      console.error('Error Details:', error.detail);
    }
  } finally {
    await db.destroy();
  }
}

test();
