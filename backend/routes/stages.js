const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { requireRecruitRights } = require('../middleware/recruitGuard');
const { upload } = require('../config/cloudinary');

const recruiterOnly = [protect, restrictTo('citizen'), requireRecruitRights];

// Public (students + citizens can see stages)
router.get('/',     ctrl.getStages);
router.get('/mine', ...recruiterOnly, ctrl.myStages);
router.get('/:id',  ctrl.getStage);

router.post('/',     ...recruiterOnly, upload.single('logo'), ctrl.createStage);
router.patch('/:id', ...recruiterOnly, upload.single('logo'), ctrl.updateStage);
router.delete('/:id',...recruiterOnly,                        ctrl.deleteStage);

module.exports = router;
