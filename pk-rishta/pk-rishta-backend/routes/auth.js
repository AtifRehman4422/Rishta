const express = require('express');
const {
  register,
  verifyRegisterOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getCaptcha,
  login,
  getMe,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { createAuthLimiter } = require('../middleware/security');

const router = express.Router();
const authLimiter = createAuthLimiter();

router.post('/register', authLimiter, register);
router.post('/verify-register-otp', authLimiter, verifyRegisterOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/captcha', authLimiter, getCaptcha);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);

module.exports = router;
