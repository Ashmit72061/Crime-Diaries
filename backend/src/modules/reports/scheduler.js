import cron from 'node-cron';
import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { generateReportInternal } from './reports.controller.js';
import { logger } from '../../utils/logger.js';

const activeCronJobs = new Map();

export const initScheduler = async () => {
  logger.info('[Scheduler] Initializing Scheduled Reports Cron Service...');
  try {
    const schedules = await db('scheduled_reports').where({ is_active: true });
    logger.info(`[Scheduler] Found ${schedules.length} active scheduled reports.`);
    
    for (const schedule of schedules) {
      await startScheduledJob(schedule);
    }
  } catch (error) {
    logger.error('[Scheduler] Failed to initialize scheduled reports:', error.message);
  }

  // Refresh analytics materialized view nightly at 02:00 AM (PostgreSQL only)
  const isPg = db.client.config.client === 'pg';
  if (isPg) {
    cron.schedule('0 2 * * *', async () => {
      try {
        await db.raw('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_record_stats');
        logger.info('[Scheduler] mv_record_stats refreshed successfully.');
      } catch (err) {
        logger.error('[Scheduler] mv_record_stats refresh failed:', err.message);
      }
    });
    logger.info('[Scheduler] Analytics materialized view refresh scheduled (nightly 02:00).');
  }

  // Hourly cron to clean up expired bulk import temp files
  cron.schedule('0 * * * *', async () => {
    logger.info('[Scheduler] Running expired import temp files cleanup cron...');
    const path = await import('path');
    const fs = await import('fs');
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);

      const expiredBatches = await db('import_batches')
        .where('created_at', '<', cutoff.toISOString())
        .whereNotIn('status', ['COMPLETED', 'EXPIRED']);

      if (expiredBatches.length > 0) {
        logger.info(`[Scheduler] Purging ${expiredBatches.length} expired import batches.`);
        for (const batch of expiredBatches) {
          if (batch.file_path && fs.existsSync(batch.file_path)) {
            try {
              fs.unlinkSync(batch.file_path);
              logger.info(`[Scheduler] Deleted expired temp file: ${batch.file_path}`);
            } catch (fileErr) {
              logger.error(`[Scheduler] Error unlinking temp file ${batch.file_path}:`, fileErr.message);
            }
          }
          await db('import_batches')
            .where({ id: batch.id })
            .update({ status: 'EXPIRED' });
        }
      }
    } catch (err) {
      logger.error('[Scheduler] Import temp files cleanup cron failed:', err.message);
    }
  });
  logger.info('[Scheduler] Import temp files cleanup scheduled (hourly).');
};


export const startScheduledJob = async (schedule) => {
  const { id, template_id, cron_expr, format, filter_spec, scope_ps_id, scope_district_id, recipients } = schedule;

  // Stop if already running
  if (activeCronJobs.has(id)) {
    stopScheduledJob(id);
  }

  try {
    const job = cron.schedule(cron_expr, async () => {
      logger.info(`[Scheduler] Triggered scheduled report execution for ID: ${id}, Template: ${template_id}`);
      const jobId = uuidv4();
      const reportsDir = process.env.REPORTS_DIR || './generated-reports';
      const fileName = `${jobId}.${format.toLowerCase()}`;
      const path = await import('path');
      const filePath = path.join(reportsDir, fileName);

      try {
        // Insert report job as pending
        await db('report_jobs').insert({
          id: jobId,
          template_id,
          filters: filter_spec,
          format: format.toUpperCase(),
          status: 'pending',
          file_path: filePath,
          created_by: schedule.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Run the generation
        const parsedFilters = typeof filter_spec === 'string' ? JSON.parse(filter_spec) : filter_spec || {};
        if (scope_ps_id) parsedFilters.psId = scope_ps_id;
        if (scope_district_id) parsedFilters.districtId = scope_district_id;

        await generateReportInternal(jobId, template_id, parsedFilters, format.toUpperCase(), filePath, schedule.created_by);

        // Update schedule metadata
        await db('scheduled_reports').where({ id }).update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'SUCCESS'
        });

        logger.info(`[Scheduler] Scheduled report completed successfully. Job ID: ${jobId}`);
      } catch (err) {
        logger.error(`[Scheduler] Scheduled report execution failed:`, err.message);
        
        await db('scheduled_reports').where({ id }).update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'FAILED'
        });

        await db('report_jobs').where({ id: jobId }).update({
          status: 'FAILED',
          updated_at: new Date().toISOString()
        });
      }
    });

    activeCronJobs.set(id, job);
    logger.info(`[Scheduler] Scheduled job ${id} started with expression: "${cron_expr}"`);
  } catch (err) {
    logger.error(`[Scheduler] Failed to start scheduled job ${id}:`, err.message);
  }
};

export const stopScheduledJob = (id) => {
  if (activeCronJobs.has(id)) {
    const job = activeCronJobs.get(id);
    job.stop();
    activeCronJobs.delete(id);
    logger.info(`[Scheduler] Stopped scheduled job ID: ${id}`);
  }
};

export const reloadScheduledJob = async (id) => {
  const schedule = await db('scheduled_reports').where({ id }).first();
  if (!schedule || !schedule.is_active) {
    stopScheduledJob(id);
  } else {
    await startScheduledJob(schedule);
  }
};
