import app from './src/app.js';
import { initDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const startServer = async () => {
  try {
    logger.info('Initializing SQLite database schema...');
    await initDB();

    app.listen(env.PORT, () => {
      logger.info(`Delhi Police Portal API running on http://localhost:${env.PORT}/api/v1 [${env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.error(`Failed to start backend server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
