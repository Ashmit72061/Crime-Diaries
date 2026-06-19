import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return val; }
  }
  return val;
};

// Fallback in-memory templates
const templates = [
  { id: "arrest-summary",       name_en: "Arrest Summary Report",       name_hi: "गिरफ्तारी सारांश रिपोर्ट",       format: ["pdf","csv","excel"], applicable_record_types: ["ARREST"] },
  { id: "pcr-call-log",         name_en: "PCR Call Log",                name_hi: "पीसीआर कॉल लॉग",                format: ["pdf","csv","excel"], applicable_record_types: ["PCR"] },
  { id: "cases-register",       name_en: "Cases Register",              name_hi: "मामले रजिस्टर",              format: ["pdf","csv","excel"], applicable_record_types: ["CASES"] },
  { id: "daily-status",         name_en: "Daily Status Report",         name_hi: "दैनिक स्थिति रिपोर्ट",         format: ["pdf","excel"], applicable_record_types: ["ARREST", "PCR", "CASES"] },
  { id: "district-compilation", name_en: "District Compilation Report", name_hi: "जिला संकलन रिपोर्ट",         format: ["pdf","excel"], applicable_record_types: ["COMPILATION"] },
  { id: "io-performance",       name_en: "IO Investigation Performance", name_hi: "जांच अधिकारी जांच प्रदर्शन",  format: ["pdf","excel"], applicable_record_types: ["CASES"] },
  { id: "beat-incidents",       name_en: "Beat Incident Summary",       name_hi: "बीट घटना सारांश",               format: ["pdf","excel"], applicable_record_types: ["CASES", "PCR"] },
  { id: "legacy-summary",       name_en: "Legacy Data Summary",         name_hi: "विरासत डेटा सारांश",            format: ["pdf","excel"], applicable_record_types: ["CASES", "ARREST"] },
  { id: "sla-breaches",         name_en: "SLA Breaches Audit Log",      name_hi: "समय सीमा उल्लंघन ऑडिट लॉग",      format: ["pdf","csv","excel"], applicable_record_types: ["CASES", "ARREST", "PCR"] },
  { id: "ops-compilation",      name_en: "Ops Chain Compilation",       name_hi: "संचालन श्रृंखला संकलन",          format: ["pdf","excel"], applicable_record_types: ["COMPILATION"] }
];

export const getTemplates = async (req, res) => {
  try {
    const dbTemplates = await db('report_templates').where({ is_active: true });
    if (dbTemplates && dbTemplates.length > 0) {
      const formatted = dbTemplates.map(t => ({
        id: t.id,
        name_en: t.name_en,
        name_hi: t.name_hi,
        format: typeof t.output_formats === 'string' ? JSON.parse(t.output_formats) : t.output_formats || ["pdf", "csv", "excel"],
        applicable_record_types: typeof t.applicable_record_types === 'string' ? JSON.parse(t.applicable_record_types) : t.applicable_record_types
      }));
      return res.status(200).json({
        status: 'success',
        success: true,
        data: { templates: formatted }
      });
    }
  } catch (e) {
    // fallback below
  }

  return res.status(200).json({
    status: 'success',
    success: true,
    data: { templates }
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
    .leftJoin('hierarchy_nodes as dist', 'compilations.source_entity_id', 'dist.id');

  const districtId = filters.districtId || filters.district_id;
  if (districtId) query = query.where('compilations.source_entity_id', districtId);

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

async function generateExcelFile(template_id, records, parsedFilters, psName, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  worksheet.addRow([`PHAROS REPORT: ${template_id.toUpperCase().replace(/-/g, ' ')}`]);
  worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
  worksheet.addRow([`Jurisdiction: ${psName}`]);
  worksheet.addRow([]);

  let headers = [];
  let rowKeys = [];

  if (template_id === 'district-compilation' || template_id === 'ops-compilation') {
    headers = ['Compilation ID', 'District', 'Period', 'Status'];
    rowKeys = ['id', 'district_name', 'period', 'status'];
  } else if (template_id === 'arrest-summary') {
    headers = ['UID', 'Date', 'Arrestee Name', 'Offence', 'Arresting Officer'];
    rowKeys = ['uid', 'record_date', 'arrestee_name', 'section_offence', 'arresting_officer'];
  } else if (template_id === 'pcr-call-log') {
    headers = ['UID', 'Date', 'Caller Number', 'Location', 'Call Type', 'Status'];
    rowKeys = ['uid', 'record_date', 'caller_phone', 'occurrence_place', 'call_type', 'current_status'];
  } else if (template_id === 'cases-register') {
    headers = ['UID', 'FIR No', 'FIR Date', 'Complainant Name', 'Crime Head', 'Brief Facts'];
    rowKeys = ['uid', 'fir_no', 'fir_date', 'complainant_name', 'case_head', 'brief_facts'];
  } else {
    headers = ['ID', 'Record Type', 'Record Date', 'Status', 'Level'];
    rowKeys = ['id', 'record_type', 'record_date', 'current_status', 'current_level'];
  }

  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  for (const r of records) {
    const d = r.data || r;
    const rowData = rowKeys.map(key => {
      if (key === 'record_date') return r.record_date || '';
      if (key === 'record_type') return r.record_type || '';
      if (key === 'current_status') return r.current_status || '';
      if (key === 'current_level') return r.current_level || '';
      if (key === 'id') return r.id || '';
      if (d[key] !== undefined) return d[key];
      if (key === 'arrestee_name') return d.arrested_name || d.name || '';
      if (key === 'section_offence') return d.crime_head || d.section_offence || d.offence || '';
      if (key === 'caller_phone') return d.caller_phone || d.pcr_gd_no || '';
      return '';
    });
    worksheet.addRow(rowData);
  }

  worksheet.columns.forEach(column => {
    let maxLen = 10;
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    column.width = Math.min(maxLen + 2, 50);
  });

  await workbook.xlsx.writeFile(filePath);
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

  // Find template in memory or dynamic check
  const selectedTemplate = templates.find(t => t.id === template_id) || { format: ["pdf", "csv", "excel", "xlsx"] };

  const fmt = format.toLowerCase();
  const allowedFormats = [...selectedTemplate.format, 'xlsx', 'excel'];
  if (!allowedFormats.includes(fmt)) {
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

    const fileName = `${jobId}.${fmt === 'excel' ? 'xlsx' : fmt}`;
    const filePath = path.join(reportsDir, fileName);
    const userId = req.user ? (req.user.userId || req.user.id) : null;

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

    setImmediate(async () => {
      try {
        await generateReportInternal(jobId, template_id, filters || {}, format, filePath, userId);
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
        job: { id: jobId, status: 'pending' }
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

export const generateReportInternal = async (jobId, template_id, parsedFilters, format, filePath, userId) => {
  let records = [];
  let psName = 'All jurisdictions';

  if (parsedFilters.psId || parsedFilters.station_id) {
    const psNode = await db('hierarchy_nodes').where({ id: parsedFilters.psId || parsedFilters.station_id }).first();
    if (psNode) psName = psNode.name_en;
  } else if (parsedFilters.districtId || parsedFilters.district_id) {
    const distNode = await db('hierarchy_nodes').where({ id: parsedFilters.districtId || parsedFilters.district_id }).first();
    if (distNode) psName = distNode.name_en;
  }

  const fmt = format.toUpperCase();

  if (fmt === 'PDF') {
    const templatePath = path.resolve('src/modules/reports/templates', `${template_id}.html`);
    let html;
    if (fs.existsSync(templatePath)) {
      html = fs.readFileSync(templatePath, 'utf8');
    } else {
      html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>{{ps_name}} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #1a365d; border-bottom: 2px solid #2b6cb0; padding-bottom: 10px; }
          .meta { margin-bottom: 20px; font-size: 14px; color: #4a5568; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #ebf8ff; border: 1px solid #cbd5e0; padding: 10px; text-align: left; }
          td { border: 1px solid #cbd5e0; padding: 10px; }
          tr:nth-child(even) { background-color: #f7fafc; }
        </style>
      </head>
      <body>
        <h1>PHAROS REPORT: ${template_id.toUpperCase().replace(/-/g, ' ')}</h1>
        <div class="meta">
          <p><strong>Jurisdiction:</strong> {{ps_name}}</p>
          <p><strong>Generated At:</strong> {{generated_at}}</p>
          <p><strong>Date Range:</strong> {{from_date}} to {{to_date}}</p>
          <p><strong>Total Records:</strong> {{records_count}}</p>
        </div>
        {{records_table}}
      </body>
      </html>`;
    }

    let tableHtml = '';
    if (template_id === 'district-compilation' || template_id === 'ops-compilation') {
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
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.arrested_name || d.name || ''}</td>
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.crime_head || d.section_offence || d.offence || ''}</td>
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
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.caller_phone || d.pcr_gd_no || ''}</td>
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.occurrence_place || d.location || ''}</td>
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.pcr_head || d.call_type || ''}</td>
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
      } else {
        tableHtml = `<table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #cbd5e0; padding: 8px;">UID</th>
              <th style="border: 1px solid #cbd5e0; padding: 8px;">Type</th>
              <th style="border: 1px solid #cbd5e0; padding: 8px;">Date</th>
              <th style="border: 1px solid #cbd5e0; padding: 8px;">Status</th>
            </tr>
          </thead>
          <tbody>`;
        for (const r of records) {
          const d = r.data || {};
          tableHtml += `<tr>
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${d.uid || r.id}</td>
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.record_type || ''}</td>
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.record_date || ''}</td>
            <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.current_status || ''}</td>
          </tr>`;
        }
        tableHtml += '</tbody></table>';
      }
    }

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

  } else if (fmt === 'CSV') {
    records = await getRecordsForReport(template_id, parsedFilters);
    let csvString = '';

    if (template_id === 'arrest-summary') {
      csvString = 'UID,Record Date,Arrestee Name,Section/Offence,Arresting Officer\n';
      for (const r of records) {
        const d = r.data || {};
        csvString += `"${d.uid || r.id}","${r.record_date || ''}","${d.arrested_name || d.name || ''}","${d.crime_head || d.section_offence || d.offence || ''}","${d.arresting_officer || ''}"\n`;
      }
    } else if (template_id === 'pcr-call-log') {
      csvString = 'UID,Record Date,Caller Number,Location,Call Type,Status\n';
      for (const r of records) {
        const d = r.data || {};
        csvString += `"${d.uid || r.id}","${r.record_date || ''}","${d.caller_phone || d.pcr_gd_no || ''}","${d.occurrence_place || d.location || ''}","${d.pcr_head || d.call_type || ''}","${r.current_status || ''}"\n`;
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

  } else if (fmt === 'EXCEL' || fmt === 'XLSX') {
    if (template_id === 'district-compilation' || template_id === 'ops-compilation') {
      records = await getCompilationsForReport(parsedFilters);
    } else {
      records = await getRecordsForReport(template_id, parsedFilters);
    }
    await generateExcelFile(template_id, records, parsedFilters, psName, filePath);
  }

  await db('report_jobs').where({ id: jobId }).update({
    status: 'READY',
    updated_at: new Date().toISOString()
  });

  const { publish } = await import('../../events/eventBus.js');
  await publish('report.generated', {
    job_id: jobId,
    template_id,
    requested_by: userId,
    file_path: filePath,
    format,
    file_size_bytes: fs.statSync(filePath).size
  });
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
    let contentType = 'text/csv';
    if (ext === 'pdf') {
      contentType = 'application/pdf';
    } else if (ext === 'excel' || ext === 'xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=Pharos_Report_${job.id}.${ext === 'excel' ? 'xlsx' : ext}`);
    return res.download(job.file_path, `Pharos_Report_${job.id}.${ext === 'excel' ? 'xlsx' : ext}`);
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

export const listSchedules = async (req, res) => {
  try {
    const list = await db('scheduled_reports').orderBy('created_at', 'desc');
    return res.status(200).json({
      status: 'success',
      data: list.map(item => ({
        ...item,
        filter_spec: typeof item.filter_spec === 'string' ? JSON.parse(item.filter_spec || '{}') : item.filter_spec,
        recipients: typeof item.recipients === 'string' ? JSON.parse(item.recipients || '[]') : item.recipients
      }))
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createSchedule = async (req, res) => {
  const { template_id, cron_expr, filter_spec, format, scope_ps_id, scope_district_id, recipients, is_active } = req.body;

  if (!template_id || !cron_expr) {
    return res.status(400).json({ status: 'error', message: 'template_id and cron_expr are required' });
  }

  try {
    const id = uuidv4();
    const row = {
      id,
      template_id,
      cron_expr,
      filter_spec: typeof filter_spec === 'string' ? filter_spec : JSON.stringify(filter_spec || {}),
      format: format || 'PDF',
      scope_ps_id: scope_ps_id || null,
      scope_district_id: scope_district_id || null,
      recipients: Array.isArray(recipients) ? JSON.stringify(recipients) : recipients || '[]',
      created_by: req.user ? (req.user.id || req.user.userId) : null,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString()
    };

    await db('scheduled_reports').insert(row);

    // Reload job in scheduler
    const { reloadScheduledJob } = await import('./scheduler.js');
    await reloadScheduledJob(id);

    return res.status(201).json({
      status: 'success',
      data: {
        ...row,
        filter_spec: JSON.parse(row.filter_spec),
        recipients: JSON.parse(row.recipients)
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const updateData = {};
    if (req.body.template_id !== undefined) updateData.template_id = req.body.template_id;
    if (req.body.cron_expr !== undefined) updateData.cron_expr = req.body.cron_expr;
    if (req.body.format !== undefined) updateData.format = req.body.format;
    if (req.body.scope_ps_id !== undefined) updateData.scope_ps_id = req.body.scope_ps_id || null;
    if (req.body.scope_district_id !== undefined) updateData.scope_district_id = req.body.scope_district_id || null;
    if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;

    if (req.body.filter_spec !== undefined) {
      updateData.filter_spec = typeof req.body.filter_spec === 'string'
        ? req.body.filter_spec
        : JSON.stringify(req.body.filter_spec);
    }
    if (req.body.recipients !== undefined) {
      updateData.recipients = Array.isArray(req.body.recipients)
        ? JSON.stringify(req.body.recipients)
        : req.body.recipients;
    }

    await db('scheduled_reports').where({ id }).update(updateData);

    const updated = await db('scheduled_reports').where({ id }).first();
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Scheduled report not found' });
    }

    // Reload job in scheduler
    const { reloadScheduledJob } = await import('./scheduler.js');
    await reloadScheduledJob(id);

    return res.status(200).json({
      status: 'success',
      data: {
        ...updated,
        filter_spec: typeof updated.filter_spec === 'string' ? JSON.parse(updated.filter_spec || '{}') : updated.filter_spec,
        recipients: typeof updated.recipients === 'string' ? JSON.parse(updated.recipients || '[]') : updated.recipients
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db('scheduled_reports').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Scheduled report not found' });
    }

    await db('scheduled_reports').where({ id }).del();

    // Stop job in scheduler
    const { stopScheduledJob } = await import('./scheduler.js');
    stopScheduledJob(id);

    return res.status(200).json({ status: 'success', message: 'Scheduled report deleted successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const runScheduleNow = async (req, res) => {
  const { id } = req.params;

  try {
    const schedule = await db('scheduled_reports').where({ id }).first();
    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Scheduled report not found' });
    }

    const jobId = uuidv4();
    const reportsDir = process.env.REPORTS_DIR || './generated-reports';
    const fileName = `${jobId}.${schedule.format.toLowerCase() === 'excel' ? 'xlsx' : schedule.format.toLowerCase()}`;
    const filePath = path.join(reportsDir, fileName);

    await db('report_jobs').insert({
      id: jobId,
      template_id: schedule.template_id,
      filters: schedule.filter_spec,
      format: schedule.format.toUpperCase(),
      status: 'pending',
      file_path: filePath,
      created_by: req.user ? (req.user.id || req.user.userId) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const parsedFilters = typeof schedule.filter_spec === 'string' ? JSON.parse(schedule.filter_spec) : schedule.filter_spec || {};
    if (schedule.scope_ps_id) parsedFilters.psId = schedule.scope_ps_id;
    if (schedule.scope_district_id) parsedFilters.districtId = schedule.scope_district_id;

    setImmediate(async () => {
      try {
        await generateReportInternal(jobId, schedule.template_id, parsedFilters, schedule.format.toUpperCase(), filePath, schedule.created_by);
        await db('scheduled_reports').where({ id }).update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'SUCCESS'
        });
      } catch (err) {
        console.error('[RunScheduleNow] Immediate execution failed:', err.message);
        await db('scheduled_reports').where({ id }).update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'FAILED'
        });
      }
    });

    return res.status(200).json({ status: 'success', data: { job_id: jobId, message: 'Scheduled report triggered successfully' } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
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
