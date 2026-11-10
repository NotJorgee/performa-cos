import Toast from '../common/Toast';
import PredictiveTextarea from '../common/PredictiveTextarea';
import React, { useState, useEffect } from 'react';
import { Check, X, FileCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';
import { EVSU_DEPARTMENTS, getDepartmentDomain } from '../../utils/departments';

function formatDisplayDate(dateInput) {
  if (!dateInput) return 'Not Specified';
  if (typeof dateInput === 'string' && /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(dateInput)) {
    return dateInput;
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.substring(0, 10).split('-').map(Number);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return `${months[month - 1]} ${dayStr}, ${year}`;
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
  } catch {
    return String(dateInput);
  }
}

function calculateDaysRemaining(endDateStr) {
  if (!endDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let end;
  if (typeof endDateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(endDateStr)) {
    const [year, month, day] = endDateStr.substring(0, 10).split('-').map(Number);
    end = new Date(year, month - 1, day);
  } else {
    end = new Date(endDateStr);
  }
  end.setHours(0, 0, 0, 0);
  const diffTime = end - today;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export default function ContractStatus({
  currentUser = null,
  contract: propContract = null,
  departments = EVSU_DEPARTMENTS,
  onConfirmRenewal = () => {},
  onDeclineRenewal = () => {},
  onBack = null,
}) {
  const initialRawStart = currentUser?.contractStartDate || currentUser?.dateAppointed;
  const initialRawEnd = currentUser?.contractEndDate;

  const [contractDetails, setContractDetails] = useState({
    employeeName: currentUser?.fullName || currentUser?.full_name || 'COS Personnel',
    department: typeof currentUser?.department === 'object' && currentUser?.department !== null
      ? (currentUser.department.name || 'Computer Studies Department')
      : (currentUser?.department || currentUser?.department_name || 'Computer Studies Department'),
    startDate: formatDisplayDate(initialRawStart),
    endDate: formatDisplayDate(initialRawEnd),
    rawStartDate: initialRawStart,
    rawEndDate: initialRawEnd,
    daysRemaining: initialRawEnd ? calculateDaysRemaining(initialRawEnd) : 0,
    renewalStatus: 'Open for Intent Confirmation',
    totalDarsLogged: 0,
    verifiedDarCount: 0,
  });

  const [status, setStatus] = useState('Open for Intent Confirmation');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null); // 'renew' | 'decline' | null
  const [declineReason, setDeclineReason] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.analytics
      .getEmployeeDashboard()
      .then((data) => {
        if (!isMounted || !data) return;
        setContractDetails((prev) => {
          const rawStart = data.rawStartDate || currentUser?.contractStartDate || currentUser?.dateAppointed || prev.rawStartDate;
          const rawEnd = data.rawEndDate || currentUser?.contractEndDate || prev.rawEndDate;
          const daysRemaining = typeof data.daysUntilExpiration === 'number'
            ? data.daysUntilExpiration
            : calculateDaysRemaining(rawEnd);

          return {
            ...prev,
            employeeName: data.employeeName || currentUser?.fullName || prev.employeeName,
            department: data.department || currentUser?.department || prev.department,
            startDate: data.contractStartDate ? formatDisplayDate(data.contractStartDate) : formatDisplayDate(rawStart),
            endDate: data.contractEndDate ? formatDisplayDate(data.contractEndDate) : formatDisplayDate(rawEnd),
            rawStartDate: rawStart,
            rawEndDate: rawEnd,
            daysRemaining,
            totalDarsLogged: data.totalDarsLogged ?? prev.totalDarsLogged,
            renewalStatus: data.renewalIntentStatus || prev.renewalStatus,
          };
        });

        if (data.renewalIntentStatus) {
          setStatus(data.renewalIntentStatus);
        }
        if (data.declineReason) {
          setDeclineReason(data.declineReason);
        }
      })
      .catch((err) => {
        console.warn('Notice loading employee dashboard metrics for contract status:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const contract = propContract ? { ...contractDetails, ...propContract } : contractDetails;
  const isExpiringSoon = (contract.daysRemaining ?? 0) <= 30;

  const handleFinalConfirmRenew = async () => {
    setIsProcessing(true);
    try {
      await api.renewals.submit({
        period: `${contract.startDate} – ${contract.endDate}`,
        intent: 'renew',
        mar_narrative: `Aggregated DAR portfolio across ${contract.totalDarsLogged} logs submitted for supervisory review.`,
      });
      setStatus('Renewal Intent Confirmed');
      setShowActionModal(false);
      setSelectedAction(null);
      setToastMsg('Contract renewal intent confirmed! Accumulated DARs synthesized and evaluation workflow initiated.');
      onConfirmRenewal({
        action: 'renew',
        department: contract.department,
        contractCycle: `${contract.startDate} – ${contract.endDate}`,
        totalDarsAggregated: contract.totalDarsLogged,
        confirmedAt: new Date().toISOString(),
      });
    } catch (err) {
      setToastMsg(`Failed to submit renewal intent: ${err.message || 'Server error'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleFinalConfirmDecline = async () => {
    setIsProcessing(true);
    try {
      const cleanReason = declineReason.trim();
      await api.renewals.submit({
        period: `${contract.startDate} – ${contract.endDate}`,
        intent: 'decline',
        reason: cleanReason,
        mar_narrative: cleanReason
          ? `[COS DECLINED RENEWAL]: ${cleanReason}`
          : '[COS DECLINED RENEWAL]: Employee opted not to renew contract.',
      });
      setStatus('Declined');
      setShowActionModal(false);
      setSelectedAction(null);
      setToastMsg('Non-renewal decision recorded. HRMO has been notified for offboarding.');
      onDeclineRenewal({
        action: 'decline',
        reason: cleanReason,
        declinedAt: new Date().toISOString(),
      });
    } catch (err) {
      setToastMsg(`Failed to record non-renewal decision: ${err.message || 'Server error'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Contract Status</h1>
          <p className="muted" style={{ margin: 0 }}>
            Monitor your Contract of Service lifecycle and submit your formal digital renewal confirmation.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

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
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{contract.department}</span>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 8px',
                  borderRadius: '10px',
                  background: getDepartmentDomain(contract.department).style.bg,
                  color: getDepartmentDomain(contract.department).style.text,
                  border: `1px solid ${getDepartmentDomain(contract.department).style.border}`,
                }}
              >
                {getDepartmentDomain(contract.department).name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Intent Action Panel — Only unlocks when <= 30 days left before contract expiration */}
      {isExpiringSoon && (status === 'Open for Intent Confirmation' || status === 'Contract Active') && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--brand-border)', background: '#fff' }}>
          <div className="card-title" style={{ color: 'var(--brand-700)' }}>
            Contract Renewal Action Required
          </div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.5, margin: '0 0 16px' }}>
            Your Contract of Service is approaching its expiration date ({contract.daysRemaining} days remaining). Would you like to renew your contract for the upcoming term? Confirming your renewal intent will submit your accumulated Daily Accomplishment Reports (DAR) for AI performance synthesis and forward your intent to your Department Head for endorsement review.
          </p>

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

      {/* Contract Active / Notice when > 30 days left */}
      {!isExpiringSoon && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--line)', background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink-900)' }}>
                Contract Active &amp; In Good Standing
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: '4px 0 0', lineHeight: 1.5 }}>
                Your Contract of Service is currently active with <strong>{contract.daysRemaining} days</strong> remaining until expiration ({contract.endDate}).
                The formal digital renewal confirmation workflow will automatically unlock <strong>30 days prior to contract expiration</strong>.
                Please continue logging your Daily Accomplishment Reports (DAR) to maintain your evaluation portfolio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed State Feedback */}
      {isExpiringSoon &&
        ['Renewal Intent Confirmed', 'Submitted', 'Under Review', 'Pending HRMO', 'Pending HR Mediation'].includes(status) && (
        <div className="card" style={{ border: '1px solid #bfe8cd', background: 'var(--green-50)', marginBottom: '20px' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="card-title" style={{ color: '#0f6b32', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={20} />
                Renewal Intent Confirmed &amp; AI DAR Synthesized
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '13.5px' }}>
                All {contract.totalDarsLogged} DAR logs have been successfully aggregated into your Accomplishment Report.
                Performance evaluation routing is now active (Status: <b>{status}</b>):
              </p>
              <ul style={{ margin: '0 0 12px', paddingLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
                <li><b>Immediate Supervisor Evaluation (100%):</b> Department Head notified with live DAR summary and performance rubric.</li>
                <li><b>HRMO Compliance &amp; Contract Finalization:</b> Institutional review and renewal appointment determination.</li>
              </ul>
            </div>
            {['Renewal Intent Confirmed', 'Submitted'].includes(status) && (
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
            )}
          </div>
        </div>
      )}

      {/* Approved State Feedback */}
      {isExpiringSoon && status === 'Approved' && (
        <div className="card" style={{ border: '1px solid #bfe8cd', background: 'var(--green-50)', marginBottom: '20px' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="card-title" style={{ color: '#0f6b32', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={20} />
                Contract Renewal Approved
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5 }}>
                Your contract renewal has been approved and endorsed by your Department Head and HRMO. Your renewed Contract of Service term is officially finalized.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HR Finalized Non-Renewal Feedback */}
      {status === 'Non-Renewal Finalized' && (
        <div className="card" style={{ border: '1px solid #f3c2c2', background: 'var(--red-50)', marginBottom: '20px' }}>
          <div className="card-title" style={{ color: 'var(--red-600)', margin: '0 0 6px' }}>
            Contract Non-Renewal Finalized by HRMO
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5 }}>
            Your contract renewal request was concluded as <b>Do Not Renew</b> by the Human Resource Management Office. Your current contract concludes on {contract.endDate}.
          </p>
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
                <FileCheck size={18} color="var(--brand-700)" />
                <span>Contract Action</span>
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
                <X size={18} />
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px', lineHeight: 1.5 }}>
              Choose your intended contract lifecycle action for your upcoming contract period. A final confirmation is required before submitting your decision to the evaluation workflow.
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
                    <Check size={16} />
                    <span>Renew Contract</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                    {selectedAction === 'renew' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                      You are confirming your intent to renew your Contract of Service under <b>{contract.department}</b>. This will aggregate your <b>{contract.totalDarsLogged} Daily Accomplishment Reports (DAR)</b> into an AI-synthesized performance analysis and forward your renewal intent to your Department Head for endorsement.
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
                    <X size={16} />
                    <span>Decline Renewal</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                    {selectedAction === 'decline' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                      Are you sure you do not wish to renew your Contract of Service? This will halt all evaluation routing and schedule contract closure with HRMO at the end of your contract period.
                    </p>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label htmlFor="declineReasonInput" style={{ fontWeight: 600, fontSize: '13px' }}>
                        Reason for Exiting <span className="muted" style={{ fontWeight: 'normal' }}>(Optional):</span>
                      </label>
                      <PredictiveTextarea
                        id="declineReasonInput"
                        rows={3}
                        placeholder="Career transition, further studies, relocation, etc."
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        contextType="exit_reason"
                        fieldName="declineReason"
                        role={currentUser?.job_title || currentUser?.jobTitle || 'COS Personnel'}
                        department={contractDetails.department}
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
                        disabled={isProcessing}
                        style={{
                          background: 'var(--red-600)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 700,
                        }}
                        onClick={handleFinalConfirmDecline}
                      >
                        {isProcessing ? 'Recording Decline...' : 'Confirm Decline & Exit'}
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
