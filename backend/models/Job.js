const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    companyLogo: { type: String, default: '' },   // Cloudinary URL
    description: { type: String, required: true },

    requirements:  [{ type: String }],
    responsibilities: [{ type: String }],

    // Location
    location: { type: String },
    type: {
      type: String,
      enum: ['remote', 'on-site', 'hybrid'],
      required: true,
    },

    // Salary
    salary: {
      min:      { type: Number },
      max:      { type: Number },
      currency: { type: String, default: 'TND' },
      period:   { type: String, enum: ['month', 'year'], default: 'month' },
      isHidden: { type: Boolean, default: false }, // "Competitive salary"
    },

    contractType: {
      type: String,
      enum: ['CDI', 'CDD', 'freelance', 'part-time'],
      required: true,
    },

    experienceLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead', 'any'],
      required: true,
    },

    // Tags / Skills required
    tags: [{ type: String, trim: true }],

    deadline:   { type: Date },
    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }, // paid

    // View count for analytics
    views: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', description: 'text', company: 'text', tags: 'text' });
jobSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
jobSchema.index({ type: 1, contractType: 1, experienceLevel: 1 });

module.exports = mongoose.model('Job', jobSchema);
