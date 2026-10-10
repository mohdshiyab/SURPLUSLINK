const Donation = require('../models/Donation');
const Claim = require('../models/Claim');
const RestaurantProfile = require('../models/RestaurantProfile');
const { getSimulatedNow } = require('../services/clockService');
const {
  validateDonationInput,
  computeRemainingKg,
  computeDonationStatus
} = require('../services/ruleValidationService');
const { cancelDonation } = require('../services/donationService');

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/donations
async function listDonations(req, res) {
  try {
    const { zone, status, userLat, userLon, sort } = req.query;
    const simulatedNow = await getSimulatedNow();

    const donors = await RestaurantProfile.find();
    const donorMap = {};
    donors.forEach((d) => {
      donorMap[d.donorId] = d;
    });

    const allDonations = await Donation.find().sort({ createdAt: -1 });
    const populated = [];

    for (const d of allDonations) {
      const { remaining, claims } = await computeRemainingKg(d.id, d.quantity_kg);
      const computedStatus = computeDonationStatus(d, remaining, simulatedNow);
      const donor = donorMap[d.donor_id];

      let distanceKm = null;
      if (userLat && userLon && donor && donor.location && donor.location.coordinates) {
        const [dLon, dLat] = donor.location.coordinates;
        distanceKm = calculateDistanceKm(Number(userLat), Number(userLon), dLat, dLon);
      }

      // Check filters
      if (zone && d.zone !== zone) continue;
      if (status && computedStatus !== status) continue;

      populated.push({
        id: d.id,
        donor_id: d.donor_id,
        restaurantName: donor ? donor.restaurantName : d.donor_id,
        description: d.description,
        quantity_kg: d.quantity_kg,
        remaining_kg: remaining,
        pickup_from: d.pickup_from,
        pickup_until: d.pickup_until,
        zone: d.zone,
        status: computedStatus,
        cancelled: d.cancelled,
        packagingType: d.packagingType,
        packCount: d.packCount,
        approxKgPerPack: d.approxKgPerPack,
        bulkDivisionNeeded: d.bulkDivisionNeeded,
        instructions: d.instructions,
        allergens: d.allergens,
        imageUrl: d.imageUrl,
        donorLocation: donor ? donor.location : null,
        distanceKm,
        claimsCount: claims.length
      });
    }

    if (sort === 'distance' && userLat && userLon) {
      populated.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else if (sort === 'urgency') {
      populated.sort((a, b) => a.pickup_until.localeCompare(b.pickup_until));
    } else if (sort === 'quantity') {
      populated.sort((a, b) => b.remaining_kg - a.remaining_kg);
    }

    res.json({
      success: true,
      simulatedNow,
      donations: populated
    });
  } catch (err) {
    console.error('[List Donations Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/donations
async function createDonation(req, res) {
  try {
    const simulatedNow = await getSimulatedNow();
    const {
      description,
      quantity_kg,
      pickup_from,
      pickup_until,
      packagingType,
      packCount,
      approxKgPerPack,
      bulkDivisionNeeded,
      instructions,
      allergens,
      preparationTime,
      imageUrl
    } = req.body;

    const donorId = req.actor?.donorId || req.body.donor_id;
    if (!donorId) {
      return res.status(400).json({
        success: false,
        message: 'Donor identification required. Please select a donor or sign in as a restaurant.'
      });
    }

    const donor = await RestaurantProfile.findOne({ donorId });
    if (!donor) {
      return res.status(404).json({ success: false, message: `Donor profile ${donorId} not found.` });
    }

    // Validate input and business rules
    const validation = validateDonationInput(
      { description, quantity_kg, pickup_from, pickup_until },
      simulatedNow
    );

    if (!validation.isValid) {
      const allErrors = [...validation.inputErrors, ...validation.ruleErrors];
      return res.status(validation.inputErrors.length > 0 ? 400 : 422).json({
        success: false,
        message: 'Donation validation failed',
        errors: allErrors
      });
    }

    // Generate donation ID
    const count = await Donation.countDocuments();
    const id = `DN${count + 1}`;

    const newDonation = await Donation.create({
      id,
      donor_id: donorId,
      description: description.trim(),
      quantity_kg: parseInt(quantity_kg, 10),
      pickup_from,
      pickup_until,
      zone: donor.zone,
      cancelled: false,
      packagingType: packagingType || 'unspecified',
      packCount: Number(packCount) || 0,
      approxKgPerPack: Number(approxKgPerPack) || 0,
      bulkDivisionNeeded: Boolean(bulkDivisionNeeded),
      instructions: instructions || '',
      allergens: allergens || '',
      preparationTime: preparationTime || '',
      imageUrl: imageUrl || ''
    });

    res.status(201).json({
      success: true,
      donation: {
        ...newDonation.toObject(),
        remaining_kg: newDonation.quantity_kg,
        status: 'OPEN'
      }
    });
  } catch (err) {
    console.error('[Create Donation Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/donations/mine
async function getMyDonations(req, res) {
  try {
    const donorId = req.actor?.donorId;
    if (!donorId) {
      return res.status(400).json({ success: false, message: 'No active restaurant persona.' });
    }

    const simulatedNow = await getSimulatedNow();
    const donations = await Donation.find({ donor_id: donorId }).sort({ createdAt: -1 });

    const results = [];
    for (const d of donations) {
      const { remaining } = await computeRemainingKg(d.id, d.quantity_kg);
      const status = computeDonationStatus(d, remaining, simulatedNow);
      const claims = await Claim.find({ donation_id: d.id }).sort({ createdAt: -1 });

      results.push({
        ...d.toObject(),
        remaining_kg: remaining,
        status,
        claims
      });
    }

    res.json({
      success: true,
      simulatedNow,
      donations: results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/donations/:id/cancel
async function cancelDonationEndpoint(req, res) {
  try {
    const { id } = req.params;
    const donorId = req.actor?.donorId;

    const result = await cancelDonation({ donationId: id, donorId });
    res.json({
      success: true,
      message: 'Donation successfully cancelled',
      donation: result
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      errors: err.errors || [err.message]
    });
  }
}

// GET /api/donations/:id
async function getDonationById(req, res) {
  try {
    const { id } = req.params;
    const simulatedNow = await getSimulatedNow();

    const donation = await Donation.findOne({ id });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const donor = await RestaurantProfile.findOne({ donorId: donation.donor_id });
    const { remaining, claims } = await computeRemainingKg(donation.id, donation.quantity_kg);
    const status = computeDonationStatus(donation, remaining, simulatedNow);

    res.json({
      success: true,
      simulatedNow,
      donation: {
        ...donation.toObject(),
        restaurantName: donor ? donor.restaurantName : donation.donor_id,
        address: donor ? donor.address : '',
        location: donor ? donor.location : null,
        remaining_kg: remaining,
        status,
        claims
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  listDonations,
  createDonation,
  getMyDonations,
  cancelDonationEndpoint,
  getDonationById
};
