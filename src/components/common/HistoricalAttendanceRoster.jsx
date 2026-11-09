import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Download,
} from 'lucide-react';
import api from '../../services/api';
import Toast from './Toast';
import { EVSU_DEPARTMENTS } from '../../utils/departments';

export default function HistoricalAttendanceRoster({
  currentUser,
  departmentId = null,
  departmentName = '',
  isHR = false,
}) {
  // Format today as YYYY-MM-DD
  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => getTodayISO());
  const [selectedDept, setSelectedDept] = useState(isHR ? 'ALL' : (departmentName || 'ALL'));
  const [rosterData, setRosterData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  // Fetch roster for selected date and department
  const fetchRoster = async (dateStr, dept) => {
    setIsLoading(true);
    try {
      const params = {};
      if (isHR && dept && dept !== 'ALL') {
        params.department_name = dept;
      }
      const res = await api.attendance.getDepartmentRoster(dateStr, params);
      setRosterData(res || null);
    } catch (err) {
      console.warn('Historical roster fetch warning:', err.message);
      setToast({ type: 'error', message: err.message || 'Failed to load historical attendance roster.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster(selectedDate, selectedDept);
  }, [selectedDate, selectedDept]);

  // Download CSV
  const handleDownloadCSV = () => {
    const list = rosterData?.roster || [];
    if (list.length === 0) {
      setToast({ type: 'info', message: 'No records available to export for this date.' });
      return;
    }

    const headers = [
      'Employee ID',
      'Personnel Name',
      'Department',
      'Shift Schedule',
      'Time In',
      'Time Out',
      'Presence Status',
      'Campus Site',
      'DAR Accomplishment',
      'Tasks Count',
    ];

    const rows = list.map((item) => [
      `"${item.employee_id_number || ''}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.department || '').replace(/"/g, '""')}"`,
      `"${(item.official_time || '8:00 AM - 5:00 PM').replace(/"/g, '""')}"`,
      `"${item.time_in || '—'}"`,
      `"${item.time_out || '—'}"`,
      `"${(item.status || 'Not Timed In').replace(/"/g, '""')}"`,
      `"${(item.geofence_site || '—').replace(/"/g, '""')}"`,
      `"${item.dar_submitted ? 'Submitted' : 'Not submitted'}"`,
      `"${item.dar_tasks_count || 0}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    const safeDept = (selectedDept === 'ALL' ? (departmentName || 'All_Departments') : selectedDept).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `EVSU_Department_Attendance_Roster_${safeDept}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      type: 'success',
      message: `Roster for ${rosterData?.date || selectedDate} downloaded successfully.`,
    });
  };

  // Filter roster by search and presence status
  const filteredRoster = (rosterData?.roster || []).filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.name || '').toLowerCase().includes(q) ||
      (item.employee_id_number || '').toLowerCase().includes(q) ||
      (item.job_title || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'on_time') return item.badge_type === 'on_time';
    if (statusFilter === 'late') return item.badge_type === 'late';
    if (statusFilter === 'undertime') return item.badge_type === 'undertime';
    if (statusFilter === 'leave') return item.badge_type === 'leave';
    if (statusFilter === 'pending') return item.badge_type === 'pending';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Date & Filter Control Bar */}
      <div
        className="card no-print"
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Left: Date Picker & Scope Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Roster Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                max={getTodayISO()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-control"
                style={{
                  padding: '7px 12px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '7px',
                  border: '1px solid var(--line)',
                  background: '#fff',
                  color: 'var(--ink-900)',
                  cursor: 'pointer',
                  width: '180px',
                }}
              />
            </div>

            {/* HR Department Filter Dropdown */}
            {isHR && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Department Scope:
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="form-control"
                  style={{
                    padding: '7px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '7px',
                    border: '1px solid var(--line)',
                    background: '#fff',
                    color: 'var(--ink-900)',
                    cursor: 'pointer',
                    minWidth: '220px',
                  }}
                >
                  <option value="ALL">All University Departments</option>
                  {EVSU_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Download Action Button */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleDownloadCSV}
              disabled={isLoading || !rosterData?.roster?.length}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#15803d',
                color: '#ffffff',
                borderColor: '#15803d',
                fontWeight: 700,
                fontSize: '13px',
                padding: '8px 16px',
                borderRadius: '7px',
                cursor: isLoading || !rosterData?.roster?.length ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
              title="Download historical attendance roster as CSV spreadsheet"
            >
              <Download size={15} /> Download Roster (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Header Strip */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--brand-700)" />
              <h2 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                Department Attendance Roster — {rosterData?.date || selectedDate}
              </h2>
            </div>
          </div>

          {/* Search & Filter Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }} className="no-print">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: '150px', height: '34px', padding: '0 10px', fontSize: '12.5px', cursor: 'pointer', flexShrink: 0 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="on_time">Present (On-Time)</option>
              <option value="late">Late Arrivals</option>
              <option value="undertime">Undertime</option>
              <option value="leave">On Leave</option>
              <option value="pending">Not Timed In</option>
            </select>

            <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
              <Search
                size={14}
                color="#94a3b8"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search subordinate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '12.5px', height: '34px' }}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                {isHR && <th>Department</th>}
                <th>Time In</th>
                <th>Time Out</th>
                <th>Presence Status</th>
                <th>Campus Site</th>
                <th>DAR Accomplishment</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={isHR ? 7 : 6} style={{ textAlign: 'center', padding: '36px', color: 'var(--ink-600)' }}>
                    Loading attendance roster for {selectedDate}...
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={isHR ? 7 : 6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No attendance records logged for {rosterData?.date || selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                        {sub.name}
                      </div>
                      <div className="muted" style={{ fontSize: '11.5px' }}>
                        {sub.employee_id_number} &bull; {sub.job_title}
                      </div>
                    </td>

                    {isHR && (
                      <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>
                        {sub.department || '—'}
                      </td>
                    )}

                    <td style={{ fontSize: '13px', fontWeight: sub.time_in !== '—' ? 600 : 400 }}>
                      {sub.time_in}
                      {sub.is_early && (
                        <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
                          Credited: {sub.credited_time_in}
                        </div>
                      )}
                    </td>

                    <td style={{ fontSize: '13px', fontWeight: sub.time_out !== '—' ? 600 : 400 }}>
                      {sub.time_out}
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

                    <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>
                      {sub.geofence_site}
                    </td>

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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
