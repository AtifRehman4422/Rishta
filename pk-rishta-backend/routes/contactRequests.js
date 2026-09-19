const express = require('express');

const {

  createContactRequest,

  getMyContactRequests,

  getIncomingContactRequests,

  respondToContactRequest,

  cancelContactRequest,

  getContactAccessStatus,

} = require('../controllers/contactRequestController');

const { authenticate, requireCompleteProfile } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireCompleteProfile, getMyContactRequests);
router.get('/incoming', authenticate, requireCompleteProfile, getIncomingContactRequests);
router.post('/', authenticate, requireCompleteProfile, createContactRequest);
router.patch('/:id/respond', authenticate, respondToContactRequest);
router.patch('/:id/cancel', authenticate, cancelContactRequest);
router.get('/status/:profileId', authenticate, requireCompleteProfile, getContactAccessStatus);



module.exports = router;


