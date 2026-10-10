const express = require('express');
const router = express.Router();
const {
  getCommunityHeroes,
  updatePublicVisibility
} = require('../controllers/communityHeroController');

router.get('/', getCommunityHeroes);
router.patch('/profile/public-visibility', updatePublicVisibility);

module.exports = router;
