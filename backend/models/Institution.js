const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { generateAccessToken, generateRefreshToken, setRefreshCookie } = require('../utils/generateToken');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institution or Company name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: ['university', 'school', 'company'],
      required: [true, 'Type is required (university, school, or company)'],
    },
    email: {
      type: String,
      required: [true, 'Official email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    logo:        { type: String, default: '' },
    description: { type: String, maxlength: 2000, default: '' },
    location:    { type: String, default: '' }, // City or Address
    country:     { type: String, default: 'Tunisia' },
    website:     { type: String, default: '' },
    phone:       { type: String, default: '' },

    // Status (Approval workflow by Admin)
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    reviewedAt:      { type: Date },

    // Subscription & Pro Tier (Task manager, AI auto-matching, verified badges)
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
      },
      stripeCustomerId:     { type: String },
      stripeSubscriptionId: { type: String },
      expiresAt:            { type: Date },
    },

    isActive: { type: Boolean, default: true },

    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
institutionSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
institutionSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe public object
institutionSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Institution', institutionSchema);
