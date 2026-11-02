import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Building2,
  Calendar,
  Download,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

export default function ExecutiveAnalytics({
  onBack = () => {},
  onNavigate = () => {},
}) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);

  // 12-Month Calendar Year Trend Data (Pure SVG coordinates, zero heavy charting library overhead)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const yearlyTrendData = {
    '2026': [
      {
        id: 'technology',
        name: 'Technology / CSD',
        code: 'TECH',
        color: '#d97706', // Amber / Orange
        points: [84.2, 85.0, 83.8, 85.6, 87.2, 88.5, 87.0, 87.8, 88.6, 89.2, 89.4, 89.6],
      },
      {
        id: 'sdo_library',
        name: 'Student Dev / Library',
        code: 'SDO',
        color: '#7c3aed', // Purple
        points: [80.5, 81.8, 81.2, 82.5, 83.1, 83.8, 82.4, 83.0, 83.5, 83.7, 83.8, 83.9],
      },
      {
        id: 'research',
        name: 'Research & MESO',
        code: 'RESEARCH',
        color: '#059669', // Emerald Green
        points: [78.2, 79.0, 81.4, 80.6, 79.8, 81.2, 80.0, 80.5, 81.0, 81.5, 81.1, 80.9],
      },
      {
        id: 'engineering',
        name: 'College of Engineering',
        code: 'ENGG',
        color: '#2563eb', // Blue
        points: [75.0, 76.2, 75.8, 76.5, 77.4, 78.0, 76.8, 77.2, 77.6, 77.9, 78.0, 78.2],
      },
    ],
    '2025': [
      {
        id: 'technology',
        name: 'Technology / CSD',
        code: 'TECH',
        color: '#d97706',
        points: [80.2, 81.0, 80.5, 81.8, 82.5, 83.4, 82.0, 82.8, 83.2, 83.8, 84.0, 84.5],
      },
      {
        id: 'sdo_library',
        name: 'Student Dev / Library',
        code: 'SDO',
        color: '#7c3aed',
        points: [77.5, 78.4, 78.0, 79.2, 79.8, 80.5, 79.5, 80.0, 80.4, 80.8, 81.0, 81.2],
      },
      {
        id: 'research',
        name: 'Research & MESO',
        code: 'RESEARCH',
        color: '#059669',
        points: [76.0, 76.8, 78.5, 77.8, 77.2, 78.4, 77.5, 78.0, 78.5, 79.0, 78.6, 78.4],
      },
      {
        id: 'engineering',
        name: 'College of Engineering',
        code: 'ENGG',
        color: '#2563eb',
        points: [73.5, 74.2, 73.8, 74.6, 75.2, 75.8, 74.8, 75.2, 75.6, 76.0, 76.2, 76.5],
      },
    ],
  };

  const trendSeries = yearlyTrendData[selectedYear] || yearlyTrendData['2026'];

  // Highest-Performing Departments Leaderboard Data
  const departmentLeaderboard = [
    {
      rank: 1,
      name: 'Computer Studies Department',
      college: 'College of Technology',
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
      name: 'Mechanical Engineering Department',
      college: 'College of Engineering',
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
      name: 'Civil Engineering Department',
      college: 'College of Engineering',
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
      name: 'University Library Services',
      college: 'Academic Support Division',
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
      name: 'Management & Extension Services (MESO)',
      college: 'Administration Office',
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
  const outstandingEmployees = [
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
      department: 'University Library Services',
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
      highlight: 'High milestone throughput in hardware diagnostics across College of Technology laboratories.',
    },
  ];

  // University-Wide Rating Distribution (Aligned with Official HR Criteria)
  const ratingDistribution = [
    { label: 'Outstanding (90 – 100)', count: 6, pct: 22.2, color: '#16a34a' },
    { label: 'Very Satisfactory (80 – 89)', count: 17, pct: 63.0, color: '#2563eb' },
    { label: 'Satisfactory (70 – 79)', count: 3, pct: 11.1, color: '#0284c7' },
    { label: 'Needs Improvement (60 – 69)', count: 1, pct: 3.7, color: '#f59e0b' },
    { label: 'Unsatisfactory (Below 60)', count: 0, pct: 0.0, color: '#dc2626' },
  ];

  // Export Executive Analytics Summary to CSV
  const handleExportCsv = () => {
    const csvRows = [
      ['EASTERN VISAYAS STATE UNIVERSITY - HRMO EXECUTIVE PERFORMANCE ANALYTICS'],
      ['Reporting Period', `Calendar Year ${selectedYear} (Annual Performance)`],
      ['Institutional Average Score', '86.4 / 100 (Very Satisfactory)'],
      [],
      ['DEPARTMENT PERFORMANCE LEADERBOARD'],
      ['Rank', 'Department', 'College / Division', 'COS Headcount', 'Avg Score', 'Rating', 'Eval Completion %'],
      ...departmentLeaderboard.map((d) => [
        d.rank,
        `"${d.name}"`,
        `"${d.college}"`,
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

  // SVG Chart Geometry calculations
  const chartWidth = 980;
  const chartHeight = 290;
  const paddingLeft = 165; // Wide left margin so all status benchmark labels and numbers fit outside graph
  const paddingRight = 95; // Ample right margin so series endpoint labels fit cleanly
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Y-axis: Starts at 70 with 5-point uniform increments all the way to 100
  const minY = 70;
  const maxY = 100;

  // 5-point increment sequence: 70, 75, 80, 85, 90, 95, 100
  // Benchmark thresholds aligned with official HR Performance Interpretation:
  // 90 - 100: Outstanding
  // 80 - 89: Very Satisfactory
  // 70 - 79: Satisfactory
  const yAxisItems = [
    { value: 100, isBenchmark: false },
    { value: 95, isBenchmark: false },
    { value: 90, status: 'Outstanding', isBenchmark: true },
    { value: 85, isBenchmark: false },
    { value: 80, status: 'Very Satisfactory', isBenchmark: true },
    { value: 75, isBenchmark: false },
    { value: 70, status: 'Satisfactory', isBenchmark: true },
  ];

  const getX = (index) => paddingLeft + (index / (months.length - 1)) * innerWidth;
  const getY = (val) => paddingTop + innerHeight - ((val - minY) / (maxY - minY)) * innerHeight;

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
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
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

      {/* Yearly Performance Trend Chart (Calendar Year Track) */}
      <div className="card" style={{ padding: '22px 24px', marginBottom: '24px' }}>
        <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: 'var(--ink-900)' }}>
              Yearly Performance Trend by College &amp; Division
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
              Annual deliverable quality and evaluation performance trajectories across calendar months (Scale: 70 – 100).
            </p>
          </div>

          {/* Chart Controls: Year Selector & Series Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>Calendar Year:</span>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '13px', fontWeight: 700 }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2026">Year 2026 (Active)</option>
                <option value="2025">Year 2025</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {trendSeries.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: s.color,
                    }}
                  />
                  <span style={{ color: 'var(--ink-800)' }}>{s.code}</span>
                  <span className="muted" style={{ fontSize: '11px', fontWeight: 400 }}>({s.points[s.points.length - 1]})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lightweight Pure SVG Chart Canvas */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', minWidth: '650px', height: 'auto', display: 'block' }}
          >
            {/* Horizontal Gridlines, Aligned Numbers & Status Titles (Outside Graph) */}
            {yAxisItems.map((item) => {
              const y = getY(item.value);
              return (
                <g key={item.value}>
                  {/* Gridline / Benchmark line across the chart */}
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={item.isBenchmark ? '4 3' : 'none'}
                  />

                  {/* Benchmark Status Title Column (Outside Graph, Left of Number) */}
                  {item.status && (
                    <text
                      x={paddingLeft - 32}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="var(--ink-400, #94a3b8)"
                      fontFamily="inherit"
                    >
                      {item.status}
                    </text>
                  )}

                  {/* Clean Aligned Y-Axis Number Column */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill={item.isBenchmark ? 'var(--ink-600, #475569)' : 'var(--ink-400, #94a3b8)'}
                    fontWeight={item.isBenchmark ? '700' : '500'}
                    fontFamily="inherit"
                  >
                    {item.value}
                  </text>
                </g>
              );
            })}

            {/* X-axis months */}
            {months.map((m, idx) => {
              const x = getX(idx);
              const isHovered = hoveredMonthIndex === idx;
              return (
                <g key={m}>
                  <text
                    x={x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fontSize="11.5"
                    fill={isHovered ? 'var(--brand-700)' : 'var(--ink-500, #64748b)'}
                    fontWeight={isHovered ? '700' : '500'}
                    fontFamily="inherit"
                  >
                    {m}
                  </text>
                  {/* Subtle vertical indicator on hover */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + innerHeight}
                      stroke="var(--brand-300, #fbcfe8)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}
                </g>
              );
            })}

            {/* Series Smooth Curves and End Points */}
            {trendSeries.map((s) => {
              const pathD = getSmoothCurvePath(s.points);
              const lastX = getX(s.points.length - 1);
              const lastY = getY(s.points[s.points.length - 1]);

              return (
                <g key={s.id}>
                  {/* Smooth curved trajectory line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Data points */}
                  {s.points.map((val, i) => {
                    const x = getX(i);
                    const y = getY(val);
                    const isHovered = hoveredMonthIndex === i;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#fff"
                        stroke={s.color}
                        strokeWidth={isHovered ? 3 : 2}
                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                        onMouseEnter={() => setHoveredMonthIndex(i)}
                        onMouseLeave={() => setHoveredMonthIndex(null)}
                      />
                    );
                  })}
                  {/* Endpoint score badge label with ample right margin to prevent clipping */}
                  <text
                    x={lastX + 8}
                    y={lastY + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill={s.color}
                    fontFamily="inherit"
                  >
                    {s.code} {s.points[s.points.length - 1]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Tooltip Summary when hovering a month */}
        {hoveredMonthIndex !== null && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              background: '#f8fafc',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '12.5px',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--brand-700)' }}>
              Month: {months[hoveredMonthIndex]} (Year {selectedYear})
            </span>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {trendSeries.map((s) => (
                <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <b style={{ color: s.color }}>{s.code}:</b> {s.points[hoveredMonthIndex]} pts
                </span>
              ))}
            </div>
          </div>
        )}
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
                    Ranked by aggregated evaluation score across all COS subordinates
                  </p>
                </div>
              </div>
              <span className="badge badge-confirmed" style={{ fontSize: '11px', padding: '3px 8px' }}>
                Top 5 Colleges
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
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink-900)' }}>
                          {dept.name}
                        </div>
                        <div className="muted" style={{ fontSize: '12px' }}>
                          {dept.college} • {dept.headcount} COS Personnel
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
                    Institutional CSC-aligned performance score classifications
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
              <span>Total Assessed COS Roster: <b>27 Subordinates</b></span>
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
                    Personnel achieving Outstanding ratings (90 – 100) &amp; verified milestone achievements
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                    <span className="muted">Verified Accomplishments: <b>{emp.darsVerified} Tasks</b></span>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>
                      ✓ {emp.retentionStatus}
                    </span>
                  </div>
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
