const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['RESTAURANT', 'VOLUNTEER', 'COORDINATOR'],
      required: true
    },
    phone: {
      type: String,
      default: ''
    },
    profileImage: {
      type: String,
      default: ''
    },
    publicProfileEnabled: {
      type: Boolean,
      default: true
    },
    demoId: {
      type: String,
      default: null,
      sparse: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
