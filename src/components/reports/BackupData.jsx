import React, { useState } from 'react';

export default function BackupData({ onBack = null }) {
  const [toastMsg, setToastMsg] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Simple history of past backups for HR reference
  const [backupHistory, setBackupHistory] = useState([
    {
      id: 1,
      fileName: 'evsu_performa_records_20261025.csv',
      type: 'CSV Spreadsheet Archive',
      fileSize: '3.8 MB',
      date: 'Oct 25, 2026, 12:45 PM',
    },
    {
      id: 2,
      fileName: 'evsu_performa_backup_20261025.sql',
      type: 'SQL Database Dump',
      fileSize: '14.2 MB',
      date: 'Oct 25, 2026, 11:30 AM',
    },
    {
      id: 3,
      fileName: 'evsu_performa_records_20261024.csv',
      type: 'CSV Spreadsheet Archive',
      fileSize: '3.6 MB',
      date: 'Oct 24, 2026, 04:15 PM',
    },
  ]);

  const handleDownload = (format) => {
    setDownloadingFormat(format);

    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const isSql = format === 'sql';
      const ext = isSql ? 'sql' : 'csv';
      const fileName = `evsu_performa_${isSql ? 'database_dump' : 'records_archive'}_${dateStr}.${ext}`;
      const typeLabel = isSql ? 'SQL Database Dump' : 'CSV Spreadsheet Archive';

      // Sample mock content
      let content = '';
      if (isSql) {
        content = `-- EVSU Performa-COS Database Dump\n-- Generated on: ${now.toLocaleString()}\n-- University: Eastern Visayas State University - Ormoc City Campus\n\nCREATE TABLE IF NOT EXISTS employees (...);\nCREATE TABLE IF NOT EXISTS evaluations (...);\nCREATE TABLE IF NOT EXISTS daily_reports (...);\n`;
      } else {
        content = `"Employee ID","Full Name","Department","COS Category","Contract End","Status","Latest Score"\n"G10222026JMR","Jorge Mikhael Gubantes","Computer Studies Department","Administrative","Apr 22, 2027","Active","92.4"\n"R10222026IJM","Ian Joseph Ranoco","Computer Studies Department","Administrative","Apr 22, 2027","Active","88.6"\n"M10222026CBM","Carlos Mendoza","Maintenance/Janitorial (MESO) Office","Maintenance/Janitorial","Apr 22, 2027","Active","88.0"\n`;
      }

      const mimeType = isSql ? 'application/sql' : 'text/csv';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Add to recent list
      const newEntry = {
        id: Date.now(),
        fileName,
        type: typeLabel,
        fileSize: isSql ? '14.5 MB' : '3.9 MB',
        date: 'Just now',
      };
      setBackupHistory((prev) => [newEntry, ...prev]);

      setDownloadingFormat(null);
      setToastMsg(`✓ ${typeLabel} (${fileName}) downloaded successfully!`);
      setTimeout(() => setToastMsg(null), 4500);
    }, 600);
  };

  const handleDownloadExisting = (item) => {
    const blob = new Blob([`-- Downloaded copy of ${item.fileName}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', item.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMsg(`✓ Re-downloading ${item.fileName}`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>💾 Backup Data</h1>
          <p className="muted" style={{ margin: 0 }}>
            Download an offline copy of university records in SQL or CSV format for safe archiving and compliance.
          </p>
        </div>
        <div>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '18px' }}>
          {toastMsg}
        </div>
      )}

      {/* Simplified Two-Option Cards */}
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
                  fontSize: '22px',
                }}
              >
                📊
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>CSV Data Archive</h3>
                <span className="muted" style={{ fontSize: '12.5px' }}>Spreadsheet records (.csv)</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-700)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Downloads personnel appraisal records, employee directories, and evaluation scores in clean CSV spreadsheet format. Ready for Microsoft Excel, Google Sheets, or official institutional reports.
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
            {downloadingFormat === 'csv' ? 'Preparing CSV Archive...' : '⬇️ Download CSV Archive'}
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
                  fontSize: '22px',
                }}
              >
                🗄️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>SQL Database Dump</h3>
                <span className="muted" style={{ fontSize: '12.5px' }}>Raw database script (.sql)</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-700)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Downloads a technical SQL database dump containing all database schemas and tables. Ideal for database migrations, developers, or disaster recovery restores.
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
            {downloadingFormat === 'sql' ? 'Generating SQL Dump...' : '⬇️ Download SQL Dump'}
          </button>
        </div>
      </div>

      {/* Recent Downloads History */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="card-title" style={{ margin: 0 }}>
            Recent Downloaded Backups
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            List of recently generated backup files. Click to download a copy again.
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Format</th>
              <th>Date Generated</th>
              <th>File Size</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {backupHistory.map((item) => (
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
                <td style={{ fontSize: '13px' }}>{item.fileSize}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => handleDownloadExisting(item)}
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title={`Re-download ${item.fileName}`}
                  >
                    ⬇️ Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
