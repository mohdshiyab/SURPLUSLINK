import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useClock } from '../context/ClockContext';
import { Award, Store, Bike, Trophy, ShieldAlert, CheckCircle } from 'lucide-react';

export default function LeaderboardsPage() {
  const { simulatedNow } = useClock();

  const [leaderboards, setLeaderboards] = useState(null);
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants' or 'volunteers'
  const [loading, setLoading] = useState(true);

  const fetchLeaderboards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/leaderboards');
      if (res && res.success) {
        setLeaderboards(res);
      }
    } catch (err) {
      console.error('[Leaderboard Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards, simulatedNow]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Community Food Rescue Leaderboards</h1>
          <p className="page-subtitle">
            Rankings derived strictly from verified <strong>COLLECTED</strong> claims. Cancelled and missed claims do not count as saved food.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 4 }}>
          <button
            className={`btn btn-sm ${activeTab === 'restaurants' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('restaurants')}
          >
            <Store size={15} /> Top Restaurants
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'volunteers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('volunteers')}
          >
            <Bike size={15} /> Top Volunteers
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Calculating rankings from verified records...</p>
        ) : activeTab === 'restaurants' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Trophy size={20} color="#f59e0b" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Restaurant Leaderboard — Ranked by Food Saved
              </h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Restaurant</th>
                    <th>Zone</th>
                    <th>Food Saved (Collected)</th>
                    <th>Successful Donations</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboards?.restaurants?.map((r, idx) => (
                    <tr key={r.id}>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)',
                            fontSize: '1rem'
                          }}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td>
                        <strong>{r.name}</strong>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                          ({r.id})
                        </span>
                      </td>
                      <td>{r.zone}</td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '1.05rem' }}>
                          {r.collectedKg} kg
                        </strong>
                      </td>
                      <td>{r.successfulDonations} donation(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Trophy size={20} color="#f59e0b" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Volunteer Leaderboard — Pickups & Reliability
              </h2>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Volunteer Name</th>
                    <th>Zones</th>
                    <th>Kilograms Rescued</th>
                    <th>Completed Pickups</th>
                    <th>Missed Claims</th>
                    <th>Reliability Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboards?.volunteers?.map((v, idx) => (
                    <tr key={v.id}>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)',
                            fontSize: '1rem'
                          }}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td>
                        <strong>{v.name}</strong>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                          ({v.id})
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{v.zones.join(', ')}</td>
                      <td>
                        <strong style={{ color: '#059669', fontSize: '1.05rem' }}>
                          {v.collectedKg} kg
                        </strong>
                      </td>
                      <td>{v.pickups} pickup(s)</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: v.missed > 0 ? '#dc2626' : 'var(--text-muted)',
                            background: v.missed > 0 ? '#fee2e2' : 'transparent',
                            padding: '2px 8px',
                            borderRadius: 4
                          }}
                        >
                          {v.missed} missed
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: '60px',
                              background: '#e2e8f0',
                              height: '8px',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${v.reliabilityRate}%`,
                                background: v.reliabilityRate >= 80 ? '#10b981' : '#f59e0b',
                                height: '100%'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {v.reliabilityRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
