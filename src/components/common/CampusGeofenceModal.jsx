import React, { useState } from 'react';

export default function CampusGeofenceModal({
  isOpen = false,
  onClose = () => {},
  initialCoordinates = {
    campusName: 'Eastern Visayas State University — Ormoc City Campus',
    latitude: 11.0065,
    longitude: 124.6075,
    radiusM: 500,
    enforceGeofence: true,
  },
  onSave = () => {},
}) {
  const [campusName, setCampusName] = useState(initialCoordinates.campusName);
  const [latitude, setLatitude] = useState(initialCoordinates.latitude);
  const [longitude, setLongitude] = useState(initialCoordinates.longitude);
  const [radiusM, setRadiusM] = useState(initialCoordinates.radiusM);
  const [enforceGeofence, setEnforceGeofence] = useState(initialCoordinates.enforceGeofence);
  const [toastMsg, setToastMsg] = useState(null);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      campusName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusM: parseInt(radiusM, 10),
      enforceGeofence,
    };
    onSave(updated);
    setToastMsg(`Campus geofence perimeter updated successfully (${radiusM}m radius applied across all departments).`);
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '620px', width: '92%' }}>
        <div className="modal-header">
          <div>
            <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📍 University Campus Geofence Configuration</span>
            </div>
            <div className="muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
              Centralized perimeter enforcement for all university departments &amp; offices
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {toastMsg && (
          <div className="flash flash-success" style={{ marginBottom: '16px' }}>
            ✓ {toastMsg}
          </div>
        )}

        {/* Informational Scope Alert */}
        <div
          style={{
            background: 'var(--brand-50)',
            border: '1px solid var(--brand-border)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '18px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--ink-800)',
          }}
        >
          ℹ️ <b>Universal Campus Scope:</b> All departments and offices (Computer Studies, Technology, Engineering, HRMDO, etc.) share this university-wide geofence perimeter. Daily Accomplishment Reports (DAR) submitted by COS personnel must originate within this boundary.
        </div>

        {/* Visual Map / Perimeter Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            padding: '24px 20px',
            color: '#fff',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
          }}
        >
          {/* Subtle radar / perimeter rings decoration */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              border: '2px dashed rgba(59, 130, 246, 0.35)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <div style={{ fontSize: '30px', marginBottom: '4px' }}>🏛️</div>
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.02em' }}>
              {campusName}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Latitude: <b>{parseFloat(latitude).toFixed(6)}° N</b> • Longitude: <b>{parseFloat(longitude).toFixed(6)}° E</b>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                ⬡ {radiusM}m Active Radius
              </span>
              <span
                style={{
                  background: enforceGeofence ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: enforceGeofence ? '#60a5fa' : '#f87171',
                  border: `1px solid ${enforceGeofence ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {enforceGeofence ? '✓ GPS Enforcement Enabled' : '⚠ Enforcement Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="campusNameInput">Campus Designation</label>
            <input
              id="campusNameInput"
              className="form-control"
              type="text"
              required
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitudeInput">Center Latitude (°N)</label>
              <input
                id="latitudeInput"
                className="form-control"
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitudeInput">Center Longitude (°E)</label>
              <input
                id="longitudeInput"
                className="form-control"
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="radiusInput">Geofence Radius (meters)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                id="radiusInput"
                className="form-control"
                type="number"
                min="100"
                max="5000"
                step="50"
                required
                value={radiusM}
                onChange={(e) => setRadiusM(e.target.value)}
                style={{ flex: 1 }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                {[300, 500, 750, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`btn btn-sm ${parseInt(radiusM, 10) === preset ? 'btn-primary' : ''}`}
                    onClick={() => setRadiusM(preset)}
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>
            <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              Standard EVSU-Ormoc campus footprint requires ~500m radius from center coordinates.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)' }}>
                Enforce Geofence on Daily Accomplishment Reports
              </div>
              <div className="muted" style={{ fontSize: '12px' }}>
                Submissions outside this perimeter will be flagged as Out-of-Bounds (FR-30).
              </div>
            </div>
            <input
              type="checkbox"
              id="enforceToggle"
              checked={enforceGeofence}
              onChange={(e) => setEnforceGeofence(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div className="flex-between">
            <button type="button" className="btn" onClick={onClose} style={{ cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ cursor: 'pointer' }}>
              Save Campus Geofence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
