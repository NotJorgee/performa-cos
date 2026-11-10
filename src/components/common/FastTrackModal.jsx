import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import PredictiveTextarea from './PredictiveTextarea';

export const NON_RENEWAL_GROUNDS = [
  'Gross Incompetence / Poor Performance',
  'Non-Fulfillment of Contracted Deliverables / Abandonment of Duties',
  'Insubordination / Attitude Issue',
  'Skills Mismatch',
  'Breach of Code of Conduct',
  'Other Substantive Institutional Grounds',
];

export default function FastTrackModal({
  isOpen,
  employeeName,
  employee = null,
  onClose,
  onSubmitRejection,
  title = 'Recommend Non-Renewal',
  submitButtonText = 'Submit Non-Renewal Recommendation',
}) {
  const [category, setCategory] = useState(NON_RENEWAL_GROUNDS[0]);
  const [justification, setJustification] = useState('');
  const [memoFile, setMemoFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!justification.trim()) {
      setErrorMsg('Please provide a substantive text justification for the non-renewal decision.');
      return;
    }
    setErrorMsg('');
    onSubmitRejection({
      category,
      justification: justification.trim(),
      file: memoFile,
      timestamp: new Date().toLocaleString(),
    });
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div className="card-title" style={{ margin: 0, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--red-600)" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5 }}>
          Submitting a non-renewal recommendation for <b>{employeeName}</b> will mark their renewal intent as <b>"Not Recommended"</b>. This formal documentation will be routed directly to the HRMO for administrative review and mediation.
        </p>

        {errorMsg && (
          <div className="flash flash-danger" style={{ marginBottom: '14px', fontSize: '13px', padding: '8px 12px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rejectionCategory">
              Institutional Non-Renewal Grounds <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <select
              id="rejectionCategory"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {NON_RENEWAL_GROUNDS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="justificationText">
              Substantive Supervisory Justification <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <PredictiveTextarea
              id="justificationText"
              rows={4}
              required
              placeholder="State the specific performance deficiencies, incident records, or institutional justifications..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              contextType="fast_track"
              fieldName={`justification (${category})`}
              role={employee?.role || employee?.jobTitle || employee?.job_title || 'COS Personnel'}
              department={typeof employee?.department === 'object' ? (employee?.department?.name || 'Academic Affairs') : (employee?.department || 'Academic Affairs')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="memoAttachment">
              Formal Supervisory Memo / Documentation <span className="muted" style={{ fontWeight: 'normal' }}>(Optional)</span>
            </label>
            <input
              id="memoAttachment"
              type="file"
              accept=".pdf,.docx,.doc"
              className="form-control"
              onChange={(e) => setMemoFile(e.target.files[0] || null)}
            />
            <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
              Attach signed supervisory endorsement, notice to explain, or incident documentation.
            </small>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)', fontWeight: 600 }}
            >
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
