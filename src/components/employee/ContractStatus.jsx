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
  departments = [
    'Computer Studies Department',
    'Technology Department',
    'Engineering Department',
    'Education Department',
    'Library Office',
    'Maintenance/Janitorial (MESO) Office',
  ],
  onConfirmRenewal = () => {},
  onDeclineRenewal = () => {},
  onBack = null,
}) {
  const [status, setStatus] = useState(contract.renewalStatus);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null); // 'renew' | 'decline' | null
  const [declineReason, setDeclineReason] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const handleFinalConfirmRenew = () => {
    setIsProcessing(true);
    // Simulates aggregating all DAR entries and triggering LLM API summarization (UC-02, FR-05)
    setTimeout(() => {
      setIsProcessing(false);
      setStatus('Renewal Intent Confirmed');
      setShowActionModal(false);
      setSelectedAction(null);
      setToastMsg('✓ Contract renewal intent confirmed! Accumulated DARs synthesized and evaluation workflow initiated.');
      onConfirmRenewal({
        action: 'renew',
        department: contract.department,
        contractCycle: `${contract.startDate} – ${contract.endDate}`,
        totalDarsAggregated: contract.totalDarsLogged,
        confirmedAt: new Date().toISOString(),
      });
      setTimeout(() => setToastMsg(null), 5000);
    }, 1100);
  };

  const handleFinalConfirmDecline = () => {
    setStatus('Declined');
    setShowActionModal(false);
    setSelectedAction(null);
    setToastMsg('Non-renewal decision recorded. HRMO has been notified for offboarding.');
    onDeclineRenewal({
      action: 'decline',
      reason: declineReason.trim(),
      declinedAt: new Date().toISOString(),
    });
    setTimeout(() => setToastMsg(null), 5000);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Contract Status</h1>
          <p className="muted" style={{ margin: 0 }}>
            Monitor your 6-month Contract of Service lifecycle and submit your formal digital renewal confirmation.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          {toastMsg}
        </div>
      )}

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
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: (contract.daysRemaining ?? 74) <= 30 ? 'var(--amber-600)' : 'var(--ink-900)',
                marginTop: '2px',
              }}
            >
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

          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowActionModal(true);
                setSelectedAction(null);
              }}
            >
              View Options
            </button>
          </div>
        </div>
      )}

      {/* Confirmed State Feedback */}
      {status === 'Renewal Intent Confirmed' && (
        <div className="card" style={{ border: '1px solid #bfe8cd', background: 'var(--green-50)', marginBottom: '20px' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
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
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: '#fff', borderColor: '#bfe8cd', color: '#0f6b32', whiteSpace: 'nowrap' }}
              onClick={() => {
                setStatus('Open for Intent Confirmation');
                setShowActionModal(true);
                setSelectedAction(null);
              }}
            >
              Change Decision
            </button>
          </div>
        </div>
      )}

      {/* Declined State Feedback */}
      {status === 'Declined' && (
        <div className="card" style={{ border: '1px solid #f3c2c2', background: 'var(--red-50)', marginBottom: '20px' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="card-title" style={{ color: 'var(--red-600)', margin: '0 0 6px' }}>
                Non-Renewal Intent Recorded
              </div>
              <p style={{ margin: 0, fontSize: '13.5px' }}>
                You have indicated that you do not intend to renew your contract. All evaluation routing has been halted,
                and HRMO has been notified for standard end-of-contract offboarding procedures.
              </p>
              {declineReason && (
                <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--ink-700)', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f3c2c2' }}>
                  <b>Reason for Exiting:</b> "{declineReason}"
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: '#fff', borderColor: '#f3c2c2', color: 'var(--red-600)', whiteSpace: 'nowrap' }}
              onClick={() => {
                setStatus('Open for Intent Confirmation');
                setShowActionModal(true);
                setSelectedAction(null);
              }}
            >
              Change Decision
            </button>
          </div>
        </div>
      )}

      {/* Contract Action Modal */}
      {showActionModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isProcessing) {
              setShowActionModal(false);
              setSelectedAction(null);
            }
          }}
        >
          <div className="modal-card" style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋 Contract Action</span>
              </div>
              <button
                type="button"
                className="modal-close"
                disabled={isProcessing}
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedAction(null);
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px', lineHeight: 1.5 }}>
              Choose your intended contract lifecycle action for the upcoming semester. A final confirmation is required before submitting your decision to the evaluation workflow.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 1. RENEW CONTRACT BUTTON */}
              <div>
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    background: 'var(--green-600)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: selectedAction === 'renew' ? '0 0 0 2px #fff, 0 0 0 4px var(--green-600)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedAction(selectedAction === 'renew' ? null : 'renew');
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✓</span>
                    <span>Renew Contract</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.9 }}>
                    {selectedAction === 'renew' ? 'Hide Details ▲' : 'Current Dept ▼'}
                  </span>
                </button>

                {selectedAction === 'renew' && (
                  <div
                    style={{
                      background: 'var(--green-50)',
                      border: '1px solid #bfe8cd',
                      borderRadius: '8px',
                      padding: '14px',
                      marginTop: '8px',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0f6b32', fontSize: '13.5px', marginBottom: '6px' }}>
                      Confirmation: Standard Contract Renewal
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--ink-800)', lineHeight: 1.5 }}>
                      You are confirming your intent to renew your Contract of Service under <b>{contract.department}</b>. This will aggregate your <b>{contract.totalDarsLogged} Daily Accomplishment Reports (DAR)</b> into an AI-synthesized MAR and initiate concurrent evaluation routing for your Department Head (50%), Peers (20%), and HRMO (30%).
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={isProcessing}
                        onClick={() => setSelectedAction(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={isProcessing}
                        style={{
                          background: 'var(--green-600)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 700,
                        }}
                        onClick={handleFinalConfirmRenew}
                      >
                        {isProcessing ? 'Initiating Workflow...' : 'Confirm & Renew'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. DECLINE RENEWAL BUTTON */}
              <div>
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    background: 'var(--red-600)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: selectedAction === 'decline' ? '0 0 0 2px #fff, 0 0 0 4px var(--red-600)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedAction(selectedAction === 'decline' ? null : 'decline');
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✕</span>
                    <span>Decline Renewal</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.9 }}>
                    {selectedAction === 'decline' ? 'Hide Details ▲' : 'Non-Renewal Intent ▼'}
                  </span>
                </button>

                {selectedAction === 'decline' && (
                  <div
                    style={{
                      background: 'var(--red-50)',
                      border: '1px solid #f3c2c2',
                      borderRadius: '8px',
                      padding: '14px',
                      marginTop: '8px',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--red-600)', fontSize: '13.5px', marginBottom: '6px' }}>
                      Confirmation: Non-Renewal Decision
                    </div>
                    <p className="muted" style={{ margin: '0 0 12px', fontSize: '13px', lineHeight: 1.5 }}>
                      Are you sure you do not wish to renew your Contract of Service? This will halt all evaluation routing and schedule contract closure with HRMO at the end of the semester.
                    </p>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label htmlFor="declineReasonInput" style={{ fontWeight: 600, fontSize: '13px' }}>
                        Reason for Exiting <span className="muted" style={{ fontWeight: 'normal' }}>(Optional):</span>
                      </label>
                      <textarea
                        id="declineReasonInput"
                        className="form-control"
                        rows="2"
                        placeholder="Career transition, further studies, relocation, etc."
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setSelectedAction(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        style={{
                          background: 'var(--red-600)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 700,
                        }}
                        onClick={handleFinalConfirmDecline}
                      >
                        Confirm Decline &amp; Exit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                className="btn"
                disabled={isProcessing}
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedAction(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
