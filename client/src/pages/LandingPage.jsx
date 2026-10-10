import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../context/ClockContext';
import { api } from '../api/client';
import PersonaModal from '../components/PersonaModal';
import {
  UtensilsCrossed,
  ShieldCheck,
  Bike,
  Store,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const { actor, actAs } = useAuth();
  const { simulatedNow } = useClock();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  useEffect(() => {
    api.get('/api/dashboard/summary')
      .then((res) => {
        if (res && res.success) setSummary(res);
      })
      .catch(console.error);
  }, []);

  const handleQuickAct = async (personId, route) => {
    await actAs(personId);
    navigate(route);
  };

  return (
    <div>
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #0d9488 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 36px',
          color: '#ffffff',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ maxWidth: '780px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 16
            }}
          >
            <Sparkles size={16} /> Official SurplusLink Hackathon Platform
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Connecting Surplus Meals with Community Volunteers
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, marginBottom: 28 }}>
            A rule-enforced food-rescue application where restaurants post surplus food with strict pickup windows,
            volunteers reserve atomic non-overbooking claims, and the system reports exact food accounting.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              className="btn btn-lg"
              style={{ background: '#ffffff', color: '#0f766e', fontWeight: 700 }}
              onClick={() => setIsPersonaModalOpen(true)}
            >
              <ShieldCheck size={18} /> Select Demo Persona (No Login)
            </button>

            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)' }}
              onClick={() => handleQuickAct('D1', '/restaurant')}
            >
              <Store size={18} /> Act as Restaurant (D1)
            </button>

            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)' }}
              onClick={() => handleQuickAct('V1', '/volunteer')}
            >
              <Bike size={18} /> Act as Volunteer (V1)
            </button>
          </div>
        </div>
      </div>

      {/* Live Invariant & Stats Preview */}
      {summary && (
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Platform Live Accounting Invariant</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Listed = Collected + Missed + Wasted + In Progress + Still Open
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
              <CheckCircle2 size={16} /> INVARIANT STATUS: {summary.status}
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

          <div style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
            {summary.equation}
          </div>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Store size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Restaurant Donations</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            Restaurants post surplus food with pickup start and end times, packaging specifics, and handling instructions.
            Instant validation ensures pickup windows adhere to simulated clock constraints.
          </p>
          <Link to="/restaurant" className="btn btn-secondary btn-sm">
            Go to Restaurant Dashboard →
          </Link>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Bike size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Volunteer Rescue</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            Volunteers discover eligible donations in their assigned zones, claim whole kilograms atomically with planned pickup time T,
            and report post-collection community distribution.
          </p>
          <Link to="/volunteer" className="btn btn-secondary btn-sm">
            Explore Volunteer Feed →
          </Link>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Clock size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Authoritative Simulated Clock</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            Every expiry, claim eligibility, collection window, and missed claim conversion is computed strictly against the simulated clock.
            Test time shifts without affecting your system clock.
          </p>
          <Link to="/impact" className="btn btn-secondary btn-sm">
            View Impact & Invariants →
          </Link>
        </div>
      </div>

      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />
    </div>
  );
}
