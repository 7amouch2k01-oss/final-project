const institutionService = require('../services/institutionService');
const { success, created, badRequest } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { name, type, email, password, location, country, website, phone, description } = req.body;
    if (!name || !type || !email || !password) {
      return badRequest(res, 'Name, type, email, and password are required');
    }
    const inst = await institutionService.register({ name, type, email, password, location, country, website, phone, description });
    created(res, { institution: inst.toPublicProfile() }, 'Registration submitted! Your account is pending admin approval.');
  } catch (e) { next(e); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Email and password are required');
    const result = await institutionService.login({ email, password }, res);
    success(res, result, 'Welcome back to your Institution Dashboard');
  } catch (e) { next(e); }
};

const getMe = async (req, res, next) => {
  try {
    const stats = await institutionService.getDashboardStats(req.institution._id);
    success(res, stats);
  } catch (e) { next(e); }
};

const getApplicants = async (req, res, next) => {
  try {
    const applicants = await institutionService.getApplicants(req.institution._id, req.query);
    success(res, { applicants });
  } catch (e) { next(e); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, recruiterNote } = req.body;
    if (!status) return badRequest(res, 'Status is required');
    const io = req.app.get('io');
    const updated = await institutionService.updateApplicationStatus(req.institution._id, req.params.id, { status, recruiterNote }, io);
    success(res, { application: updated }, `Candidate marked as ${status}`);
  } catch (e) { next(e); }
};

const getListings = async (req, res, next) => {
  try {
    const listings = await institutionService.getListings(req.institution._id);
    success(res, listings);
  } catch (e) { next(e); }
};

const createListing = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) return badRequest(res, 'Type and listing data are required');
    const createdItem = await institutionService.createListing(req.institution, { type, data });
    created(res, createdItem, 'Opportunity published successfully');
  } catch (e) { next(e); }
};

const deleteListing = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    await institutionService.deleteListing(req.institution._id, type, id);
    success(res, {}, 'Listing removed');
  } catch (e) { next(e); }
};

module.exports = {
  register,
  login,
  getMe,
  getApplicants,
  updateApplicationStatus,
  getListings,
  createListing,
  deleteListing,
};
