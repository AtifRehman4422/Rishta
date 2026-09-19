const express = require('express');
const { shareAddress, hideAddress } = require('../controllers/addressDisclosureController');
const { authenticate, requireCompleteProfile } = require('../middleware/auth');

const router = express.Router();

router.post('/:profileId', authenticate, requireCompleteProfile, shareAddress);
router.delete('/:profileId', authenticate, requireCompleteProfile, hideAddress);

module.exports = router;
