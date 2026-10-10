import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon missing in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapView({ locations = [], center = [12.9716, 77.5946], zoom = 12 }) {
  // Center fallback
  const mapCenter = locations.length > 0 && locations[0]?.coordinates
    ? [locations[0].coordinates[1], locations[0].coordinates[0]]
    : center;

  return (
    <div style={{ height: '360px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc, idx) => {
          if (!loc.coordinates || loc.coordinates.length < 2) return null;
          const [lon, lat] = loc.coordinates;
          return (
            <Marker key={idx} position={[lat, lon]}>
              <Popup>
                <div style={{ padding: 4 }}>
                  <strong style={{ fontSize: '0.9rem' }}>{loc.title || 'Location'}</strong>
                  {loc.zone && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Zone: <strong>{loc.zone}</strong>
                    </div>
                  )}
                  {loc.address && (
                    <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: 4 }}>
                      📍 {loc.address}
                    </div>
                  )}
                  {loc.desc && <p style={{ fontSize: '0.75rem', marginTop: 4, marginBottom: 6 }}>{loc.desc}</p>}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#059669',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      marginTop: 4
                    }}
                  >
                    🧭 Open Navigation
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
