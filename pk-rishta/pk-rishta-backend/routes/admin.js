const express = require('express');
const {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getAllProfiles, verifyProfile, deleteProfile,
  getContactRequests, reviewContactRequest, getComplaints, reviewComplaint, sendComplaintMessage,
  getContactFormMessages, updateContactFormMessage,
} = require('../controllers/adminController');
const { adminUpdateProfile, adminCreateProfile } = require('../controllers/profileController');
const {
  adminListOptions,
  adminCreateOption,
  adminUpdateOption,
  adminDeleteOption,
  adminSeedOptions,
  adminListRequests,
  adminReviewRequest,
} = require('../controllers/dropdownController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/profiles', getAllProfiles);
router.post('/profiles', adminCreateProfile);
router.put('/profiles/:id', adminUpdateProfile);
router.patch('/profiles/:id/verify', verifyProfile);
router.delete('/profiles/:id', deleteProfile);
router.get('/contact-requests', getContactRequests);
router.patch('/contact-requests/:id', reviewContactRequest);
router.get('/complaints', getComplaints);
router.patch('/complaints/:id', reviewComplaint);
router.post('/complaints/:id/message', sendComplaintMessage);
router.get('/contact-messages', getContactFormMessages);
router.patch('/contact-messages/:id', updateContactFormMessage);

router.get('/dropdown-options', adminListOptions);
router.post('/dropdown-options', adminCreateOption);
router.post('/dropdown-options/seed', adminSeedOptions);
router.patch('/dropdown-options/:id', adminUpdateOption);
router.delete('/dropdown-options/:id', adminDeleteOption);
router.get('/dropdown-requests', adminListRequests);
router.patch('/dropdown-requests/:id', adminReviewRequest);

module.exports = router;
