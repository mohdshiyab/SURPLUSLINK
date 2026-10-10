import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useClock } from '../context/ClockContext';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Store,
  Bike,
  HelpCircle
} from 'lucide-react';

export default function ImpactDashboard() {
  const { simulatedNow } = useClock();

  const [summary, setSummary] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, impRes] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get('/api/dashboard/impact')
      ]);
      if (sumRes && sumRes.success) setSummary(sumRes);
      if (impRes && impRes.success) setImpact(impRes);
    } catch (err) {
      console.error('[Dashboard Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, simulatedNow]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations & Impact Dashboard</h1>
          <p className="page-subtitle">
            Authoritative accounting across all non-cancelled donations computed at{' '}
            <strong>{simulatedNow}</strong>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={14} /> Refresh Metrics
        </button>
      </div>

      {/* Mandatory Invariant Verification Card */}
      {summary && (
        <div
          className={`invariant-card ${summary.invariantPassed ? 'invariant-pass' : 'invariant-fail'}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {summary.invariantPassed ? (
              <CheckCircle2 size={32} color="#16a34a" />
            ) : (
              <AlertTriangle size={32} color="#dc2626" />
            )}
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Official Accounting Invariant: {summary.status}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: 2 }}>
                Rule Requirement: Listed must always equal Collected + Missed + Wasted + In Progress + Still Open.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'JetBrains Mono',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}
          >
            {summary.equation}
          </div>
        </div>
      )}

      {/* Six Required KPI Cards */}
      {summary && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="stat-card">
            <span className="stat-label">1. Listed (Total Posted)</span>
            <span className="stat-value">{summary.listed} kg</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              All non-cancelled donations
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">2. Collected</span>
            <span className="stat-value" style={{ color: '#059669' }}>
              {summary.collected} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Completed volunteer pickups
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">3. Missed</span>
            <span className="stat-value" style={{ color: '#dc2626' }}>
              {summary.missed} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Active claims past pickup_until
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">4. Wasted</span>
            <span className="stat-value" style={{ color: '#d97706' }}>
              {summary.wasted} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Remaining kg on EXPIRED donations
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">5. In Progress</span>
            <span className="stat-value" style={{ color: '#2563eb' }}>
              {summary.inProgress} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kg in ACTIVE claims
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">6. Still Open</span>
            <span className="stat-value" style={{ color: '#0d9488' }}>
              {summary.stillOpen} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Remaining kg on non-expired donations
            </span>
          </div>
        </div>
      )}

      {/* Impact Breakdown by Donor & Volunteer */}
      {impact && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginTop: 12 }}>
          {/* Per Donor Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Store size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Collected Food Per Restaurant (Donor)</h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Donor ID</th>
                    <th>Restaurant</th>
                    <th>Zone</th>
                    <th>Collected (Saved)</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.donors.map((d) => (
                    <tr key={d.donorId}>
                      <td>
                        <span className="mono" style={{ fontWeight: 700 }}>{d.donorId}</span>
                      </td>
                      <td><strong>{d.restaurantName}</strong></td>
                      <td>{d.zone}</td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                          {d.collectedKg} kg
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per Volunteer Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bike size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Volunteer Rescue & Missed Performance</h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Zones</th>
                    <th>Capacity</th>
                    <th>Collected</th>
                    <th>Missed Claims</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.volunteers.map((v) => (
                    <tr key={v.volunteerId}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{v.name}</div>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {v.volunteerId}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{v.zones.join(', ')}</td>
                      <td>{v.capacity_kg} kg</td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                          {v.collectedKg} kg
                        </strong>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: v.missedClaimsCount > 0 ? '#dc2626' : 'var(--text-muted)',
                            background: v.missedClaimsCount > 0 ? '#fee2e2' : 'transparent',
                            padding: '2px 8px',
                            borderRadius: 4
                          }}
                        >
                          {v.missedClaimsCount} missed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
