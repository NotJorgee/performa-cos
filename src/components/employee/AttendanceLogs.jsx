import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ArrowLeft,
  Download,
} from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';
import { getCachedData, setCachedData } from '../../utils/swrCache';

export default function AttendanceLogs({ currentUser, employeeId = null, employeeName = null, onBack = null, onNavigate = null, backLabel = 'Back to Attendance Clock-In' }) {
  const targetId = employeeId || currentUser?.id;
  const [toast, setToast] = useState(null);
  const [cutoffPeriod, setCutoffPeriod] = useState('1st_half'); // '1st_half' | '2nd_half'
  const now = new Date();
  const [dtrMonth, setDtrMonth] = useState(now.getMonth() + 1);
  const [dtrYear, setDtrYear] = useState(now.getFullYear());

  const cacheKey = `dtr_logs_${targetId}_${dtrYear}_${dtrMonth}_${cutoffPeriod}`;
  const cacheStatsKey = `dtr_stats_${targetId}`;
  const [dtrPacket, setDtrPacket] = useState(() => getCachedData(cacheKey));
  const [stats, setStats] = useState(() => getCachedData(cacheStatsKey));
  const [isLoading, setIsLoading] = useState(!dtrPacket);

  const loadLogs = async (silent = Boolean(dtrPacket)) => {
    try {
      if (!silent) setIsLoading(true);
      const params = {
        cutoff: cutoffPeriod,
        month: dtrMonth,
        year: dtrYear,
      };
      if (targetId) {
        params.employee_id = targetId;
      }
      const res = await api.attendance.getPayrollPacket(params);
      setDtrPacket(res);
      setCachedData(cacheKey, res);
    } catch (err) {
      console.warn('Attendance logs load warning:', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!targetId) return;
    try {
      const res = await api.attendance.getEmployeeStats(targetId);
      setStats(res);
      setCachedData(cacheStatsKey, res);
    } catch (err) {
      console.warn('Employee attendance stats warning:', err.message);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [cutoffPeriod, dtrMonth, dtrYear, targetId]);

  useEffect(() => {
    loadStats();
  }, [targetId]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleExportCsv = () => {
    if (!dtrPacket?.records?.length) {
      setToast({ type: 'warning', message: 'No attendance records available for export.' });
      return;
    }
    const headers = ['Date', 'Day', 'Time In', 'Credited Time In', 'Time Out', 'Status', 'Shift', 'Campus Site', 'DAR Tasks'];
    const rows = dtrPacket.records.map((r) => [
      r.date,
      r.day_of_week,
      r.time_in,
      r.credited_time_in || r.time_in,
      r.time_out,
      r.status,
      r.shift_type,
      r.geofence_site,
      r.dar_tasks_count,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_logs_${dtrYear}_${dtrMonth}_${cutoffPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: 'success', message: 'Attendance logs CSV exported successfully.' });
  };

  const getStatusBadgeStyle = (status, badgeType) => {
    const s = String(status || '').toLowerCase();
    const b = String(badgeType || '').toLowerCase();

    if (s === 'n/a' || b === 'na') {
      return { background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0' };
    }
    if (s.includes('on-time') || b === 'on_time') {
      return { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' };
    }
    if (s.includes('late') || b === 'late') {
      return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
    }
    if (s.includes('undertime') || b === 'undertime') {
      return { background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' };
    }
    if (s.includes('overtime') || b === 'overtime') {
      return { background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' };
    }
    if (s.includes('approved') || s.includes('leave') || b === 'leave') {
      return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
    }
    if (s.includes('absent') || b === 'absent') {
      return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
    }
    if (s.includes('weekend') || b === 'weekend') {
      return { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
    }
    if (s.includes('pending') || b === 'pending') {
      return { background: '#fef9c3', color: '#a16207', border: '1px solid #fde047' };
    }
    return { background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' };
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={28} color="var(--brand-700)" /> Attendance Logs
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleExportCsv}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onBack || (() => onNavigate && onNavigate('employee_attendance'))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> {backLabel || 'Back to Attendance Clock-In'}
          </button>
        </div>
      </div>

      {/* Monitoring Window & Filters Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '14px' }}>
          {/* Half Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Window:</span>
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
          </div>

          {/* Month & Year Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Month:</span>
            <select
              value={dtrMonth}
              onChange={(e) => setDtrMonth(Number(e.target.value))}
              className="form-control"
              style={{ minWidth: '150px', width: 'auto', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={dtrYear}
              onChange={(e) => setDtrYear(Number(e.target.value))}
              className="form-control"
              style={{ minWidth: '100px', width: 'auto', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
            >
              {[dtrYear - 1, dtrYear, dtrYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="card-title" style={{ margin: 0 }}>
            Daily Attendance Records ({dtrPacket?.cutoff_label || `${monthNames[dtrMonth - 1]} ${dtrYear}`})
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Attendance Status</th>
                <th>Campus Site</th>
                <th>DAR Tasks Completed</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    Loading attendance records...
                  </td>
                </tr>
              ) : !dtrPacket?.records?.length ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No attendance records logged for this period.
                  </td>
                </tr>
              ) : (
                dtrPacket.records.map((r) => (
                  <tr key={r.date} style={{ background: r.is_weekend ? '#fafafa' : r.status === 'N/A' || r.badge_type === 'na' ? '#fcfcfc' : '#ffffff' }}>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{r.display_date}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-600)' }}>{r.day_of_week}</td>
                    <td style={{ fontSize: '13px', fontWeight: r.time_in !== '—' ? 600 : 400 }}>
                      {r.time_in}
                      {r.is_early && (
                        <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
                          Credited: {r.credited_time_in}
                        </div>
                      )}
                      {r.minutes_late > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--amber-700)', fontWeight: 600 }}>
                          +{r.minutes_late}m late
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: r.time_out !== '—' ? 600 : 400 }}>
                      {r.time_out}
                      {r.undertime_minutes > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--amber-700)', fontWeight: 600 }}>
                          -{r.undertime_minutes}m undertime
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${r.badge_type || 'default'}`}
                        style={{
                          ...getStatusBadgeStyle(r.status, r.badge_type),
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>
                      {r.geofence_site}
                    </td>
                    <td>
                      {r.dar_tasks_count > 0 ? (
                        <span style={{ fontSize: '12px', color: 'var(--green-700)', fontWeight: 600 }}>
                          {r.dar_tasks_count} task(s) logged
                        </span>
                      ) : r.status === 'N/A' || r.badge_type === 'na' ? (
                        <span className="muted" style={{ fontSize: '12px' }}>
                          —
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>
                          No tasks
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
