const Stage = require('../models/Stage');
const { uploadToCloudinary } = require('../config/cloudinary');
const { escapeRegExp } = require('../utils/string');

const buildFilter = (query) => {
  const filter = { 
    isActive: true, 
    deletedAt: null,
    $and: [
      {
        $or: [
          { applicationEndDate: { $exists: false } },
          { applicationEndDate: null },
          { applicationEndDate: { $gte: new Date() } }
        ]
      }
    ]
  };

  if (query.search) {
    const escaped = escapeRegExp(query.search);
    filter.$and.push({
      $or: [
        { title: new RegExp(escaped, 'i') },
        { company: new RegExp(escaped, 'i') },
        { description: new RegExp(escaped, 'i') },
        { domain: new RegExp(escaped, 'i') },
        { location: new RegExp(escaped, 'i') },
        { 'programmes.name': new RegExp(escaped, 'i') },
      ]
    });
  }

  if (query.domain) filter.domain = new RegExp(escapeRegExp(query.domain), 'i');
  if (query.type)   filter.type   = query.type;
  if (query.isPaid !== undefined)
    filter['stipend.isPaid'] = query.isPaid === 'true';
  return filter;
};

const getAll = async (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 12);
  const skip  = (page - 1) * limit;
  const filter = buildFilter(query);
  const [stages, total] = await Promise.all([
    Stage.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('recruiterId', 'name company'),
    Stage.countDocuments(filter),
  ]);
  return { stages, total, page, pages: Math.ceil(total / limit) };
};

const getById = async (id) => {
  const stage = await Stage.findOne({ _id: id, isActive: true, deletedAt: null })
    .populate('recruiterId', 'name company');
  if (!stage) { const e = new Error('Stage not found'); e.statusCode = 404; throw e; }
  return stage;
};

const create = async (recruiterId, data, logoBuffer) => {
  let companyLogo = data.companyLogo || '';
  if (logoBuffer) companyLogo = await uploadToCloudinary(logoBuffer, 'stages', 'image');
  return Stage.create({ ...data, recruiterId, companyLogo });
};

const update = async (id, recruiterId, data, logoBuffer, role) => {
  const query = { _id: id, deletedAt: null };
  if (role !== 'admin') query.recruiterId = recruiterId;
  const stage = await Stage.findOne(query);
  if (!stage) { const e = new Error('Stage not found or not yours'); e.statusCode = 404; throw e; }
  if (logoBuffer) data.companyLogo = await uploadToCloudinary(logoBuffer, 'stages', 'image');
  Object.assign(stage, data);
  await stage.save();
  return stage;
};

const remove = async (id, recruiterId, role) => {
  const query = { _id: id };
  if (role !== 'admin') query.recruiterId = recruiterId;
  const stage = await Stage.findOne(query);
  if (!stage) { const e = new Error('Stage not found or not yours'); e.statusCode = 404; throw e; }
  stage.deletedAt = new Date(); stage.isActive = false;
  await stage.save();
};

const getMyListings = async (recruiterId) =>
  Stage.find({ recruiterId, deletedAt: null }).sort({ createdAt: -1 });

module.exports = { getAll, getById, create, update, remove, getMyListings };
