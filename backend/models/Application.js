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

    // Selected program/track (if post has multiple programmes)
    selectedProgramme: {
      type: String,
      default: '',
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

    viewedByRecruiterAt: {
      type: Date,
      default: null,
    },

    // Application content
    coverLetter: { type: String, maxlength: 2000 },
    documents:   [{ type: String }],   // Cloudinary URLs or file references (CV, Baccalaureate copy, certificates)

    // Recruiter / Institution notes
    recruiterNote: { type: String },

    // Direct Messages & Interactive Communication Thread (Chat, Missing Doc Request, Meeting Booking)
    messages: [
      {
        sender: { type: String, required: true }, // 'institution', 'recruiter', 'applicant'
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderName: { type: String, default: '' },
        message: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'file_request', 'meeting_booking'],
          default: 'text',
        },
        missingDocType: { type: String, default: '' }, // e.g. 'Identity Proof', 'Transcript', 'Diploma'
        uploadedDocUrl: { type: String, default: '' }, // When applicant uploads the requested file
        meetingDetails: {
          date: { type: Date },
          time: { type: String },
          link: { type: String }, // e.g. Google Meet, Zoom, MS Teams
          notes: { type: String },
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

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
