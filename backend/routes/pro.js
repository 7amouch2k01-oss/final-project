const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/proController');
const { protect } = require('../middleware/auth');
const { protectInstitution } = require('../middleware/institutionAuth');

// ── Student Pro Routes (Requires student/citizen auth) ───────────────────────
router.get('/student/tasks',           protect, ctrl.getTasks);
router.post('/student/tasks',          protect, ctrl.createTask);
router.patch('/student/tasks/:id',     protect, ctrl.updateTask);
router.delete('/student/tasks/:id',    protect, ctrl.deleteTask);

router.post('/student/calculate-score',protect, ctrl.calculateScore);
router.post('/student/ai-advisor',     protect, ctrl.getAICareerAdvice);
router.post('/student/trial',          protect, ctrl.startTrial);
router.post('/student/purchase',       protect, ctrl.purchasePro);
router.post('/student/upgrade',        protect, ctrl.upgradePro);

// ── Institution Pro AI Routes ───────────────────────────────────────────────
router.post('/institution/rank-applicants/:listingId', protectInstitution, ctrl.rankApplicants);
router.post('/institution/upgrade', protectInstitution, ctrl.upgradePro);

module.exports = router;
