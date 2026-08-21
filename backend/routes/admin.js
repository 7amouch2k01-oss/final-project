const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin')); // ALL admin routes require admin role

router.get('/stats',                  ctrl.getStats);
router.get('/users',                  ctrl.getAllUsers);
router.patch('/users/:id/role',       ctrl.changeRole);
router.patch('/users/:id/ban',        ctrl.banUser);
router.patch('/users/:id/unban',      ctrl.unbanUser);

// Institution Approvals
router.get('/institutions',                  ctrl.getInstitutions);
router.patch('/institutions/:id/approve',     ctrl.approveInstitution);
router.patch('/institutions/:id/reject',      ctrl.rejectInstitution);

// Recruit Requests
router.get('/recruit-requests',               ctrl.getRecruitRequests);
router.patch('/recruit-requests/:id/approve', ctrl.approveRecruit);
router.patch('/recruit-requests/:id/reject',  ctrl.rejectRecruit);

router.post('/broadcast',             ctrl.broadcast);
router.get('/listings',               ctrl.getAllListings);
router.delete('/listings/:type/:id',  ctrl.deleteListing);

module.exports = router;
