const mongoose = require('mongoose');

const simulationClockSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
      required: true
    },
    simulatedNow: {
      type: String,
      default: '2026-03-10T12:00',
      required: true
    },
    seedInitialized: {
      type: Boolean,
      default: false
    },
    schemaVersion: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SimulationClock', simulationClockSchema);
