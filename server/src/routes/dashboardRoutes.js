const express = require('express');
const router = express.Router();
const { getSummary, getImpact } = require('../controllers/dashboardController');

router.get('/summary', getSummary);
router.get('/impact', getImpact);

module.exports = router;
