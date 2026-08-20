const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { requireRecruitRights } = require('../middleware/recruitGuard');
const { upload } = require('../config/cloudinary');

const recruiterOnly = [protect, restrictTo('citizen'), requireRecruitRights];

// Public
router.get('/',     ctrl.getUniversities);
router.get('/mine', ...recruiterOnly, ctrl.myUniversities);
router.get('/:id',  ctrl.getUniversity);

// Approved recruiter only
router.post('/',    ...recruiterOnly, upload.single('logo'), ctrl.createUniversity);
router.patch('/:id',...recruiterOnly, upload.single('logo'), ctrl.updateUniversity);
router.delete('/:id',...recruiterOnly,                       ctrl.deleteUniversity);

module.exports = router;
