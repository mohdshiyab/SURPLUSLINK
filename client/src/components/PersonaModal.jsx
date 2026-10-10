import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Store, Bike, ShieldCheck, ArrowRight } from 'lucide-react';

export default function PersonaModal({ isOpen, onClose }) {
  const { actor, demoPeople, actAs } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelect = async (personId) => {
    try {
      await actAs(personId);
      onClose();

      if (personId.startsWith('D')) {
        navigate('/restaurant');
      } else if (personId.startsWith('V')) {
        navigate('/volunteer');
      } else if (personId === 'COORD1') {
        navigate('/coordinator');
      }
    } catch (err) {
      console.error('[Select Persona Error]', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Choose Demo Persona</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Official Hackathon Requirement: Evaluators can test full donor and volunteer workflows without registration.
            Select any persona below to switch identities and open their dashboard immediately.
          </p>

          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--primary-dark)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Store size={16} /> Restaurant Donors (D1–D5) — Click to open Restaurant Dashboard
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
            {demoPeople.donors.map((d) => {
              const isCurrent = actor?.donorId === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => handleSelect(d.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: isCurrent ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.name}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'var(--bg-subtle)',
                        padding: '2px 6px',
                        borderRadius: 4
                      }}
                    >
                      {d.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Zone: <strong>{d.zone}</strong>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: isCurrent ? 'var(--primary-dark)' : 'var(--primary)',
                      fontWeight: 700,
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {isCurrent ? '✓ Active (Open Dashboard)' : 'Select Persona'} <ArrowRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>

          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--primary-dark)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Bike size={16} /> Volunteers (V1–V6) — Click to open Volunteer Feed
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 20 }}>
            {demoPeople.volunteers.map((v) => {
              const isCurrent = actor?.volunteerId === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => handleSelect(v.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: isCurrent ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.name}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'var(--bg-subtle)',
                        padding: '2px 6px',
                        borderRadius: 4
                      }}
                    >
                      {v.id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Capacity: <strong>{v.capacity_kg} kg</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Zones: <strong>{v.zones.join(', ')}</strong>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: isCurrent ? 'var(--primary-dark)' : 'var(--primary)',
                      fontWeight: 700,
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {isCurrent ? '✓ Active (Open Feed)' : 'Select Persona'} <ArrowRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>

          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--primary-dark)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ShieldCheck size={16} /> NGO Coordinator
          </h4>
          <div
            onClick={() => handleSelect('COORD1')}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: actor?.role === 'COORDINATOR' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: actor?.role === 'COORDINATOR' ? 'var(--primary-light)' : '#ffffff',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>City NGO Coordinator</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                Open Overview <ArrowRight size={12} />
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Aggregate platform oversight, system health, and donation telemetry.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
