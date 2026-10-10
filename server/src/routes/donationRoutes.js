const express = require('express');
const router = express.Router();
const {
  listDonations,
  createDonation,
  getMyDonations,
  cancelDonationEndpoint,
  getDonationById
} = require('../controllers/donationController');
const { attemptClaim } = require('../controllers/claimController');

router.get('/', listDonations);
router.post('/', createDonation);
router.get('/mine', getMyDonations);
router.get('/:id', getDonationById);
router.post('/:id/cancel', cancelDonationEndpoint);
router.post('/:id/claims', attemptClaim);

module.exports = router;
