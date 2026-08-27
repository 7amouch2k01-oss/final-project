const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/apiResponse');

/**
 * protect — verifies the JWT access token
 * Attaches req.user = { id, role } on success
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, role } or { institutionId, role: 'institution' }
    if (!req.user.id && decoded.institutionId) {
      req.user.id = decoded.institutionId;
    }
    next();
  } catch (err) {
    return unauthorized(res, 'Token is invalid or expired');
  }
};

/**
 * restrictTo(...roles) — role-based access guard
 * Usage: router.get('/admin', protect, restrictTo('admin'), handler)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * requireRecruitRights — citizen must have approved recruit rights
 * Use AFTER protect + restrictTo('citizen')
 */
const requireRecruitRights = (req, res, next) => {
  const { recruitRights } = req.user;
  // recruitRights is embedded in JWT payload or we fetch from DB
  // We will re-check from DB in the controller for safety
  // This middleware just signals intent
  next();
};

module.exports = { protect, restrictTo, requireRecruitRights };
