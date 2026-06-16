import { ApiError } from '../utils/ApiError.js';
import { getDB } from '../config/db.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied: Insufficient privileges'));
    }
    next();
  };
};

export const enforceJurisdictionScope = (req, res, next) => {
  const { role, district, subDivision, policeStation } = req.user;

  if (role === 'hq' || role === 'admin') {
    req.jurisdictionQuery = {};
    return next();
  }

  req.jurisdictionQuery = {};

  if (role === 'dcp') {
    if (!district) {
      return next(new ApiError(403, 'User is not bound to a district'));
    }
    req.jurisdictionQuery.district_id = district;
    req.query.district_id = district;
  } else if (role === 'acp') {
    if (!subDivision) {
      return next(new ApiError(403, 'User is not bound to a sub-division'));
    }
    req.jurisdictionQuery.sub_division_id = subDivision;
    req.query.sub_division_id = subDivision;
  } else if (role === 'ps') {
    if (!policeStation) {
      return next(new ApiError(403, 'User is not bound to a police station'));
    }
    req.jurisdictionQuery.ps_id = policeStation;
    req.query.ps_id = policeStation;
  } else {
    return next(new ApiError(403, 'Unauthorized role for operational records'));
  }

  next();
};

export const verifyRecordJurisdiction = async (metaId, user) => {
  const { role, district, subDivision, policeStation } = user;

  if (role === 'hq' || role === 'admin') return true;

  const db = await getDB();
  const meta = await db.get(
    `SELECT m.*, ps.sub_division_id 
     FROM daily_records_meta m 
     JOIN police_stations ps ON m.ps_id = ps.id 
     WHERE m.id = ?`,
    [metaId]
  );

  if (!meta) throw new ApiError(404, 'Operational records envelope not found');

  if (role === 'dcp' && meta.district_id !== district) {
    throw new ApiError(403, 'Access Denied: Record falls outside your district scope');
  }

  if (role === 'acp' && meta.sub_division_id !== subDivision) {
    throw new ApiError(403, 'Access Denied: Record falls outside your sub-division scope');
  }

  if (role === 'ps' && meta.ps_id !== policeStation) {
    throw new ApiError(403, 'Access Denied: Record falls outside your police station scope');
  }

  return true;
};
