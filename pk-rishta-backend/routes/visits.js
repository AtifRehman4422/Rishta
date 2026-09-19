const express = require('express');
const rateLimit = require('express-rate-limit');
const { optionalAuthenticate } = require('../middleware/auth');
const { trackVisit } = require('../controllers/visitController');

const router = express.Router();

const visitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many visit pings' },
});

router.post('/', visitLimiter, optionalAuthenticate, trackVisit);

module.exports = router;
