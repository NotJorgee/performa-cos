import React, { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  ArrowLeft,
  Users,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  History,
} from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';
import HistoricalAttendanceRoster from '../common/HistoricalAttendanceRoster';
import { getCachedData, setCachedData } from '../../utils/swrCache';
import { getDepartmentDomain } from '../../utils/departments';

export default function CampusAttendance({ currentUser, onBack = null, initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview'); // 'overview' | 'payroll' | 'leaves'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [toast, setToast] = useState(null);
  const cacheKeyOverview = 'hr_campus_overview';
  // SWR Instant 0ms perceived load time from cache
  const [overviewData, setOverviewData] = useState(() => getCachedData(cacheKeyOverview));
  const [isLoading, setIsLoading] = useState(!overviewData);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');

  // University Leaves State
  const [campusLeaves, setCampusLeaves] = useState([]);
  const [leaveSearch, setLeaveSearch] = useState('');

  // Load Campus Overview (silent background revalidation when cached)
  const loadOverview = async (silent = Boolean(overviewData)) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.attendance.getCampusOverview();
      setOverviewData(res);
      setCachedData(cacheKeyOverview, res);
    } catch (err) {
      console.warn('Overview load warning:', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Load All COS Employees for DTR selection
  const loadAllCosEmployees = async () => {
    try {
      const res = await api.users.list({ role: 'COS Employee', limit: 100 });
      const users = res?.users || (Array.isArray(res) ? res : []);
      setAllCosEmployees(users);
      if (users.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(users[0].id);
      }
    } catch (err) {
      console.warn('Employees load warning:', err.message);
    }
  };

  // Load Payroll Packet
  const loadPayrollPacket = async (empId) => {
    if (!empId) return;
    try {
      setIsLoadingPayroll(true);
      const res = await api.attendance.getPayrollPacket({
        cutoff: cutoffPeriod,
        month: dtrMonth,
        year: dtrYear,
        employee_id: empId,
      });
      setPayrollPacket(res);
    } catch (err) {
      console.warn('Payroll packet load warning:', err.message);
    } finally {
      setIsLoadingPayroll(false);
    }
  };

  // Load Campus Leaves Queue
  const loadCampusLeaves = async () => {
    try {
      const res = await api.leaves.getDepartmentQueue();
      setCampusLeaves(res || []);
    } catch (err) {
      console.warn('Leaves load warning:', err.message);
    }
  };

  useEffect(() => {
    loadOverview();
    loadCampusLeaves();
  }, []);

  // Smart Window Focus Re-fetch: Silently syncs whenever HR returns to this browser tab
  useEffect(() => {
    const handleWindowFocus = () => {
      loadOverview(true);
      loadCampusLeaves();
    };

    window.addEventListener('focus', handleWindowFocus);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleWindowFocus();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
// Export DTR & Accomplishment CSV
  const handleExportCsv = () => {
    if (!payrollPacket || !payrollPacket.records) return;

    const headers = [
      'Date',
      'Day',
      'Shift Type',
      'Time In',
      'Time Out',
      'Status',
      'Minutes Late',
      'Undertime (mins)',
      'Overtime (hrs)',
      'Campus Site',
      'DAR Accomplishments Count',
      'Discrepancy Notice',
    ];

    const rows = payrollPacket.records.map((r) => [
      r.date,
      r.day_of_week,
      r.shift_type,
      r.time_in,
      r.time_out,
      r.status,
      r.minutes_late,
      r.undertime_minutes,
      r.overtime_hours,
      `"${r.geofence_site}"`,
      r.dar_tasks ? r.dar_tasks.length : 0,
      `"${r.discrepancy_flag || 'None'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `"EVSU ORMOC — SEMI-MONTHLY DTR & PAYROLL REPORT"`,
        `"Period: ${payrollPacket.cutoff_label}"`,
        `"Employee: ${payrollPacket.employee.name} (${payrollPacket.employee.employee_id}) - ${payrollPacket.employee.department}"`,
        `"Shift: ${payrollPacket.employee.shift_type} (${payrollPacket.employee.official_time})"`,
        `"Days Present: ${payrollPacket.summary.days_present}/${payrollPacket.summary.total_working_days} (${payrollPacket.summary.attendance_rate_pct}%)"`,
        `"Total Late: ${payrollPacket.summary.total_late_minutes} mins | Undertime: ${payrollPacket.summary.total_undertime_minutes} mins | OT: ${payrollPacket.summary.total_overtime_hours} hrs"`,
        '',
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `evsu_dtr_payroll_${payrollPacket.employee.employee_id}_${payrollPacket.cutoff_code}_${payrollPacket.year}${String(payrollPacket.month).padStart(2, '0')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ type: 'success', message: 'DTR & Payroll CSV archive exported successfully.' });
  };

  const filteredDepts = (overviewData?.department_summaries || []).filter((d) => {
    const dom = getDepartmentDomain(d.department_name);
    const q = deptSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.department_name.toLowerCase().includes(q) ||
      dom.name.toLowerCase().includes(q) ||
      dom.shortName.toLowerCase().includes(q)
    );
  });

  const filteredLeaves = campusLeaves.filter((l) => {
    const q = leaveSearch.toLowerCase();
    return (
      l.employee_name.toLowerCase().includes(q) ||
      l.department.toLowerCase().includes(q) ||
      l.leave_type.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '22px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={28} color="var(--brand-700)" /> Campus Attendance Monitoring
          </h1>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line)', marginBottom: '22px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--brand-700)' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'overview' ? 'var(--brand-700)' : 'var(--ink-500)',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building2 size={16} /> Campus Roll Call &amp; Departments
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'leaves' ? '2px solid var(--brand-700)' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'leaves' ? 'var(--brand-700)' : 'var(--ink-500)',
            fontWeight: activeTab === 'leaves' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calendar size={16} /> University Leaves Log
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--brand-700)' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'history' ? 'var(--brand-700)' : 'var(--ink-500)',
            fontWeight: activeTab === 'history' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <History size={16} /> Historical Attendance Roster
        </button>
      </div>

      {/* TAB 1: CAMPUS ROLL CALL & DEPARTMENTS */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div className="card-title" style={{ margin: 0 }}>
                Department Attendance Roll Call ({overviewData?.date})
              </div>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={15}
                color="#94a3b8"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search department..."
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                className="form-control"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '320px', width: '38%' }}>Department Unit</th>
                  <th>Active COS</th>
                  <th>On Campus Today</th>
                  <th>Late Arrivals</th>
                  <th>On Approved Leave</th>
                  <th>Not Timed In</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                      Loading campus overview...
                    </td>
                  </tr>
                ) : filteredDepts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No active COS departments found.
                    </td>
                  </tr>
                ) : (
                  filteredDepts.map((d) => (
                    <tr key={d.department_id}>
                      <td style={{ minWidth: '320px', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink-900)' }}>
                            {d.department_name}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: getDepartmentDomain(d.department_name).style.bg,
                              color: getDepartmentDomain(d.department_name).style.text,
                              border: `1px solid ${getDepartmentDomain(d.department_name).style.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getDepartmentDomain(d.department_name).shortName}
                          </span>
                          {d.is_meso && (
                            <span className="badge badge-active" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                              MESO Unit
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '13px' }}>{d.total_cos}</td>
                      <td style={{ color: d.present > 0 ? 'var(--green-700)' : 'var(--ink-600)', fontWeight: 600 }}>
                        {d.present}
                      </td>
                      <td style={{ color: d.late > 0 ? 'var(--amber-700)' : 'var(--ink-600)' }}>
                        {d.late}
                      </td>
                      <td style={{ color: d.on_leave > 0 ? 'var(--brand-700)' : 'var(--ink-600)' }}>
                        {d.on_leave}
                      </td>
                      <td style={{ color: d.pending > 0 ? 'var(--amber-700)' : 'var(--ink-500)' }}>
                        {d.pending}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SEMI-MONTHLY PAYROLL & DTR PACKET */}
      {activeTab === 'payroll' && (
        <div>
          {/* Controls Bar */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>Select Personnel:</div>
                <select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  className="form-control"
                  style={{ padding: '8px 12px', fontSize: '13px', minWidth: '220px' }}
                >
                  {allCosEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_id_number || f`D0105${emp.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCutoffPeriod('1st_half')}
                    className={`btn btn-sm ${cutoffPeriod === '1st_half' ? 'btn-active' : ''}`}
                    style={{
                      background: cutoffPeriod === '1st_half' ? 'var(--brand-700)' : '#f1f5f9',
                      color: cutoffPeriod === '1st_half' ? '#fff' : 'var(--ink-700)',
                      fontWeight: 600,
                    }}
                  >
                    1st Half (1st – 15th)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCutoffPeriod('2nd_half')}
                    className={`btn btn-sm ${cutoffPeriod === '2nd_half' ? 'btn-active' : ''}`}
                    style={{
                      background: cutoffPeriod === '2nd_half' ? 'var(--brand-700)' : '#f1f5f9',
                      color: cutoffPeriod === '2nd_half' ? '#fff' : 'var(--ink-700)',
                      fontWeight: 600,
                    }}
                  >
                    2nd Half (16th – End)
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleExportCsv}
                  disabled={!payrollPacket}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    cursor: payrollPacket ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Download size={14} /> Export Payroll CSV
                </button>
              </div>
            </div>
          </div>

          {/* Verification Summary */}
          {payrollPacket && (
            <div className="stat-grid" style={{ marginBottom: '20px' }}>
              <div className="card stat-card" style={{ minHeight: '110px' }}>
                <div className="stat-top">
                  <span className="stat-label">Days Rendered</span>
                  <CheckCircle2 size={16} color="var(--green-600)" />
                </div>
                <div className="stat-value" style={{ fontSize: '24px' }}>
                  {payrollPacket.summary.days_present} / {payrollPacket.summary.total_working_days}
                </div>
                <div className="stat-sub">
                  Compliance Rate: <strong>{payrollPacket.summary.attendance_rate_pct}%</strong>
                </div>
              </div>

              <div className="card stat-card" style={{ minHeight: '110px' }}>
                <div className="stat-top">
                  <span className="stat-label">Deduction Metrics</span>
                  <AlertCircle size={16} color="var(--amber-600)" />
                </div>
                <div className="stat-value" style={{ fontSize: '24px' }}>
                  {payrollPacket.summary.total_late_minutes}m Late
                </div>
                <div className="stat-sub">
                  Undertime: {payrollPacket.summary.total_undertime_minutes}m &bull; Saturday OT: {payrollPacket.summary.total_overtime_hours}h
                </div>
              </div>

              <div className="card stat-card" style={{ minHeight: '110px' }}>
                <div className="stat-top">
                  <span className="stat-label">Verified Accomplishments</span>
                  <FileText size={16} color="var(--brand-600)" />
                </div>
                <div className="stat-value" style={{ fontSize: '24px' }}>
                  {payrollPacket.summary.total_accomplishment_tasks} Tasks
                </div>
                <div className="stat-sub">Cross-referenced with campus punches</div>
              </div>
            </div>
          )}

          {/* DTR Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
              <div className="card-title" style={{ margin: 0 }}>
                Civil Service Form 48 — {payrollPacket?.employee?.name} ({payrollPacket?.cutoff_label})
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                Unit: {payrollPacket?.employee?.department} &bull; Shift: {payrollPacket?.employee?.shift_type} ({payrollPacket?.employee?.official_time})
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Status</th>
                    <th>Campus Site</th>
                    <th>DAR Tasks Rendered</th>
                    <th>Audit Cross-Check</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPayroll ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                        Compiling 15-day DTR &amp; Accomplishment packet...
                      </td>
                    </tr>
                  ) : !payrollPacket?.records?.length ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No records found for this quincena.
                      </td>
                    </tr>
                  ) : (
                    payrollPacket.records.map((r) => (
                      <tr key={r.date} style={{ background: r.is_weekend ? '#fafafa' : '#ffffff' }}>
                        <td style={{ fontWeight: 600, fontSize: '13px' }}>{r.display_date}</td>
                        <td style={{ fontSize: '12.5px', color: 'var(--ink-600)' }}>{r.day_of_week}</td>
                        <td style={{ fontSize: '13px', fontWeight: r.time_in !== '—' ? 600 : 400 }}>
                          {r.time_in}
                        </td>
                        <td style={{ fontSize: '13px', fontWeight: r.time_out !== '—' ? 600 : 400 }}>
                          {r.time_out}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === 'On-Time'
                                ? 'badge-completed'
                                : r.status.includes('Undertime')
                                ? 'badge-pending'
                                : r.status.includes('Late')
                                ? 'badge-archived'
                                : r.status.includes('Overtime')
                                ? 'badge-active'
                                : r.status.includes('Approved')
                                ? 'badge-active'
                                : 'badge-inactive'
                            }`}
                            style={{ fontSize: '11.5px' }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>{r.geofence_site}</td>
                        <td>
                          {r.dar_tasks && r.dar_tasks.length > 0 ? (
                            <span style={{ fontSize: '12.5px', color: 'var(--ink-800)' }}>
                              {r.dar_tasks.length} task(s) logged
                            </span>
                          ) : (
                            <span className="muted" style={{ fontSize: '12px' }}>
                              {r.is_weekend ? 'Weekend' : 'No report logged'}
                            </span>
                          )}
                        </td>
                        <td>
                          {r.discrepancy_flag ? (
                            <span style={{ fontSize: '11.5px', color: 'var(--red-600)', fontWeight: 600 }}>
                              Flag: {r.discrepancy_flag}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--green-700)' }}>
                              Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNIVERSITY LEAVES LOG */}
      {activeTab === 'leaves' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div className="card-title" style={{ margin: 0 }}>
                University COS Leaves &amp; Absence Registry
              </div>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={15}
                color="#94a3b8"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search leaves..."
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                className="form-control"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Department</th>
                <th>Category</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No leave records found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{l.employee_name}</div>
                      <div className="muted" style={{ fontSize: '11.5px' }}>{l.employee_id_number}</div>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>{l.department}</td>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{l.leave_type}</td>
                    <td style={{ fontSize: '12.5px' }}>
                      {l.start_date} to {l.end_date}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>{l.days_count}d</td>
                    <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.reason}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          l.status === 'APPROVED'
                            ? 'badge-completed'
                            : l.status === 'REJECTED'
                            ? 'badge-archived'
                            : 'badge-active'
                        }`}
                        style={{ fontSize: '11.5px' }}
                      >
                        {l.status === 'PENDING_DEPT_HEAD' ? 'Pending Review' : l.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: HISTORICAL ATTENDANCE ROSTER */}
      {activeTab === 'history' && (
        <HistoricalAttendanceRoster
          currentUser={currentUser}
          departmentId={currentUser?.department_id}
          departmentName={typeof currentUser?.department === 'object' ? currentUser?.department?.name : currentUser?.department}
          isHR={true}
        />
      )}
    </div>
  );
}
