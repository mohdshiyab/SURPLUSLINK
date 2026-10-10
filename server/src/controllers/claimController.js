const Claim = require('../models/Claim');
const Donation = require('../models/Donation');
const RestaurantProfile = require('../models/RestaurantProfile');
const { getSimulatedNow } = require('../services/clockService');
const {
  createClaim,
  collectClaim,
  cancelClaim
} = require('../services/donationService');

// POST /api/donations/:id/claims
async function attemptClaim(req, res) {
  try {
    const { id: donationId } = req.params;
    const { kg, plannedPickupTime } = req.body;
    const volunteerId = req.actor?.volunteerId || req.body.volunteer_id;

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer identification required. Please select a volunteer persona or sign in.'
      });
    }

    const result = await createClaim({
      donationId,
      volunteerId,
      kg,
      plannedPickupTime
    });

    res.status(201).json({
      success: true,
      message: 'Claim created successfully',
      claim: result.claim,
      remainingKg: result.remainingKg,
      donationStatus: result.donationStatus
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error processing claim',
      errors: err.errors || [err.message]
    });
  }
}

// GET /api/claims/mine
async function getMyClaims(req, res) {
  try {
    const volunteerId = req.actor?.volunteerId;
    if (!volunteerId) {
      return res.status(400).json({ success: false, message: 'No active volunteer persona.' });
    }

    const simulatedNow = await getSimulatedNow();
    const claims = await Claim.find({ volunteer_id: volunteerId }).sort({ createdAt: -1 });

    const donationIds = [...new Set(claims.map((c) => c.donation_id))];
    const donations = await Donation.find({ id: { $in: donationIds } });
    const donationMap = {};
    donations.forEach((d) => {
      donationMap[d.id] = d;
    });

    const donorIds = [...new Set(donations.map((d) => d.donor_id))];
    const donors = await RestaurantProfile.find({ donorId: { $in: donorIds } });
    const donorMap = {};
    donors.forEach((d) => {
      donorMap[d.donorId] = d;
    });

    const detailedClaims = claims.map((c) => {
      const donation = donationMap[c.donation_id];
      const donor = donation ? donorMap[donation.donor_id] : null;

      // Check whether collection or cancellation is currently eligible
      const canCollect =
        c.status === 'ACTIVE' &&
        donation &&
        simulatedNow >= donation.pickup_from &&
        simulatedNow <= donation.pickup_until;

      const canCancel =
        c.status === 'ACTIVE' && simulatedNow < c.plannedPickupTime;

      return {
        ...c.toObject(),
        donation: donation
          ? {
              id: donation.id,
              description: donation.description,
              quantity_kg: donation.quantity_kg,
              pickup_from: donation.pickup_from,
              pickup_until: donation.pickup_until,
              zone: donation.zone,
              restaurantName: donor ? donor.restaurantName : donation.donor_id,
              address: donor ? donor.address : '',
              location: donor ? donor.location : null,
              coordinates: donor?.location?.coordinates ? [donor.location.coordinates[1], donor.location.coordinates[0]] : null // [lat, lon]
            }
          : null,
        canCollect,
        canCancel
      };
    });

    res.json({
      success: true,
      simulatedNow,
      claims: detailedClaims
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/claims/:id/collect
async function collectClaimEndpoint(req, res) {
  try {
    const { id: claimId } = req.params;
    const volunteerId = req.actor?.volunteerId;

    const claim = await collectClaim({ claimId, volunteerId });
    res.json({
      success: true,
      message: 'Claim successfully marked COLLECTED',
      claim
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      errors: err.errors || [err.message]
    });
  }
}

// POST /api/claims/:id/cancel
async function cancelClaimEndpoint(req, res) {
  try {
    const { id: claimId } = req.params;
    const volunteerId = req.actor?.volunteerId;

    const result = await cancelClaim({ claimId, volunteerId });
    res.json({
      success: true,
      message: 'Claim successfully CANCELLED and quantity returned to donation',
      ...result
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      errors: err.errors || [err.message]
    });
  }
}

// POST /api/claims/:id/distribution
async function recordDistribution(req, res) {
  try {
    const { id: claimId } = req.params;
    const { packsDistributed, broadArea, note, photoUrl } = req.body;
    const volunteerId = req.actor?.volunteerId;

    const simulatedNow = await getSimulatedNow();
    const claim = await Claim.findOne({ claim_id: claimId });

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    if (volunteerId && claim.volunteer_id !== volunteerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized claim update' });
    }

    if (claim.status !== 'COLLECTED') {
      return res.status(400).json({
        success: false,
        message: 'Distribution can only be recorded after claim has been COLLECTED'
      });
    }

    claim.distributionRecord = {
      packsDistributed: Number(packsDistributed) || 0,
      broadArea: broadArea || '',
      note: note || '',
      photoUrl: photoUrl || '',
      recordedAt: simulatedNow
    };

    await claim.save();

    res.json({
      success: true,
      message: 'Distribution details saved successfully',
      claim
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  attemptClaim,
  getMyClaims,
  collectClaimEndpoint,
  cancelClaimEndpoint,
  recordDistribution
};
