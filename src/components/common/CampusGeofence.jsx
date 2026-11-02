import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building2,
  Check,
  AlertTriangle,
  Settings,
  Save,
  ArrowLeft,
  Ruler,
  Plus,
  Trash2,
  Navigation,
  Compass,
  Layers,
  X,
} from 'lucide-react';
import {
  getCampusGeofences,
  saveCampusGeofences,
  calculateHaversineDistanceMeters,
} from '../../utils/campusGeofence';

export default function CampusGeofence({
  onSave = () => {},
  onBack = null,
}) {
  const [campuses, setCampuses] = useState(() => getCampusGeofences());
  const [selectedCampusId, setSelectedCampusId] = useState(
    () => campuses[0]?.id || 'evsu_ormoc_main'
  );

  const selectedCampus =
    campuses.find((c) => c.id === selectedCampusId) || campuses[0];

  const [campusName, setCampusName] = useState(selectedCampus.name);
  const [shortName, setShortName] = useState(selectedCampus.shortName || '');
  const [locationNote, setLocationNote] = useState(
    selectedCampus.locationNote || ''
  );
  const [latitude, setLatitude] = useState(selectedCampus.latitude);
  const [longitude, setLongitude] = useState(selectedCampus.longitude);
  const [radiusM, setRadiusM] = useState(selectedCampus.radiusM);
  const [enforceGeofence, setEnforceGeofence] = useState(
    selectedCampus.enforceGeofence
  );

  const [toastMsg, setToastMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampusData, setNewCampusData] = useState({
    name: '',
    shortName: '',
    locationNote: '',
    latitude: 11.0065,
    longitude: 124.6075,
    radiusM: 500,
    enforceGeofence: true,
  });

  // Synchronize form when selected campus tab changes
  useEffect(() => {
    if (selectedCampus) {
      setCampusName(selectedCampus.name);
      setShortName(selectedCampus.shortName || '');
      setLocationNote(selectedCampus.locationNote || '');
      setLatitude(selectedCampus.latitude);
      setLongitude(selectedCampus.longitude);
      setRadiusM(selectedCampus.radiusM);
      setEnforceGeofence(selectedCampus.enforceGeofence);
    }
  }, [selectedCampusId, campuses]);

  // Recent DAR Verification logs across both campuses
  const [complianceLogs] = useState([
    {
      id: 1,
      name: 'Jorge Mikhael Gubantes',
      department: 'Computer Studies Department',
      campusSite: 'EVSU Ormoc — Main Campus',
      time: 'Today, 04:58 PM',
      coordinates: '11.00692° N, 124.60718° E',
      distance: '142m from Main center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 2,
      name: 'Carlos Mendoza',
      department: 'Maintenance/Janitorial (MESO) Office',
      campusSite: 'EVSU Ormoc — Luna Campus',
      time: 'Today, 04:45 PM',
      coordinates: '11.06015° N, 124.61320° E',
      distance: '88m from Luna center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 3,
      name: 'Ian Joseph Ranoco',
      department: 'Computer Studies Department',
      campusSite: 'EVSU Ormoc — Main Campus',
      time: 'Today, 04:30 PM',
      coordinates: '11.00635° N, 124.60762° E',
      distance: '48m from Main center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 4,
      name: 'Jeramae Pace',
      department: 'Library Office',
      campusSite: 'EVSU Ormoc — Main Campus',
      time: 'Oct 24, 2026 05:01 PM',
      coordinates: '11.00712° N, 124.60688° E',
      distance: '185m from Main center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 5,
      name: 'Eduardo Tan',
      department: 'College of Engineering & Technology',
      campusSite: 'EVSU Ormoc — Luna Campus',
      time: 'Oct 24, 2026 04:40 PM',
      coordinates: '11.06095° N, 124.61410° E',
      distance: '65m from Luna center',
      status: 'Verified In-Bounds',
      isValid: true,
    },
  ]);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedList = campuses.map((c) => {
      if (c.id === selectedCampusId) {
        return {
          ...c,
          name: campusName,
          shortName: shortName || campusName,
          locationNote,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusM: parseInt(radiusM, 10),
          enforceGeofence,
        };
      }
      return c;
    });

    setTimeout(() => {
      setCampuses(updatedList);
      saveCampusGeofences(updatedList);
      onSave(updatedList);
      setIsSaving(false);
      setToastMsg(
        `Geofence perimeter for "${campusName}" updated successfully (${radiusM}m radius applied).`
      );
      setTimeout(() => setToastMsg(null), 4500);
    }, 350);
  };

  const handleAddCampus = (e) => {
    e.preventDefault();
    const newId = `campus_${Date.now()}`;
    const newCampus = {
      id: newId,
      name: newCampusData.name || 'New External Campus',
      shortName: newCampusData.shortName || newCampusData.name || 'Campus Site',
      locationNote: newCampusData.locationNote || 'Ormoc City',
      latitude: parseFloat(newCampusData.latitude),
      longitude: parseFloat(newCampusData.longitude),
      radiusM: parseInt(newCampusData.radiusM, 10),
      enforceGeofence: newCampusData.enforceGeofence,
      isPrimary: false,
    };

    const updatedList = [...campuses, newCampus];
    setCampuses(updatedList);
    saveCampusGeofences(updatedList);
    setSelectedCampusId(newId);
    setShowAddModal(false);
    setNewCampusData({
      name: '',
      shortName: '',
      locationNote: '',
      latitude: 11.0065,
      longitude: 124.6075,
      radiusM: 500,
      enforceGeofence: true,
    });
    setToastMsg(`Added "${newCampus.name}" to authorized geofence sites.`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleDeleteCampus = (idToDelete) => {
    if (campuses.length <= 1) {
      alert('At least one campus geofence perimeter must remain configured.');
      return;
    }
    const toDelete = campuses.find((c) => c.id === idToDelete);
    if (!window.confirm(`Are you sure you want to remove the geofence site "${toDelete?.name}"?`)) {
      return;
    }

    const updatedList = campuses.filter((c) => c.id !== idToDelete);
    setCampuses(updatedList);
    saveCampusGeofences(updatedList);
    setSelectedCampusId(updatedList[0].id);
    setToastMsg(`Removed campus site "${toDelete?.name}".`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Calculate distance between the first two campuses if at least 2 exist
  const interCampusDistanceKm =
    campuses.length >= 2
      ? (
          calculateHaversineDistanceMeters(
            campuses[0].latitude,
            campuses[0].longitude,
            campuses[1].latitude,
            campuses[1].longitude
          ) / 1000
        ).toFixed(1)
      : null;

  const coverageAreaKm2 = ((Math.PI * Math.pow(radiusM, 2)) / 1000000).toFixed(3);

  return (
    <div>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1
            style={{
              margin: '0 0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <MapPin size={28} color="var(--brand-700)" /> Multi-Campus Geofence Configuration
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Centralized GPS perimeter management for EVSU Ormoc satellite campus and external facility sites.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onBack && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={onBack}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div
          className="flash flash-success"
          style={{
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} />
          {toastMsg}
        </div>
      )}

      {/* Multi-Campus Zone Selector Strip */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          background: '#f8fafc',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink-900)' }}>
              Authorized University Campus Perimeters ({campuses.length} Sites Configured)
            </div>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
              COS personnel may upload Daily Accomplishment Reports (DAR) when physically present at any active site.
              {interCampusDistanceKm && (
                <span style={{ marginLeft: '6px', color: 'var(--brand-700)', fontWeight: 600 }}>
                  (Main &amp; Luna are ~{interCampusDistanceKm} km apart)
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Plus size={14} /> Add Campus Site
          </button>
        </div>

        {/* Campus Cards / Tab Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          {campuses.map((camp) => {
            const isSelected = camp.id === selectedCampusId;
            return (
              <div
                key={camp.id}
                onClick={() => setSelectedCampusId(camp.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: isSelected
                    ? '2px solid var(--primary)'
                    : '1px solid var(--line)',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2
                      size={16}
                      color={isSelected ? 'var(--primary)' : 'var(--ink-600)'}
                    />
                    <b
                      style={{
                        fontSize: '13.5px',
                        color: isSelected ? 'var(--primary)' : 'var(--ink-900)',
                      }}
                    >
                      {camp.name}
                    </b>
                  </div>
                  <div
                    className="muted"
                    style={{ fontSize: '12px', marginTop: '3px' }}
                  >
                    {camp.locationNote || 'Ormoc City'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginTop: '8px',
                      fontSize: '11.5px',
                    }}
                  >
                    <span className="badge" style={{ background: '#e2e8f0', color: '#1e293b', padding: '2px 8px' }}>
                      {camp.radiusM}m radius
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: camp.enforceGeofence ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: camp.enforceGeofence ? '#15803d' : '#b91c1c',
                        padding: '2px 8px',
                      }}
                    >
                      {camp.enforceGeofence ? 'Enforced' : 'Paused'}
                    </span>
                  </div>
                </div>

                {!camp.isPrimary && campuses.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampus(camp.id);
                    }}
                    title="Remove this campus site"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Visual Map Preview + Configuration Form for Selected Campus */}
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
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {locationNote}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
              Center Coordinates: <b>{parseFloat(latitude).toFixed(6)}° N</b>,{' '}
              <b>{parseFloat(longitude).toFixed(6)}° E</b>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '18px',
                flexWrap: 'wrap',
              }}
            >
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
                  background: enforceGeofence
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                  color: enforceGeofence ? '#60a5fa' : '#f87171',
                  border: `1px solid ${
                    enforceGeofence
                      ? 'rgba(59, 130, 246, 0.4)'
                      : 'rgba(239, 68, 68, 0.4)'
                  }`,
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

            <p
              style={{
                margin: '18px 0 0',
                fontSize: '12px',
                color: '#64748b',
                maxWidth: '380px',
              }}
            >
              GPS calculation uses the Haversine great-circle formula. COS submissions anywhere within this perimeter are verified on-site.
            </p>
          </div>
        </div>

        {/* Configuration Form Card for Selected Campus */}
        <div className="card" style={{ padding: '24px' }}>
          <div
            className="card-title"
            style={{
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Settings size={18} color="var(--brand-700)" />
            <span>Parameters for {shortName || campusName}</span>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label
                htmlFor="campusNameInput"
                style={{ fontWeight: 600, fontSize: '13px' }}
              >
                Full Campus Designation
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

            <div
              className="form-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '14px',
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label
                  htmlFor="shortNameInput"
                  style={{ fontWeight: 600, fontSize: '13px' }}
                >
                  Short Name / Tag
                </label>
                <input
                  id="shortNameInput"
                  className="form-control"
                  type="text"
                  required
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. Luna Campus"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label
                  htmlFor="locationNoteInput"
                  style={{ fontWeight: 600, fontSize: '13px' }}
                >
                  Location / Barangay
                </label>
                <input
                  id="locationNoteInput"
                  className="form-control"
                  type="text"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  placeholder="e.g. Barangay Luna"
                />
              </div>
            </div>

            <div
              className="form-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '14px',
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label
                  htmlFor="latitudeInput"
                  style={{ fontWeight: 600, fontSize: '13px' }}
                >
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
                <label
                  htmlFor="longitudeInput"
                  style={{ fontWeight: 600, fontSize: '13px' }}
                >
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
              <label
                htmlFor="radiusInput"
                style={{ fontWeight: 600, fontSize: '13px' }}
              >
                Geofence Radius (meters)
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
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
                      className={`btn btn-sm ${
                        parseInt(radiusM, 10) === preset ? 'btn-primary' : ''
                      }`}
                      onClick={() => setRadiusM(preset)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
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
                style={{
                  width: '100%',
                  accentColor: 'var(--brand-700)',
                  cursor: 'pointer',
                }}
              />
              <div
                className="muted"
                style={{ fontSize: '12px', marginTop: '4px' }}
              >
                Recommended radius for this facility is ~500m.
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
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: 'var(--ink)',
                  }}
                >
                  Enforce Geofence on this Campus
                </div>
                <div className="muted" style={{ fontSize: '12px' }}>
                  When active, COS submissions within this zone are accepted as in-bounds.
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
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
                {isSaving ? (
                  'Saving Changes...'
                ) : (
                  <>
                    <Save size={15} /> Save {shortName || 'Campus'} Geofence
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Geofence Verification Activity Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            background: '#fff',
          }}
        >
          <div className="card-title" style={{ margin: 0 }}>
            Recent DAR GPS Perimeter Verifications (Multi-Campus Logs)
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Live log of Daily Accomplishment Report geofence validations recorded across Main and Luna campuses.
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Personnel</th>
              <th>Department</th>
              <th>Campus Site</th>
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
                <td>
                  <span
                    className="badge"
                    style={{
                      background: log.campusSite.includes('Luna')
                        ? '#ede9fe'
                        : '#eff6ff',
                      color: log.campusSite.includes('Luna')
                        ? '#6d28d9'
                        : '#1d4ed8',
                      fontWeight: 700,
                      fontSize: '11.5px',
                    }}
                  >
                    {log.campusSite}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
                  {log.time}
                </td>
                <td
                  style={{
                    fontSize: '12.5px',
                    fontFamily: 'monospace',
                  }}
                >
                  {log.coordinates}
                </td>
                <td style={{ fontSize: '13px', color: 'var(--ink-800)' }}>
                  {log.distance}
                </td>
                <td>
                  <span
                    className="badge badge-active"
                    style={{
                      fontSize: '11.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Check size={12} /> {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add New Campus Geofence Site */}
      {showAddModal && (
        <div
          className="modal-overlay open"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '12px',
              background: '#fff',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 800, fontSize: '15.5px', color: 'var(--ink-900)' }}>
                  Add Campus Geofence Site
                </span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-600)',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCampus} style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px' }}>
                  Full Campus Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. EVSU Ormoc — Luna Extension Annex"
                  value={newCampusData.name}
                  onChange={(e) =>
                    setNewCampusData({ ...newCampusData, name: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>
                    Short Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Luna Annex"
                    value={newCampusData.shortName}
                    onChange={(e) =>
                      setNewCampusData({
                        ...newCampusData,
                        shortName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>
                    Location / Barangay
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Brgy. Luna"
                    value={newCampusData.locationNote}
                    onChange={(e) =>
                      setNewCampusData({
                        ...newCampusData,
                        locationNote: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>
                    Latitude (°N)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-control"
                    required
                    value={newCampusData.latitude}
                    onChange={(e) =>
                      setNewCampusData({
                        ...newCampusData,
                        latitude: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>
                    Longitude (°E)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-control"
                    required
                    value={newCampusData.longitude}
                    onChange={(e) =>
                      setNewCampusData({
                        ...newCampusData,
                        longitude: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px' }}>
                  Radius (meters)
                </label>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  step="25"
                  className="form-control"
                  required
                  value={newCampusData.radiusM}
                  onChange={(e) =>
                    setNewCampusData({
                      ...newCampusData,
                      radiusM: e.target.value,
                    })
                  }
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
