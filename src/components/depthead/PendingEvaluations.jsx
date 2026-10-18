import React, { useState } from 'react';
import DynamicRubric from '../common/DynamicRubric';
import FastTrackModal from '../common/FastTrackModal';

export default function PendingEvaluations({
  departmentName = 'Computer Studies Department',
  subordinates = [
    {
      id: 101,
      fullName: 'Jorge Mikhael Gubantes',
      role: 'COS Employee',
      cosCategory: 'Administrative',
      period: '1st Semester 2026-2027',
      status: 'Ready for Review',
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
      status: 'Ready for Review',
      contractEndDate: 'Dec 31, 2026',
      totalDarEntries: 78,
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
      status: 'Ready for Review',
      contractEndDate: 'Dec 31, 2026',
      totalDarEntries: 92,
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
  const [showFullRawDoc, setShowFullRawDoc] = useState(false);
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
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Pending Evaluations Dashboard (UC-03)</h1>
          <p className="muted" style={{ margin: 0 }}>
            {departmentName} — Review AI-summarized Monthly Accomplishment Reports and input the primary 50% supervisor score.
          </p>
        </div>
        {selectedEmpId && (
          <button type="button" className="btn btn-sm" onClick={() => setSelectedEmpId(null)}>
            ← Back to Subordinates List
          </button>
        )}
      </div>

      {savedDraftToast && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {savedDraftToast}
        </div>
      )}

      {/* VIEW 1: Subordinates Roster List */}
      {!selectedEmpId && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>COS Subordinate</th>
                <th>Category</th>
                <th>Period</th>
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
                    <span className="badge badge-dept">{sub.cosCategory}</span>
                  </td>
                  <td>{sub.period}</td>
                  <td>
                    <b>{sub.totalDarEntries}</b> verified logs
                  </td>
                  <td>{sub.contractEndDate}</td>
                  <td>
                    <span className="badge badge-inprogress">{sub.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedEmpId(sub.id)}
                    >
                      Evaluate Subordinate →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: SPLIT-PANEL AI-ASSISTED EVALUATION (SRS Section 2.2 & UC-03) */}
      {selectedEmpId && activeEmployee && (
        <div>
          {/* Subordinate Information Banner */}
          <div className="card flex-between" style={{ marginBottom: '20px', background: '#fff' }}>
            <div>
              <div className="card-title" style={{ margin: '0 0 4px' }}>
                Evaluating: {activeEmployee.fullName}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Department: <b>{departmentName}</b> &nbsp;·&nbsp;
                Role Category: <b>{activeEmployee.cosCategory}</b> &nbsp;·&nbsp;
                Evaluation Weight: <b>50% (Immediate Supervisor)</b>
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              style={{ color: 'var(--red-600)', borderColor: 'var(--red-600)', background: 'transparent' }}
              onClick={() => setShowRejectModal(true)}
            >
              ⚠️ Fast-Track Rejection (UC-06)
            </button>
          </div>

          {/* SPLIT PANEL GRID */}
          <div className="two-col" style={{ alignItems: 'flex-start', gap: '20px' }}>
            {/* LEFT PANEL: Split-Panel AI MAR Summary (SRS Section 2.2, UC-03, US-03) */}
            <div className="card" style={{ position: 'sticky', top: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '14px' }}>
                <div className="card-title" style={{ margin: 0 }}>
                  🤖 AI-Assisted Accomplishment Summary
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowFullRawDoc((prev) => !prev)}
                >
                  {showFullRawDoc ? 'Hide Full Document' : 'View Full Document'}
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

              {/* Toggleable Full Raw Accomplishments (SRS Section 2.2 "View Full Document") */}
              {showFullRawDoc && (
                <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '14px' }}>
                  <b style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
                    Raw Accumulated DAR Task Logs:
                  </b>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', fontSize: '12.5px', background: '#fff', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px' }}>
                    {activeEmployee.aiSummary.rawDarLogs.map((log, idx) => (
                      <p key={idx} style={{ margin: '0 0 8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: Dynamic Grading Rubric (FR-07, FR-08, FR-09, FR-10) */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: '14px' }}>
                Supervisor Grading Rubric (50% Weight)
              </div>
              <DynamicRubric
                cosCategory={activeEmployee.cosCategory}
                evaluatorRole="Immediate Supervisor"
                onSaveDraft={handleSaveDraft}
                onSubmit={handleSubmitEvaluation}
                onFastTrackReject={() => setShowRejectModal(true)}
              />
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
    </div>
  );
}
