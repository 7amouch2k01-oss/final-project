const University = require('../models/University');
const { uploadToCloudinary } = require('../config/cloudinary');
const { escapeRegExp } = require('../utils/string');

// ── Build filter query from request params ────────────────────────────────────
const buildFilter = (query) => {
  const filter = { isActive: true, deletedAt: null };
  if (query.search) {
    const escaped = escapeRegExp(query.search);
    filter.$or = [
      { name: new RegExp(escaped, 'i') },
      { description: new RegExp(escaped, 'i') },
      { fields: new RegExp(escaped, 'i') },
      { city: new RegExp(escaped, 'i') },
    ];
  }
  if (query.country) filter.country  = new RegExp(escapeRegExp(query.country), 'i');
  if (query.city)    filter.city     = new RegExp(escapeRegExp(query.city), 'i');
  if (query.field)   filter.fields   = new RegExp(escapeRegExp(query.field), 'i');
  return filter;
};

// ── Get all universities (public, paginated) ─────────────────────────────────
const getAll = async (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 12);
  const skip  = (page - 1) * limit;
  const filter = buildFilter(query);

  // Featured first, then newest
  const [universities, total] = await Promise.all([
    University.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('recruiterId', 'name company'),
    University.countDocuments(filter),
  ]);

  return { universities, total, page, pages: Math.ceil(total / limit) };
};

// ── Get single university ─────────────────────────────────────────────────────
const getById = async (id) => {
  const uni = await University.findOne({ _id: id, isActive: true, deletedAt: null })
    .populate('recruiterId', 'name company.name company.logo');
  if (!uni) { const e = new Error('University not found'); e.statusCode = 404; throw e; }
  return uni;
};

// ── Create university (approved recruiter) ────────────────────────────────────
const create = async (recruiterId, data, logoBuffer) => {
  let logoUrl = '';
  if (logoBuffer) {
    logoUrl = await uploadToCloudinary(logoBuffer, 'universities', 'image');
  }
  const uni = await University.create({ ...data, recruiterId, logo: logoUrl });
  return uni;
};

// ── Update university ─────────────────────────────────────────────────────────
const update = async (id, recruiterId, data, logoBuffer, role) => {
  const query = { _id: id, deletedAt: null };
  if (role !== 'admin') query.recruiterId = recruiterId; // admin bypasses ownership check
  const uni = await University.findOne(query);
  if (!uni) { const e = new Error('University not found or not yours'); e.statusCode = 404; throw e; }

  if (logoBuffer) {
    data.logo = await uploadToCloudinary(logoBuffer, 'universities', 'image');
  }
  Object.assign(uni, data);
  await uni.save();
  return uni;
};

// ── Soft-delete university ────────────────────────────────────────────────────
const remove = async (id, recruiterId, role) => {
  const query = { _id: id };
  if (role !== 'admin') query.recruiterId = recruiterId; // admin bypasses ownership check
  const uni = await University.findOne(query);
  if (!uni) { const e = new Error('University not found or not yours'); e.statusCode = 404; throw e; }
  uni.deletedAt = new Date();
  uni.isActive  = false;
  await uni.save();
};


// ── Get recruiter's own listings ──────────────────────────────────────────────
const getMyListings = async (recruiterId) => {
  return University.find({ recruiterId, deletedAt: null }).sort({ createdAt: -1 });
};

module.exports = { getAll, getById, create, update, remove, getMyListings };
