const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'University name is required'],
      trim: true,
    },
    country:     { type: String, required: true },
    city:        { type: String, required: true },
    logo:        { type: String, default: '' },     // Real brand logo URL
    images:      [{ type: String }],                // Gallery images
    description: { type: String, required: true },

    // Academic fields / Categories
    fields: [{ type: String, trim: true }],

    // Multiple specific programmes/tracks
    programmes: [
      {
        name:        { type: String, required: true }, // e.g. "Master in Artificial Intelligence & Data"
        degree:      { type: String, default: '' },     // e.g. "Licence", "Master", "Cycle Ingénieur"
        description: { type: String, default: '' },
      }
    ],

    // Admission requirements
    requirements: [{ type: String }],

    // Application window
    applicationStartDate: { type: Date, default: Date.now },
    applicationEndDate:   { type: Date },

    // Contact
    website: { type: String },
    email:   { type: String },
    phone:   { type: String },

    // Status
    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    // Soft-delete
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search
universitySchema.index({ name: 'text', description: 'text', fields: 'text' });

// Compound indexes
universitySchema.index({ country: 1, city: 1 });
universitySchema.index({ isActive: 1, isFeatured: -1, applicationEndDate: 1, createdAt: -1 });

module.exports = mongoose.model('University', universitySchema);
