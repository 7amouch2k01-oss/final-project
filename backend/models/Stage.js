const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
    },

    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    companyLogo: { type: String, default: '' },   // Brand logo URL
    description: { type: String, required: true },

    // Multiple specific programmes/tracks if any (e.g. "PFE Full Stack", "PFA Embedded")
    programmes: [
      {
        name:        { type: String, required: true },
        degree:      { type: String, default: '' },
        description: { type: String, default: '' },
      }
    ],

    // Field of study / domain
    domain: { type: String, required: true },

    requirements: [{ type: String }],

    // Location
    location: { type: String },
    type: {
      type: String,
      enum: ['remote', 'hybrid', 'on-site'],
      required: true,
    },

    // Duration (e.g. "2 months", "3-6 months")
    duration: { type: String, required: true },

    // Monthly stipend
    stipend: {
      amount:   { type: Number, default: 0 },
      currency: { type: String, default: 'TND' },
      isPaid:   { type: Boolean, default: false },
    },

    applicationStartDate: { type: Date, default: Date.now },
    applicationEndDate:   { type: Date },
    deadline:             { type: Date },

    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

stageSchema.index({ title: 'text', description: 'text', domain: 'text', company: 'text' });
stageSchema.index({ isActive: 1, isFeatured: -1, applicationEndDate: 1, createdAt: -1 });
stageSchema.index({ type: 1, domain: 1 });

module.exports = mongoose.model('Stage', stageSchema);
