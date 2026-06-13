import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { logger } from './src/utils/logger.js';
import app from './src/app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

// ── Start Server ───────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
};

start();
