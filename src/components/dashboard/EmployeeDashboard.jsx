import React, { useState, useEffect } from 'react';
import { Clock, MapPin, FileText, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';
import { getCachedData, setCachedData } from '../../utils/swrCache';
import LoadingBuffer from '../common/LoadingBuffer';
import CompleteProfileModal from '../common/CompleteProfileModal';

export default function EmployeeDashboard({
  currentUser = {
    fullName: 'COS Personnel',
    position: 'Staff',
    department: 'Computer Studies Department',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
  onUpdateCurrentUser = () => {},
}) {
  const cacheKeyMetrics = `emp_dashboard_metrics_${currentUser?.id || 'me'}`;
  const cacheKeyToday = `emp_att_today_${currentUser?.id || 'me'}`;

  // SWR Instant 0ms Cache Initialization
  const [metrics, setMetrics] = useState(() => propMetrics || getCachedData(cacheKeyMetrics));
  const [todayAttendance, setTodayAttendance] = useState(() => getCachedData(cacheKeyToday));
  const [isLoading, setIsLoading] = useState(() => !propMetrics && !getCachedData(cacheKeyMetrics));

  useEffect(() => {
    let isMounted = true;
    if (propMetrics) {
      setMetrics(propMetrics);
      setCachedData(cacheKeyMetrics, propMetrics);
      setIsLoading(false);
      return;
    }

    const safetyTimeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 4000);

    const loadData = async () => {
      try {
        const [dashMetrics, attStatus] = await Promise.allSettled([
          api.analytics.getEmployeeDashboard(),
          api.attendance.getTodayStatus().catch((err) => {
            console.warn('Dashboard attendance status notice:', err.message);
            return null;
          }),
        ]);

        if (!isMounted) return;

        if (dashMetrics.status === 'fulfilled' && dashMetrics.value) {
          setMetrics(dashMetrics.value);
          setCachedData(cacheKeyMetrics, dashMetrics.value);
        }
        if (attStatus.status === 'fulfilled' && attStatus.value) {
          setTodayAttendance(attStatus.value);
          setCachedData(cacheKeyToday, attStatus.value);
        }
      } catch (err) {
        console.error('Failed to load Employee dashboard analytics:', err);
      } finally {
        clearTimeout(safetyTimeout);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [propMetrics, cacheKeyMetrics, cacheKeyToday]);

  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'Personnel');
  const isExpiringSoon = ((metrics?.daysUntilExpiration ?? 0) <= 30) && ((metrics?.daysUntilExpiration ?? 0) > 0);

  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Check if personnel profile is missing contact number or role designation
  const hasContact = Boolean(
    currentUser?.contactNumber ||
    currentUser?.contact_number ||
    currentUser?.phone
  );
  const currentJob = currentUser?.jobTitle || currentUser?.job_title || currentUser?.position || '';
  const hasJobTitle = Boolean(currentJob && currentJob !== 'COS Staff');
  const isProfileIncomplete = !hasContact || !hasJobTitle;

  if (isLoading && !metrics) {
    return <LoadingBuffer message="Loading..." />;
  }

  return (
    <div className="module-transition-enter">
      {/* Action Required: Incomplete Profile Banner (Non-Dismissible) */}
      {isProfileIncomplete && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px 20px',
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 2px 4px rgba(217, 119, 6, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#92400e' }}>
                Action Required: Complete Your Personnel Profile
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '3px', lineHeight: 1.45 }}>
                Please provide your official contact phone number and job position designation to finalize your university personnel record.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCompleteModal(true)}
            style={{
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '8px',
              background: 'var(--brand-700, #7a1128)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              flexShrink: 0,
              minHeight: '44px',
            }}
          >
            Complete Profile Now <ArrowRight size={14} />
          </button>
        </div>
      )}

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
              fontSize: metrics?.isPendingContract ? '20px' : '24px',
              color: (metrics?.isPendingContract || isExpiringSoon) ? 'var(--amber-600)' : 'var(--ink-900)',
            }}
          >
            {metrics ? (
              metrics.isPendingContract ? 'Pending Contract' : `${metrics.daysUntilExpiration ?? 0} Days`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '85px', height: '24px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{metrics?.isPendingContract ? 'Awaiting HR Terms' : 'Check Contract Status'}</span>
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
              `${metrics.darTasksToday ?? 0} Tasks Accomplished`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '110px', height: '20px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Record Daily Accomplishment</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 4: Accumulated DAR Records (Compiled DAR) */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('monthly_report')}
          title="Click to view Accumulated DARs"
        >
          <div className="stat-top">
            <span className="stat-label">Accumulated DAR Records</span>
            <span className="stat-icon"><FileText size={18} /></span>
          </div>
          <div className="stat-value" style={{ fontSize: '24px' }}>
            {metrics ? (
              `${metrics.totalDarsLogged ?? 0} Records`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '75px', height: '24px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>View Accumulated Records</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Complete Profile Modal */}
      <CompleteProfileModal
        isOpen={showCompleteModal}
        currentUser={currentUser}
        onClose={() => setShowCompleteModal(false)}
        onProfileCompleted={(updated) => {
          onUpdateCurrentUser(updated);
        }}
      />
    </div>
  );
}
