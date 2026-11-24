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
  MapPin,
} from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';
import HistoricalAttendanceRoster from '../common/HistoricalAttendanceRoster';
import PunchLocationModal from '../common/PunchLocationModal';
import { getCachedData, setCachedData } from '../../utils/swrCache';
import { getDepartmentDomain } from '../../utils/departments';
import { exportToExcel } from '../../utils/excelExport';

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

  // Campus Daily Attendance Roster State
  const [rosterData, setRosterData] = useState(null);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [rosterSearch, setRosterSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPunchMap, setSelectedPunchMap] = useState(null);

  // University Leaves State
  const [campusLeaves, setCampusLeaves] = useState([]);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(true);
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

  // Load Campus Daily Attendance Roster
  const loadCampusRoster = async (silent = Boolean(rosterData)) => {
    try {
      if (!silent) setIsLoadingRoster(true);
      const res = await api.attendance.getDepartmentRoster();
      setRosterData(res);
    } catch (err) {
      console.warn('Campus roster load warning:', err.message);
    } finally {
      if (!silent) setIsLoadingRoster(false);
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
    } finally {
      setIsLoadingLeaves(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadCampusRoster();
    loadCampusLeaves();
  }, []);

  // Smart Window Focus Re-fetch: Silently syncs whenever HR returns to this browser tab
  useEffect(() => {
    const handleWindowFocus = () => {
      loadOverview(true);
      loadCampusRoster(true);
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
  // Export DTR & Accomplishment Data (Excel .xlsx)
  const handleExportData = () => {
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
      r.geofence_site || '—',
      r.dar_tasks ? r.dar_tasks.length : 0,
      r.discrepancy_flag || 'None',
    ]);

    const titleRows = [
      ['EVSU ORMOC — SEMI-MONTHLY DTR & PAYROLL REPORT'],
      [`Period: ${payrollPacket.cutoff_label}`],
      [`Employee: ${payrollPacket.employee.name} (${payrollPacket.employee.employee_id}) - ${payrollPacket.employee.department}`],
      [`Shift: ${payrollPacket.employee.shift_type} (${payrollPacket.employee.official_time})`],
      [`Days Present: ${payrollPacket.summary.days_present}/${payrollPacket.summary.total_working_days} (${payrollPacket.summary.attendance_rate_pct}%)`],
      [`Total Late: ${payrollPacket.summary.total_late_minutes} mins | Undertime: ${payrollPacket.summary.total_undertime_minutes} mins | OT: ${payrollPacket.summary.total_overtime_hours} hrs`],
      [],
    ];

    setToast({ type: 'info', message: 'Generating DTR & Payroll Excel archive...' });
    setTimeout(() => {
      try {
        exportToExcel({
          filename: `evsu_dtr_payroll_${payrollPacket.employee.employee_id}_${payrollPacket.cutoff_code}_${payrollPacket.year}${String(payrollPacket.month).padStart(2, '0')}.xlsx`,
          sheetName: 'DTR & Payroll',
          headers,
          rows,
          titleRows,
        });

        setToast({ type: 'success', message: 'DTR & Payroll Excel archive exported successfully.' });
      } catch (err) {
        console.error('Failed to export DTR payroll archive:', err);
        setToast({ type: 'error', message: 'Failed to export DTR payroll archive. Please try again.' });
      }
    }, 250);
  };

  const uniqueDepartments = Array.from(
    new Set([
      ...(overviewData?.department_summaries?.map((d) => d.department_name) || []),
      ...(rosterData?.roster?.map((r) => r.department) || []),
    ])
  ).filter(Boolean).sort();

  const filteredCampusRoster = (rosterData?.roster || []).filter((r) => {
    const q = rosterSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      (r.employee_id_number && r.employee_id_number.toLowerCase().includes(q)) ||
      (r.job_title && r.job_title.toLowerCase().includes(q)) ||
      (r.department && r.department.toLowerCase().includes(q));
    const matchesDept = selectedDeptFilter === 'ALL' || r.department === selectedDeptFilter;
    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      (() => {
        if (selectedStatusFilter === 'present') {
          return (
            r.badge_type === 'on_time' ||
            r.badge_type === 'late' ||
            r.badge_type === 'undertime' ||
            r.badge_type === 'overtime'
          );
        }
        if (selectedStatusFilter === 'late') return r.badge_type === 'late';
        if (selectedStatusFilter === 'leave') return r.badge_type === 'leave';
        if (selectedStatusFilter === 'pending') return r.badge_type === 'pending';
        return true;
      })();
    return matchesSearch && matchesDept && matchesStatus;
  });

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
          <Building2 size={16} /> Campus Attendance Roster
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

      {/* TAB 1: CAMPUS ATTENDANCE ROSTER & DEPARTMENT BREAKDOWN */}
      {activeTab === 'overview' && (
        <div>
          {/* Top Stat Cards */}
          <div className="stat-grid stat-grid-4" style={{ marginBottom: '18px' }}>
            <div className="card stat-card">
              <div className="stat-top">
                <span className="stat-label">Total COS Personnel</span>
                <span className="stat-icon"><Users size={18} color="var(--brand-700)" /></span>
              </div>
              <div className="stat-value">{rosterData?.total_subordinates ?? overviewData?.total_active_cos ?? 0}</div>
              <div className="stat-sub">Across All Campus Units</div>
            </div>

            <div className="card stat-card">
              <div className="stat-top">
                <span className="stat-label">Present On Campus</span>
                <span className="stat-icon"><CheckCircle2 size={18} color="var(--green-700)" /></span>
              </div>
              <div className="stat-value" style={{ color: 'var(--green-700)' }}>
                {rosterData?.present_count ?? overviewData?.total_present_today ?? 0}
              </div>
              <div className="stat-sub">Verified Geofence Timed-In</div>
            </div>

            <div className="card stat-card">
              <div className="stat-top">
                <span className="stat-label">Late Arrivals</span>
                <span className="stat-icon"><Clock size={18} color="var(--amber-700)" /></span>
              </div>
              <div className="stat-value" style={{ color: 'var(--amber-700)' }}>
                {rosterData?.late_count ?? overviewData?.total_late_today ?? 0}
              </div>
              <div className="stat-sub">Past Shift Tolerance</div>
            </div>

            <div className="card stat-card">
              <div className="stat-top">
                <span className="stat-label">On Approved Leave</span>
                <span className="stat-icon"><Calendar size={18} color="var(--brand-700)" /></span>
              </div>
              <div className="stat-value" style={{ color: 'var(--brand-700)' }}>
                {rosterData?.on_leave_count ?? overviewData?.total_on_leave ?? 0}
              </div>
              <div className="stat-sub">Official Filed Passes/Leaves</div>
            </div>
          </div>

          {/* Roster Container */}
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
                  Today's Campus Attendance Roster ({rosterData?.date || overviewData?.date})
                </div>
                <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                  Showing {filteredCampusRoster.length} of {rosterData?.total_subordinates ?? 0} campus personnel
                </div>
              </div>
            </div>

            {/* Filter Bar for Campus Roster */}
            <div
              style={{
                padding: '12px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
                <Search
                  size={14}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search personnel, ID, or job title..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '12.5px', height: '36px' }}
                />
              </div>

              {/* Department Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-700)' }}>Dept:</span>
                <select
                  className="form-control"
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  style={{ fontSize: '12.5px', height: '36px', padding: '4px 10px', minWidth: '160px' }}
                >
                  <option value="ALL">All Departments ({uniqueDepartments.length})</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-700)' }}>Status:</span>
                <select
                  className="form-control"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  style={{ fontSize: '12.5px', height: '36px', padding: '4px 10px', minWidth: '140px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="present">Present (On-Time / Early / OT)</option>
                  <option value="late">Late Arrivals</option>
                  <option value="leave">On Leave</option>
                  <option value="pending">Not Timed In</option>
                </select>
              </div>
            </div>

            {/* Campus Personnel Roster Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Personnel</th>
                    <th>Department</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Presence Status</th>
                    <th>Campus Site</th>
                    <th>Today's DAR</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingRoster ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                        Loading campus attendance roster...
                      </td>
                    </tr>
                  ) : filteredCampusRoster.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No personnel records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCampusRoster.map((sub) => {
                      const dom = getDepartmentDomain(sub.department);
                      return (
                        <tr key={sub.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                              {sub.name}
                            </div>
                            <div className="muted" style={{ fontSize: '11.5px' }}>
                              {sub.employee_id_number} &bull; {sub.job_title}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-900)' }}>
                              {sub.department}
                            </div>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '8px',
                                background: dom.style.bg,
                                color: dom.style.text,
                                border: `1px solid ${dom.style.border}`,
                                marginTop: '2px',
                              }}
                            >
                              {dom.shortName}
                            </span>
                          </td>
                          <td>
                            {sub.time_in !== '—' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPunchMap({
                                    punchType: 'time_in',
                                    employeeName: sub.name,
                                    employeeId: sub.employee_id_number,
                                    jobTitle: sub.job_title,
                                    department: sub.department,
                                    time: sub.time_in,
                                    date: rosterData?.date || overviewData?.date,
                                    latitude: sub.in_latitude,
                                    longitude: sub.in_longitude,
                                    geofenceSite: sub.geofence_site,
                                  })
                                }
                                title="Click to view Time In GPS location on map"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontFamily: 'inherit',
                                  color: 'inherit',
                                }}
                              >
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                                  <MapPin size={13} style={{ flexShrink: 0 }} />
                                  <span>{sub.time_in}</span>
                                </div>
                                {sub.is_early && (
                                  <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
                                    Credited: {sub.credited_time_in}
                                  </div>
                                )}
                              </button>
                            ) : (
                              <span style={{ fontSize: '13px', color: 'var(--ink-400)' }}>—</span>
                            )}
                          </td>
                          <td>
                            {sub.time_out !== '—' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPunchMap({
                                    punchType: 'time_out',
                                    employeeName: sub.name,
                                    employeeId: sub.employee_id_number,
                                    jobTitle: sub.job_title,
                                    department: sub.department,
                                    time: sub.time_out,
                                    date: rosterData?.date || overviewData?.date,
                                    latitude: sub.out_latitude,
                                    longitude: sub.out_longitude,
                                    geofenceSite: sub.geofence_site,
                                  })
                                }
                                title="Click to view Time Out GPS location on map"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontFamily: 'inherit',
                                  color: 'inherit',
                                }}
                              >
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--brand-700)' }}>
                                  <MapPin size={13} style={{ flexShrink: 0 }} />
                                  <span>{sub.time_out}</span>
                                </div>
                              </button>
                            ) : (
                              <span style={{ fontSize: '13px', color: 'var(--ink-400)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                sub.badge_type === 'on_time'
                                  ? 'badge-completed'
                                  : sub.badge_type === 'late'
                                  ? 'badge-archived'
                                  : sub.badge_type === 'undertime'
                                  ? 'badge-pending'
                                  : sub.badge_type === 'leave'
                                  ? 'badge-active'
                                  : 'badge-inactive'
                              }`}
                              style={{ fontSize: '11.5px' }}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>{sub.geofence_site}</td>
                          <td>
                            {sub.dar_submitted ? (
                              <span style={{ fontSize: '12px', color: 'var(--green-700, #15803d)', fontWeight: 600 }}>
                                {sub.dar_tasks_count} task(s) logged
                              </span>
                            ) : (
                              <span className="muted" style={{ fontSize: '12px' }}>
                                Not submitted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
                  onClick={handleExportData}
                  disabled={!payrollPacket}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    background: payrollPacket ? '#16a34a' : undefined,
                    color: payrollPacket ? '#ffffff' : undefined,
                    borderColor: payrollPacket ? '#15803d' : undefined,
                    cursor: payrollPacket ? 'pointer' : 'not-allowed',
                  }}
                  title="Export DTR and payroll records as Excel workbook"
                >
                  <Download size={14} /> Export Data
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
                  Undertime: {payrollPacket.summary.total_undertime_minutes}m &bull; Authorized OT: {payrollPacket.summary.total_overtime_hours}h
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
                        <td style={{ fontSize: '13px' }}>
                          {r.time_in !== '—' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPunchMap({
                                  punchType: 'time_in',
                                  employeeName: payrollPacket?.employee?.name,
                                  employeeId: payrollPacket?.employee?.employee_id_number,
                                  jobTitle: payrollPacket?.employee?.job_title,
                                  department: payrollPacket?.employee?.department,
                                  time: r.time_in,
                                  date: r.display_date,
                                  latitude: r.in_latitude,
                                  longitude: r.in_longitude,
                                  geofenceSite: r.geofence_site,
                                })
                              }
                              title="Click to view Time In GPS location on map"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                color: 'inherit',
                              }}
                            >
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                                <MapPin size={13} style={{ flexShrink: 0 }} />
                                <span>{r.time_in}</span>
                              </div>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--ink-400)' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {r.time_out !== '—' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPunchMap({
                                  punchType: 'time_out',
                                  employeeName: payrollPacket?.employee?.name,
                                  employeeId: payrollPacket?.employee?.employee_id_number,
                                  jobTitle: payrollPacket?.employee?.job_title,
                                  department: payrollPacket?.employee?.department,
                                  time: r.time_out,
                                  date: r.display_date,
                                  latitude: r.out_latitude,
                                  longitude: r.out_longitude,
                                  geofenceSite: r.geofence_site,
                                })
                              }
                              title="Click to view Time Out GPS location on map"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                color: 'inherit',
                              }}
                            >
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--brand-700)' }}>
                                <MapPin size={13} style={{ flexShrink: 0 }} />
                                <span>{r.time_out}</span>
                              </div>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--ink-400)' }}>—</span>
                          )}
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
              {isLoadingLeaves ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    Loading leave records...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No leave records found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const isOt = l.leave_type?.toLowerCase().includes('overtime');
                  const otHours = l.hours || l.reason?.match(/\[(?:Weekend OT · )?([0-9.]+)\s*hr\(s\)/)?.[1];
                  const cleanReason = l.reason?.replace(/^\[[^\]]+\]\s*/, '') || l.reason;
                  return (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{l.employee_name}</div>
                        <div className="muted" style={{ fontSize: '11.5px' }}>{l.employee_id_number}</div>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{l.department}</td>
                      <td style={{ fontWeight: 600, fontSize: '13px' }}>{l.leave_type}</td>
                      <td style={{ fontSize: '12.5px' }}>
                        {l.start_date === l.end_date ? l.start_date : `${l.start_date} to ${l.end_date}`}
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{isOt ? `${otHours ? `${otHours}h` : 'OT'}` : `${l.days_count}d`}</td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cleanReason}
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
                  );
                })
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

      {/* GPS Punch Location Map Modal */}
      <PunchLocationModal
        isOpen={Boolean(selectedPunchMap)}
        onClose={() => setSelectedPunchMap(null)}
        punchData={selectedPunchMap}
      />
    </div>
  );
}
