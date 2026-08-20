const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // null = broadcast to all
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Targeting by role (used for role-based broadcasts)
    targetRole: {
      type: String,
      enum: ['student', 'citizen', 'admin', 'all', null],
      default: null,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    type: {
      type: String,
      enum: [
        'application_status',  // status changed on an application
        'application_new',     // new applicant for a listing
        'recruit_approved',    // recruit rights approved
        'recruit_rejected',    // recruit rights rejected
        'recruit_request',     // new request received (admin)
        'graduation',          // student graduated
        'broadcast',           // admin broadcast
        'system',              // general system notification
      ],
      default: 'system',
    },

    // Deep link — where to navigate when clicked
    link: { type: String, default: '' },

    isRead: { type: Boolean, default: false },

    // Sender (admin or system)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Fast unread count queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
