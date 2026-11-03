import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, Camera, MapPin, ArrowLeft } from 'lucide-react';
import {
  verifyCoordinatesAgainstCampuses,
  saveCampusGeofences,
  getCampusGeofences,
  DEFAULT_MAIN_POLYGON,
} from '../../utils/campusGeofence';
import { api } from '../../services/api';

export default function DailyReporting({
  onBack = null,
  onSubmitDar = () => {},
}) {
  const [campuses, setCampuses] = useState(() => getCampusGeofences());
  const [jobDescription, setJobDescription] = useState('');
  const [workAccomplished, setWorkAccomplished] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

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

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setGeoError(null);
    setIsSubmitting(true);

    if (!photoPreview) {
      setGeoError('Live photo evidence is strictly required for daily task logging.');
      setIsSubmitting(false);
      return;
    }

    // HTML5 Geolocation API validation
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your device or browser.');
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Multi-Campus Geofence verification against dynamic campuses list
        const verification = verifyCoordinatesAgainstCampuses(latitude, longitude, campuses);

        if (!verification.isValid) {
          const activeList = (campuses && campuses.length > 0 ? campuses : getCampusGeofences()).filter(
            (c) => c.enforceGeofence !== false
          );
          const siteNames = activeList.map((c) => c.shortName || c.name).join(', ') || 'authorized campus sites';
          const nearestKm = (verification.nearestDistanceM / 1000).toFixed(1);
          const nearestName = verification.nearestCampus
            ? verification.nearestCampus.shortName || verification.nearestCampus.name
            : 'campus';
          setGeoError(
            `Out of Bounds: Daily Accomplishment Reports must be submitted while physically present at an authorized campus site (${siteNames}). (Nearest: ${nearestName} is ~${nearestKm} km away).`
          );
          setIsSubmitting(false);
          return;
        }

        const campusLabel = verification.verifiedCampus
          ? verification.verifiedCampus.name
          : 'EVSU Ormoc Campus';

        let uploadedPhotoUrl = photoPreview;
        if (photoFile) {
          try {
            const uploadRes = await api.uploads.uploadDarPhoto(photoFile);
            if (uploadRes && uploadRes.url) {
              uploadedPhotoUrl = uploadRes.url;
            }
          } catch (upErr) {
            console.warn('Storage upload warning:', upErr);
          }
        }

        try {
          await api.dar.submit({
            latitude,
            longitude,
            job_description: jobDescription,
            work_accomplished: workAccomplished,
            quantity,
            remarks,
            photo_evidence_url: uploadedPhotoUrl,
          });
        } catch (apiErr) {
          console.warn('API DAR submit warning:', apiErr);
        }

        const newEntry = {
          dateSubmitted: new Date().toLocaleString(),
          jobDescription,
          workAccomplished,
          quantity,
          remarks,
          photoEvidenceUrl: uploadedPhotoUrl,
          isGeofenceValid: true,
          campusSite: campusLabel,
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
        setSuccessToast(
          `Daily Accomplishment Report verified at ${verification.verifiedCampus ? verification.verifiedCampus.shortName : 'EVSU Campus'} and submitted successfully!`
        );
        setTimeout(() => setSuccessToast(null), 4000);
      },
      (err) => {
        setIsSubmitting(false);
        setGeoError(`Location access error: ${err.message}. Please enable GPS permissions on your browser/device.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

      {successToast && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          {successToast}
        </div>
      )}

      {geoError && (
        <div className="flash flash-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          {geoError}
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
                value={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                placeholder="e.g. Conducted computer laboratory maintenance..."
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
                  placeholder="e.g. 24 units, 15 files"
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
                  placeholder="Optional notes or status"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Photo Evidence with Camera Capture (FR-28, UC-13 Step 3) */}
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Live Photo Evidence <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label className="btn btn-sm" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} />
                  <span>Insert Image / Open Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                  />
                </label>
                {photoPreview && (
                  <span className="badge badge-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Photo Attached
                  </span>
                )}
              </div>
              {photoPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={photoPreview}
                    alt="DAR Evidence"
                    style={{ maxHeight: '160px', borderRadius: '6px', border: '1px solid var(--line)' }}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <MapPin size={16} /> Capturing GPS & Validating Geofence...
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
