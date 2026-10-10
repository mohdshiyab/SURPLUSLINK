const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RestaurantProfile = require('../models/RestaurantProfile');
const VolunteerProfile = require('../models/VolunteerProfile');

const JWT_SECRET = process.env.JWT_SECRET || 'surpluslink_super_secret_hackathon_key';

/**
 * Middleware that extracts user/demo identity
 */
async function authenticate(req, res, next) {
  try {
    // Check Demo Header first (for smooth demo evaluator switching without login)
    const demoId = req.headers['x-demo-id'];
    if (demoId) {
      if (demoId.startsWith('D')) {
        const restaurant = await RestaurantProfile.findOne({ donorId: demoId });
        req.actor = {
          role: 'RESTAURANT',
          donorId: demoId,
          name: restaurant ? restaurant.restaurantName : demoId,
          zone: restaurant ? restaurant.zone : '',
          address: restaurant ? restaurant.address : '',
          location: restaurant ? restaurant.location : null
        };
        return next();
      } else if (demoId.startsWith('V')) {
        const volunteer = await VolunteerProfile.findOne({ volunteerId: demoId });
        req.actor = {
          role: 'VOLUNTEER',
          volunteerId: demoId,
          name: volunteer ? volunteer.name : demoId,
          zones: volunteer ? volunteer.zones : [],
          capacity_kg: volunteer ? volunteer.capacity_kg : 0
        };
        return next();
      } else if (demoId === 'COORD1') {
        req.actor = {
          role: 'COORDINATOR',
          name: 'City NGO Coordinator'
        };
        return next();
      }
    }

    // Check Authorization header for Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user) {
        let profile = null;
        if (user.role === 'RESTAURANT') {
          profile = await RestaurantProfile.findOne({ userId: user._id });
        } else if (user.role === 'VOLUNTEER') {
          profile = await VolunteerProfile.findOne({ userId: user._id });
        }

        req.user = user;
        req.actor = {
          id: user._id,
          role: user.role,
          name: user.name,
          email: user.email,
          donorId: profile ? profile.donorId : user.demoId,
          volunteerId: profile ? profile.volunteerId : user.demoId,
          zone: profile ? profile.zone : undefined,
          zones: profile ? profile.zones : undefined,
          capacity_kg: profile ? profile.capacity_kg : undefined,
          address: profile ? profile.address : undefined,
          location: profile ? profile.location : undefined
        };
        return next();
      }
    }

    // If neither is present, request is unauthenticated guest
    req.actor = null;
    next();
  } catch (err) {
    console.error('[Auth Error]', err.message);
    next();
  }
}

/**
 * Route guard requiring authentication or active demo profile
 */
function requireAuth(req, res, next) {
  if (!req.actor) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please select a Demo persona or sign in.'
    });
  }
  next();
}

/**
 * Route guard for specific roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.actor || !roles.includes(req.actor.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of roles: [${roles.join(', ')}]`
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticate,
  requireAuth,
  requireRole
};
