import React, { useState } from 'react';

export default function MonthlyReport({
  employeeName = 'Jorge Mikhael Gubantes',
  department = 'Computer Studies Department',
  initialRecords = [
    {
      id: 1,
      dateSubmitted: 'Oct 17, 2026, 4:45 PM',
      month: 'October',
      year: '2026',
      jobDescription: 'Conducted computer laboratory hardware inspection and terminal check',
      workAccomplished: 'Tested and verified 24 lab PCs in Room 304; updated anti-virus and security definitions.',
      quantity: '24 units',
      remarks: 'All workstations operational without downtime.',
      photoEvidenceUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 2,
      dateSubmitted: 'Oct 16, 2026, 4:30 PM',
      month: 'October',
      year: '2026',
      jobDescription: 'Assisted students with enrollment queries and clearance routing',
      workAccomplished: 'Validated 35 student clearance documents and encoded status into academic registry.',
      quantity: '35 documents',
      remarks: 'Completed within designated operational window.',
      photoEvidenceUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 3,
      dateSubmitted: 'Oct 15, 2026, 4:50 PM',
      month: 'October',
      year: '2026',
      jobDescription: 'Prepared conference room and multimedia equipment for academic meeting',
      workAccomplished: 'Set up audio-visual projectors, sound system, and verified live stream connectivity.',
      quantity: '1 hall',
      remarks: 'Meeting executed smoothly.',
      photoEvidenceUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 4,
      dateSubmitted: 'Oct 14, 2026, 4:35 PM',
      month: 'October',
      year: '2026',
      jobDescription: 'Diagnosed and resolved network connectivity issues on lab PCs',
      workAccomplished: 'Re-crimped RJ45 network cables and reconfigured IP addresses for 8 terminals.',
      quantity: '8 ports',
      remarks: 'Full Gigabit connectivity restored.',
      photoEvidenceUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 5,
      dateSubmitted: 'Oct 13, 2026, 4:40 PM',
      month: 'October',
      year: '2026',
      jobDescription: 'Organized departmental filing system and digitized physical records',
      workAccomplished: 'Scanned, indexed, and cataloged 50 archived faculty clearance forms.',
      quantity: '50 files',
      remarks: 'Digital copies uploaded to secure archive.',
      photoEvidenceUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 6,
      dateSubmitted: 'Sep 29, 2026, 4:45 PM',
      month: 'September',
      year: '2026',
      jobDescription: 'Conducted computer laboratory hardware inspection and terminal check',
      workAccomplished: 'Completed monthly preventive hardware diagnostics on 24 terminals.',
      quantity: '24 units',
      remarks: 'All peripherals checked.',
      photoEvidenceUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=60',
    },
  ],
}) {
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const months = [
    'All Months',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Filtering records by Month / Year / Search (FR-04, UC-13 step 9)
  const filteredRecords = initialRecords.filter((rec) => {
    const matchesMonth = selectedMonth === 'All Months' || rec.month === selectedMonth;
    const matchesYear = rec.year === selectedYear;
    const matchesSearch =
      rec.jobDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.workAccomplished.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.remarks && rec.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMonth && matchesYear && matchesSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px' }}>Compiled Monthly Accomplishment Report (MAR)</h1>
        <p className="muted" style={{ margin: 0 }}>
          {department} — Paginated compilation of daily verified DAR task entries for {employeeName} (FR-04).
        </p>
      </div>

      {/* FILTER BAR (FR-04, UC-13 step 9) */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div className="flex-between" style={{ gap: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: '4px' }}>
                FILTER BY MONTH (FR-04)
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
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: '4px' }}>
                YEAR
              </label>
              <select
                className="form-control"
                style={{ minWidth: '100px', padding: '6px 12px', fontSize: '13.5px' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, maxWidth: '320px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: '4px' }}>
              SEARCH ACCOMPLISHMENTS
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Filter tasks, outputs, keywords..."
              style={{ padding: '6px 12px', fontSize: '13.5px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* FULL-WIDTH PAGINATED COMPILED MAR TABLE (FR-04) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="card-title" style={{ margin: 0 }}>
            {selectedMonth === 'All Months' ? `All Accomplishment Logs (${selectedYear})` : `${selectedMonth} ${selectedYear} Accomplishment Roster`}
          </div>
          <span className="muted" style={{ fontSize: '12.5px' }}>
            Showing {filteredRecords.length} verified daily logs
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Date &amp; Time</th>
              <th style={{ width: '25%' }}>Job Description / Task</th>
              <th style={{ width: '30%' }}>Specific Work Accomplished</th>
              <th style={{ width: '10%' }}>Quantity</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Photo Evidence</th>
              <th style={{ width: '10%' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontSize: '13px' }}>
                    <b>{row.dateSubmitted.split(',')[0]}</b>
                    <div className="muted" style={{ fontSize: '11.5px' }}>{row.dateSubmitted.split(',')[1]}</div>
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
                        onClick={() => setPreviewPhoto(row.photoEvidenceUrl)}
                        title="Click to view full photo proof"
                      >
                        <img
                          src={row.photoEvidenceUrl}
                          alt="Evidence Thumbnail"
                          style={{
                            width: '44px',
                            height: '44px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                          }}
                        />
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
                    {row.remarks || '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--ink-500)' }}>
                  No Daily Accomplishment Reports logged for {selectedMonth} {selectedYear}.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Table Footer with Pagination Controls (FR-04) */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', background: '#fafbfc' }}>
          <div className="flex-between">
            <span className="muted" style={{ fontSize: '12.5px' }}>
              Showing {filteredRecords.length} of {initialRecords.length} records
            </span>
            <div className="pagination" style={{ margin: 0 }}>
              <button type="button" className="page-btn active">1</button>
              <button type="button" className="page-btn" disabled>Next →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Evidence Modal Popup */}
      {previewPhoto && (
        <div className="modal-backdrop" style={{ display: 'flex' }} onClick={() => setPreviewPhoto(null)}>
          <div className="modal-card" style={{ maxWidth: '580px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>📷 Verified DAR Task Photo Evidence</div>
              <button type="button" className="modal-close" onClick={() => setPreviewPhoto(null)}>×</button>
            </div>
            <div style={{ marginTop: '12px' }}>
              <img
                src={previewPhoto}
                alt="Full Evidence"
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
            <div className="muted" style={{ fontSize: '12px', marginTop: '10px' }}>
              Geotagged timestamp verified on EVSU-Ormoc campus premises.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
