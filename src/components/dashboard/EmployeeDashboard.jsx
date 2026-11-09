import React, { useState, useEffect } from 'react';
import { Clock, MapPin, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';
import { getCachedData, setCachedData } from '../../utils/swrCache';

export default function EmployeeDashboard({
  currentUser = {
    fullName: 'COS Personnel',
    position: 'Staff',
    department: 'Computer Studies Department',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
}) {
  const cacheKeyMetrics = `emp_dashboard_metrics_${currentUser?.id || 'me'}`;
  const cacheKeyToday = `emp_att_today_${currentUser?.id || 'me'}`;

  // SWR Instant 0ms Cache Initialization
  const [metrics, setMetrics] = useState(() => propMetrics || getCachedData(cacheKeyMetrics));
  const [todayAttendance, setTodayAttendance] = useState(() => getCachedData(cacheKeyToday));

  useEffect(() => {
    if (propMetrics) {
      setMetrics(propMetrics);
      setCachedData(cacheKeyMetrics, propMetrics);
    } else {
      const fetchMetrics = async () => {
        try {
          const data = await api.analytics.getEmployeeDashboard();
          setMetrics(data);
          setCachedData(cacheKeyMetrics, data);
        } catch (err) {
          console.error('Failed to load Employee dashboard analytics:', err);
        }
      };
      fetchMetrics();
    }

    const fetchAttendance = async () => {
      try {
        const att = await api.attendance.getTodayStatus();
        setTodayAttendance(att);
        setCachedData(cacheKeyToday, att);
      } catch (err) {
        console.warn('Dashboard attendance status notice:', err.message);
      }
    };
    fetchAttendance();
  }, [propMetrics, cacheKeyMetrics, cacheKeyToday]);

  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'Personnel');
  const isExpiringSoon = ((metrics?.daysUntilExpiration ?? 0) <= 30) && ((metrics?.daysUntilExpiration ?? 0) > 0);

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner" style={{ marginBottom: '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {(typeof currentUser.department === 'object' && currentUser.department !== null ? (currentUser.department.name || 'Computer Studies Department') : (currentUser.department || 'Computer Studies Department'))} | Eastern Visayas State University Ormoc Campus
          </p>
        </div>
      </div>

      {/* 4-Column Module Panels Grid */}
      <div className="stat-grid stat-grid-4">
        {/* Panel 1: Contract Expiration */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('contract_status')}
          title="Click to check Contract Status"
        >
          <div className="stat-top">
            <span className="stat-label">Contract Expiration</span>
            <span className="stat-icon"><Clock size={18} /></span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '24px',
              color: isExpiringSoon ? 'var(--amber-600)' : 'var(--ink-900)',
            }}
          >
            {metrics ? (
              `${metrics.daysUntilExpiration ?? 0} Days`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '85px', height: '24px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Check Contract Status</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 2: Attendance (Today's Clock In / Out & Leaves) */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('employee_attendance')}
          title="Click to clock in/out and apply for leave"
        >
          <div className="stat-top">
            <span className="stat-label">Attendance</span>
            <span className="stat-icon"><CheckCircle2 size={18} color="var(--brand-700)" /></span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '20px',
              color: todayAttendance?.has_timed_in ? 'var(--green-700)' : 'var(--amber-600)',
            }}
          >
            {todayAttendance ? (
              todayAttendance.has_timed_out
                ? `Timed Out (${todayAttendance.time_out})`
                : todayAttendance.has_timed_in
                ? `Timed In (${todayAttendance.time_in})`
                : todayAttendance.on_approved_leave
                ? `On Leave (${todayAttendance.leave_type})`
                : 'Pending Clock-In'
            ) : (
              <span className="skeleton-shimmer" style={{ width: '130px', height: '20px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Clock In / Out & Apply Leave</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 3: Today's DAR Status (DAR Inputting) */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('daily_report')}
          title="Click to log campus Daily Accomplishment Report (DAR)"
        >
          <div className="stat-top">
            <span className="stat-label">Today's DAR Status</span>
            <span className="stat-icon"><MapPin size={18} /></span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '20px',
              color: (metrics?.darTasksToday ?? 0) === 0 ? 'var(--amber-600)' : 'var(--ink-900)',
            }}
          >
            {metrics ? (
              `${metrics.darTasksToday ?? 0} Task(s) Logged`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '110px', height: '20px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Log Campus DAR</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 4: Accumulated DAR Logs (Compiled DAR) */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('monthly_report')}
          title="Click to view Accumulated DARs"
        >
          <div className="stat-top">
            <span className="stat-label">Accumulated DAR Logs</span>
            <span className="stat-icon"><FileText size={18} /></span>
          </div>
          <div className="stat-value" style={{ fontSize: '24px' }}>
            {metrics ? (
              `${metrics.totalDarsLogged ?? 0} Logs`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '75px', height: '24px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>View Accumulated DARs</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
