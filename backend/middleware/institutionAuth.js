const jwt = require('jsonwebtoken');
const Institution = require('../models/Institution');
const { unauthorized, forbidden } = require('../utils/apiResponse');

const protectInstitution = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No institution token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.role !== 'institution' && !decoded.institutionId) {
      return unauthorized(res, 'Invalid token for institution access');
    }

    const institution = await Institution.findById(decoded.id || decoded.institutionId);
    if (!institution || !institution.isActive) {
      return unauthorized(res, 'Institution not found or inactive');
    }

    if (institution.status !== 'approved') {
      return forbidden(res, `Institution account is currently ${institution.status}. Admin approval is required.`);
    }

    req.institution = institution;
    next();
  } catch (err) {
    return unauthorized(res, 'Institution session is invalid or expired');
  }
};

module.exports = { protectInstitution };
