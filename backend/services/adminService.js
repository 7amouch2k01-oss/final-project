const User         = require('../models/User');
const Institution  = require('../models/Institution');
const University   = require('../models/University');
const Stage        = require('../models/Stage');
const Job          = require('../models/Job');
const Application  = require('../models/Application');
const Notification = require('../models/Notification');
const { sendRecruitApprovedEmail } = require('../utils/sendEmail');
const { escapeRegExp } = require('../utils/string');

// ── Platform-wide stats ───────────────────────────────────────────────────────
const getStats = async () => {
  const [
    totalUsers, students, citizens, admins,
    totalInstitutions, pendingInstitutions,
    totalUniversities, totalStages, totalJobs,
    totalApplications, pendingRecruitRequests,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student',  isActive: true }),
    User.countDocuments({ role: 'citizen',  isActive: true }),
    User.countDocuments({ role: 'admin',    isActive: true }),
    Institution.countDocuments({ isActive: true }),
    Institution.countDocuments({ status: 'pending' }),
    University.countDocuments({ isActive: true, deletedAt: null }),
    Stage.countDocuments({ isActive: true, deletedAt: null }),
    Job.countDocuments({ isActive: true, deletedAt: null }),
    Application.countDocuments(),
    User.countDocuments({ role: 'citizen', 'recruitRights.status': 'pending' }),
  ]);

  // New users last 7 days (for chart)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersChart = await User.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Applications last 7 days
  const appChart = await Application.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return {
    users: { total: totalUsers, students, citizens, admins },
    institutions: { total: totalInstitutions, pending: pendingInstitutions },
    listings: { universities: totalUniversities, stages: totalStages, jobs: totalJobs },
    applications: { total: totalApplications },
    pendingRecruitRequests,
    charts: { newUsers: newUsersChart, applications: appChart },
  };
};

// ── Get all users (paginated + filterable) ────────────────────────────────────
const getAllUsers = async (query) => {
  const page   = Math.max(1, parseInt(query.page) || 1);
  const limit  = Math.min(100, parseInt(query.limit) || 50);
  const skip   = (page - 1) * limit;
  const filter = {};
  if (query.role)   filter.role = query.role;
  if (query.search) {
    const safeSearch = escapeRegExp(query.search);
    filter.$or = [
      { name:  new RegExp(safeSearch, 'i') },
      { email: new RegExp(safeSearch, 'i') },
    ];
  }
  // Filter by recruiter rights status
  if (query.recruitRights === 'approved')  filter['recruitRights.status'] = 'approved';
  if (query.recruitRights === 'pending')   filter['recruitRights.status'] = 'pending';
  if (query.recruitRights === 'rejected')  filter['recruitRights.status'] = 'rejected';
  if (query.recruitRights === 'none')      filter['recruitRights.status'] = 'none';

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, total, page, pages: Math.ceil(total / limit) };
};

// ── Change a user's role ──────────────────────────────────────────────────────
const changeUserRole = async (userId, newRole) => {
  const allowed = ['student', 'citizen', 'admin'];
  if (!allowed.includes(newRole)) {
    const e = new Error('Invalid role'); e.statusCode = 400; throw e;
  }
  const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true });
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  return user;
};

// ── Ban / Unban user ──────────────────────────────────────────────────────────
const toggleBan = async (userId, ban) => {
  const user = await User.findByIdAndUpdate(
    userId, { isActive: !ban }, { new: true }
  );
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  return user;
};

// ── Get Institutions List (Admin) ─────────────────────────────────────────────
const getInstitutions = async (query) => {
  const filter = {};
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.type && query.type !== 'all') filter.type = query.type;
  if (query.search) {
    const safe = escapeRegExp(query.search);
    filter.$or = [{ name: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }];
  }

  return Institution.find(filter).sort({ createdAt: -1 });
};

// ── Approve Institution ───────────────────────────────────────────────────────
const approveInstitution = async (instId, io) => {
  const inst = await Institution.findById(instId);
  if (!inst) { const e = new Error('Institution not found'); e.statusCode = 404; throw e; }

  inst.status     = 'approved';
  inst.reviewedAt = new Date();
  await inst.save();

  if (io) {
    io.to(instId.toString()).emit('institution:approved', {
      message: '🎉 Your institution registration has been approved! You can now log into your portal.',
    });
  }

  return inst;
};

// ── Reject Institution ────────────────────────────────────────────────────────
const rejectInstitution = async (instId, reason, io) => {
  const inst = await Institution.findById(instId);
  if (!inst) { const e = new Error('Institution not found'); e.statusCode = 404; throw e; }

  inst.status          = 'rejected';
  inst.reviewedAt      = new Date();
  inst.rejectionReason = reason || 'Registration application was not approved';
  await inst.save();

  return inst;
};

// ── Get pending recruit requests ──────────────────────────────────────────────
const getPendingRecruitRequests = async () => {
  return User.find({ role: 'citizen', 'recruitRights.status': 'pending' })
    .select('name email avatar company recruitRights createdAt')
    .sort({ 'recruitRights.requestedAt': 1 });
};

// ── Approve recruit rights ────────────────────────────────────────────────────
const approveRecruit = async (userId, adminId, io) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }

  user.recruitRights.status     = 'approved';
  user.recruitRights.reviewedAt = new Date();
  await user.save();

  // Real-time
  if (io) {
    io.to(userId.toString()).emit('recruit:approved', {
      message: '🎉 Your recruit rights have been approved! You can now post listings.',
    });
  }

  // DB notification
  await Notification.create({
    userId: user._id,
    title:  '✅ Recruit Rights Approved',
    message: 'Your request to post listings on TuniJob has been approved.',
    type:   'recruit_approved',
    link:   '/citizen/dashboard',
  });

  // Email
  await sendRecruitApprovedEmail(user.email, user.name).catch(() => {});

  return user;
};

// ── Reject recruit rights ─────────────────────────────────────────────────────
const rejectRecruit = async (userId, reason, io) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }

  user.recruitRights.status          = 'rejected';
  user.recruitRights.reviewedAt      = new Date();
  user.recruitRights.rejectionReason = reason || 'Request did not meet requirements';
  await user.save();

  if (io) {
    io.to(userId.toString()).emit('recruit:rejected', {
      message: 'Your recruit rights request was not approved.',
      reason:  user.recruitRights.rejectionReason,
    });
  }

  await Notification.create({
    userId: user._id,
    title:  '❌ Recruit Rights Rejected',
    message: `Your request was rejected. Reason: ${user.recruitRights.rejectionReason}`,
    type:   'recruit_rejected',
    link:   '/citizen/dashboard',
  });

  return user;
};

// ── Broadcast notification ────────────────────────────────────────────────────
const broadcastNotification = async ({ title, message, targetRole, link }, adminId, io) => {
  const filter = targetRole && targetRole !== 'all' ? { role: targetRole } : {};
  const users  = await User.find(filter).select('_id');

  await Notification.insertMany(users.map(u => ({
    userId: u._id, title, message, type: 'broadcast', link: link || '/',
    senderId: adminId,
  })));

  if (io) io.emit('notification:broadcast', { title, message });

  return { sent: users.length };
};

// ── All listings overview ─────────────────────────────────────────────────────
const getAllListings = async (query) => {
  const page  = Math.max(1, parseInt(query.page) || 1);
  const limit = 20;
  const skip  = (page - 1) * limit;
  const type  = query.type;

  if (type === 'university') {
    const data = await University.find({ deletedAt: null }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('recruiterId', 'name email');
    const total = await University.countDocuments({ deletedAt: null });
    return { data, total, type };
  }
  if (type === 'stage') {
    const data = await Stage.find({ deletedAt: null }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('recruiterId', 'name email');
    const total = await Stage.countDocuments({ deletedAt: null });
    return { data, total, type };
  }
  // default: jobs
  const data  = await Job.find({ deletedAt: null }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('recruiterId', 'name email');
  const total = await Job.countDocuments({ deletedAt: null });
  return { data, total, type: 'job' };
};

// ── Delete / Archive Listing (Admin) ──────────────────────────────────────────
const deleteListing = async (type, id) => {
  if (type === 'university') {
    await University.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false });
  } else if (type === 'stage') {
    await Stage.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false });
  } else {
    await Job.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false });
  }
  return { success: true };
};

module.exports = {
  getStats, getAllUsers, changeUserRole, toggleBan,
  getInstitutions, approveInstitution, rejectInstitution,
  getPendingRecruitRequests, approveRecruit, rejectRecruit,
  broadcastNotification, getAllListings, deleteListing,
};
