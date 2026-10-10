const mongoose = require('mongoose');

const communityHeroSchema = new mongoose.Schema(
  {
    profileId: {
      type: String, // e.g. donorId (D1) or volunteerId (V1) or user._id
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['RESTAURANT', 'VOLUNTEER'],
      required: true
    },
    zone: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    optInVisibility: {
      type: Boolean,
      default: true
    },
    story: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityHero', communityHeroSchema);
