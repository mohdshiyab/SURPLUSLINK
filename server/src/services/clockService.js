const SimulationClock = require('../models/SimulationClock');
const Donation = require('../models/Donation');
const Claim = require('../models/Claim');

/**
 * Parses local YYYY-MM-DDTHH:MM into milliseconds timestamp (UTC-pinned to prevent host timezone distortion)
 */
function parseLocalTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  // If timeStr does not have seconds, append :00Z
  const normalized = timeStr.length === 16 ? `${timeStr}:00Z` : `${timeStr}Z`;
  return Date.parse(normalized);
}

/**
 * Compares two local time strings
 * returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareLocalTimes(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Returns difference in minutes between two local time strings: (b - a) in minutes
 */
function diffMinutes(a, b) {
  const msA = parseLocalTime(a);
  const msB = parseLocalTime(b);
  return (msB - msA) / (1000 * 60);
}

async function getSimulatedClock() {
  let clock = await SimulationClock.findOne({ key: 'global' });
  if (!clock) {
    clock = await SimulationClock.create({
      key: 'global',
      simulatedNow: '2026-03-10T12:00',
      seedInitialized: false,
      schemaVersion: 1
    });
  }
  return clock;
}

async function getSimulatedNow() {
  const clock = await getSimulatedClock();
  return clock.simulatedNow;
}

/**
 * Advances simulated clock and auto-transitions ACTIVE claims on expired donations to MISSED
 */
async function advanceSimulatedClock(newTimeStr) {
  if (!newTimeStr || typeof newTimeStr !== 'string') {
    throw new Error('Invalid date/time format. Expected YYYY-MM-DDTHH:MM');
  }

  // Regex check for YYYY-MM-DDTHH:MM
  const timeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!timeRegex.test(newTimeStr)) {
    throw new Error('Time must be formatted as YYYY-MM-DDTHH:MM');
  }

  const clock = await getSimulatedClock();
  const currentNow = clock.simulatedNow;

  // Rule: Clock can move forward or stay the same, NEVER backward
  if (compareLocalTimes(newTimeStr, currentNow) < 0) {
    throw new Error(`Clock cannot move backward. Current simulated time is ${currentNow}, attempted: ${newTimeStr}`);
  }

  clock.simulatedNow = newTimeStr;
  await clock.save();

  // Process MISSED claims:
  // "When the simulated clock moves past a donation's pickup_until, all its ACTIVE claims become MISSED."
  // That means for any donation where pickup_until < newTimeStr, its ACTIVE claims become MISSED.
  const expiredDonations = await Donation.find({
    pickup_until: { $lt: newTimeStr }
  }).select('id');

  const expiredDonationIds = expiredDonations.map((d) => d.id);

  let updatedMissedCount = 0;
  if (expiredDonationIds.length > 0) {
    const res = await Claim.updateMany(
      {
        donation_id: { $in: expiredDonationIds },
        status: 'ACTIVE'
      },
      {
        $set: {
          status: 'MISSED',
          missedAt: newTimeStr
        }
      }
    );
    updatedMissedCount = res.modifiedCount;
  }

  return {
    simulatedNow: clock.simulatedNow,
    updatedMissedCount
  };
}

module.exports = {
  parseLocalTime,
  compareLocalTimes,
  diffMinutes,
  getSimulatedClock,
  getSimulatedNow,
  advanceSimulatedClock
};
