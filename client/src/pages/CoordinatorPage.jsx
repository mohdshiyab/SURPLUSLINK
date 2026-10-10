import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useClock } from '../context/ClockContext';
import { Shield, Activity, AlertCircle, CheckCircle2, TrendingUp, Clock } from 'lucide-react';

export default function CoordinatorPage() {
  const { simulatedNow } = useClock();
  const [summary, setSummary] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/dashboard/summary'), api.get('/api/dashboard/impact')])
      .then(([sRes, iRes]) => {
        if (sRes && sRes.success) setSummary(sRes);
        if (iRes && iRes.success) setImpact(iRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [simulatedNow]);

  const totalFoodManaged = (summary?.collected || 0) + (summary?.wasted || 0);
  const rescueEfficiency =
    totalFoodManaged > 0 ? Math.round(((summary?.collected || 0) / totalFoodManaged) * 100) : 100;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">City NGO Coordinator Overview</h1>
          <p className="page-subtitle">
            City-wide telemetry and food-rescue logistics management (Optional NGO view).
          </p>
        </div>
      </div>

      {/* Coordinator KPI Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Rescue Efficiency</span>
          <span className="stat-value" style={{ color: '#059669' }}>
            {rescueEfficiency}%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ratio of collected to expired
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Listed</span>
          <span className="stat-value">{summary?.listed || 0} kg</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Across all non-cancelled donations
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Food In Transit</span>
          <span className="stat-value" style={{ color: '#2563eb' }}>
            {summary?.inProgress || 0} kg
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Reserved by active volunteers
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Expired / Wasted</span>
          <span className="stat-value" style={{ color: '#dc2626' }}>
            {summary?.wasted || 0} kg
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Food uncollected before pickup_until
          </span>
        </div>
      </div>

      {/* Network Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>
            Coordinated Restaurants ({impact?.donors?.length || 0})
          </h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Zone</th>
                  <th>Food Saved</th>
                </tr>
              </thead>
              <tbody>
                {impact?.donors?.map((d) => (
                  <tr key={d.donorId}>
                    <td>
                      <strong>{d.restaurantName}</strong> ({d.donorId})
                    </td>
                    <td>{d.zone}</td>
                    <td>
                      <strong style={{ color: '#059669' }}>{d.collectedKg} kg</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>
            Active Volunteer Rescuers ({impact?.volunteers?.length || 0})
          </h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Capacity</th>
                  <th>Collected</th>
                  <th>Missed Claims</th>
                </tr>
              </thead>
              <tbody>
                {impact?.volunteers?.map((v) => (
                  <tr key={v.volunteerId}>
                    <td>
                      <strong>{v.name}</strong> ({v.volunteerId})
                    </td>
                    <td>{v.capacity_kg} kg</td>
                    <td>
                      <strong style={{ color: '#059669' }}>{v.collectedKg} kg</strong>
                    </td>
                    <td>
                      <span style={{ color: v.missedClaimsCount > 0 ? '#dc2626' : 'inherit', fontWeight: 600 }}>
                        {v.missedClaimsCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
