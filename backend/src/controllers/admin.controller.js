import bcrypt from 'bcryptjs';
import { getDB } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── User Management ───────────────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req, res) => {
  const db = await getDB();
  const users = await db.all(
    `SELECT u.id, u.username, u.email, u.role, u.is_active as isActive,
            u.district_id as district, d.name as districtName, 
            u.sub_division_id as subDivision, sd.name as subDivisionName, 
            u.station_id as policeStation, ps.name as policeStationName,
            u.created_at as createdAt
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.id
     LEFT JOIN sub_divisions sd ON u.sub_division_id = sd.id
     LEFT JOIN police_stations ps ON u.station_id = ps.id
     ORDER BY u.created_at DESC`
  );
  return res.status(200).json(new ApiResponse(200, { users }, 'Users retrieved successfully'));
});

export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, district, subDivision, policeStation } = req.body;

  if (!username || !email || !password || !role) {
    throw new ApiError(400, 'Username, email, password, and role are required');
  }

  const db = await getDB();

  // Validate existing user
  const existing = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existing) {
    throw new ApiError(400, 'Username or Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.run(
    `INSERT INTO users (username, email, password_hash, role, district_id, sub_division_id, station_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, email, passwordHash, role, district || null, subDivision || null, policeStation || null]
  );

  return res.status(201).json(new ApiResponse(201, { userId: result.lastID }, 'User created successfully'));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role, district, subDivision, policeStation, isActive } = req.body;

  const db = await getDB();
  const target = await db.get('SELECT id FROM users WHERE id = ?', [id]);
  if (!target) throw new ApiError(404, 'User not found');

  await db.run(
    `UPDATE users SET 
      email = COALESCE(?, email), 
      role = COALESCE(?, role), 
      district_id = ?, 
      sub_division_id = ?, 
      station_id = ?, 
      is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [
      email || null,
      role || null,
      district || null,
      subDivision || null,
      policeStation || null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      id
    ]
  );

  return res.status(200).json(new ApiResponse(200, null, 'User updated successfully'));
});

// ── Reference Lists ───────────────────────────────────────────────────────────
export const getJurisdictions = asyncHandler(async (req, res) => {
  const db = await getDB();
  const districts = await db.all('SELECT * FROM districts');
  const subDivisions = await db.all('SELECT * FROM sub_divisions');
  const policeStations = await db.all('SELECT * FROM police_stations');

  // Parse beat list strings in policeStations
  const parsedStations = policeStations.map(ps => ({
    ...ps,
    beatList: JSON.parse(ps.beat_list)
  }));

  return res.status(200).json(
    new ApiResponse(200, { districts, subDivisions, policeStations: parsedStations }, 'Jurisdictions list retrieved')
  );
});

export const getCaseHeads = asyncHandler(async (req, res) => {
  const db = await getDB();
  const caseHeads = await db.all('SELECT * FROM case_heads WHERE is_active = 1');
  const acts = await db.all('SELECT DISTINCT act_name FROM act_sections');
  const sections = await db.all('SELECT * FROM act_sections');

  return res.status(200).json(
    new ApiResponse(200, { caseHeads, acts: acts.map(a => a.act_name), sections }, 'Case Heads and Act sections retrieved')
  );
});

// ── Custom Field Definitions ──────────────────────────────────────────────────
export const createCustomField = asyncHandler(async (req, res) => {
  const { module, fieldKey, fieldLabel, fieldType, options, isRequired, scopeLevel, scopeId } = req.body;

  if (!module || !fieldKey || !fieldLabel || !fieldType || !scopeLevel) {
    throw new ApiError(400, 'Missing custom field definition parameters');
  }

  const db = await getDB();

  // Check if a field with the same key is already defined for this module and scope
  const existing = await db.get(
    `SELECT id FROM custom_field_definitions 
     WHERE module = ? AND field_key = ? 
     AND scope_level = ? AND (scope_id = ? OR (scope_id IS NULL AND ? IS NULL))`,
    [module, fieldKey, scopeLevel, scopeId || null, scopeId || null]
  );

  if (existing) {
    return res.status(201).json(new ApiResponse(201, { definitionId: existing.id }, 'Custom field definition already exists'));
  }

  const optionsJson = options ? JSON.stringify(options) : null;
  const isActive = req.user.role === 'ps' ? 0 : 1;

  const result = await db.run(
    `INSERT INTO custom_field_definitions (module, field_key, field_label, field_type, options_json, is_required, scope_level, scope_id, is_active, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      module, fieldKey, fieldLabel, fieldType, optionsJson, 
      isRequired ? 1 : 0, scopeLevel, scopeId || null, isActive, req.user.id
    ]
  );

  return res.status(201).json(new ApiResponse(201, { definitionId: result.lastID }, 'Custom field definition created'));
});

export const getCustomFields = asyncHandler(async (req, res) => {
  const { module } = req.query;
  const db = await getDB();

  let query = 'SELECT * FROM custom_field_definitions WHERE is_active = 1';
  const params = [];

  if (module) {
    query += ' AND module = ?';
    params.push(module);
  }

  const definitions = await db.all(query, params);
  
  const parsed = definitions.map(d => ({
    ...d,
    isRequired: d.is_required === 1,
    options: d.options_json ? JSON.parse(d.options_json) : null
  }));

  return res.status(200).json(new ApiResponse(200, { customFields: parsed }, 'Custom fields retrieved'));
});

export const deactivateCustomField = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await getDB();

  await db.run('UPDATE custom_field_definitions SET is_active = 0 WHERE id = ?', [id]);
  return res.status(200).json(new ApiResponse(200, null, 'Custom field deactivated successfully'));
});
export const getActiveCustomFieldsForPS = asyncHandler(async (req, res) => {
  const { module } = req.query;
  const { district } = req.user;
  const db = await getDB();

  let query = `
    SELECT * FROM custom_field_definitions 
    WHERE is_active = 1 
    AND (scope_level = 'hq' OR (scope_level = 'district' AND scope_id = ?))
  `;
  const params = [district];

  if (module) {
    query += ' AND module = ?';
    params.push(module);
  }

  const definitions = await db.all(query, params);

  const parsed = definitions.map(d => ({
    id: d.id,
    module: d.module,
    fieldKey: d.field_key,
    fieldLabel: d.field_label,
    fieldType: d.field_type,
    options: d.options_json ? JSON.parse(d.options_json) : null,
    isRequired: d.is_required === 1,
  }));

  return res.status(200).json(new ApiResponse(200, { customFields: parsed }, 'Custom fields scoped to station retrieved'));
});
