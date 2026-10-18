import React, { useState } from 'react';
import DynamicRubric from '../common/DynamicRubric';

export default function PeerEvaluations({
  departmentName = 'Computer Studies Department',
  assignedPeers = [
    {
      id: 201,
      targetName: 'Ian Joseph Ranoco',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      status: 'Pending Your Evaluation',
    },
    {
      id: 202,
      targetName: 'Mark Anthony Villa',
      department: 'Computer Studies Department',
      cosCategory: 'Maintenance/Janitorial',
      status: 'Pending Your Evaluation',
    },
  ],
  onSubmitPeerScore = () => {},
}) {
  const [selectedPeerId, setSelectedPeerId] = useState(null);
  const [submittedPeerIds, setSubmittedPeerIds] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  const activePeer = assignedPeers.find((p) => p.id === selectedPeerId);

  const handleSubmitScore = (evalData) => {
    onSubmitPeerScore({
      targetPeerId: selectedPeerId,
      ...evalData,
      isAnonymous: true,
    });
    setSubmittedPeerIds([...submittedPeerIds, selectedPeerId]);
    setSelectedPeerId(null);
    setSuccessMsg('Peer evaluation submitted successfully! Your identity has been completely stripped to guarantee anonymity.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Pending Peer Evaluations (UC-04)</h1>
        </div>
        {selectedPeerId && (
          <button type="button" className="btn btn-sm" onClick={() => setSelectedPeerId(null)}>
            ← Back to Peer List
          </button>
        )}
      </div>

      {successMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Peer Roster List */}
      {!selectedPeerId && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
            <div className="card-title" style={{ margin: 0 }}>
              System-Assigned Peer Review Board (FR-27)
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              These colleagues from your department were randomly assigned by the system to evenly distribute evaluation workload and eliminate selection bias.
            </p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Assigned Colleague</th>
                <th>Category</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignedPeers.map((peer) => {
                const isDone = submittedPeerIds.includes(peer.id);
                return (
                  <tr key={peer.id}>
                    <td>
                      <b>{peer.targetName}</b>
                      <div className="muted" style={{ fontSize: '12px' }}>{peer.department}</div>
                    </td>
                    <td>
                      <span className="badge badge-dept">{peer.cosCategory}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${isDone ? 'completed' : 'inprogress'}`}>
                        {isDone ? 'Submitted' : peer.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={isDone}
                        onClick={() => setSelectedPeerId(peer.id)}
                      >
                        {isDone ? 'Completed' : 'Evaluate Peer →'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Peer Rubric Evaluation View */}
      {selectedPeerId && activePeer && (
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <div>
              <div className="card-title" style={{ margin: '0 0 4px' }}>
                Peer Evaluation for: {activePeer.targetName}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                Assignment: <b>{activePeer.cosCategory}</b> &nbsp;·&nbsp; Weight: <b>20% Peer Review Score</b>
              </p>
            </div>
            <span className="badge badge-completed">
              🔒 Identity Masked from Subject (US-04)
            </span>
          </div>

          <DynamicRubric
            cosCategory={activePeer.cosCategory}
            evaluatorRole="Peer"
            onSubmit={handleSubmitScore}
          />
        </div>
      )}
    </div>
  );
}
