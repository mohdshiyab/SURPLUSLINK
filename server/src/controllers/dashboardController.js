const { getDashboardSummary, getImpactDetails } = require('../services/dashboardService');

// GET /api/dashboard/summary
async function getSummary(req, res) {
  try {
    const summary = await getDashboardSummary();
    res.json({
      success: true,
      ...summary
    });
  } catch (err) {
    console.error('[Dashboard Summary Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/dashboard/impact
async function getImpact(req, res) {
  try {
    const impact = await getImpactDetails();
    res.json({
      success: true,
      ...impact
    });
  } catch (err) {
    console.error('[Dashboard Impact Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getSummary,
  getImpact
};
