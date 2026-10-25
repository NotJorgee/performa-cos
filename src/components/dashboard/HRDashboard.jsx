import React from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';

export default function HRDashboard({
  currentUser = {
    fullName: 'Dr. Maria Clara Ramos',
    department: 'HRMDO Office',
  },
  metrics = {
    totalEmployees: 48,
    totalAdministrators: 6,
    activeColleges: 6,
    darSubmittedToday: 42,
    pendingEvaluations: 9,
    marReportsSubmitted: 45,
    completionRate: 85,
    nearingExpiration: 4,
  },
  onNavigate = () => {},
}) {
  const expiringCount = metrics?.nearingExpiration ?? 4;
  const pendingHrEvalCount = metrics?.pendingEvaluations ?? 9;
  const fullFirstName = getFullFirstName(currentUser.fullName || 'Maria Clara');

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

      {/* QUICK ACCESS Section Header */}
      <div style={{ marginBottom: '14px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-500)',
          }}
        >
          Quick Access
        </span>
      </div>

      {/* 4-Column Module Panels Grid */}
      <div className="quick-access-grid">
        {/* Panel 1: Evaluation Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('evaluation_management')}
          title="Click to manage Individualized Contract Expiration & Routing (UC-01)"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Evaluation Management</span>
            <div className="quick-access-icon">⏱️</div>
          </div>
          <div
            className="quick-access-value"
            style={{
              color: 'var(--amber-600)',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            {expiringCount} Expiring Soon
          </div>
          <div className="quick-access-link">
            Contract lifecycles &amp; routing →
          </div>
        </div>

        {/* Panel 2: HR & Proxy Evaluations */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('hr_evaluations_proxy')}
          title="Click to input 30% HR Score and offline proxy ratings (UC-05)"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">HR &amp; Proxy Evaluations</span>
            <div className="quick-access-icon">📝</div>
          </div>
          <div
            className="quick-access-value"
            style={{
              color: 'var(--amber-600)',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            {pendingHrEvalCount} {pendingHrEvalCount === 1 ? 'Pending Evaluation' : 'Pending Evaluations'}
          </div>
          <div className="quick-access-link">
            30% administrative scores →
          </div>
        </div>

        {/* Panel 3: Employee Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('employee_management')}
          title="Click to manage COS Personnel accounts & tokenized invites (UC-09)"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Employee Management</span>
            <div className="quick-access-icon">👥</div>
          </div>
          <div className="quick-access-value">
            {metrics.totalEmployees}
          </div>
          <div className="quick-access-link">
            COS directory &amp; accounts →
          </div>
        </div>

        {/* Panel 4: Administrator Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('administrator_management')}
          title="Click to manage permanent university staff accounts (Dept Heads & HR accounts)"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Administrator Management</span>
            <div className="quick-access-icon">🛡️</div>
          </div>
          <div className="quick-access-value">
            {metrics.totalAdministrators || 6}
          </div>
          <div className="quick-access-link">
            Dept Heads &amp; HR accounts →
          </div>
        </div>

        {/* Panel 5: Department Management */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('department_management')}
          title="Click to configure university departments and colleges (UC-10)"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Department Management</span>
            <div className="quick-access-icon">🏛️</div>
          </div>
          <div className="quick-access-value">
            {metrics.activeColleges}
          </div>
          <div className="quick-access-link">
            Colleges &amp; departments →
          </div>
        </div>

        {/* Panel 6: Executive Reports */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('report_generator')}
          title="Click to view personnel records, past MARs, and evaluation dossiers"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Executive Reports</span>
            <div className="quick-access-icon">📊</div>
          </div>
          <div className="quick-access-value text-lg">
            Past MARs &amp; Records
          </div>
          <div className="quick-access-link">
            Extract records &amp; evaluations →
          </div>
        </div>
      </div>
    </div>
  );
}
