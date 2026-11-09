import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Camera,
  X,
  Printer,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import evsuSeal from '../../assets/images/evsu-seal.png';

export default function MonthlyReport({
  employeeId = null,
  employeeName = 'Jorge Mikhael Gubantes',
  department = 'Computer Studies Department',
  onBack = null,
  backLabel = 'Back to Renewals & Evaluations',
  onNavigate = null,
  onDownload = null,
  downloadLabel = 'Print / Save DAR Report (PDF)',
  cyclePeriod = null,
  initialRecords = null,
}) {
  const safeDeptName = typeof department === 'object' && department !== null
    ? (department.name || 'Computer Studies Department')
    : (department || 'Computer Studies Department');

  const [records, setRecords] = useState(Array.isArray(initialRecords) ? initialRecords : []);
  const [isLoading, setIsLoading] = useState(!Array.isArray(initialRecords));
  const [fetchError, setFetchError] = useState(null);

  // Quincena & Filter States
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const currentYearStr = String(now.getFullYear());

  const [cutoffPeriod, setCutoffPeriod] = useState('1st_half'); // '1st_half' | '2nd_half' | 'full_month'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Standard Calendar Months
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Fetch real accumulated DAR records from backend database
  useEffect(() => {
    // If initialRecords was explicitly passed and valid, use that
    if (Array.isArray(initialRecords) && initialRecords.length > 0) {
      setRecords(initialRecords);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    const targetUser = employeeId || api?.auth?.getCurrentUser()?.id || null;

    api.dar
      .monthly(targetUser, selectedMonth === 'All Months' ? null : selectedMonth, Number(selectedYear), cutoffPeriod)
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setRecords(data);
        } else {
          setRecords([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Unable to load accumulated DAR records:', err.message);
        setFetchError('Failed to fetch accumulated logs: ' + (err.message || 'Server error'));
        setRecords([]);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [employeeId, initialRecords, selectedMonth, selectedYear, cutoffPeriod]);

  // Generous years list (past 5 years through next year, plus any from data)
  const availableYears = useMemo(() => {
    const yearsSet = new Set(records.map((r) => r.year).filter(Boolean));
    const currentNum = now.getFullYear();
    for (let y = currentNum - 4; y <= currentNum + 1; y++) {
      yearsSet.add(String(y));
    }
    return Array.from(yearsSet).sort().reverse();
  }, [records]);

  // Dynamic Cutoff Label for current selection
  const cutoffLabel = useMemo(() => {
    if (selectedMonth === 'All Months') {
      return `Annual Accomplishment Records (${selectedYear})`;
    }
    const monthIdx = months.indexOf(selectedMonth);
    const daysInMonth = monthIdx >= 0 ? new Date(Number(selectedYear), monthIdx + 1, 0).getDate() : 30;

    if (cutoffPeriod === '1st_half') {
      return `${selectedMonth} 01–15, ${selectedYear} (1st Quincena)`;
    }
    if (cutoffPeriod === '2nd_half') {
      return `${selectedMonth} 16–${daysInMonth}, ${selectedYear} (2nd Quincena)`;
    }
    return `${selectedMonth} 01–${daysInMonth}, ${selectedYear} (Full Month)`;
  }, [selectedMonth, selectedYear, cutoffPeriod, months]);

  // Check if the selected cutoff period hasn't started yet relative to today
  const isPeriodFuture = useMemo(() => {
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const currentDay = now.getDate();

    const selYear = Number(selectedYear);
    const selMonthIdx = months.indexOf(selectedMonth);

    if (selYear > currentYear) return true;
    if (selYear < currentYear) return false;

    if (selMonthIdx > currentMonthIdx) return true;
    if (selMonthIdx < currentMonthIdx) return false;

    // Same year and month: check if 2nd half has not started
    if (cutoffPeriod === '2nd_half' && currentDay < 16) {
      return true;
    }
    return false;
  }, [now, selectedYear, selectedMonth, cutoffPeriod, months]);

  // Filter records by Quincena Cutoff, Month, and Year
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesMonth = selectedMonth === 'All Months' || rec.month === selectedMonth;
      const matchesYear = !selectedYear || rec.year === selectedYear;

      // Cutoff verification (1st Half: days 1-15, 2nd Half: days 16-end, Full Month: all)
      let matchesCutoff = true;
      if (cutoffPeriod === '1st_half' || cutoffPeriod === '2nd_half') {
        let dayNum = rec.day;
        if (dayNum == null && rec.logDate) {
          const parts = String(rec.logDate).split('-');
          if (parts.length === 3) dayNum = parseInt(parts[2], 10);
        }
        if (dayNum == null && rec.dateSubmitted) {
          const m = String(rec.dateSubmitted).match(/\b([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})/);
          if (m) dayNum = parseInt(m[2], 10);
        }

        if (dayNum != null) {
          if (cutoffPeriod === '1st_half') matchesCutoff = dayNum <= 15;
          if (cutoffPeriod === '2nd_half') matchesCutoff = dayNum >= 16;
        } else if (rec.cutoff) {
          matchesCutoff = rec.cutoff === cutoffPeriod;
        }
      }

      return matchesMonth && matchesYear && matchesCutoff;
    });
  }, [records, selectedMonth, selectedYear, cutoffPeriod]);

  // Handle Print / PDF Export
  const handlePrint = () => {
    if (onDownload) {
      onDownload();
    } else {
      window.print();
    }
  };

  return (
    <div className="mar-container">
      {/* Printable Letterhead Header (Always rendered for @media print, hidden on screen) */}
      <div className="mar-print-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
          <img src={evsuSeal} alt="EVSU Seal" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11pt', fontWeight: 700, textTransform: 'uppercase' }}>Republic of the Philippines</div>
            <div style={{ fontSize: '13pt', fontWeight: 800, textTransform: 'uppercase', color: '#8b0000' }}>
              Eastern Visayas State University
            </div>
            <div style={{ fontSize: '10pt', fontWeight: 600 }}>Ormoc City Campus — Ormoc City, Leyte</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', borderTop: '2px solid #000', paddingTop: '8px' }}>
          <div style={{ fontSize: '12pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Individual Accomplishment Report (DAR)
          </div>
          <div style={{ fontSize: '10pt', color: '#333', marginTop: '3px' }}>
            Coverage Period: <b>{cutoffLabel}</b>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '10pt', borderBottom: '1px solid #000', paddingBottom: '6px' }}>
          <div><strong>Employee:</strong> {employeeName}</div>
          <div><strong>Department:</strong> {safeDeptName}</div>
          <div><strong>Status:</strong> Contract of Service (COS)</div>
        </div>
      </div>

      {/* Screen Page Header (Hidden when printing) */}
      <div className="flex-between no-print" style={{ marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '24px' }}>Accumulated DAR Logs</h1>
          <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
            {safeDeptName} &mdash; Official quincena compilation of verified daily accomplishment reports for <b>{employeeName}</b>
            {cyclePeriod ? ` (${cyclePeriod})` : ''}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            title="Open browser print dialog to save as official PDF"
          >
            <Printer size={15} />
            <span>{downloadLabel}</span>
          </button>

          {onBack && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <ArrowLeft size={14} />
              <span>{backLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quincena Window Switcher & Filters (Hidden when printing) */}
      <div className="card no-print" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="flex-between" style={{ gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Spread-out Window Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Window:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCutoffPeriod('1st_half')}
                className={`btn btn-sm ${cutoffPeriod === '1st_half' ? 'btn-active' : ''}`}
                style={{
                  background: cutoffPeriod === '1st_half' ? 'var(--brand-700)' : '#f1f5f9',
                  color: cutoffPeriod === '1st_half' ? '#fff' : 'var(--ink-700)',
                  fontWeight: 600,
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                1st Half (1st – 15th)
              </button>
              <button
                type="button"
                onClick={() => setCutoffPeriod('2nd_half')}
                className={`btn btn-sm ${cutoffPeriod === '2nd_half' ? 'btn-active' : ''}`}
                style={{
                  background: cutoffPeriod === '2nd_half' ? 'var(--brand-700)' : '#f1f5f9',
                  color: cutoffPeriod === '2nd_half' ? '#fff' : 'var(--ink-700)',
                  fontWeight: 600,
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                2nd Half (16th – End)
              </button>
              <button
                type="button"
                onClick={() => setCutoffPeriod('full_month')}
                className={`btn btn-sm ${cutoffPeriod === 'full_month' ? 'btn-active' : ''}`}
                style={{
                  background: cutoffPeriod === 'full_month' ? 'var(--brand-700)' : '#f1f5f9',
                  color: cutoffPeriod === 'full_month' ? '#fff' : 'var(--ink-700)',
                  fontWeight: 600,
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Full Month
              </button>
            </div>
          </div>

          {/* Month & Year Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Month:</span>
            <select
              className="form-control"
              style={{ minWidth: '150px', width: 'auto', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ minWidth: '95px', width: 'auto', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="flash flash-danger no-print" style={{ marginBottom: '16px' }}>
          {fetchError}
        </div>
      )}

      {/* Compiled Accomplishment Table Card */}
      <div className="card mar-table-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex-between no-print" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div>
            <div className="card-title" style={{ margin: 0, fontSize: '16px' }}>
              Daily Accomplishment Records ({cutoffLabel})
            </div>
            <span className="muted" style={{ fontSize: '12.5px' }}>
              Showing {filteredRecords.length} verified task accomplishment record(s)
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Date &amp; Time</th>
                <th style={{ width: '25%' }}>Job Description / Task</th>
                <th style={{ width: '28%' }}>Specific Work Accomplished</th>
                <th style={{ width: '10%' }}>Quantity</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Photo Evidence</th>
                <th style={{ width: '12%' }}>Verification &amp; Remarks</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-500)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="spin" />
                      <span>Loading accumulated accomplishment reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                      <b>{row.dateSubmitted.split(',')[0]}</b>
                      <div className="muted" style={{ fontSize: '11.5px' }}>
                        {row.dateSubmitted.split(',').slice(1).join(',')}
                      </div>
                    </td>
                    <td>
                      <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>{row.jobDescription}</b>
                    </td>
                    <td style={{ fontSize: '13px', lineHeight: 1.45 }}>
                      {row.workAccomplished}
                    </td>
                    <td>
                      <span className="badge badge-dept" style={{ fontWeight: 600 }}>
                        {row.quantity || '1 task'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.photoEvidenceUrl ? (
                        <button
                          type="button"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                          onClick={() => setPreviewPhoto(row)}
                          title="Click to view full geotagged photo proof"
                        >
                          <img
                            src={row.photoEvidenceUrl}
                            alt="Evidence"
                            style={{
                              width: '44px',
                              height: '44px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid var(--line)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                          />
                        </button>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>
                      {row.isGeofenceValid && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d', fontWeight: 600, fontSize: '11.5px', marginBottom: '2px' }}>
                          <ShieldCheck size={13} />
                          <span>Geotag Verified</span>
                        </div>
                      )}
                      <div>{row.remarks || '—'}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-500)' }}>
                    {isPeriodFuture ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={32} color="#94a3b8" />
                        <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--ink-800)' }}>
                          Period Has Not Started Yet
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--ink-500)', maxWidth: '440px', lineHeight: 1.5 }}>
                          This quincena period ({cutoffLabel}) has not started yet. Accomplishments can be logged once this period begins.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <FileText size={32} color="#94a3b8" />
                        <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--ink-800)' }}>
                          No Accomplishment Records Logged
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--ink-500)', maxWidth: '440px', lineHeight: 1.5 }}>
                          No daily accomplishment reports were submitted for this period ({cutoffLabel}).
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary Counter (Hidden when printing) */}
        {!isLoading && filteredRecords.length > 0 && (
          <div className="flex-between no-print" style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', background: '#fafbfc' }}>
            <span className="muted" style={{ fontSize: '12px' }}>
              Total entries displayed: <b>{filteredRecords.length}</b> verified logs
            </span>
            <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>
              Period: <b>{cutoffLabel}</b>
            </div>
          </div>
        )}
      </div>

      {/* Official Signatures Section (Rendered for Print) */}
      <div className="mar-print-signatures" style={{ display: 'none', marginTop: '40px' }}>
        <div style={{ width: '30%', textAlign: 'center' }}>
          <div style={{ fontSize: '10pt', marginBottom: '40px', fontWeight: 600 }}>Prepared By:</div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 700, fontSize: '10pt' }}>
            {employeeName.toUpperCase()}
          </div>
          <div style={{ fontSize: '9pt', color: '#444' }}>COS Employee / Personnel</div>
        </div>

        <div style={{ width: '30%', textAlign: 'center' }}>
          <div style={{ fontSize: '10pt', marginBottom: '40px', fontWeight: 600 }}>Noted &amp; Verified By:</div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 700, fontSize: '10pt' }}>
            DEPARTMENT HEAD
          </div>
          <div style={{ fontSize: '9pt', color: '#444' }}>{safeDeptName}</div>
        </div>

        <div style={{ width: '30%', textAlign: 'center' }}>
          <div style={{ fontSize: '10pt', marginBottom: '40px', fontWeight: 600 }}>Approved &amp; Audited:</div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 700, fontSize: '10pt' }}>
            HRMDO IN-CHARGE
          </div>
          <div style={{ fontSize: '9pt', color: '#444' }}>Human Resource Management Office</div>
        </div>
      </div>

      {/* Photo Evidence Modal Popup */}
      {previewPhoto && (
        <div className="modal-overlay open" onClick={() => setPreviewPhoto(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: '640px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="var(--brand-700)" />
                <span>Verified DAR Photo Evidence</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setPreviewPhoto(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginTop: '14px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden', padding: '6px' }}>
              <img
                src={previewPhoto.photoEvidenceUrl}
                alt="Full Evidence"
                style={{ width: '100%', maxHeight: '440px', objectFit: 'contain', display: 'block' }}
              />
            </div>

            <div
              style={{
                marginTop: '12px',
                textAlign: 'left',
                background: 'var(--surface-50)',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                fontSize: '12px',
              }}
            >
              <div><strong>Task:</strong> {previewPhoto.jobDescription}</div>
              <div style={{ marginTop: '3px' }}><strong>Accomplishment:</strong> {previewPhoto.workAccomplished}</div>
              <div style={{ marginTop: '3px' }}><strong>Date Submitted:</strong> {previewPhoto.dateSubmitted}</div>
              <div style={{ marginTop: '3px', color: '#059669', fontWeight: 600 }}>
                {previewPhoto.campusSite || 'EVSU Ormoc Campus'} &bull; Tamper-Proof Geotag Badge Active
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <a
                href={previewPhoto.photoEvidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ExternalLink size={13} />
                <span>Open High-Res Original</span>
              </a>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setPreviewPhoto(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
