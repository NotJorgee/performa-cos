import React, { useState } from 'react';
import { Check } from 'lucide-react';
import DynamicRubric from '../common/DynamicRubric';
import AiPerformanceAnalysis from '../common/AiPerformanceAnalysis';
import MonthlyReport from '../employee/MonthlyReport';

const DEFAULT_SUBMITTED_SCORES = {
  adm_1: 5, adm_2: 5, adm_3: 4, adm_4: 5,
  adm_5: 5, adm_6: 5, adm_7: 4, adm_8: 5,
  adm_9: 5, adm_10: 5, adm_11: 5, adm_12: 5,
  adm_13: 4, adm_14: 5, adm_15: 5, adm_16: 4,
  adm_17: 5, adm_18: 5, adm_19: 5, adm_20: 5,
  mnt_1: 5, mnt_2: 5, mnt_3: 4, mnt_4: 5,
  mnt_5: 5, mnt_6: 5, mnt_7: 4, mnt_8: 5,
  mnt_9: 5, mnt_10: 5, mnt_11: 5, mnt_12: 5,
  mnt_13: 4, mnt_14: 5, mnt_15: 5, mnt_16: 4,
  mnt_17: 5, mnt_18: 5, mnt_19: 5, mnt_20: 5,
};

export default function PendingEvaluations({
  departmentName = 'Computer Studies Department',
  collegeName = 'College of Technology',
  onBack = null,
  metrics = {
    totalSubordinates: 12,
    pendingReviews: 2,
    avgScore: 88.5,
    ratingLabel: 'Very Satisfactory',
  },
  subordinates: initialSubordinates = null,
  onSaveDraft = () => {},
  onSubmitSupervisorScore = () => {},
}) {
  const [subordinateList, setSubordinateList] = useState(
    initialSubordinates || [
      {
        id: 101,
        employeeIdNumber: 'G10222026JMR',
        fullName: 'Jorge Mikhael Gubantes',
        role: 'COS Employee',
        cosCategory: 'Administrative',
        period: 'Calendar Year 2026',
        status: 'Needs Evaluation',
        contractEndDate: 'Dec 31, 2026',
        totalDarEntries: 84,
        marRecords: [
          {
            id: 11,
            dateSubmitted: 'Oct 17, 2026, 4:45 PM',
            month: 'October',
            year: '2026',
            jobDescription: 'Diagnosed and configured 24 lab workstations',
            workAccomplished: 'Maintained 100% technical resolution uptime for 24 lab workstations in Room 304 and validated network connections.',
            quantity: '24 units',
            remarks: 'All terminals operational for midterm examinations.',
            photoEvidenceUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=60',
          },
          {
            id: 12,
            dateSubmitted: 'Oct 16, 2026, 4:20 PM',
            month: 'October',
            year: '2026',
            jobDescription: 'Validated 35 student clearance documents',
            workAccomplished: 'Digitally verified student clearance forms and coordinated document release with academic advisers.',
            quantity: '35 forms',
            remarks: 'Zero processing delays.',
            photoEvidenceUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=60',
          },
          {
            id: 13,
            dateSubmitted: 'Oct 15, 2026, 3:30 PM',
            month: 'October',
            year: '2026',
            jobDescription: 'Prepared audiovisual terminals for college assembly',
            workAccomplished: 'Configured and tested 12 multimedia audio-visual devices and main projector for campus gathering.',
            quantity: '12 terminals',
            remarks: 'Sound and video check verified.',
            photoEvidenceUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=60',
          },
        ],
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
          rawDarLogs: [
            'Oct 17, 2026: Diagnosed and configured 24 lab workstations in Room 304; verified network connections.',
            'Oct 16, 2026: Validated 35 student clearance documents and coordinated with faculty evaluators.',
            'Oct 15, 2026: Prepared conference hall AV equipment for university administrative council meeting.',
            'Oct 14, 2026: Handled software updates and security patch deployment across CSD laboratory terminals.',
            'Oct 13, 2026: Assisted students with department enrollment queries and document routing.',
          ],
        },
      },
      {
        id: 102,
        employeeIdNumber: 'R10222026IJM',
        fullName: 'Ian Joseph Ranoco',
        role: 'COS Employee',
        cosCategory: 'Administrative',
        period: 'Calendar Year 2026',
        status: 'Under Peer/HR Review',
        contractEndDate: 'Dec 31, 2026',
        totalDarEntries: 78,
        submittedScores: {
          adm_1: 5, adm_2: 5, adm_3: 4, adm_4: 5,
          adm_5: 5, adm_6: 5, adm_7: 4, adm_8: 5,
          adm_9: 5, adm_10: 5, adm_11: 5, adm_12: 5,
          adm_13: 4, adm_14: 5, adm_15: 5, adm_16: 4,
          adm_17: 5, adm_18: 5, adm_19: 5, adm_20: 5,
        },
        submittedStrengths: 'Consistently completes administrative assignments with high accuracy. Handled laboratory inventory updates with commendable dedication.',
        submittedRecommendation: 'Strongly Recommended for Renewal',
        marRecords: [
          {
            id: 21,
            dateSubmitted: 'Oct 17, 2026, 4:30 PM',
            month: 'October',
            year: '2026',
            jobDescription: 'Encoded laboratory hardware inventory tracking spreadsheets',
            workAccomplished: 'Encoded inventory tracking spreadsheets for newly delivered equipment and updated department asset register.',
            quantity: '12 items',
            remarks: 'Recorded in university asset database.',
            photoEvidenceUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=60',
          },
          {
            id: 22,
            dateSubmitted: 'Oct 16, 2026, 4:15 PM',
            month: 'October',
            year: '2026',
            jobDescription: 'Maintained laboratory physical logbook and conducted hardware count',
            workAccomplished: 'Inspected 2 computer laboratories and reconciled actual equipment count with department roster.',
            quantity: '2 labs',
            remarks: 'Zero missing peripherals.',
            photoEvidenceUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=60',
          },
          {
            id: 23,
            dateSubmitted: 'Oct 15, 2026, 3:45 PM',
            month: 'October',
            year: '2026',
            jobDescription: 'Distributed laboratory teaching schedules to faculty members',
            workAccomplished: 'Delivered official schedule copies to 18 IT and Computer Science instructors.',
            quantity: '18 schedules',
            remarks: 'Confirmed receipt from all faculty.',
            photoEvidenceUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=60',
          },
        ],
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
            'Quick turnaround on equipment requisitions during operational startup.',
            'Maintained consistent output and operational support across laboratory assignments.',
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
          rawDarLogs: [
            'Oct 17, 2026: Encoded inventory tracking spreadsheets for newly delivered equipment.',
            'Oct 16, 2026: Maintained laboratory physical logbook and conducted hardware count.',
          ],
        },
      },
    ]
  );

  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [viewingFullDoc, setViewingFullDoc] = useState(false);
  const [docOrigin, setDocOrigin] = useState('appraisal'); // 'appraisal' | 'table'
  const [isReadOnlyEval, setIsReadOnlyEval] = useState(false);
  const [savedDraftToast, setSavedDraftToast] = useState(null);

  // Filter out any employees whose contract renewal is finished (Active Contract / Completed)
  // Only pending evaluations remain in this panel
  const pendingSubordinates = subordinateList.filter(
    (s) => s.status !== 'Active Contract' && s.status !== 'Completed' && s.status !== 'Contract Renewed'
  );

  const activeEmployee = subordinateList.find((s) => s.id === selectedEmpId);

  const handleSaveDraft = (draftData) => {
    onSaveDraft({ employeeId: selectedEmpId, ...draftData });
    setSavedDraftToast('Draft rubric scores and qualitative feedback saved successfully.');
    setTimeout(() => setSavedDraftToast(null), 3500);
  };

  const handleSubmitEvaluation = (evalData) => {
    setSubordinateList((prev) =>
      prev.map((s) =>
        s.id === selectedEmpId
          ? {
              ...s,
              status: 'Under Peer/HR Review',
              submittedScores: evalData.scores,
              submittedStrengths: evalData.strengths,
              submittedRecommendation: evalData.recommendation,
            }
          : s
      )
    );
    onSubmitSupervisorScore({ employeeId: selectedEmpId, ...evalData });
    setSavedDraftToast(`Performance appraisal for ${activeEmployee?.fullName || 'employee'} submitted successfully! Forwarded to HRMO.`);
    setTimeout(() => setSavedDraftToast(null), 4000);
    setSelectedEmpId(null);
  };

  return (
    <div>
      {/* Page Header */}
      {!viewingFullDoc && (
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0 }}>
              {selectedEmpId && activeEmployee
                ? `${isReadOnlyEval ? 'View Evaluation' : 'Performance Appraisal'}: ${activeEmployee.fullName}`
                : departmentName}
            </h1>
          </div>
          {selectedEmpId ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setSelectedEmpId(null);
                setViewingFullDoc(false);
                setIsReadOnlyEval(false);
              }}
            >
              ← Back to Subordinates List
            </button>
          ) : onBack ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={onBack}
            >
              ← Back to Dashboard
            </button>
          ) : null}
        </div>
      )}

      {savedDraftToast && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          {savedDraftToast}
        </div>
      )}

      {/* VIEW 1: Subordinates Roster List */}
      {!selectedEmpId && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
            <div className="card-title" style={{ margin: 0 }}>
              Departmental COS Personnel &amp; Evaluation Status
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Monitor subordinate contract lifecycles, track ongoing evaluation stages, and view compiled monthly accomplishment reports.
            </p>
          </div>
          {pendingSubordinates.length === 0 ? (
            <div className="card empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Check size={24} />
              </div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--ink-800)' }}>All Evaluations Caught Up!</h3>
              <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
                There are no pending subordinate evaluations for {departmentName}. New evaluations scheduled by HRMO will appear here.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>COS Subordinate</th>
                  <th>Accumulated DARs</th>
                  <th>Contract Expiry</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubordinates.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <b>{sub.fullName}</b>
                      <div className="muted" style={{ fontSize: '12px' }}>ID: {sub.employeeIdNumber || 'G10222026JMR'}</div>
                    </td>
                    <td>
                      <b>{sub.totalDarEntries}</b> verified logs
                    </td>
                    <td>{sub.contractEndDate}</td>
                    <td>
                      <span
                        className={`badge badge-${
                          sub.status === 'Needs Evaluation'
                            ? 'inprogress'
                            : 'pending'
                        }`}
                        style={
                          sub.status === 'Needs Evaluation'
                            ? { border: '1px solid var(--brand-border)' }
                            : undefined
                        }
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {sub.status === 'Needs Evaluation' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedEmpId(sub.id);
                            setViewingFullDoc(false);
                            setIsReadOnlyEval(false);
                          }}
                        >
                          Evaluate Subordinate
                        </button>
                      )}
                      {sub.status === 'Under Peer/HR Review' && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: '#fff', borderColor: 'var(--line)' }}
                          onClick={() => {
                            setSelectedEmpId(sub.id);
                            setViewingFullDoc(false);
                            setIsReadOnlyEval(true);
                          }}
                        >
                          View Evaluation
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VIEW 2: SPLIT-PANEL AI-ASSISTED EVALUATION (SRS Section 2.2 & UC-03) */}
      {selectedEmpId && activeEmployee && !viewingFullDoc && (
        <div>
          {/* Subordinate Information Banner */}
          <div className="card flex-between" style={{ marginBottom: '20px', background: '#fff' }}>
            <div>
              <div className="card-title" style={{ margin: '0 0 4px' }}>
                {isReadOnlyEval ? `Reviewing Evaluation: ${activeEmployee.fullName}` : `Evaluating: ${activeEmployee.fullName}`}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Department: <b>{departmentName}</b>
              </p>
            </div>
            {isReadOnlyEval && (
              <span className="badge badge-pending">
                Submitted Evaluation (Read-Only)
              </span>
            )}
          </div>

          {/* SPLIT PANEL GRID */}
          <div className="two-col" style={{ alignItems: 'flex-start', gap: '20px' }}>
            {/* LEFT PANEL: Dynamic Grading Rubric */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: '14px' }}>
                Supervisor Grading Rubric
              </div>
              <DynamicRubric
                key={`${activeEmployee.id}_${isReadOnlyEval ? 'ro' : 'edit'}`}
                cosCategory={activeEmployee.cosCategory}
                evaluatorRole="Immediate Supervisor"
                readOnly={isReadOnlyEval}
                initialScores={activeEmployee.submittedScores || (isReadOnlyEval ? DEFAULT_SUBMITTED_SCORES : {})}
                initialStrengths={activeEmployee.submittedStrengths || ''}
                initialRecommendation={activeEmployee.submittedRecommendation || 'Recommended for Renewal'}
                onSaveDraft={handleSaveDraft}
                onSubmit={handleSubmitEvaluation}
              />
            </div>

            {/* RIGHT PANEL: Vertical AI DAR Performance Analysis */}
            <div style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setViewingFullDoc(true);
                    setDocOrigin('appraisal');
                  }}
                >
                  View Full Compiled MAR →
                </button>
              </div>

              <AiPerformanceAnalysis
                aiSummary={activeEmployee.aiSummary}
                totalDarEntries={activeEmployee.totalDarEntries}
                employeeName={activeEmployee.fullName}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPILED MONTHLY ACCOMPLISHMENT REPORT (FULL PAGE VIEW) */}
      {selectedEmpId && activeEmployee && viewingFullDoc && (
        <MonthlyReport
          employeeName={activeEmployee.fullName}
          department={departmentName}
          initialRecords={activeEmployee.marRecords}
          backLabel={docOrigin === 'table' ? '← Back to Subordinates List' : '← Back to Performance Appraisal'}
          onBack={() => {
            setViewingFullDoc(false);
            if (docOrigin === 'table') {
              setSelectedEmpId(null);
            }
          }}
        />
      )}
    </div>
  );
}
