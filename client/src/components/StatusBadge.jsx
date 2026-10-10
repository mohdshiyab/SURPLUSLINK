import React from 'react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'OPEN':
      return <span className="badge badge-open">● OPEN</span>;
    case 'FULLY_CLAIMED':
      return <span className="badge badge-fully-claimed">✓ FULLY CLAIMED</span>;
    case 'EXPIRED':
      return <span className="badge badge-expired">⏱ EXPIRED</span>;
    case 'CANCELLED':
      return <span className="badge badge-cancelled">✕ CANCELLED</span>;
    case 'ACTIVE':
      return <span className="badge badge-active">⚡ ACTIVE</span>;
    case 'COLLECTED':
      return <span className="badge badge-collected">✓ COLLECTED</span>;
    case 'MISSED':
      return <span className="badge badge-missed">⚠ MISSED</span>;
    default:
      return <span className="badge">{normalized}</span>;
  }
}
