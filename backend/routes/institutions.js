const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/institutionController');
const { protectInstitution } = require('../middleware/institutionAuth');

// Public institution auth routes
router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);

// Protected routes (Only approved institutions)
router.use(protectInstitution);

router.get('/me',                           ctrl.getMe);
router.get('/applicants',                   ctrl.getApplicants);
router.patch('/applicants/:id/status',       ctrl.updateApplicationStatus);
router.get('/listings',                     ctrl.getListings);
router.post('/listings',                    ctrl.createListing);
router.delete('/listings/:type/:id',        ctrl.deleteListing);

module.exports = router;
