const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    claim_id: {
      type: String,
      required: true,
      unique: true
    },
    donation_id: {
      type: String,
      required: true,
      index: true
    },
    volunteer_id: {
      type: String,
      required: true,
      index: true
    },
    kg: {
      type: Number,
      required: true,
      min: 1
    },
    plannedPickupTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COLLECTED', 'CANCELLED', 'MISSED'],
      default: 'ACTIVE',
      index: true
    },
    collectedAt: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: String,
      default: null
    },
    missedAt: {
      type: String,
      default: null
    },
    distributionRecord: {
      packsDistributed: { type: Number, default: 0 },
      broadArea: { type: String, default: '' },
      note: { type: String, default: '' },
      photoUrl: { type: String, default: '' },
      recordedAt: { type: String, default: null }
    }
  },
  { timestamps: true }
);

claimSchema.index({ volunteer_id: 1, status: 1 });
claimSchema.index({ donation_id: 1, status: 1 });

module.exports = mongoose.model('Claim', claimSchema);
