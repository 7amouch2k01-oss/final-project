const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/generateToken');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
const register = async ({ name, email, password, role }) => {
  // Check if email already taken
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  // Create user (password hashed by pre-save hook in model)
  const user = await User.create({ name, email, password, role });

  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  // Find user — include password field (select: false by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Check if account is active (not banned)
  if (!user.isActive) {
    const err = new Error('Your account has been suspended. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────────────────────────────────────────
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error('No refresh token provided');
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Refresh token is invalid or expired. Please log in again.');
    err.statusCode = 401;
    throw err;
  }

  // Make sure user still exists and is active
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    const err = new Error('User no longer exists or has been suspended');
    err.statusCode = 401;
    throw err;
  }

  // Issue a fresh access token
  const accessToken = generateAccessToken(user._id, user.role);
  return { accessToken, user };
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (email, resetBaseUrl) => {
  const user = await User.findOne({ email });

  // Always return success — never reveal if an email exists (security)
  if (!user) return;

  // Generate reset token (plain token sent via email, hashed token stored in DB)
  const resetToken   = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${resetBaseUrl}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (emailErr) {
    // Rollback token if email fails
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    const err = new Error('Failed to send reset email. Please try again.');
    err.statusCode = 500;
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (plainToken, newPassword) => {
  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');

  // Find user with matching token that hasn't expired
  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    const err = new Error('Reset token is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  // Set new password and clear reset fields
  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN HELPERS (re-exported for controller convenience)
// ─────────────────────────────────────────────────────────────────────────────
const issueTokens = (res, user) => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);
  return accessToken;
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  issueTokens,
  clearRefreshCookie,
};
