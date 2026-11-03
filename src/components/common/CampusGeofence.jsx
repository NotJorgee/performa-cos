import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Search,
  Filter,
  RefreshCw,
  Eye,
  Crosshair,
  ShieldCheck,
  Activity,
  Maximize2,
  Map as MapIcon,
  Globe,
  Radio,
} from 'lucide-react';
import {
  getCampusGeofences,
  saveCampusGeofences,
  calculateHaversineDistanceMeters,
} from '../../utils/campusGeofence';
import { api } from '../../services/api';

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

  const [campusName, setCampusName] = useState(selectedCampus?.name || '');
  const [shortName, setShortName] = useState(selectedCampus?.shortName || '');
  const [locationNote, setLocationNote] = useState(
    selectedCampus?.locationNote || ''
  );
  const [latitude, setLatitude] = useState(selectedCampus?.latitude || 11.0065);
  const [longitude, setLongitude] = useState(selectedCampus?.longitude || 124.6075);
  const [radiusM, setRadiusM] = useState(selectedCampus?.radiusM || 500);
  const [enforceGeofence, setEnforceGeofence] = useState(
    selectedCampus?.enforceGeofence !== false
  );

  const [toastMsg, setToastMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mapLayerType, setMapLayerType] = useState('streets'); // 'streets' | 'satellite'

  // Table filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeLocatePing, setActiveLocatePing] = useState(null);

  // New Campus Modal form
  const [newCampusData, setNewCampusData] = useState({
    name: '',
    shortName: '',
    locationNote: '',
    latitude: 11.0065,
    longitude: 124.6075,
    radiusM: 500,
    enforceGeofence: true,
  });

  // Verification Activity logs from API (with local fallback)
  const [complianceLogs, setComplianceLogs] = useState([
    {
      id: 9001,
      name: 'Jorge Mikhael R. Gubantes',
      department: 'HRMDO Office',
      campusSite: 'EVSU Ormoc — Main Campus',
      time: 'Today, 04:58 PM',
      coordinates: '11.00692° N, 124.60718° E',
      latitude: 11.00692,
      longitude: 124.60718,
      distance: '58m from Main center',
      distanceMeters: 58,
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 9002,
      name: 'John A. Doe',
      department: 'Computer Studies Department',
      campusSite: 'EVSU Ormoc — Main Campus',
      time: 'Today, 04:45 PM',
      coordinates: '11.00635° N, 124.60762° E',
      latitude: 11.00635,
      longitude: 124.60762,
      distance: '32m from Main center',
      distanceMeters: 32,
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 9003,
      name: 'Jane A. Doe',
      department: 'Computer Studies Department',
      campusSite: 'EVSU Ormoc — Main Campus',
      time: 'Today, 04:30 PM',
      coordinates: '11.00712° N, 124.60688° E',
      latitude: 11.00712,
      longitude: 124.60688,
      distance: '112m from Main center',
      distanceMeters: 112,
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 9004,
      name: 'Carlos Mendoza',
      department: 'Maintenance / Janitorial (MESO) Office',
      campusSite: 'EVSU Ormoc — Luna Campus',
      time: 'Today, 04:15 PM',
      coordinates: '11.06015° N, 124.61320° E',
      latitude: 11.06015,
      longitude: 124.61320,
      distance: '82m from Luna center',
      distanceMeters: 82,
      status: 'Verified In-Bounds',
      isValid: true,
    },
    {
      id: 9005,
      name: 'Eduardo Tan',
      department: 'Technology Department',
      campusSite: 'EVSU Ormoc — Luna Campus',
      time: 'Yesterday, 05:02 PM',
      coordinates: '11.06095° N, 124.61410° E',
      latitude: 11.06095,
      longitude: 124.61410,
      distance: '64m from Luna center',
      distanceMeters: 64,
      status: 'Verified In-Bounds',
      isValid: true,
    },
  ]);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const streetsTileRef = useRef(null);
  const satelliteTileRef = useRef(null);
  const perimeterCircleRef = useRef(null);
  const campusMarkersRef = useRef([]);
  const locateMarkerRef = useRef(null);
  const locatePolylineRef = useRef(null);

  // 1. Fetch campuses and verification logs from API on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        if (api?.geofences?.list) {
          const remoteCampuses = await api.geofences.list();
          if (isMounted && Array.isArray(remoteCampuses) && remoteCampuses.length > 0) {
            setCampuses(remoteCampuses);
            saveCampusGeofences(remoteCampuses);
          }
        }
      } catch (err) {
        console.warn('Using local campus geofence configuration:', err.message);
      }

      try {
        if (api?.geofences?.getVerifications) {
          setIsLoadingVerifications(true);
          const logs = await api.geofences.getVerifications();
          if (isMounted && Array.isArray(logs) && logs.length > 0) {
            setComplianceLogs(logs);
          }
        }
      } catch (err) {
        console.warn('Using local baseline verification logs:', err.message);
      } finally {
        if (isMounted) setIsLoadingVerifications(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronize form inputs when selected campus tab changes
  useEffect(() => {
    if (selectedCampus) {
      setCampusName(selectedCampus.name);
      setShortName(selectedCampus.shortName || '');
      setLocationNote(selectedCampus.locationNote || '');
      setLatitude(selectedCampus.latitude);
      setLongitude(selectedCampus.longitude);
      setRadiusM(selectedCampus.radiusM);
      setEnforceGeofence(selectedCampus.enforceGeofence !== false);
    }
  }, [selectedCampusId, campuses]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = parseFloat(latitude) || 11.0065;
    const initialLng = parseFloat(longitude) || 124.6075;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
    });

    const streets = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    );

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri GIS',
      }
    );

    streetsTileRef.current = streets;
    satelliteTileRef.current = satellite;

    // Default to streets
    streets.addTo(map);

    // Metric scale indicator
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Map click allows fine-tuning center coordinates
    map.on('click', (e) => {
      const clickedLat = parseFloat(e.latlng.lat.toFixed(6));
      const clickedLng = parseFloat(e.latlng.lng.toFixed(6));
      setLatitude(clickedLat);
      setLongitude(clickedLng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Switch Map Layer (Streets vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !streetsTileRef.current || !satelliteTileRef.current) return;

    if (mapLayerType === 'satellite') {
      if (map.hasLayer(streetsTileRef.current)) {
        map.removeLayer(streetsTileRef.current);
      }
      if (!map.hasLayer(satelliteTileRef.current)) {
        satelliteTileRef.current.addTo(map);
      }
    } else {
      if (map.hasLayer(satelliteTileRef.current)) {
        map.removeLayer(satelliteTileRef.current);
      }
      if (!map.hasLayer(streetsTileRef.current)) {
        streetsTileRef.current.addTo(map);
      }
    }
  }, [mapLayerType]);

  // 5. Update Center Marker & Perimeter Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const numLat = parseFloat(latitude);
    const numLng = parseFloat(longitude);
    const numRadius = parseFloat(radiusM) || 500;

    if (isNaN(numLat) || isNaN(numLng)) return;

    // Fly to new center smoothly when selected campus changes
    map.flyTo([numLat, numLng], 16, { duration: 0.8 });

    // Remove existing perimeter circle
    if (perimeterCircleRef.current) {
      map.removeLayer(perimeterCircleRef.current);
    }

    // Draw active perimeter circle
    const circle = L.circle([numLat, numLng], {
      color: enforceGeofence ? '#991b1b' : '#64748b',
      fillColor: enforceGeofence ? '#b91c1c' : '#94a3b8',
      fillOpacity: enforceGeofence ? 0.22 : 0.12,
      weight: 2.5,
      dashArray: '6, 6',
      radius: numRadius,
    }).addTo(map);

    circle.bindPopup(
      `<div style="font-family: inherit; font-size: 12.5px;">
        <b style="color: #800000;">${campusName}</b><br/>
        <b>Perimeter Radius:</b> ${numRadius}m<br/>
        <b>Center:</b> ${numLat.toFixed(5)}° N, ${numLng.toFixed(5)}° E<br/>
        <b>Enforcement:</b> ${enforceGeofence ? '<span style="color:#15803d; font-weight:700;">Active</span>' : '<span style="color:#b91c1c; font-weight:700;">Paused</span>'}
      </div>`
    );

    perimeterCircleRef.current = circle;

    // Clear previous campus markers
    campusMarkersRef.current.forEach((m) => map.removeLayer(m));
    campusMarkersRef.current = [];

    // Add pins for all campuses
    campuses.forEach((camp) => {
      const isCurrent = camp.id === selectedCampusId;
      const cLat = isCurrent ? numLat : parseFloat(camp.latitude);
      const cLng = isCurrent ? numLng : parseFloat(camp.longitude);

      const pinIcon = L.divIcon({
        className: 'evsu-campus-marker',
        html: `
          <div style="
            background: ${isCurrent ? '#800000' : '#1e293b'};
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11.5px;
            font-weight: 700;
            box-shadow: 0 4px 14px rgba(0,0,0,0.45);
            border: 2px solid ${isCurrent ? '#fbbf24' : '#cbd5e1'};
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            transform: translate(-50%, -100%);
            cursor: ${isCurrent ? 'grab' : 'pointer'};
            user-select: none;
          ">
            <span>🏛️</span>
            <span>${camp.shortName || camp.name}</span>
            ${isCurrent ? '<span style="font-size: 10px; background: rgba(251, 191, 36, 0.25); color: #fef08a; padding: 1px 5px; border-radius: 10px;">Drag</span>' : ''}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([cLat, cLng], {
        icon: pinIcon,
        draggable: isCurrent,
        autoPan: true,
      }).addTo(map);

      if (isCurrent) {
        marker.bindTooltip('✋ Drag pin to reposition campus center', {
          permanent: false,
          direction: 'top',
          offset: [0, -32],
        });

        marker.on('drag', (e) => {
          const newPos = e.target.getLatLng();
          if (perimeterCircleRef.current) {
            perimeterCircleRef.current.setLatLng(newPos);
          }
        });

        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          const latVal = parseFloat(newPos.lat.toFixed(6));
          const lngVal = parseFloat(newPos.lng.toFixed(6));
          setLatitude(latVal);
          setLongitude(lngVal);
        });
      } else {
        marker.on('click', () => {
          setSelectedCampusId(camp.id);
        });
      }

      campusMarkersRef.current.push(marker);
    });
  }, [latitude, longitude, radiusM, enforceGeofence, selectedCampusId, campuses, campusName]);

  // 6. Handle "Locate on Map" for verification row
  const handleLocateOnMap = (log) => {
    const map = mapInstanceRef.current;
    if (!map || !log.latitude || !log.longitude) {
      alert('GPS coordinates unavailable for this submission.');
      return;
    }

    setActiveLocatePing(log.id);

    // Remove previous ping highlight
    if (locateMarkerRef.current) {
      map.removeLayer(locateMarkerRef.current);
    }
    if (locatePolylineRef.current) {
      map.removeLayer(locatePolylineRef.current);
    }

    const logLat = parseFloat(log.latitude);
    const logLng = parseFloat(log.longitude);
    const centerLat = parseFloat(latitude);
    const centerLng = parseFloat(longitude);

    // Draw dashed connecting line from ping to campus center
    const line = L.polyline(
      [
        [logLat, logLng],
        [centerLat, centerLng],
      ],
      {
        color: log.isValid ? '#059669' : '#dc2626',
        weight: 2,
        dashArray: '5, 5',
        opacity: 0.8,
      }
    ).addTo(map);
    locatePolylineRef.current = line;

    // Verification Ping Marker
    const pingIcon = L.divIcon({
      className: 'evsu-ping-marker',
      html: `
        <div style="
          background: ${log.isValid ? '#059669' : '#dc2626'};
          color: #ffffff;
          padding: 5px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          transform: translate(-50%, -50%);
        ">
          <span>${log.isValid ? '📍' : '⚠️'}</span>
          <span>${log.name}</span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const pingMarker = L.marker([logLat, logLng], { icon: pingIcon }).addTo(map);
    pingMarker
      .bindPopup(
        `<div style="font-family: inherit; font-size: 12px; line-height: 1.5;">
          <b style="color: ${log.isValid ? '#059669' : '#dc2626'}; font-size: 13px;">${log.isValid ? '✓ Verified Submission' : '⚠️ Out of Bounds'}</b><br/>
          <b>Personnel:</b> ${log.name}<br/>
          <b>Department:</b> ${log.department}<br/>
          <b>Timestamp:</b> ${log.time}<br/>
          <b>GPS Spot:</b> ${logLat.toFixed(5)}° N, ${logLng.toFixed(5)}° E<br/>
          <b>Distance to Center:</b> ${log.distance}<br/>
          <b>Campus:</b> ${log.campusSite}
        </div>`
      )
      .openPopup();

    locateMarkerRef.current = pingMarker;

    // Fly to position
    map.flyTo([logLat, logLng], 17, { duration: 1.2 });

    // Scroll up to map smoothly
    mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Recenter map button
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([parseFloat(latitude), parseFloat(longitude)], 16, { duration: 0.8 });
    }
  };

  // Zoom controls
  const handleZoom = (delta) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setZoom(map.getZoom() + delta);
    }
  };

  // Save changes to database and local state
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedCampus = {
      id: selectedCampusId,
      name: campusName,
      shortName: shortName || campusName,
      locationNote,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusM: parseInt(radiusM, 10),
      enforceGeofence,
      isPrimary: selectedCampus?.isPrimary || false,
    };

    const updatedList = campuses.map((c) =>
      c.id === selectedCampusId ? updatedCampus : c
    );

    try {
      if (api?.geofences?.updateSingle) {
        await api.geofences.updateSingle(selectedCampusId, updatedCampus);
      }
    } catch (err) {
      console.warn('Backend geofence update warning:', err.message);
    }

    setCampuses(updatedList);
    saveCampusGeofences(updatedList);
    onSave(updatedList);
    setIsSaving(false);

    setToastMsg(
      `Geofence perimeter for "${campusName}" saved successfully (${radiusM}m radius applied).`
    );
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Add campus handler
  const handleAddCampus = async (e) => {
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

    try {
      if (api?.geofences?.updateBatch) {
        await api.geofences.updateBatch(updatedList);
      }
    } catch (err) {
      console.warn('Backend batch geofence warning:', err.message);
    }

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

  // Delete campus handler
  const handleDeleteCampus = async (idToDelete) => {
    if (campuses.length <= 1) {
      alert('At least one campus geofence perimeter must remain configured.');
      return;
    }
    const toDelete = campuses.find((c) => c.id === idToDelete);
    if (!window.confirm(`Are you sure you want to remove the geofence site "${toDelete?.name}"?`)) {
      return;
    }

    try {
      if (api?.geofences?.delete) {
        await api.geofences.delete(idToDelete);
      }
    } catch (err) {
      console.warn('Backend delete campus warning:', err.message);
    }

    const updatedList = campuses.filter((c) => c.id !== idToDelete);
    setCampuses(updatedList);
    saveCampusGeofences(updatedList);
    setSelectedCampusId(updatedList[0].id);
    setToastMsg(`Removed campus site "${toDelete?.name}".`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Refresh verifications
  const handleRefreshVerifications = async () => {
    setIsLoadingVerifications(true);
    try {
      if (api?.geofences?.getVerifications) {
        const logs = await api.geofences.getVerifications();
        if (Array.isArray(logs) && logs.length > 0) {
          setComplianceLogs(logs);
        }
      }
    } catch (err) {
      console.warn('Refresh verifications warning:', err.message);
    } finally {
      setIsLoadingVerifications(false);
    }
  };

  // Calculate distance between the first two campuses
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

  // Filter compliance logs
  const filteredLogs = complianceLogs.filter((log) => {
    if (campusFilter !== 'All' && !log.campusSite.toLowerCase().includes(campusFilter.toLowerCase())) {
      return false;
    }
    if (statusFilter === 'Verified' && !log.isValid) return false;
    if (statusFilter === 'Flagged' && log.isValid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = log.name.toLowerCase().includes(q);
      const matchDept = log.department.toLowerCase().includes(q);
      if (!matchName && !matchDept) return false;
    }
    return true;
  });

  // Table summary metrics
  const totalLogsCount = complianceLogs.length;
  const verifiedCount = complianceLogs.filter((l) => l.isValid).length;
  const complianceRate = totalLogsCount > 0 ? ((verifiedCount / totalLogsCount) * 100).toFixed(1) : 100;
  const avgDistance =
    totalLogsCount > 0
      ? Math.round(
          complianceLogs.reduce((acc, curr) => acc + (curr.distanceMeters || 60), 0) /
            totalLogsCount
        )
      : 0;

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
            Interactive GIS map &amp; spatial perimeter engine for Eastern Visayas State University COS attendance verification.
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
              Approved Campus Locations ({campuses.length} Sites Configured)
            </div>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
              COS personnel may upload Daily Accomplishment Reports (DAR) when physically present within any active site boundary.
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
                    ? '2px solid var(--brand-700)'
                    : '1px solid var(--line)',
                  background: isSelected ? '#fff9fa' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  boxShadow: isSelected ? '0 4px 12px rgba(128, 0, 0, 0.08)' : 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2
                      size={16}
                      color={isSelected ? 'var(--brand-700)' : 'var(--ink-600)'}
                    />
                    <b
                      style={{
                        fontSize: '13.5px',
                        color: isSelected ? 'var(--brand-700)' : 'var(--ink-900)',
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
                        background: camp.enforceGeofence !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: camp.enforceGeofence !== false ? '#15803d' : '#b91c1c',
                        padding: '2px 8px',
                      }}
                    >
                      {camp.enforceGeofence !== false ? 'Enforced' : 'Paused'}
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

      {/* Main Grid: Interactive GIS Map + Perimeter Parameters Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1.4fr) minmax(360px, 1fr)',
          gap: '20px',
          marginBottom: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* Real Interactive Leaflet GIS Map Card */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            borderRadius: '12px',
          }}
        >
          {/* Map Top Floating Header / Controls */}
          <div
            style={{
              padding: '12px 16px',
              background: '#ffffff',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="var(--brand-700)" />
              <div>
                <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>
                  {campusName} GIS Perimeter
                </b>
                <span className="muted" style={{ fontSize: '12px', marginLeft: '6px' }}>
                  ({radiusM}m live boundary overlay)
                </span>
              </div>
            </div>

            {/* Map Action Controls */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* Layer switcher */}
              <div
                style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '2px',
                  border: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setMapLayerType('streets')}
                  style={{
                    border: 'none',
                    background: mapLayerType === 'streets' ? '#ffffff' : 'transparent',
                    color: mapLayerType === 'streets' ? 'var(--brand-700)' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: mapLayerType === 'streets' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <MapIcon size={12} /> Streets
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayerType('satellite')}
                  style={{
                    border: 'none',
                    background: mapLayerType === 'satellite' ? '#ffffff' : 'transparent',
                    color: mapLayerType === 'satellite' ? 'var(--brand-700)' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: mapLayerType === 'satellite' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Globe size={12} /> Satellite
                </button>
              </div>

              {/* Recenter Button */}
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleRecenter}
                title="Recenter Map on Campus Pin"
                style={{
                  padding: '5px 8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Crosshair size={13} /> Recenter
              </button>

              {/* Zoom In / Out */}
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleZoom(1)}
                  style={{ padding: '5px 8px', fontSize: '12px', fontWeight: 700 }}
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleZoom(-1)}
                  style={{ padding: '5px 8px', fontSize: '12px', fontWeight: 700 }}
                  title="Zoom Out"
                >
                  &minus;
                </button>
              </div>
            </div>
          </div>

          {/* Leaflet Map Canvas Container */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              minHeight: '440px',
              flex: 1,
              position: 'relative',
              background: '#e2e8f0',
              zIndex: 1,
            }}
          />

          {/* Map Bottom Metadata Floating Badge */}
          <div
            style={{
              padding: '10px 16px',
              background: '#ffffff',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--ink-700)',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>
                <b>Center:</b> {parseFloat(latitude).toFixed(5)}° N, {parseFloat(longitude).toFixed(5)}° E
              </span>
              <span>&bull;</span>
              <span>
                <b>Perimeter Area:</b> ~{coverageAreaKm2} km²
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: enforceGeofence ? '#15803d' : '#b91c1c',
                  fontWeight: 700,
                  fontSize: '11.5px',
                }}
              >
                {enforceGeofence ? (
                  <>
                    <Check size={13} /> GPS Verification Active
                  </>
                ) : (
                  <>
                    <AlertTriangle size={13} /> Geofence Enforcement Paused
                  </>
                )}
              </span>
              <span className="muted" style={{ fontSize: '11px' }}>
                (💡 Drag the campus pin or click map to reposition center)
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Form Card for Selected Campus */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
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

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="radiusInput"
                  style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}
                >
                  Geofence Radius (meters)
                </label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-700)' }}>
                  {radiusM} meters
                </span>
              </div>
              
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '10px',
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
                        padding: '6px 10px',
                        fontSize: '11.5px',
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
                Perimeter circle expands in real-time on the map above. Standard campus setting is ~500m.
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
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--ink)',
                  }}
                >
                  Enforce Geofence on this Campus
                </div>
                <div className="muted" style={{ fontSize: '11.5px' }}>
                  When active, COS daily accomplishment reports within this boundary are automatically validated.
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
                marginTop: 'auto',
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

      {/* Geofence Activity Performance Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            Total Monitored DAR Pings
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--ink-900)' }}>
            {totalLogsCount} Submissions
          </div>
          <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
            Across all authorized campus sites
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            Geofence Compliance Rate
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#15803d' }}>
            {complianceRate}%
          </div>
          <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
            {verifiedCount} of {totalLogsCount} confirmed on-site
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            Average Distance to Center
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-700)' }}>
            ~{avgDistance}m
          </div>
          <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
            Well within 500m safe perimeter
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            Active Enforcement Sites
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--ink-900)' }}>
            {campuses.filter((c) => c.enforceGeofence !== false).length} of {campuses.length} Campuses
          </div>
          <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
            Dual-campus automated verification
          </div>
        </div>
      </div>

      {/* Upgraded Recent Geofence Verification Activity Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Controls Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="var(--brand-700)" />
              Recent DAR GPS Perimeter Verifications (Live Log)
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
              Real-time audit log of Daily Accomplishment Reports submitted with GPS telemetry. Click <b>Locate</b> to highlight any submission on the GIS map.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search employee or dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  fontSize: '12.5px',
                  paddingLeft: '30px',
                  width: '200px',
                  height: '34px',
                }}
              />
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
            </div>

            {/* Campus filter dropdown */}
            <select
              className="form-control"
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              style={{ fontSize: '12.5px', width: '140px', height: '34px', padding: '4px 8px' }}
            >
              <option value="All">All Campuses</option>
              <option value="Main">Main Campus</option>
              <option value="Luna">Luna Campus</option>
            </select>

            {/* Status filter dropdown */}
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '12.5px', width: '130px', height: '34px', padding: '4px 8px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="Flagged">Flagged / Out of Bounds</option>
            </select>

            {/* Live refresh button */}
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleRefreshVerifications}
              disabled={isLoadingVerifications}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                height: '34px',
                padding: '0 12px',
                cursor: isLoadingVerifications ? 'not-allowed' : 'pointer',
              }}
              title="Refresh live verification logs from server"
            >
              <RefreshCw size={13} className={isLoadingVerifications ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Department</th>
                <th>Campus Site</th>
                <th>Submission Time</th>
                <th>GPS Telemetry</th>
                <th>Proximity to Centroid</th>
                <th>Validation Status</th>
                <th style={{ textAlign: 'center' }}>Map Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No geofence verification submissions matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCurrentLocate = activeLocatePing === log.id;
                  return (
                    <tr
                      key={log.id}
                      style={{
                        backgroundColor: isCurrentLocate ? '#eff6ff' : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--brand-700)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {log.name
                              ? log.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                              : 'U'}
                          </div>
                          <div>
                            <b style={{ color: 'var(--ink-900)' }}>{log.name}</b>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
                        {log.department}
                      </td>
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
                      <td style={{ fontSize: '12.5px', color: 'var(--ink-700)', whiteSpace: 'nowrap' }}>
                        {log.time}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            backgroundColor: '#f1f5f9',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            color: '#0f172a',
                            display: 'inline-block',
                          }}
                        >
                          {log.coordinates}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--ink-800)', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600 }}>{log.distance}</span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '11.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: log.isValid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: log.isValid ? '#15803d' : '#b91c1c',
                            fontWeight: 700,
                          }}
                        >
                          {log.isValid ? <Check size={12} /> : <AlertTriangle size={12} />}
                          {log.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleLocateOnMap(log)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isCurrentLocate ? 'var(--brand-700)' : '#ffffff',
                            color: isCurrentLocate ? '#ffffff' : 'var(--brand-700)',
                            border: '1px solid var(--brand-700)',
                            fontWeight: 600,
                          }}
                          title="Fly map to employee's GPS coordinates"
                        >
                          <MapPin size={12} />
                          <span>{isCurrentLocate ? 'Focused' : 'Locate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                <Plus size={18} style={{ color: 'var(--brand-700)' }} />
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
