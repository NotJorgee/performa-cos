import React, { useState, useEffect } from 'react';
import {
  Clock,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Building2,
  FileText,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';

export default function HRDashboard({
  currentUser = {
    fullName: 'HR Officer',
    department: 'HRMDO Office',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
}) {
  const [metrics, setMetrics] = useState(
    propMetrics || {
      totalEmployees: 0,
      totalAdministrators: 0,
      activeColleges: 0,
      darSubmittedToday: 0,
      pendingEvaluations: 0,
      marReportsSubmitted: 0,
      completionRate: 0,
      nearingExpiration: 0,
    }
  );

  useEffect(() => {
    if (propMetrics) {
      setMetrics(propMetrics);
      return;
    }
    const fetchMetrics = async () => {
      try {
        const data = await api.analytics.getHRDashboard();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load HR dashboard analytics:', err);
      }
    };
    fetchMetrics();
  }, [propMetrics]);

  const expiringCount = metrics?.nearingExpiration ?? 0;
  const pendingHrEvalCount = metrics?.pendingEvaluations ?? 0;
  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'HR Officer');

  return (
    <div>
      {/* Hero Banner matching UI reference photo */}
      <div className="hero-banner" style={{ marginBottom: '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {currentUser.department || 'HRMDO Office'} | Eastern Visayas State University Ormoc Campus
          </p>
        </div>
      </div>

      {/* 4-Column Module Panels Grid */}
      <div className="quick-access-grid">
        {/* Panel 1: Evaluation Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('evaluation_management')}
          title="Click to manage Individualized Contract Expiration & Routing"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Evaluation Management</span>
            <div className="quick-access-icon">
              <Clock size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div
            className="quick-access-value"
            style={{
              color: expiringCount > 0 ? 'var(--amber-600)' : 'var(--ink-900)',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            {expiringCount} Expiring Soon
          </div>
          <div className="quick-access-link">
            <span>Contract lifecycles &amp; routing</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 2: HR Evaluations */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('hr_evaluations_proxy')}
          title="Click to input 30% HR administrative compliance ratings"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">HR Evaluations</span>
            <div className="quick-access-icon">
              <FileSpreadsheet size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div
            className="quick-access-value"
            style={{
              color: pendingHrEvalCount > 0 ? 'var(--amber-600)' : 'var(--ink-900)',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            {pendingHrEvalCount} {pendingHrEvalCount === 1 ? 'Pending Evaluation' : 'Pending Evaluations'}
          </div>
          <div className="quick-access-link">
            <span>30% administrative scores</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 3: Executive Analytics (HR Only) */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('executive_analytics')}
          title="Click to view high-level institutional performance trends and executive analytics"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Executive Analytics</span>
            <div className="quick-access-icon">
              <TrendingUp size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div className="quick-access-value text-lg">
            Performance Overview
          </div>
          <div className="quick-access-link">
            <span>Institutional trends &amp; insights</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 4: Employee Records */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('report_generator')}
          title="Click to view personnel records, past MARs, and evaluation reports"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Employee Records</span>
            <div className="quick-access-icon">
              <FileText size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div className="quick-access-value text-lg">
            Past MARs &amp; Records
          </div>
          <div className="quick-access-link">
            <span>COS records &amp; evaluations</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 5: Employee Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('employee_management')}
          title="Click to manage COS personnel directory and account invitations"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Employee Management</span>
            <div className="quick-access-icon">
              <Users size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div className="quick-access-value text-lg">
            Manage COS Personnel
          </div>
          <div className="quick-access-link">
            <span>COS directory &amp; accounts</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 6: Administrator Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('administrator_management')}
          title="Click to manage permanent university staff accounts (Dept Heads & HR accounts)"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Administrator Management</span>
            <div className="quick-access-icon">
              <ShieldCheck size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div className="quick-access-value text-lg">
            Manage Administrators
          </div>
          <div className="quick-access-link">
            <span>Dept Heads &amp; HR accounts</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 7: Department Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('department_management')}
          title="Click to configure university departments and colleges"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Department Management</span>
            <div className="quick-access-icon">
              <Building2 size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div className="quick-access-value text-lg">
            Manage Departments
          </div>
          <div className="quick-access-link">
            <span>Colleges &amp; departments</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
