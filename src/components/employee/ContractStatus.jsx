import React, { useState } from 'react';

export default function ContractStatus({
  contract = {
    employeeName: 'Jorge Mikhael Gubantes',
    department: 'Computer Studies Department',
    cosCategory: 'Administrative',
    startDate: 'July 01, 2026',
    endDate: 'December 31, 2026',
    daysRemaining: 74,
    renewalStatus: 'Open for Intent Confirmation', // 'Open for Intent Confirmation' | 'Renewal Intent Confirmed' | 'Declined'
    totalDarsLogged: 84,
    verifiedDarCount: 84,
  },
  onConfirmRenewal = () => {},
  onDeclineRenewal = () => {},
}) {
  const [status, setStatus] = useState(contract.renewalStatus);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const handleConfirmIntent = () => {
    setIsProcessing(true);
    // Simulates aggregating all DAR entries and triggering LLM API summarization (UC-02, FR-05)
    setTimeout(() => {
      setIsProcessing(false);
      setStatus('Renewal Intent Confirmed');
      onConfirmRenewal({
        contractCycle: `${contract.startDate} – ${contract.endDate}`,
        totalDarsAggregated: contract.totalDarsLogged,
        confirmedAt: new Date().toISOString(),
      });
    }, 1200);
  };

  const handleConfirmDecline = () => {
    setStatus('Declined');
    setShowDeclineModal(false);
    onDeclineRenewal({
      reason: declineReason,
      declinedAt: new Date().toISOString(),
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px' }}>Contract Status</h1>
        <p className="muted" style={{ margin: 0 }}>
          Monitor your 6-month Contract of Service lifecycle and submit your formal digital renewal confirmation.
        </p>
      </div>

      {/* Contract Lifecycle Overview Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Contract of Service Lifecycle Details</div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '14px' }}>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>CONTRACT PERIOD</span>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
              {contract.startDate} – {contract.endDate}
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>DAYS UNTIL EXPIRATION</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--amber-600)', marginTop: '2px' }}>
              {contract.daysRemaining} Days
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>ACCUMULATED DAR LOGS</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-700)', marginTop: '2px' }}>
              {contract.totalDarsLogged} Entries
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>DEPARTMENT ASSIGNMENT</span>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
              {contract.department}
            </div>
          </div>
        </div>
      </div>

      {/* Intent Action Panel */}
      {status === 'Open for Intent Confirmation' && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--brand-border)', background: '#fff' }}>
          <div className="card-title" style={{ color: 'var(--brand-700)' }}>
            Contract Renewal Action Required
          </div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.5, margin: '0 0 14px' }}>
            Your 6-month Contract of Service is approaching its expiration date. Would you like to renew your contract for the upcoming term? Confirming your renewal intent will submit your accumulated Daily Accomplishment Reports (DAR) and initiate the performance evaluation workflow for your Department Head, peer evaluators, and HRMO.
          </p>

          <div className="flash flash-info" style={{ marginBottom: '18px', fontSize: '13px' }}>
            ℹ️ In compliance with RA 11032, no manual paper routing is required. Digital confirmation initiates the evaluation workflow.
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isProcessing}
              onClick={handleConfirmIntent}
            >
              {isProcessing ? 'Aggregating DARs & Synthesizing AI MAR...' : '✓ Confirm Intent to Renew'}
            </button>
            <button
              type="button"
              className="btn"
              style={{ color: 'var(--red-600)', borderColor: 'var(--line)' }}
              onClick={() => setShowDeclineModal(true)}
            >
              Decline Renewal
            </button>
          </div>
        </div>
      )}

      {/* Confirmed State Feedback */}
      {status === 'Renewal Intent Confirmed' && (
        <div className="card" style={{ border: '1px solid #bfe8cd', background: 'var(--green-50)', marginBottom: '20px' }}>
          <div className="card-title" style={{ color: '#0f6b32', margin: '0 0 6px' }}>
            ✓ Renewal Intent Confirmed &amp; AI MAR Synthesized
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '13.5px' }}>
            All {contract.totalDarsLogged} DAR logs have been successfully aggregated into your Monthly Accomplishment Report.
            Concurrent evaluation routing is now active:
          </p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
            <li><b>Immediate Supervisor (50%):</b> Department Head notified with split-panel AI summary.</li>
            <li><b>Peer Evaluation (20%):</b> Anonymous departmental peers assigned.</li>
            <li><b>HRMO Compliance (30%):</b> Administrative review unlocked.</li>
          </ul>
        </div>
      )}

      {/* Declined State Feedback */}
      {status === 'Declined' && (
        <div className="card" style={{ border: '1px solid #f3c2c2', background: 'var(--red-50)', marginBottom: '20px' }}>
          <div className="card-title" style={{ color: 'var(--red-600)', margin: '0 0 6px' }}>
            Non-Renewal Intent Recorded
          </div>
          <p style={{ margin: 0, fontSize: '13.5px' }}>
            You have indicated that you do not intend to renew your contract. All evaluation routing has been halted,
            and HRMO has been notified for standard end-of-contract offboarding procedures.
          </p>
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {showDeclineModal && (
        <div className="modal-backdrop" style={{ display: 'flex' }}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, color: 'var(--red-600)' }}>
                Confirm Non-Renewal Decision
              </div>
              <button type="button" className="modal-close" onClick={() => setShowDeclineModal(false)}>×</button>
            </div>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: '13px' }}>
              Are you sure you do not wish to renew your Contract of Service? This will cancel the evaluation routing and initiate contract closure at the end of the semester.
            </p>
            <div className="form-group">
              <label>Reason for Exiting (Optional):</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Career transition, further studies, relocation, etc."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" onClick={() => setShowDeclineModal(false)}>
                Go Back
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)' }}
                onClick={handleConfirmDecline}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
