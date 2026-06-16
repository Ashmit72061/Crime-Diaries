import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { swaggerSpec } from './config/swagger.js';
import path from 'path';

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression & Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request Logging
app.use(
  morgan(env.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// Routes placeholder for modules
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', data: { message: 'PHAROS API is running' } });
});

// To be imported from modules and registered here
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
import fieldsRoutes from './modules/fields/fields.routes.js';
app.use('/api/fields', fieldsRoutes);
import recordsRoutes from './modules/records/records.routes.js';
app.use('/api/records', recordsRoutes);
import workflowRoutes from './modules/workflow/workflow.routes.js';
app.use('/api/workflow', workflowRoutes);
import compilationRoutes from './modules/compilation/compilation.routes.js';
app.use('/api/compilations', compilationRoutes);
import analyticsRoutes from './modules/analytics/analytics.routes.js';
app.use('/api/analytics', analyticsRoutes);
import notificationsRoutes from './modules/notifications/notifications.routes.js';
app.use('/api/notifications', notificationsRoutes);
import uploadRoutes from './modules/upload/upload.routes.js';
app.use('/api/upload', uploadRoutes);

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger Documentation Route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 & Error Handling
app.use((req, res, next) => {
  res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Something went wrong',
  });
});

export default app;
