import React, { useState, useEffect } from 'react';
import { UserCheck, FileText, ArrowRight, Clock, Building2 } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';
import { getCachedData, setCachedData } from '../../utils/swrCache';
import LoadingBuffer from '../common/LoadingBuffer';

export default function DeptHeadDashboard({
  currentUser = {
    fullName: 'Department Head',
    department: 'Computer Studies Department',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
}) {
  const [selectedDeptId, setSelectedDeptId] = useState('all');

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

  // Live query department assignments to ensure immediate reactivity if admin just updated them
  useEffect(() => {
    if (currentUser?.id && api?.users?.getDepartmentAssignments) {
      api.users.getDepartmentAssignments(currentUser.id).then((res) => {
        if (res && res.overseeing_departments) {
          setSupervisedDepts(buildDepts(res.overseeing_departments));
        }
      }).catch(() => {});
    }
  }, [currentUser?.id]);

  const cacheKey = `depthead_dashboard_metrics_${currentUser?.id || 'me'}_${selectedDeptId}`;
  // SWR Instant 0ms perceived load time from cache
  const [metrics, setMetrics] = useState(() => (selectedDeptId === 'all' && propMetrics) || getCachedData(cacheKey));
  const [isLoading, setIsLoading] = useState(() => !(selectedDeptId === 'all' && propMetrics) && !getCachedData(cacheKey));

  useEffect(() => {
    let isMounted = true;
    if (selectedDeptId === 'all' && propMetrics) {
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
        const deptParam = selectedDeptId === 'all' ? null : Number(selectedDeptId);
        const data = await api.analytics.getDeptHeadDashboard(deptParam);
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
  }, [selectedDeptId, propMetrics, cacheKey]);

  const pendingIntentsCount = metrics?.pendingIntents ?? 0;
  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'Department Head');

  if (isLoading && !metrics) {
    return <LoadingBuffer message="Loading..." />;
  }

  return (
    <div className="module-transition-enter">
      {/* Hero Banner with EVSU Seal matching COS & HR */}
      <div className="hero-banner" style={{ marginBottom: supervisedDepts.length > 1 ? '16px' : '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {userDept} | Eastern Visayas State University Ormoc Campus
          </p>
        </div>
      </div>

      {/* Concurrent Headship Scope Switcher (if supervisor oversees > 1 department) */}
      {supervisedDepts.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color="var(--brand-700)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-800)' }}>
              Supervisory Scope:
            </span>
            <span className="badge" style={{ fontSize: '11px', background: 'var(--brand-50, #fdf2f4)', color: 'var(--brand-700)', border: '1px solid #fecdd3' }}>
              Concurrent Headship ({supervisedDepts.length} Units)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-500)', fontWeight: 600 }}>Filter Department:</span>
            <select
              className="form-control"
              style={{
                width: 'auto',
                minWidth: '220px',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '4px 10px',
                height: '34px',
                borderRadius: '6px',
                borderColor: 'var(--brand-300)',
                background: '#ffffff',
              }}
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
            >
              <option value="all">All Supervised Units ({supervisedDepts.length})</option>
              {supervisedDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {primaryDeptId && Number(d.id) === Number(primaryDeptId) ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Category Panels (matching COS Employee & rest of system) */}
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
    </div>
  );
}
