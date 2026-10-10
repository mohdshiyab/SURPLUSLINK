const { compareLocalTimes, diffMinutes } = require('./clockService');
const Claim = require('../models/Claim');

/**
 * Validates whole number integer >= 1
 */
function isValidWholeKg(val) {
  if (typeof val === 'number') {
    return Number.isInteger(val) && val >= 1;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    return Number.isInteger(num) && num >= 1;
  }
  return false;
}

/**
 * Calculates remaining kg for a donation
 * Remaining kg = original quantity_kg minus the kg of every claim whose status is not CANCELLED
 */
async function computeRemainingKg(donationId, originalQuantity) {
  const claims = await Claim.find({
    donation_id: donationId,
    status: { $ne: 'CANCELLED' }
  });

  const claimedKg = claims.reduce((sum, c) => sum + c.kg, 0);
  const remaining = Math.max(0, originalQuantity - claimedKg);
  return { remaining, claimedKg, claims };
}

/**
 * Computes official status of a donation based on current simulatedNow
 * Priority order:
 * 1. CANCELLED if donor cancelled it
 * 2. EXPIRED if now > pickup_until
 * 3. FULLY_CLAIMED if remaining kg === 0
 * 4. OPEN
 */
function computeDonationStatus(donation, remainingKg, simulatedNow) {
  if (donation.cancelled) {
    return 'CANCELLED';
  }
  // If simulatedNow is past pickup_until (simulatedNow > pickup_until)
  if (compareLocalTimes(simulatedNow, donation.pickup_until) > 0) {
    return 'EXPIRED';
  }
  if (remainingKg === 0) {
    return 'FULLY_CLAIMED';
  }
  return 'OPEN';
}

/**
 * Validates input for creating a donation
 */
function validateDonationInput({ description, quantity_kg, pickup_from, pickup_until }, simulatedNow) {
  const inputErrors = [];
  const ruleErrors = [];

  // 1. Quantity validation
  if (!isValidWholeKg(quantity_kg)) {
    inputErrors.push('Quantity must be a whole positive number of kilograms (at least 1 kg).');
  }

  // 2. Format validation
  const timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!pickup_from || !timeRegex.test(pickup_from)) {
    inputErrors.push('Pickup start time must be in YYYY-MM-DDTHH:MM format.');
  }
  if (!pickup_until || !timeRegex.test(pickup_until)) {
    inputErrors.push('Pickup end time must be in YYYY-MM-DDTHH:MM format.');
  }

  if (inputErrors.length > 0) {
    return { isValid: false, inputErrors, ruleErrors };
  }

  // 3. Business rule checks
  // pickup_from must be strictly before pickup_until
  if (compareLocalTimes(pickup_from, pickup_until) >= 0) {
    ruleErrors.push('Pickup start time (pickup_from) must be strictly before pickup end time (pickup_until).');
  }

  // pickup_until must not be before simulated now (pickup_until < simulatedNow)
  if (compareLocalTimes(pickup_until, simulatedNow) < 0) {
    ruleErrors.push('Pickup end time (pickup_until) cannot be before current simulated time.');
  }

  return {
    isValid: ruleErrors.length === 0,
    inputErrors,
    ruleErrors
  };
}

/**
 * Evaluates all 7 claim rules and collects EVERY violated rule
 */
async function evaluateClaimRules({
  donation,
  volunteer,
  claimedKg,
  plannedPickupTime,
  simulatedNow
}) {
  // Input validations first
  const inputErrors = [];
  if (!isValidWholeKg(claimedKg)) {
    inputErrors.push('Claimed quantity must be a whole positive number of kilograms (at least 1 kg).');
  }

  const timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!plannedPickupTime || !timeRegex.test(plannedPickupTime)) {
    inputErrors.push('Planned pickup time must be in YYYY-MM-DDTHH:MM format.');
  }

  if (inputErrors.length > 0) {
    return {
      isValid: false,
      isInputError: true,
      errors: inputErrors
    };
  }

  const parsedKg = parseInt(claimedKg, 10);
  const ruleViolations = [];

  // Calculate donation current remaining kg and status
  const { remaining } = await computeRemainingKg(donation.id, donation.quantity_kg);
  const currentStatus = computeDonationStatus(donation, remaining, simulatedNow);

  // Rule 1: The donation is not CANCELLED or EXPIRED.
  if (currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') {
    ruleViolations.push(`Rule 1 violated: Donation is ${currentStatus} and cannot be claimed.`);
  }

  // Rule 2: kg is at most V's capacity.
  if (parsedKg > volunteer.capacity_kg) {
    ruleViolations.push(
      `Rule 2 violated: Claimed quantity (${parsedKg} kg) exceeds volunteer capacity (${volunteer.capacity_kg} kg).`
    );
  }

  // Rule 3: kg is at most the donation's remaining kg.
  if (parsedKg > remaining) {
    ruleViolations.push(
      `Rule 3 violated: Claimed quantity (${parsedKg} kg) exceeds remaining donation quantity (${remaining} kg).`
    );
  }

  // Rule 4: The donation's zone is one of V's zones.
  const volZones = Array.isArray(volunteer.zones) ? volunteer.zones : [volunteer.zones];
  if (!volZones.includes(donation.zone)) {
    ruleViolations.push(
      `Rule 4 violated: Donation zone (${donation.zone}) is not in volunteer zones ([${volZones.join(', ')}]).`
    );
  }

  // Rule 5: T is between pickup_from and pickup_until, both inclusive.
  const tBeforeFrom = compareLocalTimes(plannedPickupTime, donation.pickup_from) < 0;
  const tAfterUntil = compareLocalTimes(plannedPickupTime, donation.pickup_until) > 0;
  if (tBeforeFrom || tAfterUntil) {
    ruleViolations.push(
      `Rule 5 violated: Planned pickup time (${plannedPickupTime}) must be between pickup_from (${donation.pickup_from}) and pickup_until (${donation.pickup_until}), inclusive.`
    );
  }

  // Rule 6: T is not before now (T >= simulatedNow).
  if (compareLocalTimes(plannedPickupTime, simulatedNow) < 0) {
    ruleViolations.push(
      `Rule 6 violated: Planned pickup time (${plannedPickupTime}) cannot be before current simulated time (${simulatedNow}).`
    );
  }

  // Rule 7: T is at least 60 minutes from the planned time of every other ACTIVE or COLLECTED claim of V.
  const existingClaims = await Claim.find({
    volunteer_id: volunteer.volunteerId,
    status: { $in: ['ACTIVE', 'COLLECTED'] }
  });

  for (const other of existingClaims) {
    const diff = Math.abs(diffMinutes(plannedPickupTime, other.plannedPickupTime));
    if (diff < 60) {
      ruleViolations.push(
        `Rule 7 violated: Planned pickup time (${plannedPickupTime}) is within ${diff.toFixed(0)} minutes of claim #${other.claim_id} at ${other.plannedPickupTime}. Must be at least 60 minutes apart.`
      );
      break; // One violation note is sufficient for Rule 7
    }
  }

  return {
    isValid: ruleViolations.length === 0,
    isInputError: false,
    errors: ruleViolations,
    remainingKg: remaining
  };
}

/**
 * Validates donor donation cancellation
 * "A donor can cancel a donation only while it is OPEN and has no ACTIVE or COLLECTED claims."
 */
async function validateDonationCancellation(donation, simulatedNow) {
  const reasons = [];

  const { remaining } = await computeRemainingKg(donation.id, donation.quantity_kg);
  const status = computeDonationStatus(donation, remaining, simulatedNow);

  if (status !== 'OPEN') {
    reasons.push(`Donation cannot be cancelled because its status is ${status} (must be OPEN).`);
  }

  const blockingClaims = await Claim.find({
    donation_id: donation.id,
    status: { $in: ['ACTIVE', 'COLLECTED'] }
  });

  if (blockingClaims.length > 0) {
    reasons.push(
      `Donation cannot be cancelled because it has ${blockingClaims.length} ACTIVE or COLLECTED claim(s).`
    );
  }

  return {
    isAllowed: reasons.length === 0,
    reasons
  };
}

/**
 * Validates marking a claim COLLECTED
 * "V marks an ACTIVE claim COLLECTED, only when now is between pickup_from and pickup_until, both inclusive."
 */
function validateClaimCollection(claim, donation, simulatedNow) {
  const reasons = [];

  if (claim.status !== 'ACTIVE') {
    reasons.push(`Claim status is ${claim.status}. Only ACTIVE claims can be marked COLLECTED.`);
  }

  const nowBeforeFrom = compareLocalTimes(simulatedNow, donation.pickup_from) < 0;
  const nowAfterUntil = compareLocalTimes(simulatedNow, donation.pickup_until) > 0;

  if (nowBeforeFrom || nowAfterUntil) {
    reasons.push(
      `Collection is only permitted within the pickup window [${donation.pickup_from} to ${donation.pickup_until}]. Current time is ${simulatedNow}.`
    );
  }

  return {
    isAllowed: reasons.length === 0,
    reasons
  };
}

/**
 * Validates volunteer cancelling an ACTIVE claim
 * "V cancels an ACTIVE claim, only if now is strictly before T."
 */
function validateClaimCancellation(claim, simulatedNow) {
  const reasons = [];

  if (claim.status !== 'ACTIVE') {
    reasons.push(`Claim status is ${claim.status}. Only ACTIVE claims can be cancelled.`);
  }

  if (compareLocalTimes(simulatedNow, claim.plannedPickupTime) >= 0) {
    reasons.push(
      `Claim cancellation is only permitted strictly before planned pickup time (${claim.plannedPickupTime}). Current time is ${simulatedNow}.`
    );
  }

  return {
    isAllowed: reasons.length === 0,
    reasons
  };
}

module.exports = {
  isValidWholeKg,
  computeRemainingKg,
  computeDonationStatus,
  validateDonationInput,
  evaluateClaimRules,
  validateDonationCancellation,
  validateClaimCollection,
  validateClaimCancellation
};
