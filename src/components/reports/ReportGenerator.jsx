import React, { useState } from 'react';

export default function ReportGenerator({
  departments = [
    'Computer Studies Department',
    'Technology Department',
    'Engineering Department',
    'Education Department',
    'Library Office',
    'Maintenance/Janitorial (MESO) Office',
  ],
  previouslyGenerated = [
    {
      id: 1,
      title: '1st Sem 2026-2027 Executive Evaluation Summary',
      compiledDate: 'Oct 17, 2026, 2:40 PM',
      format: 'PDF (2.4 MB)',
      status: 'Ready for Signature',
    },
  ],
  onGenerateReport = () => {},
  onBack = null,
}) {
  const [semester, setSemester] = useState('First Semester (2026-2027)');
  const [department, setDepartment] = useState('All Departments');
  const [format, setFormat] = useState('PDF');
  const [includeSupervisorScores, setIncludeSupervisorScores] = useState(true);
  const [includePeerScores, setIncludePeerScores] = useState(true);
  const [includeHrmoScores, setIncludeHrmoScores] = useState(true);
  const [includeQualitativeRemarks, setIncludeQualitativeRemarks] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateReport({
      semester,
      department,
      format,
      includeSupervisorScores,
      includePeerScores,
      includeHrmoScores,
      includeQualitativeRemarks,
    });
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Performance Report Generator (US-07)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Compile 50/20/30 scores, qualitative supervisor feedback, and official recommendations into printable executive summaries.
          </p>
        </div>
        {onBack && (
          <button className="btn btn-sm" type="button" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Previously Generated Executive Reports</div>
        <table className="data-table" style={{ marginBottom: '16px' }}>
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Date Compiled</th>
              <th>Format</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {previouslyGenerated.map((rep) => (
              <tr key={rep.id}>
                <td><b>{rep.title}</b></td>
                <td>{rep.compiledDate}</td>
                <td>{rep.format}</td>
                <td>
                  <span style={{ color: 'var(--green-600)', fontWeight: 700 }}>
                    {rep.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-title">Generate New Executive Evaluation Report</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row form-row-3" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Academic Period</label>
              <select
                className="form-control"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option>First Semester (2026-2027)</option>
                <option>Second Semester (2026-2027)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Department Scope</label>
              <select
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All Departments">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Export Format</label>
              <select
                className="form-control"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="PDF">Printable PDF (Wet-Ink Signature Ready)</option>
                <option value="Excel">Excel / CSV Spreadsheet</option>
              </select>
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 0 }}>Include Score Dimensions &amp; Feedback</div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={includeSupervisorScores}
                onChange={(e) => setIncludeSupervisorScores(e.target.checked)}
              />
              Supervisor 50% Ratings
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={includePeerScores}
                onChange={(e) => setIncludePeerScores(e.target.checked)}
              />
              Anonymous Peer 20% Ratings
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={includeHrmoScores}
                onChange={(e) => setIncludeHrmoScores(e.target.checked)}
              />
              HRMO 30% Compliance Ratings
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={includeQualitativeRemarks}
                onChange={(e) => setIncludeQualitativeRemarks(e.target.checked)}
              />
              Qualitative Strengths / Improvement Remarks
            </label>
          </div>

          <button className="btn btn-primary" type="submit">
            Generate Executive Report
          </button>
        </form>
      </div>
    </div>
  );
}
