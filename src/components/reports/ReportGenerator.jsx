import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Download, Check, Archive, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Toast from '../common/Toast';
import EmployeeRecordView, { getScoreInterpretationColor, getEmployeeHistoricalEvaluations } from '../management/EmployeeRecordView';
import { getComparativeTrajectory, ComparativeTrajectoryBadge } from '../../utils/comparativeAnalytics';
import { exportToExcel } from '../../utils/excelExport';

import {
  EVSU_DEPARTMENTS,
  EVSU_DEPARTMENT_DOMAINS,
  EVSU_DEPARTMENT_GROUPS,
  getDepartmentDomain,
} from '../../utils/departments';

const EMPTY_PROPS_EMPLOYEES = [];

const getScoreLabel = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'Unrated';
  const num = Number(score);
  if (num >= 90) return 'Outstanding';
  if (num >= 70) return 'Very Satisfactory';
  if (num >= 50) return 'Satisfactory';
  if (num >= 30) return 'Needs Improvement';
  return 'Unsatisfactory';
};

const enrichEmployeesWithEvaluations = (rawUsers, evalsList = []) => {
  if (!Array.isArray(rawUsers)) return [];
  return rawUsers.map((u) => {
    const uId = u.id;
    const uEmpNum = (u.employee_id_number || u.idNumber || '').trim();
    const uName = (u.full_name || u.fullName || '').trim();
    const uEmail = u.email || '';
    const uDept = (u.department && typeof u.department === 'object' && u.department.name)
      ? u.department.name
      : (u.department_name || u.department || 'HRMDO Office');

    // 1. Check live completed evaluations from database (models.EvaluationRecord)
    const userEvals = (evalsList || []).filter((e) => {
      if (!e) return false;
      const matchId = e.employee_id && (Number(e.employee_id) === Number(uId));
      const matchEmpNum = uEmpNum && e.employee_id_number && (String(e.employee_id_number).trim() === uEmpNum);
      const isCandidate = matchId || matchEmpNum;
      const hasScore = e.status === 'Completed' || (e.final_score !== null && e.final_score !== undefined) || (e.supervisor_score !== null && e.supervisor_score !== undefined);
      return isCandidate && hasScore;
    });

    userEvals.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0) || (b?.id || 0) - (a?.id || 0));

    let latestScore = u.latestScore ?? null;
    let latestRating = u.latestRating ?? null;
    let previousScore = u.previousScore ?? null;
    let avgScore = u.avgScore ?? null;
    let totalContracts = u.total_contracts || u.totalContracts || 0;

    if (userEvals.length > 0) {
      const latest = userEvals[0];
      const rawLatest = latest.final_score ?? latest.supervisor_score ?? null;
      latestScore = rawLatest !== null && rawLatest !== undefined ? Number(rawLatest) : null;
      latestRating = latest.rating_label || (latestScore !== null ? getScoreLabel(latestScore) : 'Evaluated');

      if (userEvals.length > 1) {
        const rawPrev = userEvals[1].final_score ?? userEvals[1].supervisor_score ?? null;
        previousScore = rawPrev !== null && rawPrev !== undefined ? Number(rawPrev) : null;
      }

      const validScores = userEvals
        .map((e) => e.final_score ?? e.supervisor_score)
        .filter((s) => s !== null && s !== undefined && !Number.isNaN(Number(s)))
        .map(Number);

      avgScore = validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
        : latestScore;

      totalContracts = Math.max(totalContracts, userEvals.length, 1);
    } else {
      // 2. Check fallback historical evaluations for demo/seed personnel
      const pseudoEmp = { idNumber: uEmpNum, fullName: uName, email: uEmail, department: uDept };
      let historical = [];
      try {
        if (typeof getEmployeeHistoricalEvaluations === 'function') {
          historical = getEmployeeHistoricalEvaluations(pseudoEmp) || [];
        }
      } catch (err) {
        console.warn('Historical evaluations fallback notice:', err);
      }

      if (historical && historical.length > 0) {
        const latestHist = historical[0];
        const rawLatest = latestHist.finalGrade ?? latestHist.supervisorScore ?? null;
        latestScore = rawLatest !== null && rawLatest !== undefined ? Number(rawLatest) : null;
        latestRating = latestHist.interpretation || (latestScore !== null ? getScoreLabel(latestScore) : 'Evaluated');

        if (historical.length > 1) {
          const rawPrev = historical[1].finalGrade ?? historical[1].supervisorScore ?? null;
          previousScore = rawPrev !== null && rawPrev !== undefined ? Number(rawPrev) : null;
        }

        const validScores = historical
          .map((h) => h.finalGrade ?? h.supervisorScore)
          .filter((s) => s !== null && s !== undefined && !Number.isNaN(Number(s)))
          .map(Number);

        avgScore = validScores.length > 0
          ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
          : latestScore;

        totalContracts = Math.max(totalContracts, historical.length, 1);
      }
    }

    if (latestScore !== null && !latestRating) {
      latestRating = getScoreLabel(latestScore);
    }

    return {
      id: uId,
      idNumber: uEmpNum || 'N/A',
      fullName: uName,
      email: uEmail,
      department: uDept,
      dateAppointed: u.date_appointed || u.dateAppointed || 'N/A',
      contractEndDate: u.contract_end_date || u.contractEndDate || 'N/A',
      totalContracts: totalContracts || 1,
      contactNumber: u.contact_number || u.contactNumber || '',
      officeLocation: u.office_location || u.officeLocation || '',
      alternateEmail: u.alternate_email || u.alternateEmail || '',
      emergencyContact: u.emergency_contact || u.emergencyContact || '',
      avatarUrl: u.avatar_url || u.avatarUrl || null,
      avgScore: avgScore !== null && avgScore !== undefined ? Number(avgScore) : null,
      latestScore: latestScore !== null && latestScore !== undefined ? Number(latestScore) : null,
      previousScore: previousScore !== null && previousScore !== undefined ? Number(previousScore) : null,
      latestRating,
      status: u.is_archived || u.status === 'Archived' ? 'Archived' : (u.is_active === false || u.status === 'Inactive' ? 'Inactive' : 'Active'),
    };
  });
};

export default function ReportGenerator({
  employees: propEmployees = EMPTY_PROPS_EMPLOYEES,
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

  const loadData = async (isMounted = true) => {
    setIsLoading(true);
    try {
      if (propEmployees && propEmployees.length > 0) {
        let evals = [];
        try {
          const evalsRes = await api.evaluations.list();
          if (Array.isArray(evalsRes)) evals = evalsRes;
        } catch (e) {
          console.warn('Evaluations fetch notice:', e.message);
        }
        if (isMounted) {
          const filtered = propEmployees.filter((u) => !u.role || u.role === 'COS Employee');
          setEmployees(enrichEmployeesWithEvaluations(filtered, evals));
        }
      } else {
        const [usersRes, evalsRes] = await Promise.allSettled([
          api.users.list({ role: 'COS Employee' }),
          api.evaluations.list(),
        ]);
        const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : [];
        const evals = evalsRes.status === 'fulfilled' && Array.isArray(evalsRes.value) ? evalsRes.value : [];
        if (isMounted) {
          const cosUsers = users.filter((u) => !u.role || u.role === 'COS Employee');
          setEmployees(enrichEmployeesWithEvaluations(cosUsers, evals));
        }
      }
    } catch (err) {
      console.warn('API users/evaluations fetch notice in ReportGenerator:', err);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData(isMounted);
    return () => {
      isMounted = false;
    };
  }, [propEmployees.length]);

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(deptScope || 'All');
  const [showArchived, setShowArchived] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState('success');

  const getStoredEmpId = () => {
    if (typeof window === 'undefined') return '';
    const hashQuery = window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(hashQuery || window.location.search);
    return params.get('empId') || sessionStorage.getItem('performa_records_empid') || '';
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    if (typeof window !== 'undefined' && emp) {
      const idKey = emp.idNumber || emp.id;
      sessionStorage.setItem('performa_records_empid', idKey);
      const baseHash = window.location.hash.split('?')[0] || '#/employee_records';
      window.history.replaceState(null, '', `${baseHash}?empId=${encodeURIComponent(idKey)}`);
    }
  };

  const handleBackToRoster = () => {
    setSelectedEmp(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('performa_records_empid');
      sessionStorage.removeItem('performa_records_subview');
      sessionStorage.removeItem('performa_records_cycle');
      const baseHash = window.location.hash.split('?')[0] || '#/employee_records';
      window.history.replaceState(null, '', baseHash);
    }
    loadData();
  };

  // Restore selected employee on page refresh / direct link if available
  useEffect(() => {
    if (!selectedEmp && employees.length > 0) {
      const storedId = getStoredEmpId();
      if (storedId) {
        const found = employees.find(
          (e) => String(e.id) === String(storedId) || String(e.idNumber) === String(storedId)
        );
        if (found) {
          setSelectedEmp(found);
        }
      }
    }
  }, [employees, selectedEmp]);

  // If viewing an employee's historical records
  if (selectedEmp) {
    return (
      <EmployeeRecordView
        employee={selectedEmp}
        onBack={handleBackToRoster}
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

  const getCleanTrajectoryText = (emp) => {
    const traj = getComparativeTrajectory(emp.latestScore, emp.previousScore);
    if (!traj) return 'Baseline (Initial Contract)';
    return (traj.badgeText || 'Baseline')
      .replace(/^[→▲▼▬]\s*/, '')
      .trim();
  };

  const handleExportData = () => {
    if (filteredEmployees.length === 0) {
      setToastType('warning');
      setToastMsg('No personnel records to export.');
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    setToastType('info');
    setToastMsg('Generating Excel personnel records...');

    setTimeout(() => {
      try {
        const headers = [
          'Employee ID',
          'Full Name',
          'Institutional Email',
          'Department',
          'Total Contracts',
          'Avg Score',
          'Latest Score',
          'Performance Rating',
          'Comparative Trajectory',
          'Status',
        ];

        const rows = filteredEmployees.map((emp) => [
          emp.idNumber || '',
          emp.fullName || '',
          emp.email || '',
          emp.department || '',
          emp.totalContracts || 1,
          emp.avgScore !== undefined && emp.avgScore !== null ? Number(emp.avgScore).toFixed(1) : 'N/A',
          emp.latestScore !== undefined && emp.latestScore !== null ? Number(emp.latestScore).toFixed(1) : 'N/A',
          emp.latestRating || 'Unrated',
          getCleanTrajectoryText(emp),
          emp.status || 'Active',
        ]);

        const fileName = isDeptRestricted
          ? `EVSU_COS_Departmental_Records_${deptScope.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
          : `EVSU_COS_Personnel_Records_${new Date().toISOString().slice(0, 10)}.xlsx`;

        exportToExcel({
          filename: fileName,
          sheetName: isDeptRestricted ? `${deptScope.slice(0, 28)}` : 'Personnel Records',
          headers,
          rows,
        });

        setToastType('success');
        setToastMsg(
          isDeptRestricted
            ? `Departmental personnel records for ${deptScope} exported as Excel (.xlsx)!`
            : 'COS personnel records successfully exported as Excel (.xlsx)!'
        );
      } catch (err) {
        console.error('Failed to export personnel records:', err);
        setToastType('error');
        setToastMsg('Failed to export personnel records. Please try again.');
      } finally {
        setTimeout(() => setToastMsg(null), 4500);
      }
    }, 250);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {isDeptRestricted ? 'Departmental Employee Records' : 'COS Employee Records & Evaluations'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: '#16a34a',
              color: '#ffffff',
              borderColor: '#15803d',
              fontWeight: 600,
            }}
            onClick={handleExportData}
            title={isDeptRestricted ? `Download personnel roster with auto-fitted columns for ${deptScope}` : 'Download personnel roster with auto-fitted columns'}
          >
            <Download size={14} /> Export Data
          </button>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg(null)} />

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
              <div style={{ minWidth: '220px' }}>
                <select
                  className="form-control"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  <option value="All">All Campus Units ({departments.length})</option>
                  {EVSU_DEPARTMENT_GROUPS.map((grp) => {
                    const groupDepts = grp.departments.filter((d) => departments.includes(d));
                    if (groupDepts.length === 0) return null;
                    return (
                      <optgroup key={grp.key} label={grp.name}>
                        {groupDepts.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
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
                {!isDeptRestricted && (
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{emp.department}</div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: getDepartmentDomain(emp.department).style.bg,
                        color: getDepartmentDomain(emp.department).style.text,
                        border: `1px solid ${getDepartmentDomain(emp.department).style.border}`,
                        marginTop: '3px',
                      }}
                    >
                      {getDepartmentDomain(emp.department).shortName}
                    </span>
                  </td>
                )}
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
                          {Number(emp.latestScore).toFixed(1)}
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
                    onClick={() => handleSelectEmployee(emp)}
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
                    {!isDeptRestricted && (
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{emp.department}</div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: getDepartmentDomain(emp.department).style.bg,
                        color: getDepartmentDomain(emp.department).style.text,
                        border: `1px solid ${getDepartmentDomain(emp.department).style.border}`,
                        marginTop: '3px',
                      }}
                    >
                      {getDepartmentDomain(emp.department).shortName}
                    </span>
                  </td>
                )}
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
                              {Number(emp.latestScore).toFixed(1)}
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
                        onClick={() => handleSelectEmployee(emp)}
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
