import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return val; }
  }
  return val;
};

// Seed these 5 report templates in memory
const templates = [
  { id: "arrest-summary",       name_en: "Arrest Summary Report",       name_hi: "गिरफ्तारी सारांश रिपोर्ट",       format: ["pdf","csv"], applicable_record_types: ["ARREST"] },
  { id: "pcr-call-log",         name_en: "PCR Call Log",                name_hi: "पीसीआर कॉल लॉग",                format: ["pdf","csv"], applicable_record_types: ["PCR"] },
  { id: "cases-register",       name_en: "Cases Register",              name_hi: "मामले रजिस्टर",              format: ["pdf","csv"], applicable_record_types: ["CASES"] },
  { id: "daily-status",         name_en: "Daily Status Report",         name_hi: "दैनिक स्थिति रिपोर्ट",         format: ["pdf"], applicable_record_types: ["ARREST", "PCR", "CASES"] },
  { id: "district-compilation", name_en: "District Compilation Report", name_hi: "जिला संकलन रिपोर्ट",         format: ["pdf"], applicable_record_types: ["COMPILATION"] }
];

export const getTemplates = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    success: true,
    data: {
      templates
    }
  });
};

const getRecordsForReport = async (templateId, filters) => {
  let recordType = null;
  if (templateId === 'arrest-summary') recordType = 'ARREST';
  else if (templateId === 'pcr-call-log') recordType = 'PCR';
  else if (templateId === 'cases-register') recordType = 'CASES';

  let query = db('records')
    .select('records.*', 'ps.name_en as ps_name', 'dist.name_en as district_name')
    .leftJoin('hierarchy_nodes as ps', 'records.ps_id', 'ps.id')
    .leftJoin('hierarchy_nodes as dist', 'records.district_id', 'dist.id');

  if (recordType) {
    query = query.where('records.record_type', recordType);
  }

  const psId = filters.psId || filters.station_id;
  const districtId = filters.districtId || filters.district_id;
  const from = filters.from || filters.dateFrom || filters.from_date;
  const to = filters.to || filters.dateTo || filters.to_date;

  if (psId) query = query.where('records.ps_id', psId);
  if (districtId) query = query.where('records.district_id', districtId);
  if (from) query = query.where('records.record_date', '>=', from);
  if (to) query = query.where('records.record_date', '<=', to);

  const results = await query.orderBy('records.record_date', 'desc');
  return results.map(r => ({
    ...r,
    data: parseJsonField(r.data)
  }));
};

const getCompilationsForReport = async (filters) => {
  let query = db('compilations')
    .select('compilations.*', 'dist.name_en as district_name')
    .leftJoin('hierarchy_nodes as dist', 'compilations.district_id', 'dist.id');

  const districtId = filters.districtId || filters.district_id;
  if (districtId) query = query.where('compilations.district_id', districtId);

  const results = await query.orderBy('compilations.period', 'desc');
  return results.map(c => ({
    ...c,
    compiled_summary: parseJsonField(c.compiled_summary)
  }));
};

async function generatePDF(htmlContent) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdfBuffer;
}

export const generateReport = async (req, res) => {
  const { template_id, filters, format } = req.body;

  if (!template_id || !format) {
    return res.status(400).json({
      status: 'error',
      success: false,
      code: 'BAD_REQUEST',
      message: 'template_id and format are required'
    });
  }

  const selectedTemplate = templates.find(t => t.id === template_id);
  if (!selectedTemplate) {
    return res.status(404).json({
      status: 'error',
      success: false,
      code: 'NOT_FOUND',
      message: 'Report template not found'
    });
  }

  if (!selectedTemplate.format.includes(format.toLowerCase())) {
    return res.status(400).json({
      status: 'error',
      success: false,
      code: 'BAD_REQUEST',
      message: `Unsupported output format: ${format}`
    });
  }

  try {
    const jobId = uuidv4();
    const reportsDir = process.env.REPORTS_DIR || './generated-reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `${jobId}.${format.toLowerCase()}`;
    const filePath = path.join(reportsDir, fileName);
    const userId = req.user ? (req.user.userId || req.user.id) : null;

    // Create report job entry initially as pending
    await db('report_jobs').insert({
      id: jobId,
      template_id,
      filters: JSON.stringify(filters || {}),
      format: format.toUpperCase(),
      status: 'pending',
      file_path: filePath,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Run report generator asynchronously
    setImmediate(async () => {
      try {
        const parsedFilters = filters || {};
        let records = [];
        let psName = 'All jurisdictions';

        if (parsedFilters.psId || parsedFilters.station_id) {
          const psNode = await db('hierarchy_nodes').where({ id: parsedFilters.psId || parsedFilters.station_id }).first();
          if (psNode) psName = psNode.name_en;
        } else if (parsedFilters.districtId || parsedFilters.district_id) {
          const distNode = await db('hierarchy_nodes').where({ id: parsedFilters.districtId || parsedFilters.district_id }).first();
          if (distNode) psName = distNode.name_en;
        }

        if (format.toUpperCase() === 'PDF') {
          // Load template HTML
          const templatePath = path.resolve('src/modules/reports/templates', `${template_id}.html`);
          let html = fs.readFileSync(templatePath, 'utf8');

          let tableHtml = '';
          if (template_id === 'district-compilation') {
            const comps = await getCompilationsForReport(parsedFilters);
            records = comps;
            tableHtml = `<table style="width:100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #cbd5e0; padding: 8px;">ID</th>
                  <th style="border: 1px solid #cbd5e0; padding: 8px;">District</th>
                  <th style="border: 1px solid #cbd5e0; padding: 8px;">Period</th>
                  <th style="border: 1px solid #cbd5e0; padding: 8px;">Status</th>
                </tr>
              </thead>
              <tbody>`;
            for (const c of comps) {
              tableHtml += `<tr>
                <td style="border: 1px solid #cbd5e0; padding: 8px;">${c.id}</td>
                <td style="border: 1px solid #cbd5e0; padding: 8px;">${c.district_name || ''}</td>
                <td style="border: 1px solid #cbd5e0; padding: 8px;">${c.period || ''}</td>
                <td style="border: 1px solid #cbd5e0; padding: 8px;">${c.status || ''}</td>
              </tr>`;
            }
            tableHtml += '</tbody></table>';
          } else {
            records = await getRecordsForReport(template_id, parsedFilters);

            if (template_id === 'arrest-summary') {
              tableHtml = `<table style="width:100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">UID</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Date</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Arrestee Name</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Offence</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Arresting Officer</th>
                  </tr>
                </thead>
                <tbody>`;
              for (const r of records) {
                const d = r.data || {};
                tableHtml += `<tr>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.uid || r.id}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.record_date || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.arrestee_name || d.name || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.section_offence || d.offence || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.arresting_officer || ''}</td>
                </tr>`;
              }
              tableHtml += '</tbody></table>';
            } else if (template_id === 'pcr-call-log') {
              tableHtml = `<table style="width:100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">UID</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Date</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Caller Number</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Location</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Call Type</th>
                  </tr>
                </thead>
                <tbody>`;
              for (const r of records) {
                const d = r.data || {};
                tableHtml += `<tr>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.uid || r.id}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.record_date || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.caller_phone || d.caller_number || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.occurrence_place || d.location || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.call_type || ''}</td>
                </tr>`;
              }
              tableHtml += '</tbody></table>';
            } else if (template_id === 'cases-register') {
              tableHtml = `<table style="width:100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">UID</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">FIR No</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Complainant Name</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Crime Head</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Brief Facts</th>
                  </tr>
                </thead>
                <tbody>`;
              for (const r of records) {
                const d = r.data || {};
                tableHtml += `<tr>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.uid || r.id}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.fir_no || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.complainant_name || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.case_head || d.crime_head || ''}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.brief_facts || ''}</td>
                </tr>`;
              }
              tableHtml += '</tbody></table>';
            } else if (template_id === 'daily-status') {
              tableHtml = `<table style="width:100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Type</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">UID</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Status</th>
                    <th style="border: 1px solid #cbd5e0; padding: 8px;">Created At</th>
                  </tr>
                </thead>
                <tbody>`;
              for (const r of records) {
                tableHtml += `<tr>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.record_type}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.data.uid || r.id}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.current_status}</td>
                  <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.created_at || ''}</td>
                </tr>`;
              }
              tableHtml += '</tbody></table>';
            }
          }

          // Inject standard variables
          html = html
            .replace(/{{generated_at}}/g, new Date().toLocaleString())
            .replace(/{{job_id}}/g, jobId)
            .replace(/{{from_date}}/g, parsedFilters.from || parsedFilters.dateFrom || 'N/A')
            .replace(/{{to_date}}/g, parsedFilters.to || parsedFilters.dateTo || 'N/A')
            .replace(/{{ps_name}}/g, psName)
            .replace(/{{records_count}}/g, records.length)
            .replace(/{{records_table}}/g, tableHtml);

          if (template_id === 'daily-status') {
            const arrestsCount = records.filter(r => r.record_type === 'ARREST').length;
            const pcrCount = records.filter(r => r.record_type === 'PCR').length;
            const casesCount = records.filter(r => r.record_type === 'CASES').length;

            html = html
              .replace(/{{arrests_count}}/g, arrestsCount)
              .replace(/{{pcr_count}}/g, pcrCount)
              .replace(/{{cases_count}}/g, casesCount);
          }

          const pdfBuffer = await generatePDF(html);
          fs.writeFileSync(filePath, pdfBuffer);

        } else if (format.toUpperCase() === 'CSV') {
          records = await getRecordsForReport(template_id, parsedFilters);
          let csvString = '';

          if (template_id === 'arrest-summary') {
            csvString = 'UID,Record Date,Arrestee Name,Section/Offence,Arresting Officer\n';
            for (const r of records) {
              const d = r.data || {};
              csvString += `"${d.uid || r.id}","${r.record_date || ''}","${d.arrestee_name || d.name || ''}","${d.section_offence || d.offence || ''}","${d.arresting_officer || ''}"\n`;
            }
          } else if (template_id === 'pcr-call-log') {
            csvString = 'UID,Record Date,Caller Number,Location,Call Type,Status\n';
            for (const r of records) {
              const d = r.data || {};
              csvString += `"${d.uid || r.id}","${r.record_date || ''}","${d.caller_phone || d.caller_number || ''}","${d.occurrence_place || d.location || ''}","${d.call_type || ''}","${r.current_status || ''}"\n`;
            }
          } else if (template_id === 'cases-register') {
            csvString = 'UID,FIR No,FIR Date,Complainant Name,Crime Head,Brief Facts\n';
            for (const r of records) {
              const d = r.data || {};
              csvString += `"${d.uid || r.id}","${d.fir_no || ''}","${d.fir_date || r.record_date || ''}","${d.complainant_name || ''}","${d.case_head || d.crime_head || ''}","${(d.brief_facts || '').replace(/"/g, '""')}"\n`;
            }
          } else {
            csvString = 'ID,Record Type,Record Date,Status,Level\n';
            for (const r of records) {
              csvString += `"${r.id}","${r.record_type}","${r.record_date}","${r.current_status}","${r.current_level}"\n`;
            }
          }

          fs.writeFileSync(filePath, csvString);
        }

        // Complete job
        await db('report_jobs').where({ id: jobId }).update({
          status: 'READY',
          updated_at: new Date().toISOString()
        });

      } catch (err) {
        console.error('[AsyncReportGen] Job generation failed:', err.message);
        await db('report_jobs').where({ id: jobId }).update({
          status: 'FAILED',
          updated_at: new Date().toISOString()
        });
      }
    });

    return res.status(201).json({
      status: 'success',
      success: true,
      data: {
        job_id: jobId,
        status: 'pending',
        job: {
          id: jobId,
          status: 'pending'
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const getJobStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await db('report_jobs').where({ id }).first();
    if (!job) {
      return res.status(404).json({
        status: 'error',
        success: false,
        code: 'NOT_FOUND',
        message: 'Report job not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          template_id: job.template_id,
          format: job.format,
          created_at: job.created_at
        },
        job_id: job.id,
        status: job.status,
        template_id: job.template_id,
        format: job.format,
        created_at: job.created_at
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const downloadReport = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await db('report_jobs').where({ id }).first();
    if (!job) {
      return res.status(404).json({
        status: 'error',
        success: false,
        code: 'NOT_FOUND',
        message: 'Report file is not ready or does not exist'
      });
    }

    if (job.status.toUpperCase() !== 'READY') {
      return res.status(400).json({
        status: 'error',
        success: false,
        code: 'BAD_REQUEST',
        message: 'Report file is not ready'
      });
    }

    if (!fs.existsSync(job.file_path)) {
      return res.status(404).json({
        status: 'error',
        success: false,
        code: 'NOT_FOUND',
        message: 'Physical report file not found on disk'
      });
    }

    const ext = job.format.toLowerCase();
    res.setHeader('Content-Type', ext === 'pdf' ? 'application/pdf' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Pharos_Report_${job.id}.${ext}`);
    return res.download(job.file_path, `Pharos_Report_${job.id}.${ext}`);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const getReportsHistory = async (req, res) => {
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 20, 10);
  const offset = (page - 1) * limit;

  try {
    const userId = req.user ? (req.user.userId || req.user.id) : null;
    const countQuery = db('report_jobs').where({ created_by: userId });
    const totalRes = await countQuery.count('* as count').first();
    const total = parseInt(totalRes.count || 0, 10);

    const list = await db('report_jobs')
      .where({ created_by: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const formatted = list.map(j => ({
      id: j.id,
      job_id: j.id,
      template_id: j.template_id,
      format: j.format,
      status: j.status,
      created_at: j.created_at,
      completed_at: j.updated_at,
      filters: parseJsonField(j.filters)
    }));

    return res.status(200).json({
      status: 'success',
      success: true,
      data: formatted,
      meta: { page, limit, total }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    const usersCount = await db('users').where({ is_active: true }).count('* as count').first();
    const psCount = await db('hierarchy_nodes').where({ node_type: 'PS', is_active: true }).count('* as count').first();
    const recordsCount = await db('records').where('created_at', '>=', todayStr).count('* as count').first();
    const reportsCount = await db('report_jobs').where({ status: 'PENDING' }).orWhere({ status: 'pending' }).count('* as count').first();

    const stats = {
      total_users: parseInt(usersCount.count || 0, 10),
      total_ps: parseInt(psCount.count || 0, 10),
      records_today: parseInt(recordsCount.count || 0, 10),
      pending_reports: parseInt(reportsCount.count || 0, 10),
      system_status: "ok"
    };

    return res.status(200).json({
      status: 'success',
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};
