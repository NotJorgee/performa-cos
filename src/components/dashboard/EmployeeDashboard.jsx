import React from 'react';

export default function EmployeeDashboard({
  currentUser = {
    fullName: 'Jorge Mikhael Gubantes',
    position: 'College Office Staff',
    department: 'Computer Studies Department',
    cosCategory: 'Administrative',
  },
  metrics = {
    contractEndDate: 'December 31, 2026',
    daysUntilExpiration: 74,
    darTasksToday: 2,
    totalDarsLogged: 84,
    renewalIntentStatus: 'Open for Intent Confirmation',
    pendingPeerReviews: 1,
  },
  onNavigate = () => {},
}) {
  const firstName = currentUser.fullName.split(' ')[0];
  const lastName = currentUser.fullName.split(' ').slice(-1)[0];

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div>
          <h1>Welcome, {firstName} {lastName}</h1>
          <p>{currentUser.position} | {currentUser.department} ({currentUser.cosCategory})</p>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Contract Expiration</span>
            <span className="stat-icon">⏱️</span>
          </div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--amber-600)' }}>
            {metrics.daysUntilExpiration} Days
          </div>
          <div className="stat-sub">
            <a
              href="#contract-status"
              onClick={(e) => { e.preventDefault(); onNavigate('contract_status'); }}
            >
              Check Contract Status (UC-02) →
            </a>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Today's DAR Status</span>
            <span className="stat-icon">📍</span>
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            {metrics.darTasksToday > 0 ? `${metrics.darTasksToday} Task(s) Logged` : 'No Entry Yet'}
          </div>
          <div className="stat-sub">
            <a
              href="#daily-report"
              onClick={(e) => { e.preventDefault(); onNavigate('daily_report'); }}
            >
              Log Campus DAR (UC-13) →
            </a>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Accumulated MAR Logs</span>
            <span className="stat-icon">📑</span>
          </div>
          <div className="stat-value">{metrics.totalDarsLogged}</div>
          <div className="stat-sub">
            <a
              href="#monthly-report"
              onClick={(e) => { e.preventDefault(); onNavigate('monthly_report'); }}
            >
              View Compiled MAR (FR-04) →
            </a>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Peer Reviews Assigned</span>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            {metrics.pendingPeerReviews} Colleague(s)
          </div>
          <div className="stat-sub">
            <a
              href="#peer-evaluations"
              onClick={(e) => { e.preventDefault(); onNavigate('peer_evaluations'); }}
            >
              Evaluate Peers (UC-04) →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
