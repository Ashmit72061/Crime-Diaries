import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import * as eventBus from './events/eventBus.js';
import * as auditHandler from './events/handlers/auditHandler.js';
import * as notifyHandler from './events/handlers/notifyHandler.js';

// Import routers
import authRouter from './modules/auth/auth.router.js';
import fieldsRouter from './modules/fields/fields.router.js';
import recordsRouter from './modules/records/records.router.js';
import workflowRouter from './modules/workflow/workflow.router.js';
import analyticsRouter from './modules/analytics/analytics.router.js';
import reportsRouter from './modules/reports/reports.router.js';
import usersRouter from './modules/users/users.router.js';
import hierarchyRouter from './modules/hierarchy/hierarchy.router.js';
import adminRouter from './modules/admin/admin.router.js';
import auditRouter from './modules/audit/audit.router.js';

const app = express();

// Base middleware
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limiting
const isDevOrTest = env.NODE_ENV === 'development' || env.NODE_ENV === 'test' || process.env.PHAROS_TEST === 'true';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevOrTest ? 99999 : 100,
  message: { status: 'error', code: 'RATE_LIMITED', message: 'Too many requests' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevOrTest ? 99999 : 50,
  message: { status: 'error', code: 'RATE_LIMITED', message: 'Too many requests' }
});
app.use('/api/', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// Bind API Routes (Dual Registration for compatibility)
app.use('/api/v1/auth', authRouter);
app.use('/api/auth', authRouter);

app.use('/api/v1/fields', fieldsRouter);
app.use('/api/fields', fieldsRouter);

app.use('/api/v1/records', recordsRouter);
app.use('/api/records', recordsRouter);

app.use('/api/v1/workflow', workflowRouter);
app.use('/api/workflow', workflowRouter);

app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/analytics', analyticsRouter);

app.use('/api/v1/reports', reportsRouter);
app.use('/api/reports', reportsRouter);

app.use('/api/v1/admin/users', usersRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/users', usersRouter);

app.use('/api/v1/admin/hierarchy', hierarchyRouter);
app.use('/api/v1/hierarchy', hierarchyRouter);
app.use('/api/hierarchy', hierarchyRouter);

app.use('/api/v1/admin', adminRouter);
app.use('/api/admin', adminRouter);

app.use('/api/v1/audit', auditRouter);
app.use('/api/audit', auditRouter);

// Health check
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({ success: true, message: 'PHAROS Backend Operational API online' });
});
app.get('/api/health', (req, res) => {
  return res.status(200).json({ success: true, message: 'PHAROS Backend Operational API online' });
});

// 404 Route Not Found handler
app.use((req, res, next) => {
  return res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[AppError] Caught global error:', err.stack || err.message);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const startServer = async () => {
  // Connect Event Broker
  await eventBus.connect();
  
  // Start background handlers
  await auditHandler.init();
  await notifyHandler.init();

  app.listen(env.PORT, () => {
    console.log(`===================================================`);
    console.log(`  PHAROS API Server listening on port ${env.PORT}`);
    console.log(`  Mode: ${env.NODE_ENV}`);
    console.log(`===================================================`);
  });
};

if (process.env.PHAROS_TEST !== 'true') {
  startServer().catch(err => {
    console.error('[App] Failed to start server:', err.message);
    process.exit(1);
  });
}
export default app;
