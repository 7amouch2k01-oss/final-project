const Application  = require('../models/Application');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const University   = require('../models/University');
const Stage        = require('../models/Stage');
const Job          = require('../models/Job');
const { uploadToCloudinary } = require('../config/cloudinary');

// ── Resolve which model owns the listing ──────────────────────────────────────
const getListingModel = (targetType) => {
  if (!targetType) return null;
  const str = String(targetType).trim().toLowerCase();
  if (str === 'university') return { model: University, name: 'University' };
  if (str === 'stage') return { model: Stage, name: 'Stage' };
  if (str === 'job') return { model: Job, name: 'Job' };
  return null;
};

// ── Apply to a listing ────────────────────────────────────────────────────────
const apply = async ({ applicantId, targetId, targetType, targetModel: targetModelFromReq, coverLetter, documents: docUrls, cvUrl }, docBuffers, io) => {
  if (!targetId) {
    const e = new Error('targetId is required to apply');
    e.statusCode = 400;
    throw e;
  }

  // 1. Resolve listing model
  let resolved = getListingModel(targetType) || getListingModel(targetModelFromReq);
  let listing = null;

  if (resolved) {
    listing = await resolved.model.findOne({ _id: targetId, isActive: true, deletedAt: null });
  }

  // Fallback: try searching across all 3 models if targetType was omitted or mismatched
  if (!listing) {
    const [u, s, j] = await Promise.all([
      University.findOne({ _id: targetId, isActive: true, deletedAt: null }),
      Stage.findOne({ _id: targetId, isActive: true, deletedAt: null }),
      Job.findOne({ _id: targetId, isActive: true, deletedAt: null }),
    ]);
    if (u) { listing = u; resolved = { model: University, name: 'University' }; }
    else if (s) { listing = s; resolved = { model: Stage, name: 'Stage' }; }
    else if (j) { listing = j; resolved = { model: Job, name: 'Job' }; }
  }

  if (!listing) {
    const e = new Error('Listing not found or is no longer active');
    e.statusCode = 404;
    throw e;
  }

  // 2. Prevent duplicate applications
  const existing = await Application.findOne({ applicantId, targetId });
  if (existing) {
    const e = new Error('You have already submitted an application to this listing');
    e.statusCode = 409;
    throw e;
  }

  // 3. Collect documents / CV
  let documents = [];

  if (Array.isArray(docUrls)) {
    documents.push(...docUrls.filter(Boolean));
  } else if (typeof docUrls === 'string' && docUrls.trim()) {
    documents.push(docUrls.trim());
  }

  if (cvUrl && typeof cvUrl === 'string' && cvUrl.trim() && !documents.includes(cvUrl.trim())) {
    documents.push(cvUrl.trim());
  }

  // Upload file buffers if any were submitted
  if (docBuffers && docBuffers.length) {
    const uploadedUrls = await Promise.all(
      docBuffers.map(buf => uploadToCloudinary(buf, 'applications', 'raw'))
    );
    documents.push(...uploadedUrls);
  }

  // If no document was attached, auto-attach user's profile CV if available
  if (documents.length === 0) {
    const applicantUser = await User.findById(applicantId).select('cvUrl');
    if (applicantUser?.cvUrl) {
      documents.push(applicantUser.cvUrl);
    }
  }

  // 4. Create application
  const targetModel = resolved.name;
  const application = await Application.create({
    applicantId,
    targetId,
    targetModel,
    institutionId: listing.institutionId || null,
    recruiterId: listing.recruiterId || null,
    coverLetter: coverLetter || '',
    documents,
    statusHistory: [{ status: 'pending', note: 'Application submitted.' }],
  });

  // 5. Notify listing owner
  const ownerId = listing.recruiterId || listing.institutionId;
  if (ownerId) {
    if (io) {
      io.to(ownerId.toString()).emit('application:new', {
        applicationId: application._id,
        targetType:    targetModel,
        listingTitle:  listing.title || listing.name,
        message:       'A new application has been submitted for your listing',
      });
    }
    try {
      await Notification.create({
        userId:  ownerId,
        title:   '📩 New Application',
        message: `Someone applied to "${listing.title || listing.name}"`,
        type:    'application_new',
        link:    `/recruiter/applications/${application._id}`,
      });
    } catch (_) { /* notification failure is non-fatal */ }
  }

  return application;
};

// ── Get applicant's own applications ─────────────────────────────────────────
const getMyApplications = async (applicantId) => {
  return Application.find({ applicantId })
    .populate('targetId')
    .sort({ createdAt: -1 });
};

// ── Get all applicants for a listing (recruiter) ──────────────────────────────
const getListingApplicants = async (listingId, recruiterId) => {
  return Application.find({ targetId: listingId, recruiterId })
    .populate('applicantId', 'name email avatar cvUrl skills bio education experience')
    .sort({ createdAt: -1 });
};

// ── Update application status (recruiter) ─────────────────────────────────────
const updateStatus = async (applicationId, recruiterId, newStatus, note, io) => {
  const allowed = ['pending', 'under_review', 'accepted', 'rejected'];
  if (!allowed.includes(newStatus)) {
    const e = new Error('Invalid status'); e.statusCode = 400; throw e;
  }

  const app = await Application.findOne({ _id: applicationId, recruiterId });
  if (!app) { const e = new Error('Application not found'); e.statusCode = 404; throw e; }

  app.status = newStatus;
  app.statusHistory.push({ status: newStatus, note: note || `Status changed to ${newStatus}` });
  await app.save();

  // Notify applicant via Socket.io + DB
  const applicantIdStr = app.applicantId.toString();
  const statusLabel = { pending: 'Pending', under_review: 'Under Review', accepted: '✅ Accepted', rejected: '❌ Rejected' };

  if (io) {
    io.to(applicantIdStr).emit('application:status_changed', {
      applicationId: app._id,
      newStatus,
      message: `Your application status changed to: ${statusLabel[newStatus]}`,
    });
  }

  await Notification.create({
    userId:  app.applicantId,
    title:   `Application ${statusLabel[newStatus]}`,
    message: `Your application status has been updated to: ${statusLabel[newStatus]}`,
    type:    'application_status',
    link:    `/applications/${app._id}`,
  });

  return app;
};

// ── Remove / Withdraw Application (applicant) ───────────────────────────────
const withdrawApplication = async (applicationId, applicantId) => {
  const app = await Application.findOneAndDelete({ _id: applicationId, applicantId });
  if (!app) { const e = new Error('Application not found'); e.statusCode = 404; throw e; }
  return { success: true };
};

module.exports = {
  apply,
  getMyApplications,
  getListingApplicants,
  updateStatus,
  withdrawApplication,
};
