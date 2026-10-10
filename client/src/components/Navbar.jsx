import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useClock } from '../context/ClockContext';
import { useAuth } from '../context/AuthContext';
import ClockControlModal from './ClockControlModal';
import PersonaModal from './PersonaModal';
import {
  Clock,
  FastForward,
  UtensilsCrossed,
  UserCheck,
  BarChart3,
  Award,
  HeartHandshake,
  Shield,
  LogOut,
  LogIn
} from 'lucide-react';

export default function Navbar() {
  const { simulatedNow } = useClock();
  const { actor, logout } = useAuth();
  const location = useLocation();

  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Authoritative Simulated Clock Banner */}
      <div className="clock-banner">
        <div className="clock-indicator">
          <Clock size={16} />
          <span>Simulated Clock:</span>
          <span className="clock-time-badge">{simulatedNow}</span>
          <span style={{ opacity: 0.75, fontSize: '0.75rem', marginLeft: 8 }}>(Local Rule Engine)</span>
        </div>
        <button
          className="btn-clock-action"
          onClick={() => setIsClockModalOpen(true)}
          title="Advance or change simulated clock"
        >
          <FastForward size={14} /> Advance Time
        </button>
      </div>

      {/* Main Navigation */}
      <header className="navbar">
        <div className="navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link to="/" className="brand">
              <UtensilsCrossed size={24} color="var(--primary)" />
              <span>SurplusLink</span>
              <span className="brand-badge">MERN</span>
            </Link>

            <nav className="nav-links">
              {actor?.role === 'RESTAURANT' && (
                <Link
                  to="/restaurant"
                  className={`nav-link ${isActive('/restaurant') ? 'active' : ''}`}
                >
                  Restaurant Dashboard
                </Link>
              )}

              {actor?.role === 'VOLUNTEER' && (
                <>
                  <Link
                    to="/volunteer"
                    className={`nav-link ${isActive('/volunteer') ? 'active' : ''}`}
                  >
                    Find Donations
                  </Link>
                  <Link
                    to="/claims"
                    className={`nav-link ${isActive('/claims') ? 'active' : ''}`}
                  >
                    My Claims
                  </Link>
                </>
              )}

              <Link
                to="/impact"
                className={`nav-link ${isActive('/impact') ? 'active' : ''}`}
              >
                <BarChart3 size={15} style={{ display: 'inline', marginRight: 4 }} />
                Impact & Invariant
              </Link>

              <Link
                to="/leaderboards"
                className={`nav-link ${isActive('/leaderboards') ? 'active' : ''}`}
              >
                <Award size={15} style={{ display: 'inline', marginRight: 4 }} />
                Leaderboards
              </Link>

              <Link
                to="/community-heroes"
                className={`nav-link ${isActive('/community-heroes') ? 'active' : ''}`}
              >
                <HeartHandshake size={15} style={{ display: 'inline', marginRight: 4 }} />
                Community Heroes
              </Link>

              <Link
                to="/coordinator"
                className={`nav-link ${isActive('/coordinator') ? 'active' : ''}`}
              >
                <Shield size={15} style={{ display: 'inline', marginRight: 4 }} />
                Coordinator
              </Link>
            </nav>
          </div>

          <div className="nav-actions">
            {actor ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                    {actor.name} ({actor.donorId || actor.volunteerId || actor.role})
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Role: {actor.role} {actor.zone ? `| ${actor.zone}` : ''}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsPersonaModalOpen(true)}
                  title="Switch Persona"
                >
                  <UserCheck size={14} /> Persona
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={logout}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsPersonaModalOpen(true)}
                >
                  <UserCheck size={14} /> Select Persona
                </button>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  <LogIn size={14} /> Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <ClockControlModal
        isOpen={isClockModalOpen}
        onClose={() => setIsClockModalOpen(false)}
      />

      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />
    </>
  );
}
