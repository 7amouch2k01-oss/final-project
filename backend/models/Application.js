const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    // Who applied
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // What they applied to (polymorphic reference)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel',
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['University', 'Stage', 'Job'],
    },

    // Listing owner: Can be an Institution OR a User with recruit rights
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Application status
    status: {
      type: String,
      enum: ['pending', 'under_review', 'accepted', 'rejected'],
      default: 'pending',
    },

    // Application content
    coverLetter: { type: String, maxlength: 2000 },
    documents:   [{ type: String }],   // Cloudinary URLs or file references (CV, Baccalaureate copy, certificates)

    // Recruiter / Institution notes
    recruiterNote: { type: String },

    // Timestamps for status changes
    statusHistory: [
      {
        status:    String,
        changedAt: { type: Date, default: Date.now },
        note:      String,
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate applications to the same listing
applicationSchema.index(
  { applicantId: 1, targetId: 1 },
  { unique: true }
);

// Indexes
applicationSchema.index({ institutionId: 1, status: 1, createdAt: -1 });
applicationSchema.index({ recruiterId: 1, status: 1, createdAt: -1 });
applicationSchema.index({ applicantId: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
