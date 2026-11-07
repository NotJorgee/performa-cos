import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Download, Check, Archive, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Toast from '../common/Toast';
import EmployeeRecordView, { getScoreInterpretationColor } from '../management/EmployeeRecordView';
import { getComparativeTrajectory, ComparativeTrajectoryBadge } from '../../utils/comparativeAnalytics';

import { EVSU_DEPARTMENTS } from '../../utils/departments';

export default function ReportGenerator({
  employees: propEmployees = [],
  departments = EVSU_DEPARTMENTS,
  departmentName = null,
  restrictDepartment = null,
  onNavigate = () => {},
  onBack = null,
}) {
  const deptScope = restrictDepartment || departmentName;
  const isDeptRestricted = Boolean(deptScope);

  const [employees, setEmployees] = useState(propEmployees);
  const [isLoading, setIsLoading] = useState(propEmployees.length === 0);

  useEffect(() => {
    if (propEmployees && propEmployees.length > 0) {
      setEmployees(propEmployees.filter((u) => !u.role || u.role === 'COS Employee'));
      return;
    }
    let isMounted = true;
    setIsLoading(true);
    api.users
      .list({ role: 'COS Employee' })
      .then((users) => {
        if (!isMounted) return;
        if (Array.isArray(users)) {
          const cosUsers = users.filter((u) => u.role === 'COS Employee');
          const mapped = cosUsers.map((u) => ({
            id: u.id,
            idNumber: u.employee_id_number || 'N/A',
            fullName: u.full_name,
            email: u.email,
            department: (u.department && typeof u.department === 'object' && u.department.name) ? u.department.name : (u.department_name || 'HRMDO Office'),
            dateAppointed: u.date_appointed || 'N/A',
            contractEndDate: u.contract_end_date || 'N/A',
            totalContracts: u.total_contracts || 0,
            avgScore: null,
            latestScore: null,
            previousScore: null,
            latestRating: null,
            status: u.is_archived ? 'Archived' : u.is_active ? 'Active' : 'Inactive',
          }));
          setEmployees(mapped);
        }
      })
      .catch((err) => {
        console.warn('API users fetch notice in ReportGenerator:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [propEmployees]);

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(deptScope || 'All');
  const [showArchived, setShowArchived] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // If viewing an employee's historical records
  if (selectedEmp) {
    return (
      <EmployeeRecordView
        employee={selectedEmp}
        onBack={() => setSelectedEmp(null)}
        backLabel={isDeptRestricted ? '← Back to Department Records' : '← Back to Employee Records'}
      />
    );
  }

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    // If restricted to a department, strictly confine to this department
    if (isDeptRestricted && emp.department !== deptScope) {
      return false;
    }

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      emp.fullName.toLowerCase().includes(q) ||
      emp.idNumber.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q);

    const matchesDept =
      isDeptRestricted ||
      selectedDept === 'All' ||
      emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Separate active employees (for primary table) and archived employees (for revealed table below)
  const activeEmployees = filteredEmployees.filter((emp) => emp.status !== 'Archived');
  const archivedEmployees = filteredEmployees.filter((emp) => emp.status === 'Archived');

  const handleExportRosterCsv = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Institutional Email',
      'Department',
      'Total Contracts',
      'Avg Score',
      'Latest Score',
      'Adjectival Rating',
      'Comparative Trajectory',
      'Status',
    ];

    const rows = filteredEmployees.map((emp) => {
      const traj = getComparativeTrajectory(emp.latestScore, emp.previousScore);
      return [
        `"${emp.idNumber}"`,
        `"${emp.fullName}"`,
        `"${emp.email}"`,
        `"${emp.department}"`,
        emp.totalContracts || 1,
        emp.avgScore !== undefined && emp.avgScore !== null ? Number(emp.avgScore).toFixed(1) : 'N/A',
        emp.latestScore || 'N/A',
        `"${emp.latestRating || 'Unrated'}"`,
        `"${traj.badgeText}"`,
        `"${emp.status}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const fileName = isDeptRestricted
      ? `EVSU_Departmental_Records_${deptScope.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      : `EVSU_Executive_Personnel_Records_${new Date().toISOString().slice(0, 10)}.csv`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg(
      isDeptRestricted
        ? `Departmental personnel summary report for ${deptScope} successfully exported as CSV!`
        : 'Executive personnel summary report successfully generated and exported as CSV!'
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>
            {isDeptRestricted ? 'Departmental Employee Records' : 'COS Employee Records & Evaluations'}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {isDeptRestricted
              ? `Inspect historical evaluation records, view verified MARs, and review performance reports for ${deptScope}.`
              : 'Inspect employee historical evaluation records, view verified MARs, and download official performance reports for institutional records.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            onClick={handleExportRosterCsv}
            title={isDeptRestricted ? `Download CSV report of ${deptScope} records` : 'Download CSV report of current personnel records'}
          >
            <Download size={14} /> Export Roster (CSV)
          </button>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Personnel Records Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="card-title" style={{ margin: 0 }}>
                {isDeptRestricted
                  ? `${deptScope} Personnel Records & Evaluations`
                  : 'COS Personnel Records & Historical Archives'}
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                {isDeptRestricted
                  ? 'Select a department employee to inspect past evaluation cycles, review verified MARs, or download official evaluation reports.'
                  : 'Select an employee to inspect past evaluation cycles, review verified MARs, or download official evaluation reports.'}
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by personnel name or ID number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '13.5px' }}
              />
            </div>

            {isDeptRestricted ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13.5px',
                  color: 'var(--ink-900)',
                  padding: '4px 0',
                }}
              >
                <span className="muted" style={{ color: 'var(--ink-600)', fontWeight: 500 }}>Department:</span>
                <b style={{ color: 'var(--ink-900)' }}>{deptScope}</b>
              </div>
            ) : (
              <div style={{ minWidth: '200px' }}>
                <select
                  className="form-control"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ fontSize: '13.5px' }}
                >
                  <option value="All">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Primary Table: Active Employees Only */}
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Full Name</th>
              {!isDeptRestricted && <th>Department</th>}
              <th>Total Contracts</th>
              <th>Avg Score</th>
              <th>Latest Score & Trajectory</th>
              <th style={{ textAlign: 'right' }}>Records Action</th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <span className="emp-id-chip">{emp.idNumber}</span>
                </td>
                <td>
                  <b>{emp.fullName}</b>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {emp.email}
                  </div>
                </td>
                {!isDeptRestricted && <td>{emp.department}</td>}
                <td>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink-900)' }}>
                    {emp.totalContracts ?? 0}
                  </span>
                  <span className="muted" style={{ fontSize: '11.5px', marginLeft: '4px' }}>
                    {(emp.totalContracts ?? 0) === 1 ? 'Cycle' : 'Cycles'}
                  </span>
                </td>
                <td>
                  {emp.avgScore !== null && emp.avgScore !== undefined ? (
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                        {Number(emp.avgScore).toFixed(1)}
                      </span>
                      <span className="muted" style={{ fontSize: '11px', marginLeft: '3px' }}>
                        / 100
                      </span>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {emp.latestScore !== null && emp.latestScore !== undefined ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          className={`score-pill ${
                            getScoreInterpretationColor(emp.latestRating, emp.latestScore).className
                          }`}
                        >
                          {emp.latestScore}
                        </span>
                        <ComparativeTrajectoryBadge
                          currentScore={emp.latestScore}
                          previousScore={emp.previousScore}
                        />
                      </div>
                      <div className="muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                        {emp.latestRating || 'Evaluated'}
                      </div>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => setSelectedEmp(emp)}
                    title={`View and extract records for ${emp.fullName}`}
                  >
                    <FileText size={14} /> View Records
                  </button>
                </td>
              </tr>
            ))}
            {activeEmployees.length === 0 && (
              <tr>
                <td colSpan={isDeptRestricted ? 6 : 8} className="muted" style={{ padding: '36px 16px', textAlign: 'center' }}>
                  {isLoading
                    ? 'Loading personnel records from database...'
                    : 'No personnel records matching search criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Toggle Button for Archived Employees */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowArchived((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 600,
            background: showArchived ? '#f1f5f9' : '#fff',
            border: '1px solid var(--line)',
            color: 'var(--ink-700)',
            cursor: 'pointer',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <Archive size={15} color="var(--ink-600)" />
          <span>
            {showArchived
              ? 'Hide Archived Records'
              : `View Archived Records (${archivedEmployees.length})`}
          </span>
          {showArchived ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Separate Archived Employees Table Card Below */}
      {showArchived && (
        <div className="card" style={{ marginTop: '18px', padding: 0, overflow: 'hidden', border: '1px solid var(--line)', background: '#fff' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={18} color="var(--ink-600)" />
              <div className="card-title" style={{ margin: 0, fontSize: '15px' }}>
                {isDeptRestricted
                  ? `${deptScope} Archived Records & Evaluations`
                  : 'Archived COS Personnel Records'}
              </div>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
              Historical personnel records and completed contracts retained for institutional audit trails.
            </p>
          </div>

          {archivedEmployees.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                No archived personnel records found for {isDeptRestricted ? deptScope : 'selected filters'}.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Full Name</th>
                  {!isDeptRestricted && <th>Department</th>}
                  <th>Total Contracts</th>
                  <th>Avg Score</th>
                  <th>Latest Score & Trajectory</th>
                  <th style={{ textAlign: 'right' }}>Records Action</th>
                </tr>
              </thead>
              <tbody>
                {archivedEmployees.map((emp) => (
                  <tr key={emp.id} style={{ opacity: 0.9 }}>
                    <td>
                      <span className="emp-id-chip">{emp.idNumber}</span>
                    </td>
                    <td>
                      <b>{emp.fullName}</b>
                      <div className="muted" style={{ fontSize: '12px' }}>{emp.email}</div>
                    </td>
                    {!isDeptRestricted && <td>{emp.department}</td>}
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink-900)' }}>
                        {emp.totalContracts ?? 0}
                      </span>
                      <span className="muted" style={{ fontSize: '11.5px', marginLeft: '4px' }}>
                        {(emp.totalContracts ?? 0) === 1 ? 'Cycle' : 'Cycles'}
                      </span>
                    </td>
                    <td>
                      {emp.avgScore !== null && emp.avgScore !== undefined ? (
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                            {Number(emp.avgScore).toFixed(1)}
                          </span>
                          <span className="muted" style={{ fontSize: '11px', marginLeft: '3px' }}>
                            / 100
                          </span>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {emp.latestScore !== null && emp.latestScore !== undefined ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              className={`score-pill ${
                                getScoreInterpretationColor(emp.latestRating, emp.latestScore).className
                              }`}
                            >
                              {emp.latestScore}
                            </span>
                            <ComparativeTrajectoryBadge
                              currentScore={emp.latestScore}
                              previousScore={emp.previousScore}
                            />
                          </div>
                          <div className="muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                            {emp.latestRating || 'Evaluated'}
                          </div>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          background: '#fff',
                        }}
                        onClick={() => setSelectedEmp(emp)}
                        title={`View historical evaluation records for ${emp.fullName}`}
                      >
                        <FileText size={14} /> View Records
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
