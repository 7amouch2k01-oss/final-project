const User         = require('../models/User');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../config/cloudinary');

// ── Get current user profile ────────────────────────────────────────────────
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  return user;
};

// ── Update profile with Baccalaureate gate check ────────────────────────────
const updateProfile = async (userId, fields) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }

  // Allowed fields
  const allowed = ['name', 'bio', 'skills', 'languages', 'education', 'experience', 'company', 'baccalaureate', 'cvUrl', 'avatar'];
  allowed.forEach(f => {
    if (fields[f] !== undefined) user[f] = fields[f];
  });

  // Check if profile is complete
  if (user.role === 'student') {
    // For students, Baccalaureate info & proof document are MANDATORY
    const bac = user.baccalaureate || {};
    const hasBac = bac.school && bac.year && bac.section && bac.proofDocUrl;
    user.isProfileComplete = !!(hasBac && user.name);
  } else {
    // For citizens, name & experience/skills/company mark completeness
    user.isProfileComplete = !!(user.name && (user.experience?.length > 0 || user.skills?.length > 0 || user.company?.name));
  }

  await user.save();
  return user;
};

// ── Upload generic document (Baccalaureate proof, graduation certificate, experience cert)
const uploadDocument = async (fileBuffer, folder = 'documents', mimeType = 'application/pdf') => {
  const url = await uploadToCloudinary(fileBuffer, folder, 'auto', mimeType);
  return url;
};

// ── Upload avatar ────────────────────────────────────────────────────────────
const uploadAvatar = async (userId, fileBuffer, mimeType) => {
  const url  = await uploadToCloudinary(fileBuffer, 'avatars', 'image', mimeType);
  const user = await User.findByIdAndUpdate(userId, { avatar: url }, { new: true });
  return user;
};

// ── Upload CV ────────────────────────────────────────────────────────────────
const uploadCV = async (userId, fileBuffer, mimeType) => {
  const url  = await uploadToCloudinary(fileBuffer, 'cvs', 'auto', mimeType);
  const user = await User.findByIdAndUpdate(userId, { cvUrl: url }, { new: true });
  return user;
};

// ── Graduate (student → citizen) ─────────────────────────────────────────────
const graduate = async (userId, io) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  if (user.role !== 'student') {
    const e = new Error('Only students can graduate'); e.statusCode = 400; throw e;
  }

  user.role           = 'citizen';
  user.graduationDate = new Date();
  await user.save();

  // Save notification to DB
  await Notification.create({
    userId: user._id,
    title:   '🎓 Congratulations!',
    message: 'You have graduated and now have full access to TuniJob.',
    type:    'graduation',
    link:    '/dashboard',
  });

  // Real-time event
  if (io) {
    io.to(user._id.toString()).emit('graduation:confirmed', {
      message: 'Your role has been upgraded to Citizen. Welcome to TuniJob!',
    });
  }

  return user;
};

// ── Request recruit rights ────────────────────────────────────────────────────
const requestRecruitRights = async (userId, io) => {
  const user = await User.findById(userId);
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }
  if (user.role !== 'citizen' && user.role !== 'admin') {
    const e = new Error('Only citizens can request recruit rights'); e.statusCode = 400; throw e;
  }

  const { status } = user.recruitRights;
  if (status === 'approved') {
    const e = new Error('You already have recruit rights'); e.statusCode = 400; throw e;
  }
  if (status === 'pending') {
    const e = new Error('Your request is already under review'); e.statusCode = 400; throw e;
  }

  user.recruitRights.status      = 'pending';
  user.recruitRights.requestedAt = new Date();
  await user.save();

  // Notify admin room in real-time
  if (io) {
    io.to('admin').emit('recruit:request_received', {
      userId:   user._id,
      userName: user.name,
      email:    user.email,
      message:  `${user.name} has requested recruit rights`,
    });
  }

  // Notify admin users in DB
  const admins = await User.find({ role: 'admin' }).select('_id');
  if (admins.length) {
    await Notification.insertMany(admins.map(a => ({
      userId:  a._id,
      title:   '📋 New Recruit Request',
      message: `${user.name} (${user.email}) has requested recruit rights.`,
      type:    'recruit_request',
      link:    '/admin/recruit-requests',
    })));
  }

  return user;
};

// ── Save / unsave a job ───────────────────────────────────────────────────────
const toggleSaveJob = async (userId, jobId, save) => {
  const update = save
    ? { $addToSet: { savedJobs: jobId } }
    : { $pull:     { savedJobs: jobId } };
  const user = await User.findByIdAndUpdate(userId, update, { new: true });
  return user;
};

// ── Get saved jobs ────────────────────────────────────────────────────────────
const getSavedJobs = async (userId) => {
  const user = await User.findById(userId).populate({
    path:   'savedJobs',
    match:  { isActive: true },
    select: 'title company location type salary contractType createdAt',
  });
  return user ? user.savedJobs : [];
};

module.exports = {
  getMe, updateProfile, uploadAvatar, uploadCV, uploadDocument,
  graduate, requestRecruitRights, toggleSaveJob, getSavedJobs,
};
