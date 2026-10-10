import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, Award, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function CommunityHeroesPage() {
  const { actor } = useAuth();

  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optIn, setOptIn] = useState(true);
  const [toggleFeedback, setToggleFeedback] = useState(null);

  const fetchHeroes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/community-heroes');
      if (res && res.success) {
        setHeroes(res.heroes);
      }
    } catch (err) {
      console.error('[Heroes Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroes();
  }, [fetchHeroes]);

  const handleToggleVisibility = async () => {
    const nextVal = !optIn;
    try {
      const res = await api.patch('/api/profile/public-visibility', {
        optInVisibility: nextVal,
        profileId: actor?.donorId || actor?.volunteerId
      });
      if (res && res.success) {
        setOptIn(nextVal);
        setToggleFeedback(`Public visibility ${nextVal ? 'enabled' : 'hidden'}.`);
        await fetchHeroes();
      }
    } catch (err) {
      console.error('[Toggle Visibility Error]', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Community Food Heroes</h1>
          <p className="page-subtitle">
            Celebrating restaurants and volunteers leading food rescue in the community.
            Opt-in only with strict privacy protection.
          </p>
        </div>

        {actor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className={`btn btn-sm ${optIn ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleToggleVisibility}
            >
              {optIn ? <EyeOff size={14} /> : <Eye size={14} />}
              {optIn ? 'Hide My Public Profile' : 'Display My Public Profile'}
            </button>
          </div>
        )}
      </div>

      {toggleFeedback && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: '0.85rem'
          }}
        >
          {toggleFeedback}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading community heroes...</p>
      ) : heroes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <HeartHandshake size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p>No public profiles visible yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {heroes.map((h) => (
            <div key={h.profileId} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{h.displayName}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Role: <strong>{h.role}</strong> {h.zone ? `| Zone: ${h.zone}` : ''}
                  </div>
                </div>
                <span
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary-dark)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {h.profileId}
                </span>
              </div>

              {h.bio && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  {h.bio}
                </p>
              )}

              {/* Verified Badges */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Verified Badges:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {h.badges && h.badges.length > 0 ? (
                    h.badges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Award size={12} /> {badge}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      New Hero (Rescuing in progress)
                    </span>
                  )}
                </div>
              </div>

              {/* Impact stats */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  Food Rescued: <strong>{h.collectedKg} kg</strong>
                </div>
                <div>
                  Pickups: <strong>{h.pickups}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
