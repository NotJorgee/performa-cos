import React, { useState } from 'react';

const REJECTION_CATEGORIES = [
  'Habitual Absenteeism / Tardiness',
  'Gross Incompetence / Poor Performance',
  'Insubordination / Attitude Issue',
  'Skills Mismatch',
  'Breach of Code of Conduct',
  'Other Substantive Institutional Grounds',
];

export default function FastTrackModal({
  isOpen,
  employeeName,
  onClose,
  onSubmitRejection,
}) {
  const [category, setCategory] = useState(REJECTION_CATEGORIES[0]);
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
            <span>⚠️ Process Fast-Track Rejection (UC-06)</span>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px' }}>
          Issuing a Fast-Track Rejection will immediately <b>halt all pending peer and HR evaluations</b> for{' '}
          <b>{employeeName}</b>, mark the contract status as <b>"Not Recommended"</b>, and route the formal documentation to HRMO for administrative meeting action.
        </p>

        {errorMsg && (
          <div className="flash flash-danger" style={{ marginBottom: '14px', fontSize: '13px', padding: '8px 12px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rejectionCategory">
              Standardized Rejection Category <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <select
              id="rejectionCategory"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {REJECTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="justificationText">
              Substantive Justification / Grounds <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <textarea
              id="justificationText"
              className="form-control"
              rows="4"
              required
              placeholder="State the specific institutional grounds, incidents, or performance deficiencies..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="memoAttachment">
              Formal Memo / Incident Report PDF <span className="muted" style={{ fontWeight: 'normal' }}>(Optional)</span>
            </label>
            <input
              id="memoAttachment"
              type="file"
              accept=".pdf"
              className="form-control"
              onChange={(e) => setMemoFile(e.target.files[0] || null)}
            />
            <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
              Upload signed supervisory memo, notice to explain, or supporting incident evidence.
            </small>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)' }}
            >
              Authorize Fast-Track Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
