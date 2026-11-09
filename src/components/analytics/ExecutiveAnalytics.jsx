import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Building2,
  Calendar,
  Download,
  BarChart3,
  ChevronRight,
  ArrowLeft,
  Layers,
  Filter,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { getDepartmentDomain } from '../../utils/departments';

export default function ExecutiveAnalytics({
  onBack = () => {},
  onNavigate = () => {},
}) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(10); // Default to active month (November 2026)
  const chartScrollRef = React.useRef(null);
  const [hoveredPeriodIndex, setHoveredPeriodIndex] = useState(null);
  const [activeDrilldownDomain, setActiveDrilldownDomain] = useState(null); // null = All Campus Domains, or 'academic' | 'administrative' | 'student_services' | 'extension_operations'
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSeries = (id) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < (activeSeriesList?.length || 4) - 1) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const handleSelectDrilldownDomain = (domainKey) => {
    setActiveDrilldownDomain(domainKey);
    setHiddenSeries(new Set());
    setTimeout(() => {
      updateViewportScroll(selectedPeriodIndex, true);
    }, 40);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async (yr = selectedYear) => {
      try {
        setIsLoading(true);
        const data = await api.analytics.getExecutiveAnalytics(yr);
        if (isMounted && data) {
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Failed to load executive analytics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchAnalytics(selectedYear);
    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  // 12-Month Calendar Timeline (Jan – Dec, with Nov as current active evaluation month)
  const defaultMonths = [
    { id: 'jan', key: 'jan', label: 'Jan', fullName: 'January', index: 0, contractType: 'Monthly Eval' },
    { id: 'feb', key: 'feb', label: 'Feb', fullName: 'February', index: 1, contractType: 'Monthly Eval' },
    { id: 'mar', key: 'mar', label: 'Mar', fullName: 'March', index: 2, contractType: 'Monthly Eval' },
    { id: 'apr', key: 'apr', label: 'Apr', fullName: 'April', index: 3, contractType: 'Monthly Eval' },
    { id: 'may', key: 'may', label: 'May', fullName: 'May', index: 4, contractType: 'Monthly Eval' },
    { id: 'jun', key: 'jun', label: 'Jun', fullName: 'June', index: 5, contractType: 'Monthly Eval' },
    { id: 'jul', key: 'jul', label: 'Jul', fullName: 'July', index: 6, contractType: 'Monthly Eval' },
    { id: 'aug', key: 'aug', label: 'Aug', fullName: 'August', index: 7, contractType: 'Monthly Eval' },
    { id: 'sep', key: 'sep', label: 'Sep', fullName: 'September', index: 8, contractType: 'Monthly Eval' },
    { id: 'oct', key: 'oct', label: 'Oct', fullName: 'October', index: 9, contractType: 'Monthly Eval' },
    { id: 'nov', key: 'nov', label: 'Nov', fullName: 'November', index: 10, isActive: true, contractType: 'Active Month' },
    { id: 'dec', key: 'dec', label: 'Dec', fullName: 'December', index: 11, contractType: 'Upcoming Month' },
  ];
  const defaultEvaluationPeriods = defaultMonths;

  const defaultDomainTrajectories = [
    {
      id: 'academic',
      name: 'Academic Departments',
      code: 'ACAD',
      color: '#2563eb',
      points: [84.2, 85.0, 84.6, 85.8, 86.2, 87.4, 86.8, 87.5, 88.2, 88.9, 89.4],
      deptCount: 5,
    },
    {
      id: 'administrative',
      name: 'Administrative & Fiscal Services',
      code: 'ADMIN',
      color: '#800020',
      points: [82.0, 82.5, 82.8, 83.4, 84.0, 84.6, 84.0, 84.8, 85.2, 85.8, 86.4],
      deptCount: 5,
    },
    {
      id: 'student_services',
      name: 'Student Support & Services',
      code: 'STUDENT',
      color: '#059669',
      points: [80.5, 81.2, 81.6, 82.2, 82.8, 83.5, 83.0, 83.6, 84.0, 84.3, 84.8],
      deptCount: 5,
    },
    {
      id: 'extension_operations',
      name: 'Extension & Operations',
      code: 'EXT/OPS',
      color: '#7c3aed',
      points: [78.6, 79.4, 79.8, 80.5, 81.2, 82.0, 81.4, 82.2, 82.6, 83.0, 83.4],
      deptCount: 7,
    },
  ];

  // Department-Level Trajectories across 11 Months (Jan – Nov Active)
  const defaultDepartmentTrajectories = {
    academic: [
      {
        id: 15,
        name: 'Computer Studies Department',
        code: 'CSD',
        color: '#2563eb',
        points: [84.5, 85.2, 84.8, 86.0, 86.5, 87.6, 87.0, 87.8, 88.4, 89.1, 89.6],
      },
      {
        id: 17,
        name: 'Engineering Department',
        code: 'ENGG',
        color: '#0284c7',
        points: [82.8, 83.4, 83.0, 84.2, 84.6, 85.5, 85.0, 85.6, 86.0, 86.4, 86.8],
      },
      {
        id: 8,
        name: 'Technology Department',
        code: 'TECH',
        color: '#0d9488',
        points: [81.2, 82.0, 81.6, 82.6, 83.0, 84.0, 83.5, 84.2, 84.8, 85.0, 85.4],
      },
      {
        id: 11,
        name: 'Education Department',
        code: 'EDUC',
        color: '#4f46e5',
        points: [80.5, 81.2, 80.8, 82.0, 82.5, 83.4, 83.0, 83.8, 84.2, 84.6, 85.0],
      },
      {
        id: 19,
        name: 'Hospitality & Tourism Management',
        code: 'HTM',
        color: '#0891b2',
        points: [79.8, 80.6, 80.2, 81.2, 81.8, 82.6, 82.2, 83.0, 83.6, 83.9, 84.2],
      },
    ],
    administrative: [
      {
        id: 18,
        name: 'Administrative and Finance',
        code: 'ADMIN/FIN',
        color: '#800020',
        points: [82.2, 82.8, 83.0, 83.6, 84.2, 84.8, 84.4, 85.0, 85.6, 86.2, 86.8],
      },
      {
        id: 14,
        name: 'Campus Director Office',
        code: 'CDO',
        color: '#991b1b',
        points: [81.8, 82.4, 82.6, 83.2, 83.8, 84.4, 84.0, 84.6, 85.2, 85.8, 86.4],
      },
      {
        id: 1,
        name: 'Disbursing / Cashier Office',
        code: 'CASHIER',
        color: '#b91c1c',
        points: [81.0, 81.6, 81.8, 82.4, 83.0, 83.6, 83.2, 83.8, 84.5, 85.0, 85.6],
      },
      {
        id: 2,
        name: 'HRMDO Office',
        code: 'HRMDO',
        color: '#c026d3',
        points: [82.5, 83.0, 83.4, 84.0, 84.6, 85.2, 84.8, 85.5, 86.0, 86.6, 87.2],
      },
      {
        id: 12,
        name: 'Procurement Office',
        code: 'PROCURE',
        color: '#a21caf',
        points: [80.2, 80.8, 81.2, 81.8, 82.4, 83.0, 82.6, 83.4, 84.0, 84.5, 85.0],
      },
    ],
    student_services: [
      {
        id: 20,
        name: 'Library Office',
        code: 'LIBRARY',
        color: '#059669',
        points: [81.5, 82.0, 82.4, 83.0, 83.5, 84.2, 83.8, 84.5, 85.0, 85.5, 86.0],
      },
      {
        id: 16,
        name: 'SASO Office',
        code: 'SASO',
        color: '#16a34a',
        points: [80.5, 81.2, 81.5, 82.0, 82.6, 83.4, 83.0, 83.6, 84.2, 84.7, 85.1],
      },
      {
        id: 3,
        name: 'School Clinic',
        code: 'CLINIC',
        color: '#10b981',
        points: [79.8, 80.4, 80.8, 81.4, 82.0, 82.6, 82.2, 82.8, 83.4, 83.9, 84.3],
      },
      {
        id: 9,
        name: 'Guidance Office',
        code: 'GUIDANCE',
        color: '#14b8a6',
        points: [79.2, 79.8, 80.2, 80.8, 81.4, 82.2, 81.8, 82.5, 83.0, 83.5, 83.9],
      },
      {
        id: 21,
        name: 'Registrar Office',
        code: 'REGISTRAR',
        color: '#047857',
        points: [80.0, 80.6, 81.0, 81.6, 82.2, 83.0, 82.5, 83.2, 83.8, 84.2, 84.7],
      },
    ],
    extension_operations: [
      {
        id: 22,
        name: 'Maintenance/Janitorial (MESO) Office',
        code: 'MESO',
        color: '#7c3aed',
        points: [79.5, 80.2, 80.6, 81.2, 81.8, 82.6, 82.0, 82.8, 83.2, 83.7, 84.2],
      },
      {
        id: 10,
        name: 'Extension Service Office',
        code: 'EXTENSION',
        color: '#6d28d9',
        points: [78.8, 79.4, 79.8, 80.4, 81.0, 81.8, 81.2, 82.0, 82.5, 83.0, 83.6],
      },
      {
        id: 5,
        name: 'Research Office',
        code: 'RESEARCH',
        color: '#9333ea',
        points: [79.0, 79.6, 80.0, 80.6, 81.2, 82.0, 81.5, 82.2, 82.8, 83.3, 83.8],
      },
      {
        id: 6,
        name: 'Sports And Development Office',
        code: 'SPORTS',
        color: '#8b5cf6',
        points: [78.2, 78.8, 79.2, 79.8, 80.4, 81.2, 80.8, 81.5, 82.0, 82.5, 83.0],
      },
      {
        id: 7,
        name: 'Quality Assurance & Accreditation Office',
        code: 'QA/QAAO',
        color: '#a855f7',
        points: [80.0, 80.6, 81.0, 81.8, 82.4, 83.2, 82.8, 83.5, 84.0, 84.5, 84.9],
      },
      {
        id: 4,
        name: 'IPDO Office',
        code: 'IPDO',
        color: '#6366f1',
        points: [77.8, 78.4, 78.8, 79.4, 80.0, 80.8, 80.4, 81.0, 81.6, 82.1, 82.6],
      },
      {
        id: 13,
        name: 'IGP Office',
        code: 'IGP',
        color: '#7e22ce',
        points: [77.2, 77.8, 78.2, 78.8, 79.4, 80.2, 79.8, 80.5, 81.0, 81.5, 82.0],
      },
    ],
  };

  // Highest-Performing Departments Leaderboard Data
  const defaultLeaderboard = [
    {
      rank: 1,
      name: 'Computer Studies Department',
      headcount: 12,
      avgScore: 89.1,
      statusLabel: 'Very Satisfactory',
      evalCompletedCount: 12,
      totalEvals: 12,
      completionRate: 100,
      badgeColor: '#15803d',
      badgeBg: '#f0fdf4',
    },
    {
      rank: 2,
      name: 'Engineering Department',
      headcount: 8,
      avgScore: 86.4,
      statusLabel: 'Very Satisfactory',
      evalCompletedCount: 7,
      totalEvals: 8,
      completionRate: 87.5,
      badgeColor: '#15803d',
      badgeBg: '#f0fdf4',
    },
    {
      rank: 3,
      name: 'Technology Department',
      headcount: 10,
      avgScore: 84.8,
      statusLabel: 'Very Satisfactory',
      evalCompletedCount: 8,
      totalEvals: 10,
      completionRate: 80.0,
      badgeColor: '#15803d',
      badgeBg: '#f0fdf4',
    },
    {
      rank: 4,
      name: 'Library Office',
      headcount: 6,
      avgScore: 83.2,
      statusLabel: 'Very Satisfactory',
      evalCompletedCount: 5,
      totalEvals: 6,
      completionRate: 83.3,
      badgeColor: '#15803d',
      badgeBg: '#f0fdf4',
    },
    {
      rank: 5,
      name: 'Maintenance/Janitorial (MESO) Office',
      headcount: 5,
      avgScore: 78.5,
      statusLabel: 'Satisfactory',
      evalCompletedCount: 4,
      totalEvals: 5,
      completionRate: 80.0,
      badgeColor: '#0284c7',
      badgeBg: '#f0f9ff',
    },
  ];

  // Outstanding Employees Spotlight (Employees scoring >= 90.0 or top performers)
  const defaultOutstandingEmployees = [
    {
      id: 1,
      name: 'Jorge Mikhael Gubantes',
      empId: 'G10222026JMR',
      department: 'Computer Studies Department',
      role: 'COS Technical Assistant',
      score: 92.4,
      ratingLabel: 'Outstanding',
      darsVerified: 84,
      retentionStatus: 'Strongly Recommended for Renewal',
      highlight: 'Zero defect rate in campus workstation deployments and proactive clearance backlog clearing.',
    },
    {
      id: 2,
      name: 'Ian Joseph Ranoco',
      empId: 'R10222026IJM',
      department: 'Computer Studies Department',
      role: 'COS Admin Aide',
      score: 88.6,
      ratingLabel: 'Very Satisfactory',
      darsVerified: 76,
      retentionStatus: 'Recommended for Renewal',
      highlight: 'Demonstrates strong organizational skills and dependable support during university accreditation cycles.',
    },
    {
      id: 3,
      name: 'Elena Vasquez',
      empId: 'V10222026ELV',
      department: 'Library Office',
      role: 'COS Records Custodian',
      score: 89.6,
      ratingLabel: 'Very Satisfactory',
      darsVerified: 88,
      retentionStatus: 'Recommended for Renewal',
      highlight: 'Digitized over 2,400 monograph accession records with 100% verification accuracy.',
    },
    {
      id: 4,
      name: 'Mark Anthony Reyes',
      empId: 'A10222026MTR',
      department: 'Computer Studies Department',
      role: 'COS Laboratory Custodian',
      score: 89.2,
      ratingLabel: 'Very Satisfactory',
      darsVerified: 72,
      retentionStatus: 'Recommended for Renewal',
      highlight: 'High milestone throughput in hardware diagnostics across Computer Studies Department laboratories.',
    },
  ];

  // University-Wide Rating Distribution (Aligned with Official HR Criteria)
  const defaultRatingDistribution = [
    { label: 'Outstanding (90 – 100)', count: 6, pct: 22.2, color: '#16a34a' },
    { label: 'Very Satisfactory (80 – 89)', count: 17, pct: 63.0, color: '#2563eb' },
    { label: 'Satisfactory (70 – 79)', count: 3, pct: 11.1, color: '#0284c7' },
    { label: 'Needs Improvement (60 – 69)', count: 1, pct: 3.7, color: '#f59e0b' },
    { label: 'Unsatisfactory (Below 60)', count: 0, pct: 0.0, color: '#dc2626' },
  ];

  // Derive dynamic state from API response with fallback
  const evaluationPeriods =
    analyticsData?.evaluationPeriods || defaultEvaluationPeriods;
  const domainTrajectories =
    analyticsData?.domainTrajectories || defaultDomainTrajectories;
  const departmentTrajectories =
    analyticsData?.departmentTrajectories || defaultDepartmentTrajectories;

  const currentDomainMeta = defaultDomainTrajectories.find((d) => d.id === activeDrilldownDomain);

  // Active series depends on drill-down mode: Domain Overview or Specific Department Breakdown
  const activeSeriesList = activeDrilldownDomain
    ? departmentTrajectories[activeDrilldownDomain] || []
    : domainTrajectories;

  // SVG Chart Geometry calculations (50 – 100 CSC scale, scrollable with half-scale viewport)
  const colWidth = 140; // Width per month column for clean 12-month spacing
  const paddingLeft = 145; // Width of left frozen Y-axis pane
  const colOffset = 45; // Offset for first month column
  const paddingRight = 120;
  const paddingTop = 32;
  const paddingBottom = 54;
  const chartHeight = 560; // Total height for 50-100 scale (every 10 points = 100px; 340px viewport sees ~25 points)
  
  // Total chart width for 12 months
  const chartWidth = Math.max(1600, paddingLeft + colOffset + (evaluationPeriods.length - 1) * colWidth + paddingRight);
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Official CSC SPMS Performance Rating Scale (50 – 100)
  const minY = 50;
  const maxY = 100;

  const yAxisItems = [
    { value: 100, isBenchmark: false },
    { value: 95, isBenchmark: false },
    { value: 90, status: 'Outstanding', isBenchmark: true },
    { value: 85, isBenchmark: false },
    { value: 80, status: 'Very Satisfactory', isBenchmark: true },
    { value: 75, isBenchmark: false },
    { value: 70, status: 'Satisfactory', isBenchmark: true },
    { value: 65, isBenchmark: false },
    { value: 60, status: 'Needs Improvement', isBenchmark: true },
    { value: 55, isBenchmark: false },
    { value: 50, status: 'Unsatisfactory', isBenchmark: true },
  ];

  const getX = (index) => paddingLeft + colOffset + index * colWidth;
  const getY = (val) => paddingTop + innerHeight - ((val - minY) / (maxY - minY)) * innerHeight;

  // Active Month Index is 10 (November in Year 2026)
  const activeMonthIndex = 10;
  const currentMonthData = evaluationPeriods[selectedPeriodIndex] || evaluationPeriods[activeMonthIndex];
  const currentMonthName = currentMonthData?.fullName || currentMonthData?.label || 'November';

  // Dynamic Institutional Average for the Selected Month
  const institutionalAverage = React.useMemo(() => {
    const vals = domainTrajectories.map((d) => d.points[selectedPeriodIndex] ?? d.points[d.points.length - 1]);
    if (vals.length === 0) return 86.4;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }, [domainTrajectories, selectedPeriodIndex]);

  const institutionalRating =
    institutionalAverage >= 90
      ? 'Outstanding'
      : institutionalAverage >= 80
      ? 'Very Satisfactory'
      : institutionalAverage >= 70
      ? 'Satisfactory'
      : 'Needs Improvement';

  // Dynamic Department Performance Leaderboard for the Selected Month
  const departmentLeaderboard = React.useMemo(() => {
    const allDepts = Object.entries(departmentTrajectories).flatMap(([domKey, depts]) =>
      depts.map((d) => {
        const score = d.points[selectedPeriodIndex] ?? d.points[d.points.length - 1];
        const ratingLabel =
          score >= 90
            ? 'Outstanding'
            : score >= 80
            ? 'Very Satisfactory'
            : score >= 70
            ? 'Satisfactory'
            : score >= 60
            ? 'Needs Improvement'
            : 'Unsatisfactory';
        const badgeColor = score >= 90 ? '#15803d' : score >= 80 ? '#15803d' : '#0284c7';
        const badgeBg = score >= 80 ? '#f0fdf4' : '#f0f9ff';
        const headcount = d.id === 15 ? 12 : d.id === 17 ? 8 : d.id === 8 ? 10 : d.id === 20 ? 6 : 5;
        const totalEvals = headcount;
        const evalCompletedCount = Math.max(1, Math.round(headcount * (score / 95)));
        const completionRate = Math.min(100, Math.round((evalCompletedCount / totalEvals) * 100));

        return {
          id: d.id,
          name: d.name,
          code: d.code,
          domain: domKey,
          avgScore: score,
          statusLabel: ratingLabel,
          badgeColor,
          badgeBg,
          headcount,
          totalEvals,
          evalCompletedCount,
          completionRate,
        };
      })
    );

    allDepts.sort((a, b) => b.avgScore - a.avgScore);
    return allDepts.slice(0, 5).map((dept, index) => ({
      ...dept,
      rank: index + 1,
    }));
  }, [departmentTrajectories, selectedPeriodIndex]);

  // Dynamic Outstanding Employees Spotlight for the Selected Month
  const outstandingEmployees = React.useMemo(() => {
    const base = analyticsData?.outstandingEmployees || defaultOutstandingEmployees;
    const novAvg = 86.4;
    const delta = institutionalAverage - novAvg;

    return base.map((emp) => {
      const score = Math.max(75, Math.min(100, Math.round((emp.score + delta) * 10) / 10));
      const ratingLabel = score >= 90 ? 'Outstanding' : 'Very Satisfactory';
      return {
        ...emp,
        score,
        ratingLabel,
      };
    });
  }, [analyticsData, defaultOutstandingEmployees, institutionalAverage]);

  // Dynamic Rating Distribution for the Selected Month across all 22 Departments
  const ratingDistribution = React.useMemo(() => {
    const allDepts = Object.values(departmentTrajectories).flat();
    const total = allDepts.length || 22;
    let outstanding = 0;
    let verySat = 0;
    let sat = 0;
    let needsImp = 0;
    let unsat = 0;

    allDepts.forEach((d) => {
      const s = d.points[selectedPeriodIndex] ?? 85;
      if (s >= 90) outstanding++;
      else if (s >= 80) verySat++;
      else if (s >= 70) sat++;
      else if (s >= 60) needsImp++;
      else unsat++;
    });

    return [
      { label: 'Outstanding (90 – 100)', count: outstanding, pct: Math.round((outstanding / total) * 1000) / 10, color: '#16a34a' },
      { label: 'Very Satisfactory (80 – 89.9)', count: verySat, pct: Math.round((verySat / total) * 1000) / 10, color: '#2563eb' },
      { label: 'Satisfactory (70 – 79.9)', count: sat, pct: Math.round((sat / total) * 1000) / 10, color: '#0284c7' },
      { label: 'Needs Improvement (60 – 69.9)', count: needsImp, pct: Math.round((needsImp / total) * 1000) / 10, color: '#f59e0b' },
      { label: 'Unsatisfactory (Below 60)', count: unsat, pct: Math.round((unsat / total) * 1000) / 10, color: '#dc2626' },
    ];
  }, [departmentTrajectories, selectedPeriodIndex]);

  const totalAssessed = analyticsData?.totalAssessed ?? 27;

  // Unified 2D Scroll Function: guarantees atomic horizontal right-side anchoring & vertical autocenter
  const updateViewportScroll = (periodIdx = selectedPeriodIndex, smooth = false) => {
    if (!chartScrollRef.current) return;
    const container = chartScrollRef.current;
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);

    // Vertical target: autocenter around average ratings of selected period
    const seriesToMeasure = activeSeriesList.filter((s) => !hiddenSeries.has(s.id));
    let targetTop = 0;
    if (seriesToMeasure.length > 0) {
      const scores = seriesToMeasure.map((s) => s.points[periodIdx] ?? 85);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const targetY = getY(avgScore);
      const viewportH = container.clientHeight || 340;
      targetTop = Math.max(0, targetY - viewportH / 2 + 27);
    }

    // Horizontal target:
    // If viewing the current active month (default): always anchor firmly to the far right
    // If inspecting an older month: center horizontally on that month's column
    const isLatest = periodIdx >= activeMonthIndex;
    let targetLeft = maxScrollLeft;
    if (!isLatest) {
      const colX = getX(periodIdx);
      const viewportW = container.clientWidth || 900;
      targetLeft = Math.max(0, Math.min(maxScrollLeft, colX - viewportW / 2));
    }

    container.scrollTo({
      left: targetLeft,
      top: targetTop,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Mount effect: multiple-pass enforcement ensures canvas is anchored on the right after full browser layout reflow
  useEffect(() => {
    updateViewportScroll(selectedPeriodIndex, false);
    const rAF = requestAnimationFrame(() => {
      updateViewportScroll(selectedPeriodIndex, false);
    });
    const t1 = setTimeout(() => updateViewportScroll(selectedPeriodIndex, false), 50);
    const t2 = setTimeout(() => updateViewportScroll(selectedPeriodIndex, false), 150);
    const t3 = setTimeout(() => updateViewportScroll(selectedPeriodIndex, false), 350);
    return () => {
      cancelAnimationFrame(rAF);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Re-anchor when live backend data updates
  useEffect(() => {
    if (analyticsData) {
      requestAnimationFrame(() => {
        updateViewportScroll(selectedPeriodIndex, false);
      });
      const t = setTimeout(() => updateViewportScroll(selectedPeriodIndex, false), 80);
      return () => clearTimeout(t);
    }
  }, [analyticsData]);

  // Window resize handler: keeps active cycle in view
  useEffect(() => {
    const handleResize = () => {
      if (selectedPeriodIndex >= activeMonthIndex) {
        updateViewportScroll(selectedPeriodIndex, false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedPeriodIndex, evaluationPeriods.length]);

  // Export Executive Analytics Summary to CSV
  const handleExportCsv = () => {
    const csvRows = [
      ['EASTERN VISAYAS STATE UNIVERSITY - HRMO EXECUTIVE PERFORMANCE ANALYTICS'],
      ['Reporting Context', `Contract of Service (COS) Evaluation Periods (Current Active: Oct–Mar 2026/27)`],
      ['Institutional Average Score', `${institutionalAverage} / 100 (${institutionalRating})`],
      ['Total Assessed Personnel', `${totalAssessed} COS Subordinates`],
      [],
      ['CONTRACT EVALUATION PERIOD PERFORMANCE (SCALE: 70 - 100)'],
      ['Series Code', 'Entity Name', 'Classification', ...evaluationPeriods.map((p) => p.label)],
      ...domainTrajectories.map((s) => [
        s.code,
        `"${s.name}"`,
        'Governance Domain',
        ...s.points,
      ]),
      [],
      ['DEPARTMENT-LEVEL BREAKDOWN BY GOVERNANCE DOMAIN'],
      ['Domain Key', 'Dept Code', 'Department Name', ...evaluationPeriods.map((p) => p.label)],
      ...Object.entries(departmentTrajectories).flatMap(([domKey, depts]) =>
        depts.map((d) => [
          domKey,
          d.code,
          `"${d.name}"`,
          ...d.points,
        ])
      ),
      [],
      ['DEPARTMENT PERFORMANCE LEADERBOARD'],
      ['Rank', 'Department', 'COS Headcount', 'Avg Score', 'Rating', 'Eval Completion %'],
      ...departmentLeaderboard.map((d) => [
        d.rank,
        `"${d.name}"`,
        d.headcount,
        d.avgScore,
        d.statusLabel,
        `${d.completionRate}%`,
      ]),
      [],
      ['OUTSTANDING EMPLOYEES SPOTLIGHT'],
      ['Employee ID', 'Full Name', 'Department', 'Role', 'Aggregated Score', 'Rating Category'],
      ...outstandingEmployees.map((e) => [
        e.empId,
        `"${e.name}"`,
        `"${e.department}"`,
        `"${e.role}"`,
        e.score,
        e.ratingLabel,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EVSU_Executive_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Smooth Catmull-Rom to Cubic Bezier curve path generator
  const getSmoothCurvePath = (pointsArray) => {
    if (!pointsArray || pointsArray.length === 0) return '';
    const pts = pointsArray.map((val, i) => ({ x: getX(i), y: getY(val) }));
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  // Vertical spacing helper to prevent endpoint label overlap when multiple departments have close scores
  const getSpacedYMap = (seriesList) => {
    const visible = seriesList.filter((s) => !hiddenSeries.has(s.id));
    const sorted = visible
      .map((s) => ({ id: s.id, y: getY(s.points[s.points.length - 1]) }))
      .sort((a, b) => a.y - b.y);

    const minGap = 13;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].y - sorted[i - 1].y < minGap) {
        sorted[i].y = sorted[i - 1].y + minGap;
      }
    }
    const map = {};
    sorted.forEach((item) => {
      map[item.id] = item.y;
    });
    return map;
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={26} color="var(--brand-700)" />
            Executive Performance Analytics
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            High-level institutional insight into Eastern Visayas State University Contract of Service (COS) performance standards.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleExportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            title="Download institutional executive metrics (CSV)"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onBack}
            style={{ cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Contract Evaluation Period Performance Trend Chart */}
      <div className="card" style={{ padding: '22px 24px', marginBottom: '24px' }}>
        {/* Chart Header */}
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: 'var(--ink-900)' }}>
            {activeDrilldownDomain ? (
              <span>
                Performance Trajectory:{' '}
                <span style={{ color: currentDomainMeta?.color || 'var(--brand-700)' }}>
                  {currentDomainMeta?.name}
                </span>{' '}
                <span className="muted" style={{ fontSize: '15px', fontWeight: 600 }}>
                  ({activeSeriesList.length} Units)
                </span>
              </span>
            ) : (
              'Performance Trajectory by Campus Governance Domain'
            )}
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            {activeDrilldownDomain
              ? `Individual department evaluation standing across Contract of Service (COS) evaluation periods for ${currentDomainMeta?.name}.`
              : 'Official COS contract evaluation period trajectories across campus domains (Scale: 70 – 100). Click any domain tab below to inspect individual department units.'}
          </p>
        </div>

        {/* Dedicated Domain Scope Navigation Bar (Always full width, perfectly positioned) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Domain Scope:
            </span>
            <button
              type="button"
              onClick={() => handleSelectDrilldownDomain(null)}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: '1.5px solid',
                borderColor: activeDrilldownDomain === null ? 'var(--brand-700)' : '#cbd5e1',
                background: activeDrilldownDomain === null ? 'var(--brand-700)' : '#ffffff',
                color: activeDrilldownDomain === null ? '#ffffff' : 'var(--ink-700)',
                cursor: 'pointer',
                boxShadow: activeDrilldownDomain === null ? '0 1px 3px rgba(128,0,32,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              All Campus Domains
            </button>
            {defaultDomainTrajectories.map((dom) => {
              const isActive = activeDrilldownDomain === dom.id;
              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => handleSelectDrilldownDomain(dom.id)}
                  title={`Inspect department units under ${dom.name}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1.5px solid',
                    borderColor: isActive ? dom.color : '#e2e8f0',
                    background: isActive ? `${dom.color}15` : '#ffffff',
                    color: isActive ? dom.color : 'var(--ink-800)',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 1px 3px ${dom.color}25` : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: dom.color,
                    }}
                  />
                  <span>{dom.code}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            {hiddenSeries.size > 0 && (
              <button
                type="button"
                onClick={() => setHiddenSeries(new Set())}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-700)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
              >
                Reset Filter ({activeSeriesList.length})
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)' }}>
                Calendar Year:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: 'var(--brand-700)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="2026">Year 2026 (Active)</option>
                <option value="2025">Year 2025</option>
                <option value="2024">Year 2024</option>
              </select>
            </div></div>
        </div>

        {/* Unified Period Inspection & Interactive Legend Tab (Positioned at Top) */}
        <div
          style={{
            padding: '12px 18px',
            background: '#f8fafc',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12.5px',
          }}
        >
          {/* Left: Interactive Performance Legend Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: 'var(--ink-900)', fontSize: '13.5px' }}>
              Interactive Performance Legend
            </span>

            {selectedPeriodIndex !== activeMonthIndex && (
              <button
                type="button"
                onClick={() => {
                  const activeIdx = activeMonthIndex;
                  setSelectedPeriodIndex(activeIdx);
                  updateViewportScroll(lastIdx, true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-700)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 6px',
                }}
              >
                Return to Active Month (Nov 2026)
              </button>
            )}
          </div>

          {/* Right: Interactive Series Badges with Toggle Functionality + Reset Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {activeSeriesList.map((s) => {
              const isHidden = hiddenSeries.has(s.id);
              const val = s.points[selectedPeriodIndex];
              const ratingLabel =
                val >= 90
                  ? 'Outstanding'
                  : val >= 80
                  ? 'Very Satisfactory'
                  : val >= 70
                  ? 'Satisfactory'
                  : 'Needs Improvement';

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSeries(s.id)}
                  title={`Click to ${isHidden ? 'display' : 'hide'} ${s.name} line on chart`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#ffffff',
                    border: `1.5px solid ${isHidden ? '#cbd5e1' : s.color}`,
                    borderRadius: '6px',
                    boxShadow: isHidden ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    opacity: isHidden ? 0.45 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isHidden ? '#cbd5e1' : s.color,
                    }}
                  />
                  <span style={{ fontWeight: 700, color: isHidden ? '#94a3b8' : 'var(--ink-800)', fontSize: '11.5px' }}>
                    {s.code}:
                  </span>
                  <span style={{ fontWeight: 800, color: isHidden ? '#94a3b8' : s.color, fontSize: '12px' }}>
                    {val}
                  </span>
                  <span className="muted" style={{ fontSize: '11px', color: isHidden ? '#cbd5e1' : undefined }}>
                    ({ratingLabel})
                  </span>
                </button>
              );
            })}

            {hiddenSeries.size > 0 && (
              <button
                type="button"
                onClick={() => setHiddenSeries(new Set())}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-700)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
              >
                Reset Filter ({activeSeriesList.length})
              </button>
            )}
          </div>
        </div>

        {/* CSS for Styled Visible Scrollbars and Sticky Panes */}
        <style>{`
          .perf-chart-viewport {
            width: 100%;
            height: 340px;
            overflow-x: auto;
            overflow-y: auto;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #ffffff;
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #f1f5f9;
            position: relative;
          }
          .perf-chart-viewport::-webkit-scrollbar {
            width: 9px;
            height: 9px;
          }
          .perf-chart-viewport::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .perf-chart-viewport::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 4px;
            border: 2px solid #f1f5f9;
          }
          .perf-chart-viewport::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
        `}</style>

        {/* 2-Way Scrollable Timeline & Scale Viewport with Sticky Frozen Axes (Option A) */}
        <div
          ref={chartScrollRef}
          className="perf-chart-viewport"
        >
          {/* Scrollable Canvas Area: ${chartWidth}px by ${chartHeight}px */}
          <div
            style={{
              position: 'relative',
              width: `${chartWidth}px`,
              height: `${chartHeight}px`,
              minWidth: `${chartWidth}px`,
              minHeight: `${chartHeight}px`,
            }}
          >
            {/* 1. Main Background SVG: Gridlines, curves, markers, endpoint badges */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${chartWidth}px`,
                height: `${chartHeight}px`,
                display: 'block',
              }}
            >
              {/* Horizontal Gridlines across the entire canvas */}
              {yAxisItems.map((item) => {
                const y = getY(item.value);
                return (
                  <line
                    key={item.value}
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={item.isBenchmark ? '4 3' : 'none'}
                  />
                );
              })}

              {/* Vertical Column Guidelines for each evaluation period */}
              {evaluationPeriods.map((p, idx) => {
                const x = getX(idx);
                const isSelected = selectedPeriodIndex === idx;
                const isActiveCycle = idx === (evaluationPeriods.length - 1);
                return (
                  <line
                    key={p.id}
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + innerHeight}
                    stroke={isSelected ? 'rgba(219, 39, 119, 0.25)' : isActiveCycle ? 'rgba(37, 99, 235, 0.2)' : '#f8fafc'}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Active Contract Cycle Operational Marker at the latest index */}
              <g>
                <line
                  x1={getX(activeMonthIndex)}
                  y1={paddingTop}
                  x2={getX(activeMonthIndex)}
                  y2={paddingTop + innerHeight}
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <rect
                  x={getX(activeMonthIndex) - 52}
                  y={paddingTop - 19}
                  width={104}
                  height={16}
                  rx={3}
                  fill="#eff6ff"
                  stroke="#bfdbfe"
                  strokeWidth="1"
                />
                <text
                  x={getX(activeMonthIndex)}
                  y={paddingTop - 7}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#1d4ed8"
                  fontFamily="inherit"
                >
                  ACTIVE (NOV 2026)
                </text>
              </g>

              {/* Selected Period Inspection Guideline (when inspecting past periods) */}
              {selectedPeriodIndex !== activeMonthIndex && (
                <g>
                  <line
                    x1={getX(selectedPeriodIndex)}
                    y1={paddingTop}
                    x2={getX(selectedPeriodIndex)}
                    y2={paddingTop + innerHeight}
                    stroke="var(--brand-400, #f472b6)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={getX(selectedPeriodIndex) - 28}
                    y={paddingTop - 19}
                    width={56}
                    height={16}
                    rx={3}
                    fill="#fdf2f8"
                    stroke="#fbcfe8"
                    strokeWidth="1"
                  />
                  <text
                    x={getX(selectedPeriodIndex)}
                    y={paddingTop - 7}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#db2777"
                    fontFamily="inherit"
                  >
                    INSPECT
                  </text>
                </g>
              )}

              {/* Series Curves and Data Points */}
              {(() => {
                const spacedYMap = getSpacedYMap(activeSeriesList);
                return activeSeriesList
                  .filter((s) => !hiddenSeries.has(s.id))
                  .map((s) => {
                    const solidPathD = getSmoothCurvePath(s.points);
                    const lastX = getX(s.points.length - 1);
                    const lastY = getY(s.points[s.points.length - 1]);

                    return (
                      <g key={s.id}>
                        {/* Clean Solid Trajectory Line */}
                        <path
                          d={solidPathD}
                          fill="none"
                          stroke={s.color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data Points */}
                        {s.points.map((val, i) => {
                          const x = getX(i);
                          const y = getY(val);
                          const isSelected = selectedPeriodIndex === i;
                          const isHovered = hoveredPeriodIndex === i;
                          const isActiveCycle = i === activeMonthIndex;

                          return (
                            <g key={i}>
                              {/* Selected / Active Ring Indicator */}
                              {(isSelected || isActiveCycle) && (
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isSelected ? (isHovered ? 8.5 : 7) : (isHovered ? 8 : 6)}
                                  fill="none"
                                  stroke={s.color}
                                  strokeWidth={isSelected ? '2' : '1.5'}
                                  strokeOpacity={isSelected ? 0.75 : 0.45}
                                />
                              )}

                              {/* Data Point Dot */}
                              <circle
                                cx={x}
                                cy={y}
                                r={isHovered ? 6 : isSelected ? 4.5 : isActiveCycle ? 4 : 3.5}
                                fill="#fff"
                                stroke={s.color}
                                strokeWidth={isHovered || isSelected ? 3 : 2}
                                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                              />

                              {/* Invisible Larger Hit Target for Effortless Clicking */}
                              <circle
                                cx={x}
                                cy={y}
                                r={15}
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setSelectedPeriodIndex(i);
                                  updateViewportScroll(i, true);
                                }}
                                onMouseEnter={() => setHoveredPeriodIndex(i)}
                                onMouseLeave={() => setHoveredPeriodIndex(null)}
                              >
                                <title>{`${s.name} (${s.code}): ${val} pts in ${evaluationPeriods[i].label} (Click to inspect)`}</title>
                              </circle>
                            </g>
                          );
                        })}

                        {/* Endpoint Score Badge */}
                        <text
                          x={lastX + 8}
                          y={(spacedYMap[s.id] ?? lastY) + 4}
                          fontSize="10.5"
                          fontWeight="bold"
                          fill={s.color}
                          fontFamily="inherit"
                        >
                          {s.code} {s.points[s.points.length - 1]}
                        </text>
                      </g>
                    );
                  });
              })()}
            </svg>

            {/* 2. Sticky Y-Axis (Left Frozen Pane: 100 to 50 CSC Scale) */}
            <div
              style={{
                position: 'sticky',
                left: 0,
                top: 0,
                width: `${paddingLeft}px`,
                height: `${chartHeight - 54}px`,
                pointerEvents: 'none',
                zIndex: 10,
                background: '#ffffff',
                borderRight: '1.5px solid #e2e8f0',
                boxShadow: '3px 0 6px rgba(0,0,0,0.02)',
              }}
            >
              <svg
                style={{
                  width: `${paddingLeft}px`,
                  height: `${chartHeight - 54}px`,
                  display: 'block',
                }}
              >
                {yAxisItems.map((item) => {
                  const y = getY(item.value);
                  return (
                    <g key={item.value}>
                      {/* Tick mark aligned with gridline */}
                      <line
                        x1={paddingLeft - 6}
                        y1={y}
                        x2={paddingLeft}
                        y2={y}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />

                      {item.status && (
                        <text
                          x={paddingLeft - 34}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11"
                          fontWeight={item.isBenchmark ? '700' : '500'}
                          fill={item.isBenchmark ? 'var(--ink-700, #334155)' : 'var(--ink-400, #94a3b8)'}
                          fontFamily="inherit"
                        >
                          {item.status}
                        </text>
                      )}

                      <text
                        x={paddingLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11.5"
                        fontWeight={item.isBenchmark ? '800' : '500'}
                        fill={item.isBenchmark ? 'var(--ink-900, #0f172a)' : 'var(--ink-500, #64748b)'}
                        fontFamily="inherit"
                      >
                        {item.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* 3. Sticky X-Axis Row (Bottom Frozen Pane: Timeline Dates & Contract Types) */}
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                left: 0,
                width: `${chartWidth}px`,
                height: '54px',
                zIndex: 15,
                background: '#ffffff',
                borderTop: '1.5px solid #e2e8f0',
                boxShadow: '0 -2px 6px rgba(0,0,0,0.02)',
              }}
            >
              {/* Sticky Bottom-Left Corner (Sticks to left: 0 & bottom: 0, seamless white block with no label) */}
              <div
                style={{
                  position: 'sticky',
                  left: 0,
                  top: 0,
                  width: `${paddingLeft}px`,
                  height: '54px',
                  background: '#ffffff',
                  borderRight: '1.5px solid #e2e8f0',
                  zIndex: 25,
                  float: 'left',
                }}
              />

              {/* Clickable Period Buttons (Positioned horizontally at getX(idx)) */}
              {evaluationPeriods.map((p, idx) => {
                const x = getX(idx);
                const isSelected = selectedPeriodIndex === idx;
                const isHovered = hoveredPeriodIndex === idx;
                const isActiveCycle = idx === activeMonthIndex;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPeriodIndex(idx);
                      updateViewportScroll(idx, true);
                    }}
                    onMouseEnter={() => setHoveredPeriodIndex(idx)}
                    onMouseLeave={() => setHoveredPeriodIndex(null)}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      transform: 'translateX(-50%)',
                      top: '5px',
                      background: isSelected
                        ? 'var(--brand-50, #fdf2f8)'
                        : isHovered
                        ? '#f1f5f9'
                        : isActiveCycle
                        ? '#eff6ff'
                        : '#ffffff',
                      border: isSelected
                        ? '1.5px solid var(--brand-700)'
                        : isActiveCycle
                        ? '1px solid #bfdbfe'
                        : isHovered
                        ? '1px solid #cbd5e1'
                        : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      zIndex: isSelected ? 18 : 16,
                      boxShadow: isSelected
                        ? '0 1px 3px rgba(128,0,32,0.15)'
                        : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: isSelected ? '12.5px' : '11.5px',
                        fontWeight: isSelected || isActiveCycle ? 800 : 600,
                        color: isSelected
                          ? 'var(--brand-700)'
                          : isActiveCycle
                          ? '#1d4ed8'
                          : 'var(--ink-800)',
                      }}
                    >
                      {p.label}
                    </span>
                    {isActiveCycle ? (
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: '#1d4ed8',
                        }}
                      >
                        Active
                      </span>
                    ) : idx === 11 ? (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 500,
                          color: 'var(--ink-400)',
                        }}
                      >
                        Upcoming
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '22px' }}>
        {/* Column 1: Departments Leaderboard & Average Ratings Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Highest-Performing Departments Leaderboard */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: 'var(--brand-50, #fdf2f4)', borderRadius: '8px', color: 'var(--brand-700)' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800 }}>
                    Highest-Performing Departments
                  </h3>
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>
                    Ranked by aggregated evaluation score across all COS subordinates in {currentMonthName} {selectedYear}
                  </p>
                </div>
              </div>
              <span className="badge badge-confirmed" style={{ fontSize: '11px', padding: '3px 8px' }}>
                Top 5 Departments &amp; Offices
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {departmentLeaderboard.map((dept) => (
                <div
                  key={dept.rank}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: dept.rank === 1 ? 'var(--amber-50, #fffbeb)' : '#fafbfc',
                    border: dept.rank === 1 ? '1px solid #fde68a' : '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: dept.rank === 1 ? '#d97706' : 'var(--ink-200, #e2e8f0)',
                          color: dept.rank === 1 ? '#fff' : 'var(--ink-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '12px',
                        }}
                      >
                        #{dept.rank}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink-900)' }}>
                            {dept.name}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: getDepartmentDomain(dept.name).style.bg,
                              color: getDepartmentDomain(dept.name).style.text,
                              border: `1px solid ${getDepartmentDomain(dept.name).style.border}`,
                            }}
                          >
                            {getDepartmentDomain(dept.name).shortName}
                          </span>
                        </div>
                        <div className="muted" style={{ fontSize: '12px' }}>
                          {dept.headcount} COS Personnel
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-700)' }}>
                        {dept.avgScore} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-500)' }}>/ 100</span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: dept.badgeColor,
                          background: dept.badgeBg,
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {dept.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Evaluation completion bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px' }}>
                    <span className="muted">Evals: {dept.evalCompletedCount}/{dept.totalEvals} ({dept.completionRate}%)</span>
                    <div style={{ flex: 1, height: '5px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${dept.completionRate}%`,
                          height: '100%',
                          background: dept.completionRate === 100 ? '#16a34a' : 'var(--brand-700)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Average Ratings & Distribution Breakdown */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: 'var(--brand-50, #fdf2f4)', borderRadius: '8px', color: 'var(--brand-700)' }}>
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800 }}>
                    Average Ratings &amp; Distribution
                  </h3>
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>
                    Institutional CSC-aligned performance score classifications in {currentMonthName} {selectedYear}
                  </p>
                </div>
              </div>
            </div>

            {/* Distribution Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ratingDistribution.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>
                      {item.count} staff <span className="muted" style={{ fontWeight: 400 }}>({item.pct}%)</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${item.pct}%`,
                        height: '100%',
                        background: item.color,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                background: '#fafbfc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: 'var(--ink-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Total Assessed COS Roster: <b>{totalAssessed} Subordinates</b></span>
              <span className="badge badge-confirmed" style={{ fontSize: '11px' }}>
                Standard Bell Distribution
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Outstanding Employees Spotlight */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Outstanding Employees Spotlight */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: 'var(--amber-50, #fffbeb)', borderRadius: '8px', color: '#d97706' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800 }}>
                    Outstanding Employees Spotlight
                  </h3>
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>
                    Personnel achieving Outstanding ratings (90 – 100) &amp; verified milestone achievements in {currentMonthName} {selectedYear}
                  </p>
                </div>
              </div>
              <span className="badge badge-confirmed" style={{ fontSize: '11px', padding: '3px 8px' }}>
                Honor Roll
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {outstandingEmployees.map((emp) => (
                <div
                  key={emp.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#fff',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--ink-900)' }}>
                          {emp.name}
                        </span>
                        <span className="emp-id-chip">{emp.empId}</span>
                      </div>
                      <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                        {emp.role} • <b>{emp.department}</b>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--brand-700)' }}>
                        {emp.score} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-500)' }}>/ 100</span>
                      </div>
                      <span className="badge badge-confirmed" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                        {emp.ratingLabel}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-600)', lineHeight: 1.4, fontStyle: 'italic' }}>
                    "{emp.highlight}"
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onNavigate('report_generator')}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Inspect Employee Records</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
