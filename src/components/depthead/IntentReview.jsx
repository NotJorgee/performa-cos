import React, { useState } from 'react';
import Toast from '../common/Toast';
import {
  UserCheck,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import AiPerformanceAnalysis from '../common/AiPerformanceAnalysis';
import FastTrackModal from '../common/FastTrackModal';
import MonthlyReport from '../employee/MonthlyReport';
import {
  getComparativeTrajectory,
  ComparativeTrajectoryBadge,
} from '../../utils/comparativeAnalytics';

export default function IntentReview({
  departmentName = 'Computer Studies Department',
  collegeName = 'College of Technology',
  onBack = null,
  onEndorseEmployee = () => {},
  initialCandidates = [],
}) {
  const [candidates, setCandidates] = useState(initialCandidates || []);

  const [expandedEmpId, setExpandedEmpId] = useState(null); // start closed until user clicks
  const [toastMsg, setToastMsg] = useState(null);

  // Endorsement Modals
  const [recommendEmp, setRecommendEmp] = useState(null);
  const [recommendNotes, setRecommendNotes] = useState('');
  const [rejectEmp, setRejectEmp] = useState(null);
  const [viewingMarEmp, setViewingMarEmp] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Submit Positive Recommendation
  const handleConfirmRecommendation = () => {
    if (!recommendEmp) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === recommendEmp.id
          ? {
              ...c,
              endorsementStatus: 'Recommended',
              endorsementNotes: recommendNotes.trim() || 'Recommended for contract renewal based on satisfactory performance.',
            }
          : c
      )
    );
    onEndorseEmployee({
      employeeId: recommendEmp.id,
      employeeName: recommendEmp.fullName,
      status: 'Recommended',
      notes: recommendNotes.trim(),
    });
    showToast(`Renewal intent endorsed for "${recommendEmp.fullName}"! Forwarded to HRMO for evaluation scheduling.`);
    setRecommendEmp(null);
    setRecommendNotes('');
  };

  // Submit Non-Renewal Recommendation (Relocated Fast-Track)
  const handleConfirmRejection = ({ category, justification }) => {
    if (!rejectEmp) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === rejectEmp.id
          ? {
              ...c,
              endorsementStatus: 'Not Recommended',
              rejectionGrounds: category,
              rejectionJustification: justification,
            }
          : c
      )
    );
    onEndorseEmployee({
      employeeId: rejectEmp.id,
      employeeName: rejectEmp.fullName,
      status: 'Not Recommended',
      category,
      justification,
    });
    showToast(`Non-renewal recommendation filed for "${rejectEmp.fullName}". Forwarded to HRMO for mediation.`);
    setRejectEmp(null);
  };

  // Only display employees pending endorsement for contract renewal
  const pendingCandidates = candidates.filter((c) => c.endorsementStatus === 'Pending Review');

  if (viewingMarEmp) {
    return (
      <MonthlyReport
        employeeName={viewingMarEmp.fullName}
        department={viewingMarEmp.department}
        onBack={() => setViewingMarEmp(null)}
        backLabel="← Back to Intent Review"
      />
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={26} color="var(--brand-700)" />
            Contract Renewal Intent Reviews
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
            Review staff renewal intentions and daily accomplishment summaries. Submit your recommendation on whether to renew their contract for <b>{departmentName}</b>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onBack && (
            <button type="button" className="btn btn-sm" onClick={onBack} style={{ cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Pending Candidates List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pendingCandidates.map((candidate) => {
          const isExpanded = expandedEmpId === candidate.id;

          return (
            <div
              key={candidate.id}
              className="card"
              style={{
                padding: '0',
                overflow: 'hidden',
                border: isExpanded ? '1px solid var(--brand-300, #fbcfe8)' : '1px solid var(--line)',
                boxShadow: isExpanded ? '0 4px 14px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              {/* Summary Header Row */}
              <div
                style={{
                  padding: '18px 22px',
                  background: isExpanded ? '#fafbfc' : '#fff',
                  borderBottom: isExpanded ? '1px solid var(--line)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap',
                }}
                onClick={() => setExpandedEmpId(isExpanded ? null : candidate.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--amber-50, #fffbeb)',
                      border: '1px solid #fde68a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--amber-700)',
                      fontWeight: 800,
                      fontSize: '14px',
                    }}
                  >
                    <Clock size={20} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <b style={{ fontSize: '15px', color: 'var(--ink-900)' }}>{candidate.fullName}</b>
                      <span className="emp-id-chip">{candidate.employeeIdNumber}</span>
                    </div>
                    <div className="muted" style={{ fontSize: '12.5px', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>Department: <b>{candidate.department}</b></span>
                      <span>Contract Expiration: <b>{candidate.contractEndDate}</b> ({candidate.daysUntilExpiration} days)</span>
                      <span>Verified DARs: <b>{candidate.totalDarEntries} tasks</b></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <ComparativeTrajectoryBadge
                    currentScore={candidate.latestScore}
                    previousScore={candidate.previousScore}
                  />

                  {/* Status Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <span
                      className="badge badge-pending"
                      style={{ fontSize: '11.5px', fontWeight: 700 }}
                    >
                      Pending Endorsement
                    </span>
                  </div>

                  <div style={{ color: 'var(--ink-400)' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Expandable Details & Actions */}
              {isExpanded && (
                <div style={{ padding: '20px 22px', background: '#fff' }}>
                  {/* Comparative Trajectory Callout */}
                  <div
                    style={{
                      marginBottom: '18px',
                      background: '#f8fafc',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <ComparativeTrajectoryBadge
                        currentScore={candidate.latestScore}
                        previousScore={candidate.previousScore}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-900)' }}>
                          Latest Cycle Score: {candidate.latestScore} / 100
                          {candidate.previousScore !== null && candidate.previousScore !== undefined && (
                            <span className="muted" style={{ fontWeight: 500, marginLeft: '6px' }}>
                              (vs {candidate.previousScore} prior cycle)
                            </span>
                          )}
                        </div>
                        <div className="muted" style={{ fontSize: '12px', marginTop: '1px' }}>
                          {getComparativeTrajectory(candidate.latestScore, candidate.previousScore).description}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-dept" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        {candidate.totalContracts || 1} {(candidate.totalContracts || 1) === 1 ? 'Cycle Completed' : 'Cycles Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Vertical AI-Synthesized DAR Performance Analysis */}
                  <div style={{ marginBottom: '20px' }}>
                    <AiPerformanceAnalysis
                      aiSummary={candidate.aiSummary}
                      totalDarEntries={candidate.totalDarEntries}
                      employeeName={candidate.fullName}
                      action={
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '5px 12px',
                            boxShadow: '0 2px 4px rgba(122, 12, 46, 0.15)',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingMarEmp(candidate);
                          }}
                          title="Inspect full monthly accomplishment report logs"
                        >
                          <FileText size={14} />
                          <span>View Compiled MAR ({candidate.totalDarEntries} tasks) →</span>
                        </button>
                      }
                    />
                  </div>

                  {/* Actions Footer */}
                  <div
                    className="flex-between"
                    style={{
                      borderTop: '1px solid var(--line)',
                      paddingTop: '16px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        border: '1.5px solid #93c5fd',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        fontSize: '13px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setViewingMarEmp(candidate)}
                      title="Inspect full monthly accomplishment report logs"
                    >
                      <FileText size={16} color="#1d4ed8" />
                      <span>View Compiled MAR ({candidate.totalDarEntries} tasks)</span>
                    </button>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          color: 'var(--red-600)',
                          borderColor: 'var(--red-300, #fca5a5)',
                          background: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        onClick={() => setRejectEmp(candidate)}
                      >
                        <AlertTriangle size={14} style={{ marginRight: '5px' }} />
                        Do Not Recommend
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                        onClick={() => {
                          setRecommendEmp(candidate);
                          setRecommendNotes(candidate.endorsementNotes || '');
                        }}
                      >
                        <Check size={14} />
                        Recommend for Renewal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {pendingCandidates.length === 0 && (
          <div className="card empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px', color: 'var(--ink-800)' }}>All Caught Up!</h3>
            <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
              There are no pending renewal intent endorsements for {departmentName}. New renewal intents submitted by COS staff will appear here.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: Recommend for Renewal Modal */}
      {recommendEmp && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRecommendEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, color: 'var(--green-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={18} />
                <span>Endorse Contract Renewal</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setRecommendEmp(null)}>
                <X size={18} />
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 14px', fontSize: '13px', lineHeight: 1.5 }}>
              You are recommending <b>{recommendEmp.fullName}</b> for Contract of Service renewal under{' '}
              <b>{departmentName}</b>. This will authorize HR to initiate simultaneous 50/20/30 triad performance evaluations.
            </p>

            <div className="form-group">
              <label htmlFor="notesText">Supervisory Recommendation Remarks <span className="muted" style={{ fontWeight: 'normal' }}>(Optional)</span></label>
              <textarea
                id="notesText"
                className="form-control"
                rows="3"
                placeholder="Add commendations, key performance highlights, or terms for next semester's renewal..."
                value={recommendNotes}
                onChange={(e) => setRecommendNotes(e.target.value)}
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" onClick={() => setRecommendEmp(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmRecommendation}
              >
                Submit Renewal Endorsement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Non-Renewal Recommendation Modal (Relocated Fast-Track) */}
      <FastTrackModal
        isOpen={Boolean(rejectEmp)}
        employeeName={rejectEmp?.fullName || ''}
        title="Endorse Non-Renewal (Rejection of Intent)"
        submitButtonText="Submit Non-Renewal to HRMO"
        onClose={() => setRejectEmp(null)}
        onSubmitRejection={handleConfirmRejection}
      />
    </div>
  );
}
