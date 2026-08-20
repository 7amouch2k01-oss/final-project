const User    = require('../models/User');
const { forbidden, unauthorized } = require('../utils/apiResponse');

/**
 * requireRecruitRights
 * ─────────────────────
 * Use AFTER protect + restrictTo('citizen')
 * Fetches fresh recruit rights status from DB (not JWT)
 * so that approval changes take effect immediately without token refresh
 */
const requireRecruitRights = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('recruitRights isActive role');

    if (!user) return unauthorized(res, 'User not found');
    if (!user.isActive) return forbidden(res, 'Your account has been suspended');
    if (user.role !== 'citizen') return forbidden(res, 'Only citizens can perform this action');

    if (user.recruitRights.status !== 'approved') {
      const statusMessages = {
        none:     'You have not requested recruit rights yet. Request them from your dashboard.',
        pending:  'Your recruit rights request is pending admin approval.',
        rejected: 'Your recruit rights request was rejected. Please contact support.',
      };
      return forbidden(
        res,
        statusMessages[user.recruitRights.status] || 'Recruit rights required'
      );
    }

    // Attach recruit status to req for downstream use
    req.user.recruitRights = user.recruitRights;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireRecruitRights };
