const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'University name is required'],
      trim: true,
    },
    country:     { type: String, required: true },
    city:        { type: String, required: true },
    logo:        { type: String, default: '' },     // Cloudinary URL
    images:      [{ type: String }],                // Gallery images
    description: { type: String, required: true },

    // Academic fields offered
    fields: [{ type: String, trim: true }],

    // Admission requirements
    requirements: [{ type: String }],

    // Costs & deadline
    tuitionFee: {
      amount:   { type: Number, default: 0 },
      currency: { type: String, default: 'TND' },
      period:   { type: String, enum: ['year', 'semester', 'total'], default: 'year' },
    },
    applicationDeadline: { type: Date },

    // Contact
    website: { type: String },
    email:   { type: String },
    phone:   { type: String },

    // Status
    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }, // paid feature

    // Soft-delete
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search
universitySchema.index({ name: 'text', description: 'text', fields: 'text' });

// Compound indexes for common filter queries
universitySchema.index({ country: 1, city: 1 });
universitySchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });

module.exports = mongoose.model('University', universitySchema);
