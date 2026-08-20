const Job = require('../models/Job');
const { uploadToCloudinary } = require('../config/cloudinary');

const buildFilter = (query) => {
  const filter = { isActive: true, deletedAt: null };
  if (query.search)          filter.$text          = { $search: query.search };
  if (query.type)            filter.type           = query.type;
  if (query.contractType)    filter.contractType   = query.contractType;
  if (query.experienceLevel) filter.experienceLevel = query.experienceLevel;
  if (query.minSalary)       filter['salary.min']  = { $gte: Number(query.minSalary) };
  if (query.maxSalary)       filter['salary.max']  = { $lte: Number(query.maxSalary) };
  if (query.tags)            filter.tags           = { $in: query.tags.split(',') };
  return filter;
};

const getAll = async (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 12);
  const skip  = (page - 1) * limit;
  const filter = buildFilter(query);
  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('recruiterId', 'name company'),
    Job.countDocuments(filter),
  ]);
  return { jobs, total, page, pages: Math.ceil(total / limit) };
};

const getById = async (id) => {
  const job = await Job.findOneAndUpdate(
    { _id: id, isActive: true, deletedAt: null },
    { $inc: { views: 1 } },  // increment view count
    { new: true }
  ).populate('recruiterId', 'name company');
  if (!job) { const e = new Error('Job not found'); e.statusCode = 404; throw e; }
  return job;
};

const create = async (recruiterId, data, logoBuffer) => {
  let companyLogo = '';
  if (logoBuffer) companyLogo = await uploadToCloudinary(logoBuffer, 'jobs', 'image');
  return Job.create({ ...data, recruiterId, companyLogo });
};

const update = async (id, recruiterId, data, logoBuffer) => {
  const job = await Job.findOne({ _id: id, recruiterId, deletedAt: null });
  if (!job) { const e = new Error('Job not found or not yours'); e.statusCode = 404; throw e; }
  if (logoBuffer) data.companyLogo = await uploadToCloudinary(logoBuffer, 'jobs', 'image');
  Object.assign(job, data);
  await job.save();
  return job;
};

const remove = async (id, recruiterId) => {
  const job = await Job.findOne({ _id: id, recruiterId });
  if (!job) { const e = new Error('Job not found or not yours'); e.statusCode = 404; throw e; }
  job.deletedAt = new Date(); job.isActive = false;
  await job.save();
};

const getMyListings = async (recruiterId) =>
  Job.find({ recruiterId, deletedAt: null }).sort({ createdAt: -1 });

module.exports = { getAll, getById, create, update, remove, getMyListings };
