import React, { useState } from 'react';
import DynamicRubric from '../common/DynamicRubric';
import FastTrackModal from '../common/FastTrackModal';
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
  metrics = {
    totalSubordinates: 12,
    pendingReviews: 3,
    avgScore: 88.5,
    ratingLabel: 'Very Satisfactory',
  },
  subordinates = [
    {
      id: 101,
      fullName: 'Jorge Mikhael Gubantes',
      role: 'COS Employee',
      cosCategory: 'Administrative',
      period: '1st Semester 2026-2027',
      status: 'Needs Evaluation',
      contractEndDate: 'Dec 31, 2026',
      totalDarEntries: 84,
      aiSummary: {
        confidenceScore: 94,
        keyHighlights: [
          'Successfully maintained 100% technical resolution uptime for 24 lab workstations in College of Technology.',
          'Digitally processed and validated 150 student clearance forms within institutional turnaround limits.',
          'Consistently fulfilled geofenced DAR compliance with zero out-of-bounds occurrences.',
          'Demonstrated high initiative by organizing departmental records management system.',
        ],
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
      fullName: 'Ian Joseph Ranoco',
      role: 'COS Employee',
      cosCategory: 'Administrative',
      period: '1st Semester 2026-2027',
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
      submittedStrengths: 'Consistently completes administrative assignments with high accuracy. Handled laboratory inventory updates with commendable dedication. Maintained 100% compliance with geofenced DAR logging.',
      submittedRecommendation: 'Recommended for Renewal',
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
        keyHighlights: [
          'Managed departmental inventory and encoded semester equipment requisitions.',
          'Assisted senior faculty with laboratory schedule distributions.',
          'Fulfilled daily task reports with campus geotag verification.',
        ],
        rawDarLogs: [
          'Oct 17, 2026: Encoded inventory tracking spreadsheets for newly delivered equipment.',
          'Oct 16, 2026: Maintained laboratory physical logbook and conducted hardware count.',
        ],
      },
    },
    {
      id: 103,
      fullName: 'Carlos Mendoza',
      role: 'COS Employee',
      cosCategory: 'Maintenance/Janitorial',
      period: '1st Semester 2026-2027',
      status: 'Active Contract',
      contractEndDate: 'Dec 31, 2026',
      totalDarEntries: 92,
      marRecords: [
        {
          id: 31,
          dateSubmitted: 'Oct 17, 2026, 5:00 PM',
          month: 'October',
          year: '2026',
          jobDescription: 'Sanitation and floor maintenance across Technology Building',
          workAccomplished: 'Cleaned and sanitized 8 classrooms in Technology Building; emptied recycling receptacles.',
          quantity: '8 rooms',
          remarks: 'Completed before morning laboratory sessions.',
          photoEvidenceUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=60',
        },
        {
          id: 32,
          dateSubmitted: 'Oct 16, 2026, 4:45 PM',
          month: 'October',
          year: '2026',
          jobDescription: 'Classroom furniture repairs and electrical lighting fix',
          workAccomplished: 'Repaired 12 damaged armchairs and fixed lighting switch in room 201.',
          quantity: '13 items',
          remarks: 'Tested safe for student use.',
          photoEvidenceUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=60',
        },
        {
          id: 33,
          dateSubmitted: 'Oct 15, 2026, 4:20 PM',
          month: 'October',
          year: '2026',
          jobDescription: 'Restroom plumbing maintenance and safety checks',
          workAccomplished: 'Conducted routine plumbing inspection and replaced leaking faucet in 2nd floor restroom.',
          quantity: '1 fixture',
          remarks: 'No leaks detected; water pressure normal.',
          photoEvidenceUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=60',
        },
      ],
      aiSummary: {
        confidenceScore: 96,
        keyHighlights: [
          'Conducted daily thorough sanitation and floor maintenance across 6 building wings.',
          'Completed 42 routine repair tickets for classroom desks, lighting fixtures, and door locks.',
          'Adhered strictly to occupational safety and waste disposal protocols.',
        ],
        rawDarLogs: [
          'Oct 17, 2026: Cleaned and sanitized 8 classrooms in Technology Building; emptied recycling receptacles.',
          'Oct 16, 2026: Repaired 12 damaged armchairs and fixed lighting switch in room 201.',
        ],
      },
    },
  ],
  onSaveDraft = () => {},
  onSubmitSupervisorScore = () => {},
  onFastTrackReject = () => {},
}) {
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [viewingFullDoc, setViewingFullDoc] = useState(false);
  const [docOrigin, setDocOrigin] = useState('appraisal'); // 'appraisal' | 'table'
  const [isReadOnlyEval, setIsReadOnlyEval] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [savedDraftToast, setSavedDraftToast] = useState(null);

  const activeEmployee = subordinates.find((s) => s.id === selectedEmpId);

  const handleSaveDraft = (draftData) => {
    onSaveDraft({ employeeId: selectedEmpId, ...draftData });
    setSavedDraftToast('Draft rubric scores and qualitative feedback saved successfully.');
    setTimeout(() => setSavedDraftToast(null), 3500);
  };

  const handleSubmitEvaluation = (evalData) => {
    onSubmitSupervisorScore({ employeeId: selectedEmpId, ...evalData });
    setSelectedEmpId(null);
  };

  const handleAuthorizeReject = (rejectData) => {
    onFastTrackReject({ employeeId: selectedEmpId, ...rejectData });
    setShowRejectModal(false);
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
          {selectedEmpId && (
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
          )}
        </div>
      )}

      {savedDraftToast && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {savedDraftToast}
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
              {subordinates.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <b>{sub.fullName}</b>
                    <div className="muted" style={{ fontSize: '12px' }}>ID: 2026-{sub.id}</div>
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
                          : sub.status === 'Under Peer/HR Review'
                          ? 'pending'
                          : 'completed'
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
                    {sub.status === 'Active Contract' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: '#fff', borderColor: 'var(--line)' }}
                        onClick={() => {
                          setSelectedEmpId(sub.id);
                          setViewingFullDoc(true);
                          setDocOrigin('table');
                        }}
                        title="View Compiled Monthly Accomplishment Report"
                      >
                        View MAR
                      </button>
                    )}
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
            {isReadOnlyEval ? (
              <span className="badge badge-pending">
                Submitted Evaluation (Read-Only)
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-sm"
                style={{ color: 'var(--red-600)', borderColor: 'var(--red-600)', background: 'transparent' }}
                onClick={() => setShowRejectModal(true)}
              >
                Fast-Track Rejection
              </button>
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
                onFastTrackReject={!isReadOnlyEval ? () => setShowRejectModal(true) : null}
              />
            </div>

            {/* RIGHT PANEL: Split-Panel AI MAR Summary */}
            <div className="card" style={{ position: 'sticky', top: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '14px' }}>
                <div className="card-title" style={{ margin: 0 }}>
                  AI-Assisted Accomplishment Summary
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setViewingFullDoc(true);
                    setDocOrigin('appraisal');
                  }}
                >
                  View Full Document →
                </button>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span className="badge badge-completed">
                  AI Confidence: {activeEmployee.aiSummary.confidenceScore}%
                </span>
                <span className="muted" style={{ fontSize: '12px', marginLeft: '8px' }}>
                  Compiled from {activeEmployee.totalDarEntries} verified DARs
                </span>
              </div>

              {/* Synthesized Highlights */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px' }}>
                <b style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--ink-700)' }}>
                  Executive Performance Highlights:
                </b>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: 1.6 }}>
                  {activeEmployee.aiSummary.keyHighlights.map((hl, i) => (
                    <li key={i}>{hl}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Fast-Track Rejection Modal (UC-06) */}
          <FastTrackModal
            isOpen={showRejectModal}
            employeeName={activeEmployee.fullName}
            onClose={() => setShowRejectModal(false)}
            onSubmitRejection={handleAuthorizeReject}
          />
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
