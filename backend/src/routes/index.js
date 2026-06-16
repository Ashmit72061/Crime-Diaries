import { Router } from 'express';
import authRoutes from './auth.routes.js';
import casesRoutes from './cases.routes.js';
import arrestsRoutes from './arrests.routes.js';
import pcrRoutes from './pcr.routes.js';
import missingRoutes from './missing.routes.js';
import analyticsRoutes from './analytics.routes.js';
import auditRoutes from './audit.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Delhi Police Daily Operational Reporting API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Bind routes
router.use('/auth', authRoutes);
router.use('/records/cases', casesRoutes);
router.use('/records/arrests', arrestsRoutes);
router.use('/records/pcr', pcrRoutes);
router.use('/records/missing', missingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit', auditRoutes);
router.use('/admin', adminRoutes);

export default router;
