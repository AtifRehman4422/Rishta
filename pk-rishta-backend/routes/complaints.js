const express = require('express');
const { createComplaint, getMyComplaints, replyToComplaint } = require('../controllers/contactRequestController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getMyComplaints);
router.post('/', authenticate, createComplaint);
router.post('/:id/reply', authenticate, replyToComplaint);

module.exports = router;
