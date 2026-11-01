import React, { useState } from 'react';
import {
  Check,
  Archive,
  FileText,
  ClipboardCheck,
  FileDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  Phone,
  MapPin,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import MonthlyReport from '../employee/MonthlyReport';
import DynamicRubric from '../common/DynamicRubric';
import {
  getComparativeTrajectory,
  getTriadComparativeDeltas,
  ComparativeTrajectoryBadge,
} from '../../utils/comparativeAnalytics';

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
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      badgeClass: 'badge-pending',
    };
  }
  if (norm.includes('outstanding')) {
    return {
      className: 'score-good',
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      badgeClass: 'badge-completed',
    };
  }
  if (norm.includes('very satisfactory')) {
    return {
      className: 'score-good',
      color: '#1d4ed8',
      bg: '#eff6ff',
      border: '#bfdbfe',
      badgeClass: 'badge-completed',
    };
  }
  if (norm.includes('satisfactory')) {
    return {
      className: 'score-good',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      badgeClass: 'badge-completed',
    };
  }
  if (score !== undefined && score !== null && score !== '') {
    const num = Number(score);
    if (num >= 90) {
      return {
        className: 'score-good',
        color: '#15803d',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        badgeClass: 'badge-completed',
      };
    }
    if (num >= 80) {
      return {
        className: 'score-good',
        color: '#1d4ed8',
        bg: '#eff6ff',
        border: '#bfdbfe',
        badgeClass: 'badge-completed',
      };
    }
    if (num >= 70) {
      return {
        className: 'score-good',
        color: '#0284c7',
        bg: '#f0f9ff',
        border: '#bae6fd',
        badgeClass: 'badge-completed',
      };
    }
    if (num >= 60) {
      return {
        className: 'score-mid',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
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

// Official EVSU HR Performance Interpretation & Recommendation Mapping
export const getScoreInterpretationAndRecommendation = (score) => {
  const num = Number(score) || 0;
  if (num >= 90) {
    return {
      scoreRange: '90 – 100',
      interpretation: 'Outstanding',
      recommendation: 'Strongly Recommended for Renewal',
    };
  }
  if (num >= 80) {
    return {
      scoreRange: '80 – 89',
      interpretation: 'Very Satisfactory',
      recommendation: 'Recommended for Renewal',
    };
  }
  if (num >= 70) {
    return {
      scoreRange: '70 – 79',
      interpretation: 'Satisfactory',
      recommendation: 'Renewal with Monitoring',
    };
  }
  if (num >= 60) {
    return {
      scoreRange: '60 – 69',
      interpretation: 'Needs Improvement',
      recommendation: 'Renewal Subject to Evaluation',
    };
  }
  return {
    scoreRange: 'Below 60',
    interpretation: 'Unsatisfactory',
    recommendation: 'Not Recommended for Renewal',
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
    contactNumber: '+63 912 345 6789',
    officeLocation: 'Technology Bldg, Room 204',
    alternateEmail: 'jorge.gubantes@gmail.com',
    emergencyContact: 'Maria Clara Ramos (+63 917 111 2233)',
  },
  onBack = () => {},
  backLabel = '← Back to Employee Records',
}) {
  const [toastMsg, setToastMsg] = useState(null);
  const [viewingMarCycle, setViewingMarCycle] = useState(null);
  const [viewingEvalCycle, setViewingEvalCycle] = useState(null);
  const [activeEvaluatorTab, setActiveEvaluatorTab] = useState('depthead'); // 'depthead' | 'cos' | 'hr'

  // Mock historical evaluations for the employee (Aligned with Official HR Criteria)
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
      recommendation: 'Strongly Recommended for Renewal',
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
      recommendation: 'Renewal with Monitoring',
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
      recommendation: 'Renewal Subject to Evaluation',
    },
  ];

  // Cycle-over-cycle comparative calculation between most recent and prior cycle
  const comparativeData =
    historicalEvaluations.length >= 2
      ? getTriadComparativeDeltas(historicalEvaluations[0], historicalEvaluations[1])
      : null;

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
              'Consistently fulfilled contracted task deliverables and verified monthly accomplishment reports with high documentation accuracy.',
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
                  <li>All accomplishment logs verified with valid documentation, attachments, and deliverable records.</li>
                  <li>Efficiently handled student enrollment records, credential validations, and laboratory maintenance schedules.</li>
                  <li>Zero deliverable defects or contractual non-compliance logged across the 6-month cycle.</li>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: getScoreInterpretationColor(employee.latestRating, employee.latestScore).color }}>
                  {employee.latestScore !== null && employee.latestScore !== undefined ? `${employee.latestScore} (${employee.latestRating || 'Evaluated'})` : 'Unrated'}
                </span>
                {comparativeData && (
                  <ComparativeTrajectoryBadge
                    currentScore={comparativeData.currentScore}
                    previousScore={comparativeData.previousScore}
                    compact
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Operational & Personal Contact Information Strip */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid var(--line)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--brand-700)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <Phone size={14} />
            </span>
            <div style={{ overflow: 'hidden' }}>
              <span className="muted" style={{ fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                Mobile Contact
              </span>
              <span style={{ fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap' }}>
                {employee.contactNumber || '+63 912 345 6789'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--brand-700)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <MapPin size={14} />
            </span>
            <div style={{ overflow: 'hidden' }}>
              <span className="muted" style={{ fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                Station / Room Location
              </span>
              <span style={{ fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                {employee.officeLocation || 'Technology Bldg, Room 204'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--brand-700)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <Mail size={14} />
            </span>
            <div style={{ overflow: 'hidden' }}>
              <span className="muted" style={{ fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                Alternate Recovery Email
              </span>
              <span style={{ fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                {employee.alternateEmail || `${(employee.email || 'personal').split('@')[0]}@gmail.com`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--red-600)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <ShieldAlert size={14} />
            </span>
            <div style={{ overflow: 'hidden' }}>
              <span className="muted" style={{ fontSize: '10.5px', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                Emergency Contact
              </span>
              <span style={{ fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                {employee.emergencyContact || 'Maria Clara Ramos (+63 917 111 2233)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Performance Analysis (Cycle-over-Cycle Deep Dive) */}
      {comparativeData ? (
        <div className="card" style={{ marginBottom: '22px', padding: '20px 24px', border: '1px solid var(--line)', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span className="badge badge-dept" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  Cycle-over-Cycle Analytics
                </span>
                <ComparativeTrajectoryBadge
                  currentScore={comparativeData.currentScore}
                  previousScore={comparativeData.previousScore}
                />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '17px', color: 'var(--ink-900)' }}>
                Comparative Performance Analysis
              </h3>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Comparing Current Cycle (<b>{comparativeData.currentPeriod}</b>) against Preceding Cycle (<b>{comparativeData.previousPeriod}</b>).
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div>
                <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Composite Delta</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: comparativeData.trajectory.color }}>
                  {comparativeData.finalDeltaFormatted} pts
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: '14px' }}>
                <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Classification</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: comparativeData.trajectory.color }}>
                  {comparativeData.trajectory.status}
                </div>
              </div>
            </div>
          </div>

          {/* Triad & MAR Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {/* Immediate Supervisor */}
            <div style={{ background: '#fafbfc', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)' }}>
                  Supervisor Appraisal (50%)
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: comparativeData.triad.supervisor.delta >= 0 ? 'var(--green-700)' : 'var(--red-600)' }}>
                  {comparativeData.triad.supervisor.deltaFormatted}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-900)' }}>
                  {comparativeData.triad.supervisor.current}%
                </span>
                <span className="muted" style={{ fontSize: '12px' }}>
                  vs {comparativeData.triad.supervisor.previous}% prior
                </span>
              </div>
              <div className="muted" style={{ fontSize: '11.5px', marginTop: '4px' }}>
                Weighted: {(comparativeData.triad.supervisor.current * 0.5).toFixed(1)} pts
              </div>
            </div>

            {/* Peer Review */}
            <div style={{ background: '#fafbfc', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)' }}>
                  Peer Evaluation (20%)
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: comparativeData.triad.peer.delta >= 0 ? 'var(--green-700)' : 'var(--red-600)' }}>
                  {comparativeData.triad.peer.deltaFormatted}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-900)' }}>
                  {comparativeData.triad.peer.current}%
                </span>
                <span className="muted" style={{ fontSize: '12px' }}>
                  vs {comparativeData.triad.peer.previous}% prior
                </span>
              </div>
              <div className="muted" style={{ fontSize: '11.5px', marginTop: '4px' }}>
                Weighted: {(comparativeData.triad.peer.current * 0.2).toFixed(1)} pts
              </div>
            </div>

            {/* HRMO Compliance */}
            <div style={{ background: '#fafbfc', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)' }}>
                  HRMO Compliance (30%)
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: comparativeData.triad.hrmo.delta >= 0 ? 'var(--green-700)' : 'var(--red-600)' }}>
                  {comparativeData.triad.hrmo.deltaFormatted}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-900)' }}>
                  {comparativeData.triad.hrmo.current}%
                </span>
                <span className="muted" style={{ fontSize: '12px' }}>
                  vs {comparativeData.triad.hrmo.previous}% prior
                </span>
              </div>
              <div className="muted" style={{ fontSize: '11.5px', marginTop: '4px' }}>
                Weighted: {(comparativeData.triad.hrmo.current * 0.3).toFixed(1)} pts
              </div>
            </div>

            {/* Deliverable Task Volume (MAR) */}
            <div style={{ background: '#fafbfc', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)' }}>
                  MAR Task Output
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: comparativeData.mar.delta >= 0 ? 'var(--green-700)' : 'var(--red-600)' }}>
                  {comparativeData.mar.deltaFormatted} tasks ({comparativeData.mar.growthPct})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-900)' }}>
                  {comparativeData.mar.current}
                </span>
                <span className="muted" style={{ fontSize: '12px' }}>
                  vs {comparativeData.mar.previous} tasks prior
                </span>
              </div>
              <div className="muted" style={{ fontSize: '11.5px', marginTop: '4px' }}>
                Verified Deliverables Completed
              </div>
            </div>
          </div>

          {/* Performance Summary Note */}
          <div style={{ background: comparativeData.trajectory.bg, border: `1px solid ${comparativeData.trajectory.border}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '15px', lineHeight: 1.2 }}>{comparativeData.trajectory.icon}</span>
            <div style={{ fontSize: '13px', color: comparativeData.trajectory.color, lineHeight: 1.5 }}>
              <b>Performance Summary: </b>
              {comparativeData.trajectory.type === 'improvement'
                ? `The employee improved their overall score by +${comparativeData.finalDelta} points compared to the last contract period. Ratings increased across all evaluators (Supervisor +${comparativeData.triad.supervisor.delta}%, Peer +${comparativeData.triad.peer.delta}%, HRMO +${comparativeData.triad.hrmo.delta}%), with higher task output (${comparativeData.mar.current} vs ${comparativeData.mar.previous} completed tasks). Recommended for contract renewal.`
                : comparativeData.trajectory.type === 'decline'
                ? `The employee's overall score decreased by -${Math.abs(comparativeData.finalDelta)} points compared to the last contract period. Closer guidance and performance monitoring are recommended for the next term.`
                : `The employee maintained steady and consistent performance (within ±1.0 point), reliably completing all assigned tasks and duties.`}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '22px', padding: '18px 22px', background: '#fafbfc', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>★</span>
            <div>
              <b style={{ fontSize: '14px', color: 'var(--ink-900)' }}>Performance Baseline Cycle</b>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
                This is the employee's first recorded contract evaluation. These results set the starting benchmark for future renewals.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <th>Final Grade & Trajectory</th>
              <th>Interpretation</th>
              <th style={{ textAlign: 'center' }}>MARs Document</th>
              <th style={{ textAlign: 'center' }}>Evaluation Dossier</th>
            </tr>
          </thead>
          <tbody>
            {historicalEvaluations.map((evalItem, index) => (
              <tr key={evalItem.id}>
                {/* Contract Cycle: ONLY starting and ending dates */}
                <td>
                  <b style={{ color: 'var(--ink-900)', fontSize: '13.5px' }}>
                    {evalItem.periodDates}
                  </b>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      className={`score-pill ${
                        getScoreInterpretationColor(evalItem.interpretation, evalItem.finalGrade).className
                      }`}
                    >
                      {evalItem.finalGrade.toFixed(2)}
                    </span>
                    <ComparativeTrajectoryBadge
                      currentScore={evalItem.finalGrade}
                      previousScore={historicalEvaluations[index + 1]?.finalGrade}
                      compact
                    />
                  </div>
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
