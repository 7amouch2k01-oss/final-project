const Application  = require('../models/Application');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../config/cloudinary');

// ── Resolve which model owns the listing ──────────────────────────────────────
const getListingModel = (targetType) => {
  const map = { University: 'University', Stage: 'Stage', Job: 'Job' };
  if (!map[targetType]) { const e = new Error('Invalid target type'); e.statusCode = 400; throw e; }
  return require('../models/' + map[targetType]);
};

// ── Apply to a listing ────────────────────────────────────────────────────────
const apply = async ({ applicantId, targetId, targetType, targetModel: targetModelFromReq, coverLetter }, docBuffers, io) => {
  // 1. Verify listing exists and is active
  const ListingModel = getListingModel(targetType);
  const listing = await ListingModel.findOne({ _id: targetId, isActive: true, deletedAt: null });
  if (!listing) { const e = new Error('Listing not found or no longer active'); e.statusCode = 404; throw e; }

  // 2. Prevent duplicate applications (unique index handles this too)
  const existing = await Application.findOne({ applicantId, targetId });
  if (existing) { const e = new Error('You have already applied to this listing'); e.statusCode = 409; throw e; }

  // 3. Upload documents to Cloudinary
  let documents = [];
  if (docBuffers && docBuffers.length) {
    documents = await Promise.all(
      docBuffers.map(buf => uploadToCloudinary(buf, 'applications', 'raw'))
    );
  }

  // 4. Create application — resolve targetModel (required by Mongoose polymorphic refPath)
  const resolvedModel = targetModelFromReq || targetType
    || (listing.tuitionFee !== undefined ? 'University' : listing.domain !== undefined ? 'Stage' : 'Job');

  const application = await Application.create({
    applicantId,
    targetId,
    targetModel: resolvedModel,
    institutionId: listing.institutionId || null,
    recruiterId: listing.recruiterId || null,
    coverLetter,
    documents,
    statusHistory: [{ status: 'pending' }],
  });

  // 5. Notify listing owner (recruiter or institution) if available
  const ownerId = listing.recruiterId || listing.institutionId;
  if (ownerId) {
    if (io) {
      io.to(ownerId.toString()).emit('application:new', {
        applicationId: application._id,
        targetType:    resolvedModel,
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
  app.statusHistory.push({ status: newStatus, note });
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
