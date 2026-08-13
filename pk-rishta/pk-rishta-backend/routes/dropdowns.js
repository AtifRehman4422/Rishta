const express = require('express');
const {
  listPublicOptions,
  createOptionRequest,
} = require('../controllers/dropdownController');
const { optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', listPublicOptions);
router.post('/requests', optionalAuthenticate, createOptionRequest);

module.exports = router;
