import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldAlert, Download, FileDown, X, Calendar, Clock, User, Zap, TableProperties, Check } from 'lucide-react';
import Toast from '../common/Toast';

export const formatAuditAction = (action) => {
  switch (action) {
    case 'DAR_SUBMITTED':
      return 'Daily Report Submitted';
    case 'EVALUATION_PERIOD_INITIATED':
      return 'Evaluation Period Started';
    case 'EVALUATION_DRAFT_SAVED':
      return 'Draft Saved';
    case 'PASSWORD_RESET_COMPLETED':
      return 'Password Reset / Updated';
    case 'FAST_TRACK_REJECTION':
      return 'Non-Renewal Endorsed';
    case 'USER_LOGGED_IN':
      return 'User Signed In';
    case 'USER_REGISTERED':
      return 'Account Registered';
    case 'DEPARTMENT_TRANSFER':
      return 'Department Transfer';
    case 'USER_ARCHIVED':
      return 'Account Archived';
    case 'USER_RESTORED':
      return 'Account Restored';
    case 'PROFILE_UPDATED':
      return 'Profile Contact Updated';
    case 'ADMIN_PROFILE_UPDATE':
      return 'Admin Record Modified';
    case 'NOTIFICATION_PREFERENCES_UPDATED':
      return 'Notification Preferences Saved';
    case 'INVITATION_GENERATED':
      return 'Invitation Token Generated';
    case 'INVITATION_REVOKED':
      return 'Invitation Revoked';
    case 'SESSION_REVOKED':
      return 'Device Session Terminated';
    case 'ALL_OTHER_SESSIONS_REVOKED':
      return 'Other Sessions Terminated';
    default:
      return (action || '').replace(/_/g, ' ');
  }
};

export default function AuditTrail({
  logs: initialLogs = [],
  onBack = null,
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
      return;
    }
    const fetchAuditLogs = async () => {
      try {
        setIsLoading(true);
        if (api.audit && api.audit.list) {
          const res = await api.audit.list();
          setLogs(Array.isArray(res) ? res : res.logs || []);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuditLogs();
  }, [initialLogs]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Main Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'past7d' | 'past30d' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(thirtyDaysAgoIso);
  const [customEndDate, setCustomEndDate] = useState(todayIso);
  const [toastMsg, setToastMsg] = useState(null);

  const availableActionTypes = [
    { key: 'USER_LOGGED_IN', label: 'User Sign-Ins' },
    { key: 'USER_REGISTERED', label: 'Registrations' },
    { key: 'PASSWORD_RESET_COMPLETED', label: 'Password Changes' },
    { key: 'PROFILE_UPDATED', label: 'Profile Updates' },
    { key: 'ADMIN_PROFILE_UPDATE', label: 'Admin Record Updates' },
    { key: 'DEPARTMENT_TRANSFER', label: 'Department Transfers' },
    { key: 'USER_ARCHIVED', label: 'Account Archives' },
    { key: 'USER_RESTORED', label: 'Account Restorations' },
    { key: 'NOTIFICATION_PREFERENCES_UPDATED', label: 'Notification Preferences' },
    { key: 'INVITATION_GENERATED', label: 'Invitations Issued' },
    { key: 'INVITATION_REVOKED', label: 'Invitations Revoked' },
    { key: 'SESSION_REVOKED', label: 'Session Revocations' },
    { key: 'ALL_OTHER_SESSIONS_REVOKED', label: 'Mass Session Revocations' },
    { key: 'DAR_SUBMITTED', label: 'DAR Submissions' },
    { key: 'EVALUATION_DRAFT_SAVED', label: 'Evaluation Drafts' },
    { key: 'EVALUATION_PERIOD_INITIATED', label: 'Period Initiations' },
    { key: 'FAST_TRACK_REJECTION', label: 'Fast-Track Rejections' },
  ];

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTimeFilter, setExportTimeFilter] = useState('all');
  const [exportStartDate, setExportStartDate] = useState(thirtyDaysAgoIso);
  const [exportEndDate, setExportEndDate] = useState(todayIso);
  const [exportRoleFilter, setExportRoleFilter] = useState('all');
  const [exportActionTypes, setExportActionTypes] = useState(availableActionTypes.map((a) => a.key));
  const [exportColumns, setExportColumns] = useState([
    'timestamp',
    'user',
    'role',
    'action',
    'targetScope',
    'ipAddress',
    'operationDetails',
  ]);

  const availableColumns = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'user', label: 'Authorized User' },
    { key: 'role', label: 'Role' },
    { key: 'action', label: 'Action' },
    { key: 'targetScope', label: 'Target Scope' },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'operationDetails', label: 'Operation Details' },
  ];

  // Time filter helper
  const matchesTime = (logDateStr, filterType, startStr, endStr) => {
    if (filterType === 'all') return true;
    if (!logDateStr) return false;
    const logDate = new Date(logDateStr);
    const now = new Date();
    const diffMs = now.getTime() - logDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (filterType === 'today') {
      const todayString = now.toISOString().slice(0, 10);
      return logDateStr.slice(0, 10) === todayString;
    }
    if (filterType === 'past7d') {
      return diffDays >= -1 && diffDays <= 7;
    }
    if (filterType === 'past30d') {
      return diffDays >= -1 && diffDays <= 30;
    }
    if (filterType === 'custom') {
      const logDay = logDateStr.slice(0, 10);
      return (!startStr || logDay >= startStr) && (!endStr || logDay <= endStr);
    }
    return true;
  };

  // Main table filtered list
  const filtered = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.operationDetails.toLowerCase().includes(q) ||
      log.targetScope.toLowerCase().includes(q);

    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesTimeRange = matchesTime(log.isoDate, timeFilter, customStartDate, customEndDate);

    return matchesSearch && matchesAction && matchesTimeRange;
  });

  // Calculate filtered logs for the export modal
  const getExportFilteredLogs = () => {
    return logs.filter((log) => {
      const matchesTimeRange = matchesTime(log.isoDate, exportTimeFilter, exportStartDate, exportEndDate);
      const matchesRole = exportRoleFilter === 'all' || log.role === exportRoleFilter;
      const matchesAction = exportActionTypes.includes(log.action);
      return matchesTimeRange && matchesRole && matchesAction;
    });
  };

  // Execute export from modal
  const handleExecuteExport = () => {
    const candidateLogs = getExportFilteredLogs();
    if (candidateLogs.length === 0) {
      alert('No records match your selected export criteria.');
      return;
    }

    // Map selected columns to headers
    const headerLabels = exportColumns.map((colKey) => {
      const found = availableColumns.find((c) => c.key === colKey);
      return found ? found.label : colKey;
    });

    const rows = candidateLogs.map((log) => {
      return exportColumns.map((colKey) => {
        const val = colKey === 'action' ? formatAuditAction(log.action) : (log[colKey] || '');
        return `"${String(val).replace(/"/g, '""')}"`;
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headerLabels.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EVSU_Security_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
    setToastMsg(`Successfully exported ${candidateLogs.length} security log records to CSV!`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={28} color="var(--brand-700)" /> Security Logs &amp; Audit Trail
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Activity log of all evaluation actions, daily report submissions, and account updates across the system.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          )}
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowExportModal(true)}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <Download size={16} /> Export Logs
          </button>
        </div>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Security Logs Data Table Card with Integrated Header Filters */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input - wide and prominent */}
            <div style={{ flex: '2', minWidth: '280px' }}>
              <input
                className="form-control"
                type="text"
                placeholder="Search logs by personnel, action, or operation keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '13.5px', width: '100%' }}
              />
            </div>

            {/* Action Types Filter */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <select
                className="form-control"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ fontSize: '13.5px', width: '100%' }}
              >
                <option value="">All Action Types</option>
                {availableActionTypes.map((act) => (
                  <option key={act.key} value={act.key}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Time */}
            <div style={{ flex: '1', minWidth: '190px' }}>
              <select
                className="form-control"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{ fontSize: '13.5px', width: '100%' }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="past7d">Past 7 Days</option>
                <option value="past30d">Past 30 Days</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            {/* Clear Filters Button (shown when any filter is active) */}
            {(searchTerm || actionFilter || timeFilter !== 'all') && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('');
                  setTimeFilter('all');
                  setCustomStartDate(thirtyDaysAgoIso);
                  setCustomEndDate(todayIso);
                }}
                style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Reset all search and filter fields"
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {/* Dedicated Sub-row for Custom Date Range (prevents squishing top row) */}
          {timeFilter === 'custom' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed var(--line)',
                fontSize: '13px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--ink-800)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> Custom Range:
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  className="form-control"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ width: 'auto', fontSize: '13px', padding: '5px 10px' }}
                />
                <span className="muted" style={{ fontSize: '12px' }}>to</span>
                <input
                  type="date"
                  className="form-control"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ width: 'auto', fontSize: '13px', padding: '5px 10px' }}
                />
              </div>
              <span className="muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
                Showing events between {customStartDate} and {customEndDate}
              </span>
            </div>
          )}
        </div>

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
                <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--ink-800)' }}>
                  {log.timestamp}
                </td>
                <td>
                  <b>{log.user}</b>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {log.role}
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${log.action.toLowerCase().replace(/_/g, '')}`} style={{ fontSize: '11.5px', padding: '3px 8px', fontWeight: 600 }}>
                    {formatAuditAction(log.action)}
                  </span>
                </td>
                <td style={{ fontSize: '13px' }}>{log.targetScope}</td>
                <td className="muted" style={{ fontSize: '12.5px', fontFamily: 'monospace' }}>
                  {log.ipAddress}
                </td>
                <td style={{ fontSize: '13px' }}>{log.operationDetails}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '48px 16px', textAlign: 'center', background: '#fff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--red-50, #fef2f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red-700, #991b1b)' }}>
                      <ShieldAlert size={22} />
                    </div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                      {searchTerm || actionFilter || timeFilter !== 'all' ? 'No Logs Matching Filters' : 'No Security Audit Events Logged'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '420px', lineHeight: 1.5 }}>
                      System activity, administrative modifications, and security actions will be chronologically logged here in real time.
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export Filter Modal */}
      {showExportModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExportModal(false);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '600px', width: '92%' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileDown size={20} color="var(--brand-700)" />
                <span>Export Security Logs</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowExportModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '8px 0 16px' }}>
              <p className="muted" style={{ fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
                Configure the specific time period, action categories, and columns to include in your exported CSV file.
              </p>

              {/* 1. Time / Date Filter */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Clock size={14} /> Time Period to Export:
                </label>
                <select
                  className="form-control"
                  value={exportTimeFilter}
                  onChange={(e) => setExportTimeFilter(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  <option value="all">All Available Records</option>
                  <option value="today">Today Only</option>
                  <option value="past7d">Past 7 Days</option>
                  <option value="past30d">Past 30 Days</option>
                  <option value="custom">Custom Date Range...</option>
                </select>

                {exportTimeFilter === 'custom' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                    <input
                      type="date"
                      className="form-control"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      style={{ fontSize: '12.5px' }}
                    />
                    <span className="muted" style={{ fontSize: '12px' }}>to</span>
                    <input
                      type="date"
                      className="form-control"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>
                )}
              </div>

              {/* 2. User Role Filter */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <User size={14} /> User Role:
                </label>
                <select
                  className="form-control"
                  value={exportRoleFilter}
                  onChange={(e) => setExportRoleFilter(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  <option value="all">All User Roles</option>
                  <option value="COS Employee">COS Employee</option>
                  <option value="Department Head">Department Head</option>
                  <option value="HR Personnel">HR Personnel</option>
                </select>
              </div>

              {/* 3. Action Types Filter */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} /> Action Types to Include:
                  </label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-700)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                    onClick={() => {
                      if (exportActionTypes.length === availableActionTypes.length) {
                        setExportActionTypes([]);
                      } else {
                        setExportActionTypes(availableActionTypes.map((a) => a.key));
                      }
                    }}
                  >
                    {exportActionTypes.length === availableActionTypes.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '8px',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  {availableActionTypes.map((action) => (
                    <label
                      key={action.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={exportActionTypes.includes(action.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportActionTypes([...exportActionTypes, action.key]);
                          } else {
                            setExportActionTypes(exportActionTypes.filter((k) => k !== action.key));
                          }
                        }}
                      />
                      <span>{action.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Column Fields to Include */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <TableProperties size={14} /> Columns to Include:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12.5px' }}>
                  {availableColumns.map((col) => (
                    <label
                      key={col.key}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <input
                        type="checkbox"
                        checked={exportColumns.includes(col.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportColumns([...exportColumns, col.key]);
                          } else if (exportColumns.length > 1) {
                            setExportColumns(exportColumns.filter((c) => c !== col.key));
                          }
                        }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Match Summary Indicator */}
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--brand-50)',
                  border: '1px solid var(--brand-border)',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  color: 'var(--brand-900)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <b>Matching Records:</b> {getExportFilteredLogs().length} of {logs.length} logs
                </span>
                <span>
                  <b>Columns:</b> {exportColumns.length} fields
                </span>
              </div>
            </div>

            <div className="flex-between">
              <button
                type="button"
                className="btn"
                onClick={() => setShowExportModal(false)}
                style={{ cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={getExportFilteredLogs().length === 0}
                onClick={handleExecuteExport}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  cursor: getExportFilteredLogs().length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
