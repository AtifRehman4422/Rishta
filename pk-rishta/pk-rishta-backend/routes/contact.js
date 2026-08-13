const express = require('express');
const rateLimit = require('express-rate-limit');
const { submitContactMessage } = require('../controllers/contactController');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again in an hour.' },
});

router.post('/', contactLimiter, submitContactMessage);

module.exports = router;
