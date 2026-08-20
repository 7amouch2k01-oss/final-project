const userService = require('../services/userService');
const { success, created } = require('../utils/apiResponse');
const { upload } = require('../config/cloudinary');

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    success(res, { user: user.toPublicProfile() });
  } catch (e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    success(res, { user: user.toPublicProfile() }, 'Profile updated');
  } catch (e) { next(e); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return require('../utils/apiResponse').badRequest(res, 'No file uploaded');
    const user = await userService.uploadAvatar(req.user.id, req.file.buffer);
    success(res, { avatar: user.avatar }, 'Avatar updated');
  } catch (e) { next(e); }
};

const uploadCV = async (req, res, next) => {
  try {
    if (!req.file) return require('../utils/apiResponse').badRequest(res, 'No file uploaded');
    const user = await userService.uploadCV(req.user.id, req.file.buffer);
    success(res, { cvUrl: user.cvUrl }, 'CV updated');
  } catch (e) { next(e); }
};

const graduate = async (req, res, next) => {
  try {
    const io   = req.app.get('io');
    const user = await userService.graduate(req.user.id, io);
    success(res, { user: user.toPublicProfile() }, '🎓 Congratulations! You are now a Citizen on TuniJob.');
  } catch (e) { next(e); }
};

const requestRecruitRights = async (req, res, next) => {
  try {
    const io   = req.app.get('io');
    const user = await userService.requestRecruitRights(req.user.id, io);
    success(res, { recruitRights: user.recruitRights }, 'Recruit rights request submitted. Awaiting admin approval.');
  } catch (e) { next(e); }
};

const saveJob = async (req, res, next) => {
  try {
    await userService.toggleSaveJob(req.user.id, req.params.jobId, true);
    success(res, {}, 'Job saved');
  } catch (e) { next(e); }
};

const unsaveJob = async (req, res, next) => {
  try {
    await userService.toggleSaveJob(req.user.id, req.params.jobId, false);
    success(res, {}, 'Job removed from saved');
  } catch (e) { next(e); }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const jobs = await userService.getSavedJobs(req.user.id);
    success(res, { jobs });
  } catch (e) { next(e); }
};

module.exports = { getMe, updateProfile, uploadAvatar, uploadCV, graduate, requestRecruitRights, saveJob, unsaveJob, getSavedJobs };
