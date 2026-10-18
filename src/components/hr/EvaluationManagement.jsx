import React, { useState } from 'react';

export default function EvaluationManagement({
  activeCycles = [
    {
      id: 1,
      periodName: '1st Semester 2026-2027',
      deadline: '2026-11-15',
      eligibleCount: 48,
      routedCount: 42,
      completedCount: 31,
      status: 'Active Period',
    },
  ],
  eligibleEmployees = [
    {
      id: 101,
      fullName: 'Jorge Mikhael Gubantes',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: true,
      routingStatus: 'Pending Initiation', // 'Pending Initiation' | 'Routing Active' | 'Completed'
    },
    {
      id: 102,
      fullName: 'Ian Joseph Ranoco',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: true,
      routingStatus: 'Routing Active',
    },
    {
      id: 103,
      fullName: 'Carlos Mendoza',
      department: 'Maintenance/Janitorial (MESO) Office',
      cosCategory: 'Maintenance/Janitorial',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: true,
      routingStatus: 'Pending Initiation',
    },
    {
      id: 104,
      fullName: 'Jeramae Pace',
      department: 'Library Office',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: false,
      routingStatus: 'Awaiting Employee Intent',
    },
  ],
  onInitiateCycle = () => {},
  onStartEmployeeEvaluation = () => {},
}) {
  const [deadline, setDeadline] = useState('2026-11-15');
  const [periodName, setPeriodName] = useState('1st Semester 2026-2027');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [employees, setEmployees] = useState(eligibleEmployees);
  const [toastMsg, setToastMsg] = useState(null);

  const handleStartRouting = (empId) => {
    setEmployees(
      employees.map((e) => (e.id === empId ? { ...e, routingStatus: 'Routing Active' } : e))
    );
    const emp = employees.find((e) => e.id === empId);
    onStartEmployeeEvaluation(empId);
    setToastMsg(
      `Concurrent evaluation routing unlocked for ${emp.fullName}! Dispatched notification alerts and scheduled 3-day reminder emails.`
    );
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleCreatePeriod = (e) => {
    e.preventDefault();
    onInitiateCycle({ periodName, deadline });
    setShowConfigModal(false);
    setToastMsg(`Evaluation Period '${periodName}' initiated with deadline ${deadline}.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Evaluation Management Module (UC-01)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Configure evaluation cycles, set submission deadlines, and trigger concurrent evaluation routing for eligible COS personnel.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowConfigModal(true)}
        >
          + Configure Evaluation Period
        </button>
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Active Evaluation Cycles Summary */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Active Evaluation Period Status</div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '14px' }}>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>ACTIVE CYCLE</span>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{activeCycles[0].periodName}</div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>SUBMISSION DEADLINE</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--amber-600)', marginTop: '2px' }}>
              {activeCycles[0].deadline}
            </div>
            <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
              ✉ 3-day automated reminder active (FR-03)
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>ELIGIBLE COS STAFF</span>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
              {activeCycles[0].eligibleCount} Personnel
            </div>
          </div>
          <div>
            <span className="muted" style={{ fontSize: '12px' }}>TRIAD COMPLETION</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f6b32', marginTop: '2px' }}>
              {activeCycles[0].completedCount} / {activeCycles[0].eligibleCount} Finalized
            </div>
          </div>
        </div>
      </div>

      {/* COS Employees Roster & Routing Control */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div className="card-title" style={{ margin: 0 }}>
            COS Personnel Nearing 6-Month Contract Expiration
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Upon digital confirmation of intent, click "Start Employee Evaluation" to open simultaneous routing for Supervisor, Peers, and HRMO.
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Assignment</th>
              <th>Contract End</th>
              <th>Digital Intent</th>
              <th>Routing State</th>
              <th style={{ textAlign: 'right' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <b>{emp.fullName}</b>
                  <div className="muted" style={{ fontSize: '12px' }}>ID: 2026-{emp.id}</div>
                </td>
                <td>{emp.department}</td>
                <td>
                  <span className="badge badge-dept">{emp.cosCategory}</span>
                </td>
                <td>{emp.contractEndDate}</td>
                <td>
                  {emp.intentConfirmed ? (
                    <span className="badge badge-completed">✓ Confirmed</span>
                  ) : (
                    <span className="badge badge-pending">Awaiting Intent</span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge badge-${
                      emp.routingStatus === 'Routing Active'
                        ? 'completed'
                        : emp.routingStatus === 'Pending Initiation'
                        ? 'inprogress'
                        : 'pending'
                    }`}
                  >
                    {emp.routingStatus}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {emp.routingStatus === 'Pending Initiation' ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleStartRouting(emp.id)}
                    >
                      Start Employee Evaluation (UC-01)
                    </button>
                  ) : emp.routingStatus === 'Routing Active' ? (
                    <span className="muted" style={{ fontSize: '12.5px' }}>
                      Triad Routing In Progress
                    </span>
                  ) : (
                    <span className="muted" style={{ fontSize: '12px' }}>
                      Requires Employee Intent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Configure Evaluation Period Modal */}
      {showConfigModal && (
        <div className="modal-backdrop" style={{ display: 'flex' }}>
          <div className="modal-card" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>Initiate Evaluation Period (FR-01)</div>
              <button type="button" className="modal-close" onClick={() => setShowConfigModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePeriod}>
              <div className="form-group">
                <label>Evaluation Period Label</label>
                <input
                  className="form-control"
                  type="text"
                  required
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Submission Deadline Date (FR-01)</label>
                <input
                  className="form-control"
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                  The system will automatically dispatch reminder emails 3 days prior to this date (FR-03).
                </small>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowConfigModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Initiate Period</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
