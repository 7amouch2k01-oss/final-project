const Application  = require('../models/Application');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const Institution  = require('../models/Institution');
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
const apply = async ({ applicantId, targetId, targetType, targetModel: targetModelFromReq, selectedProgramme, coverLetter, documents: docUrls, cvUrl }, docBuffers, io) => {
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
    const e = new Error('Listing not found or has expired / closed');
    e.statusCode = 404;
    throw e;
  }

  // Check application date expiration if set
  if (listing.applicationEndDate && new Date(listing.applicationEndDate) < new Date()) {
    const e = new Error('Application deadline for this listing has ended');
    e.statusCode = 400;
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

  // Auto-attach user's profile CV if available
  const applicantUser = await User.findById(applicantId).select('name email cvUrl avatar role');
  if (documents.length === 0 && applicantUser?.cvUrl) {
    documents.push(applicantUser.cvUrl);
  }

  // 4. Create application
  const targetModel = resolved.name;
  
  let institutionId = listing.institutionId || null;
  let recruiterId = listing.recruiterId || null;

  if (!institutionId && recruiterId) {
    const isInst = await Institution.exists({ _id: recruiterId });
    if (isInst) {
      institutionId = recruiterId;
    }
  }

  const application = await Application.create({
    applicantId,
    targetId,
    targetModel,
    selectedProgramme: selectedProgramme || '',
    institutionId,
    recruiterId,
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
        applicantName: applicantUser?.name || 'An applicant',
        message:       'A new application has been submitted for your listing',
      });
    }
    try {
      await Notification.create({
        userId:  ownerId,
        title:   'New Application Received',
        message: `${applicantUser?.name || 'Applicant'} applied to "${listing.title || listing.name}"`,
        type:    'application_new',
        link:    `/institution/dashboard`,
      });
    } catch (_) {}
  }

  return application;
};

// ── Get applicant's own applications with message threads ─────────────────────
const getMyApplications = async (applicantId) => {
  return Application.find({ applicantId })
    .populate('targetId')
    .populate('institutionId', 'name type logo city country email')
    .populate('recruiterId', 'name email company avatar')
    .sort({ createdAt: -1 });
};

// ── Get all applicants for a listing ──────────────────────────────────────────
const getListingApplicants = async (listingId, reviewerId) => {
  return Application.find({ targetId: listingId })
    .populate('applicantId', 'name email avatar cvUrl skills bio education postBacPath formationDetails baccalaureate experience')
    .sort({ createdAt: -1 });
};

// ── Mark Application As Under Review when Institution/Recruiter opens it ───────
const markUnderReview = async (applicationId, reviewerId, io) => {
  const app = await Application.findById(applicationId).populate('targetId', 'title name');
  if (!app) {
    const e = new Error('Application not found');
    e.statusCode = 404;
    throw e;
  }

  // If status is currently pending, auto-transition to under_review
  if (app.status === 'pending') {
    app.status = 'under_review';
    app.viewedByRecruiterAt = new Date();
    app.statusHistory.push({
      status: 'under_review',
      changedAt: new Date(),
      note: 'Application opened and profile viewed by recruitment team.'
    });
    await app.save();

    // Notify applicant live
    if (io) {
      io.to(app.applicantId.toString()).emit('application:status_changed', {
        applicationId: app._id,
        newStatus: 'under_review',
        listingTitle: app.targetId?.title || app.targetId?.name || 'Your application',
        message: 'Your application is now Under Review by the admissions / hiring team.',
      });
    }

    try {
      await Notification.create({
        userId:  app.applicantId,
        title:   'Application Under Review',
        message: `Your application to "${app.targetId?.title || app.targetId?.name || 'Listing'}" is now being actively reviewed!`,
        type:    'application_status',
        link:    `/dashboard`,
      });
    } catch (_) {}
  }

  return app;
};

// ── Send Message / Meeting Booking / Missing Doc Request ───────────────────────
const sendApplicationMessage = async ({ applicationId, senderId, senderName, senderRole, message, type, missingDocType, meetingDetails }, io) => {
  const app = await Application.findById(applicationId)
    .populate('applicantId', 'name email')
    .populate('targetId', 'title name');

  if (!app) {
    const e = new Error('Application not found');
    e.statusCode = 404;
    throw e;
  }

  const newMsg = {
    sender: senderRole || 'institution',
    senderId,
    senderName: senderName || 'Admissions / Hiring Team',
    message: message || '',
    type: type || 'text',
    missingDocType: missingDocType || '',
    meetingDetails: meetingDetails || null,
    createdAt: new Date(),
  };

  app.messages.push(newMsg);
  await app.save();

  // Notify recipient
  const isFromApplicant = senderRole === 'applicant';
  const recipientId = isFromApplicant 
    ? (app.institutionId || app.recruiterId)
    : app.applicantId;

  if (recipientId && io) {
    io.to(recipientId.toString()).emit('application:message', {
      applicationId: app._id,
      message: newMsg,
      listingTitle: app.targetId?.title || app.targetId?.name,
    });
  }

  if (recipientId) {
    try {
      const notifTitle = type === 'meeting_booking' 
        ? 'Interview / Meeting Scheduled'
        : type === 'file_request'
        ? 'Missing Document Requested'
        : 'New Message on Application';

      await Notification.create({
        userId:  recipientId,
        title:   notifTitle,
        message: message ? message.substring(0, 120) : 'You have an update on your application.',
        type:    'application_message',
        link:    isFromApplicant ? `/institution/dashboard` : `/dashboard`,
      });
    } catch (_) {}
  }

  return app;
};

// ── Upload Missing Document on an Application ─────────────────────────────────
const uploadMissingDocument = async ({ applicationId, applicantId, docUrl }, docBuffer, io) => {
  const app = await Application.findOne({ _id: applicationId, applicantId })
    .populate('applicantId', 'name')
    .populate('targetId', 'title name');

  if (!app) {
    const e = new Error('Application not found');
    e.statusCode = 404;
    throw e;
  }

  let finalUrl = docUrl;
  if (docBuffer) {
    finalUrl = await uploadToCloudinary(docBuffer, 'applications', 'raw');
  }

  if (!finalUrl) {
    const e = new Error('No document provided');
    e.statusCode = 400;
    throw e;
  }

  if (!app.documents.includes(finalUrl)) {
    app.documents.push(finalUrl);
  }

  // Update latest file_request message in the thread
  for (let i = app.messages.length - 1; i >= 0; i--) {
    if (app.messages[i].type === 'file_request' && !app.messages[i].uploadedDocUrl) {
      app.messages[i].uploadedDocUrl = finalUrl;
      break;
    }
  }

  // Add confirmation message
  app.messages.push({
    sender: 'applicant',
    senderId: applicantId,
    senderName: app.applicantId?.name || 'Applicant',
    message: 'Uploaded the requested missing document.',
    type: 'text',
    uploadedDocUrl: finalUrl,
    createdAt: new Date(),
  });

  await app.save();

  // Notify recruiter/institution
  const ownerId = app.institutionId || app.recruiterId;
  if (ownerId && io) {
    io.to(ownerId.toString()).emit('application:doc_uploaded', {
      applicationId: app._id,
      docUrl: finalUrl,
      applicantName: app.applicantId?.name,
    });
  }

  return app;
};

// ── Update Application Status (Accept / Reject) ───────────────────────────────
const updateStatus = async (applicationId, reviewerId, newStatus, note, io) => {
  const allowed = ['pending', 'under_review', 'accepted', 'rejected'];
  if (!allowed.includes(newStatus)) {
    const e = new Error('Invalid status'); e.statusCode = 400; throw e;
  }

  const app = await Application.findById(applicationId).populate('targetId', 'title name');
  if (!app) { const e = new Error('Application not found'); e.statusCode = 404; throw e; }

  app.status = newStatus;
  app.statusHistory.push({ status: newStatus, note: note || `Status updated to ${newStatus}` });
  await app.save();

  // Notify applicant
  const applicantIdStr = app.applicantId.toString();
  const statusLabel = { pending: 'Pending', under_review: 'Under Review', accepted: 'Accepted', rejected: 'Rejected' };

  if (io) {
    io.to(applicantIdStr).emit('application:status_changed', {
      applicationId: app._id,
      newStatus,
      message: `Your application to "${app.targetId?.title || app.targetId?.name || 'Listing'}" was marked as: ${statusLabel[newStatus]}`,
    });
  }

  try {
    await Notification.create({
      userId:  app.applicantId,
      title:   `Application ${statusLabel[newStatus]}`,
      message: `Your application to "${app.targetId?.title || app.targetId?.name || 'Listing'}" status has been updated to: ${statusLabel[newStatus]}`,
      type:    'application_status',
      link:    `/dashboard`,
    });
  } catch (_) {}

  return app;
};

// ── Remove / Withdraw Application ─────────────────────────────────────────────
const withdrawApplication = async (applicationId, applicantId) => {
  const app = await Application.findOneAndDelete({ _id: applicationId, applicantId });
  if (!app) { const e = new Error('Application not found'); e.statusCode = 404; throw e; }
  return { success: true };
};

module.exports = {
  apply,
  getMyApplications,
  getListingApplicants,
  markUnderReview,
  sendApplicationMessage,
  uploadMissingDocument,
  updateStatus,
  withdrawApplication,
};
