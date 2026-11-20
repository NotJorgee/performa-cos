import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  AlertTriangle,
  Camera,
  Image,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Info,
  ZoomIn,
  X,
  Clock,
  Calendar,
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
import PredictiveTextarea from '../common/PredictiveTextarea';
import { getCachedData, setCachedData } from '../../utils/swrCache';

export default function DailyReporting({
  onBack = null,
  onNavigate = null,
  onSubmitDar = () => {},
  currentUser = null,
}) {
  const [campuses, setCampuses] = useState(() => getCampusGeofences());
  const cacheKeyToday = 'emp_attendance_today';
  const [attendanceStatus, setAttendanceStatus] = useState(() => getCachedData(cacheKeyToday));
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(!attendanceStatus);
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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

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

  // Verify today's attendance punch status (DAR gate requirement)
  useEffect(() => {
    let isMounted = true;
    async function checkAttendanceStatus() {
      try {
        if (api?.attendance?.getTodayStatus) {
          const res = await api.attendance.getTodayStatus();
          if (isMounted) {
            setAttendanceStatus(res);
            setCachedData(cacheKeyToday, res);
          }
        }
      } catch (err) {
        console.warn('Could not verify attendance status for DAR gate:', err.message);
      } finally {
        if (isMounted) {
          setIsCheckingAttendance(false);
        }
      }
    }
    checkAttendanceStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const isOfficialBusiness = Boolean(
    attendanceStatus?.on_approved_leave &&
    (attendanceStatus?.leave_type?.toLowerCase().includes('official business') ||
     attendanceStatus?.leave_type?.toLowerCase().includes('ob'))
  );
  const hasClockedIn = Boolean(attendanceStatus?.has_timed_in);
  const canAccessDar = hasClockedIn || isOfficialBusiness;

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

    // Reset file input values so selecting the same photo or clicking retake always triggers change
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }

    setGeoError(null);
    setIsGeotagging(true);
    setIsSourcePickerOpen(false);

    // 1. Immediately display instant local preview so the user sees the photo right away
    const localUrl = URL.createObjectURL(rawFile);
    setPhotoPreview(localUrl);
    setPhotoFile(rawFile);

    try {
      // 2. Obtain GPS coordinates with indoor fallback
      const gpsResult = await getCoordinatesWithFallback();

      const primaryCampus = (campuses && campuses.find((c) => c.isPrimary || c.is_primary)) || (campuses && campuses[0]);
      let latitude = primaryCampus ? Number(primaryCampus.latitude) : 11.010466;
      let longitude = primaryCampus ? Number(primaryCampus.longitude) : 124.605469;
      let accuracy = null;
      let isGpsAvailable = false;

      if (gpsResult.coords) {
        latitude = gpsResult.coords.latitude;
        longitude = gpsResult.coords.longitude;
        accuracy = gpsResult.coords.accuracy;
        isGpsAvailable = true;
      }

      // 3. Verify location against campus geofence perimeters (with mobile accuracy buffer)
      const verification = isGpsAvailable
        ? verifyCoordinatesAgainstCampuses(latitude, longitude, campuses, accuracy)
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

  if (!isCheckingAttendance && !canAccessDar) {
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

        {/* Clock-In Required Gate Card */}
        <div style={{ maxWidth: '600px', margin: '40px auto 0' }}>
          <div className="card" style={{ padding: '36px 28px', textAlign: 'center', borderRadius: '12px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <Clock size={30} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: 'var(--ink-900, #0f172a)' }}>
              Clock-In Required
            </h2>

            <p style={{ fontSize: '14px', color: 'var(--ink-600, #475569)', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 24px' }}>
              You need to clock in first before submitting your Daily Accomplishment Report for today.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#64748b',
              }}
            >
              <Calendar size={15} />
              <span>
                Today: <strong>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </span>
              <span style={{ margin: '0 4px' }}>|</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>Not Clocked In</span>
            </div>

            <div style={{ maxWidth: '280px', margin: '0 auto' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('employee_attendance');
                  } else if (onBack) {
                    onBack();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Clock size={16} /> Go to Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <PredictiveTextarea
                id="workAccomplished"
                name="work_accomplished_input"
                rows={4}
                required
                placeholder="Detail the work outputs, procedures executed, or targets completed..."
                value={workAccomplished}
                onChange={(e) => setWorkAccomplished(e.target.value)}
                contextType="dar"
                fieldName="workAccomplished"
                role={activeUser?.job_title || 'COS Personnel'}
                department={typeof activeUser?.department === 'object' ? (activeUser?.department?.name || 'Computer Studies Department') : (activeUser?.department || 'Computer Studies Department')}
                itemContext={`Task / Job Assignment: "${jobDescription || 'General Operational Duty'}". Stated Accomplishment Context for ${typeof activeUser?.department === 'object' ? (activeUser?.department?.name || 'Academic Department') : (activeUser?.department || 'Academic Department')}. Employee: ${activeUser?.full_name || 'Personnel'} (${activeUser?.job_title || 'COS Staff'}).`}
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

            {/* Hidden native camera & gallery inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isGeotagging}
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
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
                Capture live photo evidence of your completed task. Physical presence within campus grounds will be verified and stamped with an geotag badge.
              </p>

              {/* Viewfinder Field: State 1 (No photo yet) vs State 2 (Photo captured & displayed) */}
              {!photoPreview ? (
                <div
                  style={{
                    border: '2px dashed var(--ink-300, #cbd5e1)',
                    borderRadius: '12px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    backgroundColor: 'var(--brand-50, #fbeaee)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '220px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(122, 17, 40, 0.12)',
                        color: 'var(--brand-600, #7a1128)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Camera size={26} />
                    </div>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(122, 17, 40, 0.12)',
                        color: 'var(--brand-600, #7a1128)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image size={26} />
                    </div>
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '16px',
                      color: 'var(--ink-900, #10192b)',
                      marginBottom: '4px',
                    }}
                  >
                    Attach Photo Evidence
                  </div>
                  <div className="muted" style={{ fontSize: '12.5px', maxWidth: '420px', lineHeight: 1.45, marginBottom: '18px' }}>
                    Take a live photo with your camera or select an existing photo from your gallery. Physical presence within campus grounds will be verified and stamped with an official geotag.
                  </div>

                  {/* Dual Action Buttons: Camera vs Gallery */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      disabled={isGeotagging}
                      onClick={() => !isGeotagging && cameraInputRef.current?.click()}
                      className="btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: 'var(--brand-700, #7a1128)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isGeotagging ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 6px rgba(122, 17, 40, 0.25)',
                      }}
                    >
                      <Camera size={16} /> Take Photo (Camera)
                    </button>

                    <button
                      type="button"
                      disabled={isGeotagging}
                      onClick={() => !isGeotagging && galleryInputRef.current?.click()}
                      className="btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        color: 'var(--ink-800, #1e293b)',
                        border: '1px solid var(--line, #cbd5e1)',
                        borderRadius: '8px',
                        cursor: isGeotagging ? 'not-allowed' : 'pointer',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <Image size={16} /> Choose from Gallery
                    </button>
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
                  {/* Photo Display Viewport (Clickable to inspect clarity) */}
                  <div
                    onClick={() => !isGeotagging && setIsPreviewModalOpen(true)}
                    style={{
                      position: 'relative',
                      textAlign: 'center',
                      minHeight: '240px',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isGeotagging ? 'default' : 'pointer',
                    }}
                    title="Click or tap to inspect photo clarity"
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
                          Reading GPS &amp; Stamping Geotag...
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Please keep your browser active
                        </span>
                      </div>
                    )}

                    {/* Inspection Hint Pill */}
                    {!isGeotagging && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'rgba(15, 23, 42, 0.82)',
                          color: '#ffffff',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          pointerEvents: 'none',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                        }}
                      >
                        <ZoomIn size={13} /> Tap photo to inspect
                      </div>
                    )}

                    {/* Floating Retake Photo Button */}
                    {!isGeotagging && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSourcePickerOpen(true);
                        }}
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

                  {/* Geotag Verification Status Bar (Security-Hardened: Coordinates, Accuracy & Fingerprint Omitted) */}
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
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
                              padding: '5px 12px',
                              fontWeight: 700,
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
                              padding: '5px 12px',
                              fontWeight: 700,
                            }}
                          >
                            <AlertTriangle size={14} /> Out of Bounds (~
                            {((geotagMeta.nearestDistanceM || 0) / 1000).toFixed(1)} km from campus)
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsSourcePickerOpen(true)}
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
                    ) : (
                      <div className="muted" style={{ fontSize: '12px' }}>
                        Photo evidence captured. Verifying campus geofence and stamping geotag badge...
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

      {/* Photo Evidence Fullscreen Lightbox / Inspector Modal */}
      {isPreviewModalOpen && photoPreview && (
      <div
        onClick={() => setIsPreviewModalOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          cursor: 'zoom-out',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '960px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            color: '#ffffff',
            cursor: 'default',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} color="#38bdf8" />
            <span style={{ fontSize: '14.5px', fontWeight: 700 }}>Inspect Photo Evidence</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            title="Close Preview"
          >
            <X size={20} />
          </button>
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '960px',
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75)',
            backgroundColor: '#000000',
            cursor: 'default',
          }}
        >
          <img
            src={photoPreview}
            alt="Live DAR Evidence Inspection"
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 140px)',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
          Tap anywhere outside or press the close button to return
        </div>
      </div>
    )}

      {/* Photo Source Modal: Strictly Camera or Gallery */}
      {isSourcePickerOpen && (
        <div
          className="modal-overlay open"
          style={{ zIndex: 1200 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSourcePickerOpen(false);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '400px', width: '92%', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--ink-900)' }}>
                Select Photo Source
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsSourcePickerOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="muted" style={{ fontSize: '12.5px', margin: '0 0 18px 0', lineHeight: 1.45 }}>
              Choose whether to take a live photo or select an existing photo from your gallery:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsSourcePickerOpen(false);
                  cameraInputRef.current?.click();
                }}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-50, #fbeaee)',
                  border: '1.5px solid var(--brand-200, #f8ccd5)',
                  color: 'var(--brand-800, #5c0d1e)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-700, #7a1128)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Camera size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Take Live Photo</div>
                  <div className="muted" style={{ fontSize: '11.5px', marginTop: '2px' }}>
                    Opens device camera app
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSourcePickerOpen(false);
                  galleryInputRef.current?.click();
                }}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid var(--line, #e2e8f0)',
                  color: 'var(--ink-800, #1e293b)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    color: 'var(--ink-700, #334155)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Image size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Choose from Gallery</div>
                  <div className="muted" style={{ fontSize: '11.5px', marginTop: '2px' }}>
                    Select existing photo from phone gallery
                  </div>
                </div>
              </button>
            </div>

            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsSourcePickerOpen(false)}
                className="btn btn-sm btn-outline"
                style={{ padding: '7px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
