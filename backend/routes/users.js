const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(protect); // all user routes require auth

router.get('/',                    ctrl.getMe);
router.patch('/',                  ctrl.updateProfile);
router.patch('/avatar',            upload.single('avatar'), ctrl.uploadAvatar);
router.patch('/cv',                upload.single('cv'),     ctrl.uploadCV);
router.post('/upload-document',    upload.single('file'),   async (req, res, next) => {
  try {
    if (!req.file) return require('../utils/apiResponse').badRequest(res, 'No file uploaded');
    const folder = req.body.folder || 'documents';
    const userService = require('../services/userService');
    const url = await userService.uploadDocument(req.file.buffer, folder, req.file.mimetype);
    require('../utils/apiResponse').success(res, { url, originalName: req.file.originalname }, 'Document uploaded successfully');
  } catch (e) { next(e); }
});
router.post('/graduate',           restrictTo('student', 'admin'),   ctrl.graduate);
router.post('/request-recruit',    restrictTo('citizen', 'admin'),   ctrl.requestRecruitRights);
router.get('/saved-jobs',          restrictTo('citizen', 'admin'),   ctrl.getSavedJobs);
router.post('/saved-jobs/:jobId',  restrictTo('citizen', 'admin'),   ctrl.saveJob);
router.delete('/saved-jobs/:jobId',restrictTo('citizen', 'admin'),   ctrl.unsaveJob);

module.exports = router;
