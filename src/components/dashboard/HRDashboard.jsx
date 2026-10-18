import React from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';

export default function HRDashboard({
  metrics = {
    totalEmployees: 48,
    activeColleges: 6,
    darSubmittedToday: 42,
    pendingEvaluations: 9,
    marReportsSubmitted: 45,
    completionRate: 85,
  },
  recentSubmissions = [
    {
      id: 1,
      employeeName: 'Jorge Mikhael Gubantes',
      department: 'Computer Studies Department',
      date: 'Oct 17, 2026',
      status: 'Pending HR Review',
    },
    {
      id: 2,
      employeeName: 'Ian Joseph Ranoco',
      department: 'Technology Department',
      date: 'Oct 16, 2026',
      status: 'Ready for Computation',
    },
    {
      id: 3,
      employeeName: 'Jeramae Pace',
      department: 'Library Office',
      date: 'Oct 15, 2026',
      status: 'Completed',
    },
  ],
  collegeProgress = [
    { name: 'Computer Studies Department', pct: 90 },
    { name: 'Technology Department', pct: 82 },
    { name: 'Engineering Department', pct: 75 },
    { name: 'Education Department', pct: 60 },
  ],
  onNavigate = () => {},
}) {
  return (
    <div>
      <div className="hero-banner">
        <div className="hero-left">
          <img src={evsuSeal} alt="EVSU Seal" className="hero-logo" />
          <div>
            <h1>HR Administrative Portal</h1>
            <p>
              Eastern Visayas State University — Contract of Service Performance Management System
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Total COS Personnel</span>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-value">{metrics.totalEmployees}</div>
          <div className="stat-sub">
            <span className="pos">Active</span> Across {metrics.activeColleges} Departments
          </div>
        </div>

        {/* Replaced legacy Attendance with in-scope Geofenced DARs */}
        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Geofenced DARs Today</span>
            <span className="stat-icon">📍</span>
          </div>
          <div className="stat-value">{metrics.darSubmittedToday} / {metrics.totalEmployees}</div>
          <div className="stat-sub">
            <span className="pos">Campus Validated</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Pending 30% HR Scores</span>
            <span className="stat-icon">⚖️</span>
          </div>
          <div className="stat-value">{metrics.pendingEvaluations}</div>
          <div className="stat-sub">Awaiting Administrative Review</div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">MAR Reports Submitted</span>
            <span className="stat-icon">📑</span>
          </div>
          <div className="stat-value">{metrics.marReportsSubmitted}</div>
          <div className="stat-sub">Current Evaluation Cycle</div>
        </div>

        <div className="card stat-card">
          <div className="stat-top">
            <span className="stat-label">Evaluation Completion</span>
            <span className="stat-icon">🎯</span>
          </div>
          <div className="stat-value">{metrics.completionRate}%</div>
          <div className="stat-sub">Institutional Target: 100%</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Recent Submissions</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.employeeName}</b></td>
                  <td>{s.department}</td>
                  <td>{s.date}</td>
                  <td>
                    <span className={`badge badge-${s.status.toLowerCase().replace(/[\s_]+/g, '')}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">Evaluation Progress by Department</div>
          {collegeProgress.map((cp, idx) => (
            <div className="progress-row" key={idx}>
              <div className="progress-head">
                <span>{cp.name}</span>
                <span>{cp.pct}%</span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill ${cp.pct >= 70 ? 'green' : cp.pct >= 50 ? 'amber' : 'red'}`}
                  style={{ width: `${cp.pct}%` }}
                ></div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => onNavigate('evaluation_management')}
            >
              Evaluation Management (UC-01)
            </button>
            <button
              className="btn"
              style={{ flex: 1 }}
              onClick={() => onNavigate('report_generator')}
            >
              Generate Executive Report (US-07)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
