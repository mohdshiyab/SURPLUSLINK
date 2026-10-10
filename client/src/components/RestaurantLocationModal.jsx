import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ExternalLink, Clock, Building, Compass } from 'lucide-react';

// Fix Leaflet marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function RestaurantLocationModal({
  isOpen,
  onClose,
  restaurantName,
  address,
  zone,
  coordinates, // can be [lat, lon] or GeoJSON [lon, lat]
  foodDescription,
  pickupWindow,
  claimKg
}) {
  if (!isOpen) return null;

  // Determine latitude & longitude safely
  let lat = 12.9716;
  let lon = 77.5946;

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    // If coordinates is GeoJSON [longitude, latitude] where lon > 50 in India
    if (coordinates[0] > 50 && coordinates[1] < 40) {
      lon = coordinates[0];
      lat = coordinates[1];
    } else {
      // standard [lat, lon]
      lat = coordinates[0];
      lon = coordinates[1];
    }
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building size={22} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {restaurantName || 'Restaurant Partner'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Zone: <strong>{zone || 'General'}</strong>
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* Address Box */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                  Pickup Address
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {address || `${restaurantName}, Zone ${zone}, Bangalore`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  GPS Coordinates: <strong>{lat.toFixed(5)}° N, {lon.toFixed(5)}° E</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Rescue Item Context */}
          {(foodDescription || pickupWindow) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: pickupWindow ? '1fr 1fr' : '1fr',
                gap: 12,
                marginBottom: 16,
                fontSize: '0.82rem'
              }}
            >
              {foodDescription && (
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Rescue Item:</div>
                  <strong>{claimKg ? `${claimKg} kg of ` : ''}{foodDescription}</strong>
                </div>
              )}
              {pickupWindow && (
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Pickup Window:</div>
                  <strong>{pickupWindow.from} - {pickupWindow.until}</strong>
                </div>
              )}
            </div>
          )}

          {/* Map Preview */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Compass size={15} color="var(--primary)" /> Interactive Map View
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Pan & zoom to inspect route
              </span>
            </div>

            <div
              style={{
                height: '240px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}
            >
              <MapContainer
                center={[lat, lon]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lon]}>
                  <Popup>
                    <div style={{ padding: 4 }}>
                      <strong>{restaurantName}</strong>
                      <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{address}</div>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Action Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <Navigation size={18} />
              Open Live Directions in Google Maps
              <ExternalLink size={16} />
            </a>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Opens turn-by-turn navigation in Google Maps app or browser using exact restaurant GPS coordinates.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
