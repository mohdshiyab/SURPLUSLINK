import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Check } from 'lucide-react';

// Fix Leaflet marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.setView(position, 14);
    }
  }, [position, map]);
  return null;
}

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    }
  });

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          setPosition([latlng.lat, latlng.lng]);
        }
      }}
    />
  ) : null;
}

export default function LocationPicker({
  value = [77.5946, 12.9716], // GeoJSON [longitude, latitude]
  onChange,
  zone
}) {
  // Convert [lon, lat] from GeoJSON to Leaflet [lat, lon]
  const initialLat = value && value[1] ? value[1] : 12.9716;
  const initialLng = value && value[0] ? value[0] : 77.5946;
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Zone defaults if changed
  useEffect(() => {
    if (!zone) return;
    const zoneCoords = {
      NORTH: [13.0358, 77.5970],
      SOUTH: [12.9141, 77.5960],
      EAST: [12.9784, 77.6408],
      WEST: [12.9698, 77.5360]
    };
    if (zoneCoords[zone] && (!position || (position[0] === 12.9716 && position[1] === 77.5946))) {
      const newPos = zoneCoords[zone];
      setPosition(newPos);
      if (onChange) {
        onChange([newPos[1], newPos[0]]); // [lon, lat]
      }
    }
  }, [zone]);

  const handlePositionChange = (newPos) => {
    setPosition(newPos);
    setStatusMessage(`Location updated: ${newPos[0].toFixed(4)}° N, ${newPos[1].toFixed(4)}° E`);
    if (onChange) {
      // Return GeoJSON [longitude, latitude]
      onChange([Number(newPos[1].toFixed(6)), Number(newPos[0].toFixed(6))]);
    }
  };

  const handleDetectGPS = (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setStatusMessage('Detecting current GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        handlePositionChange(newPos);
        setStatusMessage('GPS position detected & pinned successfully!');
      },
      (err) => {
        setGpsLoading(false);
        setStatusMessage('Could not retrieve GPS automatically. You can click anywhere on the map to pin.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ marginTop: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <MapPin size={16} color="var(--primary)" /> Pin Restaurant Location on Map *
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleDetectGPS}
          disabled={gpsLoading}
          style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Navigation size={13} /> {gpsLoading ? 'Detecting...' : 'Detect My GPS'}
        </button>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
        Volunteers will use this map location to navigate directly to your kitchen for pickup. Click anywhere on the map or drag the pin.
      </div>

      <div style={{ height: '230px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController position={position} />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        <span>
          Selected GPS: <strong>{position[0].toFixed(4)}° N, {position[1].toFixed(4)}° E</strong>
        </span>
        <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Check size={13} /> Pin Active
        </span>
      </div>

      {statusMessage && (
        <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', marginTop: 4, fontWeight: 500 }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}
