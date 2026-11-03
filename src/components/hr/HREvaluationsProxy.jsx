import Toast from '../common/Toast';
import React, { useState } from 'react';
import { Check, Clock } from 'lucide-react';
import DynamicRubric from '../common/DynamicRubric';

export default function HREvaluationsProxy({
  evaluations = [],
  onSubmitHrScore = () => {},
  onBack = null,
}) {
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const activeRecord = evaluations.find((e) => e.id === selectedEvalId);

  const handleRubricSubmit = (evalData) => {
    onSubmitHrScore({
      evaluationId: selectedEvalId,
      hrmoScore: evalData.scaledScore !== undefined ? evalData.scaledScore : evalData.rawSum,
      details: evalData,
    });
    setSuccessToast(`30% HR Administrative compliance score recorded! Final 50/20/30 grade computed.`);
    setSelectedEvalId(null);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Pending HR Evaluations</h1>
          <p className="muted" style={{ margin: 0 }}>
            Input the 30% HR administrative compliance ratings and monitor supervisor (50%) and peer (20%) evaluation progress for COS personnel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedEvalId && (
            <button type="button" className="btn btn-sm" onClick={() => setSelectedEvalId(null)}>
              ← Back to Evaluation List
            </button>
          )}
          {onBack && (
            <button type="button" className="btn btn-sm" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      <Toast message={successToast} onClose={() => setSuccessToast(null)} />

      {/* VIEW 1: Evaluations Queue Table or Standby State */}
      {!selectedEvalId && (
        evaluations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '52px 24px', border: '1px dashed var(--line)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--brand-50)',
                color: 'var(--brand-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Clock size={26} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--ink-900)' }}>
              No Active Evaluation Cycles
            </h3>
            <p className="muted" style={{ margin: '0 auto 20px', maxWidth: '480px', fontSize: '13px', lineHeight: 1.5 }}>
              The 50/20/30 triad scoring queue (Supervisor 50%, Peer 20%, HRMO 30%) will activate when the upcoming evaluation window is officially opened.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px', color: 'var(--ink-600)' }}>
              <span>Status: <strong>Evaluation Window Standby</strong></span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
              <div className="card-title" style={{ margin: 0 }}>
                HR Evaluation Queue &amp; Triad Scoring Progress
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                Input the 30% HR administrative compliance ratings and monitor supervisor (50%) and peer (20%) evaluation progress for COS personnel.
              </p>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Supervisor (50%)</th>
                  <th>Peer (20%)</th>
                  <th>HRMO (30%)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((ev) => {
                  return (
                    <tr key={ev.id}>
                      <td>
                        <b>{ev.fullName}</b>
                        <div className="muted" style={{ fontSize: '12px' }}>ID: {ev.employeeIdNumber}</div>
                      </td>
                      <td>{ev.department}</td>
                      <td>{ev.supervisorScore !== null ? `${ev.supervisorScore} / 100` : <span className="muted">—</span>}</td>
                      <td>{ev.peerScore !== null ? `${ev.peerScore} / 100` : <span className="muted">—</span>}</td>
                      <td>{ev.hrmoScore !== null ? `${ev.hrmoScore} / 100` : <span className="muted">—</span>}</td>
                      <td>
                        <span className={`badge badge-${ev.status === 'Completed' ? 'completed' : 'inprogress'}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedEvalId(ev.id)}
                        >
                          Input HR Score →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* VIEW 2: Grading Form */}
      {selectedEvalId && activeRecord && (
        <div>
          {/* Header Card */}
          <div className="card flex-between" style={{ marginBottom: '20px' }}>
            <div>
              <div className="card-title" style={{ margin: '0 0 4px' }}>
                HR Administrative Compliance Grading — {activeRecord.fullName}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Department: <b>{activeRecord.department}</b> &nbsp;·&nbsp;
                Category: <b>{activeRecord.cosCategory}</b> &nbsp;·&nbsp;
                Weight: <b>30% HR Compliance</b>
              </p>
            </div>
          </div>

          {/* Dynamic Rubric */}
          <div className="card">
            <DynamicRubric
              cosCategory={activeRecord.cosCategory}
              evaluatorRole="HRMO"
              onSubmit={handleRubricSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
