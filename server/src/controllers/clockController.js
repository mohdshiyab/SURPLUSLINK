const { getSimulatedClock, advanceSimulatedClock } = require('../services/clockService');

// GET /api/clock
async function getClock(req, res) {
  try {
    const clock = await getSimulatedClock();
    res.json({
      success: true,
      simulatedNow: clock.simulatedNow
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/clock
async function updateClock(req, res) {
  try {
    const { time } = req.body;
    if (!time) {
      return res.status(400).json({
        success: false,
        message: 'Parameter "time" is required (format: YYYY-MM-DDTHH:MM)'
      });
    }

    const result = await advanceSimulatedClock(time);
    res.json({
      success: true,
      message: `Clock advanced to ${result.simulatedNow}. Processed ${result.updatedMissedCount} missed claim(s).`,
      simulatedNow: result.simulatedNow,
      updatedMissedCount: result.updatedMissedCount
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

module.exports = {
  getClock,
  updateClock
};
