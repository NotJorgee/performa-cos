import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Check, AlertTriangle, X, Settings, Ruler, Save } from 'lucide-react';
import { getCampusGeofences, saveCampusGeofences } from '../../utils/campusGeofence';

export default function CampusGeofenceModal({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
}) {
  const [campuses, setCampuses] = useState(() => getCampusGeofences());
  const [selectedCampusId, setSelectedCampusId] = useState(
    () => campuses[0]?.id || 'evsu_ormoc_main'
  );

  const selectedCampus =
    campuses.find((c) => c.id === selectedCampusId) || campuses[0];

  const [campusName, setCampusName] = useState(selectedCampus.name);
  const [latitude, setLatitude] = useState(selectedCampus.latitude);
  const [longitude, setLongitude] = useState(selectedCampus.longitude);
  const [radiusM, setRadiusM] = useState(selectedCampus.radiusM);
  const [enforceGeofence, setEnforceGeofence] = useState(
    selectedCampus.enforceGeofence
  );
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (selectedCampus) {
      setCampusName(selectedCampus.name);
      setLatitude(selectedCampus.latitude);
      setLongitude(selectedCampus.longitude);
      setRadiusM(selectedCampus.radiusM);
      setEnforceGeofence(selectedCampus.enforceGeofence);
    }
  }, [selectedCampusId, campuses]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const updatedList = campuses.map((c) => {
      if (c.id === selectedCampusId) {
        return {
          ...c,
          name: campusName,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusM: parseInt(radiusM, 10),
          enforceGeofence,
        };
      }
      return c;
    });

    setCampuses(updatedList);
    saveCampusGeofences(updatedList);
    onSave(updatedList);
    setToastMsg(`Geofence for "${campusName}" updated successfully (${radiusM}m radius).`);
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 1400);
  };

  const coverageAreaKm2 = ((Math.PI * Math.pow(radiusM, 2)) / 1000000).toFixed(3);

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '640px', width: '92%' }}>
        <div className="modal-header">
          <div>
            <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--brand-700)" />
              <span>Multi-Campus Geofence Configuration</span>
            </div>
            <div className="muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
              Configure perimeter boundaries for EVSU Ormoc Main &amp; Luna campuses.
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {toastMsg && (
          <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            {toastMsg}
          </div>
        )}

        {/* Campus Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          {campuses.map((camp) => (
            <button
              key={camp.id}
              type="button"
              className={`btn btn-sm ${camp.id === selectedCampusId ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCampusId(camp.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Building2 size={13} />
              <span>{camp.shortName || camp.name}</span>
            </button>
          ))}
        </div>

        {/* Visual Map / Perimeter Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            padding: '20px',
            color: '#fff',
            marginBottom: '18px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
          }}
        >
          {/* Radar circle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              border: '2px dashed rgba(59, 130, 246, 0.35)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <Building2 size={36} color="#38bdf8" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>
              {campusName}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
              Center: <b>{parseFloat(latitude).toFixed(6)}° N</b>, <b>{parseFloat(longitude).toFixed(6)}° E</b>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                {radiusM}m Radius
              </span>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                ~{coverageAreaKm2} km²
              </span>
              <span
                style={{
                  background: enforceGeofence ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: enforceGeofence ? '#60a5fa' : '#f87171',
                  border: `1px solid ${enforceGeofence ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                {enforceGeofence ? 'Enforced' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 600, fontSize: '12.5px' }}>
              Campus Designation Name
            </label>
            <input
              type="text"
              className="form-control"
              required
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '12.5px' }}>Latitude (°N)</label>
              <input
                type="number"
                step="0.000001"
                className="form-control"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '12.5px' }}>Longitude (°E)</label>
              <input
                type="number"
                step="0.000001"
                className="form-control"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ fontWeight: 600, fontSize: '12.5px' }}>Radius: {radiusM}m</label>
            <input
              type="range"
              min="100"
              max="2000"
              step="25"
              value={radiusM}
              onChange={(e) => setRadiusM(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--brand-700)' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div>
              <b style={{ fontSize: '13px' }}>Enforce Geofence on this Campus</b>
              <div className="muted" style={{ fontSize: '11.5px' }}>
                Allow DAR task uploads within this perimeter
              </div>
            </div>
            <input
              type="checkbox"
              checked={enforceGeofence}
              onChange={(e) => setEnforceGeofence(e.target.checked)}
              style={{ width: '17px', height: '17px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} /> Save Geofence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
