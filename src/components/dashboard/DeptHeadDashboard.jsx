import React, { useState, useEffect } from 'react';
import { ClipboardCheck, UserCheck, FileText, ArrowRight } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getFullFirstName } from '../../utils/nameHelper';
import api from '../../services/api';

export default function DeptHeadDashboard({
  currentUser = {
    fullName: 'Department Head',
    department: 'Computer Studies Department',
    college: 'College of Technology',
  },
  metrics: propMetrics = null,
  onNavigate = () => {},
}) {
  const [metrics, setMetrics] = useState(
    propMetrics || {
      totalSubordinates: 0,
      pendingReviews: 0,
      pendingIntents: 0,
      avgScore: 0,
      ratingLabel: 'Active Department',
    }
  );

  useEffect(() => {
    if (propMetrics) {
      setMetrics(propMetrics);
      return;
    }
    const fetchMetrics = async () => {
      try {
        const data = await api.analytics.getDeptHeadDashboard();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load Dept Head dashboard analytics:', err);
      }
    };
    fetchMetrics();
  }, [propMetrics]);

  const pendingCount = metrics?.pendingReviews ?? 0;
  const pendingIntentsCount = metrics?.pendingIntents ?? 0;
  const fullFirstName = getFullFirstName(currentUser.fullName || currentUser.full_name || 'Department Head');

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
        {/* Panel 1: Intent Review */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('intent_review')}
          title="Click to review staff renewal intents and AI-synthesized DAR performance analysis"
        >
          <div className="quick-access-top">
            <span className="quick-access-label">Intent Review</span>
            <div className="quick-access-icon">
              <UserCheck size={22} color="var(--brand-700)" />
            </div>
          </div>
          <div
            className="quick-access-value"
            style={{
              color: pendingIntentsCount > 0 ? 'var(--amber-600)' : 'var(--ink-900)',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            {pendingIntentsCount} {pendingIntentsCount === 1 ? 'Pending Review' : 'Pending Reviews'}
          </div>
          <div className="quick-access-link">
            <span>Review intents &amp; AI summaries</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Panel 2: Subordinate Evaluations */}
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
              color: pendingCount > 0 ? 'var(--amber-600)' : 'var(--ink-900)',
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

        {/* Panel 3: Department Employee Records */}
        <div
          className="quick-access-card"
          onClick={() => onNavigate('employee_records')}
          title="Click to view departmental employee records, past MARs, and evaluation reports"
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
            <span>Department records &amp; MARs</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
