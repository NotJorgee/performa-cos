import React, { useState, useEffect } from 'react';
import {
  Clock,
  Building2,
  TrendingUp,
  FileText,
  Users,
  ArrowRight,
} from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';
import { getCachedData, setCachedData } from '../../utils/swrCache';

export default function HRDashboard({
  currentUser = {
    fullName: 'HR Officer',
    department: 'HRMDO Office',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
}) {
  const cacheKey = `hr_dashboard_metrics_${currentUser?.id || 'me'}`;
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
        const data = await api.analytics.getHRDashboard();
        setMetrics(data);
        setCachedData(cacheKey, data);
      } catch (err) {
        console.error('Failed to load HR dashboard analytics:', err);
      }
    };
    fetchMetrics();
  }, [propMetrics, cacheKey]);

  const expiringCount = metrics?.nearingExpiration ?? 0;
  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'HR Officer');

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner" style={{ marginBottom: '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {(typeof currentUser.department === 'object' && currentUser.department !== null ? (currentUser.department.name || 'HRMDO Office') : (currentUser.department || 'HRMDO Office'))} | Eastern Visayas State University Ormoc Campus
          </p>
        </div>
      </div>

      {/* Category Panels Grid (Standardized Stat-Card System matching Dept Head & Employee) */}
      <div className="stat-grid stat-grid-4">
        {/* Panel 1: Evaluation Management */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('evaluation_management')}
          title="Click to manage Individualized Contract Expiration & Routing"
        >
          <div className="stat-top">
            <span className="stat-label">Evaluation Management</span>
            <span className="stat-icon">
              <Clock size={18} />
            </span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '24px',
              color: expiringCount > 0 ? 'var(--amber-600)' : 'var(--ink-900)',
            }}
          >
            {metrics ? (
              `${expiringCount} Expiring Soon`
            ) : (
              <span className="skeleton-shimmer" style={{ width: '130px', height: '24px' }} />
            )}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Contract lifecycles &amp; routing</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 2: Campus Attendance */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('campus_attendance')}
          title="Click to view live campus attendance headcount, department roll call, and campus leaves"
        >
          <div className="stat-top">
            <span className="stat-label">Attendance</span>
            <span className="stat-icon">
              <Building2 size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>
            Campus Attendance
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Live roll call &amp; leave radar</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 3: Executive Analytics */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('executive_analytics')}
          title="Click to view high-level institutional performance trends and executive analytics"
        >
          <div className="stat-top">
            <span className="stat-label">Executive Analytics</span>
            <span className="stat-icon">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>
            Performance Overview
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Institutional trends &amp; insights</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 4: Employee Records */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('report_generator')}
          title="Click to view personnel records, past MARs, and evaluation reports"
        >
          <div className="stat-top">
            <span className="stat-label">Employee Records</span>
            <span className="stat-icon">
              <FileText size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 800 }}>
            Past MARs &amp; Records
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>COS records &amp; evaluations</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 5: User Management */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('user_management')}
          title="Click to manage university departments, immediate supervisors, and COS personnel"
        >
          <div className="stat-top">
            <span className="stat-label">User Management</span>
            <span className="stat-icon">
              <Users size={18} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: '22px' }}>
            Departments &amp; Users
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Roster, supervisors &amp; directory</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
