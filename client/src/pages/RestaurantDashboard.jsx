import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../context/ClockContext';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PostDonationModal from './PostDonationModal';
import {
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Package,
  Calendar,
  XCircle,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function RestaurantDashboard() {
  const { actor } = useAuth();
  const { simulatedNow } = useClock();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [cancelModalDonation, setCancelModalDonation] = useState(null);
  const [cancelErrors, setCancelErrors] = useState([]);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchMyDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/donations/mine');
      if (res && res.success) {
        setDonations(res.donations);
      }
    } catch (err) {
      console.error('[Fetch My Donations Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyDonations();
  }, [fetchMyDonations, simulatedNow, actor]);

  // Compute local restaurant stats
  const totalListed = donations.reduce((sum, d) => (!d.cancelled ? sum + d.quantity_kg : sum), 0);
  const collectedClaims = donations.flatMap((d) => d.claims || []).filter((c) => c.status === 'COLLECTED');
  const totalCollected = collectedClaims.reduce((sum, c) => sum + c.kg, 0);
  const activeClaims = donations.flatMap((d) => d.claims || []).filter((c) => c.status === 'ACTIVE');
  const totalActive = activeClaims.reduce((sum, c) => sum + c.kg, 0);

  const handleCancelClick = (donation) => {
    setCancelModalDonation(donation);
    setCancelErrors([]);
  };

  const confirmCancelDonation = async () => {
    if (!cancelModalDonation) return;
    try {
      const res = await api.post(`/api/donations/${cancelModalDonation.id}/cancel`);
      if (res && res.success) {
        setActionSuccess(`Donation #${cancelModalDonation.id} was successfully cancelled.`);
        setCancelModalDonation(null);
        await fetchMyDonations();
      }
    } catch (err) {
      setCancelErrors(err.errors || [err.message || 'Failed to cancel donation']);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Restaurant Management Dashboard</h1>
          <p className="page-subtitle">
            Posting surplus food for <strong>{actor?.name}</strong> (Zone: <strong>{actor?.zone || 'NORTH'}</strong>)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchMyDonations}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setIsPostModalOpen(true)}>
            <PlusCircle size={16} /> Post Surplus Food
          </button>
        </div>
      </div>

      {actionSuccess && (
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
            <span>{actionSuccess}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setActionSuccess(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Posted</span>
          <span className="stat-value">{totalListed} kg</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Verified Collected</span>
          <span className="stat-value" style={{ color: '#059669' }}>
            {totalCollected} kg
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Claims In Progress</span>
          <span className="stat-value" style={{ color: '#2563eb' }}>
            {totalActive} kg
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Donations</span>
          <span className="stat-value" style={{ color: 'var(--primary-dark)' }}>
            {donations.length}
          </span>
        </div>
      </div>

      {/* Donations Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>
          My Posted Food Donations
        </h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Loading donations...</p>
        ) : donations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No food posted yet for this restaurant.</p>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setIsPostModalOpen(true)}
            >
              Post First Donation
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Total / Remaining</th>
                  <th>Pickup Window</th>
                  <th>Packaging</th>
                  <th>Status</th>
                  <th>Claims</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700 }}>
                        {d.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{d.description}</div>
                      {d.instructions && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {d.instructions}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{d.remaining_kg} kg</strong> / {d.quantity_kg} kg
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} color="var(--primary)" />
                        <span>{d.pickup_from.slice(11)} – {d.pickup_until.slice(11)}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {d.pickup_from.slice(0, 10)}
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                        {d.packagingType.replace('_', ' ')}
                      </span>
                      {d.packCount > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {d.packCount} packs
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      {d.claims && d.claims.length > 0 ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {d.claims.length} claim(s)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Unclaimed
                        </span>
                      )}
                    </td>
                    <td>
                      {!d.cancelled && d.status === 'OPEN' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelClick(d)}
                          title="Cancel donation"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post Donation Modal */}
      <PostDonationModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        donor={actor}
        onDonationCreated={(newD) => {
          setActionSuccess(`New donation #${newD.id} posted successfully!`);
          fetchMyDonations();
        }}
      />

      {/* Cancel Confirmation & Refusal Modal */}
      {cancelModalDonation && (
        <div className="modal-overlay" onClick={() => setCancelModalDonation(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <XCircle size={20} color="#dc2626" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Cancel Donation #{cancelModalDonation.id}
                </h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCancelModalDonation(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', marginBottom: 16 }}>
                Are you sure you want to cancel the donation of{' '}
                <strong>{cancelModalDonation.description}</strong> ({cancelModalDonation.quantity_kg} kg)?
              </p>

              <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: 16 }}>
                <strong>Official Rule:</strong> A donor may cancel a donation only while its status is <strong>OPEN</strong> and it has <strong>no ACTIVE or COLLECTED claims</strong>.
              </div>

              {cancelErrors.length > 0 && (
                <div className="form-error-alert">
                  <strong>Cancellation Refused:</strong>
                  <ul className="form-error-list">
                    {cancelErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelModalDonation(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmCancelDonation}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
