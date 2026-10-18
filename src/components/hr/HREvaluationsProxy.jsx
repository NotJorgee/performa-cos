import React, { useState } from 'react';
import DynamicRubric from '../common/DynamicRubric';

export default function HREvaluationsProxy({
  evaluations = [
    {
      id: 1,
      employeeId: 101,
      fullName: 'Jorge Mikhael Gubantes',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      supervisorScore: 92, // 50%
      peerScore: 88,       // 20%
      hrmoScore: null,     // 30%
      status: 'Pending HR Review',
      isOfflineStaff: false,
    },
    {
      id: 2,
      employeeId: 102,
      fullName: 'Ian Joseph Ranoco',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      supervisorScore: 86,
      peerScore: null,
      hrmoScore: null,
      status: 'Pending Evaluations',
      isOfflineStaff: false,
    },
    {
      id: 3,
      employeeId: 103,
      fullName: 'Carlos Mendoza',
      department: 'Maintenance/Janitorial (MESO) Office',
      cosCategory: 'Maintenance/Janitorial',
      supervisorScore: null, // Needs physical encoding (Proxy Entry)
      peerScore: null,
      hrmoScore: null,
      status: 'Requires Proxy Entry',
      isOfflineStaff: true,
    },
  ],
  onSubmitHrScore = () => {},
  onSubmitProxyEntry = () => {},
}) {
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [proxyMode, setProxyMode] = useState(false);
  const [proxyTargetRole, setProxyTargetRole] = useState('Immediate Supervisor'); // 'Immediate Supervisor' | 'Peer'
  const [successToast, setSuccessToast] = useState(null);

  const activeRecord = evaluations.find((e) => e.id === selectedEvalId);

  // 50/20/30 formula helper
  const computeFinal = (sup, peer, hr) => {
    if (sup === null || peer === null || hr === null) return null;
    const finalScore = (sup * 0.50) + (peer * 0.20) + (hr * 0.30);
    let label = 'Unsatisfactory';
    if (finalScore >= 90) label = 'Outstanding';
    else if (finalScore >= 80) label = 'Very Satisfactory';
    else if (finalScore >= 70) label = 'Satisfactory';
    else if (finalScore >= 60) label = 'Needs Improvement';
    return { score: finalScore.toFixed(1), label };
  };

  const handleRubricSubmit = (evalData) => {
    if (proxyMode) {
      onSubmitProxyEntry({
        evaluationId: selectedEvalId,
        proxyRole: proxyTargetRole,
        score: evalData.rawSum,
        details: evalData,
      });
      setSuccessToast(`Physical ${proxyTargetRole} rating sheet encoded via Proxy Data Entry (UC-05, FR-11)!`);
    } else {
      onSubmitHrScore({
        evaluationId: selectedEvalId,
        hrmoScore: evalData.rawSum,
        details: evalData,
      });
      setSuccessToast(`30% HR Administrative compliance score recorded! Final 50/20/30 grade computed.`);
    }
    setSelectedEvalId(null);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Pending HR Evaluations &amp; Proxy Data Entry (UC-05)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Input the 30% administrative compliance score and proxy-encode physical paper rating sheets for offline maintenance personnel.
          </p>
        </div>
        {selectedEvalId && (
          <button type="button" className="btn btn-sm" onClick={() => setSelectedEvalId(null)}>
            ← Back to Evaluation List
          </button>
        )}
      </div>

      {successToast && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {successToast}
        </div>
      )}

      {/* VIEW 1: Evaluations Queue Table */}
      {!selectedEvalId && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
            <div className="card-title" style={{ margin: 0 }}>
              Triad Scoring Progress &amp; 50/20/30 Computation Status
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Final score out of 100 is automatically computed once Supervisor (50%), Peer (20%), and HRMO (30%) scores are logged.
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
                <th>Final Grade</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => {
                const final = computeFinal(ev.supervisorScore, ev.peerScore, ev.hrmoScore);
                return (
                  <tr key={ev.id}>
                    <td>
                      <b>{ev.fullName}</b>
                      {ev.isOfflineStaff && (
                        <div style={{ color: 'var(--amber-600)', fontSize: '11.5px', fontWeight: 600 }}>
                          📝 Offline Staff (Proxy Entry)
                        </div>
                      )}
                    </td>
                    <td>{ev.department}</td>
                    <td>{ev.supervisorScore !== null ? `${ev.supervisorScore} / 100` : <span className="muted">—</span>}</td>
                    <td>{ev.peerScore !== null ? `${ev.peerScore} / 100` : <span className="muted">—</span>}</td>
                    <td>{ev.hrmoScore !== null ? `${ev.hrmoScore} / 100` : <span className="muted">—</span>}</td>
                    <td>
                      {final ? (
                        <div>
                          <b style={{ color: 'var(--brand-700)', fontSize: '14px' }}>{final.score}</b>
                          <div style={{ fontSize: '11.5px', color: '#0f6b32', fontWeight: 600 }}>{final.label}</div>
                        </div>
                      ) : (
                        <span className="muted">Pending</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${ev.status === 'Completed' ? 'completed' : ev.isOfflineStaff ? 'pending' : 'inprogress'}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setSelectedEvalId(ev.id);
                          setProxyMode(ev.isOfflineStaff);
                        }}
                      >
                        {ev.isOfflineStaff ? 'Proxy Encode Sheet →' : 'Input HR Score →'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: Grading Form / Proxy Data Entry */}
      {selectedEvalId && activeRecord && (
        <div>
          {/* Header Card */}
          <div className="card flex-between" style={{ marginBottom: '20px' }}>
            <div>
              <div className="card-title" style={{ margin: '0 0 4px' }}>
                {proxyMode ? 'Proxy Data Entry Encoding' : 'HR Administrative Compliance Grading'} — {activeRecord.fullName}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Department: <b>{activeRecord.department}</b> &nbsp;·&nbsp;
                Category: <b>{activeRecord.cosCategory}</b> &nbsp;·&nbsp;
                Weight: <b>{proxyMode ? `${proxyTargetRole} Physical Sheet` : '30% HR Compliance'}</b>
              </p>
            </div>
            <label className="dar-check" style={{ margin: 0, padding: '8px 12px', background: 'var(--bg)', borderRadius: '6px' }}>
              <input
                type="checkbox"
                checked={proxyMode}
                onChange={(e) => setProxyMode(e.target.checked)}
              />
              <b style={{ color: 'var(--brand-700)', fontSize: '13px' }}>Enable Proxy Data Entry Mode (FR-11)</b>
            </label>
          </div>

          {/* Proxy Mode Sub-Config */}
          {proxyMode && (
            <div className="card" style={{ marginBottom: '20px', background: 'var(--amber-50)', border: '1px solid #fed7aa' }}>
              <div className="card-title" style={{ color: 'var(--amber-600)', margin: '0 0 6px', fontSize: '14px' }}>
                📝 Proxy Data Entry Settings for Maintenance &amp; Offline Staff (FR-11)
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '13px' }}>
                Select which physical paper-based evaluation form you are encoding on behalf of the personnel:
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="proxyRole"
                    value="Immediate Supervisor"
                    checked={proxyTargetRole === 'Immediate Supervisor'}
                    onChange={(e) => setProxyTargetRole(e.target.value)}
                  />
                  <b>Physical Supervisor Rating Sheet (50%)</b>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="proxyRole"
                    value="Peer"
                    checked={proxyTargetRole === 'Peer'}
                    onChange={(e) => setProxyTargetRole(e.target.value)}
                  />
                  <b>Physical Peer Review Rating Sheet (20%)</b>
                </label>
              </div>
            </div>
          )}

          {/* Dynamic Rubric */}
          <div className="card">
            <DynamicRubric
              cosCategory={activeRecord.cosCategory}
              evaluatorRole={proxyMode ? proxyTargetRole : 'HRMO'}
              onSubmit={handleRubricSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
