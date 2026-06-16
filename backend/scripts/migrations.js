import { db, connectDB } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';

const runMigrations = async () => {
  await connectDB();

  try {
    logger.info('Starting DB Migrations...');

    // 1. hierarchy_nodes
    await db.raw(`
      CREATE TABLE IF NOT EXISTS hierarchy_nodes (
        id UUID PRIMARY KEY, 
        node_type VARCHAR, 
        name_en VARCHAR, 
        name_hi VARCHAR, 
        code VARCHAR UNIQUE, 
        parent_id UUID REFERENCES hierarchy_nodes(id), 
        is_active BOOLEAN DEFAULT true, 
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    logger.info('Table hierarchy_nodes created or verified');

    // 2. users
    await db.raw(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY, 
        badge_no VARCHAR UNIQUE, 
        name_en VARCHAR, 
        name_hi VARCHAR, 
        role VARCHAR, 
        ps_id UUID REFERENCES hierarchy_nodes(id), 
        district_id UUID REFERENCES hierarchy_nodes(id), 
        password_hash VARCHAR, 
        is_active BOOLEAN DEFAULT true, 
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    logger.info('Table users created or verified');

    // 3. field_registry
    await db.raw(`
      CREATE TABLE IF NOT EXISTS field_registry (
        id UUID PRIMARY KEY, 
        field_key VARCHAR UNIQUE, 
        field_type VARCHAR, 
        applicable_record_types VARCHAR[], 
        label_en VARCHAR, 
        label_hi VARCHAR, 
        options JSONB, 
        validation_rules JSONB, 
        visible_to_levels VARCHAR[] DEFAULT ARRAY['PS','DISTRICT','HQ'], 
        editable_by_levels VARCHAR[] DEFAULT ARRAY['PS'], 
        section VARCHAR, 
        sort_order INT DEFAULT 0, 
        is_active BOOLEAN DEFAULT true
      );
    `);
    logger.info('Table field_registry created or verified');

    // 4. records
    await db.raw(`
      CREATE TABLE IF NOT EXISTS records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
        record_type VARCHAR, 
        ps_id UUID REFERENCES hierarchy_nodes(id), 
        district_id UUID REFERENCES hierarchy_nodes(id), 
        data JSONB DEFAULT '{}', 
        current_status VARCHAR DEFAULT 'DRAFT', 
        current_level VARCHAR DEFAULT 'PS', 
        version INT DEFAULT 1, 
        created_by UUID REFERENCES users(id), 
        created_at TIMESTAMPTZ DEFAULT NOW(), 
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    logger.info('Table records created or verified');

    // 5. record_revisions
    await db.raw(`
      CREATE TABLE IF NOT EXISTS record_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
        record_id UUID REFERENCES records(id), 
        revision_number INT, 
        changed_by UUID REFERENCES users(id), 
        changed_at TIMESTAMPTZ DEFAULT NOW(), 
        level VARCHAR, 
        change_type VARCHAR, 
        field_changes JSONB DEFAULT '[]', 
        comment TEXT, 
        ip_address INET
      );
    `);
    logger.info('Table record_revisions created or verified');

    // 6. workflow_transitions
    await db.raw(`
      CREATE TABLE IF NOT EXISTS workflow_transitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
        record_id UUID REFERENCES records(id), 
        from_status VARCHAR, 
        to_status VARCHAR, 
        action VARCHAR, 
        performed_by UUID REFERENCES users(id), 
        performed_at TIMESTAMPTZ DEFAULT NOW(), 
        comment TEXT, 
        target_fields VARCHAR[]
      );
    `);
    logger.info('Table workflow_transitions created or verified');

    // 7. compilations
    await db.raw(`
      CREATE TABLE IF NOT EXISTS compilations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
        district_id UUID REFERENCES hierarchy_nodes(id), 
        period DATE, 
        status VARCHAR DEFAULT 'DRAFT', 
        record_ids UUID[], 
        compiled_summary JSONB, 
        submitted_by UUID REFERENCES users(id), 
        submitted_at TIMESTAMPTZ, 
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    logger.info('Table compilations created or verified');

    // 8. report_jobs
    await db.raw(`
      CREATE TABLE IF NOT EXISTS report_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
        requested_by UUID REFERENCES users(id), 
        template_id VARCHAR, 
        filters JSONB, 
        format VARCHAR, 
        status VARCHAR DEFAULT 'pending', 
        file_path VARCHAR, 
        created_at TIMESTAMPTZ DEFAULT NOW(), 
        completed_at TIMESTAMPTZ
      );
    `);
    logger.info('Table report_jobs created or verified');

    // 9. notifications
    await db.raw(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
        user_id UUID REFERENCES users(id), 
        type VARCHAR, 
        title VARCHAR, 
        body TEXT, 
        record_id UUID, 
        is_read BOOLEAN DEFAULT false, 
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    logger.info('Table notifications created or verified');

    logger.info('All migrations ran successfully.');
  } catch (err) {
    logger.error(`Migration failed: ${err.message}`);
  } finally {
    await db.destroy();
    process.exit(0);
  }
};

runMigrations();
