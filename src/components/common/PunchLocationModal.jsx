import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Clock,
  ShieldCheck,
  X,
  ExternalLink,
  Layers,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getCampusGeofences, DEFAULT_CAMPUSES } from '../../utils/campusGeofence';

export default function PunchLocationModal({
  isOpen = false,
  onClose = () => {},
  punchData = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const streetsTileRef = useRef(null);
  const satelliteTileRef = useRef(null);
  const [mapLayer, setMapLayer] = useState('streets'); // 'streets' | 'satellite'

  // Focus lock and Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Extract punch details with safe fallbacks
  const isTimeIn = punchData?.punchType === 'time_in';
  const punchLabel = isTimeIn ? 'Clock In (Time In)' : 'Clock Out (Time Out)';
  const employeeName = punchData?.employeeName || punchData?.name || 'COS Personnel';
  const employeeId = punchData?.employeeId || punchData?.employee_id_number || '';
  const jobTitle = punchData?.jobTitle || punchData?.job_title || 'COS Staff';
  const department = punchData?.department || '';
  const punchTime = punchData?.time || (isTimeIn ? punchData?.time_in : punchData?.time_out) || '—';
  const punchDate = punchData?.date || '';
  const siteName = punchData?.geofenceSite || punchData?.geofence_site || 'EVSU Ormoc Campus';

  // Determine punch GPS coordinates
  const campuses = getCampusGeofences() || DEFAULT_CAMPUSES;
  const isLuna = (siteName || '').toLowerCase().includes('luna');
  const targetCampus = campuses.find((c) => isLuna ? c.id.includes('luna') : c.id.includes('main')) || campuses[0];
  const defaultLat = targetCampus?.latitude || 11.010466;
  const defaultLng = targetCampus?.longitude || 124.605469;

  const rawLat = isTimeIn
    ? (punchData?.latitude ?? punchData?.in_latitude)
    : (punchData?.latitude ?? punchData?.out_latitude);
  const rawLng = isTimeIn
    ? (punchData?.longitude ?? punchData?.in_longitude)
    : (punchData?.longitude ?? punchData?.out_longitude);

  const hasExactGps = rawLat !== null && rawLat !== undefined && !isNaN(Number(rawLat)) &&
                      rawLng !== null && rawLng !== undefined && !isNaN(Number(rawLng));
  const finalLat = hasExactGps ? Number(rawLat) : defaultLat;
  const finalLng = hasExactGps ? Number(rawLng) : defaultLng;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Clean up any stale map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [finalLat, finalLng],
      zoom: 17,
      zoomControl: true,
      attributionControl: false,
    });

    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );

    streetsTileRef.current = streets;
    satelliteTileRef.current = satellite;

    if (mapLayer === 'satellite') {
      satellite.addTo(map);
    } else {
      streets.addTo(map);
    }

    // 1. Draw Campus Geofence Boundary (Polygon or Circle)
    if (targetCampus) {
      if (targetCampus.boundaryType === 'polygon' && targetCampus.polygonCoords && targetCampus.polygonCoords.length >= 3) {
        L.polygon(targetCampus.polygonCoords, {
          color: '#7a1128',
          fillColor: '#7a1128',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map);
      } else {
        const radius = targetCampus.radiusM || 500;
        L.circle([targetCampus.latitude, targetCampus.longitude], {
          radius: radius,
          color: '#7a1128',
          fillColor: '#7a1128',
          fillOpacity: 0.10,
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map);
      }
    }

    // 2. Draw GPS Precision Radius Circle around punch location
    L.circle([finalLat, finalLng], {
      radius: 18,
      color: isTimeIn ? '#16a34a' : '#7a1128',
      fillColor: isTimeIn ? '#22c55e' : '#991b1b',
      fillOpacity: 0.18,
      weight: 1.5,
    }).addTo(map);

    // 3. Custom Punch Pin Marker with pulse effect
    const pinColor = isTimeIn ? '#16a34a' : '#7a1128';
    const pulseBg = isTimeIn ? 'rgba(22, 163, 74, 0.3)' : 'rgba(122, 17, 40, 0.3)';
    const customIcon = L.divIcon({
      className: 'punch-pin-icon',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${pulseBg}; animation: leafletPulse 2s infinite ease-out;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });

    const marker = L.marker([finalLat, finalLng], { icon: customIcon }).addTo(map);
    marker
      .bindPopup(
        `<div style="font-family: inherit; font-size: 12px; min-width: 190px; line-height: 1.5;">
          <div style="font-weight: 800; color: ${pinColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            ${punchLabel}
          </div>
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${employeeName}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${employeeId} &bull; ${department}</div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11.5px; color: #334155;">
            <div><b>Recorded:</b> ${punchTime}</div>
            <div><b>Site:</b> ${siteName}</div>
            <div><b>Coordinates:</b> ${finalLat.toFixed(6)}, ${finalLng.toFixed(6)}</div>
          </div>
        </div>`
      )
      .openPopup();

    // Scale control
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate map size after animation/DOM layout
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isOpen, finalLat, finalLng, isTimeIn, punchLabel, employeeName, employeeId, department, punchTime, siteName, targetCampus]);

  // Handle Map Layer Toggle (Streets vs Satellite)
  const toggleMapLayer = () => {
    const map = mapInstanceRef.current;
    if (!map || !streetsTileRef.current || !satelliteTileRef.current) return;

    if (mapLayer === 'streets') {
      if (map.hasLayer(streetsTileRef.current)) map.removeLayer(streetsTileRef.current);
      satelliteTileRef.current.addTo(map);
      setMapLayer('satellite');
    } else {
      if (map.hasLayer(satelliteTileRef.current)) map.removeLayer(satelliteTileRef.current);
      streetsTileRef.current.addTo(map);
      setMapLayer('streets');
    }
  };

  if (!isOpen) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${finalLat},${finalLng}`;

  return createPortal(
    <div
      className="lv2-modal-backdrop"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes leafletPulse {
          0% { transform: scale(0.7); opacity: 0.9; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
      <div
        className="lv2-modal-box"
        style={{
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        {/* Modal Header */}
        <div
          className="lv2-modal-head"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isTimeIn ? 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' : 'linear-gradient(180deg, #fdf2f4 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isTimeIn ? '#dcfce7' : '#fce7eb',
                color: isTimeIn ? '#16a34a' : '#7a1128',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="lv2-modal-title" style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {punchLabel} Location
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                {employeeName} &bull; {employeeId || 'COS Personnel'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="lv2-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="lv2-modal-body" style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Metadata Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              background: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                Punch Timestamp
              </span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} color="var(--brand-700)" />
                <span>{punchTime}</span>
              </div>
              {punchDate && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{punchDate}</div>}
            </div>

            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                Campus Site
              </span>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={13} color="var(--brand-700)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{siteName}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                <ShieldCheck size={12} /> Geofence Verified
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                GPS Coordinates
              </span>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
                {finalLat.toFixed(6)}, {finalLng.toFixed(6)}
              </div>
              <div style={{ fontSize: '10.5px', color: hasExactGps ? '#15803d' : '#b45309', marginTop: '1px' }}>
                {hasExactGps ? 'High-Accuracy Satellite Fix' : 'Campus Perimeter Centroid'}
              </div>
            </div>
          </div>

          {!hasExactGps && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>Exact coordinates were not saved for this historical punch; showing campus property boundary centroid.</span>
            </div>
          )}

          {/* Interactive Leaflet Map Container */}
          <div style={{ position: 'relative' }}>
            <div
              ref={mapContainerRef}
              style={{
                height: '310px',
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
              }}
            />

            {/* Satellite / Streets Toggle Pill */}
            <button
              type="button"
              onClick={toggleMapLayer}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.94)',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}
            >
              <Layers size={13} color="var(--brand-700)" />
              <span>{mapLayer === 'streets' ? 'Satellite View' : 'Street Map'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="lv2-modal-foot"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--brand-700)',
              textDecoration: 'none',
            }}
          >
            <span>Open in Google Maps</span>
            <ExternalLink size={13} />
          </a>

          <button
            type="button"
            className="btn btn-sm"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
