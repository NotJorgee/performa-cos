import React, { useState, useEffect } from 'react';
import {
  Database,
  FileSpreadsheet,
  Download,
  Check,
  ArrowLeft,
  Users,
  Building2,
  MapPin,
  Clock,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import Toast from '../common/Toast';

export default function BackupData({ onBack = null }) {
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live database stats
  const [dbStats, setDbStats] = useState({
    usersCount: 0,
    departmentsCount: 0,
    darsCount: 0,
    evaluationsCount: 0,
    renewalsCount: 0,
    geofencesCount: 0,
    auditLogsCount: 0,
    totalRecords: 0,
    lastBackupDate: null,
  });

  // Past backup exports from audit logs
  const [backupHistory, setBackupHistory] = useState([]);

  const loadStatsAndHistory = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (api?.backup) {
        const [statsData, historyData] = await Promise.allSettled([
          api.backup.getStats(),
          api.backup.getHistory(),
        ]);

        if (statsData.status === 'fulfilled' && statsData.value) {
          setDbStats(statsData.value);
        }
        if (historyData.status === 'fulfilled' && Array.isArray(historyData.value)) {
          setBackupHistory(historyData.value);
        }
      }
    } catch (err) {
      console.warn('Backup data load notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndHistory();
  }, []);

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    setErrorMsg(null);

    try {
      let result;
      if (format === 'csv') {
        result = await api.backup.downloadCsv();
      } else {
        result = await api.backup.downloadSql();
      }

      const { blob, filename } = result;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const typeLabel = format === 'sql' ? 'SQL Database Backup' : 'CSV Spreadsheet Archive';
      setToastMsg(`${typeLabel} (${filename}) generated and downloaded successfully.`);
      setTimeout(() => setToastMsg(null), 5000);

      // Refresh stats and history to reflect new audit record
      loadStatsAndHistory();
    } catch (err) {
      console.error('Download error:', err);
      setErrorMsg(`Failed to export ${format.toUpperCase()} backup: ${err.message}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadExisting = (item) => {
    const isSql = item.type.includes('SQL') || item.fileName.endsWith('.sql');
    handleDownload(isSql ? 'sql' : 'csv');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={28} color="var(--brand-700)" /> Institutional Data Backup &amp; Archiving
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Generate and export authenticated copies of Eastern Visayas State University COS records for regulatory compliance, disaster recovery, and offline archiving.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-sm"
            type="button"
            onClick={loadStatsAndHistory}
            disabled={isLoading}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh database volume statistics"
          >
            <RotateCcw size={13} />
            <span>Refresh Stats</span>
          </button>
          {onBack && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={onBack}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </div>

      <Toast
        message={errorMsg || toastMsg}
        type={errorMsg ? 'error' : 'success'}
        onClose={() => {
          setToastMsg(null);
          setErrorMsg(null);
        }}
      />

      {/* Live System Data Volume Strip */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '16px 20px',
          background: '#f8fafc',
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink-900)', marginBottom: '10px' }}>
          Current PostgreSQL Live Database Inventory
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={13} color="var(--brand-700)" /> Registered Accounts
            </div>
            <b style={{ fontSize: '18px', color: 'var(--ink-900)' }}>{dbStats.usersCount} Users</b>
          </div>
          <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={13} color="var(--brand-700)" /> Campus Departments
            </div>
            <b style={{ fontSize: '18px', color: 'var(--ink-900)' }}>{dbStats.departmentsCount} Units</b>
          </div>
          <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={13} color="var(--brand-700)" /> Geofence Perimeters
            </div>
            <b style={{ fontSize: '18px', color: 'var(--ink-900)' }}>{dbStats.geofencesCount} Sites</b>
          </div>
          <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} color="var(--brand-700)" /> Security Audit Logs
            </div>
            <b style={{ fontSize: '18px', color: 'var(--ink-900)' }}>{dbStats.auditLogsCount} Events</b>
          </div>
          <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="var(--brand-700)" /> Last Backup Timestamp
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-800)', display: 'block', marginTop: '3px' }}>
              {dbStats.lastBackupDate || 'None recorded yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Option Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {/* Option 1: CSV Archive */}
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            background: '#ffffff',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: '#f0fdf4',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>CSV Spreadsheet Archive</h3>
                <span className="muted" style={{ fontSize: '12.5px' }}>Multi-table institutional dataset (.csv)</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-700)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Extracts personnel master records, department structures, DAR logs, campus geofence configurations, and audit events into standard delimited CSV format. Compatible with Microsoft Excel, Google Sheets, or university offline storage.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={downloadingFormat === 'csv'}
            onClick={() => handleDownload('csv')}
            style={{
              width: '100%',
              padding: '11px 16px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: downloadingFormat === 'csv' ? 'not-allowed' : 'pointer',
            }}
          >
            {downloadingFormat === 'csv' ? 'Generating CSV Archive...' : (
              <>
                <Download size={15} /> Export CSV Archive
              </>
            )}
          </button>
        </div>

        {/* Option 2: SQL Dump */}
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            background: '#ffffff',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: 'var(--brand-50)',
                  color: 'var(--brand-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Full PostgreSQL SQL Dump</h3>
                <span className="muted" style={{ fontSize: '12.5px' }}>Complete database backup script (.sql)</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-700)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Generates an authentic PostgreSQL-compatible SQL script with table schema statements and populated INSERT queries for all database rows. Designed for disaster recovery or database migration.
            </p>
          </div>

          <button
            type="button"
            className="btn"
            disabled={downloadingFormat === 'sql'}
            onClick={() => handleDownload('sql')}
            style={{
              width: '100%',
              padding: '11px 16px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: downloadingFormat === 'sql' ? 'not-allowed' : 'pointer',
            }}
          >
            {downloadingFormat === 'sql' ? 'Generating SQL Dump...' : (
              <>
                <Download size={15} /> Export PostgreSQL Backup (.sql)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real Backup History */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="card-title" style={{ margin: 0 }}>
            Recent Backup Export Audit Trail
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Official audit log of backup exports generated by system administrators.
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>File Archive</th>
              <th>Format Type</th>
              <th>Date Exported</th>
              <th>Exported By</th>
              <th style={{ textAlign: 'right' }}>Re-Download</th>
            </tr>
          </thead>
          <tbody>
            {backupHistory.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  No backup files have been exported yet. Click an option above to generate your first backup.
                </td>
              </tr>
            ) : (
              backupHistory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                      {item.fileName}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.type.includes('CSV') ? 'badge-active' : 'badge-completed'
                      }`}
                      style={{ fontSize: '11.5px' }}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--ink-700)' }}>{item.date}</td>
                  <td style={{ fontSize: '13px', color: 'var(--ink-800)' }}>{item.executedBy}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleDownloadExisting(item)}
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      title={`Re-export ${item.fileName}`}
                    >
                      <Download size={13} /> Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
