const express = require('express');
const {
  searchProfiles, getProfileById,
  getMyProfile, updateMyProfile, sendInterest, getMyInterests,
  getMatchingProfiles, getStats, getFilterOptions,
} = require('../controllers/profileController');
const { upload, uploadProfilePhoto } = require('../controllers/uploadController');
const { authenticate, requireCompleteProfile } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', getStats);
router.get('/filters', getFilterOptions);
router.get('/search', authenticate, requireCompleteProfile, searchProfiles);
router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);
router.get('/matches', authenticate, requireCompleteProfile, getMatchingProfiles);
router.get('/interests', authenticate, requireCompleteProfile, getMyInterests);
router.post('/interests', authenticate, requireCompleteProfile, sendInterest);
router.post('/me/photo', authenticate, upload.single('photo'), uploadProfilePhoto);
router.get('/:id', authenticate, getProfileById);

module.exports = router;
