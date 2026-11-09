import React, { useState, useEffect } from 'react';
import { Check, FileText } from 'lucide-react';
import DynamicRubric from '../common/DynamicRubric';
import AiPerformanceAnalysis from '../common/AiPerformanceAnalysis';
import MonthlyReport from '../employee/MonthlyReport';
import Toast from '../common/Toast';
import api from '../../services/api';

const DEFAULT_SUBMITTED_SCORES = {
  job_knowledge: 10,
  work_quality: 10,
  attendance: 10,
  initiative: 8,
  work_attitude: 10,
  dependability: 10,
};

export default function PendingEvaluations({
  departmentName = 'Computer Studies Department',
  onBack = null,
  metrics = {
    totalSubordinates: 0,
    pendingReviews: 0,
    avgScore: 0,
    ratingLabel: 'Pending Evaluations',
  },
  subordinates: initialSubordinates = [],
  onSaveDraft = () => {},
  onSubmitSupervisorScore = () => {},
}) {
  const [subordinateList, setSubordinateList] = useState(
    initialSubordinates || []
  );
const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [viewingFullDoc, setViewingFullDoc] = useState(false);
  const [docOrigin, setDocOrigin] = useState('appraisal'); // 'appraisal' | 'table'
  const [isReadOnlyEval, setIsReadOnlyEval] = useState(false);
  const [savedDraftToast, setSavedDraftToast] = useState(null);

  useEffect(() => {
    if (!selectedEmpId) return;
    if (api?.analytics?.getEmployeeAiSummary) {
      api.analytics.getEmployeeAiSummary(selectedEmpId).then((dossier) => {
        if (dossier) {
          setSubordinateList((prev) =>
            prev.map((s) =>
              s.id === selectedEmpId
                ? {
                    ...s,
                    totalDarEntries: dossier.totalDarEntries,
                    aiSummary: {
                      ...(s.aiSummary || {}),
                      confidenceScore: dossier.confidenceScore,
                      keyAchievements: dossier.monthlyAccomplishments,
                      monthlyAccomplishments: dossier.monthlyAccomplishments,
                      workTrends: dossier.workTrends,
                      frequentActivities: dossier.frequentActivities,
                      productivitySummary: dossier.productivitySummary,
                      attendanceStats: dossier.attendanceStats,
                    },
                  }
                : s
            )
          );
        }
      }).catch(() => {
        api.attendance.getEmployeeStats(selectedEmpId).then((stats) => {
          if (stats) {
            setSubordinateList((prev) =>
              prev.map((s) =>
                s.id === selectedEmpId
                  ? {
                      ...s,
                      aiSummary: {
                        ...(s.aiSummary || {}),
                        attendanceStats: stats,
                      },
                    }
                  : s
              )
            );
          }
        }).catch(() => {});
      });
    }
  }, [selectedEmpId]);

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
    setSavedDraftToast(`Performance evaluation for ${activeEmployee?.fullName || 'employee'} submitted successfully! Forwarded to HRMO.`);
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
                ? `${isReadOnlyEval ? 'View Evaluation' : 'Performance Evaluation'}: ${activeEmployee.fullName}`
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

      <Toast message={savedDraftToast} onClose={() => setSavedDraftToast(null)} />

      {/* VIEW 1: Subordinates Roster List */}
      {!selectedEmpId && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
            <div className="card-title" style={{ margin: 0 }}>
              Departmental COS Personnel &amp; Evaluation Status
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Monitor subordinate contract lifecycles, track ongoing evaluation stages, and view accumulated accomplishment reports.
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
            <div style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AiPerformanceAnalysis
                aiSummary={activeEmployee.aiSummary}
                totalDarEntries={activeEmployee.totalDarEntries}
                employeeName={activeEmployee.fullName}
                scrollable={true}
                maxHeight="calc(100vh - 160px)"
              />

              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    width: '100%',
                    justifyContent: 'center',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(122, 12, 46, 0.15)',
                  }}
                  onClick={() => {
                    setViewingFullDoc(true);
                    setDocOrigin('appraisal');
                  }}
                >
                  <FileText size={15} /> View Accumulated DAR Logs →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPILED MONTHLY ACCOMPLISHMENT REPORT (FULL PAGE VIEW) */}
      {selectedEmpId && activeEmployee && viewingFullDoc && (
        <MonthlyReport
          employeeId={selectedEmpId}
          employeeName={activeEmployee.fullName}
          department={departmentName}
          initialRecords={activeEmployee.marRecords}
          backLabel={docOrigin === 'table' ? 'Back to Subordinates List' : 'Back to Performance Evaluation'}
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
