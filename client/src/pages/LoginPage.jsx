import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PersonaModal from '../components/PersonaModal';
import { LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.user) {
        if (res.user.role === 'RESTAURANT') navigate('/restaurant');
        else if (res.user.role === 'VOLUNTEER') navigate('/volunteer');
        else navigate('/impact');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <LogIn size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Sign In to SurplusLink</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Enter your credentials or choose a seeded demo persona
          </p>
        </div>

        {error && (
          <div className="form-error-alert" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              required
              placeholder="e.g. d1@surpluslink.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Default for seeded accounts: <code>password123</code>)
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ borderTop: '1px solid var(--border)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
          <span style={{ position: 'relative', background: '#ffffff', padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            OR NO-LOGIN DEMO
          </span>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%' }}
          onClick={() => setIsPersonaModalOpen(true)}
        >
          <ShieldCheck size={16} /> Continue as Seeded Persona (D1-D5 / V1-V6)
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign up here</Link>
        </div>
      </div>

      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />
    </div>
  );
}
