const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    capacity_kg: {
      type: Number,
      required: true
    },
    zones: {
      type: [String],
      required: true
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
    vehicleType: {
      type: String,
      default: 'Car / Van'
    },
    publicProfileEnabled: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

volunteerProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
