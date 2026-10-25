import React, { useState } from 'react';
import { Check, Archive, FileText, ClipboardCheck, FileDown } from 'lucide-react';
import MonthlyReport from '../employee/MonthlyReport';
import DynamicRubric from '../common/DynamicRubric';

export const getScoreInterpretationColor = (interpretation, score) => {
  const norm = (interpretation || '').toLowerCase().trim();
  if (norm.includes('unsatisfactory')) {
    return {
      className: 'score-bad',
      color: 'var(--red-600)',
      bg: 'var(--red-50)',
      border: '#fecaca',
      badgeClass: 'badge-delayed',
    };
  }
  if (norm.includes('needs improvement')) {
    return {
      className: 'score-mid',
      color: 'var(--amber-600)',
      bg: 'var(--amber-50)',
      border: '#fed7aa',
      badgeClass: 'badge-pending',
    };
  }
  if (
    norm.includes('outstanding') ||
    norm.includes('very satisfactory') ||
    norm.includes('satisfactory')
  ) {
    return {
      className: 'score-good',
      color: 'var(--green-600)',
      bg: 'var(--green-50)',
      border: '#bfe8cd',
      badgeClass: 'badge-completed',
    };
  }
  if (score !== undefined && score !== null && score !== '') {
    const num = Number(score);
    if (num >= 75) {
      return {
        className: 'score-good',
        color: 'var(--green-600)',
        bg: 'var(--green-50)',
        border: '#bfe8cd',
        badgeClass: 'badge-completed',
      };
    }
    if (num >= 60) {
      return {
        className: 'score-mid',
        color: 'var(--amber-600)',
        bg: 'var(--amber-50)',
        border: '#fed7aa',
        badgeClass: 'badge-pending',
      };
    }
    return {
      className: 'score-bad',
      color: 'var(--red-600)',
      bg: 'var(--red-50)',
      border: '#fecaca',
      badgeClass: 'badge-delayed',
    };
  }
  return {
    className: '',
    color: 'var(--ink-700)',
    bg: '#f8fafc',
    border: 'var(--line)',
    badgeClass: 'badge-dept',
  };
};

export default function EmployeeRecordView({
  employee = {
    id: 1,
    idNumber: 'G10222026JMR',
    fullName: 'Jorge Mikhael Gubantes',
    email: 'jorge.gubantes@evsu.edu.ph',
    department: 'Computer Studies Department',
    college: 'College of Technology',
    cosCategory: 'Administrative',
    dateAppointed: 'Oct 22, 2026',
    contractEndDate: 'Apr 22, 2027',
    latestScore: 92.4,
    latestRating: 'Outstanding',
    status: 'Active',
  },
  onBack = () => {},
  backLabel = '← Back to Executive Reports',
}) {
  const [toastMsg, setToastMsg] = useState(null);
  const [viewingMarCycle, setViewingMarCycle] = useState(null);
  const [viewingEvalCycle, setViewingEvalCycle] = useState(null);
  const [activeEvaluatorTab, setActiveEvaluatorTab] = useState('depthead'); // 'depthead' | 'cos' | 'hr'

  // Mock historical evaluations for the employee
  const historicalEvaluations = [
    {
      id: 1,
      periodDates: 'Jul 01, 2026 – Dec 31, 2026',
      supervisorScore: 94,
      peerScore: 90,
      hrmoScore: 91,
      finalGrade: 92.4,
      interpretation: 'Outstanding',
      marCount: 84,
      strengths:
        'Consistently produces exceptional quality administrative outputs with zero defect. Spearheaded student query backlog clearance and automated laboratory terminal logs.',
      recommendation: 'Recommended for Renewal (Unanimous Endorsement)',
    },
    {
      id: 2,
      periodDates: 'Jan 01, 2026 – Jun 30, 2026',
      supervisorScore: 90,
      peerScore: 86,
      hrmoScore: 88,
      finalGrade: 88.6,
      interpretation: 'Very Satisfactory',
      marCount: 78,
      strengths:
        'Demonstrates strong organizational skills and dependable support during university accreditation cycles.',
      recommendation: 'Recommended for Renewal',
    },
    {
      id: 3,
      periodDates: 'Jul 01, 2025 – Dec 31, 2025',
      supervisorScore: 80,
      peerScore: 78,
      hrmoScore: 76,
      finalGrade: 78.4,
      interpretation: 'Satisfactory',
      marCount: 70,
      strengths:
        'Reliable execution of daily tasks. High integrity in managing university records and office equipment.',
      recommendation: 'Recommended for Renewal',
    },
    {
      id: 4,
      periodDates: 'Jan 01, 2025 – Jun 30, 2025',
      supervisorScore: 68,
      peerScore: 65,
      hrmoScore: 67,
      finalGrade: 67.1,
      interpretation: 'Needs Improvement',
      marCount: 52,
      strengths:
        'Adequate task completion but requires closer monitoring on turnaround times and office documentation protocol compliance.',
      recommendation: 'Probationary Renewal with Performance Improvement Plan',
    },
  ];

  // Distinct scores for each Triad component
  const mockSupervisorScores = {
    adm_1: 5, adm_2: 5, adm_3: 4, adm_4: 5,
    adm_5: 5, adm_6: 4, adm_7: 5, adm_8: 4,
    adm_9: 5, adm_10: 5, adm_11: 5, adm_12: 5,
    adm_13: 4, adm_14: 5, adm_15: 5, adm_16: 4,
    adm_17: 5, adm_18: 4, adm_19: 5, adm_20: 5,
  };

  const mockPeerScores = {
    adm_1: 4, adm_2: 5, adm_3: 4, adm_4: 5,
    adm_5: 4, adm_6: 4, adm_7: 5, adm_8: 4,
    adm_9: 5, adm_10: 5, adm_11: 5, adm_12: 4,
    adm_13: 5, adm_14: 4, adm_15: 5, adm_16: 4,
    adm_17: 4, adm_18: 4, adm_19: 5, adm_20: 5,
  };

  const mockHrScores = {
    adm_1: 5, adm_2: 4, adm_3: 5, adm_4: 4,
    adm_5: 5, adm_6: 5, adm_7: 4, adm_8: 5,
    adm_9: 5, adm_10: 4, adm_11: 5, adm_12: 5,
    adm_13: 4, adm_14: 5, adm_15: 4, adm_16: 5,
    adm_17: 4, adm_18: 4, adm_19: 4, adm_20: 5,
  };

  const handleDownloadPdf = (docType, cycle) => {
    const isMar = docType === 'mar';
    const cleanPeriod = cycle.periodDates.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${employee.idNumber}_${isMar ? 'MAR' : 'Evaluation'}_${cleanPeriod}.pdf`;

    const content = `EASTERN VISAYAS STATE UNIVERSITY - ORMOC CAMPUS
OFFICIAL INSTITUTIONAL PERFORMANCE RECORD
============================================================
Document Type: ${isMar ? 'Compiled Monthly Accomplishment Report (MAR)' : '50/20/30 Performance Appraisal Dossier'}
Employee ID: ${employee.idNumber}
Full Name: ${employee.fullName}
Institutional Email: ${employee.email}
Department: ${employee.department}
College: ${employee.college || 'College of Technology'}
COS Category: ${employee.cosCategory}
Contract Cycle Period: ${cycle.periodDates}
------------------------------------------------------------
SCORES & EVALUATION SUMMARY:
Supervisor Score (50%): ${cycle.supervisorScore}%
Peer Score (20%): ${cycle.peerScore}%
HRMO Score (30%): ${cycle.hrmoScore}%
Final Weighted Grade: ${cycle.finalGrade} / 100
Adjectival Rating: ${cycle.interpretation}
Verified Monthly Logs (MAR): ${cycle.marCount} Verified Tasks
Recommendation: ${cycle.recommendation || 'Recommended for Renewal'}
------------------------------------------------------------
Status: Verified & Digitally Archived via PerformaCOS
Campus: EVSU Ormoc Campus
Generated Timestamp: ${new Date().toLocaleString()}
============================================================`;

    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastMsg(
      `Successfully generated and downloaded ${isMar ? 'MAR' : 'Evaluation'} PDF for ${cycle.periodDates}!`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. VIEW MAR PAGE
  if (viewingMarCycle) {
    return (
      <div>
        <MonthlyReport
          employeeName={employee.fullName}
          department={employee.department}
          cyclePeriod={viewingMarCycle.periodDates}
          backLabel="← Back to Historical Evaluations"
          onBack={() => setViewingMarCycle(null)}
          onDownload={() => handleDownloadPdf('mar', viewingMarCycle)}
          downloadLabel="Download MAR (PDF)"
        />
      </div>
    );
  }

  // 2. VIEW EVALUATION PAGE (Triad Evaluation with Evaluator Switcher)
  if (viewingEvalCycle) {
    // Current Evaluator Configuration (HR has full identity visibility for all raters)
    const getActiveEvalDetails = () => {
      switch (activeEvaluatorTab) {
        case 'cos':
          return {
            title: 'COS Peer Evaluation',
            weight: '20% Triad Weight',
            evaluator: 'Engr. Maricar Solis (COS Faculty Peer Reviewer — Computer Studies Department)',
            role: 'Peer',
            score: viewingEvalCycle.peerScore,
            scores: mockPeerScores,
            strengths:
              'Excellent team collaboration. Actively assists colleagues during peak enrollment periods and maintains positive, respectful communication across all tasks.',
            recommendation: 'Recommended for Renewal',
          };
        case 'hr':
          return {
            title: 'HRMO Institutional Evaluation',
            weight: '30% Triad Weight',
            evaluator: 'Dr. Maria Clara Ramos (HRMDO Compliance Officer)',
            role: 'HR Personnel',
            score: viewingEvalCycle.hrmoScore,
            scores: mockHrScores,
            strengths:
              '100% compliance with university attendance and campus geofencing rules. Fully verified monthly accomplishments submitted within deadline with zero compliance infractions.',
            recommendation: 'Recommended for Renewal',
          };
        case 'depthead':
        default:
          return {
            title: 'Department Head Appraisal',
            weight: '50% Triad Weight',
            evaluator: 'Engr. Roberto Del Rosario (Department Head — Immediate Supervisor)',
            role: 'Immediate Supervisor',
            score: viewingEvalCycle.supervisorScore,
            scores: mockSupervisorScores,
            strengths: viewingEvalCycle.strengths,
            recommendation: viewingEvalCycle.recommendation,
          };
      }
    };

    const currentEval = getActiveEvalDetails();

    return (
      <div>
        {/* Top Header with Back Navigation & PDF Download */}
        <div className="flex-between" style={{ marginBottom: '18px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px' }}>Performance Appraisal Dossier: {employee.fullName}</h1>
            <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
              Contract Cycle: <b>{viewingEvalCycle.periodDates}</b> • Department: <b>{employee.department}</b>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => handleDownloadPdf('eval', viewingEvalCycle)}
              title="Download Triad Evaluation Summary (PDF)"
            >
              <FileDown size={14} /> Download Evaluation (PDF)
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setViewingEvalCycle(null);
                setActiveEvaluatorTab('depthead');
              }}
            >
              ← Back to Historical Evaluations
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="flash flash-success" style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} /> <span>{toastMsg}</span>
          </div>
        )}

        {/* Subordinate Information & Triad Summary Banner */}
        <div className="card" style={{ marginBottom: '20px', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="emp-id-chip" style={{ margin: 0 }}>
                  {employee.idNumber}
                </span>
                <span className="badge badge-dept" style={{ padding: '3px 8px' }}>
                  {employee.cosCategory}
                </span>
                <span className="badge badge-completed" style={{ padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} /> Official Evaluation Archived
                </span>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px' }}>{employee.fullName}</h2>
              <div className="muted" style={{ fontSize: '13px' }}>
                Institutional Email: {employee.email} | Evaluation Window: {viewingEvalCycle.periodDates}
              </div>
            </div>

            {/* Triad Score Pills (Interactive Switcher - Clean Uniform HRMO Text Styling) */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  textAlign: 'center',
                  background: activeEvaluatorTab === 'depthead' ? '#eef2f6' : '#f8fafc',
                  border: `2px solid ${activeEvaluatorTab === 'depthead' ? 'var(--ink-700)' : 'var(--line)'}`,
                  padding: '9px 13px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveEvaluatorTab('depthead')}
                title="Click to view Dept Head Appraisal (50%)"
              >
                <div className="muted" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Dept Head (50%)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                  {viewingEvalCycle.supervisorScore}%
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  background: activeEvaluatorTab === 'cos' ? '#eef2f6' : '#f8fafc',
                  border: `2px solid ${activeEvaluatorTab === 'cos' ? 'var(--ink-700)' : 'var(--line)'}`,
                  padding: '9px 13px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveEvaluatorTab('cos')}
                title="Click to view COS Peer Evaluation (20%)"
              >
                <div className="muted" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  COS Peer (20%)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                  {viewingEvalCycle.peerScore}%
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  background: activeEvaluatorTab === 'hr' ? '#eef2f6' : '#f8fafc',
                  border: `2px solid ${activeEvaluatorTab === 'hr' ? 'var(--ink-700)' : 'var(--line)'}`,
                  padding: '9px 13px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveEvaluatorTab('hr')}
                title="Click to view HRMO Evaluation (30%)"
              >
                <div className="muted" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  HRMO (30%)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                  {viewingEvalCycle.hrmoScore}%
                </div>
              </div>

              {(() => {
                const colors = getScoreInterpretationColor(viewingEvalCycle.interpretation, viewingEvalCycle.finalGrade);
                return (
                  <div style={{ textAlign: 'center', background: colors.bg, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.color, textTransform: 'uppercase' }}>
                      Final Weighted Grade
                    </div>
                    <div style={{ fontSize: '19px', fontWeight: 800, color: colors.color, marginTop: '2px' }}>
                      {viewingEvalCycle.finalGrade.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.color, display: 'inline-flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
                      <Check size={12} />
                      <span>{viewingEvalCycle.interpretation}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* SPLIT PANEL: Left Rubric, Right AI Highlights & Calculation */}
        <div className="two-col" style={{ alignItems: 'flex-start', gap: '20px' }}>
          {/* LEFT PANEL: Dynamic Grading Rubric */}
          <div className="card">
            {/* Active Evaluator Header Info with clean HRMO score text badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--ink-900)' }}>
                  {currentEval.title}
                </b>
                <div className="muted" style={{ fontSize: '12.5px', marginTop: '3px' }}>
                  <b>Evaluator:</b> {currentEval.evaluator}
                </div>
              </div>
              <span className="badge badge-dept" style={{ fontSize: '12.5px', fontWeight: 700, padding: '4px 10px' }}>
                Score: {currentEval.score}% ({currentEval.weight})
              </span>
            </div>

            {/* Rubric View without red alert panels */}
            <DynamicRubric
              key={`${viewingEvalCycle.id}_${activeEvaluatorTab}`}
              cosCategory={employee.cosCategory || 'Administrative'}
              evaluatorRole={currentEval.role}
              readOnly={true}
              hideAlerts={true}
              initialScores={currentEval.scores}
              initialStrengths={currentEval.strengths}
              initialRecommendation={currentEval.recommendation}
            />
          </div>

          {/* RIGHT PANEL: AI Accomplishment Summary & Weight Calculation (Clearance card removed) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* AI Accomplishment Synthesis Card */}
            <div className="card">
              <div className="card-title" style={{ margin: '0 0 10px', fontSize: '15px' }}>
                AI-Assisted Accomplishment Synthesis
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span className="badge badge-completed">
                  AI Confidence: 96%
                </span>
                <span className="muted" style={{ fontSize: '12px', marginLeft: '8px' }}>
                  Synthesized from {viewingEvalCycle.marCount} verified DAR task entries
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', lineHeight: 1.6 }}>
                <b style={{ display: 'block', marginBottom: '6px', color: 'var(--ink-700)' }}>
                  Executive Performance Highlights:
                </b>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li>Maintained 100% verified geofenced DAR compliance within EVSU-Ormoc campus bounds.</li>
                  <li>Efficiently handled student enrollment records, credential validations, and laboratory maintenance schedules.</li>
                  <li>Zero attendance infractions or safety violations logged across the 6-month cycle.</li>
                </ul>
              </div>
            </div>

            {/* Triad Calculation Summary Card */}
            <div className="card">
              <div className="card-title" style={{ margin: '0 0 12px', fontSize: '15px' }}>
                50/20/30 Triad Calculation Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: activeEvaluatorTab === 'depthead' ? '#f1f5f9' : 'transparent',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <span>Supervisor Component (50%):</span>
                  <b>{viewingEvalCycle.supervisorScore}% × 0.5 = {(viewingEvalCycle.supervisorScore * 0.5).toFixed(2)} pts</b>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: activeEvaluatorTab === 'cos' ? '#f1f5f9' : 'transparent',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <span>Peer Evaluation (20%):</span>
                  <b>{viewingEvalCycle.peerScore}% × 0.2 = {(viewingEvalCycle.peerScore * 0.2).toFixed(2)} pts</b>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: activeEvaluatorTab === 'hr' ? '#f1f5f9' : 'transparent',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <span>HRMO Compliance (30%):</span>
                  <b>{viewingEvalCycle.hrmoScore}% × 0.3 = {(viewingEvalCycle.hrmoScore * 0.3).toFixed(2)} pts</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', fontSize: '14.5px', color: 'var(--green-700)', fontWeight: 800 }}>
                  <span>Final Composite Score:</span>
                  <span>{viewingEvalCycle.finalGrade.toFixed(2)} / 100 ({viewingEvalCycle.interpretation})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN VIEW: HISTORICAL EVALUATIONS TABLE
  return (
    <div>
      {/* Top Header with Back Navigation */}
      <div className="flex-between" style={{ marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Personnel Record: {employee.fullName}</h1>
          <p className="muted" style={{ margin: 0 }}>
            Historical evaluation cycles, 50/20/30 triad ratings, and downloadable official PDF records.
          </p>
        </div>
        <button type="button" className="btn btn-sm" onClick={onBack} style={{ cursor: 'pointer' }}>
          {backLabel}
        </button>
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '18px' }}>
          {toastMsg}
        </div>
      )}

      {/* Employee Header Overview Card */}
      <div className="card" style={{ marginBottom: '22px', padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-700), var(--brand-500))',
                color: '#fff',
                fontSize: '20px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {employee.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="emp-id-chip" style={{ margin: 0 }}>
                  {employee.idNumber}
                </span>
                <span
                  className={`badge ${
                    employee.status === 'Archived' ? 'badge-delete' : 'badge-active'
                  }`}
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {employee.status === 'Archived' ? (
                    <>
                      <Archive size={12} /> Archived
                    </>
                  ) : (
                    <>
                      <Check size={12} /> Active
                    </>
                  )}
                </span>
              </div>
              <h2 style={{ margin: '0 0 2px', fontSize: '20px', color: 'var(--ink-900)' }}>
                {employee.fullName}
              </h2>
              <div className="muted" style={{ fontSize: '13px' }}>
                {employee.email} | {employee.department}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                COS Category
              </span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                <span className="badge badge-unassigned" style={{ fontSize: '12px', padding: '3px 8px' }}>
                  {employee.cosCategory}
                </span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                Contract Expiry
              </span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--brand-700)', marginTop: '2px' }}>
                {employee.contractEndDate || 'Dec 31, 2026'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                Latest Grade
              </span>
              <div style={{ fontWeight: 800, fontSize: '15px', color: getScoreInterpretationColor(employee.latestRating, employee.latestScore).color, marginTop: '2px' }}>
                {employee.latestScore !== null && employee.latestScore !== undefined ? `${employee.latestScore} (${employee.latestRating || 'Evaluated'})` : 'Unrated'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Evaluations Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="card-title" style={{ margin: 0, fontSize: '16px' }}>
            Historical Evaluations
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Permanent appraisal audit log and downloadable PDF packages for completed 6-month contract evaluation cycles.
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Contract Cycle</th>
              <th>Final Grade</th>
              <th>Interpretation</th>
              <th style={{ textAlign: 'center' }}>MARs Document</th>
              <th style={{ textAlign: 'center' }}>Evaluation Dossier</th>
            </tr>
          </thead>
          <tbody>
            {historicalEvaluations.map((evalItem) => (
              <tr key={evalItem.id}>
                {/* Contract Cycle: ONLY starting and ending dates */}
                <td>
                  <b style={{ color: 'var(--ink-900)', fontSize: '13.5px' }}>
                    {evalItem.periodDates}
                  </b>
                </td>
                <td>
                  <span
                    className={`score-pill ${
                      getScoreInterpretationColor(evalItem.interpretation, evalItem.finalGrade).className
                    }`}
                  >
                    {evalItem.finalGrade.toFixed(2)}
                  </span>
                  <div className="muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                    Sup: {evalItem.supervisorScore} | Peer: {evalItem.peerScore} | HR: {evalItem.hrmoScore}
                  </div>
                </td>
                <td>
                  <span
                    className={`badge ${
                      getScoreInterpretationColor(evalItem.interpretation, evalItem.finalGrade).badgeClass
                    }`}
                    style={{ fontWeight: 700, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={12} /> {evalItem.interpretation}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setViewingMarCycle(evalItem)}
                    title={`View Compiled MAR for ${evalItem.periodDates}`}
                  >
                    <FileText size={13} /> View MAR
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setViewingEvalCycle(evalItem);
                      setActiveEvaluatorTab('depthead');
                    }}
                    title={`View Triad Evaluation for ${evalItem.periodDates}`}
                  >
                    <ClipboardCheck size={13} /> View Evaluation
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
