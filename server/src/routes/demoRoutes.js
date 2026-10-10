const express = require('express');
const router = express.Router();
const { getDemoPeople, actAsDemo } = require('../controllers/authController');

router.get('/people', getDemoPeople);
router.post('/act-as', actAsDemo);

module.exports = router;
