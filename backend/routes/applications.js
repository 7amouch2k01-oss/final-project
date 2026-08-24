const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/listingsController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(protect);

// Applicant submits application (student or citizen)
router.post('/', upload.array('documents', 5), ctrl.applyToListing);

// Applicant sees their own applications
router.get('/mine', ctrl.myApplications);

// Recruiter / Institution sees applicants for a specific listing
router.get('/listing/:listingId', ctrl.listingApplicants);

// Recruiter / Institution marks application as actively under review
router.post('/:id/review', ctrl.markUnderReview);

// Send message / missing doc request / meeting booking on an application
router.post('/:id/messages', ctrl.sendApplicationMessage);

// Upload requested missing document on an application
router.post('/:id/missing-doc', upload.single('file'), ctrl.uploadMissingDoc);

// Update status (Accepted / Rejected)
router.patch('/:id/status', ctrl.updateApplicationStatus);

// Applicant removes / withdraws application
router.delete('/:id', ctrl.withdrawApplication);

module.exports = router;
