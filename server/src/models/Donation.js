const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    donor_id: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    quantity_kg: {
      type: Number,
      required: true,
      min: 1
    },
    pickup_from: {
      type: String,
      required: true
    },
    pickup_until: {
      type: String,
      required: true
    },
    zone: {
      type: String,
      required: true
    },
    cancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: String,
      default: null
    },
    packagingType: {
      type: String,
      enum: ['bulk', 'individually_packed', 'mixed', 'unspecified'],
      default: 'unspecified'
    },
    packCount: {
      type: Number,
      default: 0
    },
    approxKgPerPack: {
      type: Number,
      default: 0
    },
    bulkDivisionNeeded: {
      type: Boolean,
      default: false
    },
    instructions: {
      type: String,
      default: ''
    },
    allergens: {
      type: String,
      default: ''
    },
    preparationTime: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

donationSchema.index({ donor_id: 1, pickup_until: 1 });
donationSchema.index({ zone: 1, cancelled: 1 });

module.exports = mongoose.model('Donation', donationSchema);
