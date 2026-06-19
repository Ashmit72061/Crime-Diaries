import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { connectEventBus } from './src/events/eventBus.js';
import { logger } from './src/utils/logger.js';
import app from './src/app.js';
import { createServer } from 'http';

const httpServer = createServer(app);

const start = async () => {
  try {
    // 1. Connect to PostgreSQL
    await connectDB();

    // 2. Connect to RabbitMQ Event Bus
    await connectEventBus();

    // 2.5 Init notification subscriptions
    const { initSubscriptions } = await import('./src/modules/notifications/notifications.service.js');
    await initSubscriptions();

    // 3. Start Express server
    httpServer.on('error', (e) => { console.error('SERVER ERROR:', e); process.exit(1); });
    httpServer.listen(env.PORT, () => {
      logger.info('===================================================');
      logger.info(`  🚀 PHAROS API Server is ONLINE`);
      logger.info(`  🌐 URL:  http://localhost:${env.PORT}`);
      logger.info(`  🔧 Mode: ${env.NODE_ENV}`);
      logger.info('===================================================');
    });
  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
};

start();
