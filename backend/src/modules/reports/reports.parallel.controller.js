import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { generateParallelReport } from './reports.parallel.service.js';

export const generateParallelReportController = async (req, res) => {
  const { filters } = req.body;

  // RBAC scope checks
  const userPsId = req.user?.psId || req.user?.station_id || req.user?.ps_id;
  const userDistrictId = req.user?.districtId || req.user?.district_id;
  const filterPsId = filters?.ps_id || filters?.psId || filters?.station_id;
  const filterDistrictId = filters?.district_id || filters?.districtId;

  if (req.user?.role === 'HC' && filterPsId && filterPsId !== userPsId) {
    return res.status(403).json({
      status: 'error',
      success: false,
      code: 'FORBIDDEN',
      message: 'Cannot generate reports outside your PS'
    });
  }

  if (req.user?.role === 'DISTRICT_OFFICER' && filterDistrictId && filterDistrictId !== userDistrictId) {
    return res.status(403).json({
      status: 'error',
      success: false,
      code: 'FORBIDDEN',
      message: 'Cannot generate reports outside your district'
    });
  }

  try {
    const jobId = uuidv4();
    const reportsDir = process.env.REPORTS_DIR || './generated-reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, `${jobId}.xlsx`);
    const userId = req.user ? (req.user.userId || req.user.id) : null;

    // Create a pending job
    await db('report_jobs').insert({
      id: jobId,
      template_id: 'parallel_daily_diary',
      filters: JSON.stringify(filters || {}),
      format: 'XLSX',
      status: 'PENDING',
      file_path: filePath,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log(`[reports.parallel.controller] Launching parallel report generation for jobId: ${jobId}`);
    
    // Generate the report in-process parallely
    await generateParallelReport(jobId, filters || {}, filePath);

    // Update status to READY
    await db('report_jobs').where({ id: jobId }).update({
      status: 'READY',
      updated_at: new Date().toISOString()
    });

    return res.status(201).json({
      status: 'success',
      success: true,
      data: {
        job_id: jobId,
        job: { id: jobId, status: 'READY' },
        status: 'READY'
      }
    });

  } catch (error) {
    console.error(`[reports.parallel.controller] Failed to generate report: ${error.message}`);
    
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};
