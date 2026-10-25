import React from 'react';
import { Clock, MapPin, FileText, Users, ArrowRight } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';

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
  const fullFirstName = getFullFirstName(currentUser.fullName || 'Jorge Mikhael Gubantes');
  const isExpiringSoon = (metrics.daysUntilExpiration ?? 74) <= 30;

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner" style={{ marginBottom: '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {currentUser.department || 'Computer Studies Department'} | Eastern Visayas State University Ormoc Campus
          </p>
        </div>
      </div>

      {/* Category Panels (4 Core COS Modules) */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
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
            {metrics.daysUntilExpiration} Days
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Check Contract Status</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 2: Today's DAR Status */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('daily_report')}
          title="Click to log campus DAR"
        >
          <div className="stat-top">
            <span className="stat-label">Today's DAR Status</span>
            <span className="stat-icon"><MapPin size={18} /></span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '20px',
              color: (metrics.darTasksToday ?? 0) === 0 ? 'var(--red-600)' : 'var(--ink-900)',
            }}
          >
            {metrics.darTasksToday ?? 0} Task(s) Logged
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Log Campus DAR</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 3: Accumulated MAR Logs */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('monthly_report')}
          title="Click to view Compiled MAR"
        >
          <div className="stat-top">
            <span className="stat-label">Accumulated MAR Logs</span>
            <span className="stat-icon"><FileText size={18} /></span>
          </div>
          <div className="stat-value" style={{ fontSize: '26px' }}>
            {metrics.totalDarsLogged}
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>View Compiled MAR</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 4: Peer Reviews Assigned */}
        <div
          className="card stat-card stat-card-clickable"
          onClick={() => onNavigate('peer_evaluations')}
          title="Click to evaluate assigned peers"
        >
          <div className="stat-top">
            <span className="stat-label">Peer Reviews Assigned</span>
            <span className="stat-icon"><Users size={18} /></span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '20px',
              color: (metrics.pendingPeerReviews ?? 0) > 0 ? 'var(--amber-600)' : '#111827',
            }}
          >
            {metrics.pendingPeerReviews ?? 0} Colleague(s)
          </div>
          <div className="stat-sub" style={{ color: 'var(--brand-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Evaluate Peers</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
