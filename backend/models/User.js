const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // ── Core ──────────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'citizen', 'admin'],
      default: 'student',
    },

    // ── Baccalaureate (Mandatory for students) ────────────────────────────────
    baccalaureate: {
      school:       { type: String, trim: true },
      year:         { type: Number },
      section:      { type: String, trim: true }, // e.g., Math, Sciences Exp, Tech, Info, Eco-Gestion, Lettres, Sport
      grade:        { type: String, trim: true }, // Mention or score (e.g. Assez Bien, 14.50)
      proofDocUrl:  { type: String, default: '' }, // Uploaded PDF or image proof
      isVerified:   { type: Boolean, default: false },
    },

    // ── Citizen Recruit Rights ─────────────────────────────────────────────────
    recruitRights: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      requestedAt:      { type: Date },
      reviewedAt:       { type: Date },
      rejectionReason:  { type: String },
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    avatar:    { type: String, default: '' },   // Cloudinary URL or base64
    bio:       { type: String, maxlength: 500 },
    skills:    [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    cvUrl:     { type: String, default: '' },   // Cloudinary URL or base64

    education: [
      {
        school:            { type: String, required: true },
        degree:            { type: String, required: true },
        field:             { type: String, required: true },
        from:              { type: Date },
        to:                { type: Date },
        isCurrent:         { type: Boolean, default: false },
        graduationCertUrl: { type: String, default: '' }, // Required if isCurrent === false
      },
    ],

    experience: [
      {
        company:     { type: String, required: true },
        title:       { type: String, required: true },
        from:        { type: Date },
        to:          { type: Date },
        isCurrent:   { type: Boolean, default: false },
        certUrl:     { type: String, default: '' }, // Work cert or recommendation
        description: { type: String },
      },
    ],

    // ── Job Seeker ────────────────────────────────────────────────────────────
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

    // ── Company Info (citizen with recruit rights) ────────────────────────────
    company: {
      name:        { type: String },
      logo:        { type: String },   // Cloudinary URL
      description: { type: String },
      website:     { type: String },
      location:    { type: String },
    },

    // ── Stripe Subscription ───────────────────────────────────────────────────
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'premium', 'pro', 'business'],
        default: 'free',
      },
      stripeCustomerId:     { type: String },
      stripeSubscriptionId: { type: String },
      expiresAt:            { type: Date },
    },

    // ── Account flags ─────────────────────────────────────────────────────────
    isActive:       { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },
    graduationDate: { type: Date },

    // ── Password reset ────────────────────────────────────────────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  {
    timestamps: true,
  }
);

// ── Hash password before saving ───────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Compare password (login) ──────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Generate password reset token ─────────────────────────────────────────────
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken; // send plain token via email, store hashed
};

// ── Check if citizen has active recruit rights ────────────────────────────────
userSchema.virtual('canRecruit').get(function () {
  return this.role === 'citizen' && this.recruitRights?.status === 'approved';
});

// ── Safe public profile (strip sensitive fields) ──────────────────────────────
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
