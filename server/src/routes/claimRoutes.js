const express = require('express');
const router = express.Router();
const {
  getMyClaims,
  collectClaimEndpoint,
  cancelClaimEndpoint,
  recordDistribution
} = require('../controllers/claimController');

router.get('/mine', getMyClaims);
router.post('/:id/collect', collectClaimEndpoint);
router.post('/:id/cancel', cancelClaimEndpoint);
router.post('/:id/distribution', recordDistribution);

module.exports = router;
