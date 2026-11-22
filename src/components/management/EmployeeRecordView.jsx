import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import AttendanceLogs from '../employee/AttendanceLogs';

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
  Award,
  Calendar,
  Printer,
  Download,
} from 'lucide-react';

import MonthlyReport from '../employee/MonthlyReport';

import DynamicRubric, { EVSU_PERFORMANCE_CRITERIA, getPerformanceInterpretation } from '../common/DynamicRubric';
import AiPerformanceAnalysis from '../common/AiPerformanceAnalysis';
import { getActiveEvaluationTemplate, fetchActiveTemplateFromApi } from '../../utils/evaluationTemplate';

import OfficialRatingSheetModal from '../common/OfficialRatingSheetModal';
import { generateEvaluationPdf } from '../../utils/evaluationPdf';

import Toast from '../common/Toast';

import {

  getComparativeTrajectory,

  getTriadComparativeDeltas,

  ComparativeTrajectoryBadge,

} from '../../utils/comparativeAnalytics';



// Department Head (Immediate Supervisor) Mapping Helper

const getDepartmentSupervisor = (department) => {

  const deptStr = typeof department === 'object' && department !== null ? (department.name || '') : (department || '');
  const norm = deptStr.toLowerCase();

  if (norm.includes('computer studies')) return 'Jane A. Doe';

  if (norm.includes('technology')) return 'Engr. Juan Perez';

  if (norm.includes('mechanical') || norm.includes('civil') || norm.includes('engineering')) return 'Engr. David Lim';

  if (norm.includes('library')) return 'Mrs. Rosalina Gomez';

  if (norm.includes('maintenance') || norm.includes('janitorial') || norm.includes('meso')) return 'Engr. Mario Delgado';

  if (norm.includes('education')) return 'Dr. Alicia Tan';

  return 'Immediate Supervisor (Dept Head)';

};



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

    if (num >= 70) {
      return {
        className: 'score-good',
        color: '#1d4ed8',
        bg: '#eff6ff',
        border: '#bfdbfe',
        badgeClass: 'badge-completed',
      };
    }

    if (num >= 50) {
      return {
        className: 'score-good',
        color: '#0284c7',
        bg: '#f0f9ff',
        border: '#bae6fd',
        badgeClass: 'badge-completed',
      };
    }

    if (num >= 30) {
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

  if (num >= 70) {
    return {
      scoreRange: '70 – 89.9',
      interpretation: 'Very Satisfactory',
      recommendation: 'Recommended for Renewal',
    };
  }

  if (num >= 50) {
    return {
      scoreRange: '50 – 69.9',
      interpretation: 'Satisfactory',
      recommendation: 'Recommended for Renewal',
    };
  }

  if (num >= 30) {
    return {
      scoreRange: '30 – 49.9',
      interpretation: 'Needs Improvement',
      recommendation: 'Recommended with Conditions',
    };
  }

  return {
    scoreRange: 'Below 30',
    interpretation: 'Unsatisfactory',
    recommendation: 'Not Recommended for Renewal',
  };

};



// Helper to distribute a percentage score (0-100) across 6 rubric criteria using valid discrete scale values (2, 4, 6, 8, 10, totaling max 60 pts)
const generateCriteriaScores = (scorePercent) => {
  const rawScaled = Math.min(60, Math.max(12, Math.round(((Number(scorePercent) || 85) / 100) * 60)));
  const scaled = Math.round(rawScaled / 2) * 2;
  const baseEven = Math.min(10, Math.max(2, Math.floor(scaled / 12) * 2));
  let rem = scaled - baseEven * 6;
  const keys = ['job_knowledge', 'work_quality', 'attendance', 'work_attitude', 'initiative', 'dependability'];
  const res = {};
  keys.forEach((k) => { res[k] = baseEven; });
  for (let i = 0; i < keys.length && rem > 0; i++) {
    if (res[keys[i]] < 10) {
      res[keys[i]] += 2;
      rem -= 2;
    }
  }
  return res;
};



// Demo Historical Evaluations mapped to each personnel in the university roster

export const getEmployeeHistoricalEvaluations = (emp) => {

  if (!emp) return [];



  // 1. If explicit historicalEvaluations exists on employee prop, use it

  if (Array.isArray(emp.historicalEvaluations) && emp.historicalEvaluations.length > 0) {

    return emp.historicalEvaluations;

  }



  const normId = (emp.idNumber || '').toUpperCase().trim();

  const normName = (emp.fullName || '').toLowerCase().trim();



  // A. Jorge Mikhael Gubantes (ID: G10222026JMR) - Outstanding (+3.8 pts Improvement)

  if (normId.includes('G10222026JMR') || normName.includes('gubantes')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 93.3,

        peerScore: 90.0,

        hrmoScore: 93.3,

        finalGrade: 92.4,

        interpretation: 'Outstanding',

        marCount: 84,

        strengths:

          'Consistently produces exceptional quality administrative outputs with zero defect. Spearheaded student query backlog clearance and automated laboratory terminal logs.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 88.0,

        peerScore: 86.7,

        hrmoScore: 90.0,

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

        supervisorScore: 84.0,

        peerScore: 83.3,

        hrmoScore: 86.7,

        finalGrade: 84.7,

        interpretation: 'Very Satisfactory',

        marCount: 70,

        strengths:

          'Reliable execution of daily tasks. High integrity in managing university records and office equipment.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // B. Ian Joseph Ranoco (ID: R10222026IJM) - Very Satisfactory (+0.4 pts Consistent)

  if (normId.includes('R10222026IJM') || normName.includes('ranoco')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 90.0,

        peerScore: 86.7,

        hrmoScore: 88.0,

        finalGrade: 88.6,

        interpretation: 'Very Satisfactory',

        marCount: 76,

        strengths:

          'Demonstrates strong organizational skills and dependable support during university accreditation cycles.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 88.0,

        peerScore: 86.7,

        hrmoScore: 89.3,

        finalGrade: 88.2,

        interpretation: 'Very Satisfactory',

        marCount: 74,

        strengths:

          'Consistent support in student advising desk coordination and administrative record maintenance.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 3,

        periodDates: 'Jul 01, 2025 – Dec 31, 2025',

        supervisorScore: 86.0,

        peerScore: 85.0,

        hrmoScore: 86.7,

        finalGrade: 86.0,

        interpretation: 'Very Satisfactory',

        marCount: 68,

        strengths:

          'Diligent execution of assigned tasks with good interpersonal relations across department colleagues.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // C. Mark Anthony Reyes (ID: A10222026MTR) - Very Satisfactory (0.0 pts Consistent)

  if (normId.includes('A10222026MTR') || normName.includes('mark anthony') || normName.includes('reyes')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 90.0,

        peerScore: 86.7,

        hrmoScore: 90.0,

        finalGrade: 89.2,

        interpretation: 'Very Satisfactory',

        marCount: 80,

        strengths:

          'Punctual and reliable handling of computer laboratory terminals and faculty requisition sheets.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 90.0,

        peerScore: 86.7,

        hrmoScore: 90.0,

        finalGrade: 89.2,

        interpretation: 'Very Satisfactory',

        marCount: 80,

        strengths:

          'Consistent performance across all monthly deliverables. Stable laboratory setup turnaround.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // D. Jeramae Pace (ID: P10222026JLP) - Satisfactory (-2.7 pts Decline)

  if (normId.includes('P10222026JLP') || normName.includes('pace')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 76.7,

        peerScore: 80.0,

        hrmoScore: 80.0,

        finalGrade: 78.5,

        interpretation: 'Satisfactory',

        marCount: 64,

        strengths:

          'Good library cataloging assistance and student desk support, though turnaround on reserve shelving dipped during finals.',

        recommendation: 'Renewal with Monitoring',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 80.0,

        peerScore: 83.3,

        hrmoScore: 82.0,

        finalGrade: 81.2,

        interpretation: 'Very Satisfactory',

        marCount: 72,

        strengths:

          'Systematic handling of catalog cards and friendly assistance to campus researchers.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // E. Carlos Mendoza (ID: M10222026CBM) - Needs Improvement (-3.5 pts Decline)

  if (normId.includes('M10222026CBM') || normName.includes('mendoza')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 66.7,

        peerScore: 70.0,

        hrmoScore: 68.0,

        finalGrade: 68.0,

        interpretation: 'Needs Improvement',

        marCount: 52,

        strengths:

          'Reliable physical campus sanitation and waste handling. Requires closer monitoring on emergency facility repair response times.',

        recommendation: 'Renewal Subject to Evaluation',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 70.0,

        peerScore: 73.3,

        hrmoScore: 72.0,

        finalGrade: 71.5,

        interpretation: 'Satisfactory',

        marCount: 65,

        strengths:

          'Satisfactory completion of scheduled routine campus cleaning and maintenance rounds.',

        recommendation: 'Renewal with Monitoring',

      },

      {

        id: 3,

        periodDates: 'Jul 01, 2025 – Dec 31, 2025',

        supervisorScore: 73.3,

        peerScore: 76.7,

        hrmoScore: 72.0,

        finalGrade: 73.7,

        interpretation: 'Satisfactory',

        marCount: 68,

        strengths:

          'Diligent execution of general physical plant assignments.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 4,

        periodDates: 'Jan 01, 2025 – Jun 30, 2025',

        supervisorScore: 76.7,

        peerScore: 76.7,

        hrmoScore: 74.0,

        finalGrade: 75.8,

        interpretation: 'Satisfactory',

        marCount: 70,

        strengths:

          'Dependable attendance and thorough performance of maintenance work orders.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // F. Elena Santos (ID: E10222026ABC / E10222025ABC) - Unsatisfactory (-4.0 pts Decline)

  if (normId.includes('E10222026ABC') || normId.includes('E10222025ABC') || normName.includes('elena')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 53.3,

        peerScore: 56.7,

        hrmoScore: 53.3,

        finalGrade: 54.0,

        interpretation: 'Unsatisfactory',

        marCount: 38,

        strengths:

          'Basic laboratory maintenance completed. Safety protocol compliance and equipment calibration logs require significant overhaul.',

        recommendation: 'Not Recommended for Renewal',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 56.7,

        peerScore: 60.0,

        hrmoScore: 58.0,

        finalGrade: 58.0,

        interpretation: 'Needs Improvement',

        marCount: 46,

        strengths:

          'Requires closer supervision on hazardous chemical disposal and chemical storage inventory.',

        recommendation: 'Renewal Subject to Evaluation',

      },

    ];

  }



  // G. Danilo Cruz (ID: D10222026XYZ) - Very Satisfactory (+1.5 pts Improvement)

  if (normId.includes('D10222026XYZ') || normName.includes('danilo')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 83.3,

        peerScore: 86.7,

        hrmoScore: 83.3,

        finalGrade: 84.0,

        interpretation: 'Very Satisfactory',

        marCount: 72,

        strengths:

          'Proactive calibration of mechanical shop tooling and consistent workshop safety compliance.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 80.0,

        peerScore: 86.7,

        hrmoScore: 84.0,

        finalGrade: 82.5,

        interpretation: 'Very Satisfactory',

        marCount: 68,

        strengths:

          'Reliable technical assistance to student shop sessions and equipment maintenance.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 3,

        periodDates: 'Jul 01, 2025 – Dec 31, 2025',

        supervisorScore: 78.0,

        peerScore: 83.3,

        hrmoScore: 80.0,

        finalGrade: 79.7,

        interpretation: 'Satisfactory',

        marCount: 64,

        strengths:

          'General workshop support and inventory tracking.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // H. Clarisse Villamor (ID: C10222025ABC) - Baseline (1st Contract)

  if (normId.includes('C10222025ABC') || normName.includes('clarisse')) {

    return [

      {

        id: 1,

        periodDates: 'Oct 22, 2025 – Apr 22, 2026',

        supervisorScore: 83.3,

        peerScore: 80.0,

        hrmoScore: 81.3,

        finalGrade: 82.0,

        interpretation: 'Satisfactory',

        marCount: 58,

        strengths:

          'Solid initial contract performance. Prompt assistance with departmental communications and filing.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // I. Ramon Bautista (ID: R10222025XYZ) - Satisfactory (+1.5 pts Improvement)

  if (normId.includes('R10222025XYZ') || normName.includes('bautista')) {

    return [

      {

        id: 1,

        periodDates: 'Oct 22, 2025 – Apr 22, 2026',

        supervisorScore: 76.7,

        peerScore: 76.7,

        hrmoScore: 76.0,

        finalGrade: 76.5,

        interpretation: 'Satisfactory',

        marCount: 66,

        strengths:

          'Dependable sanitation and campus building upkeep across Engineering laboratories.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 2,

        periodDates: 'Apr 22, 2025 – Oct 21, 2025',

        supervisorScore: 73.3,

        peerScore: 76.7,

        hrmoScore: 76.0,

        finalGrade: 75.0,

        interpretation: 'Satisfactory',

        marCount: 62,

        strengths:

          'Steady daily task fulfillment with reliable team cooperation.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // J. Maria Santos (ID: S10222026MGA) - Very Satisfactory (+1.5 pts Improvement)

  if (normId.includes('S10222026MGA') || normName.includes('maria santos')) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: 85.0,

        peerScore: 82.5,

        hrmoScore: 85.0,

        finalGrade: 84.5,

        interpretation: 'Very Satisfactory',

        marCount: 74,

        strengths:

          'Consistently ensures timely record coordination and organized departmental files.',

        recommendation: 'Recommended for Renewal',

      },

      {

        id: 2,

        periodDates: 'Jan 01, 2026 – Jun 30, 2026',

        supervisorScore: 83.3,

        peerScore: 82.0,

        hrmoScore: 83.0,

        finalGrade: 83.0,

        interpretation: 'Very Satisfactory',

        marCount: 70,

        strengths:

          'Effective document handling and student front-desk support.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  // 3. Fallback for any other employee: dynamically derive cycles ONLY if actual scores exist
  if (emp.latestScore === null || emp.latestScore === undefined || !emp.latestScore || Number(emp.latestScore) <= 0) {
    return [];
  }

  const latestScore = Number(emp.latestScore);

  const previousScore = emp.previousScore !== null && emp.previousScore !== undefined ? Number(emp.previousScore) : null;

  const latestInterp = emp.latestRating || getScoreInterpretationAndRecommendation(latestScore).interpretation;



  if (previousScore === null || emp.totalContracts === 1) {

    return [

      {

        id: 1,

        periodDates: 'Jul 01, 2026 – Dec 31, 2026',

        supervisorScore: latestScore,

        peerScore: Math.max(60, latestScore - 2),

        hrmoScore: latestScore,

        finalGrade: latestScore,

        interpretation: latestInterp,

        marCount: Math.round(latestScore * 0.8),

        strengths: 'Initial contract period successfully completed in good standing.',

        recommendation: 'Recommended for Renewal',

      },

    ];

  }



  const prevInterp = getScoreInterpretationAndRecommendation(previousScore).interpretation;

  return [

    {

      id: 1,

      periodDates: 'Jul 01, 2026 – Dec 31, 2026',

      supervisorScore: Math.round(latestScore * 10) / 10,

      peerScore: Math.round((latestScore - 1.5) * 10) / 10,

      hrmoScore: Math.round((latestScore + 1.0) * 10) / 10,

      finalGrade: latestScore,

      interpretation: latestInterp,

      marCount: Math.round(latestScore * 0.85),

      strengths: 'Fulfills duties with consistent diligence and reliable university service.',

      recommendation: latestScore >= 80 ? 'Recommended for Renewal' : 'Renewal with Monitoring',

    },

    {

      id: 2,

      periodDates: 'Jan 01, 2026 – Jun 30, 2026',

      supervisorScore: Math.round(previousScore * 10) / 10,

      peerScore: Math.round((previousScore - 1.0) * 10) / 10,

      hrmoScore: Math.round((previousScore + 0.5) * 10) / 10,

      finalGrade: previousScore,

      interpretation: prevInterp,

      marCount: Math.round(previousScore * 0.82),

      strengths: 'Previous term completed according to institutional performance targets.',

      recommendation: previousScore >= 80 ? 'Recommended for Renewal' : 'Renewal with Monitoring',

    },

  ];

};



export default function EmployeeRecordView({

  employee = {

    id: 1,

    idNumber: 'G10222026JMR',

    fullName: 'Jorge Mikhael Gubantes',

    email: 'jorge.gubantes@evsu.edu.ph',

    department: 'Computer Studies Department',

    dateAppointed: 'Oct 22, 2026',

    contractEndDate: 'Apr 22, 2027',

    latestScore: 92.4,

    previousScore: 88.6,

    latestRating: 'Outstanding',

    status: 'Active',

    contactNumber: '',

    officeLocation: '',

    alternateEmail: '',

    emergencyContact: '',

  },

  currentUser = null,

  onBack = () => {},

  backLabel = '← Back to Employee Records',

}) {
  const authUser = currentUser || api.auth.getCurrentUser();
  const empDepartment = typeof employee?.department === 'object' && employee?.department !== null
    ? (employee.department.name || 'Computer Studies Department')
    : (employee?.department || 'Computer Studies Department');

  const [toastMsg, setToastMsg] = useState(null);

  const [viewingMarCycle, setViewingMarCycle] = useState(null);
  const [viewingAttendanceCycle, setViewingAttendanceCycle] = useState(null);
  const [viewingEvalCycle, setViewingEvalCycle] = useState(null);
  const [activeEvaluatorTab, setActiveEvaluatorTab] = useState('depthead');
  const [officialSheetData, setOfficialSheetData] = useState(null);

  const getSubRecordParam = () => {
    if (typeof window === 'undefined') return { sub: '', cycle: '' };
    const hashQuery = window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(hashQuery || window.location.search);
    const sub = params.get('sub') || sessionStorage.getItem('performa_records_subview') || '';
    const cycle = params.get('cycle') || sessionStorage.getItem('performa_records_cycle') || '';
    return { sub, cycle };
  };

  const updateSubRecordState = (subview, cycleData) => {
    if (typeof window === 'undefined') return;
    const baseHash = window.location.hash.split('?')[0] || '#/employee_records';
    const empKey = employee?.idNumber || employee?.id || '';
    if (subview) {
      const cycleKey = cycleData?.id || cycleData?.periodDates || 'active';
      sessionStorage.setItem('performa_records_subview', subview);
      sessionStorage.setItem('performa_records_cycle', String(cycleKey));
      window.history.replaceState(
        null,
        '',
        `${baseHash}?empId=${encodeURIComponent(empKey)}&sub=${subview}&cycle=${encodeURIComponent(cycleKey)}`
      );
    } else {
      sessionStorage.removeItem('performa_records_subview');
      sessionStorage.removeItem('performa_records_cycle');
      window.history.replaceState(null, '', `${baseHash}?empId=${encodeURIComponent(empKey)}`);
    }
  };

  const handleOpenAttendance = (cycle) => {
    const cycleObj = cycle || { periodDates: 'Active Contract Period' };
    setViewingAttendanceCycle(cycleObj);
    updateSubRecordState('attendance', cycleObj);
  };

  const handleCloseAttendance = () => {
    setViewingAttendanceCycle(null);
    updateSubRecordState(null);
  };

  const handleOpenMar = (cycle) => {
    const cycleObj = cycle || { periodDates: 'Active Contract Period' };
    setViewingMarCycle(cycleObj);
    updateSubRecordState('dar', cycleObj);
  };

  const handleCloseMar = () => {
    setViewingMarCycle(null);
    updateSubRecordState(null);
  };

  const handleOpenEval = (cycle) => {
    const targetCycle =
      cycle ||
      historicalEvaluations?.[0] ||
      (employee?.latestScore ? { periodDates: employee.contractPeriod || 'Contract Evaluation Cycle', supervisorScore: employee.latestScore, finalGrade: employee.latestScore, interpretation: employee.latestRating || 'Satisfactory' } : null);
    setViewingEvalCycle(targetCycle);
    setActiveEvaluatorTab('depthead');
    updateSubRecordState('eval', targetCycle);
  };

  const handleCloseEval = () => {
    setViewingEvalCycle(null);
    setActiveEvaluatorTab('depthead');
    updateSubRecordState(null);
  };



  // Load real completed evaluation records from API for this employee if available
  const [dbEvaluations, setDbEvaluations] = useState(null);
  const [liveAiDossier, setLiveAiDossier] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(() => getActiveEvaluationTemplate());

  useEffect(() => {
    let isMounted = true;
    fetchActiveTemplateFromApi()
      .then((tpl) => {
        if (isMounted && tpl) setActiveTemplate(tpl);
      })
      .catch(() => {});

    const onTemplateUpdated = (e) => {
      if (e.detail && isMounted) setActiveTemplate(e.detail);
    };

    window.addEventListener('performa_template_updated', onTemplateUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('performa_template_updated', onTemplateUpdated);
    };
  }, []);

  const effectiveAiSummary = liveAiDossier || {
    confidenceScore: 95,
    monthlyAccomplishments: [
      'Fulfilled contracted campus operational deliverables with verified documentation.',
    ],
    workTrends: [
      'Consistent performance delivery across all verified daily accomplishment reports.',
      'Maintained compliance with institutional turn-around and campus reporting standards.',
    ],
    frequentActivities: [
      { label: 'Assigned Campus Operational Duties', pct: '100%' },
    ],
    productivitySummary: {
      totalTasks: 5,
      dailyAverage: '1.0 tasks/day',
      completionRate: '100%',
      reliabilityIndex: 'High Reliability',
      qualityAssessment: 'Verified deliverables and photographic documentation on record.',
    },
    attendanceStats: null,
  };

  useEffect(() => {
    let isMounted = true;
    if (employee?.id && api?.analytics?.getEmployeeAiSummary) {
      api.analytics.getEmployeeAiSummary(employee.id)
        .then((data) => {
          if (isMounted && data) setLiveAiDossier(data);
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [employee?.id]);

  useEffect(() => {
    let isMounted = true;
    if (employee?.id) {
      api.evaluations.list()
        .then((records) => {
          if (!isMounted || !Array.isArray(records)) return;
          const userRecords = records.filter(
            (r) => r.employee_id === employee.id && r.status === 'Completed'
          );
          if (userRecords.length > 0) {
            const mappedRecords = userRecords.map((r) => ({
              id: r.id,
              periodDates: r.period || 'Contract Evaluation Cycle',
              supervisorScore: r.supervisor_score ?? (r.final_score || 0),
              peerScore: r.peer_score ?? (r.final_score || 0),
              hrmoScore: r.hrmo_score ?? (r.final_score || 0),
              finalGrade: r.final_score || 0,
              interpretation: r.rating_label || 'Satisfactory',
              marCount: 0,
              strengths: r.qualitative_strengths || 'Performance targets completed.',
              recommendation: r.qualitative_recommendations || 'Recommended for Renewal',
              dimensionScores: r.dimension_scores || null,
              supervisorId: r.supervisor_id || null,
              supervisorName: r.supervisor_name || null,
            }));
            setDbEvaluations(mappedRecords);

            const { sub, cycle } = getSubRecordParam();
            if (sub === 'eval') {
              const matched =
                mappedRecords.find((e) => String(e.id) === String(cycle) || e.periodDates === cycle) ||
                mappedRecords[0];
              if (matched) {
                setViewingEvalCycle(matched);
                setActiveEvaluatorTab('depthead');
              }
            } else if (sub === 'attendance') {
              const matched = mappedRecords.find((e) => String(e.id) === String(cycle) || e.periodDates === cycle);
              if (matched) setViewingAttendanceCycle(matched);
            } else if (sub === 'dar') {
              const matched = mappedRecords.find((e) => String(e.id) === String(cycle) || e.periodDates === cycle);
              if (matched) setViewingMarCycle(matched);
            }
          } else {
            setDbEvaluations([]);
          }
        })
        .catch(() => {
          if (isMounted) setDbEvaluations([]);
        });
    }
    return () => { isMounted = false; };
  }, [employee?.id]);

  // Dynamically resolve the employee's historical evaluations matching their actual demo scoring
  const staticEvaluations = useMemo(() => getEmployeeHistoricalEvaluations(employee), [employee]);
  const historicalEvaluations = useMemo(() => {
    if (dbEvaluations && dbEvaluations.length > 0) return dbEvaluations;
    if (dbEvaluations !== null) return [];
    return staticEvaluations;
  }, [dbEvaluations, staticEvaluations]);

  // Derive latest completed evaluation metrics from the newest evaluation record
  const latestEvaluation = historicalEvaluations && historicalEvaluations.length > 0 ? historicalEvaluations[0] : null;
  const effectiveLatestScore = latestEvaluation
    ? (typeof latestEvaluation.finalGrade === 'number' ? Number(latestEvaluation.finalGrade).toFixed(2) : latestEvaluation.finalGrade)
    : (employee.latestScore !== null && employee.latestScore !== undefined ? employee.latestScore : null);
  const effectiveLatestRating = latestEvaluation
    ? (latestEvaluation.interpretation || 'Satisfactory')
    : (employee.latestRating || (effectiveLatestScore ? 'Evaluated' : null));

  // Auto-restore active subview (Attendance, DARs, or Evaluation) across page refreshes
  useEffect(() => {
    const { sub, cycle } = getSubRecordParam();
    if (!sub) return;

    if (sub === 'attendance') {
      const matched = historicalEvaluations?.find((e) => String(e.id) === String(cycle) || e.periodDates === cycle);
      setViewingAttendanceCycle(matched || { periodDates: cycle !== 'active' && cycle ? cycle : 'Active Contract Period' });
    } else if (sub === 'dar') {
      const matched = historicalEvaluations?.find((e) => String(e.id) === String(cycle) || e.periodDates === cycle);
      setViewingMarCycle(matched || { periodDates: cycle !== 'active' && cycle ? cycle : 'Active Contract Period' });
    } else if (sub === 'eval') {
      const matched =
        historicalEvaluations?.find((e) => String(e.id) === String(cycle) || e.periodDates === cycle) ||
        historicalEvaluations?.[0] ||
        (employee?.latestScore ? { periodDates: employee.contractPeriod || 'Contract Evaluation Cycle', supervisorScore: employee.latestScore, finalGrade: employee.latestScore, interpretation: employee.latestRating || 'Satisfactory' } : null);
      if (matched) {
        setViewingEvalCycle(matched);
        setActiveEvaluatorTab('depthead');
      }
    }
  }, [historicalEvaluations, employee?.latestScore, dbEvaluations]);

  // Synchronize viewingEvalCycle with authentic dbEvaluations dimension scores when loaded
  useEffect(() => {
    if (viewingEvalCycle && dbEvaluations && dbEvaluations.length > 0) {
      const matched =
        dbEvaluations.find((e) => String(e.id) === String(viewingEvalCycle.id) || e.periodDates === viewingEvalCycle.periodDates) ||
        dbEvaluations[0];
      if (matched && (!viewingEvalCycle.dimensionScores || String(viewingEvalCycle.id) !== String(matched.id))) {
        setViewingEvalCycle(matched);
      }
    }
  }, [dbEvaluations, viewingEvalCycle]);

  // Resolved active evaluation details for the rubric and rating sheet view
  const getActiveEvalDetails = () => {
    if (!viewingEvalCycle) {
      return {
        title: 'Immediate Supervisor Evaluation Form',
        evaluator: getDepartmentSupervisor(employee?.department),
        score: 0,
        weight: '100% Institutional Weight',
        role: 'depthead',
        scores: generateCriteriaScores(85),
        strengths: '',
        recommendation: 'Recommended for Renewal',
      };
    }
    const scoreVal = viewingEvalCycle.supervisorScore ?? viewingEvalCycle.finalGrade ?? 0;
    const evaluatorDisplayName =
      viewingEvalCycle.supervisorName ||
      (employee?.department && typeof employee.department === 'object' && employee.department.supervisor
        ? employee.department.supervisor.full_name
        : null) ||
      getDepartmentSupervisor(employee?.department);
    return {
      title: 'Immediate Supervisor Evaluation Form',
      evaluator: evaluatorDisplayName,
      score: typeof scoreVal === 'number' ? scoreVal.toFixed(1) : scoreVal,
      weight: '100% Institutional Weight',
      role: 'depthead',
      scores: viewingEvalCycle.dimensionScores || generateCriteriaScores(scoreVal || 85),
      strengths: viewingEvalCycle.strengths || 'Fulfills duties with consistent diligence and reliable university service.',
      recommendation: viewingEvalCycle.recommendation || 'Recommended for Renewal',
    };
  };

  // Cycle-over-cycle comparative calculation between most recent and prior cycle

  const comparativeData =

    historicalEvaluations.length >= 2

      ? getTriadComparativeDeltas(historicalEvaluations[0], historicalEvaluations[1])

      : null;



  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadEvaluationDoc = async (evalCycle = viewingEvalCycle) => {
    const targetCycle = evalCycle || viewingEvalCycle;
    if (!targetCycle || isExportingPdf) return;
    const currentEval = getActiveEvalDetails();
    const supervisorName =
      targetCycle.supervisorName ||
      (employee?.department && typeof employee.department === 'object' && employee.department.supervisor
        ? employee.department.supervisor.full_name
        : null) ||
      getDepartmentSupervisor(employee?.department);

    try {
      setIsExportingPdf(true);
      setToastMsg('Generating official PDF rating sheet...');
      const savedFilename = await generateEvaluationPdf({
        employee,
        cycle: targetCycle,
        supervisorName,
        qualitativeStrengths: targetCycle.strengths || currentEval.strengths,
        qualitativeRecommendations: targetCycle.recommendation || currentEval.recommendation,
      });
      setToastMsg(`Successfully generated and downloaded PDF: ${savedFilename}`);
    } catch (err) {
      console.error('Failed to generate evaluation PDF:', err);
      setToastMsg('PDF generation failed. Please try again.');
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

  const handleOpenOfficialRatingSheet = (evalCycle = viewingEvalCycle) => {
    const targetCycle = evalCycle || viewingEvalCycle;
    if (!targetCycle) return;
    const currentEval = getActiveEvalDetails();
    const scoreVal = Number(targetCycle.supervisorScore ?? targetCycle.finalGrade ?? employee?.latestScore ?? 85);
    const supervisorName =
      targetCycle.supervisorName ||
      (employee?.department && typeof employee.department === 'object' && employee.department.supervisor
        ? employee.department.supervisor.full_name
        : null) ||
      getDepartmentSupervisor(employee?.department);

    const singleSheet = {
      pageNumber: 1,
      weightLabel: 'Immediate Supervisor Evaluation (100%)',
      evaluatorRole: 'Immediate Supervisor',
      evaluatorName: supervisorName,
      evaluatorPosition: 'Department Head',
      evaluationDate: targetCycle.evaluationDate || 'Dec 18, 2026',
      scores: targetCycle.dimensionScores || generateCriteriaScores(scoreVal || 85),
      strengths: targetCycle.strengths || currentEval.strengths,
      recommendation: targetCycle.recommendation || currentEval.recommendation,
      rawScore: Math.round((scoreVal / 100) * 60),
      scaledScore: scoreVal,
    };

    setOfficialSheetData({
      employee,
      supervisorName,
      contractPeriod: targetCycle.periodDates || employee?.contractPeriod || 'Contract Evaluation Cycle',
      sheets: [singleSheet],
      evaluatorRole: 'Immediate Supervisor',
      evaluatorName: supervisorName,
      evaluatorPosition: 'Department Head',
      scores: singleSheet.scores,
      strengths: singleSheet.strengths,
      recommendation: singleSheet.recommendation,
      rawScore: singleSheet.rawScore,
      scaledScore: singleSheet.scaledScore,
    });
  };

  // 1. VIEW ATTENDANCE LOGS PAGE
  if (viewingAttendanceCycle) {
    return (
      <div>
        <AttendanceLogs
          currentUser={authUser}
          employeeId={employee.id}
          employeeName={employee.fullName}
          backLabel="Back to Personnel Record"
          onBack={handleCloseAttendance}
        />
      </div>
    );
  }

  // 1.5 VIEW MAR PAGE
  if (viewingMarCycle) {
    return (
      <div>
        <MonthlyReport
          employeeId={employee.id}
          employeeIdNumber={employee.idNumber}
          employeeName={employee.fullName}
          department={employee.department}
          cyclePeriod={viewingMarCycle.periodDates}
          backLabel="Back to Personnel Record"
          onBack={handleCloseMar}
          downloadLabel="Download DAR Report (PDF)"
        />
      </div>
    );
  }

  // 2. VIEW EVALUATION PAGE (Performance Evaluation with Evaluator Switcher)
  if (viewingEvalCycle) {
    const currentEval = getActiveEvalDetails();

    return (
      <div>
        {/* Top Header with Back Navigation & PDF Download */}
        <div className="flex-between" style={{ marginBottom: '18px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px' }}>Performance Evaluation Record: {employee.fullName}</h1>
            <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
              Contract Cycle: <b>{viewingEvalCycle.periodDates}</b> • Department: <b>{empDepartment}</b>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => handleDownloadEvaluationDoc(viewingEvalCycle)}
              disabled={isExportingPdf}
              title="Automatically generate and download official rating sheet PDF"
            >
              <FileDown size={14} /> {isExportingPdf ? 'Generating PDF...' : 'Download Evaluation (PDF)'}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ cursor: 'pointer' }}
              onClick={handleCloseEval}
            >
              ← Back to Historical Evaluations
            </button>
          </div>
        </div>

        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />



        {/* Subordinate Information & Performance Summary Banner */}

        <div className="card" style={{ marginBottom: '20px', padding: '18px 22px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>

            <div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>

                <span className="emp-id-chip" style={{ margin: 0 }}>

                  {employee.idNumber}

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



            {/* Final Weighted Grade */}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

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

            {/* Active Evaluator Header Info with Print Official Sheet button */}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>

              <div>

                <b style={{ fontSize: '15px', color: 'var(--ink-900)' }}>

                  {currentEval.title}

                </b>

                <div className="muted" style={{ fontSize: '12.5px', marginTop: '3px' }}>

                  <b>Evaluator:</b> {currentEval.evaluator}

                </div>

              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

                <span className="badge badge-dept" style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px' }}>

                  Template: {activeTemplate?.version || 'Form Series of 2026'}

                </span>

              </div>

            </div>



            {/* Rubric View without red alert panels */}

            <DynamicRubric

              key={`${viewingEvalCycle.id}_${activeEvaluatorTab}_${JSON.stringify(currentEval.scores || {})}`}

              employeeJobTitle={employee.jobTitle || 'Admin Aide'}

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

            {/* 5-Dimension Institutional AI Performance Dossier for Auditing */}
            <div style={{ marginBottom: '6px' }}>
              <AiPerformanceAnalysis
                aiSummary={effectiveAiSummary}
                totalDarEntries={effectiveAiSummary.productivitySummary?.totalTasks ?? 5}
                employeeName={employee.fullName}
                scrollable={false}
              />
            </div>

            {/* Immediate Supervisor Appraisal Summary Card */}
            <div className="card">
              <div className="card-title" style={{ margin: '0 0 12px', fontSize: '15px' }}>
                Immediate Supervisor Performance Evaluation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <span>Evaluator:</span>
                  <b>{viewingEvalCycle.supervisorName || currentEval.evaluator}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Official Recommendation:</span>
                  <b>{viewingEvalCycle.recommendation || 'Recommended for Renewal'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', fontSize: '14.5px', color: 'var(--green-700)', fontWeight: 800 }}>
                  <span>Performance Rating:</span>
                  <span>
                    {(viewingEvalCycle.supervisorScore ?? viewingEvalCycle.finalScore) != null
                      ? `${viewingEvalCycle.supervisorScore ?? viewingEvalCycle.finalScore}% (${viewingEvalCycle.interpretation || 'Evaluated'})`
                      : 'Pending Rating'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Official Rating Sheet Modal (1:1 EVSU Ormoc Campus Printable Format) */}

        <OfficialRatingSheetModal

          isOpen={!!officialSheetData}

          onClose={() => setOfficialSheetData(null)}

          employee={officialSheetData?.employee || employee}

          supervisorName={

            officialSheetData?.supervisorName ||

            getDepartmentSupervisor(employee.department)

          }

          contractPeriod={

            officialSheetData?.contractPeriod || viewingEvalCycle?.periodDates

          }

          sheets={officialSheetData?.sheets || null}

          evaluatorRole={officialSheetData?.evaluatorRole || 'Immediate Supervisor'}

          evaluatorName={

            officialSheetData?.evaluatorName ||

            getDepartmentSupervisor(employee.department)

          }

          evaluatorPosition={

            officialSheetData?.evaluatorPosition || 'Department Head'

          }

          scores={

            officialSheetData?.scores ||

            generateCriteriaScores(viewingEvalCycle?.supervisorScore || employee?.latestScore || 85)

          }

          strengths={officialSheetData?.strengths || ''}

          recommendation={

            officialSheetData?.recommendation || 'Recommended for Renewal'

          }

          rawScore={officialSheetData?.rawScore}

          scaledScore={officialSheetData?.scaledScore}

        />

      </div>

    );

  }



  // 3. MAIN VIEW: HISTORICAL EVALUATIONS TABLE

  return (

    <div>

      {/* Top Header with Back Navigation */}

      <div className="flex-between" style={{ marginBottom: '18px' }}>

        <div>

          <h1 style={{ margin: 0 }}>Personnel Record: {employee.fullName}</h1>

        </div>

        <button type="button" className="btn btn-sm" onClick={onBack} style={{ cursor: 'pointer' }}>

          {backLabel}

        </button>

      </div>



      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />



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

                <b>{employee.jobTitle || 'Admin Aide'}</b> • {employee.email} • {empDepartment}

              </div>

            </div>

          </div>



          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>

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

                <span style={{ fontWeight: 800, fontSize: '15px', color: getScoreInterpretationColor(effectiveLatestRating, effectiveLatestScore).color }}>

                  {effectiveLatestScore !== null && effectiveLatestScore !== undefined ? `${effectiveLatestScore} (${effectiveLatestRating || 'Evaluated'})` : 'Unrated'}

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

                {employee.contactNumber || 'Not provided'}

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

                {employee.officeLocation || 'Not provided'}

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

                {employee.alternateEmail || 'Not provided'}

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

                {employee.emergencyContact || 'Not provided'}

              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Current Active Contract Operational Records Card */}
      <div
        className="card"
        style={{
          marginBottom: '22px',
          padding: '16px 22px',
          background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%)',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#fdf2f2',
              border: '1px solid #fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-700)',
              flexShrink: 0,
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <b style={{ fontSize: '14.5px', color: 'var(--ink-900)' }}>
                Current Contract Term Logs
              </b>
              <span className="badge badge-active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                Active Term
              </span>
            </div>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
              Inspect live Daily Time Records (DTR) and accumulated Daily Accomplishment Reports (DAR) for the current contract window.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#fff',
              border: '1.5px solid var(--line)',
              borderRadius: '6px',
            }}
            onClick={() => handleOpenAttendance({ periodDates: 'Active Contract Period' })}
            title="Inspect current contract DTR and attendance punches"
          >
            <Calendar size={14} color="var(--brand-700)" />
            <span>Active Attendance Logs</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#fff',
              border: '1.5px solid var(--line)',
              borderRadius: '6px',
            }}
            onClick={() => handleOpenMar({ periodDates: 'Active Contract Period' })}
            title="Inspect current contract Daily Accomplishment Reports"
          >
            <FileText size={14} color="var(--brand-700)" />
            <span>Active DAR Logs</span>
          </button>
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



          {/* Performance Evaluation & MAR Metrics Grid */}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>

            {/* Immediate Supervisor */}

            <div style={{ background: '#fafbfc', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>

                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)' }}>

                  Supervisor Evaluation

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

      ) : historicalEvaluations.length === 1 ? (

        <div className="card" style={{ marginBottom: '22px', padding: '18px 22px', background: '#fafbfc', border: '1px solid var(--line)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

            <Award size={18} style={{ color: 'var(--brand-700)' }} />

            <div>

              <b style={{ fontSize: '14px', color: 'var(--ink-900)' }}>Performance Baseline Cycle</b>

              <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>

                This is the employee's first recorded contract evaluation. These results set the starting benchmark for future renewals.

              </p>

            </div>

          </div>

        </div>

      ) : null}



      {/* Historical Evaluations Data Table */}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>

          <div className="card-title" style={{ margin: 0, fontSize: '16px' }}>

            Historical Evaluations

          </div>

          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>

            Permanent evaluation audit log and downloadable PDF packages for completed contract evaluation cycles.

          </p>

        </div>



        {dbEvaluations === null && staticEvaluations.length === 0 ? (
          <div style={{ padding: '36px 24px', textAlign: 'center', background: '#fafbfc' }}>
            <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
              Loading performance evaluations on record...
            </p>
          </div>
        ) : historicalEvaluations.length === 0 ? (
          <div style={{ padding: '36px 24px', textAlign: 'center', background: '#fafbfc' }}>
            <p style={{ margin: '0 0 6px', fontSize: '14.5px', fontWeight: 700, color: 'var(--ink-900)' }}>
              No completed performance evaluations on record for this personnel yet.
            </p>
            <p className="muted" style={{ margin: '0 auto 18px', fontSize: '13px', maxWidth: '520px', lineHeight: 1.5 }}>
              The initial performance evaluation cycle for this personnel has not yet concluded. However, operational Daily Accomplishment Reports (DAR) and Attendance Logs are actively accessible below.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '7px 14px' }}
                onClick={() => handleOpenAttendance({ periodDates: 'Active Contract Period' })}
              >
                <Calendar size={14} />
                <span>View Attendance Logs</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '7px 14px' }}
                onClick={() => handleOpenMar({ periodDates: 'Active Contract Period' })}
              >
                <FileText size={14} />
                <span>View DAR Logs</span>
              </button>
            </div>
          </div>
        ) : (
        <table className="data-table">

          <thead>

            <tr>

              <th>Contract Cycle</th>

              <th>Final Grade & Trajectory</th>

              <th>Interpretation</th>

              <th style={{ textAlign: 'center' }}>Attendance Logs</th>
              <th style={{ textAlign: 'center' }}>DARs Document</th>

              <th style={{ textAlign: 'center' }}>Evaluation Record</th>

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
                    className="btn btn-sm btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenAttendance(evalItem)}
                    title={`View Attendance Logs for ${evalItem.periodDates}`}
                  >
                    <Calendar size={13} /> View Attendance
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
                    onClick={() => handleOpenMar(evalItem)}
                    title={`View Accumulated DARs for ${evalItem.periodDates}`}
                  >
                    <FileText size={13} /> View DARs
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

                    onClick={() => handleOpenEval(evalItem)}

                    title={`View Evaluation Record for ${evalItem.periodDates}`}

                  >

                    <ClipboardCheck size={13} /> View Evaluation

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>
        )}

      </div>



      {/* Official Rating Sheet Modal (1:1 EVSU Ormoc Campus Printable Format) */}

      <OfficialRatingSheetModal

        isOpen={!!officialSheetData}

        onClose={() => setOfficialSheetData(null)}

        employee={officialSheetData?.employee || employee}

        supervisorName={

          officialSheetData?.supervisorName ||

          getDepartmentSupervisor(employee.department)

        }

        contractPeriod={

          officialSheetData?.contractPeriod || viewingEvalCycle?.periodDates

        }

        sheets={officialSheetData?.sheets || null}

        evaluatorRole={officialSheetData?.evaluatorRole || 'Immediate Supervisor'}

        evaluatorName={

          officialSheetData?.evaluatorName ||

          getDepartmentSupervisor(employee.department)

        }

        evaluatorPosition={

          officialSheetData?.evaluatorPosition || 'Department Head'

        }

        scores={

          officialSheetData?.scores ||

          generateCriteriaScores(viewingEvalCycle?.supervisorScore || employee?.latestScore || 85)

        }

        strengths={officialSheetData?.strengths || ''}

        recommendation={

          officialSheetData?.recommendation || 'Recommended for Renewal'

        }

        rawScore={officialSheetData?.rawScore}

        scaledScore={officialSheetData?.scaledScore}

      />

    </div>

  );

}

