const express = require('express');
const {
  searchProfiles, getProfileById,
  getMyProfile, updateMyProfile, sendInterest, getMyInterests,
  getMatchingProfiles, getStats, getFilterOptions,
} = require('../controllers/profileController');
const { upload, uploadProfilePhoto } = require('../controllers/uploadController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', getStats);
router.get('/filters', getFilterOptions);
router.get('/search', optionalAuthenticate, searchProfiles);
router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);
router.get('/matches', authenticate, getMatchingProfiles);
router.get('/interests', authenticate, getMyInterests);
router.post('/interests', authenticate, sendInterest);
router.post('/me/photo', authenticate, upload.single('photo'), uploadProfilePhoto);
router.get('/:id', optionalAuthenticate, getProfileById);

module.exports = router;
