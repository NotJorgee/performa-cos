import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  AlertTriangle,
  Camera,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  verifyCoordinatesAgainstCampuses,
  saveCampusGeofences,
  getCampusGeofences,
  DEFAULT_MAIN_POLYGON,
} from '../../utils/campusGeofence';
import { applyStyle2GeotagWatermark } from '../../utils/geotagWatermark';
import { api } from '../../services/api';
import Toast from '../common/Toast';

export default function DailyReporting({
  onBack = null,
  onSubmitDar = () => {},
  currentUser = null,
}) {
  const [campuses, setCampuses] = useState(() => getCampusGeofences());
  const [jobDescription, setJobDescription] = useState('');
  const [workAccomplished, setWorkAccomplished] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoHash, setPhotoHash] = useState(null);
  const [geotagMeta, setGeotagMeta] = useState(null);
  const [isGeotagging, setIsGeotagging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const fileInputRef = useRef(null);

  // Active user details for tamper-proof watermark stamp
  const activeUser = currentUser || (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })() || {
    fullName: 'Jorge Mikhael Gubantes',
    role: 'COS Employee',
    department: 'Computer Studies Department',
  };

  // Sync active campus geofences from backend database on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchCampuses() {
      try {
        if (api?.geofences?.list) {
          const remoteCampuses = await api.geofences.list();
          if (isMounted && Array.isArray(remoteCampuses) && remoteCampuses.length > 0) {
            const normalized = remoteCampuses.map((c) => ({
              ...c,
              shortName: c.short_name || c.shortName || c.name,
              locationNote: c.location_note || c.locationNote || '',
              radiusM: Number(c.radius_meters || c.radiusM || 500),
              boundaryType: c.boundary_type || c.boundaryType || 'radius',
              polygonCoords: c.polygon_coords || c.polygonCoords || c.polygon || DEFAULT_MAIN_POLYGON,
              polygon: c.polygon_coords || c.polygonCoords || c.polygon || DEFAULT_MAIN_POLYGON,
              enforceGeofence: c.enforce_geofence !== undefined ? c.enforce_geofence : true,
              isPrimary: !!c.is_primary,
            }));
            setCampuses(normalized);
            saveCampusGeofences(normalized);
          }
        }
      } catch (err) {
        console.warn('Could not sync latest geofence sites from backend:', err.message);
      }
    }
    fetchCampuses();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Resilient GPS coordinate retriever.
   * Tries high-accuracy GPS first (up to 7s), then falls back to standard Wi-Fi / cell triangulation.
   */
  const getCoordinatesWithFallback = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({ error: 'Geolocation is not supported by your device.' });
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ coords: pos.coords }),
        (firstErr) => {
          // Fallback to low-accuracy / Wi-Fi triangulation for indoor mobile reception
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ coords: pos.coords }),
            (secondErr) => resolve({ error: secondErr.message || firstErr.message }),
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
          );
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
      );
    });
  };

  /**
   * Photo capture / selection handler with real-time GPS Geotag Watermarking
   * and SHA-256 fingerprinting for duplicate detection.
   */
  const handlePhotoSelect = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Reset file input value so selecting the same photo or clicking retake always triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setGeoError(null);
    setIsGeotagging(true);

    // 1. Immediately display instant local preview so the user sees the photo right away
    const localUrl = URL.createObjectURL(rawFile);
    setPhotoPreview(localUrl);
    setPhotoFile(rawFile);

    try {
      // 2. Obtain GPS coordinates with indoor fallback
      const gpsResult = await getCoordinatesWithFallback();

      let latitude = 11.0065;
      let longitude = 124.6075;
      let accuracy = null;
      let isGpsAvailable = false;

      if (gpsResult.coords) {
        latitude = gpsResult.coords.latitude;
        longitude = gpsResult.coords.longitude;
        accuracy = gpsResult.coords.accuracy;
        isGpsAvailable = true;
      }

      // 3. Verify location against campus geofence perimeters
      const verification = isGpsAvailable
        ? verifyCoordinatesAgainstCampuses(latitude, longitude, campuses)
        : { isValid: false, verifiedCampus: null, nearestCampus: null, nearestDistanceM: 0 };

      const campusLabel = verification.verifiedCampus
        ? verification.verifiedCampus.name
        : verification.nearestCampus
        ? verification.nearestCampus.name
        : 'EVSU Ormoc — Main Campus';

      // 4. Burn Style 2 Glassmorphism Corner Badge onto the image
      const watermarked = await applyStyle2GeotagWatermark(rawFile, {
        campusName: campusLabel,
        latitude,
        longitude,
        accuracyM: accuracy,
        employeeName: activeUser.fullName || activeUser.full_name || 'COS Personnel',
        employeeRole: activeUser.role || 'COS Employee',
        timestamp: new Date(),
        isVerified: verification.isValid,
      });

      // Update state with watermarked image and verification metadata
      setPhotoFile(watermarked.watermarkedFile);
      setPhotoPreview(watermarked.watermarkedUrl);
      setPhotoHash(watermarked.photoHash);
      setGeotagMeta({
        campusName: campusLabel,
        latitude,
        longitude,
        accuracy,
        hash: watermarked.photoHash,
        isGeofenceValid: verification.isValid,
        nearestDistanceM: verification.nearestDistanceM || 0,
        nearestCampus: verification.nearestCampus,
        isGpsAvailable,
      });

      if (!isGpsAvailable) {
        setGeoError('GPS permission was not granted or signal timed out. Photo captured with unverified coordinates.');
      } else if (!verification.isValid) {
        const nearestKm = ((verification.nearestDistanceM || 0) / 1000).toFixed(1);
        const nearestName = verification.nearestCampus?.shortName || 'campus';
        setGeoError(
          `Out of Campus Bounds: You are ~${nearestKm} km from ${nearestName}. Your photo and geotag badge have been stamped. Submission will be marked as "Pending Geofence Verification".`
        );
      }
    } catch (stampErr) {
      console.error('Failed to process photo geotag:', stampErr);
      setGeoError('Error stamping geotag onto photo: ' + stampErr.message);
    } finally {
      setIsGeotagging(false);
    }
  };

  /**
   * Final DAR Submission Handler
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setGeoError(null);

    if (!photoFile || !photoPreview) {
      setGeoError('Live photo evidence is strictly required for daily task logging.');
      return;
    }

    if (!geotagMeta) {
      setGeoError('Geotag verification metadata is missing. Please capture or retake a photo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { latitude, longitude, campusName, hash, isGeofenceValid } = geotagMeta;

      // 1. Upload the watermarked photo file to Supabase storage
      let uploadedPhotoUrl = photoPreview;
      try {
        const uploadRes = await api.uploads.uploadDarPhoto(photoFile);
        if (uploadRes && uploadRes.url) {
          uploadedPhotoUrl = uploadRes.url;
        }
      } catch (upErr) {
        console.warn('Storage upload warning:', upErr);
      }

      // 2. Submit DAR with coordinates and SHA-256 photo hash (duplicate detection)
      await api.dar.submit({
        latitude,
        longitude,
        job_description: jobDescription,
        work_accomplished: workAccomplished,
        quantity,
        remarks,
        photo_evidence_url: uploadedPhotoUrl,
        photo_hash: hash,
      });

      const newEntry = {
        dateSubmitted: new Date().toLocaleString(),
        jobDescription,
        workAccomplished,
        quantity,
        remarks,
        photoEvidenceUrl: uploadedPhotoUrl,
        photoHash: hash,
        isGeofenceValid: !!isGeofenceValid,
        campusSite: campusName,
        coordinates: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
      };

      onSubmitDar(newEntry);
      setIsSubmitting(false);
      setJobDescription('');
      setWorkAccomplished('');
      setQuantity('');
      setRemarks('');
      setPhotoPreview(null);
      setPhotoFile(null);
      setPhotoHash(null);
      setGeotagMeta(null);

      const statusNote = isGeofenceValid
        ? `verified at ${campusName}`
        : 'submitted as Pending Geofence Verification';
      setSuccessToast(
        `Daily Accomplishment Report ${statusNote} with tamper-proof geotag and submitted successfully!`
      );
      setTimeout(() => setSuccessToast(null), 4500);
    } catch (err) {
      setIsSubmitting(false);
      const msg = err.message || 'Failed to submit report. Please try again.';
      setGeoError(msg);
    }
  };

  return (
    <div>
      {/* Module Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Daily Accomplishment Reporting</h1>
          <p className="muted" style={{ margin: 0 }}>
            Submit your end-of-shift task log with geotagged photo evidence and verified EVSU-Ormoc campus coordinates.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        )}
      </div>

      <Toast message={successToast} onClose={() => setSuccessToast(null)} />

      {geoError && (
        <div
          className="flash flash-danger"
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '13px', lineHeight: 1.45 }}>{geoError}</div>
        </div>
      )}

      {/* DAR SUBMISSION FORM CARD */}
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            New Daily Accomplishment Entry
          </div>

          <form onSubmit={handleFormSubmit} autoComplete="off">
            <div className="form-group">
              <label>Submission Date &amp; Time (Locked)</label>
              <input
                className="form-control"
                type="text"
                disabled
                value={new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="jobDescInput">
                Job Description <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <input
                id="jobDescInput"
                name="job_description_input"
                className="form-control"
                type="text"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="e.g. Conducted computer laboratory maintenance and hardware diagnostics..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="workAccomplished">
                Specific Work Accomplished <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <textarea
                id="workAccomplished"
                name="work_accomplished_input"
                className="form-control"
                rows="4"
                required
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Detail the work outputs, procedures executed, or targets completed..."
                value={workAccomplished}
                onChange={(e) => setWorkAccomplished(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantityField">Quantity / Output Units</label>
                <input
                  id="quantityField"
                  name="quantity_input"
                  className="form-control"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="e.g. 24 units, 15 files, 3 sections"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="remarksField">Remarks</label>
                <input
                  id="remarksField"
                  name="remarks_input"
                  className="form-control"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Optional notes or operational observations"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Hidden native camera/file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isGeotagging}
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />

            {/* Photo Evidence with Interactive Viewfinder Dropzone & Style 2 Geotagging */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                Live Photo Evidence <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <p className="muted" style={{ fontSize: '12px', marginTop: 0, marginBottom: '12px' }}>
                Capture live photo evidence of your completed task. Physical presence within campus grounds will be verified and stamped with an official Style 2 geotag badge.
              </p>

              {/* Viewfinder Field: State 1 (No photo yet) vs State 2 (Photo captured & displayed) */}
              {!photoPreview ? (
                <div
                  onClick={() => !isGeotagging && fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--ink-300, #cbd5e1)',
                    borderRadius: '12px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    backgroundColor: 'var(--brand-50, #fbeaee)',
                    cursor: isGeotagging ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-600, #7a1128)';
                    e.currentTarget.style.backgroundColor = '#fae4e9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink-300, #cbd5e1)';
                    e.currentTarget.style.backgroundColor = 'var(--brand-50, #fbeaee)';
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(122, 17, 40, 0.12)',
                      color: 'var(--brand-600, #7a1128)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <Camera size={30} />
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '15.5px',
                      color: 'var(--ink-900, #10192b)',
                      marginBottom: '4px',
                    }}
                  >
                    Press here to capture live photo
                  </div>
                  <div className="muted" style={{ fontSize: '12.5px', maxWidth: '380px', lineHeight: 1.45 }}>
                    Tap to open your phone camera. Automatically records GPS coordinates, timestamp, and applies tamper-proof anti-spoofing watermark.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid var(--line, #e6eaf0)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#0f172a',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    position: 'relative',
                  }}
                >
                  {/* Photo Display Viewport */}
                  <div
                    style={{
                      position: 'relative',
                      textAlign: 'center',
                      minHeight: '240px',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Captured DAR Evidence"
                      style={{
                        maxHeight: '380px',
                        width: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />

                    {/* Geotag Processing Overlay */}
                    {isGeotagging && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          gap: '10px',
                          padding: '20px',
                          zIndex: 5,
                        }}
                      >
                        <RefreshCw size={30} className="spin" style={{ color: '#38bdf8' }} />
                        <span style={{ fontWeight: 700, fontSize: '14.5px' }}>
                          Reading GPS &amp; Stamping Style 2 Geotag...
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Please keep your browser active
                        </span>
                      </div>
                    )}

                    {/* Floating Retake Photo Button */}
                    {!isGeotagging && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          zIndex: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(15, 23, 42, 0.88)',
                          color: '#ffffff',
                          backdropFilter: 'blur(6px)',
                          WebkitBackdropFilter: 'blur(6px)',
                          border: '1px solid rgba(255, 255, 255, 0.35)',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.98)';
                          e.currentTarget.style.borderColor = '#38bdf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.88)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Retake Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Geotag & Metadata Footer Bar */}
                  <div
                    style={{
                      backgroundColor: 'var(--surface-50, #f8fafc)',
                      padding: '12px 16px',
                      borderTop: '1px solid var(--line, #e6eaf0)',
                      fontSize: '12px',
                      color: 'var(--ink-700, #33415c)',
                    }}
                  >
                    {geotagMeta ? (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          {geotagMeta.isGeofenceValid ? (
                            <span
                              className="badge badge-completed"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '4px 10px',
                              }}
                            >
                              <ShieldCheck size={14} /> Verified On-Campus ({geotagMeta.campusName})
                            </span>
                          ) : (
                            <span
                              className="badge badge-warning"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                padding: '4px 10px',
                              }}
                            >
                              <AlertTriangle size={14} /> Out of Bounds (~
                              {((geotagMeta.nearestDistanceM || 0) / 1000).toFixed(1)} km from campus)
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              fontSize: '12px',
                            }}
                          >
                            <RotateCcw size={12} /> Retake
                          </button>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '6px',
                            fontSize: '11.5px',
                            color: 'var(--ink-600, #475569)',
                          }}
                        >
                          <div>
                            <strong>Coordinates:</strong> {geotagMeta.latitude?.toFixed(5)}° N,{' '}
                            {geotagMeta.longitude?.toFixed(5)}° E
                          </div>
                          <div>
                            <strong>Accuracy:</strong>{' '}
                            {geotagMeta.accuracy ? `±${Math.round(geotagMeta.accuracy)}m` : 'Standard'}
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <strong>Fingerprint (SHA-256):</strong>{' '}
                            <code style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 5px', borderRadius: '4px' }}>
                              {geotagMeta.hash}
                            </code>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="muted" style={{ fontSize: '12px' }}>
                        Photo evidence captured. Stamping Style 2 corner badge and calculating anti-spoofing fingerprint...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting || isGeotagging || !photoPreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '20px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              {isSubmitting ? (
                <>
                  <MapPin size={16} /> Submitting Verified Accomplishment Report...
                </>
              ) : (
                'Submit DAR'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
