const express = require('express');
const {
  addFavorite,
  removeFavorite,
  listFavorites,
} = require('../controllers/favoriteController');
const { authenticate, requireCompleteProfile } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireCompleteProfile, listFavorites);
router.post('/:id', authenticate, requireCompleteProfile, addFavorite);
router.delete('/:id', authenticate, requireCompleteProfile, removeFavorite);

module.exports = router;
