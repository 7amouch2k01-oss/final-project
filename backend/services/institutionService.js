const Institution = require('../models/Institution');
const Application = require('../models/Application');
const University  = require('../models/University');
const Stage       = require('../models/Stage');
const Job         = require('../models/Job');
const User        = require('../models/User');
const Notification= require('../models/Notification');
const { generateAccessToken, generateRefreshToken, setRefreshCookie } = require('../utils/generateToken');
const { uploadToCloudinary } = require('../config/cloudinary');

// ── Register Institution ───────────────────────────────────────────────────
const register = async ({ name, type, email, password, location, country, website, phone, description }) => {
  const existing = await Institution.findOne({ email });
  if (existing) {
    const err = new Error('An institution with this official email already exists');
    err.statusCode = 409;
    throw err;
  }

  const institution = await Institution.create({
    name,
    type,
    email,
    password,
    location,
    country: country || 'Tunisia',
    website,
    phone,
    description,
    status: 'pending', // Requires admin approval
  });

  return institution;
};

// ── Login Institution ──────────────────────────────────────────────────────
const login = async ({ email, password }, res) => {
  const inst = await Institution.findOne({ email }).select('+password');
  if (!inst) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await inst.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!inst.isActive) {
    const err = new Error('This institution account has been suspended');
    err.statusCode = 403;
    throw err;
  }

  if (inst.status === 'pending') {
    const err = new Error('Your institution registration is pending Admin review and approval. You will receive an update once approved.');
    err.statusCode = 403;
    throw err;
  }

  if (inst.status === 'rejected') {
    const err = new Error(`Registration rejected: ${inst.rejectionReason || 'Contact support for details'}`);
    err.statusCode = 403;
    throw err;
  }

  const accessToken  = generateAccessToken(inst._id, 'institution');
  const refreshToken = generateRefreshToken(inst._id);
  if (res) setRefreshCookie(res, refreshToken);

  return { accessToken, institution: inst.toPublicProfile() };
};

// ── Get Overview / Stats for Institution Dashboard ─────────────────────────
const getDashboardStats = async (institutionId) => {
  const inst = await Institution.findById(institutionId);
  if (!inst) { const e = new Error('Institution not found'); e.statusCode = 404; throw e; }

  // Count active listings based on type
  const [unisCount, stagesCount, jobsCount] = await Promise.all([
    University.countDocuments({ recruiterId: institutionId, isActive: true }),
    Stage.countDocuments({ recruiterId: institutionId, isActive: true }),
    Job.countDocuments({ recruiterId: institutionId, isActive: true }),
  ]);

  // Count applications
  const [totalApps, pendingApps, acceptedApps, rejectedApps] = await Promise.all([
    Application.countDocuments({ institutionId }),
    Application.countDocuments({ institutionId, status: 'pending' }),
    Application.countDocuments({ institutionId, status: 'accepted' }),
    Application.countDocuments({ institutionId, status: 'rejected' }),
  ]);

  return {
    institution: inst.toPublicProfile(),
    stats: {
      totalListings: unisCount + stagesCount + jobsCount,
      unisCount,
      stagesCount,
      jobsCount,
      totalApps,
      pendingApps,
      acceptedApps,
      rejectedApps,
    },
  };
};

// ── Get Applicants for this Institution ────────────────────────────────────
const getApplicants = async (institutionId, { status, search, limit = 50 }) => {
  const query = { institutionId };
  if (status && status !== 'all') query.status = status;

  const applications = await Application.find(query)
    .populate({
      path: 'applicantId',
      select: 'name email avatar bio skills languages education experience baccalaureate cvUrl graduationDate',
    })
    .populate('targetId')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return applications;
};

// ── Update Application Status (Approve, Reject, Pending + Notes) ───────────
const updateApplicationStatus = async (institutionId, applicationId, { status, recruiterNote }, io) => {
  const app = await Application.findOne({ _id: applicationId, institutionId })
    .populate('applicantId', 'name email');

  if (!app) {
    const e = new Error('Application not found');
    e.statusCode = 404;
    throw e;
  }

  app.status = status;
  if (recruiterNote !== undefined) app.recruiterNote = recruiterNote;

  app.statusHistory.push({
    status,
    note: recruiterNote || `Status changed to ${status}`,
    changedAt: new Date(),
  });

  await app.save();

  // Create notification for student/candidate
  if (app.applicantId?._id) {
    const notif = await Notification.create({
      userId: app.applicantId._id,
      title: `Application ${status.toUpperCase()}`,
      message: `Your application has been marked as ${status}. ${recruiterNote ? `Note: ${recruiterNote}` : ''}`,
      type: 'application_status',
      link: '/dashboard',
    });

    if (io) {
      io.to(app.applicantId._id.toString()).emit('application:updated', {
        applicationId: app._id,
        status,
        message: notif.message,
      });
    }
  }

  return app;
};

// ── Get Listings Created by Institution ────────────────────────────────────
const getListings = async (institutionId) => {
  const [unis, stages, jobs] = await Promise.all([
    University.find({ recruiterId: institutionId, deletedAt: null }).sort({ createdAt: -1 }),
    Stage.find({ recruiterId: institutionId, deletedAt: null }).sort({ createdAt: -1 }),
    Job.find({ recruiterId: institutionId, deletedAt: null }).sort({ createdAt: -1 }),
  ]);

  return { universities: unis, stages, jobs };
};

// ── Create Listing ─────────────────────────────────────────────────────────
const createListing = async (institution, { type, data }) => {
  data.recruiterId = institution._id;

  if (type === 'university' || institution.type === 'university' || institution.type === 'school') {
    if (type === 'stage') {
      const stage = await Stage.create({ ...data, company: institution.name });
      return { type: 'stage', item: stage };
    }
    const uni = await University.create({
      name: institution.name,
      country: institution.country || 'Tunisia',
      city: institution.location || 'Tunis',
      logo: institution.logo,
      ...data,
    });
    return { type: 'university', item: uni };
  }

  if (type === 'stage') {
    const stage = await Stage.create({
      company: institution.name,
      companyLogo: institution.logo,
      ...data,
    });
    return { type: 'stage', item: stage };
  }

  // default to Job
  const job = await Job.create({
    company: institution.name,
    companyLogo: institution.logo,
    ...data,
  });
  return { type: 'job', item: job };
};

// ── Delete / Archive Listing ───────────────────────────────────────────────
const deleteListing = async (institutionId, type, id) => {
  if (type === 'university') {
    await University.findOneAndUpdate({ _id: id, recruiterId: institutionId }, { deletedAt: new Date(), isActive: false });
  } else if (type === 'stage') {
    await Stage.findOneAndUpdate({ _id: id, recruiterId: institutionId }, { deletedAt: new Date(), isActive: false });
  } else if (type === 'job') {
    await Job.findOneAndUpdate({ _id: id, recruiterId: institutionId }, { deletedAt: new Date(), isActive: false });
  }
  return { success: true };
};

module.exports = {
  register,
  login,
  getDashboardStats,
  getApplicants,
  updateApplicationStatus,
  getListings,
  createListing,
  deleteListing,
};
