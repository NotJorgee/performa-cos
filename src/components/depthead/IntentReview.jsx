import React, { useState } from 'react';
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
  initialCandidates = null,
}) {
  const [candidates, setCandidates] = useState(
    initialCandidates || [
      {
        id: 101,
        employeeIdNumber: 'G10222026JMR',
        fullName: 'Jorge Mikhael Gubantes',
        role: 'COS Employee',
        cosCategory: 'Administrative',
        department: departmentName,
        contractEndDate: 'Dec 31, 2026',
        daysUntilExpiration: 62,
        intentStatus: 'Renewal Intent Confirmed',
        endorsementStatus: 'Pending Review', // 'Pending Review' | 'Recommended' | 'Not Recommended'
        endorsementNotes: '',
        rejectionGrounds: null,
        rejectionJustification: null,
        totalDarEntries: 84,
        totalContracts: 3,
        latestScore: 92.4,
        previousScore: 88.6,
        aiSummary: {
          confidenceScore: 94,
          monthlyAccomplishments: [
            'Successfully maintained 100% technical resolution uptime for 24 lab workstations in College of Technology.',
            'Digitally processed and validated 150 student clearance forms within institutional turnaround limits.',
            'Configured and calibrated 12 multimedia audiovisual terminals for college academic assemblies.',
            'Spearheaded student query backlog clearance and automated laboratory terminal inventory logs.',
          ],
          workTrends: [
            'Consistent daily task velocity averaging 2.1 accomplishment entries per operational day.',
            'Workload peaked during midterm examination weeks (Oct 12–16) with 38 student clearance validations resolved.',
            'Task turnaround time improved by 28% from month 1 to month 3 with zero defect rates.',
            'Steady milestone throughput across all verified accomplishment entries.',
          ],
          frequentActivities: [
            { label: 'Laboratory Hardware Diagnostics & Maintenance', pct: '42%' },
            { label: 'Student Document Verification & Clearance Routing', pct: '31%' },
            { label: 'Audio-Visual Support for Campus Assemblies', pct: '18%' },
            { label: 'Equipment Inventory & Supplies Encoding', pct: '9%' },
          ],
          productivitySummary: {
            totalTasks: 84,
            dailyAverage: '2.1 tasks/day',
            completionRate: '100%',
            reliabilityIndex: 'High Reliability',
            qualityAssessment: 'Zero error backlog; high accuracy documentation output',
          },
        },
      },
      {
        id: 102,
        employeeIdNumber: 'R10222026IJM',
        fullName: 'Ian Joseph Ranoco',
        role: 'COS Employee',
        cosCategory: 'Administrative',
        department: departmentName,
        contractEndDate: 'Dec 31, 2026',
        daysUntilExpiration: 62,
        intentStatus: 'Renewal Intent Confirmed',
        endorsementStatus: 'Pending Review',
        endorsementNotes: '',
        rejectionGrounds: null,
        rejectionJustification: null,
        totalDarEntries: 78,
        totalContracts: 3,
        latestScore: 88.6,
        previousScore: 88.2,
        aiSummary: {
          confidenceScore: 91,
          monthlyAccomplishments: [
            'Encoded laboratory hardware inventory tracking spreadsheets for newly delivered equipment.',
            'Maintained laboratory physical logbook and conducted hardware count across 2 computer labs.',
            'Distributed laboratory teaching schedules and confirmed receipt from 18 instructors.',
            'Assisted senior faculty with laboratory setup and student software deployment.',
          ],
          workTrends: [
            'Steady task completion pacing with 1.9 daily logs submitted per working day.',
            'Quick turnaround on equipment requisitions during semestral startup.',
            'Maintained consistent deliverable output across laboratory support assignments.',
          ],
          frequentActivities: [
            { label: 'Laboratory Inventory Logging & Reconciliations', pct: '45%' },
            { label: 'Faculty Teaching Schedule Routing', pct: '28%' },
            { label: 'General Administrative Support & Filing', pct: '18%' },
            { label: 'Terminal Hardware Checks', pct: '9%' },
          ],
          productivitySummary: {
            totalTasks: 78,
            dailyAverage: '1.9 tasks/day',
            completionRate: '100%',
            reliabilityIndex: 'High Reliability',
            qualityAssessment: 'Consistently completes tasks with high accuracy',
          },
        },
      },
      {
        id: 107,
        employeeIdNumber: 'A10222026MTR',
        fullName: 'Mark Anthony Reyes',
        role: 'COS Employee',
        cosCategory: 'Administrative',
        department: departmentName,
        contractEndDate: 'Dec 31, 2026',
        daysUntilExpiration: 62,
        intentStatus: 'Renewal Intent Confirmed',
        endorsementStatus: 'Pending Review',
        endorsementNotes: '',
        rejectionGrounds: null,
        rejectionJustification: null,
        totalDarEntries: 72,
        totalContracts: 2,
        latestScore: 89.2,
        previousScore: 89.2,
        aiSummary: {
          confidenceScore: 89,
          monthlyAccomplishments: [
            'Assisted with department accreditation document indexing and digital scanning.',
            'Managed departmental incoming and outgoing communication communications logbook.',
            'Prepared logistical supplies and materials for collegiate faculty meetings.',
          ],
          workTrends: [
            'Active contributions during document heavy accreditation audit weeks.',
            'Average resolution time within standard university office working hours.',
          ],
          frequentActivities: [
            { label: 'Document Scanning & Digital Indexing', pct: '40%' },
            { label: 'Official Communications Logging', pct: '35%' },
            { label: 'Meeting Logistics & Office Support', pct: '25%' },
          ],
          productivitySummary: {
            totalTasks: 72,
            dailyAverage: '1.8 tasks/day',
            completionRate: '100%',
            reliabilityIndex: 'Dependable Pace',
            qualityAssessment: 'Accurate record keeping and documentation',
          },
        },
      },
      {
        id: 104,
        employeeIdNumber: 'M10222026CBM',
        fullName: 'Carlos Mendoza',
        role: 'COS Employee',
        cosCategory: 'Maintenance/Janitorial',
        department: departmentName,
        contractEndDate: 'Dec 31, 2026',
        daysUntilExpiration: 62,
        intentStatus: 'Renewal Intent Confirmed',
        endorsementStatus: 'Pending Review',
        endorsementNotes: '',
        rejectionGrounds: null,
        rejectionJustification: null,
        totalDarEntries: 52,
        totalContracts: 4,
        latestScore: 68.0,
        previousScore: 71.5,
        aiSummary: {
          confidenceScore: 72,
          monthlyAccomplishments: [
            'Conducted routine campus grounds sweeping and waste disposal across Academic Building A.',
            'Assisted with physical venue arrangement for university convocation program.',
            'Reported plumbing valve leaks in ground floor restrooms for repair dispatch.',
          ],
          workTrends: [
            'Turnaround times for routine building maintenance tasks fluctuated during monsoon weeks.',
            'Logs indicate occasional delay in daily accomplishment report submission.',
          ],
          frequentActivities: [
            { label: 'Campus Grounds & Waste Management', pct: '50%' },
            { label: 'Venue Physical Arrangement', pct: '30%' },
            { label: 'Routine Facility Inspections', pct: '20%' },
          ],
          productivitySummary: {
            totalTasks: 52,
            dailyAverage: '1.3 tasks/day',
            completionRate: '92%',
            reliabilityIndex: 'Needs Supervision',
            qualityAssessment: 'Acceptable output but turnaround times need closer monitoring',
          },
        },
      },
    ]
  );

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
            Review subordinate renewal intents and vertical AI DAR performance analyses. Authorize recommendation for evaluation or endorse non-renewal for <b>{departmentName}</b>.
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

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> <span>{toastMsg}</span>
        </div>
      )}

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
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setViewingMarEmp(candidate)}
                    >
                      <FileText size={14} /> View Compiled MAR ({candidate.totalDarEntries} logs)
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
