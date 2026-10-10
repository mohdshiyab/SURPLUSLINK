import React, { useState } from 'react';
import { api } from '../api/client';
import { useClock } from '../context/ClockContext';
import { PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PostDonationModal({ isOpen, onClose, onDonationCreated, donor }) {
  const { simulatedNow } = useClock();

  const [form, setForm] = useState({
    description: '',
    quantity_kg: '',
    pickup_from: simulatedNow,
    pickup_until: '',
    packagingType: 'unspecified',
    packCount: '',
    approxKgPerPack: '',
    bulkDivisionNeeded: false,
    instructions: '',
    allergens: '',
    preparationTime: ''
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const res = await api.post('/api/donations', {
        ...form,
        quantity_kg: Number(form.quantity_kg),
        packCount: form.packCount ? Number(form.packCount) : 0,
        approxKgPerPack: form.approxKgPerPack ? Number(form.approxKgPerPack) : 0
      });

      if (res && res.success) {
        onDonationCreated(res.donation);
        onClose();
      }
    } catch (err) {
      setErrors(err.errors || [err.message || 'Failed to post donation']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PlusCircle size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Post Surplus Food</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {donor && (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Posting as: <strong>{donor.restaurantName || donor.name}</strong></span>
                  <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>Zone: {donor.zone}</span>
                </div>
                {donor.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                    <span>📍 Pickup Address: <strong>{donor.address}</strong></span>
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4, fontWeight: 500 }}>
                  ✓ Verified location pinned for volunteer GPS navigation
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="form-error-alert">
                <strong>Validation Errors:</strong>
                <ul className="form-error-list">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Food Description / Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Veg Biryani, Bread Loaves, Pasta trays..."
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Total Quantity in Whole kg *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 25"
                  required
                  value={form.quantity_kg}
                  onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Must be whole number $\ge 1$ kg.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Packaging Type</label>
                <select
                  className="form-select"
                  value={form.packagingType}
                  onChange={(e) => setForm({ ...form, packagingType: e.target.value })}
                >
                  <option value="unspecified">Unspecified</option>
                  <option value="bulk">Bulk Container</option>
                  <option value="individually_packed">Individually Packed Portions</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Pickup From (Start) *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  required
                  value={form.pickup_from}
                  onChange={(e) => setForm({ ...form, pickup_from: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pickup Until (End) *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  required
                  value={form.pickup_until}
                  onChange={(e) => setForm({ ...form, pickup_until: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Must be strictly after Pickup From & not in past.
                </span>
              </div>
            </div>

            {/* Packaging extra details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Pack Count (If packed)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 50 packs"
                  value={form.packCount}
                  onChange={(e) => setForm({ ...form, packCount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Approx kg per pack</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 0.5"
                  value={form.approxKgPerPack}
                  onChange={(e) => setForm({ ...form, approxKgPerPack: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
              <input
                type="checkbox"
                id="bulkDiv"
                checked={form.bulkDivisionNeeded}
                onChange={(e) => setForm({ ...form, bulkDivisionNeeded: e.target.checked })}
              />
              <label htmlFor="bulkDiv" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                Volunteers need to portion / divide bulk food for distribution
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Handling & Storage Instructions</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="e.g. Keep warm, bring clean insulated boxes..."
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Allergens / Ingredients</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Contains dairy, gluten free..."
                  value={form.allergens}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Food Prep Time (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Prepared at 18:00 today"
                  value={form.preparationTime}
                  onChange={(e) => setForm({ ...form, preparationTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Validating & Publishing...' : 'Publish Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
