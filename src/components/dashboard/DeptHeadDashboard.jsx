import React from 'react';

export default function DeptHeadDashboard({
  department = {
    name: 'Computer Studies Department',
    college: 'College of Technology',
  },
  metrics = {
    totalSubordinates: 12,
    pendingReviews: 3,
    avgScore: 88.5,
    ratingLabel: 'Very Satisfactory',
  },
  subordinates = [
    {
      id: 101,
      fullName: 'Jorge Mikhael Gubantes',
      role: 'COS Employee',
      cosCategory: 'Administrative',
      status: 'Ready for Review',
    },
    {
      id: 102,
      fullName: 'Ian Joseph Ranoco',
      role: 'COS Employee',
      cosCategory: 'Administrative',
      status: 'Ready for Review',
    },
    {
      id: 103,
      fullName: 'Carlos Mendoza',
      role: 'COS Employee',
      cosCategory: 'Maintenance/Janitorial',
      status: 'Ready for Review',
    },
  ],
  onNavigate = () => {},
}) {
  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '22px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>{department.name}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {department.college} — Performance Appraisal &amp; Review Workspace
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('pending_evaluations')}
        >
          Open Pending Evaluations (UC-03) →
        </button>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Assigned COS Personnel</span>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-value">{metrics.totalSubordinates}</div>
          <div className="stat-sub">Under Supervision</div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Pending 50% Supervisor Scores</span>
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-value">{metrics.pendingReviews}</div>
          <div className="stat-sub">
            <a href="#pending-evaluations" onClick={(e) => { e.preventDefault(); onNavigate('pending_evaluations'); }}>
              Open Split-Panel Rubrics →
            </a>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Department Average</span>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-value">
            {metrics.avgScore}{' '}
            <span style={{ fontSize: '16px', color: 'var(--ink-500)' }}>/ 100</span>
          </div>
          <div className="stat-sub">{metrics.ratingLabel}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Personnel Pending Supervisor Appraisal</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Subordinate</th>
                <th>Assignment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {subordinates.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.fullName}</b></td>
                  <td>
                    <span className="badge badge-dept">{m.cosCategory}</span>
                  </td>
                  <td>
                    <span className="badge badge-inprogress">{m.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onNavigate('pending_evaluations')}
                    >
                      Evaluate (50%) →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">Evaluator Guidelines (SRS Section 2.2)</div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', lineHeight: 1.6 }}>
            <li>
              <b>Split-Panel Interface:</b> Review the AI-synthesized Monthly Accomplishment Report (MAR) alongside the dynamic questionnaire rubric.
            </li>
            <li>
              <b>Dynamic Questionnaires:</b> The system automatically adapts grading criteria for <i>COS-Administrative</i> vs. <i>COS-Maintenance/Janitorial</i> staff.
            </li>
            <li>
              <b>Save as Draft:</b> Save your 1-5 numerical ratings incrementally across Categories A through E without submitting.
            </li>
            <li>
              <b>Fast-Track Rejection (UC-06):</b> If substantial grounds exist for non-renewal (e.g. skills mismatch, conduct breach), you may halt the evaluation early.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
