const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { requireRecruitRights } = require('../middleware/recruitGuard');
const { upload } = require('../config/cloudinary');

const recruiterOnly  = [protect, restrictTo('citizen'), requireRecruitRights];
const adminOrRecruit = [protect, restrictTo('citizen', 'admin')];

// Public
router.get('/',     ctrl.getUniversities);
router.get('/mine', ...recruiterOnly, ctrl.myUniversities);
router.get('/:id',  ctrl.getUniversity);

// Citizen (with recruit rights) OR Admin
router.post('/',    ...adminOrRecruit, upload.single('logo'), ctrl.createUniversity);
router.patch('/:id',...adminOrRecruit, upload.single('logo'), ctrl.updateUniversity);
router.delete('/:id',...adminOrRecruit,                       ctrl.deleteUniversity);

module.exports = router;
