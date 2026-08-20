const universityService = require('../services/universityService');
const stageService      = require('../services/stageService');
const jobService        = require('../services/jobService');
const appService        = require('../services/applicationService');
const { success, created } = require('../utils/apiResponse');

// ══════════════════════════ UNIVERSITIES ══════════════════════════════════════
const getUniversities    = async (req, res, next) => { try { success(res, await universityService.getAll(req.query)); } catch(e){next(e);} };
const getUniversity      = async (req, res, next) => { try { success(res, { university: await universityService.getById(req.params.id) }); } catch(e){next(e);} };
const createUniversity   = async (req, res, next) => { try { const u = await universityService.create(req.user.id, req.body, req.file?.buffer); created(res, { university: u }, 'University created'); } catch(e){next(e);} };
const updateUniversity   = async (req, res, next) => { try { const u = await universityService.update(req.params.id, req.user.id, req.body, req.file?.buffer); success(res, { university: u }, 'University updated'); } catch(e){next(e);} };
const deleteUniversity   = async (req, res, next) => { try { await universityService.remove(req.params.id, req.user.id); success(res, {}, 'University deleted'); } catch(e){next(e);} };
const myUniversities     = async (req, res, next) => { try { success(res, { universities: await universityService.getMyListings(req.user.id) }); } catch(e){next(e);} };

// ══════════════════════════ STAGES ════════════════════════════════════════════
const getStages    = async (req, res, next) => { try { success(res, await stageService.getAll(req.query)); } catch(e){next(e);} };
const getStage     = async (req, res, next) => { try { success(res, { stage: await stageService.getById(req.params.id) }); } catch(e){next(e);} };
const createStage  = async (req, res, next) => { try { const s = await stageService.create(req.user.id, req.body, req.file?.buffer); created(res, { stage: s }, 'Stage created'); } catch(e){next(e);} };
const updateStage  = async (req, res, next) => { try { const s = await stageService.update(req.params.id, req.user.id, req.body, req.file?.buffer); success(res, { stage: s }, 'Stage updated'); } catch(e){next(e);} };
const deleteStage  = async (req, res, next) => { try { await stageService.remove(req.params.id, req.user.id); success(res, {}, 'Stage deleted'); } catch(e){next(e);} };
const myStages     = async (req, res, next) => { try { success(res, { stages: await stageService.getMyListings(req.user.id) }); } catch(e){next(e);} };

// ══════════════════════════ JOBS ══════════════════════════════════════════════
const getJobs    = async (req, res, next) => { try { success(res, await jobService.getAll(req.query)); } catch(e){next(e);} };
const getJob     = async (req, res, next) => { try { success(res, { job: await jobService.getById(req.params.id) }); } catch(e){next(e);} };
const createJob  = async (req, res, next) => { try { const j = await jobService.create(req.user.id, req.body, req.file?.buffer); created(res, { job: j }, 'Job created'); } catch(e){next(e);} };
const updateJob  = async (req, res, next) => { try { const j = await jobService.update(req.params.id, req.user.id, req.body, req.file?.buffer); success(res, { job: j }, 'Job updated'); } catch(e){next(e);} };
const deleteJob  = async (req, res, next) => { try { await jobService.remove(req.params.id, req.user.id); success(res, {}, 'Job deleted'); } catch(e){next(e);} };
const myJobs     = async (req, res, next) => { try { success(res, { jobs: await jobService.getMyListings(req.user.id) }); } catch(e){next(e);} };

// ══════════════════════════ APPLICATIONS ══════════════════════════════════════
const applyToListing = async (req, res, next) => {
  try {
    const io       = req.app.get('io');
    const buffers  = req.files ? req.files.map(f => f.buffer) : [];
    const app      = await appService.apply({ applicantId: req.user.id, ...req.body }, buffers, io);
    created(res, { application: app }, 'Application submitted successfully');
  } catch(e){next(e);}
};

const myApplications = async (req, res, next) => { try { success(res, { applications: await appService.getMyApplications(req.user.id) }); } catch(e){next(e);} };

const listingApplicants = async (req, res, next) => { try { success(res, { applicants: await appService.getListingApplicants(req.params.listingId, req.user.id) }); } catch(e){next(e);} };

const updateApplicationStatus = async (req, res, next) => {
  try {
    const io  = req.app.get('io');
    const app = await appService.updateStatus(req.params.id, req.user.id, req.body.status, req.body.note, io);
    success(res, { application: app }, 'Application status updated');
  } catch(e){next(e);}
};

const withdrawApplication = async (req, res, next) => {
  try {
    await appService.withdrawApplication(req.params.id, req.user.id);
    success(res, {}, 'Application withdrawn / removed successfully');
  } catch(e){next(e);}
};

module.exports = {
  getUniversities, getUniversity, createUniversity, updateUniversity, deleteUniversity, myUniversities,
  getStages, getStage, createStage, updateStage, deleteStage, myStages,
  getJobs, getJob, createJob, updateJob, deleteJob, myJobs,
  applyToListing, myApplications, listingApplicants, updateApplicationStatus, withdrawApplication,
};
