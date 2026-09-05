const adminService = require('../services/adminService');
const { success }  = require('../utils/apiResponse');

const getStats    = async (req, res, next) => { try { success(res, await adminService.getStats()); } catch(e){next(e);} };
const getAllUsers  = async (req, res, next) => { try { success(res, await adminService.getAllUsers(req.query)); } catch(e){next(e);} };
const changeRole  = async (req, res, next) => { try { const u = await adminService.changeUserRole(req.params.id, req.body.role); success(res, { user: u.toPublicProfile() }, 'Role updated'); } catch(e){next(e);} };
const banUser     = async (req, res, next) => { try { const u = await adminService.toggleBan(req.params.id, true);  success(res, { user: u.toPublicProfile() }, 'User banned'); } catch(e){next(e);} };
const unbanUser   = async (req, res, next) => { try { const u = await adminService.toggleBan(req.params.id, false); success(res, { user: u.toPublicProfile() }, 'User unbanned'); } catch(e){next(e);} };
const deleteUser  = async (req, res, next) => { try { const r = await adminService.deleteUser(req.params.id, req.user?.id); success(res, r, 'User deleted successfully'); } catch(e){next(e);} };

// Institutions
const getInstitutions = async (req, res, next) => { try { success(res, { institutions: await adminService.getInstitutions(req.query) }); } catch(e){next(e);} };
const approveInstitution = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const inst = await adminService.approveInstitution(req.params.id, io);
    success(res, { institution: inst.toPublicProfile() }, 'Institution approved successfully');
  } catch(e){next(e);}
};
const rejectInstitution = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const inst = await adminService.rejectInstitution(req.params.id, req.body.reason, io);
    success(res, { institution: inst.toPublicProfile() }, 'Institution registration rejected');
  } catch(e){next(e);}
};

const getRecruitRequests = async (req, res, next) => { try { success(res, { requests: await adminService.getRecruitRequests(req.query) }); } catch(e){next(e);} };

const approveRecruit = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const u  = await adminService.approveRecruit(req.params.id, req.user.id, io);
    success(res, { user: u.toPublicProfile() }, 'Recruit rights approved');
  } catch(e){next(e);}
};

const rejectRecruit = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const u  = await adminService.rejectRecruit(req.params.id, req.body.reason, io);
    success(res, { user: u.toPublicProfile() }, 'Recruit rights rejected');
  } catch(e){next(e);}
};

const broadcast = async (req, res, next) => {
  try {
    const io     = req.app.get('io');
    const result = await adminService.broadcastNotification(req.body, req.user.id, io);
    success(res, result, `Notification sent to ${result.sent} users`);
  } catch(e){next(e);}
};

const getAllListings = async (req, res, next) => { try { success(res, await adminService.getAllListings(req.query)); } catch(e){next(e);} };

const deleteListing = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    await adminService.deleteListing(type, id);
    success(res, {}, 'Listing removed successfully');
  } catch(e){next(e);}
};

// Baccalaureate Verifications
const getBacVerifications = async (req, res, next) => {
  try {
    success(res, await adminService.getBacVerifications(req.query));
  } catch(e){next(e);}
};

const approveBacVerification = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const student = await adminService.approveBacVerification(req.params.id, req.user.id, io);
    success(res, { student }, 'Student Baccalaureate verified and confirmed authentic');
  } catch(e){next(e);}
};

const rejectBacVerification = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const student = await adminService.rejectBacVerification(req.params.id, req.user.id, req.body.reason, io);
    success(res, { student }, 'Student Baccalaureate verification rejected');
  } catch(e){next(e);}
};

module.exports = {
  getStats, getAllUsers, changeRole, banUser, unbanUser, deleteUser,
  getInstitutions, approveInstitution, rejectInstitution,
  getRecruitRequests, approveRecruit, rejectRecruit,
  broadcast, getAllListings, deleteListing,
  getBacVerifications, approveBacVerification, rejectBacVerification,
};
