import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../context/ClockContext';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HeartHandshake,
  RefreshCw,
  Share2
} from 'lucide-react';

export default function ClaimsPage() {
  const { actor } = useAuth();
  const { simulatedNow } = useClock();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Distribution Modal state
  const [distributeClaim, setDistributeClaim] = useState(null);
  const [distForm, setDistForm] = useState({
    packsDistributed: '',
    broadArea: '',
    note: '',
    photoUrl: ''
  });
  const [distLoading, setDistLoading] = useState(false);

  const fetchMyClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/claims/mine');
      if (res && res.success) {
        setClaims(res.claims);
      }
    } catch (err) {
      console.error('[Fetch Claims Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyClaims();
  }, [fetchMyClaims, simulatedNow, actor]);

  const handleCollect = async (claimId) => {
    setErrorMsg(null);
    setActionMsg(null);
    try {
      const res = await api.post(`/api/claims/${claimId}/collect`);
      if (res && res.success) {
        setActionMsg(`Claim #${claimId} marked as COLLECTED!`);
        await fetchMyClaims();
      }
    } catch (err) {
      setErrorMsg(err.errors ? err.errors.join(' | ') : err.message);
    }
  };

  const handleCancel = async (claimId) => {
    setErrorMsg(null);
    setActionMsg(null);
    try {
      const res = await api.post(`/api/claims/${claimId}/cancel`);
      if (res && res.success) {
        setActionMsg(`Claim #${claimId} CANCELLED. ${res.claim.kg} kg returned to donation!`);
        await fetchMyClaims();
      }
    } catch (err) {
      setErrorMsg(err.errors ? err.errors.join(' | ') : err.message);
    }
  };

  const submitDistribution = async (e) => {
    e.preventDefault();
    if (!distributeClaim) return;
    setDistLoading(true);
    try {
      const res = await api.post(`/api/claims/${distributeClaim.claim_id}/distribution`, {
        packsDistributed: Number(distForm.packsDistributed),
        broadArea: distForm.broadArea,
        note: distForm.note,
        photoUrl: distForm.photoUrl
      });
      if (res && res.success) {
        setActionMsg(`Distribution report recorded for Claim #${distributeClaim.claim_id}!`);
        setDistributeClaim(null);
        await fetchMyClaims();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save distribution');
    } finally {
      setDistLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Food Rescue Claims & Schedule</h1>
          <p className="page-subtitle">
            Volunteer: <strong>{actor?.name}</strong> | Active persona: <strong>{actor?.volunteerId || actor?.role}</strong>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchMyClaims}>
          <RefreshCw size={14} /> Refresh Claims
        </button>
      </div>

      {actionMsg && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{actionMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setActionMsg(null)}>
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{errorMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setErrorMsg(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading your claims...</p>
        ) : claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <PackageCheck size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>You have not made any claims yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Food Description</th>
                  <th>Restaurant & Zone</th>
                  <th>Quantity</th>
                  <th>Planned Pickup T</th>
                  <th>Status</th>
                  <th>Official Rules & Eligibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => {
                  const d = c.donation;
                  return (
                    <tr key={c.claim_id}>
                      <td>
                        <span className="mono" style={{ fontWeight: 700 }}>
                          {c.claim_id}
                        </span>
                      </td>
                      <td>
                        <strong>{d?.description || c.donation_id}</strong>
                      </td>
                      <td>
                        <div>{d?.restaurantName || 'Restaurant'}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Zone: {d?.zone}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>
                          {c.kg} kg
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {c.plannedPickupTime.slice(11)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {c.plannedPickupTime.slice(0, 10)}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 220 }}>
                        {c.status === 'ACTIVE' && (
                          <>
                            <div>
                              Collect Window: [<strong>{d?.pickup_from.slice(11)}</strong> to{' '}
                              <strong>{d?.pickup_until.slice(11)}</strong>]
                            </div>
                            <div style={{ marginTop: 2 }}>
                              Cancel Rule: Only strictly before {c.plannedPickupTime.slice(11)}
                            </div>
                          </>
                        )}
                        {c.status === 'COLLECTED' && (
                          <span style={{ color: '#065f46', fontWeight: 600 }}>
                            Collected at {c.collectedAt}
                          </span>
                        )}
                        {c.status === 'MISSED' && (
                          <span style={{ color: '#991b1b', fontWeight: 600 }}>
                            Missed: pickup deadline elapsed
                          </span>
                        )}
                        {c.status === 'CANCELLED' && (
                          <span style={{ color: '#64748b' }}>Cancelled</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {c.status === 'ACTIVE' && (
                            <>
                              <button
                                className="btn btn-sm btn-primary"
                                disabled={!c.canCollect}
                                title={
                                  c.canCollect
                                    ? 'Collect now'
                                    : 'Only permitted inside pickup window [pickup_from, pickup_until]'
                                }
                                onClick={() => handleCollect(c.claim_id)}
                              >
                                Mark Collected
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                disabled={!c.canCancel}
                                title={
                                  c.canCancel
                                    ? 'Cancel claim'
                                    : 'Only permitted strictly before planned pickup time T'
                                }
                                onClick={() => handleCancel(c.claim_id)}
                              >
                                Cancel Claim
                              </button>
                            </>
                          )}

                          {c.status === 'COLLECTED' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setDistributeClaim(c);
                                setDistForm({
                                  packsDistributed: c.distributionRecord?.packsDistributed || c.kg * 2,
                                  broadArea: c.distributionRecord?.broadArea || '',
                                  note: c.distributionRecord?.note || '',
                                  photoUrl: c.distributionRecord?.photoUrl || ''
                                });
                              }}
                            >
                              <HeartHandshake size={14} />{' '}
                              {c.distributionRecord?.recordedAt ? 'Edit Distribution' : 'Record Distribution'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribution Modal */}
      {distributeClaim && (
        <div className="modal-overlay" onClick={() => setDistributeClaim(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HeartHandshake size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Record Community Food Distribution
                </h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setDistributeClaim(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={submitDistribution}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Document how the collected <strong>{distributeClaim.kg} kg</strong> of{' '}
                  <strong>{distributeClaim.donation?.description}</strong> reached beneficiaries.
                  Privacy safe: Do not include recipient names or personal details.
                </p>

                <div className="form-group">
                  <label className="form-label">Portions / Packs Distributed *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    required
                    value={distForm.packsDistributed}
                    onChange={(e) => setDistForm({ ...distForm, packsDistributed: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">General Area / Shelter (Public Safe) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. City Night Shelter, Community Kitchen East"
                    required
                    value={distForm.broadArea}
                    onChange={(e) => setDistForm({ ...distForm, broadArea: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Distribution Note / Feedback</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="e.g. Warm meals delivered in sealed trays directly to 35 residents."
                    value={distForm.note}
                    onChange={(e) => setDistForm({ ...distForm, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDistributeClaim(null)}
                  disabled={distLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={distLoading}>
                  {distLoading ? 'Saving...' : 'Save Distribution Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
