import React from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';

export default function DeptHeadDashboard({
  currentUser = {
    fullName: 'Engr. Roberto Del Rosario',
    department: 'Computer Studies Department',
    college: 'College of Technology',
  },
  metrics = {
    totalSubordinates: 12,
    pendingReviews: 3,
    avgScore: 88.5,
    ratingLabel: 'Very Satisfactory',
  },
  onNavigate = () => {},
}) {
  const pendingCount = metrics?.pendingReviews ?? 3;
  const fullFirstName = getFullFirstName(currentUser.fullName || 'Roberto');

  return (
    <div>
      {/* Hero Banner with EVSU Seal matching COS & HR */}
      <div className="hero-banner" style={{ marginBottom: '24px' }}>
        <img src={evsuSeal} alt="EVSU Seal" className="hero-seal" />
        <div>
          <h1>Welcome, {fullFirstName}</h1>
          <p>
            {currentUser.department || 'Computer Studies Department'} | Eastern Visayas State University Ormoc Campus
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

      {/* Quick Access Grid: Kept strictly to Subordinate Evaluations panel */}
      <div
        className="quick-access-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 340px))',
        }}
      >
        {/* Panel: Subordinate Evaluations */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('pending_evaluations')}
          title="Click to view subordinate evaluation roster and score appraisals"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Subordinate Evaluations</span>
            <div className="quick-access-icon">📋</div>
          </div>
          <div
            className="quick-access-value"
            style={{
              color: 'var(--amber-600)',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            {pendingCount} {pendingCount === 1 ? 'Pending Evaluation' : 'Pending Evaluations'}
          </div>
          <div className="quick-access-link">
            View &amp; evaluate subordinates →
          </div>
        </div>
      </div>
    </div>
  );
}
