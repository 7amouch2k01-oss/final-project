const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { requireRecruitRights } = require('../middleware/recruitGuard');
const { upload } = require('../config/cloudinary');

const recruiterOnly  = [protect, restrictTo('citizen'), requireRecruitRights];
const citizenOrAdmin = [protect, restrictTo('citizen', 'admin')];

// Citizens + admin only (students cannot see jobs)
router.get('/',    ...citizenOrAdmin, ctrl.getJobs);
router.get('/mine',...recruiterOnly,  ctrl.myJobs);
router.get('/:id', ...citizenOrAdmin, ctrl.getJob);

router.post('/',     ...recruiterOnly, upload.single('logo'), ctrl.createJob);
router.patch('/:id', ...recruiterOnly, upload.single('logo'), ctrl.updateJob);
router.delete('/:id',...recruiterOnly,                        ctrl.deleteJob);

module.exports = router;
