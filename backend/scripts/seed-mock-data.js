import { db, connectDB } from '../src/config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../src/utils/logger.js';
import bcrypt from 'bcryptjs';

const seedMockData = async () => {
  await connectDB();
  try {
    logger.info('Starting Mock Data Seeding...');

    // 1. Hierarchy Nodes
    const hqId = uuidv4();
    await db('hierarchy_nodes').insert({
      id: hqId, node_type: 'HQ', name_en: 'Delhi Police HQ', name_hi: 'दिल्ली पुलिस मुख्यालय'
    });

    const districtId = uuidv4();
    await db('hierarchy_nodes').insert({
      id: districtId, parent_id: hqId, node_type: 'DISTRICT', name_en: 'Central District', name_hi: 'मध्य जिला'
    });

    const psIds = [];
    for (let i = 1; i <= 3; i++) {
      const psId = uuidv4();
      psIds.push(psId);
      await db('hierarchy_nodes').insert({
        id: psId, parent_id: districtId, node_type: 'PS',
        name_en: `Police Station ${i}`, name_hi: `पुलिस थाना ${i}`
      });
    }

    // 2. Users — using correct schema: station_id (not ps_id), username, name_hi are required
    const passwordHash = await bcrypt.hash('Test@1234', 10);
    const mockUsers = [];

    const hcId = uuidv4();
    mockUsers.push({
      id: hcId, badge_no: 'HC001', username: 'hc_ps1',
      name_en: 'Ramesh Singh', name_hi: 'रमेश सिंह',
      role: 'HC', station_id: psIds[0], district_id: districtId,
      password_hash: passwordHash, is_active: true
    });

    const shoId = uuidv4();
    mockUsers.push({
      id: shoId, badge_no: 'SHO001', username: 'sho_ps1',
      name_en: 'Suresh Kumar', name_hi: 'सुरेश कुमार',
      role: 'SHO', station_id: psIds[0], district_id: districtId,
      password_hash: passwordHash, is_active: true
    });

    const districtOfficerId = uuidv4();
    mockUsers.push({
      id: districtOfficerId, badge_no: 'DO001', username: 'dcp_central',
      name_en: 'Arun Verma', name_hi: 'अरुण वर्मा',
      role: 'DISTRICT_OFFICER', district_id: districtId,
      password_hash: passwordHash, is_active: true
    });

    const hqAnalystId = uuidv4();
    mockUsers.push({
      id: hqAnalystId, badge_no: 'HQ001', username: 'hq_analyst',
      name_en: 'Amit Sharma', name_hi: 'अमित शर्मा',
      role: 'HQ_ANALYST', password_hash: passwordHash, is_active: true
    });

    await db('users').insert(mockUsers);

    // 3. Records
    const recordTypes = ['ARREST', 'PCR_CALL', 'CASE'];
    const crimeHeads = ['Robbery', 'Theft', 'Murder'];
    const statuses = ['DRAFT', 'PENDING_SHO', 'DISTRICT_REVIEW', 'HQ_RECEIVED'];

    let recordsCount = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const psId of psIds) {
      for (let i = 0; i < 15; i++) {
        const rType = recordTypes[Math.floor(Math.random() * recordTypes.length)];
        const rStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const crimeHead = crimeHeads[Math.floor(Math.random() * crimeHeads.length)];

        let level = 'PS';
        if (rStatus === 'DISTRICT_REVIEW') level = 'DISTRICT';
        if (rStatus === 'HQ_RECEIVED') level = 'HQ';

        const recordId = uuidv4();
        await db('records').insert({
          id: recordId,
          record_type: rType,
          ps_id: psId,
          district_id: districtId,
          current_status: rStatus,
          current_level: level,
          record_date: today,
          created_by: hcId,
          updated_by: hcId,
          data: JSON.stringify({ crime_head: crimeHead, fir_no: `FIR-${Math.floor(Math.random() * 1000)}` })
        });

        if (rStatus !== 'DRAFT') {
          await db('workflow_transitions').insert({
            id: uuidv4(),
            record_id: recordId,
            from_status: 'DRAFT',
            to_status: rStatus,
            from_level: 'PS',
            to_level: level,
            action: 'SEED',
            performed_by: hcId
          });
        }

        recordsCount++;
      }
    }

    logger.info(`Seeded 1 HQ, 1 District, 3 PS, 4 Users, ${recordsCount} Records.`);
    logger.info('All test accounts use password: Test@1234');
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    logger.error(error.stack);
  } finally {
    await db.destroy();
    process.exit(0);
  }
};

seedMockData();
