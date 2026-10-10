const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const SimulationClock = require('../models/SimulationClock');
const User = require('../models/User');
const RestaurantProfile = require('../models/RestaurantProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const Donation = require('../models/Donation');
const CommunityHero = require('../models/CommunityHero');

// Clearly documented sample demo coordinates for map preview (assumption)
const SAMPLE_DONOR_COORDINATES = {
  D1: [77.5946, 12.9816], // North
  D2: [77.6050, 12.9900], // North
  D3: [77.5750, 12.9200], // South
  D4: [77.6500, 12.9650], // East
  D5: [77.5250, 12.9600]  // West
};

const SAMPLE_VOLUNTEER_COORDINATES = {
  V1: [77.6000, 12.9750], // North/East
  V2: [77.5900, 12.9850], // North
  V3: [77.5700, 12.9150], // South
  V4: [77.5400, 12.9350], // South/West
  V5: [77.6600, 12.9700], // East
  V6: [77.5350, 12.9700]  // West/North
};

async function initializeSeedIfNeeded() {
  let clock = await SimulationClock.findOne({ key: 'global' });
  if (clock && clock.seedInitialized) {
    console.log('[Seed] Database already initialized. Skipping seed.');
    return clock;
  }

  console.log('[Seed] Initializing seed data from seed.json...');

  // Read seed.json
  const seedPath = path.resolve(__dirname, '../../../seed.json');
  if (!fs.existsSync(seedPath)) {
    throw new Error(`seed.json not found at ${seedPath}`);
  }
  const seedRaw = fs.readFileSync(seedPath, 'utf8');
  const seedData = JSON.parse(seedRaw);

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Initialize Clock
  if (!clock) {
    clock = new SimulationClock({
      key: 'global',
      simulatedNow: seedData.clock || '2026-03-10T12:00',
      seedInitialized: true,
      schemaVersion: 1
    });
  } else {
    clock.simulatedNow = seedData.clock || '2026-03-10T12:00';
    clock.seedInitialized = true;
  }
  await clock.save();

  // Create Donors
  for (const d of seedData.donors) {
    const email = `${d.id.toLowerCase()}@surpluslink.org`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: d.name,
        email,
        passwordHash: defaultPasswordHash,
        role: 'RESTAURANT',
        phone: '+91 98765 43210',
        publicProfileEnabled: true,
        demoId: d.id
      });
    }

    const coords = SAMPLE_DONOR_COORDINATES[d.id] || [77.5946, 12.9716];
    await RestaurantProfile.findOneAndUpdate(
      { donorId: d.id },
      {
        donorId: d.id,
        userId: user._id,
        restaurantName: d.name,
        zone: d.zone,
        address: `${d.name}, ${d.zone} Food Street`,
        location: {
          type: 'Point',
          coordinates: coords
        },
        locationVisibility: true
      },
      { upsert: true, new: true }
    );

    await CommunityHero.findOneAndUpdate(
      { profileId: d.id },
      {
        profileId: d.id,
        displayName: d.name,
        role: 'RESTAURANT',
        zone: d.zone,
        bio: `Committed to zero food waste in ${d.zone} zone.`,
        optInVisibility: true,
        story: 'Donating freshly prepared leftover surplus meals daily to local communities.'
      },
      { upsert: true }
    );
  }

  // Create Volunteers
  for (const v of seedData.volunteers) {
    const email = `${v.id.toLowerCase()}@surpluslink.org`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: v.name,
        email,
        passwordHash: defaultPasswordHash,
        role: 'VOLUNTEER',
        phone: '+91 91234 56789',
        publicProfileEnabled: true,
        demoId: v.id
      });
    }

    const coords = SAMPLE_VOLUNTEER_COORDINATES[v.id] || [77.5946, 12.9716];
    await VolunteerProfile.findOneAndUpdate(
      { volunteerId: v.id },
      {
        volunteerId: v.id,
        userId: user._id,
        name: v.name,
        capacity_kg: v.capacity_kg,
        zones: v.zones,
        location: {
          type: 'Point',
          coordinates: coords
        },
        vehicleType: v.capacity_kg >= 25 ? 'Cargo Van' : 'Hatchback / Bike with Carrier',
        publicProfileEnabled: true
      },
      { upsert: true, new: true }
    );

    await CommunityHero.findOneAndUpdate(
      { profileId: v.id },
      {
        profileId: v.id,
        displayName: v.name,
        role: 'VOLUNTEER',
        zone: v.zones.join(', '),
        bio: `Volunteer rescuer serving ${v.zones.join(', ')} zones with ${v.capacity_kg}kg vehicle capacity.`,
        optInVisibility: true,
        story: 'Dedicated to rapid food pickup and direct distribution to community shelters.'
      },
      { upsert: true }
    );
  }

  // Create Coordinator User for optional NGO view
  const coordEmail = 'coordinator@surpluslink.org';
  if (!(await User.findOne({ email: coordEmail }))) {
    await User.create({
      name: 'City NGO Coordinator',
      email: coordEmail,
      passwordHash: defaultPasswordHash,
      role: 'COORDINATOR',
      phone: '+91 99999 88888',
      demoId: 'COORD1'
    });
  }

  // Create Seed Donations
  const donorZoneMap = {};
  seedData.donors.forEach((d) => {
    donorZoneMap[d.id] = d.zone;
  });

  for (const dn of seedData.donations) {
    await Donation.findOneAndUpdate(
      { id: dn.id },
      {
        id: dn.id,
        donor_id: dn.donor_id,
        description: dn.description,
        quantity_kg: dn.quantity_kg,
        pickup_from: dn.pickup_from,
        pickup_until: dn.pickup_until,
        zone: donorZoneMap[dn.donor_id] || 'NORTH',
        cancelled: false,
        packagingType: dn.quantity_kg >= 25 ? 'bulk' : 'individually_packed',
        packCount: dn.quantity_kg >= 25 ? 2 : Math.round(dn.quantity_kg * 2),
        approxKgPerPack: dn.quantity_kg >= 25 ? Math.round(dn.quantity_kg / 2) : 0.5,
        bulkDivisionNeeded: dn.quantity_kg >= 25,
        instructions: 'Handle with hygiene standards; keep covered during transit.'
      },
      { upsert: true, new: true }
    );
  }

  console.log('[Seed] Database initialization complete.');
  return clock;
}

module.exports = {
  initializeSeedIfNeeded,
  SAMPLE_DONOR_COORDINATES,
  SAMPLE_VOLUNTEER_COORDINATES
};
