import React, { useState } from 'react';
import { useClock } from '../context/ClockContext';
import { Clock, FastForward, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ClockControlModal({ isOpen, onClose }) {
  const { simulatedNow, advanceClock } = useClock();
  const [customTime, setCustomTime] = useState(simulatedNow);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Add minutes to simulated time string
  const addHoursToNow = (hoursToAdd) => {
    // simulatedNow is YYYY-MM-DDTHH:MM
    const date = new Date(`${simulatedNow}:00Z`);
    date.setUTCHours(date.getUTCHours() + hoursToAdd);
    const iso = date.toISOString().slice(0, 16);
    setCustomTime(iso);
    return iso;
  };

  const handleApply = async (targetTime) => {
    const timeToSet = targetTime || customTime;
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await advanceClock(timeToSet);
      setFeedback(res);
      setCustomTime(res.simulatedNow);
    } catch (err) {
      setError(err.message || 'Failed to advance clock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Simulated Clock Control</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            SurplusLink enforces all business rules strictly using this simulated clock. Computer system time is never used.
            <strong> The clock can move forward or stay the same, but never backward.</strong>
          </p>

          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Current Simulated Time:
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: 'var(--primary-dark)'
              }}
            >
              {simulatedNow}
            </span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Quick Advance Presets:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleApply(addHoursToNow(1))}
                disabled={loading}
              >
                +1 Hour
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleApply(addHoursToNow(2))}
                disabled={loading}
              >
                +2 Hours
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleApply(addHoursToNow(6))}
                disabled={loading}
              >
                +6 Hours
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleApply(addHoursToNow(24))}
                disabled={loading}
              >
                +1 Day
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Set Specific Local Time (YYYY-MM-DDTHH:MM):</label>
            <input
              type="datetime-local"
              className="form-input"
              value={customTime}
              min={simulatedNow}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </div>

          {error && (
            <div className="form-error-alert" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {feedback && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#14532d',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}
            >
              <CheckCircle2 size={18} color="#16a34a" />
              <span>
                Clock set to <strong>{feedback.simulatedNow}</strong>. (
                {feedback.updatedMissedCount} active claim(s) transitioned to MISSED)
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || customTime < simulatedNow}
            onClick={() => handleApply(customTime)}
          >
            <FastForward size={16} />
            {loading ? 'Advancing...' : 'Advance Clock'}
          </button>
        </div>
      </div>
    </div>
  );
}
