import React, { useState } from 'react';

export default function AuditTrail({
  logs = [
    {
      id: 1,
      timestamp: 'Oct 17, 2026 10:15:22',
      user: 'Jorge Mikhael Gubantes',
      role: 'COS Employee',
      action: 'DAR_SUBMITTED',
      targetScope: 'Daily Accomplishment Report #101',
      ipAddress: '192.168.1.45',
      operationDetails: 'Submitted geofenced task log with 2 photo attachments; GPS campus verified.',
    },
    {
      id: 2,
      timestamp: 'Oct 17, 2026 09:30:10',
      user: 'Engr. Department Head',
      role: 'Department Head',
      action: 'EVALUATION_DRAFT_SAVED',
      targetScope: 'Evaluation Cycle #1',
      ipAddress: '192.168.1.12',
      operationDetails: 'Saved draft scores for Categories A and B for Jorge Mikhael Gubantes.',
    },
    {
      id: 3,
      timestamp: 'Oct 16, 2026 16:45:00',
      user: 'HR Compliance Officer',
      role: 'HR Personnel',
      action: 'EVALUATION_PERIOD_INITIATED',
      targetScope: '1st Semester 2026-2027',
      ipAddress: '192.168.1.5',
      operationDetails: 'Initiated evaluation cycle for 48 active COS employees; deadline set to Nov 15.',
    },
    {
      id: 4,
      timestamp: 'Oct 16, 2026 14:20:15',
      user: 'Ian Joseph Ranoco',
      role: 'COS Employee',
      action: 'PASSWORD_RESET_COMPLETED',
      targetScope: 'User Account #102',
      ipAddress: '192.168.1.60',
      operationDetails: 'Verified email OTP and securely updated password with BCRYPT hash.',
    },
  ],
  onExportCsv = () => {},
  onExportDatabaseBackup = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = logs.filter((log) => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.operationDetails.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Security Audit Trail &amp; Logs (UC-09)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Read-only timestamped record of grading actions, account changes, and administrative transactions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn"
            type="button"
            onClick={onExportDatabaseBackup}
            title="Export SQL dump or compressed archive (UC-12)"
          >
            💾 Export Database Backup (UC-12)
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onExportCsv}
          >
            Export Audit CSV
          </button>
        </div>
      </div>

      <div className="filter-row">
        <input
          className="form-control"
          type="text"
          placeholder="Filter by user name, action, or operation keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-control"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Action Types</option>
          <option value="DAR_SUBMITTED">DAR Submissions</option>
          <option value="EVALUATION_DRAFT_SAVED">Evaluation Drafts</option>
          <option value="EVALUATION_PERIOD_INITIATED">Period Initiations</option>
          <option value="PASSWORD_RESET_COMPLETED">Password Changes</option>
          <option value="FAST_TRACK_REJECTION">Fast-Track Rejections</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Authorized User</th>
              <th>Action</th>
              <th>Target Scope</th>
              <th>IP Address</th>
              <th>Operation Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{log.timestamp}</td>
                <td>
                  <b>{log.user}</b>
                  <div className="muted" style={{ fontSize: '12px' }}>{log.role}</div>
                </td>
                <td>
                  <span className={`badge badge-${log.action.toLowerCase().replace(/_/g, '')}`}>
                    {log.action}
                  </span>
                </td>
                <td style={{ fontSize: '13px' }}>{log.targetScope}</td>
                <td className="muted" style={{ fontSize: '12.5px' }}>{log.ipAddress}</td>
                <td style={{ fontSize: '13px' }}>{log.operationDetails}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="muted" style={{ padding: '24px', textAlign: 'center' }}>
                  No audit log records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
