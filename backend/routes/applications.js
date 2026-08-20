const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(protect);

// Applicant submits application (student or citizen)
router.post('/', upload.array('documents', 5), ctrl.applyToListing);

// Applicant sees their own applications
router.get('/mine', ctrl.myApplications);

// Recruiter sees applicants for their listing
router.get('/listing/:listingId', restrictTo('citizen'), ctrl.listingApplicants);

// Recruiter updates status
router.patch('/:id/status', restrictTo('citizen'), ctrl.updateApplicationStatus);

// Applicant removes / withdraws application
router.delete('/:id', ctrl.withdrawApplication);

module.exports = router;
