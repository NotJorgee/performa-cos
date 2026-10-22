import React, { useState } from 'react';

const AUTOCOMPLETE_SUGGESTIONS = [
  'Assisted students with enrollment queries and clearance routing',
  'Organized departmental filing system and digitized physical records',
  'Conducted computer laboratory hardware inspection and terminal check',
  'Diagnosed and resolved network connectivity issues on lab PCs',
  'Prepared conference room and multimedia equipment for academic meeting',
  'Dispatched official communications to university offices and college deans',
  'Sanitized and disinfected classrooms and departmental common areas',
  'Inspected physical plant facilities and reported maintenance repair tickets',
];

export default function DailyReporting({
  onBack = null,
  onSubmitDar = () => {},
}) {
  const [jobDescription, setJobDescription] = useState('');
  const [workAccomplished, setWorkAccomplished] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Predictive text autocomplete for Job Description (FR-06)
  const filteredSuggestions = AUTOCOMPLETE_SUGGESTIONS.filter(
    (item) => jobDescription && item.toLowerCase().includes(jobDescription.toLowerCase()) && item !== jobDescription
  );

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setGeoError(null);
    setIsSubmitting(true);

    if (!photoPreview) {
      setGeoError('Live photo evidence is strictly required for daily task logging (FR-28).');
      setIsSubmitting(false);
      return;
    }

    // HTML5 Geolocation API validation (UC-13, FR-29, FR-30)
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your device or browser.');
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // EVSU-Ormoc campus center: ~11.0065° N, 124.6075° E (~500m geofence radius)
        const evsuLat = 11.0065;
        const evsuLng = 124.6075;
        const distanceM = Math.hypot(
          (latitude - evsuLat) * 111000,
          (longitude - evsuLng) * 111000 * Math.cos((evsuLat * Math.PI) / 180)
        );

        const isInsideCampus = distanceM <= 500;

        if (!isInsideCampus) {
          // Alternative flow 8a
          setGeoError('Out of Bounds: Submissions must be made within EVSU campus premises (UC-13, FR-30).');
          setIsSubmitting(false);
          return;
        }

        const newEntry = {
          dateSubmitted: new Date().toLocaleString(),
          jobDescription,
          workAccomplished,
          quantity,
          remarks,
          photoEvidenceUrl: photoPreview,
          isGeofenceValid: true,
          coordinates: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
        };

        onSubmitDar(newEntry);
        setIsSubmitting(false);
        setJobDescription('');
        setWorkAccomplished('');
        setQuantity('');
        setRemarks('');
        setPhotoPreview(null);
        setSuccessToast('Daily Accomplishment Report verified on-campus and submitted successfully!');
        setTimeout(() => setSuccessToast(null), 4000);
      },
      (err) => {
        setIsSubmitting(false);
        setGeoError(`Location access error: ${err.message}. Please enable GPS on your device.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      {/* Module Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Daily Accomplishment Reporting (UC-13)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Submit your end-of-shift task log with geotagged photo evidence and verified EVSU-Ormoc campus coordinates.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {successToast && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {successToast}
        </div>
      )}

      {geoError && (
        <div className="flash flash-danger" style={{ marginBottom: '16px' }}>
          ⚠️ {geoError}
        </div>
      )}

      {/* DAR SUBMISSION FORM CARD */}
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            New Daily Accomplishment Entry
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label>Submission Date &amp; Time (Locked)</label>
              <input
                className="form-control"
                type="text"
                disabled
                value={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              />
            </div>

            {/* Predictive Text Autocomplete for Job Description (FR-06) */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="jobDescInput">
                Job Description <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <input
                id="jobDescInput"
                className="form-control"
                type="text"
                required
                placeholder="e.g. Conducted computer laboratory maintenance..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              {filteredSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    boxShadow: 'var(--shadow)',
                    zIndex: 20,
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {filteredSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      style={{ padding: '8px 12px', fontSize: '12.5px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                      onClick={() => setJobDescription(s)}
                    >
                      💡 {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="workAccomplished">
                Specific Work Accomplished <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <textarea
                id="workAccomplished"
                className="form-control"
                rows="4"
                required
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
                  className="form-control"
                  type="text"
                  placeholder="e.g. 24 units, 15 files"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="remarksField">Remarks</label>
                <input
                  id="remarksField"
                  className="form-control"
                  type="text"
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
                <label className="btn btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  📷 Insert Image / Open Camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                  />
                </label>
                {photoPreview && (
                  <span className="badge badge-completed">✓ Photo Attached</span>
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
            >
              {isSubmitting ? '📍 Capturing GPS & Validating Geofence...' : 'Submit Geofenced DAR (UC-13)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
