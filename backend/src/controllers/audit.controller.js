import { getDB } from '../config/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, username, actionType, tableName } = req.query;
  const db = await getDB();

  let query = `
    SELECT a.*, u.username as user_name, u.email as user_email
    FROM audit_logs a
    JOIN users u ON a.changed_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (tableName) {
    query += ' AND a.table_name = ?';
    params.push(tableName);
  }

  if (actionType) {
    query += ' AND a.action = ?';
    params.push(actionType);
  }

  if (username) {
    query += ' AND u.username LIKE ?';
    params.push(`%${username}%`);
  }

  if (dateFrom) {
    query += ' AND a.changed_at >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    query += ' AND a.changed_at <= ?';
    params.push(dateTo);
  }

  query += ' ORDER BY a.changed_at DESC LIMIT 500';

  const logs = await db.all(query, params);

  return res.status(200).json(new ApiResponse(200, { logs }, 'Audit logs retrieved successfully'));
});
