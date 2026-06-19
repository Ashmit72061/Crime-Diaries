import db from '../config/db.js';

export const allow = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        success: false,
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

export const requireRole = (...roles) => allow(...roles);


export const enforceScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { role, ps_id, district_id, sub_div_id } = req.user;
  req.jurisdictionQuery = {};

  if (role === 'HC' || role === 'SHO') {
    if (!ps_id) {
      return res.status(403).json({ success: false, message: 'User is not bound to a Police Station' });
    }
    req.jurisdictionQuery.ps_id = ps_id;
  } else if (role === 'DISTRICT_OFFICER') {
    if (!district_id) {
      return res.status(403).json({ success: false, message: 'User is not bound to a District' });
    }
    req.jurisdictionQuery.district_id = district_id;
  } else if (role === 'ACP') { // If ACP role is used in sub-divisions
    if (!sub_div_id) {
      return res.status(403).json({ success: false, message: 'User is not bound to a Sub-Division' });
    }
    req.jurisdictionQuery.sub_div_id = sub_div_id;
  }

  // HQ_ANALYST, HQ_ADMIN, and SYSTEM_ADMIN roles have global scoping, so req.jurisdictionQuery is empty.
  next();
};

export const verifyRecordAccess = async (recordId, user) => {
  const { role, ps_id, district_id, sub_div_id } = user;
  if (['HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role)) {
    return true;
  }

  const record = await db('records').where({ id: recordId }).first();
  if (!record) {
    throw new Error('Record not found');
  }

  if ((role === 'HC' || role === 'SHO') && record.ps_id !== ps_id) {
    throw new Error('Access denied: Record falls outside your police station jurisdiction');
  }

  if (role === 'ACP' && record.sub_div_id !== sub_div_id) {
    throw new Error('Access denied: Record falls outside your sub-division jurisdiction');
  }

  if (role === 'DISTRICT_OFFICER' && record.district_id !== district_id) {
    throw new Error('Access denied: Record falls outside your district jurisdiction');
  }

  return true;
};
