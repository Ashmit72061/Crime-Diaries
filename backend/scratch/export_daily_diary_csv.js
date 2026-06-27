import axios from 'axios';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { db, connectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  await connectDB();

  const targetDate = process.argv[2] || '2026-06-19';
  console.log(`Starting Daily Diary export and validation script for date: ${targetDate}`);

  // 1. Fetch a valid HC user and generate JWT
  const user = await db('users').where({ role: 'HC' }).first() || await db('users').first();
  if (!user) {
    console.error('No users found to sign JWT!');
    process.exit(1);
  }

  const tokenPayload = {
    id: user.id,
    userId: user.id,
    badge_no: user.badge_no,
    role: user.role,
    ps_id: user.station_id,
    psId: user.station_id,
    district_id: user.district_id,
    districtId: user.district_id
  };
  const jwtToken = jwt.sign(tokenPayload, env.JWT_SECRET);
  console.log(`Generated test JWT token for user ${user.username}`);

  // 2. Start the express application on a test port
  const testPort = 45000;
  process.env.PORT = testPort;
  process.env.NODE_ENV = 'development';
  process.env.PHAROS_TEST = 'true';

  const { default: app } = await import('../src/app.js');
  const server = app.listen(testPort, () => {
    console.log(`Test server booted on port ${testPort}`);
  });

  const baseURL = `http://localhost:${testPort}/api/v1/daily-diary`;

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${description}`);
      failed++;
    }
  };

  try {
    // A. 400 Bad Request check
    try {
      await axios.get(`${baseURL}/records-preview?date=2026-06/19`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      assert(false, 'Expected 400 on malformed date');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid date format returns 400 Bad Request');
    }

    // B. 401 Unauthorized check
    try {
      await axios.get(`${baseURL}/records-preview?date=${targetDate}`);
      assert(false, 'Expected 401 on missing token');
    } catch (err) {
      assert(err.response?.status === 401, 'Missing Authorization header returns 401 Unauthorized');
    }

    // C. 200 Preview Check
    const previewRes = await axios.get(`${baseURL}/records-preview?date=${targetDate}`, {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    assert(previewRes.status === 200, 'GET /records-preview returns 200 OK');
    assert(previewRes.data.success === true, 'Preview response structure includes success = true');
    assert(previewRes.data.data.sheetsPreview !== undefined, 'Preview response includes sheetsPreview dictionary');
    console.log('Preview sample count values:');
    Object.keys(previewRes.data.data.sheetsPreview).slice(0, 5).forEach(k => {
      console.log(`  ${k}:`, previewRes.data.data.sheetsPreview[k]);
    });

    // D. 200 Export Check & Output Directory Init
    const outDir = path.resolve(__dirname, 'daily-diary-csv');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const exportRes = await axios.get(`${baseURL}/export?date=${targetDate}`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
      responseType: 'arraybuffer'
    });
    assert(exportRes.status === 200, 'GET /export returns 200 OK');
    
    const xlsxPath = path.join(outDir, `Daily_Diary_${targetDate}.xlsx`);
    fs.writeFileSync(xlsxPath, Buffer.from(exportRes.data));
    console.log(`Successfully wrote compiled XLSX to: ${xlsxPath}`);

    // E. 200 Data JSON endpoint check
    const dataRes = await axios.get(`${baseURL}/data?date=${targetDate}`, {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    assert(dataRes.status === 200, 'GET /data returns 200 OK');
    
    const tablesData = dataRes.data.data;
    assert(typeof tablesData === 'object', 'Data response is an object');

    // F. Exporter to CSVs
    const reportsDef = await import('../src/modules/daily-diary/daily-diary.service.js');
    const REPORTS = reportsDef.REPORTS;
    
    // Exact column definitions mapping
    const REPORT_COLUMNS = {
      excel_1manual_fir: ['ps', 'fir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'place_of_occurrence', 'time_of_occurrence_1', 'place_of_occurrence_1', 'gist', 'arrested_name', 'arrested_father_husband_name', 'arrested_address', 'accused_name', 'accused_father_name', 'accused_address', 'accused_extra'],
      excel_2eburglary_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no'],
      excel_3ehouse_theft_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'place_of_occurrence', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence_1', 'io_name', 'io_mobile_no', 'beat_no'],
      excel_4eother_theft_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no'],
      excel_5mvt_cases: ['sr', 'ps', 'fir_no', 'us', 'date_of_occurrence', 'time_of_occurrence', 'place_of_occurrence', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'vehicle_no', 'vehicle_type', 'io_name', 'io_mobile_no', 'beat_no', '1st_cd_uploaded_in_24_hrs_yesno', 'whether_footage_is_collected_or_not'],
      excel_6arrested_all_heads: ['bnsipc', 'total_no_dd_126170_bnss', 'total_no_dd_126169_bnss', 'total_no_dd_109_bnss', '109_g', 'total_l_no_dd_110_bnss', '110_g', '929397_dp_act', 'total_no_dd_40_ex', '40_ex', '351d', 'aact', 'gact', '33_ex', 'ndps', 'others_act', 'others_bnss', 'po'],
      excel_7arrested_east_district: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pi', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
      excel_8arrested_kalandara: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'place_of_occurrence', 'io', 'pcjcbail', 'prev_involvement', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pick', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
      excel_9arrested_efir_theft: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases_head', 'recovery', 'whether_accused_is_bc_or_not', 'group_rolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
      excel_10arrested_efir_mv_theft: ['fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_rate_picked', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
      excel_11proclaimed_offenders: ['sn', 'ps', 'dd_nofir_no', 'us', 'details_of_po_name', 'details_of_po_parental', 'details_of_po_address', 'case_in_which_declared_po', 'name_of_court_which_declared_po'],
      excel_13arrested_24_hrs_list: ['s_no', 'name_nick_name', 'father_namehusband_name', 'address', 'age', 'firdd_no', 'us', 'police_station', 'name_of_io', 'rank_of_io', 'mobile_no_of_io', 'remarks_pc_remand_formal_arrest_bail_etc'],
      excel_14pi_disposal_manual: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
      excel_15pi_disposal_eproperty: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
      excel_16pi_disposal_emvt: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
      excel_18missing_persons: ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'name_of_missing_person', 'address_of_missing_person', 'missing_date', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
      excel_19uidb: ['sno', 'dd_no', 'dd_date', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
      excel_20abandoned_persons: ['sno', 'dd_no', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
      excel_21traced_persons: ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'name_of_traced_person', 'fatherhusband_name_of_traced_person', 'address_of_traced_person', 'name_of_io'],
      excel_22women_missing: ['pcr_call', 'dd_entry_complaint', 'total', 'traced', 'case_registered', 'pending'],
      excel_23children_missing: ['pcr_call_male', 'pcr_call_female', 'dd_entrycomplaint_male', 'dd_entrycomplaint_female', 'total_male', 'total_female', 'traced_male', 'traced_female', 'case_registered_male', 'case_registered_female'],
      excel_25inquest_registered: ['sn', 'dd_no', 'date', 'us', 'name_of_deceased', 'fatherhusband_name_of_deceased', 'address_of_deceased', 'sex', 'age', 'cause_of_death', 'place_of_occurrence', 'io'],
      excel_26inquest_acpsdm_disposal: ['sno', 'dd_no', 'date', 'us', 'name_of_deceased', 'fatherhusband_name_of_deceased', 'address_of_deceased', 'sex', 'age', 'cause_of_death', 'date_of_filed_by_acpsdm'],
      excel_28fir_goswara_summary: ['district', 'manual_fir', 'theft_efir', 'house_theft_efir', 'burglary_efir', 'mvt_motor_vehicle_theft', 'total']
    };

    console.log(`Writing 24 reports as CSV files inside: ${outDir}...`);
    for (const r of REPORTS) {
      const rows = tablesData[r.tableName] || [];
      const columns = REPORT_COLUMNS[r.tableName];

      // Build CSV
      const header = columns.join(',');
      const body = rows.map(row => {
        return columns.map(col => {
          const val = row[col] ?? '';
          const strVal = String(val);
          if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        }).join(',');
      }).join('\n');

      const csvContent = header + '\n' + body;
      const csvName = `${r.tableName.replace('excel_', '')}.csv`;
      fs.writeFileSync(path.join(outDir, csvName), csvContent);
    }
    console.log('Successfully wrote all 24 CSV reports!');
    assert(failed === 0, 'All verification tests pass');

  } catch (error) {
    console.error('Test execution failed:', error.message, error.response?.data || '');
    failed++;
  } finally {
    server.close();
    await db.destroy();
    console.log(`=========================================`);
    console.log(`  Tests run complete. Passed: ${passed}, Failed: ${failed}`);
    console.log(`=========================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

main().catch(console.error);
