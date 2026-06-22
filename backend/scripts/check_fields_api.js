import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

const VALID_FIELD_TYPES = ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'SELECT', 'BOOLEAN', 'TIME', 'RADIO'];

function makeToken() {
  const payload = {
    id: 'script-admin',
    userId: 'script-admin',
    role: 'SYSTEM_ADMIN',
    badge_no: 'SYS001',
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.log('FAIL:', msg); }

async function run() {
  const token = makeToken();
  const req = supertest(app).get;

  console.log('Fetching all fields (/api/v1/fields)');
  const allRes = await supertest(app)
    .get('/api/v1/fields')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const fields = allRes.body?.data?.fields || [];
  console.log(`Found ${fields.length} fields`);

  for (const f of fields) {
    const key = f.field_key || f.fieldKey || '<missing_key>';
    let okFlag = true;
    if (!f.field_key || typeof f.field_key !== 'string') { fail(`${key}: missing or invalid field_key`); okFlag = false; }
    if (!f.label_en || typeof f.label_en !== 'string') { fail(`${key}: missing label_en`); okFlag = false; }
    if (!f.field_type || !VALID_FIELD_TYPES.includes(f.field_type.toUpperCase())) { fail(`${key}: invalid field_type (${f.field_type})`); okFlag = false; }
    if (!Array.isArray(f.applicable_record_types) || f.applicable_record_types.length === 0) { fail(`${key}: applicable_record_types empty`); okFlag = false; }
    if (okFlag) ok(`${key}`);
  }

  // Collect unique record types to test form endpoint
  const recordTypes = new Set();
  for (const f of fields) {
    const arr = Array.isArray(f.applicable_record_types) ? f.applicable_record_types : [];
    for (const t of arr) recordTypes.add((t || '').toString().toUpperCase());
  }

  if (!recordTypes.size) {
    console.log('No record types found to test /form/:record_type');
    return;
  }

  console.log('Testing /api/v1/fields/form/:record_type for:', Array.from(recordTypes).join(', '));
  for (const rt of recordTypes) {
    try {
      const r = await supertest(app)
        .get(`/api/v1/fields/form/${encodeURIComponent(rt)}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const sections = r.body?.data || [];
      // Ensure every field in response lists the record type in its applicable_record_types when present
      let allOk = true;
      for (const sec of sections) {
        for (const fld of sec.fields || []) {
          const arr = Array.isArray(fld.applicable_record_types) ? fld.applicable_record_types.map(x => x.toUpperCase()) : [];
          if (!arr.includes(rt)) {
            console.log(`Mismatch: form(${rt}) returned field ${fld.field_key} which does not list ${rt} in applicable_record_types`);
            allOk = false;
          }
        }
      }
      if (allOk) ok(`form:${rt}`);
    } catch (err) {
      fail(`form:${rt} - error: ${err.message}`);
    }
  }
}

run().then(()=>console.log('Done')).catch(e=>{console.error('Error during check:', e); process.exitCode=1});
