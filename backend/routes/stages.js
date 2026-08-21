const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { requireRecruitRights } = require('../middleware/recruitGuard');
const { upload } = require('../config/cloudinary');

const recruiterOnly  = [protect, restrictTo('citizen'), requireRecruitRights];
const adminOrRecruit = [protect, restrictTo('citizen', 'admin')]; // admin bypasses recruitRights

// Public (students + citizens can see stages)
router.get('/',     ctrl.getStages);
router.get('/mine', ...recruiterOnly, ctrl.myStages);
router.get('/:id',  ctrl.getStage);

// Citizen (with recruit rights) OR Admin can create/update/delete
router.post('/',     ...adminOrRecruit, upload.single('logo'), ctrl.createStage);
router.patch('/:id', ...adminOrRecruit, upload.single('logo'), ctrl.updateStage);
router.delete('/:id',...adminOrRecruit,                        ctrl.deleteStage);

module.exports = router;
