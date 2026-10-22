import React, { useState } from 'react';

export default function EvaluationManagement({
  eligibleEmployees = [
    {
      id: 101,
      idNumber: 'G10222026JMR',
      fullName: 'Jorge Mikhael Gubantes',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: true,
      routingStatus: 'Pending Initiation', // 'Pending Initiation' | 'Routing Active' | 'Completed'
    },
    {
      id: 102,
      idNumber: 'R10222026IJM',
      fullName: 'Ian Joseph Ranoco',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: true,
      routingStatus: 'Routing Active',
    },
    {
      id: 103,
      idNumber: 'M10222026CBM',
      fullName: 'Carlos Mendoza',
      department: 'Maintenance/Janitorial (MESO) Office',
      cosCategory: 'Maintenance/Janitorial',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: true,
      routingStatus: 'Pending Initiation',
    },
    {
      id: 104,
      idNumber: 'P10222026JLP',
      fullName: 'Jeramae Pace',
      department: 'Library Office',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentConfirmed: false,
      routingStatus: 'Awaiting Employee Intent',
    },
  ],
  onStartEmployeeEvaluation = () => {},
  onBack = null,
}) {
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

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Evaluation Management Module (UC-01)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Continuous individualized contract lifecycle tracking and concurrent evaluation routing for eligible COS personnel nearing 6-month contract expiration.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {toastMsg}
        </div>
      )}

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
                  <div className="muted" style={{ fontSize: '12px' }}>ID: {emp.idNumber || 'G10222026JMR'}</div>
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
    </div>
  );
}
