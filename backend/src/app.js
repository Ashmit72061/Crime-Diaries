import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Request Logging ───────────────────────────────────────────────────────────
app.use(
  morgan(env.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 & Error Handling ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
