const express = require('express');
const rateLimit = require('express-rate-limit');
const { optionalAuthenticate } = require('../middleware/auth');
const { trackVisit } = require('../controllers/visitController');
const { trackActivity } = require('../controllers/analyticsController');

const router = express.Router();

const visitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many visit pings' },
});

const activityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many activity pings' },
});

router.post('/', visitLimiter, optionalAuthenticate, trackVisit);
router.post('/activity', activityLimiter, optionalAuthenticate, trackActivity);

module.exports = router;
