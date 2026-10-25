import React, { useState } from 'react';
import { Download, Check, Archive, FileText } from 'lucide-react';
import EmployeeRecordView, { getScoreInterpretationColor } from '../management/EmployeeRecordView';

export default function ReportGenerator({
  employees = [
    {
      id: 1,
      idNumber: 'G10222026JMR',
      fullName: 'Jorge Mikhael Gubantes',
      email: 'jorge.gubantes@evsu.edu.ph',
      department: 'Computer Studies Department',
      college: 'College of Technology',
      cosCategory: 'Administrative',
      dateAppointed: 'Oct 22, 2026',
      contractEndDate: 'Apr 22, 2027',
      totalContracts: 3,
      avgScore: 90.8,
      latestScore: 92.4,
      latestRating: 'Outstanding',
      status: 'Active',
    },
    {
      id: 2,
      idNumber: 'R10222026IJM',
      fullName: 'Ian Joseph Ranoco',
      email: 'ian.ranoco@evsu.edu.ph',
      department: 'Computer Studies Department',
      college: 'College of Technology',
      cosCategory: 'Administrative',
      dateAppointed: 'Oct 22, 2026',
      contractEndDate: 'Apr 22, 2027',
      totalContracts: 3,
      avgScore: 87.2,
      latestScore: 88.6,
      latestRating: 'Very Satisfactory',
      status: 'Active',
    },
    {
      id: 3,
      idNumber: 'P10222026JLP',
      fullName: 'Jeramae Pace',
      email: 'jeramae.pace@evsu.edu.ph',
      department: 'Library Office',
      college: 'Administrative and Support Services',
      cosCategory: 'Administrative',
      dateAppointed: 'Oct 22, 2026',
      contractEndDate: 'Apr 22, 2027',
      totalContracts: 2,
      avgScore: 78.5,
      latestScore: 78.5,
      latestRating: 'Satisfactory',
      status: 'Active',
    },
    {
      id: 4,
      idNumber: 'M10222026CBM',
      fullName: 'Carlos Mendoza',
      email: 'carlos.mendoza@evsu.edu.ph',
      department: 'Maintenance/Janitorial (MESO) Office',
      college: 'Physical Plant and General Services',
      cosCategory: 'Maintenance/Janitorial',
      dateAppointed: 'Oct 22, 2026',
      contractEndDate: 'Apr 22, 2027',
      totalContracts: 4,
      avgScore: 68.0,
      latestScore: 68.0,
      latestRating: 'Needs Improvement',
      status: 'Active',
    },
    {
      id: 5,
      idNumber: 'E10222026ABC',
      fullName: 'Elena Santos',
      email: 'elena.santos@evsu.edu.ph',
      department: 'Engineering Department',
      college: 'College of Engineering',
      cosCategory: 'Administrative',
      dateAppointed: 'Oct 22, 2026',
      contractEndDate: 'Apr 22, 2027',
      totalContracts: 2,
      avgScore: 54.0,
      latestScore: 54.0,
      latestRating: 'Unsatisfactory',
      status: 'Active',
    },
    {
      id: 6,
      idNumber: 'D10222026XYZ',
      fullName: 'Danilo Cruz',
      email: 'danilo.cruz@evsu.edu.ph',
      department: 'Technology Department',
      college: 'College of Technology',
      cosCategory: 'Administrative',
      dateAppointed: 'Oct 22, 2026',
      contractEndDate: 'Apr 22, 2027',
      totalContracts: 3,
      avgScore: 84.0,
      latestScore: 84.0,
      latestRating: 'Very Satisfactory',
      status: 'Active',
    },
  ],
  departments = [
    'Computer Studies Department',
    'Technology Department',
    'Engineering Department',
    'Education Department',
    'Library Office',
    'Maintenance/Janitorial (MESO) Office',
  ],
  onBack = null,
}) {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMsg, setToastMsg] = useState(null);

  // If viewing an employee's historical records
  if (selectedEmp) {
    return (
      <EmployeeRecordView
        employee={selectedEmp}
        onBack={() => setSelectedEmp(null)}
        backLabel="← Back to Executive Reports"
      />
    );
  }

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      emp.fullName.toLowerCase().includes(q) ||
      emp.idNumber.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesCategory =
      selectedCategory === 'All' ||
      (selectedCategory === 'Maintenance/Janitorial'
        ? (emp.cosCategory || '').toLowerCase().includes('maintenance') || (emp.cosCategory || '').toLowerCase().includes('janitorial')
        : emp.cosCategory === selectedCategory);

    return matchesSearch && matchesDept && matchesCategory;
  });

  const handleExportRosterCsv = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Institutional Email',
      'Department',
      'College',
      'COS Category',
      'Total Contracts',
      'Avg Score',
      'Latest Score',
      'Adjectival Rating',
      'Status',
    ];

    const rows = filteredEmployees.map((emp) => [
      `"${emp.idNumber}"`,
      `"${emp.fullName}"`,
      `"${emp.email}"`,
      `"${emp.department}"`,
      `"${emp.college || ''}"`,
      `"${emp.cosCategory}"`,
      emp.totalContracts || 1,
      emp.avgScore !== undefined && emp.avgScore !== null ? Number(emp.avgScore).toFixed(1) : 'N/A',
      emp.latestScore || 'N/A',
      `"${emp.latestRating || 'Unrated'}"`,
      `"${emp.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EVSU_Executive_Personnel_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg('Executive personnel summary report successfully generated and exported as CSV!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Executive Reports &amp; Personnel Records</h1>
          <p className="muted" style={{ margin: 0 }}>
            Inspect employee historical evaluation dossiers, extract verified MARs, and download official records for institutional reporting.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            onClick={handleExportRosterCsv}
            title="Download CSV report of current personnel records"
          >
            <Download size={14} /> Export Roster (CSV)
          </button>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> <span>{toastMsg}</span>
        </div>
      )}

      {/* Personnel Records Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <div className="flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="card-title" style={{ margin: 0 }}>
                COS Personnel Dossiers &amp; Historical Archives
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                Select an employee to inspect past evaluation cycles, review verified MARs, or download official evaluation dossiers.
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by personnel name or ID number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '13.5px' }}
              />
            </div>

            <div style={{ minWidth: '200px' }}>
              <select
                className="form-control"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ fontSize: '13.5px' }}
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '160px' }}>
              <select
                className="form-control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ fontSize: '13.5px' }}
              >
                <option value="All">All Categories</option>
                <option value="Administrative">Administrative</option>
                <option value="Maintenance/Janitorial">Maintenance/Janitorial</option>
              </select>
            </div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>COS Category</th>
              <th>Total Contracts</th>
              <th>Avg Score</th>
              <th>Latest Score</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Records Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <span className="emp-id-chip">{emp.idNumber}</span>
                </td>
                <td>
                  <b>{emp.fullName}</b>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {emp.email}
                  </div>
                </td>
                <td>{emp.department}</td>
                <td>
                  <span className="badge badge-unassigned">{emp.cosCategory}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink-900)' }}>
                    {emp.totalContracts || 1}
                  </span>
                  <span className="muted" style={{ fontSize: '11.5px', marginLeft: '4px' }}>
                    {(emp.totalContracts || 1) === 1 ? 'Cycle' : 'Cycles'}
                  </span>
                </td>
                <td>
                  {emp.avgScore !== null && emp.avgScore !== undefined ? (
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                        {Number(emp.avgScore).toFixed(1)}
                      </span>
                      <span className="muted" style={{ fontSize: '11px', marginLeft: '3px' }}>
                        / 100
                      </span>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {emp.latestScore !== null && emp.latestScore !== undefined ? (
                    <div>
                      <span
                        className={`score-pill ${
                          getScoreInterpretationColor(emp.latestRating, emp.latestScore).className
                        }`}
                      >
                        {emp.latestScore}
                      </span>
                      <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                        {emp.latestRating || 'Evaluated'}
                      </div>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${
                      emp.status === 'Archived' ? 'badge-delete' : 'badge-active'
                    }`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {emp.status === 'Archived' ? (
                      <>
                        <Archive size={12} /> Archived
                      </>
                    ) : (
                      <>
                        <Check size={12} /> Active
                      </>
                    )}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => setSelectedEmp(emp)}
                    title={`View and extract records for ${emp.fullName}`}
                  >
                    <FileText size={14} /> View Records
                  </button>
                </td>
              </tr>
            ))}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan="9" className="muted" style={{ padding: '28px', textAlign: 'center' }}>
                  No personnel matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
