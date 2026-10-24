const express = require('express');
const {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getAllProfiles, verifyProfile, rateProfile, setContactRequestLimit, deleteProfile,
  getContactRequests, reviewContactRequest, getComplaints, reviewComplaint, sendComplaintMessage,
  getContactFormMessages, updateContactFormMessage, replyContactFormMessage,
} = require('../controllers/adminController');
const {
  getVisitorAnalytics,
  getGapVisitors,
  getDayVisitors,
  getVisitorDetail,
} = require('../controllers/analyticsController');
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
router.get('/analytics/visitors', getVisitorAnalytics);
router.get('/analytics/visitors/gap', getGapVisitors);
router.get('/analytics/visitors/day', getDayVisitors);
router.get('/analytics/visitor-detail', getVisitorDetail);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/profiles', getAllProfiles);
router.post('/profiles', adminCreateProfile);
router.put('/profiles/:id', adminUpdateProfile);
router.patch('/profiles/:id/verify', verifyProfile);
router.patch('/profiles/:id/rating', rateProfile);
router.patch('/profiles/:id/request-limit', setContactRequestLimit);
router.delete('/profiles/:id', deleteProfile);
router.get('/contact-requests', getContactRequests);
router.patch('/contact-requests/:id', reviewContactRequest);
router.get('/complaints', getComplaints);
router.patch('/complaints/:id', reviewComplaint);
router.post('/complaints/:id/message', sendComplaintMessage);
router.get('/contact-messages', getContactFormMessages);
router.patch('/contact-messages/:id', updateContactFormMessage);
router.post('/contact-messages/:id/reply', replyContactFormMessage);

router.get('/dropdown-options', adminListOptions);
router.post('/dropdown-options', adminCreateOption);
router.post('/dropdown-options/seed', adminSeedOptions);
router.patch('/dropdown-options/:id', adminUpdateOption);
router.delete('/dropdown-options/:id', adminDeleteOption);
router.get('/dropdown-requests', adminListRequests);
router.patch('/dropdown-requests/:id', adminReviewRequest);

module.exports = router;
