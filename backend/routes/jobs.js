const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { requireRecruitRights } = require('../middleware/recruitGuard');
const { upload } = require('../config/cloudinary');

const recruiterOnly  = [protect, restrictTo('citizen'), requireRecruitRights];
const citizenOrAdmin = [protect, restrictTo('citizen', 'admin')];
const adminOrRecruit = [protect, restrictTo('citizen', 'admin')]; // admin bypasses recruitRights
const anyUser        = [protect]; // students, citizens, admins — all authenticated

// ── Student-accessible: part-time jobs only ────────────────────────────────
// MUST be declared BEFORE /:id to avoid 'part-time' matching as an ID
router.get('/part-time',     ...anyUser, ctrl.getPartTimeJobs);
router.get('/part-time/:id', ...anyUser, ctrl.getPartTimeJob);

// Citizens + admin only (students cannot see full jobs board)
router.get('/',    ...citizenOrAdmin, ctrl.getJobs);
router.get('/mine',...recruiterOnly,  ctrl.myJobs);
router.get('/:id', ...citizenOrAdmin, ctrl.getJob);

// Citizen (with recruit rights) OR Admin can create/update/delete
router.post('/',     ...adminOrRecruit, upload.single('logo'), ctrl.createJob);
router.patch('/:id', ...adminOrRecruit, upload.single('logo'), ctrl.updateJob);
router.delete('/:id',...adminOrRecruit,                        ctrl.deleteJob);

module.exports = router;

