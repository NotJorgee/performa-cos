import React, { useState, useEffect } from 'react';
import { UserCheck, FileText, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';
import { getCachedData, setCachedData } from '../../utils/swrCache';
import LoadingBuffer from '../common/LoadingBuffer';
import CompleteProfileModal from '../common/CompleteProfileModal';

export default function DeptHeadDashboard({
  currentUser = {
    fullName: 'Department Head',
    department: 'Computer Studies Department',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
  onUpdateCurrentUser = () => {},
}) {
  // Safely extract department name string
  const userDept = typeof currentUser.department === 'object' && currentUser.department !== null
    ? (currentUser.department.name || 'Computer Studies Department')
    : (currentUser.department || 'Computer Studies Department');

  const primaryDeptId =
    currentUser?.departmentId ||
    currentUser?.department_id ||
    (typeof currentUser?.department === 'object' ? currentUser?.department?.id : null);

  const buildDepts = (overseeing = null) => {
    const list = overseeing || currentUser.overseeingDepartments || currentUser.overseeing_departments || [];
    const map = new Map();
    if (primaryDeptId && userDept) {
      map.set(Number(primaryDeptId), { id: Number(primaryDeptId), name: userDept });
    } else if (userDept) {
      map.set(1, { id: 1, name: userDept });
    }
    list.forEach((d) => {
      if (typeof d === 'object' && d !== null && d.id) {
        map.set(Number(d.id), { id: Number(d.id), name: d.name });
      } else if (typeof d === 'number') {
        map.set(d, { id: d, name: `Department #${d}` });
      }
    });
    return Array.from(map.values());
  };

  const [supervisedDepts, setSupervisedDepts] = useState(() => buildDepts());

  useEffect(() => {
    setSupervisedDepts(buildDepts());
  }, [currentUser, primaryDeptId, userDept]);

  // Live query department assignments to ensure immediate reactivity
  useEffect(() => {
    if (currentUser?.id && api?.users?.getDepartmentAssignments) {
      api.users.getDepartmentAssignments(currentUser.id).then((res) => {
        if (res && res.overseeing_departments) {
          setSupervisedDepts(buildDepts(res.overseeing_departments));
        }
      }).catch(() => {});
    }
  }, [currentUser?.id]);

  const cacheKey = `depthead_dashboard_metrics_${currentUser?.id || 'me'}_consolidated`;
  // SWR Instant 0ms perceived load time from cache
  const [metrics, setMetrics] = useState(() => propMetrics || getCachedData(cacheKey));
  const [isLoading, setIsLoading] = useState(() => !propMetrics && !getCachedData(cacheKey));

  useEffect(() => {
    let isMounted = true;
    if (propMetrics) {
      setMetrics(propMetrics);
      setCachedData(cacheKey, propMetrics);
      setIsLoading(false);
      return;
    }

    const cached = getCachedData(cacheKey);
    if (cached) {
      setMetrics(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const safetyTimeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 4000);

    const fetchMetrics = async () => {
      try {
        // Fetch consolidated overview across all supervised departments
        const data = await api.analytics.getDeptHeadDashboard(null);
        if (isMounted && data) {
          setMetrics(data);
          setCachedData(cacheKey, data);
        }
      } catch (err) {
        console.error('Failed to load Dept Head dashboard analytics:', err);
      } finally {
        clearTimeout(safetyTimeout);
        if (isMounted) setIsLoading(false);
      }
    };
    fetchMetrics();
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [propMetrics, cacheKey]);

  const pendingIntentsCount = metrics?.pendingIntents ?? 0;
  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'Department Head');

  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Check if profile is missing official contact number
  const hasContact = Boolean(
    currentUser?.contactNumber ||
    currentUser?.contact_number ||
    currentUser?.phone
  );
  const isProfileIncomplete = !hasContact;

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
                Please provide your official contact phone number to finalize your institutional supervisor record.
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

      {/* Hero Banner with EVSU Seal matching COS & HR */}
      <div className="hero-banner" style={{ marginBottom: '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {supervisedDepts.length > 1
              ? supervisedDepts.map((d) => d.name).join(' · ')
              : userDept}{' '}
            | Eastern Visayas State University Ormoc Campus
          </p>
        </div>
      </div>

      {/* Category Panels (Consolidated across all supervised departments) */}
      <div className="stat-grid stat-grid-3">
        {/* Panel 1: Renewals & Evaluations (Consolidated) */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('intent_review')}
          title="Click to review staff renewal intents, inspect AI DAR summaries, and complete evaluations"
        >
          <div className="stat-top">
            <span className="stat-label">Renewals &amp; Evaluations</span>
            <span className="stat-icon">
              <UserCheck size={18} />
            </span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '24px',
              color: pendingIntentsCount > 0 ? 'var(--amber-600)' : 'var(--ink-900)',
            }}
          >
            {metrics ? (
              `${pendingIntentsCount} ${pendingIntentsCount === 1 ? 'Pending Renewal' : 'Pending Renewals'}`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '130px', height: '24px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Review renewals &amp; evaluate</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 2: Attendance & Leave Management */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('department_attendance')}
          title="Click to monitor subordinate arrival, verify daily accomplishment (DAR), and review requests"
        >
          <div className="stat-top">
            <span className="stat-label">Attendance &amp; Requests</span>
            <span className="stat-icon">
              <Clock size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>
            Staff Attendance Radar
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Check arrival, DAR &amp; requests</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 3: Department Employee Records */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('employee_records')}
          title="Click to view departmental employee records, MARs, and evaluation reports"
        >
          <div className="stat-top">
            <span className="stat-label">Employee Records</span>
            <span className="stat-icon">
              <FileText size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 800 }}>
            MARs &amp; Records
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Department records &amp; MARs</span>
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
