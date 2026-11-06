import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Camera,
  X,
  Printer,
  ArrowLeft,
  Calendar,
  Search,
  PlusCircle,
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
  downloadLabel = 'Print / Save MAR (PDF)',
  cyclePeriod = null,
  initialRecords = null,
}) {
  const safeDeptName = typeof department === 'object' && department !== null
    ? (department.name || 'Computer Studies Department')
    : (department || 'Computer Studies Department');

  const [records, setRecords] = useState(Array.isArray(initialRecords) ? initialRecords : []);
  const [isLoading, setIsLoading] = useState(!Array.isArray(initialRecords));
  const [fetchError, setFetchError] = useState(null);

  // Filter States
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYearStr = String(new Date().getFullYear());

  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Month options list
  const months = [
    'All Months',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Fetch real accumulated MAR records from backend database
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
      .monthly(targetUser)
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
        console.warn('Unable to load accumulated MAR records:', err.message);
        setFetchError('Failed to fetch accumulated logs: ' + (err.message || 'Server error'));
        setRecords([]);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [employeeId, initialRecords]);

  // Dynamically extract available years from records (or current year)
  const availableYears = useMemo(() => {
    const yearsSet = new Set(records.map((r) => r.year).filter(Boolean));
    yearsSet.add(currentYearStr);
    yearsSet.add('2025');
    return Array.from(yearsSet).sort().reverse();
  }, [records, currentYearStr]);

  // Filter records by Month / Year / Search Term
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesMonth = selectedMonth === 'All Months' || rec.month === selectedMonth;
      const matchesYear = !selectedYear || rec.year === selectedYear;
      const searchLower = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        (rec.jobDescription && rec.jobDescription.toLowerCase().includes(searchLower)) ||
        (rec.workAccomplished && rec.workAccomplished.toLowerCase().includes(searchLower)) ||
        (rec.remarks && rec.remarks.toLowerCase().includes(searchLower)) ||
        (rec.campusSite && rec.campusSite.toLowerCase().includes(searchLower));
      return matchesMonth && matchesYear && matchesSearch;
    });
  }, [records, selectedMonth, selectedYear, searchTerm]);

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
            Monthly Accomplishment Report (MAR)
          </div>
          <div style={{ fontSize: '10pt', color: '#333', marginTop: '3px' }}>
            Coverage Period: <b>{selectedMonth === 'All Months' ? `Annual Calendar (${selectedYear})` : `${selectedMonth} ${selectedYear}`}</b>
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
          <h1 style={{ margin: '0 0 6px', fontSize: '24px' }}>Accumulated MAR Logs</h1>
          <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
            {safeDeptName} &mdash; Official monthly compilation of verified daily accomplishment reports for <b>{employeeName}</b>
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

      {/* Filter & Search Bar (Hidden when printing) */}
      <div className="card no-print" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div className="flex-between" style={{ gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Filter by Month
              </label>
              <select
                className="form-control"
                style={{ minWidth: '150px', padding: '6px 12px', fontSize: '13.5px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Year
              </label>
              <select
                className="form-control"
                style={{ minWidth: '100px', padding: '6px 12px', fontSize: '13.5px' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '240px', maxWidth: '340px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
              Search Logs
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search task, quantity, remarks..."
                style={{ padding: '6px 12px 6px 32px', fontSize: '13.5px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ink-400)',
                    padding: '2px',
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
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
              {selectedMonth === 'All Months' ? `Accomplishment Roster (${selectedYear})` : `${selectedMonth} ${selectedYear} Task Logs`}
            </div>
            <span className="muted" style={{ fontSize: '12.5px' }}>
              Showing {filteredRecords.length} of {records.length} logged task accomplishment records
            </span>
          </div>

          {onNavigate && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onNavigate('daily_report')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <PlusCircle size={14} />
              <span>Log Daily Accomplishment</span>
            </button>
          )}
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
                      <span>Loading accumulated monthly accomplishment reports...</span>
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <FileText size={32} color="#94a3b8" />
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink-800)' }}>
                        {records.length === 0
                          ? 'No Daily Accomplishment Reports Logged'
                          : 'No Records Matched Selected Month or Query'}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--ink-500)', maxWidth: '420px', lineHeight: 1.5 }}>
                        {records.length === 0
                          ? 'Accomplishment entries submitted through the Daily Accomplishment Reporting module will automatically compile here in real time.'
                          : `Try changing your month filter from "${selectedMonth}" or clearing your search term.`}
                      </div>
                      {records.length === 0 && onNavigate && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onNavigate('daily_report')}
                          style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                          <PlusCircle size={14} />
                          <span>Submit Today's Accomplishment</span>
                        </button>
                      )}
                    </div>
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
              Period: <b>{selectedMonth} {selectedYear}</b>
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
