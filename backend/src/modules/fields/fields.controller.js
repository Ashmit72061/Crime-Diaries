import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { publish } from '../../events/eventBus.js';

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    // Standard JSON format
    try { return JSON.parse(val); } catch (e) {}
    // PostgreSQL native array notation: {elem1,"elem2",...}
    if (val.startsWith('{') && val.endsWith('}')) {
      const inner = val.slice(1, -1);
      if (!inner.trim()) return [];
      return inner.split(',').map((s) => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
    }
    return val;
  }
  return val;
};

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const SECTION_TITLES = {
  general_info:             { en: 'General Information',                    hi: 'सामान्य जानकारी' },
  basic_details:            { en: 'Basic Details',                          hi: 'बुनियादी विवरण' },
  incident_details:         { en: 'Incident Details',                       hi: 'घटना का विवरण' },
  investigation_details:    { en: 'Investigation Details',                  hi: 'जांच का विवरण' },
  complainant_accused_info: { en: 'Complainant & Accused',                  hi: 'शिकायतकर्ता और आरोपी' },
  investigation_officer:    { en: 'Investigating Officer',                  hi: 'जांच अधिकारी' },
  property_status:          { en: 'Property & Case Status',                 hi: 'संपत्ति और स्थिति' },
  intranet_flags:           { en: 'System Reference Flags',                 hi: 'प्रणाली संदर्भ झंडे' },
  linkages:                 { en: 'Case Linkage',                           hi: 'केस लिंकेज' },
  arrestee_info:            { en: 'Arrested Person Particulars',            hi: 'गिरफ्तार व्यक्ति का विवरण' },
  offence_info:             { en: 'Offence Classification',                 hi: 'अपराध वर्गीकरण' },
  procedure_slips:          { en: 'Procedural Slips',                       hi: 'प्रक्रियात्मक पर्ची' },
  custody_status:           { en: 'Custody Status',                         hi: 'हिरासत की स्थिति' },
  informant_contact:        { en: 'Informant Contact',                      hi: 'सूचना प्रदाता संपर्क' },
  complaint_details:        { en: 'Complaint Details',                      hi: 'शिकायत विवरण' },
  response_io:              { en: 'Responding Officers',                    hi: 'प्रतिक्रिया अधिकारी' },
  arrival_geo:              { en: 'Arrival & Geo-Location',                 hi: 'आगमन और भू-स्थान' },
  record_type_select:       { en: 'Register Type & References',             hi: 'पंजीकरण प्रकार' },
  physical_bio:             { en: 'Physical Description',                   hi: 'शारीरिक विवरण' },
  location_particulars:     { en: 'Location Particulars',                   hi: 'स्थान विवरण' },
  contacts_assigned:        { en: 'Contacts & Assigned IO',                 hi: 'संपर्क और IO' },
  person_details:           { en: 'Person Details',                         hi: 'व्यक्ति विवरण' },
  officer_informant:        { en: 'Officers & Informant',                   hi: 'अधिकारी और सूचना प्रदाता' },
  discovery_details:        { en: 'Discovery Details',                      hi: 'बरामदगी का विवरण' },
  corpse_desc:              { en: 'Corpse Description',                     hi: 'शव विवरण' },
  zipnet_status:            { en: 'ZIPNET & Status',                        hi: 'ज़िपनेट और स्थिति' },
  // ── New sections added from MUT Form spec ───────────────────────────────────
  arrest_details:           { en: 'Arrest Details',                         hi: 'गिरफ्तारी का विवरण' },
  special_scheme:           { en: 'If Arrested During Special Scheme',      hi: 'यदि विशेष योजना के दौरान गिरफ्तार' },
  missing_details:          { en: 'Missing Person Details',                 hi: 'लापता व्यक्ति का विवरण' },
  physical_description:     { en: 'Physical Description',                   hi: 'शारीरिक हुलिया' },
  uidb_details:             { en: 'UIDB Details',                           hi: 'अज्ञात शव विवरण' },
  stolen_property:          { en: 'Stolen Property',                        hi: 'चोरी की गई संपत्ति' },
  recovered_property:       { en: 'Recovered Property',                     hi: 'बरामद संपत्ति' },
};

const VALID_FIELD_TYPES = ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'SELECT', 'BOOLEAN'];
const VALID_RECORD_TYPES = ['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'];

function normalizeRecordType(t) {
  const u = t.toUpperCase();
  if (u === 'CASES') return 'CASE';
  if (u === 'ARRESTS') return 'ARREST';
  if (u === 'PCR' || u === 'PCR_CALLS') return 'PCR_CALL';
  if (u === 'MISSING_PERSONS' || u === 'MISSING_PERSON') return 'MISSING';
  return u;
}

// ── GET /fields/form/:record_type ─────────────────────────────────────────────
export const getFieldsForForm = async (req, res) => {
  const { record_type } = req.params;
  const district_id = req.user.district_id || null;

  const normalizedType = normalizeRecordType(record_type);

  try {
    let query = db('field_registry')
      .where({ is_active: true })
      .orderBy('sort_order', 'asc');

    // Scope filter: always include global; include district fields if user belongs to one
    query = query.where(function () {
      this.where('scope_level', 'global');
      if (district_id) {
        this.orWhere({ scope_level: 'district', scope_id: district_id });
      }
    });

    const rawFields = await query;

    // Filter by applicable_record_types (JS-side, handles both native array and JSON-string storage)
    const filteredFields = rawFields
      .filter((f) => {
        const types = (parseJsonField(f.applicable_record_types) || []).map(normalizeRecordType);
        return types.includes(normalizedType);
      })
      .map((f) => ({
        id: f.id,
        field_key: f.field_key,
        field_type: f.field_type,
        applicable_record_types: parseJsonField(f.applicable_record_types),
        label_en: f.label_en,
        label_hi: f.label_hi || f.label_en,
        placeholder_en: f.placeholder_en || null,
        placeholder_hi: f.placeholder_hi || null,
        options: parseJsonField(f.options),
        validation_rules: parseJsonField(f.validation_rules),
        visible_to_levels: parseJsonField(f.visible_to_levels),
        editable_by_levels: parseJsonField(f.editable_by_levels),
        introduced_at_level: f.introduced_at_level,
        readonly: f.readonly || false,
        full_width: f.full_width || false,
        show_when: parseJsonField(f.show_when) || null,
        section: f.section || 'general_info',
        section_label_en: f.section_label_en || null,
        section_label_hi: f.section_label_hi || null,
        sort_order: f.sort_order,
        scope_level: f.scope_level || 'global',
      }));

    // Group by section, using DB-stored labels > hardcoded map > toTitleCase fallback
    const sectionsMap = new Map();
    for (const f of filteredFields) {
      const secKey = f.section;
      if (!sectionsMap.has(secKey)) {
        sectionsMap.set(secKey, { fields: [], dbLabelEn: f.section_label_en, dbLabelHi: f.section_label_hi });
      }
      sectionsMap.get(secKey).fields.push(f);
    }

    const sections = [];
    for (const [sectionKey, { fields, dbLabelEn, dbLabelHi }] of sectionsMap.entries()) {
      const hardcoded = SECTION_TITLES[sectionKey];
      sections.push({
        section: sectionKey,
        title_en: dbLabelEn || hardcoded?.en || toTitleCase(sectionKey),
        title_hi: dbLabelHi || hardcoded?.hi || toTitleCase(sectionKey),
        fields,
      });
    }

    return res.status(200).json({ success: true, data: sections });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /fields  (admin: list all; DCP: list own district) ────────────────────
export const listAllFields = async (req, res) => {
  const { role } = req.user;
  const district_id = req.user.district_id || null;
  const { record_type, is_active, scope } = req.query;

  try {
    let query = db('field_registry').select('*');

    if (role === 'DISTRICT_OFFICER') {
      if (scope === 'global') {
        // Read-only access to global fields for section discovery.
        // Write endpoints enforce ownership separately.
        query = query.where('scope_level', 'global');
      } else {
        // Default: only their own district-scoped fields
        query = query.where({ scope_level: 'district', scope_id: district_id });
      }
    } else if (scope === 'global') {
      query = query.where('scope_level', 'global');
    } else if (scope === 'district') {
      query = query.where('scope_level', 'district');
    }
    // default (no scope filter for HQ_ADMIN/SYSTEM_ADMIN): all fields

    if (record_type) {
      const norm = normalizeRecordType(record_type);
      // Works for both native PG array and JSON-string storage
      query = query.whereRaw(`applicable_record_types::text ILIKE ?`, [`%${norm}%`]);
    }

    if (is_active !== undefined) {
      query = query.where('is_active', is_active === 'true' || is_active === true);
    }

    const fields = await query
      .orderBy('scope_level', 'asc')
      .orderBy('section', 'asc')
      .orderBy('sort_order', 'asc');

    const formatted = fields.map((f) => ({
      ...f,
      applicable_record_types: parseJsonField(f.applicable_record_types),
      options: parseJsonField(f.options),
      validation_rules: parseJsonField(f.validation_rules),
    }));

    return res.status(200).json({ success: true, data: { fields: formatted, total: formatted.length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /fields ──────────────────────────────────────────────────────────────
export const createRegistryField = async (req, res) => {
  const { role } = req.user;
  const district_id = req.user.district_id || null;
  const userId      = req.user.id || req.user.userId || null;
  const {
    field_key, label_en, label_hi, field_type,
    section, section_label_en, section_label_hi,
    applicable_record_types, options, validation_rules,
    is_required, sort_order,
  } = req.body;

  if (!field_key || !label_en || !field_type) {
    return res.status(400).json({ success: false, message: 'field_key, label_en, and field_type are required' });
  }
  if (!applicable_record_types?.length) {
    return res.status(400).json({ success: false, message: 'At least one applicable_record_type is required' });
  }
  if (!VALID_FIELD_TYPES.includes(field_type.toUpperCase())) {
    return res.status(400).json({ success: false, message: `field_type must be one of: ${VALID_FIELD_TYPES.join(', ')}` });
  }

  const normalizedKey = field_key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (!normalizedKey) {
    return res.status(400).json({ success: false, message: 'field_key must contain alphanumeric characters' });
  }

  const scope_level = role === 'DISTRICT_OFFICER' ? 'district' : 'global';
  const scope_id    = role === 'DISTRICT_OFFICER' ? district_id : null;

  if (role === 'DISTRICT_OFFICER' && !district_id) {
    return res.status(400).json({
      success: false,
      message: 'District scope could not be resolved. Please log out and log back in.',
    });
  }

  try {
    const existing = await db('field_registry').where('field_key', normalizedKey).first();
    if (existing) {
      return res.status(409).json({ success: false, message: `Field key "${normalizedKey}" already exists` });
    }

    const validationRulesObj = { ...(parseJsonField(validation_rules) || {}) };
    if (is_required) validationRulesObj.required = true;

    const payload = {
      id: uuidv4(),
      field_key: normalizedKey,
      label_en,
      label_hi: label_hi || label_en,
      field_type: field_type.toUpperCase(),
      section: section || 'general_info',
      section_label_en: section_label_en || null,
      section_label_hi: section_label_hi || null,
      applicable_record_types: applicable_record_types.map(normalizeRecordType),
      options: options?.length ? JSON.stringify(options) : null,
      validation_rules: Object.keys(validationRulesObj).length ? JSON.stringify(validationRulesObj) : null,
      visible_to_levels: ['PS', 'DISTRICT', 'HQ'],
      editable_by_levels: ['PS'],
      sort_order: sort_order ?? 0,
      is_active: true,
      scope_level,
      scope_id,
      created_by: userId,
    };

    const [newField] = await db('field_registry').insert(payload).returning('*');

    try {
      await publish('field.created', {
        field_id: newField.id,
        field_key: normalizedKey,
        scope_level,
        scope_id,
        created_by: userId,
        ts: Date.now(),
      });
    } catch (_) { /* event bus optional — do not block response */ }

    return res.status(201).json({ success: true, message: 'Field created', data: newField });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /fields/:id ─────────────────────────────────────────────────────────
export const updateRegistryField = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const district_id = req.user.district_id || null;
  const {
    label_en, label_hi, field_type,
    section, section_label_en, section_label_hi,
    applicable_record_types, options, validation_rules,
    is_required, sort_order,
  } = req.body;

  try {
    const existing = await db('field_registry').where({ id }).first();
    if (!existing) return res.status(404).json({ success: false, message: 'Field not found' });

    if (role === 'DISTRICT_OFFICER') {
      if (existing.scope_level !== 'district' || existing.scope_id !== district_id) {
        return res.status(403).json({ success: false, message: 'Cannot modify fields outside your district' });
      }
    }
    // HQ_ADMIN/SYSTEM_ADMIN can modify any field (allowed by router)

    const updates = {};
    if (label_en)                      updates.label_en = label_en;
    if (label_hi !== undefined)        updates.label_hi = label_hi;
    if (field_type)                    updates.field_type = field_type.toUpperCase();
    if (section)                       updates.section = section;
    if (section_label_en !== undefined) updates.section_label_en = section_label_en;
    if (section_label_hi !== undefined) updates.section_label_hi = section_label_hi;
    if (applicable_record_types?.length) {
      updates.applicable_record_types = applicable_record_types.map(normalizeRecordType);
    }
    if (options !== undefined)         updates.options = options?.length ? JSON.stringify(options) : null;
    if (sort_order !== undefined)      updates.sort_order = sort_order;

    if (is_required !== undefined || validation_rules !== undefined) {
      const base = parseJsonField(existing.validation_rules) || {};
      if (validation_rules !== undefined) Object.assign(base, parseJsonField(validation_rules));
      if (is_required !== undefined)     base.required = !!is_required;
      updates.validation_rules = JSON.stringify(base);
    }

    const [updated] = await db('field_registry').where({ id }).update(updates).returning('*');

    try { await publish('field.updated', { field_id: id, ts: Date.now() }); } catch (_) {}

    return res.status(200).json({ success: true, message: 'Field updated', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /fields/:id/toggle ──────────────────────────────────────────────────
export const toggleRegistryField = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const district_id = req.user.district_id || null;

  try {
    const existing = await db('field_registry').where({ id }).first();
    if (!existing) return res.status(404).json({ success: false, message: 'Field not found' });

    if (role === 'DISTRICT_OFFICER') {
      if (existing.scope_level !== 'district' || existing.scope_id !== district_id) {
        return res.status(403).json({ success: false, message: 'Cannot modify fields outside your district' });
      }
    }

    const [updated] = await db('field_registry')
      .where({ id })
      .update({ is_active: !existing.is_active })
      .returning('id, is_active');

    return res.status(200).json({
      success: true,
      message: `Field ${updated.is_active ? 'activated' : 'deactivated'}`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
