const Donation = require('../models/Donation');
const Claim = require('../models/Claim');
const RestaurantProfile = require('../models/RestaurantProfile');
const VolunteerProfile = require('../models/VolunteerProfile');

// GET /api/leaderboards
async function getLeaderboards(req, res) {
  try {
    const { period } = req.query; // 'all-time', etc.

    // 1. Restaurant Leaderboard
    const donors = await RestaurantProfile.find();
    const donations = await Donation.find({ cancelled: false });
    const donationMap = {};
    donations.forEach((d) => {
      donationMap[d.id] = d;
    });

    const collectedClaims = await Claim.find({
      status: 'COLLECTED',
      donation_id: { $in: Object.keys(donationMap) }
    });

    const donorCollectedKg = {};
    const donorSuccessfulDonationsSet = {};

    for (const claim of collectedClaims) {
      const d = donationMap[claim.donation_id];
      if (d) {
        donorCollectedKg[d.donor_id] = (donorCollectedKg[d.donor_id] || 0) + claim.kg;
        if (!donorSuccessfulDonationsSet[d.donor_id]) {
          donorSuccessfulDonationsSet[d.donor_id] = new Set();
        }
        donorSuccessfulDonationsSet[d.donor_id].add(d.id);
      }
    }

    const restaurantLeaderboard = donors
      .map((d) => {
        const collectedKg = donorCollectedKg[d.donorId] || 0;
        const successfulDonations = donorSuccessfulDonationsSet[d.donorId]
          ? donorSuccessfulDonationsSet[d.donorId].size
          : 0;
        return {
          id: d.donorId,
          name: d.restaurantName,
          zone: d.zone,
          collectedKg,
          successfulDonations
        };
      })
      .sort((a, b) => b.collectedKg - a.collectedKg || b.successfulDonations - a.successfulDonations);

    // 2. Volunteer Leaderboard
    const volunteers = await VolunteerProfile.find();
    const allClaims = await Claim.find();

    const volCollectedKg = {};
    const volPickupsCount = {};
    const volMissedCount = {};

    for (const c of allClaims) {
      if (c.status === 'COLLECTED') {
        volCollectedKg[c.volunteer_id] = (volCollectedKg[c.volunteer_id] || 0) + c.kg;
        volPickupsCount[c.volunteer_id] = (volPickupsCount[c.volunteer_id] || 0) + 1;
      } else if (c.status === 'MISSED') {
        volMissedCount[c.volunteer_id] = (volMissedCount[c.volunteer_id] || 0) + 1;
      }
    }

    const volunteerLeaderboard = volunteers
      .map((v) => {
        const collectedKg = volCollectedKg[v.volunteerId] || 0;
        const pickups = volPickupsCount[v.volunteerId] || 0;
        const missed = volMissedCount[v.volunteerId] || 0;
        const totalAttempts = pickups + missed;
        const reliabilityRate = totalAttempts > 0 ? Math.round((pickups / totalAttempts) * 100) : 100;

        return {
          id: v.volunteerId,
          name: v.name,
          zones: v.zones,
          capacity_kg: v.capacity_kg,
          collectedKg,
          pickups,
          missed,
          reliabilityRate
        };
      })
      .sort((a, b) => b.collectedKg - a.collectedKg || b.pickups - a.pickups);

    res.json({
      success: true,
      rankingMetric: 'Actual Collected Kilograms',
      restaurants: restaurantLeaderboard,
      volunteers: volunteerLeaderboard
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getLeaderboards
};
