import React, { useState, useEffect } from 'react';
import { UserCheck, FileText, ArrowRight, Clock } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';
import { getCachedData, setCachedData } from '../../utils/swrCache';

export default function DeptHeadDashboard({
  currentUser = {
    fullName: 'Department Head',
    department: 'Computer Studies Department',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
}) {
  const cacheKey = `depthead_dashboard_metrics_${currentUser?.id || 'me'}`;
  // SWR Instant 0ms perceived load time from cache
  const [metrics, setMetrics] = useState(() => propMetrics || getCachedData(cacheKey));

  useEffect(() => {
    if (propMetrics) {
      setMetrics(propMetrics);
      setCachedData(cacheKey, propMetrics);
      return;
    }
    const fetchMetrics = async () => {
      try {
        const data = await api.analytics.getDeptHeadDashboard();
        setMetrics(data);
        setCachedData(cacheKey, data);
      } catch (err) {
        console.error('Failed to load Dept Head dashboard analytics:', err);
      }
    };
    fetchMetrics();
  }, [propMetrics, cacheKey]);

  const pendingIntentsCount = metrics?.pendingIntents ?? 0;
  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'Department Head');
  
  // Safely extract department name string (in case backend returns a Department object)
  const userDept = typeof currentUser.department === 'object' && currentUser.department !== null
    ? (currentUser.department.name || 'Computer Studies Department')
    : (currentUser.department || 'Computer Studies Department');

  return (
    <div>
      {/* Hero Banner with EVSU Seal matching COS & HR */}
      <div className="hero-banner" style={{ marginBottom: '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {userDept} | Eastern Visayas State University Ormoc Campus
          </p>
        </div>
      </div>

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
          title="Click to monitor subordinate arrival, verify daily accomplishment (DAR), and approve leaves"
        >
          <div className="stat-top">
            <span className="stat-label">Attendance</span>
            <span className="stat-icon">
              <Clock size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>
            Staff Attendance Radar
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Check arrival, DAR &amp; leaves</span>
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
