const express = require('express');

const {

  createContactRequest,

  getMyContactRequests,

  getIncomingContactRequests,

  respondToContactRequest,

  getContactAccessStatus,

} = require('../controllers/contactRequestController');

const { authenticate } = require('../middleware/auth');



const router = express.Router();



router.get('/', authenticate, getMyContactRequests);

router.get('/incoming', authenticate, getIncomingContactRequests);

router.post('/', authenticate, createContactRequest);

router.patch('/:id/respond', authenticate, respondToContactRequest);

router.get('/status/:profileId', authenticate, getContactAccessStatus);



module.exports = router;


