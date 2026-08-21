const proService = require('../services/proService');
const { success, created, badRequest } = require('../utils/apiResponse');

// ── Student Tasks ──────────────────────────────────────────────────────────
const getTasks = async (req, res, next) => {
  try {
    const tasks = await proService.getTasks(req.user.id);
    success(res, { tasks });
  } catch (e) { next(e); }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, category, priority, dueDate, tags } = req.body;
    if (!title) return badRequest(res, 'Task title is required');
    const task = await proService.createTask(req.user.id, { title, description, category, priority, dueDate, tags });
    created(res, { task }, 'Task added to your Pro Workspace');
  } catch (e) { next(e); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await proService.updateTask(req.user.id, req.params.id, req.body);
    success(res, { task }, 'Task updated');
  } catch (e) { next(e); }
};

const deleteTask = async (req, res, next) => {
  try {
    await proService.deleteTask(req.user.id, req.params.id);
    success(res, {}, 'Task removed');
  } catch (e) { next(e); }
};

// ── Score & GPA Calculator ─────────────────────────────────────────────────
const calculateScore = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) return badRequest(res, 'Calculation type and data are required');
    const result = proService.calculateAcademicScore({ type, data });
    success(res, result);
  } catch (e) { next(e); }
};

// ── AI Career Advisor ──────────────────────────────────────────────────────
const getAICareerAdvice = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) return badRequest(res, 'Message is required');
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const result = await proService.getAICareerAdvice({ message, userContext: user, history });
    success(res, result);
  } catch (e) { next(e); }
};

// ── Institution AI Candidate Ranking ───────────────────────────────────────
const rankApplicants = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { requirements } = req.body;
    const institutionId = req.institution?._id || req.user?.id;
    const result = await proService.rankApplicantsForListing(institutionId, listingId, requirements);
    success(res, result, 'AI Applicant Matching & Ranking Complete');
  } catch (e) { next(e); }
};

// ── Free Trial & Payments ──────────────────────────────────────────────────
const startTrial = async (req, res, next) => {
  try {
    const result = await proService.activateFreeTrial(req.user.id);
    success(res, result, '1-Day Free Trial activated! Enjoy full Pro access.');
  } catch (e) { next(e); }
};

const purchasePro = async (req, res, next) => {
  try {
    const { packageType, paymentMethod, paymentDetails } = req.body;
    const result = await proService.processProPurchase(req.user.id, {
      packageType: packageType || 'all',
      paymentMethod: paymentMethod || 'carte_bancaire',
      paymentDetails,
    });
    success(res, result, 'Payment processed successfully! Your Pro feature is active.');
  } catch (e) { next(e); }
};

// ── Upgrade to Pro ─────────────────────────────────────────────────────────
const upgradePro = async (req, res, next) => {
  try {
    const isInst = !!req.institution;
    const targetId = isInst ? req.institution._id : req.user.id;
    const result = await proService.upgradeToProPlan(targetId, isInst, req.body.plan || 'pro');
    success(res, result, 'Pro Plan activated successfully!');
  } catch (e) { next(e); }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  calculateScore,
  getAICareerAdvice,
  rankApplicants,
  startTrial,
  purchasePro,
  upgradePro,
};
