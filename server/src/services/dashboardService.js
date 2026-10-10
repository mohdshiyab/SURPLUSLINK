const Donation = require('../models/Donation');
const Claim = require('../models/Claim');
const RestaurantProfile = require('../models/RestaurantProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const { getSimulatedNow } = require('./clockService');
const { computeRemainingKg, computeDonationStatus } = require('./ruleValidationService');

async function getDashboardSummary() {
  const simulatedNow = await getSimulatedNow();

  // Find all donations that are not CANCELLED
  const nonCancelledDonations = await Donation.find({ cancelled: false });
  const nonCancelledDonationIds = nonCancelledDonations.map((d) => d.id);

  // Find all claims for non-cancelled donations
  const allClaims = await Claim.find({
    donation_id: { $in: nonCancelledDonationIds }
  });

  // Calculate quantities
  let listed = 0;
  let collected = 0;
  let missed = 0;
  let inProgress = 0;
  let wasted = 0;
  let stillOpen = 0;

  // Group claims by donation_id
  const claimsByDonation = {};
  for (const c of allClaims) {
    if (!claimsByDonation[c.donation_id]) {
      claimsByDonation[c.donation_id] = [];
    }
    claimsByDonation[c.donation_id].push(c);

    if (c.status === 'COLLECTED') collected += c.kg;
    if (c.status === 'MISSED') missed += c.kg;
    if (c.status === 'ACTIVE') inProgress += c.kg;
  }

  // Iterate over each non-cancelled donation to compute remaining kg and status
  for (const donation of nonCancelledDonations) {
    listed += donation.quantity_kg;

    const donationClaims = claimsByDonation[donation.id] || [];
    const nonCancelledClaimsKg = donationClaims
      .filter((c) => c.status !== 'CANCELLED')
      .reduce((sum, c) => sum + c.kg, 0);

    const remainingKg = Math.max(0, donation.quantity_kg - nonCancelledClaimsKg);
    const status = computeDonationStatus(donation, remainingKg, simulatedNow);

    if (status === 'EXPIRED') {
      wasted += remainingKg;
    } else {
      stillOpen += remainingKg;
    }
  }

  const sumOfFive = collected + missed + wasted + inProgress + stillOpen;
  const invariantPassed = listed === sumOfFive;

  return {
    simulatedNow,
    listed,
    collected,
    missed,
    wasted,
    inProgress,
    stillOpen,
    sumOfFive,
    equation: `${listed} = ${collected} (Collected) + ${missed} (Missed) + ${wasted} (Wasted) + ${inProgress} (In progress) + ${stillOpen} (Still open)`,
    invariantPassed,
    status: invariantPassed ? 'PASS' : 'FAIL'
  };
}

async function getImpactDetails() {
  const simulatedNow = await getSimulatedNow();

  // Donors impact
  const donors = await RestaurantProfile.find();
  const nonCancelledDonations = await Donation.find({ cancelled: false });
  const allDonationIds = nonCancelledDonations.map((d) => d.id);

  const collectedClaims = await Claim.find({
    donation_id: { $in: allDonationIds },
    status: 'COLLECTED'
  });

  const donationDonorMap = {};
  nonCancelledDonations.forEach((d) => {
    donationDonorMap[d.id] = d.donor_id;
  });

  const donorCollectedKg = {};
  for (const claim of collectedClaims) {
    const donorId = donationDonorMap[claim.donation_id];
    if (donorId) {
      donorCollectedKg[donorId] = (donorCollectedKg[donorId] || 0) + claim.kg;
    }
  }

  const donorStats = donors.map((d) => ({
    donorId: d.donorId,
    restaurantName: d.restaurantName,
    zone: d.zone,
    collectedKg: donorCollectedKg[d.donorId] || 0
  }));

  // Volunteers impact
  const volunteers = await VolunteerProfile.find();
  const allVolunteerClaims = await Claim.find();

  const volCollectedKg = {};
  const volMissedCount = {};

  for (const c of allVolunteerClaims) {
    if (c.status === 'COLLECTED') {
      volCollectedKg[c.volunteer_id] = (volCollectedKg[c.volunteer_id] || 0) + c.kg;
    }
    if (c.status === 'MISSED') {
      volMissedCount[c.volunteer_id] = (volMissedCount[c.volunteer_id] || 0) + 1;
    }
  }

  const volunteerStats = volunteers.map((v) => ({
    volunteerId: v.volunteerId,
    name: v.name,
    capacity_kg: v.capacity_kg,
    zones: v.zones,
    collectedKg: volCollectedKg[v.volunteerId] || 0,
    missedClaimsCount: volMissedCount[v.volunteerId] || 0
  }));

  return {
    simulatedNow,
    donors: donorStats,
    volunteers: volunteerStats
  };
}

module.exports = {
  getDashboardSummary,
  getImpactDetails
};
