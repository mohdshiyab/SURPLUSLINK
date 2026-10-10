const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SimulationClock = require('../models/SimulationClock');
const Donation = require('../models/Donation');
const Claim = require('../models/Claim');
const ActivityLog = require('../models/ActivityLog');
const { initializeSeedIfNeeded } = require('../services/seedService');

async function reset() {
  await connectDB();
  console.log('[Reset] Clearing dynamic records...');
  await Claim.deleteMany({});
  await ActivityLog.deleteMany({});
  await Donation.deleteMany({});
  await SimulationClock.deleteMany({});
  console.log('[Reset] Re-seeding database...');
  await initializeSeedIfNeeded();
  console.log('[Reset] Done! Clean seed state restored.');
  await mongoose.connection.close();
}

if (require.main === module) {
  reset();
}

module.exports = reset;
