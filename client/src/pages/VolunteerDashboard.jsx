import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../context/ClockContext';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import RestaurantLocationModal from '../components/RestaurantLocationModal';
import {
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  Filter,
  Navigation,
  Compass,
  List,
  Map as MapIcon,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { actor } = useAuth();
  const { simulatedNow } = useClock();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('urgency');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedLocationDonation, setSelectedLocationDonation] = useState(null);

  // Claim Modal state
  const [claimDonation, setClaimDonation] = useState(null);
  const [claimKg, setClaimKg] = useState('');
  const [plannedTime, setPlannedTime] = useState('');
  const [claimErrors, setClaimErrors] = useState([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Simulated Volunteer User Coordinates (North center Bangalore demo coordinates)
  const userLat = 12.9716;
  const userLon = 77.5946;

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/donations?userLat=${userLat}&userLon=${userLon}&sort=${sortOption}`);
      if (res && res.success) {
        setDonations(res.donations);
      }
    } catch (err) {
      console.error('[Fetch Donations Error]', err);
    } finally {
      setLoading(false);
    }
  }, [sortOption]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations, simulatedNow, actor]);

  // Filter donations: By default, volunteers can see all or filter by zone
  const volunteerZones = actor?.zones || ['NORTH'];
  const filteredDonations = donations.filter((d) => {
    if (zoneFilter === 'MY_ZONES') {
      return volunteerZones.includes(d.zone);
    }
    if (zoneFilter !== 'ALL') {
      return d.zone === zoneFilter;
    }
    return true;
  });

  const openClaimModal = (donation) => {
    setClaimDonation(donation);
    setClaimKg(Math.min(actor?.capacity_kg || 20, donation.remaining_kg).toString());
    setPlannedTime(donation.pickup_from);
    setClaimErrors([]);
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    if (!claimDonation) return;

    setClaimLoading(true);
    setClaimErrors([]);

    try {
      const res = await api.post(`/api/donations/${claimDonation.id}/claims`, {
        kg: Number(claimKg),
        plannedPickupTime: plannedTime
      });

      if (res && res.success) {
        setSuccessMsg(`Successfully claimed ${res.claim.kg} kg of ${claimDonation.description}!`);
        setClaimDonation(null);
        await fetchDonations();
      }
    } catch (err) {
      setClaimErrors(err.errors || [err.message || 'Failed to claim donation']);
    } finally {
      setClaimLoading(false);
    }
  };

  // Prepare map pins
  const mapLocations = filteredDonations
    .filter((d) => d.donorLocation && d.donorLocation.coordinates)
    .map((d) => ({
      coordinates: d.donorLocation.coordinates,
      title: `${d.restaurantName} - ${d.remaining_kg}kg ${d.description}`,
      zone: d.zone,
      address: d.address,
      desc: `Pickup: ${d.pickup_from.slice(11)} to ${d.pickup_until.slice(11)}`
    }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Surplus Food Discovery Feed</h1>
          <p className="page-subtitle">
            Active Volunteer: <strong>{actor?.name}</strong> | Vehicle Capacity:{' '}
            <strong>{actor?.capacity_kg || 20} kg</strong> | Eligible Zones:{' '}
            <strong>{(actor?.zones || []).join(', ')}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 3 }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} /> List View
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('map')}
            >
              <MapIcon size={14} /> Map View
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
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
            <span>{successMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setSuccessMsg(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Discovery Bar */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700 }}>
            <Filter size={16} color="var(--primary)" /> Filter by Zone:
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
          >
            <option value="ALL">All City Zones</option>
            <option value="MY_ZONES">My Eligible Zones Only ({(actor?.zones || []).join(', ')})</option>
            <option value="NORTH">NORTH Zone</option>
            <option value="SOUTH">SOUTH Zone</option>
            <option value="EAST">EAST Zone</option>
            <option value="WEST">WEST Zone</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700 }}>
            <Compass size={16} color="var(--primary)" /> Sort By:
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="urgency">Pickup Urgency (Closing Soonest)</option>
            <option value="distance">Estimated Distance (Closest First)</option>
            <option value="quantity">Remaining Quantity (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div style={{ marginBottom: 24 }}>
          <MapView locations={mapLocations} zoom={12} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Note: Distance and map pins are discovery conveniences. Official zone eligibility always applies.
          </p>
        </div>
      )}

      {/* Donations Feed */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading food donations...</p>
      ) : filteredDonations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p>No food donations match the current filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredDonations.map((d) => {
            const isZoneEligible = (actor?.zones || []).includes(d.zone);
            const canClaim = d.status === 'OPEN' && d.remaining_kg > 0;

            return (
              <div key={d.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{d.description}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                      {d.restaurantName}
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                  <MapPin size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.address || `${d.restaurantName}, Zone ${d.zone}`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: isZoneEligible ? '#ecfdf5' : '#fef2f2',
                      color: isZoneEligible ? '#065f46' : '#991b1b',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: isZoneEligible ? '1px solid #a7f3d0' : '1px solid #fecaca'
                    }}
                  >
                    Zone: {d.zone} {isZoneEligible ? '✓ Eligible' : '✕ Out of Zone'}
                  </span>

                  {d.distanceKm != null ? (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'var(--bg-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      ~{d.distanceKm} km (Est.)
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      Distance unavailable
                    </span>
                  )}
                </div>

                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 14,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Remaining
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                      {d.remaining_kg} kg
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Total Posted
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{d.quantity_kg} kg</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Clock size={14} color="var(--primary)" />
                    <span>
                      Window: <strong>{d.pickup_from.slice(11)}</strong> to{' '}
                      <strong>{d.pickup_until.slice(11)}</strong> ({d.pickup_from.slice(0, 10)})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Package size={14} color="var(--primary)" />
                    <span style={{ textTransform: 'capitalize' }}>
                      Packaging: {d.packagingType.replace('_', ' ')}
                      {d.packCount > 0 ? ` (${d.packCount} portions)` : ''}
                    </span>
                  </div>

                  {d.instructions && (
                    <div style={{ fontStyle: 'italic', marginTop: 4 }}>
                      "{d.instructions}"
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginBottom: 8, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setSelectedLocationDonation(d)}
                >
                  <MapPin size={14} color="var(--primary)" /> View Restaurant on Map
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto' }}
                  disabled={!canClaim}
                  onClick={() => openClaimModal(d)}
                >
                  <Zap size={16} />
                  {canClaim ? 'Claim Kilograms' : `Unavailable (${d.status})`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim Modal */}
      {claimDonation && (
        <div className="modal-overlay" onClick={() => setClaimDonation(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Claim Food: {claimDonation.description}
                </h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setClaimDonation(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={submitClaim}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem' }}>
                    <div>
                      Restaurant: <strong>{claimDonation.restaurantName}</strong>
                    </div>
                    <div>
                      Zone: <strong>{claimDonation.zone}</strong>
                    </div>
                    <div>
                      Remaining: <strong>{claimDonation.remaining_kg} kg</strong>
                    </div>
                    <div>
                      Your Max Capacity: <strong>{actor?.capacity_kg || 20} kg</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    Pickup window: <strong>{claimDonation.pickup_from}</strong> to <strong>{claimDonation.pickup_until}</strong>
                  </div>
                  {claimDonation.address && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color="var(--primary)" />
                        <span>Pickup: <strong>{claimDonation.address}</strong></span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        onClick={() => setSelectedLocationDonation(claimDonation)}
                      >
                        📍 Map
                      </button>
                    </div>
                  )}
                </div>

                {claimErrors.length > 0 && (
                  <div className="form-error-alert">
                    <strong>Claim Refused (Rule Violations):</strong>
                    <ul className="form-error-list">
                      {claimErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Quantity to Claim (Whole kg) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    required
                    value={claimKg}
                    onChange={(e) => setClaimKg(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Must be $\le$ your capacity ({actor?.capacity_kg || 20}kg) and $\le$ remaining ({claimDonation.remaining_kg}kg).
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Planned Pickup Time T *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    required
                    value={plannedTime}
                    onChange={(e) => setPlannedTime(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Must be inside pickup window, not in past, and $\ge 60$ mins from your other active claims.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setClaimDonation(null)}
                  disabled={claimLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={claimLoading}>
                  {claimLoading ? 'Verifying All 7 Rules...' : 'Confirm Atomic Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restaurant Location & Directions Modal */}
      {selectedLocationDonation && (
        <RestaurantLocationModal
          isOpen={!!selectedLocationDonation}
          onClose={() => setSelectedLocationDonation(null)}
          restaurantName={selectedLocationDonation.restaurantName}
          address={selectedLocationDonation.address}
          zone={selectedLocationDonation.zone}
          coordinates={selectedLocationDonation.coordinates || selectedLocationDonation.donorLocation?.coordinates}
          foodDescription={selectedLocationDonation.description}
          pickupWindow={{
            from: selectedLocationDonation.pickup_from ? selectedLocationDonation.pickup_from.slice(11) : '',
            until: selectedLocationDonation.pickup_until ? selectedLocationDonation.pickup_until.slice(11) : ''
          }}
        />
      )}
    </div>
  );
}
