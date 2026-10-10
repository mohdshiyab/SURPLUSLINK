import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Store, Bike, MapPin } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RESTAURANT',
    phone: '',
    zone: 'NORTH',
    capacity_kg: '20',
    address: '',
    vehicleType: 'Car / Van',
    coordinates: [77.5946, 12.9716]
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation is not supported.');
      return;
    }
    setGeoStatus('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          coordinates: [pos.coords.longitude, pos.coords.latitude]
        }));
        setGeoStatus(`Location saved: [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
      },
      (err) => {
        setGeoStatus(`Location permission denied or unavailable. Default zone coordinates will be used.`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register({
        ...form,
        capacity_kg: form.role === 'VOLUNTEER' ? Number(form.capacity_kg) : undefined,
        zones: form.role === 'VOLUNTEER' ? [form.zone] : undefined
      });

      if (res && res.user) {
        if (res.user.role === 'RESTAURANT') navigate('/restaurant');
        else navigate('/volunteer');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '30px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <UserPlus size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Create SurplusLink Account</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Join the community food rescue movement
          </p>
        </div>

        {error && (
          <div className="form-error-alert" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">I am registering as: *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className={`btn ${form.role === 'RESTAURANT' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setForm({ ...form, role: 'RESTAURANT' })}
              >
                <Store size={16} /> Restaurant Donor
              </button>
              <button
                type="button"
                className={`btn ${form.role === 'VOLUNTEER' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setForm({ ...form, role: 'VOLUNTEER' })}
              >
                <Bike size={16} /> Volunteer Rescuer
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {form.role === 'RESTAURANT' ? 'Restaurant Name *' : 'Full Name *'}
            </label>
            <input
              type="text"
              className="form-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="At least 6 chars"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Primary Zone *</label>
              <select
                className="form-select"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              >
                <option value="NORTH">NORTH</option>
                <option value="SOUTH">SOUTH</option>
                <option value="EAST">EAST</option>
                <option value="WEST">WEST</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          {form.role === 'VOLUNTEER' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Capacity (Whole kg) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    required
                    value={form.capacity_kg}
                    onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hatchback, Cargo Van"
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  />
                </div>
              </div>

              {/* Volunteer location permission capture */}
              <div className="form-group" style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Home / Base Coordinates</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleGetLocation}
                  >
                    <MapPin size={12} /> Auto-Detect via GPS
                  </button>
                </div>
                {geoStatus && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {geoStatus}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Restaurant Pickup Address & Landmark *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. 14 Market Street, Near Metro Station, Indiranagar"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <LocationPicker
                value={form.coordinates}
                zone={form.zone}
                onChange={(coords) => setForm((prev) => ({ ...prev, coordinates: coords }))}
              />
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
