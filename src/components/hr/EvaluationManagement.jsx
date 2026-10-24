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
      intentStatus: 'Confirmed',
      routingStatus: 'Pending Initiation', // 'Pending Initiation' | 'Routing Active' | 'Supervisor Veto' | 'Completed' | etc.
    },
    {
      id: 102,
      idNumber: 'R10222026IJM',
      fullName: 'Ian Joseph Ranoco',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      routingStatus: 'Routing Active',
    },
    {
      id: 103,
      idNumber: 'M10222026CBM',
      fullName: 'Carlos Mendoza',
      department: 'Maintenance/Janitorial (MESO) Office',
      cosCategory: 'Maintenance/Janitorial',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      routingStatus: 'Pending Initiation',
    },
    {
      id: 104,
      idNumber: 'P10222026JLP',
      fullName: 'Jeramae Pace',
      department: 'Library Office',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Awaiting Intent',
      routingStatus: 'Awaiting Employee Intent',
    },
    {
      id: 105,
      idNumber: 'E10222026ABC',
      fullName: 'Elena Santos',
      department: 'Engineering Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Declined',
      declineReason: 'Pursuing full-time graduate degree program.',
      routingStatus: 'Contract Closure Pending',
    },
    {
      id: 106,
      idNumber: 'D10222026XYZ',
      fullName: 'Danilo Cruz',
      department: 'Technology Department',
      cosCategory: 'Technical',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      routingStatus: 'Supervisor Veto',
      vetoCategory: 'Gross Incompetence / Poor Performance',
      vetoJustification: 'Repeated non-compliance with laboratory equipment calibration standards and unattended safety violations.',
    },
  ],
  departments = [
    'Computer Studies Department',
    'Technology Department',
    'Engineering Department',
    'Education Department',
    'Library Office',
    'Maintenance/Janitorial (MESO) Office',
  ],
  onStartEmployeeEvaluation = () => {},
  onProcessOffboarding = () => {},
  onMediateRejection = () => {},
  onBack = null,
}) {
  const [employees, setEmployees] = useState(eligibleEmployees);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal states for HR interventions
  const [mediateEmp, setMediateEmp] = useState(null);
  const [offboardEmp, setOffboardEmp] = useState(null);
  const [transferTargetDept, setTransferTargetDept] = useState(departments[0]);

  const handleStartRouting = (empId) => {
    setEmployees(
      employees.map((e) => (e.id === empId ? { ...e, routingStatus: 'Routing Active' } : e))
    );
    const emp = employees.find((e) => e.id === empId);
    onStartEmployeeEvaluation(empId);
    setToastMsg(
      `Concurrent evaluation routing unlocked for ${emp?.fullName || 'Employee'}! Dispatched alerts to Supervisor, Peers, and HRMO.`
    );
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleConfirmOffboard = () => {
    if (!offboardEmp) return;
    setEmployees(
      employees.map((e) =>
        e.id === offboardEmp.id ? { ...e, routingStatus: 'Offboarded / Archived' } : e
      )
    );
    onProcessOffboarding(offboardEmp.id);
    setToastMsg(`Offboarding clearance processed for "${offboardEmp.fullName}". Contract archived.`);
    setOffboardEmp(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleMediationDecision = (actionType) => {
    if (!mediateEmp) return;
    if (actionType === 'offboard') {
      setEmployees(
        employees.map((e) =>
          e.id === mediateEmp.id
            ? { ...e, routingStatus: 'Offboarded / Archived', intentStatus: 'Declined' }
            : e
        )
      );
      onMediateRejection({ employeeId: mediateEmp.id, resolution: 'offboard' });
      setToastMsg(`HR Mediation resolved: "${mediateEmp.fullName}" has been offboarded and archived.`);
    } else if (actionType === 'transfer') {
      setEmployees(
        employees.map((e) =>
          e.id === mediateEmp.id
            ? {
                ...e,
                routingStatus: 'Intervention Transfer Scheduled',
                department: `${e.department} → ${transferTargetDept}`,
              }
            : e
        )
      );
      onMediateRejection({
        employeeId: mediateEmp.id,
        resolution: 'transfer',
        newDepartment: transferTargetDept,
      });
      setToastMsg(
        `HR Mediation resolved: Intervention transfer scheduled for "${mediateEmp.fullName}" to ${transferTargetDept} for the next cycle.`
      );
    }
    setMediateEmp(null);
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
            Upon digital confirmation of intent, click "Start Evaluation" to open simultaneous routing for Supervisor, Peers, and HRMO.
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Assignment</th>
              <th>Contract End</th>
              <th>Status</th>
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
                  {emp.routingStatus === 'Supervisor Veto' ? (
                    <span className="badge badge-delete" style={{ whiteSpace: 'nowrap' }}>
                      Supervisor Veto
                    </span>
                  ) : emp.routingStatus === 'Offboarded / Archived' ? (
                    <span className="badge badge-delete" style={{ whiteSpace: 'nowrap' }}>
                      📦 Offboarded
                    </span>
                  ) : emp.intentStatus === 'Declined' || emp.intent === 'Declined' ? (
                    <span
                      className="badge badge-delete"
                      style={{ whiteSpace: 'nowrap' }}
                      title={emp.declineReason ? `Reason: ${emp.declineReason}` : undefined}
                    >
                      ⨯ Declined
                    </span>
                  ) : emp.routingStatus === 'Intervention Transfer Scheduled' ? (
                    <span className="badge badge-pending" style={{ whiteSpace: 'nowrap' }}>
                      Intervention Transfer
                    </span>
                  ) : emp.routingStatus === 'Routing Active' ? (
                    <span className="badge badge-completed" style={{ whiteSpace: 'nowrap' }}>
                      ✓ Routing Active
                    </span>
                  ) : emp.routingStatus === 'Pending Initiation' ? (
                    <span className="badge badge-inprogress" style={{ whiteSpace: 'nowrap' }}>
                      Pending Initiation
                    </span>
                  ) : emp.routingStatus === 'Awaiting Employee Intent' || emp.intentStatus === 'Awaiting Intent' ? (
                    <span className="badge badge-pending" style={{ whiteSpace: 'nowrap' }}>
                      Awaiting Intent
                    </span>
                  ) : (
                    <span className="badge badge-completed" style={{ whiteSpace: 'nowrap' }}>
                      {emp.routingStatus}
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {emp.routingStatus === 'Supervisor Veto' ? (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: 'var(--red-600)',
                        color: '#fff',
                        borderColor: 'var(--red-600)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setMediateEmp(emp)}
                    >
                      Mediate Rejection
                    </button>
                  ) : emp.intentStatus === 'Declined' || emp.intent === 'Declined' ? (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: 'var(--red-600)',
                        color: '#fff',
                        borderColor: 'var(--red-600)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setOffboardEmp(emp)}
                    >
                      Process Offboarding
                    </button>
                  ) : emp.routingStatus === 'Pending Initiation' ? (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: 'var(--green-600)',
                        color: '#fff',
                        borderColor: 'var(--green-600)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleStartRouting(emp.id)}
                    >
                      Start Evaluation
                    </button>
                  ) : emp.routingStatus === 'Routing Active' ? (
                    <span className="muted" style={{ fontSize: '12.5px' }}>
                      Triad Routing In Progress
                    </span>
                  ) : emp.routingStatus === 'Offboarded / Archived' ? (
                    <span className="muted" style={{ fontSize: '12px' }}>
                      Archived in Records
                    </span>
                  ) : emp.routingStatus === 'Intervention Transfer Scheduled' ? (
                    <span className="muted" style={{ fontSize: '12px', color: 'var(--amber-600)', fontWeight: 600 }}>
                      Pending Next Cycle
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

      {/* HR Mediation Modal for Supervisor Veto */}
      {mediateEmp && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMediateEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '580px', width: '92%' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️ HR Administrative Mediation — Supervisor Rejection</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setMediateEmp(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5 }}>
              The Department Head for <b>{mediateEmp.department}</b> has issued a definitive <b>Supervisor Veto (Fast-Track Rejection)</b> for this employee. Peer evaluations have been bypassed. Review supervisory grounds and select a binding HR mediation resolution:
            </p>

            {/* Personnel & Grounds Summary */}
            <div
              style={{
                background: 'var(--red-50)',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span className="emp-id-chip" style={{ marginRight: '8px' }}>{mediateEmp.idNumber}</span>
                  <b>{mediateEmp.fullName}</b>
                </div>
                <span className="badge badge-delete" style={{ fontWeight: 700 }}>Supervisor Veto</span>
              </div>

              <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
                <span className="muted">Category: </span>
                <b>{mediateEmp.vetoCategory || 'Habitual Absenteeism / Tardiness'}</b>
              </div>

              <div style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--ink)' }}>
                <span className="muted">Supervisor Justification: </span>
                <p style={{ margin: '4px 0 0', fontStyle: 'italic', background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  "{mediateEmp.vetoJustification || 'Substantive performance deficiency reported by Department Head.'}"
                </p>
              </div>
            </div>

            {/* Mediation Actions Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Confirm Offboarding */}
              <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b style={{ color: 'var(--red-600)', fontSize: '13.5px' }}>Resolution A: Uphold Veto &amp; Offboard</b>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                      Accepts supervisory non-renewal. Disables portal access and moves personnel to archived directory.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onClick={() => handleMediationDecision('offboard')}
                  >
                    Confirm Offboarding
                  </button>
                </div>
              </div>

              {/* Option 2: Intervention Transfer */}
              <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
                <b style={{ color: 'var(--amber-600)', fontSize: '13.5px' }}>Resolution B: Execute Intervention Transfer</b>
                <p className="muted" style={{ margin: '2px 0 10px', fontSize: '12px' }}>
                  Overrules contract termination by reassigning the employee to a new department for their next contract cycle.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    className="form-control"
                    style={{ flex: 1, fontSize: '13px' }}
                    value={transferTargetDept}
                    onChange={(e) => setTransferTargetDept(e.target.value)}
                  >
                    {departments
                      .filter((d) => d !== mediateEmp.department)
                      .map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onClick={() => handleMediationDecision('transfer')}
                  >
                    Execute Transfer
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button type="button" className="btn" style={{ cursor: 'pointer' }} onClick={() => setMediateEmp(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Offboarding Modal for Declined Renewal */}
      {offboardEmp && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOffboardEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '500px', width: '92%' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📦 Process Personnel Offboarding</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOffboardEmp(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 14px', fontSize: '13.5px', lineHeight: 1.5 }}>
              <b>{offboardEmp.fullName}</b> ({offboardEmp.idNumber || 'COS Personnel'}) has formally submitted a non-renewal decision (<b>⨯ Declined</b>) for their contract expiring on <b>{offboardEmp.contractEndDate}</b>.
            </p>

            {offboardEmp.declineReason && (
              <div style={{ background: 'var(--red-50)', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px' }}>
                <span className="muted">Stated Reason for Exiting: </span>
                <b>"{offboardEmp.declineReason}"</b>
              </div>
            )}

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-700)' }}>
              Proceeding will generate standard university end-of-contract clearance documents, archive their historical MARs and evaluation records, and deactivate portal credentials at term expiration.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" style={{ cursor: 'pointer' }} onClick={() => setOffboardEmp(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)', fontWeight: 700, cursor: 'pointer' }}
                onClick={handleConfirmOffboard}
              >
                Confirm Offboarding &amp; Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
