import React from 'react';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
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

      {/* Subordinate Evaluations panel */}
      <div className="quick-access-grid">
        {/* Panel: Subordinate Evaluations */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('pending_evaluations')}
          title="Click to view subordinate evaluation roster and score appraisals"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Subordinate Evaluations</span>
            <div className="quick-access-icon">
              <ClipboardCheck size={22} color="var(--brand-700)" />
            </div>
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
            <span>View &amp; evaluate subordinates</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
