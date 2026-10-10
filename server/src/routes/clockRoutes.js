const express = require('express');
const router = express.Router();
const { getClock, updateClock } = require('../controllers/clockController');

router.get('/', getClock);
router.patch('/', updateClock);

module.exports = router;
