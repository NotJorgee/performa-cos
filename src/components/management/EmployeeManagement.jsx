import React, { useState } from 'react';

export default function EmployeeManagement({
  employees = [
    {
      id: 1,
      idNumber: '2026-00101',
      fullName: 'Jorge Mikhael Gubantes',
      email: 'jorge.gubantes@evsu.edu.ph',
      department: 'Computer Studies Department',
      college: 'College of Technology',
      cosCategory: 'Administrative',
      dateAppointed: 'Oct 01, 2024',
      contractEndDate: 'Dec 31, 2026',
      latestScore: 92,
      latestRating: 'Outstanding',
      status: 'Active',
    },
    {
      id: 2,
      idNumber: '2026-00102',
      fullName: 'Ian Joseph Ranoco',
      email: 'ian.ranoco@evsu.edu.ph',
      department: 'Computer Studies Department',
      college: 'College of Technology',
      cosCategory: 'Administrative',
      dateAppointed: 'Oct 01, 2024',
      contractEndDate: 'Dec 31, 2026',
      latestScore: 86,
      latestRating: 'Very Satisfactory',
      status: 'Active',
    },
    {
      id: 3,
      idNumber: '2026-00103',
      fullName: 'Jeramae Pace',
      email: 'jeramae.pace@evsu.edu.ph',
      department: 'Library Office',
      college: 'Administrative and Support Services',
      cosCategory: 'Administrative',
      dateAppointed: 'Nov 01, 2024',
      contractEndDate: 'Dec 31, 2026',
      latestScore: null,
      latestRating: 'Unrated',
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
  onSelectEmployee = () => {},
  onAddEmployee = () => {},
  onSendTokenInvite = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // New employee state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  const [cosCategory, setCosCategory] = useState('Administrative');
  const [dateAppointed, setDateAppointed] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');

  // Token invite state (UC-07)
  const [inviteEmail, setInviteEmail] = useState('');

  const filtered = employees.filter((e) => {
    const matchesSearch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onAddEmployee({
      fullName,
      email,
      password,
      department: selectedDept,
      cosCategory,
      dateAppointed,
      contractEndDate,
    });
    setShowAddModal(false);
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    onSendTokenInvite({ email: inviteEmail });
    setShowInviteModal(false);
    setInviteEmail('');
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '6px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Employee Management</h1>
          <p className="muted" style={{ margin: 0 }}>
            Personnel directory, appraisal setup, and tokenized invitations for EVSU Contract of Service staff.
          </p>
        </div>
        {/* Out-of-scope SMS button completely discarded; tokenized invite and add employee provided */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn"
            type="button"
            onClick={() => setShowInviteModal(true)}
          >
            ✉ Send Tokenized Sign-Up (UC-07)
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowAddModal(true)}
          >
            + Add Employee
          </button>
        </div>
      </div>

      <div style={{ height: '20px' }}></div>

      {/* Filter Row */}
      <div className="filter-row">
        <input
          className="form-control"
          type="text"
          placeholder="Search by name, email, or EVSU ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-control"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Employees Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>COS Category</th>
              <th>Contract End</th>
              <th>Latest Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id}>
                <td><span className="emp-id-chip">{emp.idNumber}</span></td>
                <td>
                  <b>{emp.fullName}</b>
                  <div className="muted" style={{ fontSize: '12px' }}>{emp.email}</div>
                </td>
                <td>{emp.department}</td>
                <td>
                  <span className="badge badge-unassigned">{emp.cosCategory}</span>
                </td>
                <td>{emp.contractEndDate}</td>
                <td>
                  {emp.latestScore !== null ? (
                    <span className={`score-pill ${emp.latestScore >= 80 ? 'score-good' : emp.latestScore >= 60 ? 'score-mid' : 'score-bad'}`}>
                      {emp.latestScore}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => onSelectEmployee(emp.id)}>
                    View Record
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="muted" style={{ padding: '24px', textAlign: 'center' }}>
                  No personnel matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal (FR-18) */}
      {showAddModal && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>Add COS Employee</div>
              <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Full Name <span style={{ color: 'var(--red-600)' }}>*</span></label>
                <input
                  className="form-control"
                  type="text"
                  required
                  placeholder="e.g. Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Institutional Email <span style={{ color: 'var(--red-600)' }}>*</span></label>
                <input
                  className="form-control"
                  type="email"
                  required
                  placeholder="name@evsu.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Temporary Password <span style={{ color: 'var(--red-600)' }}>*</span></label>
                <input
                  className="form-control"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select
                    className="form-control"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>COS Category</label>
                  <select
                    className="form-control"
                    value={cosCategory}
                    onChange={(e) => setCosCategory(e.target.value)}
                  >
                    <option value="Administrative">COS-Administrative Offices</option>
                    <option value="Maintenance/Janitorial">COS-Maintenance/Janitorial Personnel</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date Appointed</label>
                  <input
                    className="form-control"
                    type="date"
                    value={dateAppointed}
                    onChange={(e) => setDateAppointed(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Contract End Date</label>
                  <input
                    className="form-control"
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Personnel Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tokenized Sign-Up Invite Modal (UC-07) */}
      {showInviteModal && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setShowInviteModal(false); }}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>Dispatch Tokenized Sign-Up Link</div>
              <button type="button" className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px' }}>
              Dispatches a secure, single-use registration URL to the hire. Upon submission, the system
              autonomously generates their official EVSU Employee ID and invalidates the token.
            </p>
            <form onSubmit={handleInviteSubmit}>
              <div className="form-group">
                <label>New Hire Email Address</label>
                <input
                  className="form-control"
                  type="email"
                  required
                  placeholder="newhire@evsu.edu.ph"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex-between">
                <button type="button" className="btn" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Registration Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
