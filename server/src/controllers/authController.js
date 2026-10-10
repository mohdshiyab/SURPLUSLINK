const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RestaurantProfile = require('../models/RestaurantProfile');
const VolunteerProfile = require('../models/VolunteerProfile');
const CommunityHero = require('../models/CommunityHero');
const { JWT_SECRET } = require('../middleware/auth');

function createToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      zone,
      zones,
      capacity_kg,
      address,
      vehicleType,
      coordinates
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.'
      });
    }

    if (!['RESTAURANT', 'VOLUNTEER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be RESTAURANT or VOLUNTEER.'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone: phone || ''
    });

    let profile = null;
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [77.5946, 12.9716];

    if (role === 'RESTAURANT') {
      const donorCount = await RestaurantProfile.countDocuments();
      const donorId = `D_USR_${donorCount + 1}`;
      profile = await RestaurantProfile.create({
        donorId,
        userId: user._id,
        restaurantName: name,
        zone: zone || 'NORTH',
        address: address || `${name}, City Center`,
        location: {
          type: 'Point',
          coordinates: coords
        }
      });

      await CommunityHero.create({
        profileId: donorId,
        displayName: name,
        role: 'RESTAURANT',
        zone: zone || 'NORTH',
        bio: `Committed restaurant partner in ${zone || 'NORTH'} zone.`
      });
    } else if (role === 'VOLUNTEER') {
      const volCount = await VolunteerProfile.countDocuments();
      const volunteerId = `V_USR_${volCount + 1}`;
      profile = await VolunteerProfile.create({
        volunteerId,
        userId: user._id,
        name,
        capacity_kg: Number(capacity_kg) || 20,
        zones: Array.isArray(zones) && zones.length > 0 ? zones : [zone || 'NORTH'],
        vehicleType: vehicleType || 'Car / Bike',
        location: {
          type: 'Point',
          coordinates: coords
        }
      });

      await CommunityHero.create({
        profileId: volunteerId,
        displayName: name,
        role: 'VOLUNTEER',
        zone: (Array.isArray(zones) ? zones : [zone || 'NORTH']).join(', '),
        bio: `Volunteer rescuer ready to collect surplus food.`
      });
    }

    const token = createToken(user);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let profile = null;
    if (user.role === 'RESTAURANT') {
      profile = await RestaurantProfile.findOne({ userId: user._id });
    } else if (user.role === 'VOLUNTEER') {
      profile = await VolunteerProfile.findOne({ userId: user._id });
    }

    const token = createToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/session/me
async function getMe(req, res) {
  try {
    if (!req.actor) {
      return res.json({ success: true, actor: null });
    }
    res.json({
      success: true,
      actor: req.actor
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/demo/people
async function getDemoPeople(req, res) {
  try {
    const donors = await RestaurantProfile.find().sort({ donorId: 1 });
    const volunteers = await VolunteerProfile.find().sort({ volunteerId: 1 });

    res.json({
      success: true,
      donors: donors.map((d) => ({
        id: d.donorId,
        name: d.restaurantName,
        zone: d.zone,
        address: d.address,
        location: d.location
      })),
      volunteers: volunteers.map((v) => ({
        id: v.volunteerId,
        name: v.name,
        capacity_kg: v.capacity_kg,
        zones: v.zones,
        vehicleType: v.vehicleType,
        location: v.location
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/demo/act-as
async function actAsDemo(req, res) {
  try {
    const { personId } = req.body;
    if (!personId) {
      return res.status(400).json({ success: false, message: 'personId is required' });
    }

    if (personId.startsWith('D')) {
      const donor = await RestaurantProfile.findOne({ donorId: personId });
      if (!donor) return res.status(404).json({ success: false, message: 'Seeded donor not found' });
      return res.json({
        success: true,
        actor: {
          role: 'RESTAURANT',
          donorId: donor.donorId,
          name: donor.restaurantName,
          zone: donor.zone,
          address: donor.address
        }
      });
    } else if (personId.startsWith('V')) {
      const vol = await VolunteerProfile.findOne({ volunteerId: personId });
      if (!vol) return res.status(404).json({ success: false, message: 'Seeded volunteer not found' });
      return res.json({
        success: true,
        actor: {
          role: 'VOLUNTEER',
          volunteerId: vol.volunteerId,
          name: vol.name,
          capacity_kg: vol.capacity_kg,
          zones: vol.zones,
          vehicleType: vol.vehicleType
        }
      });
    } else if (personId === 'COORD1') {
      return res.json({
        success: true,
        actor: {
          role: 'COORDINATOR',
          name: 'City NGO Coordinator'
        }
      });
    }

    res.status(400).json({ success: false, message: 'Unrecognized person ID' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  register,
  login,
  getMe,
  getDemoPeople,
  actAsDemo
};
