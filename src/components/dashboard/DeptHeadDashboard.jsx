import React from 'react';
import { ClipboardCheck, FileText, ArrowRight } from 'lucide-react';
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

      {/* Department Head Quick Access Panels */}
      <div className="quick-access-grid">
        {/* Panel 1: Subordinate Evaluations */}
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

        {/* Panel 2: Department Employee Records */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('employee_records')}
          title="Click to view departmental employee records, past MARs, and evaluation dossiers"
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
            <span>Department dossiers &amp; MARs</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
