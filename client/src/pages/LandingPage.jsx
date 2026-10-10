import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../context/ClockContext';
import { api } from '../api/client';
import PersonaModal from '../components/PersonaModal';
import StatusBadge from '../components/StatusBadge';
import {
  UtensilsCrossed,
  ShieldCheck,
  Bike,
  Store,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  Award,
  Heart,
  ChevronRight,
  MapPin,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const { actor, actAs } = useAuth();
  const { simulatedNow } = useClock();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [liveDonations, setLiveDonations] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch Invariant Dashboard Summary
    api.get('/api/dashboard/summary')
      .then((res) => {
        if (res && res.success) setSummary(res);
      })
      .catch(console.error);

    // 2. Fetch Live Available Donations
    api.get('/api/donations')
      .then((res) => {
        if (res && res.success && res.donations) {
          // Filter to show open donations first
          const openOnly = res.donations.filter((d) => d.status === 'OPEN').slice(0, 4);
          setLiveDonations(openOnly.length > 0 ? openOnly : res.donations.slice(0, 4));
        }
      })
      .catch(console.error);

    // 3. Fetch Leaderboard Champions
    api.get('/api/leaderboards')
      .then((res) => {
        if (res && res.success) setLeaderboard(res);
      })
      .catch(console.error);
  }, [simulatedNow]);

  const handleQuickAct = async (personId, route) => {
    await actAs(personId);
    navigate(route);
  };

  const estimatedPortions = summary ? summary.collected * 2 : 0;

  return (
    <div>
      {/* Dynamic Hero Section */}
      <div className="hero-glow-card">
        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.18)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.3px'
              }}
            >
              <Sparkles size={14} color="#fde047" /> Official SurplusLink Network
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid rgba(110, 231, 183, 0.4)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#a7f3d0'
              }}
            >
              <CheckCircle2 size={14} /> 100% Invariant Rule Engine Active
            </span>
          </div>

          <h1 style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Rescuing Commercial Surplus Food, One Meal at a Time
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, lineHeight: 1.6, marginBottom: 28 }}>
            Connecting certified restaurants with local volunteer drivers to prevent edible food waste.
            Real-time simulated clock, atomic claims, capacity verification, and strict accounting invariants.
          </p>

          {/* Call to Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <button
              className="btn btn-lg"
              style={{ background: '#ffffff', color: '#0f766e', fontWeight: 800, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              onClick={() => setIsPersonaModalOpen(true)}
            >
              <ShieldCheck size={18} /> Select Demo Persona (No Login)
            </button>

            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.35)' }}
              onClick={() => handleQuickAct('D1', '/restaurant')}
            >
              <Store size={18} /> Act as Restaurant (D1)
            </button>

            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.35)' }}
              onClick={() => handleQuickAct('V1', '/volunteer')}
            >
              <Bike size={18} /> Act as Volunteer (V1)
            </button>
          </div>

          {/* Active Persona Banner */}
          {actor && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.22)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>
                Currently active: <strong>{actor.name}</strong> ({actor.donorId || actor.volunteerId || actor.role})
              </span>
              <button
                className="btn btn-sm"
                style={{ background: '#ffffff', color: 'var(--primary-dark)', fontWeight: 700 }}
                onClick={() => {
                  if (actor.role === 'RESTAURANT') navigate('/restaurant');
                  else if (actor.role === 'VOLUNTEER') navigate('/volunteer');
                  else navigate('/coordinator');
                }}
              >
                Open My Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Impact Counters Bar */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <span className="stat-label">Total Listed Food</span>
            <span className="stat-value">{summary.listed} kg</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              From all non-cancelled donations
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <span className="stat-label">Food Saved & Collected</span>
            <span className="stat-value" style={{ color: '#059669' }}>
              {summary.collected} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              ~{estimatedPortions} meals delivered
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <span className="stat-label">In Progress (Active)</span>
            <span className="stat-value" style={{ color: '#2563eb' }}>
              {summary.inProgress} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Reserved by volunteers
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className="stat-label">Available Surplus</span>
            <span className="stat-value" style={{ color: '#d97706' }}>
              {summary.stillOpen} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Open for immediate claim
            </span>
          </div>
        </div>
      )}

      {/* Live Available Food Stream Showcase */}
      <div style={{ marginBottom: 36 }}>
        <div className="section-title-wrap">
          <div>
            <h2 className="section-heading">
              <Zap size={20} color="#f59e0b" /> Available Surplus Food Right Now
            </h2>
            <p className="section-sub">
              Fresh surplus ready for volunteer collection at simulated time <strong>{simulatedNow}</strong>
            </p>
          </div>
          <Link to="/volunteer" className="btn btn-secondary btn-sm">
            View All Donations ({liveDonations.length}+) <ArrowRight size={14} />
          </Link>
        </div>

        <div className="live-feed-grid">
          {liveDonations.map((d) => (
            <div key={d.id} className="live-food-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{d.description}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {d.restaurantName}
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <span
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary-dark)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  Zone: {d.zone}
                </span>
                <span
                  style={{
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}
                >
                  {d.packagingType.replace('_', ' ')}
                </span>
              </div>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Available
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {d.remaining_kg} kg
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Pickup Until
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {d.pickup_until.slice(11)}
                  </div>
                </div>
              </div>

              <Link
                to="/volunteer"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: 'auto', justifyContent: 'center' }}
              >
                Reserve as Volunteer <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Official Invariant Equation Card */}
      {summary && (
        <div className="card" style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Platform Live Accounting Invariant</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Rule Requirement: Listed = Collected + Missed + Wasted + In Progress + Still Open
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.85rem',
                background: summary.invariantPassed ? '#ecfdf5' : '#fef2f2',
                color: summary.invariantPassed ? '#065f46' : '#991b1b',
                border: summary.invariantPassed ? '1px solid #a7f3d0' : '1px solid #fecaca'
              }}
            >
              <CheckCircle2 size={16} /> INVARIANT AUDIT: {summary.status}
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: 12 }}>
            <div className="stat-card">
              <span className="stat-label">Listed (Posted)</span>
              <span className="stat-value">{summary.listed} kg</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Collected</span>
              <span className="stat-value" style={{ color: '#059669' }}>{summary.collected} kg</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Missed</span>
              <span className="stat-value" style={{ color: '#dc2626' }}>{summary.missed} kg</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Wasted (Expired)</span>
              <span className="stat-value" style={{ color: '#d97706' }}>{summary.wasted} kg</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">In Progress (Active)</span>
              <span className="stat-value" style={{ color: '#2563eb' }}>{summary.inProgress} kg</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Still Open</span>
              <span className="stat-value" style={{ color: '#0d9488' }}>{summary.stillOpen} kg</span>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '10px 14px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontFamily: 'JetBrains Mono',
              border: '1px solid var(--border)'
            }}
          >
            {summary.equation}
          </div>
        </div>
      )}

      {/* How It Works (3 Steps) */}
      <div style={{ marginBottom: 36 }}>
        <div className="section-title-wrap">
          <div>
            <h2 className="section-heading">
              <TrendingUp size={20} color="var(--primary)" /> How SurplusLink Rescues Food
            </h2>
            <p className="section-sub">A transparent 3-step lifecycle preventing food waste across city zones</p>
          </div>
        </div>

        <div className="how-it-works-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>
              Restaurant Posts Surplus
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Commercial kitchens specify meal portions, handling hygiene notes, and a strict pickup window before closing time.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>
              Volunteer Claims Atomic kg
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Nearby volunteers in matching zones claim whole kilograms up to vehicle capacity with a planned pickup time $T$.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>
              Collection & Distribution
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Volunteers collect within the pickup window, deliver directly to local community shelters, and log distribution records.
            </p>
          </div>
        </div>
      </div>

      {/* Community Champions Leaderboard Preview */}
      {leaderboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 36 }}>
          {/* Top Restaurants */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Store size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Top Donating Restaurants</h3>
              </div>
              <Link to="/leaderboards" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                View All →
              </Link>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Zone</th>
                    <th>Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.restaurants.slice(0, 3).map((r, i) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong> ({r.id})
                      </td>
                      <td>{r.zone}</td>
                      <td>
                        <strong style={{ color: '#059669' }}>{r.collectedKg} kg</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Volunteers */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bike size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Top Volunteer Rescuers</h3>
              </div>
              <Link to="/leaderboards" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                View All →
              </Link>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Zones</th>
                    <th>Rescued</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.volunteers.slice(0, 3).map((v, i) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.name}</strong> ({v.id})
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{v.zones.join(', ')}</td>
                      <td>
                        <strong style={{ color: '#059669' }}>{v.collectedKg} kg</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Persona Selection Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />
    </div>
  );
}
