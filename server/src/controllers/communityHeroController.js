const CommunityHero = require('../models/CommunityHero');
const Claim = require('../models/Claim');
const Donation = require('../models/Donation');
const RestaurantProfile = require('../models/RestaurantProfile');
const VolunteerProfile = require('../models/VolunteerProfile');

function calculateBadges({ collectedKg, pickups, missed }) {
  const badges = [];
  if (collectedKg > 0) badges.push('First Rescue');
  if (pickups >= 3) badges.push('Consistent Helper');
  if (collectedKg >= 100) badges.push('100 kg Rescued');
  if (missed === 0 && pickups >= 1) badges.push('Reliable Pickup');
  if (collectedKg >= 30) badges.push('Community Hero');
  return badges;
}

// GET /api/community-heroes
async function getCommunityHeroes(req, res) {
  try {
    const heroes = await CommunityHero.find({ optInVisibility: true });

    // Aggregate real stats
    const donations = await Donation.find({ cancelled: false });
    const donationMap = {};
    donations.forEach((d) => {
      donationMap[d.id] = d;
    });

    const claims = await Claim.find();
    const donorStats = {};
    const volStats = {};

    for (const c of claims) {
      if (c.status === 'COLLECTED') {
        // Volunteer stats
        if (!volStats[c.volunteer_id]) volStats[c.volunteer_id] = { collectedKg: 0, pickups: 0, missed: 0 };
        volStats[c.volunteer_id].collectedKg += c.kg;
        volStats[c.volunteer_id].pickups += 1;

        // Donor stats
        const d = donationMap[c.donation_id];
        if (d) {
          if (!donorStats[d.donor_id]) donorStats[d.donor_id] = { collectedKg: 0, pickups: 0, missed: 0 };
          donorStats[d.donor_id].collectedKg += c.kg;
          donorStats[d.donor_id].pickups += 1;
        }
      } else if (c.status === 'MISSED') {
        if (!volStats[c.volunteer_id]) volStats[c.volunteer_id] = { collectedKg: 0, pickups: 0, missed: 0 };
        volStats[c.volunteer_id].missed += 1;
      }
    }

    const publicProfiles = heroes.map((h) => {
      const stats =
        h.role === 'RESTAURANT'
          ? donorStats[h.profileId] || { collectedKg: 0, pickups: 0, missed: 0 }
          : volStats[h.profileId] || { collectedKg: 0, pickups: 0, missed: 0 };

      const badges = calculateBadges(stats);

      return {
        profileId: h.profileId,
        displayName: h.displayName,
        role: h.role,
        zone: h.zone,
        bio: h.bio,
        avatar: h.avatar,
        story: h.story,
        collectedKg: stats.collectedKg,
        pickups: stats.pickups,
        badges
      };
    });

    res.json({
      success: true,
      heroes: publicProfiles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/profile/public-visibility
async function updatePublicVisibility(req, res) {
  try {
    const { optInVisibility } = req.body;
    const profileId = req.actor?.donorId || req.actor?.volunteerId || req.body.profileId;

    if (!profileId) {
      return res.status(400).json({ success: false, message: 'Profile ID required' });
    }

    const hero = await CommunityHero.findOneAndUpdate(
      { profileId },
      { $set: { optInVisibility: Boolean(optInVisibility) } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Profile public visibility updated to ${hero.optInVisibility}`,
      optInVisibility: hero.optInVisibility
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getCommunityHeroes,
  updatePublicVisibility
};
