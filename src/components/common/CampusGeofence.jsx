import React, { useState } from 'react';
import { MapPin, Building2, Check, AlertTriangle, Settings, Save, ArrowLeft, Ruler, Info } from 'lucide-react';

export default function CampusGeofence({
  initialCoordinates = {
    campusName: 'Eastern Visayas State University — Ormoc City Campus',
    latitude: 11.0065,
    longitude: 124.6075,
    radiusM: 500,
    enforceGeofence: true,
  },
  onSave = () => {},
  onBack = null,
}) {
  const [campusName, setCampusName] = useState(initialCoordinates.campusName);
  const [latitude, setLatitude] = useState(initialCoordinates.latitude);
  const [longitude, setLongitude] = useState(initialCoordinates.longitude);
  const [radiusM, setRadiusM] = useState(initialCoordinates.radiusM);
  const [enforceGeofence, setEnforceGeofence] = useState(initialCoordinates.enforceGeofence);
  const [toastMsg, setToastMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Recent DAR Verification samples demonstrating perimeter boundary compliance
  const [complianceLogs] = useState([
    {
      id: 1,
      name: 'Jorge Mikhael Gubantes',
      department: 'Computer Studies Department',
      time: 'Today, 04:58 PM',
      coordinates: '11.00692° N, 124.60718° E',
      distance: '142m from campus center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 2,
      name: 'Carlos Mendoza',
      department: 'Maintenance/Janitorial (MESO) Office',
      time: 'Today, 04:45 PM',
      coordinates: '11.00580° N, 124.60810° E',
      distance: '215m from campus center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 3,
      name: 'Ian Joseph Ranoco',
      department: 'Computer Studies Department',
      time: 'Today, 04:30 PM',
      coordinates: '11.00635° N, 124.60762° E',
      distance: '48m from campus center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 4,
      name: 'Jeramae Pace',
      department: 'Library Office',
      time: 'Oct 24, 2026 05:01 PM',
      coordinates: '11.00712° N, 124.60688° E',
      distance: '185m from campus center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
  ]);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = {
      campusName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusM: parseInt(radiusM, 10),
      enforceGeofence,
    };

    setTimeout(() => {
      onSave(updated);
      setIsSaving(false);
      setToastMsg(`University campus geofence perimeter updated successfully (${radiusM}m radius applied across all departments).`);
      setTimeout(() => setToastMsg(null), 4500);
    }, 400);
  };

  const coverageAreaKm2 = ((Math.PI * Math.pow(radiusM, 2)) / 1000000).toFixed(3);

  return (
    <div>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={28} color="var(--brand-700)" /> University Campus Geofence Configuration
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Centralized GPS perimeter enforcement for all university departments &amp; offices.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          {toastMsg}
        </div>
      )}

      {/* Informational Universal Campus Scope Notice */}
      <div
        style={{
          background: 'var(--brand-50)',
          border: '1px solid var(--brand-border)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          fontSize: '13.5px',
          lineHeight: 1.5,
          color: 'var(--ink-800)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={20} color="var(--brand-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <b>Universal Campus Scope:</b> All departments and colleges (Computer Studies, Technology, Engineering, Education, Library, HRMDO, MESO Maintenance, etc.) operate under this unified EVSU-Ormoc campus boundary. Daily Accomplishment Reports (DAR) submitted by COS personnel must originate within this designated perimeter.
        </div>
      </div>

      {/* Main Grid: Visual Map Preview + Configuration Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Visual Map / Perimeter Card */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            padding: '28px 24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            minHeight: '380px',
          }}
        >
          {/* Subtle radar / perimeter rings decoration */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '320px',
              height: '320px',
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
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.25)',
              border: '2px solid #60a5fa',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Building2 size={44} color="#38bdf8" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.02em', color: '#fff' }}>
              {campusName}
            </div>
            <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px' }}>
              Center Coordinates: <b>{parseFloat(latitude).toFixed(6)}° N</b>, <b>{parseFloat(longitude).toFixed(6)}° E</b>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                }}
              >
                {radiusM}m Active Radius
              </span>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Ruler size={13} /> ~{coverageAreaKm2} km² Area
              </span>
              <span
                style={{
                  background: enforceGeofence ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: enforceGeofence ? '#60a5fa' : '#f87171',
                  border: `1px solid ${enforceGeofence ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  padding: '5px 14px',
                  borderRadius: '999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {enforceGeofence ? (
                  <>
                    <Check size={13} /> GPS Enforcement Active
                  </>
                ) : (
                  <>
                    <AlertTriangle size={13} /> Enforcement Paused
                  </>
                )}
              </span>
            </div>

            <p style={{ margin: '18px 0 0', fontSize: '12px', color: '#64748b', maxWidth: '380px' }}>
              GPS boundary calculation utilizes the Haversine great-circle formula to calculate Euclidean distances on mobile DAR submissions.
            </p>
          </div>
        </div>

        {/* Configuration Form Card */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="var(--brand-700)" />
            <span>Perimeter Parameters</span>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="campusNameInput" style={{ fontWeight: 600, fontSize: '13px' }}>
                Campus Designation / Facility Name
              </label>
              <input
                id="campusNameInput"
                className="form-control"
                type="text"
                required
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="latitudeInput" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Center Latitude (°N)
                </label>
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
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="longitudeInput" style={{ fontWeight: 600, fontSize: '13px' }}>
                  Center Longitude (°E)
                </label>
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

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label htmlFor="radiusInput" style={{ fontWeight: 600, fontSize: '13px' }}>
                Geofence Radius (meters)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  id="radiusInput"
                  className="form-control"
                  type="number"
                  min="100"
                  max="5000"
                  step="25"
                  required
                  value={radiusM}
                  onChange={(e) => setRadiusM(e.target.value)}
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[300, 500, 750, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`btn btn-sm ${parseInt(radiusM, 10) === preset ? 'btn-primary' : ''}`}
                      onClick={() => setRadiusM(preset)}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="25"
                value={radiusM}
                onChange={(e) => setRadiusM(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--brand-700)', cursor: 'pointer' }}
              />
              <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                Standard EVSU-Ormoc campus bounds require ~500m radius from center coordinates.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
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
                  Submissions outside this perimeter will be flagged as Out-of-Bounds.
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  padding: '8px 20px',
                }}
              >
                {isSaving ? 'Saving Changes...' : (
                  <>
                    <Save size={15} /> Save Campus Geofence
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Geofence Verification Activity Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="card-title" style={{ margin: 0 }}>
            Recent DAR GPS Perimeter Verifications
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Live log of Daily Accomplishment Report geofence validations recorded across campus departments.
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Personnel</th>
              <th>Department</th>
              <th>Submission Timestamp</th>
              <th>Recorded GPS Location</th>
              <th>Proximity to Center</th>
              <th>Geofence Status</th>
            </tr>
          </thead>
          <tbody>
            {complianceLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <b>{log.name}</b>
                </td>
                <td style={{ fontSize: '13px' }}>{log.department}</td>
                <td style={{ fontSize: '13px', color: 'var(--ink-700)' }}>{log.time}</td>
                <td style={{ fontSize: '12.5px', fontFamily: 'monospace' }}>{log.coordinates}</td>
                <td style={{ fontSize: '13px', color: 'var(--ink-800)' }}>{log.distance}</td>
                <td>
                  <span className="badge badge-active" style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
