const { validationResult } = require('express-validator');
const authService           = require('../services/authService');
const { success, badRequest, created } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// Helper — run validators and return errors if any
// ─────────────────────────────────────────────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    badRequest(res, 'Validation failed', errors.array());
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { name, email, password, role } = req.body;
    const user        = await authService.register({ name, email, password, role });
    const accessToken = authService.issueTokens(res, user);

    return created(res, {
      accessToken,
      user: user.toPublicProfile(),
    }, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { email, password } = req.body;
    const user        = await authService.login({ email, password });
    const accessToken = authService.issueTokens(res, user);

    return success(res, {
      accessToken,
      user: user.toPublicProfile(),
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
const logout = (req, res) => {
  authService.clearRefreshCookie(res);
  return success(res, {}, 'Logged out successfully');
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// ─────────────────────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    const { accessToken, user } = await authService.refreshAccessToken(token);

    return success(res, {
      accessToken,
      user: user.toPublicProfile(),
    }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { email } = req.body;
    // Reset base URL — points to frontend reset page
    const resetBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    await authService.forgotPassword(email, resetBaseUrl);

    // Always return the same message (don't reveal if email exists)
    return success(
      res,
      {},
      'If an account with that email exists, a reset link has been sent.'
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    if (!validate(req, res)) return;

    const { token }    = req.params;
    const { password } = req.body;
    const user         = await authService.resetPassword(token, password);

    // Auto-login after reset
    const accessToken = authService.issueTokens(res, user);

    return success(res, { accessToken, user: user.toPublicProfile() },
      'Password reset successful. You are now logged in.');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  — get currently logged in user
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return require('../utils/apiResponse').notFound(res, 'User not found');
    return success(res, { user: user.toPublicProfile() });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
