const Donation = require('../models/Donation');
const Claim = require('../models/Claim');
const VolunteerProfile = require('../models/VolunteerProfile');
const RestaurantProfile = require('../models/RestaurantProfile');
const ActivityLog = require('../models/ActivityLog');
const { getSimulatedNow, advanceSimulatedClock } = require('./clockService');
const {
  computeRemainingKg,
  computeDonationStatus,
  evaluateClaimRules,
  validateDonationCancellation,
  validateClaimCollection,
  validateClaimCancellation
} = require('./ruleValidationService');

// Concurrency mutex for donation claims to guarantee no overbooking
const donationClaimLocks = new Map();

async function acquireDonationLock(donationId) {
  while (donationClaimLocks.get(donationId)) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  donationClaimLocks.set(donationId, true);
}

function releaseDonationLock(donationId) {
  donationClaimLocks.delete(donationId);
}

/**
 * Creates a claim atomically with complete rule validation
 */
async function createClaim({ donationId, volunteerId, kg, plannedPickupTime }) {
  await acquireDonationLock(donationId);
  try {
    const simulatedNow = await getSimulatedNow();

    const donation = await Donation.findOne({ id: donationId });
    if (!donation) {
      throw { status: 404, message: 'Donation not found' };
    }

    const volunteer = await VolunteerProfile.findOne({ volunteerId });
    if (!volunteer) {
      throw { status: 404, message: 'Volunteer profile not found' };
    }

    // Evaluate all 7 rules
    const evaluation = await evaluateClaimRules({
      donation,
      volunteer,
      claimedKg: kg,
      plannedPickupTime,
      simulatedNow
    });

    if (!evaluation.isValid) {
      // Log refusal
      await ActivityLog.create({
        actor: volunteerId,
        action: 'CLAIM_REFUSED',
        targetType: 'DONATION',
        targetId: donationId,
        outcome: 'FAILED',
        reasons: evaluation.errors,
        timestamp: simulatedNow
      });

      if (evaluation.isInputError) {
        throw { status: 400, message: 'Invalid claim input', errors: evaluation.errors };
      } else {
        throw { status: 422, message: 'Claim rule violations', errors: evaluation.errors };
      }
    }

    // Generate unique claim ID
    const count = await Claim.countDocuments();
    const claim_id = `CLM${Date.now().toString().slice(-6)}${count + 1}`;

    const newClaim = await Claim.create({
      claim_id,
      donation_id: donationId,
      volunteer_id: volunteerId,
      kg: parseInt(kg, 10),
      plannedPickupTime,
      status: 'ACTIVE'
    });

    // Check new remaining kg to see if it became FULLY_CLAIMED
    const { remaining } = await computeRemainingKg(donationId, donation.quantity_kg);
    const updatedStatus = computeDonationStatus(donation, remaining, simulatedNow);

    // Log success
    await ActivityLog.create({
      actor: volunteerId,
      action: 'CLAIM_CREATED',
      targetType: 'CLAIM',
      targetId: claim_id,
      outcome: 'SUCCESS',
      reasons: [],
      timestamp: simulatedNow
    });

    return {
      claim: newClaim,
      remainingKg: remaining,
      donationStatus: updatedStatus
    };
  } finally {
    releaseDonationLock(donationId);
  }
}

/**
 * Marks an ACTIVE claim as COLLECTED
 */
async function collectClaim({ claimId, volunteerId }) {
  const simulatedNow = await getSimulatedNow();
  const claim = await Claim.findOne({ claim_id: claimId });
  if (!claim) {
    throw { status: 404, message: 'Claim not found' };
  }

  // Authorization check: volunteer owns claim
  if (volunteerId && claim.volunteer_id !== volunteerId) {
    throw { status: 403, message: 'You are not authorized to collect this claim' };
  }

  const donation = await Donation.findOne({ id: claim.donation_id });
  if (!donation) {
    throw { status: 404, message: 'Associated donation not found' };
  }

  const validation = validateClaimCollection(claim, donation, simulatedNow);
  if (!validation.isAllowed) {
    throw { status: 422, message: 'Cannot collect claim', errors: validation.reasons };
  }

  claim.status = 'COLLECTED';
  claim.collectedAt = simulatedNow;
  await claim.save();

  await ActivityLog.create({
    actor: claim.volunteer_id,
    action: 'CLAIM_COLLECTED',
    targetType: 'CLAIM',
    targetId: claim.claim_id,
    outcome: 'SUCCESS',
    reasons: [],
    timestamp: simulatedNow
  });

  return claim;
}

/**
 * Volunteer cancels an ACTIVE claim
 */
async function cancelClaim({ claimId, volunteerId }) {
  const simulatedNow = await getSimulatedNow();
  const claim = await Claim.findOne({ claim_id: claimId });
  if (!claim) {
    throw { status: 404, message: 'Claim not found' };
  }

  if (volunteerId && claim.volunteer_id !== volunteerId) {
    throw { status: 403, message: 'You are not authorized to cancel this claim' };
  }

  const validation = validateClaimCancellation(claim, simulatedNow);
  if (!validation.isAllowed) {
    throw { status: 422, message: 'Cannot cancel claim', errors: validation.reasons };
  }

  claim.status = 'CANCELLED';
  claim.cancelledAt = simulatedNow;
  await claim.save();

  await ActivityLog.create({
    actor: claim.volunteer_id,
    action: 'CLAIM_CANCELLED',
    targetType: 'CLAIM',
    targetId: claim.claim_id,
    outcome: 'SUCCESS',
    reasons: [],
    timestamp: simulatedNow
  });

  // Calculate new remaining kg for associated donation
  const donation = await Donation.findOne({ id: claim.donation_id });
  const { remaining } = await computeRemainingKg(donation.id, donation.quantity_kg);
  const status = computeDonationStatus(donation, remaining, simulatedNow);

  return {
    claim,
    remainingKg: remaining,
    donationStatus: status
  };
}

/**
 * Donor cancels a donation
 */
async function cancelDonation({ donationId, donorId }) {
  const simulatedNow = await getSimulatedNow();
  const donation = await Donation.findOne({ id: donationId });
  if (!donation) {
    throw { status: 404, message: 'Donation not found' };
  }

  if (donorId && donation.donor_id !== donorId) {
    throw { status: 403, message: 'You are not authorized to cancel this donation' };
  }

  const validation = await validateDonationCancellation(donation, simulatedNow);
  if (!validation.isAllowed) {
    throw { status: 422, message: 'Cannot cancel donation', errors: validation.reasons };
  }

  donation.cancelled = true;
  donation.cancelledAt = simulatedNow;
  await donation.save();

  await ActivityLog.create({
    actor: donation.donor_id,
    action: 'DONATION_CANCELLED',
    targetType: 'DONATION',
    targetId: donation.id,
    outcome: 'SUCCESS',
    reasons: [],
    timestamp: simulatedNow
  });

  return donation;
}

module.exports = {
  createClaim,
  collectClaim,
  cancelClaim,
  cancelDonation
};
