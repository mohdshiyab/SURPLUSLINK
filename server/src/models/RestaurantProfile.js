const mongoose = require('mongoose');

const restaurantProfileSchema = new mongoose.Schema(
  {
    donorId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    restaurantName: {
      type: String,
      required: true
    },
    zone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      default: ''
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    locationVisibility: {
      type: Boolean,
      default: true
    },
    contactPreferences: {
      type: String,
      default: 'phone'
    }
  },
  { timestamps: true }
);

restaurantProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RestaurantProfile', restaurantProfileSchema);
