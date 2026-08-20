const express = require('express');
const router  = express.Router();

const {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/register',        registerValidator,       register);
router.post('/login',           loginValidator,          login);
router.post('/logout',                                   logout);
router.post('/refresh-token',                            refreshToken);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, resetPassword);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.get('/me', protect, getMe);

module.exports = router;
