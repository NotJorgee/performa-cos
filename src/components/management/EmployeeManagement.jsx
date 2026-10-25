import React, { useState } from 'react';
import { generateEvsuEmployeeId } from '../../utils/idGenerator';

export default function EmployeeManagement({
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
      latestScore: 92,
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
      latestScore: 86,
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
      latestScore: null,
      latestRating: 'Unrated',
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
      latestScore: 88,
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
  onSelectEmployee = () => {},
  onAddEmployee = () => {},
  onSendTokenInvite = () => {},
  onBack = null,
}) {
  const [employeeList, setEmployeeList] = useState(employees);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Archived'
  const [deptFilter, setDeptFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [settingsEmp, setSettingsEmp] = useState(null);
  const [modalMode, setModalMode] = useState('invite'); // 'invite' | 'manual'
  const [toastMsg, setToastMsg] = useState(null);

  // Department Transfer in Account Settings modal (HR Administrative Action)
  const [transferDept, setTransferDept] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

  // New employee state (manual mode)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  const [dateAppointed, setDateAppointed] = useState('');

  // Token invite state (UC-07)
  const [inviteEmail, setInviteEmail] = useState('');

  // Auto-category mapping: Every department EXCEPT maintenance is Administrative
  const isMaintenanceDept = (dept) => {
    if (!dept) return false;
    const lower = dept.toLowerCase();
    return lower.includes('maintenance') || lower.includes('janitorial') || lower.includes('meso');
  };

  const getComputedCategory = (dept) => {
    return isMaintenanceDept(dept) ? 'Maintenance/Janitorial' : 'Administrative';
  };

  // Contract length is strictly 6 months from appointed date (SRS Section 2.1)
  const calculateContractEndDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month + 6, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 6);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }
    return dateStr;
  };

  const filtered = employeeList.filter((e) => {
    const matchesSearch =
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || e.department === deptFilter;
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Archived'
        ? e.status === 'Archived'
        : e.status !== 'Archived';
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleArchiveEmployee = (empId) => {
    setEmployeeList((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, status: 'Archived' } : e))
    );
    const emp = employeeList.find((e) => e.id === empId);
    setToastMsg(`Personnel record for "${emp?.fullName || 'Employee'}" has been archived.`);
    setSettingsEmp((prev) => (prev && prev.id === empId ? { ...prev, status: 'Archived' } : prev));
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleRestoreEmployee = (empId) => {
    setEmployeeList((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, status: 'Active' } : e))
    );
    const emp = employeeList.find((e) => e.id === empId);
    setToastMsg(`Personnel record for "${emp?.fullName || 'Employee'}" has been restored to Active status.`);
    setSettingsEmp((prev) => (prev && prev.id === empId ? { ...prev, status: 'Active' } : prev));
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleOpenSettings = (emp) => {
    setSettingsEmp(emp);
    const availableDepts = departments.filter((d) => d !== emp.department);
    setTransferDept(availableDepts[0] || departments[0] || '');
    setTransferSuccessMsg('');
  };

  const handleTransferDepartment = (e) => {
    e.preventDefault();
    if (!settingsEmp || !transferDept || transferDept === settingsEmp.department) return;

    const prevDept = settingsEmp.department;
    const newDept = transferDept;
    const newCategory = getComputedCategory(newDept);
    const newCollege = isMaintenanceDept(newDept)
      ? 'Physical Plant and General Services'
      : 'Administrative and Support Services';

    setEmployeeList((prev) =>
      prev.map((emp) =>
        emp.id === settingsEmp.id
          ? {
              ...emp,
              department: newDept,
              college: newCollege,
              cosCategory: newCategory,
            }
          : emp
      )
    );

    setSettingsEmp((prev) =>
      prev
        ? {
            ...prev,
            department: newDept,
            college: newCollege,
            cosCategory: newCategory,
          }
        : null
    );

    const remainingDepts = departments.filter((d) => d !== newDept);
    setTransferDept(remainingDepts[0] || '');

    const msg = `✓ Department transfer executed: "${settingsEmp.fullName}" transferred from ${prevDept} to ${newDept}.`;
    setTransferSuccessMsg(msg);
    setToastMsg(msg);
    setTimeout(() => {
      setTransferSuccessMsg('');
      setToastMsg(null);
    }, 5000);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const assignedCategory = getComputedCategory(selectedDept);
    const computedEndDate = calculateContractEndDate(dateAppointed);
    const existingIds = employeeList.map((emp) => emp.idNumber).filter(Boolean);
    const generatedIdNumber = generateEvsuEmployeeId(fullName, dateAppointed || new Date(), existingIds);

    const newEmployee = {
      id: Date.now(),
      idNumber: generatedIdNumber,
      fullName,
      email,
      department: selectedDept,
      college: isMaintenanceDept(selectedDept)
        ? 'Physical Plant and General Services'
        : 'Administrative and Support Services',
      cosCategory: assignedCategory,
      dateAppointed: formatDisplayDate(dateAppointed),
      contractEndDate: computedEndDate,
      latestScore: null,
      latestRating: 'Unrated',
      status: 'Active',
    };

    setEmployeeList([newEmployee, ...employeeList]);
    onAddEmployee(newEmployee);
    setShowAddModal(false);
    setModalMode('invite');
    setFullName('');
    setEmail('');
    setPassword('');
    setDateAppointed('');
    setToastMsg(`COS Personnel "${fullName}" successfully added to ${selectedDept}!`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    onSendTokenInvite({ email: inviteEmail, department: selectedDept });
    setShowAddModal(false);
    setToastMsg(`Tokenized sign-up URL dispatched to ${inviteEmail}! Token valid for 72 hours.`);
    setInviteEmail('');
    setTimeout(() => setToastMsg(null), 4500);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Employee Management</h1>
          <p className="muted" style={{ margin: 0 }}>
            Personnel directory, appraisal setup, and tokenized invitations for EVSU Contract of Service staff.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setShowAddModal(true);
              setModalMode('invite');
            }}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Filter Row */}
      <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          className="form-control"
          type="text"
          placeholder="Search by name, email, or EVSU ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 2 }}
        />
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="All">All Statuses ({employeeList.length})</option>
          <option value="Active">Active ({employeeList.filter((e) => e.status !== 'Archived').length})</option>
          <option value="Archived">Archived ({employeeList.filter((e) => e.status === 'Archived').length})</option>
        </select>
        <select
          className="form-control"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ flex: 1.2 }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
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
              <th>Created</th>
              <th>Contract End</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
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
                  <span style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
                    {emp.dateAppointed || 'Oct 22, 2026'}
                  </span>
                </td>
                <td>{emp.contractEndDate}</td>
                <td>
                  <span
                    className={`badge ${
                      emp.status === 'Archived' ? 'badge-delete' : 'badge-active'
                    }`}
                  >
                    {emp.status === 'Archived' ? '📦 Archived' : '✓ Active'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-sm"
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenSettings(emp)}
                    title={`Account Settings - ${emp.fullName}`}
                  >
                    ⚙️ Settings
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="muted" style={{ padding: '24px', textAlign: 'center' }}>
                  No personnel matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal (Tokenized Sign-Up default with nested Manual Add option) */}
      {showAddModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setModalMode('invite');
            }
          }}
        >
          <div className="modal-card" style={{ maxWidth: modalMode === 'manual' ? '540px' : '480px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>
                {modalMode === 'invite' ? 'Add Employee' : 'Add COS Employee Manually'}
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setModalMode('invite');
                }}
              >
                ✕
              </button>
            </div>

            {modalMode === 'invite' ? (
              /* TOKENIZED SIGN-UP (Default Add Employee - UC-07) */
              <div>
                <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5 }}>
                  Dispatches a secure, single-use registration URL to the new hire. Upon registration, the system autonomously generates their official EVSU Employee ID and invalidates the token.
                </p>

                <form onSubmit={handleInviteSubmit}>
                  <div className="form-group">
                    <label>
                      New Hire Institutional Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="email"
                      required
                      placeholder="newhire@evsu.edu.ph"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Department</label>
                    <select
                      className="form-control"
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--ink-500)' }}>
                      COS Category:{' '}
                      <span className="badge badge-unassigned" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {getComputedCategory(selectedDept)}
                      </span>{' '}
                      <span className="muted">(Auto-assigned based on department)</span>
                    </div>
                  </div>

                  {/* Button to access Manual Add Employee */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed var(--line)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '18px',
                      marginTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-800)' }}>
                        Registering an offline employee?
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>
                        Directly input employee details and set temporary password.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setModalMode('manual')}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      📝 Add Manually
                    </button>
                  </div>

                  <div className="flex-between" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setShowAddModal(false);
                        setModalMode('invite');
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Send Registration Invite
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* MANUAL ADD EMPLOYEE (Accessed via nested button) */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                    Manually encode employee information for staff without online access.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setModalMode('invite')}
                  >
                    ← Back to Invite
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit}>
                  <div className="form-group">
                    <label>
                      Full Name <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
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
                    <label>
                      Institutional Email <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
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
                    <label>
                      Temporary Password <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
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

                  {/* Department with Auto-Assigned Category (COS Category selection removed) */}
                  <div className="form-group">
                    <label>
                      Department <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        color: 'var(--ink-500)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>COS Category:</span>
                      <span className="badge badge-unassigned" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {getComputedCategory(selectedDept)}
                      </span>
                      <span className="muted">(Auto-assigned based on department)</span>
                    </div>
                  </div>

                  {/* Date Appointed with Auto-Calculated 6-Month Contract Expiry (Contract End Date input removed) */}
                  <div className="form-group">
                    <label>
                      Date Appointed <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="date"
                      required
                      value={dateAppointed}
                      onChange={(e) => setDateAppointed(e.target.value)}
                    />
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--ink-500)' }}>
                      {dateAppointed ? (
                        <span>
                          Contract End Date:{' '}
                          <b style={{ color: 'var(--brand-700)' }}>{calculateContractEndDate(dateAppointed)}</b>{' '}
                          (Strict 6-month contract cycle from appointed date)
                        </span>
                      ) : (
                        <span className="muted">Contract end date is automatically set to 6 months from the date appointed.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-between" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setShowAddModal(false);
                        setModalMode('invite');
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Personnel Record
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Account Settings Modal */}
      {settingsEmp && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚙️ Account Settings</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSettingsEmp(null)}
              >
                ✕
              </button>
            </div>

            {/* Profile Brief */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span className="emp-id-chip" style={{ marginBottom: '4px', display: 'inline-block' }}>
                  {settingsEmp.idNumber}
                </span>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                  {settingsEmp.fullName}
                </div>
                <div className="muted" style={{ fontSize: '12px' }}>
                  {settingsEmp.email} • {settingsEmp.department}
                </div>
              </div>
              <div>
                <span
                  className={`badge ${
                    settingsEmp.status === 'Archived' ? 'badge-delete' : 'badge-active'
                  }`}
                  style={{ fontWeight: 700, padding: '4px 10px' }}
                >
                  {settingsEmp.status === 'Archived' ? '📦 Archived' : '✓ Active'}
                </span>
              </div>
            </div>

            {/* Section 1: Department Transfer & Reassignment (HR Administrative Action) */}
            <div style={{ marginBottom: '20px' }}>
              <div className="section-label" style={{ marginTop: 0, marginBottom: '6px', color: 'var(--ink)' }}>
                Department Transfer &amp; Reassignment
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px', lineHeight: 1.45 }}>
                Reassign this COS employee to another university department. As department transfers are an HR-level administrative prerogative, executing this transfer immediately updates their department assignment, college, and evaluation routing.
              </p>

              {transferSuccessMsg && (
                <div className="flash flash-success" style={{ marginBottom: '12px', fontSize: '12.5px', padding: '8px 12px' }}>
                  {transferSuccessMsg}
                </div>
              )}

              <form
                onSubmit={handleTransferDepartment}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="muted" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Current Department
                    </label>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', padding: '6px 0' }}>
                      {settingsEmp.department}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settingsTransferDeptSelect" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Target Department <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <select
                      id="settingsTransferDeptSelect"
                      className="form-control"
                      style={{ fontSize: '13px', padding: '6px 10px' }}
                      value={transferDept}
                      onChange={(e) => setTransferDept(e.target.value)}
                    >
                      {departments
                        .filter((d) => d !== settingsEmp.department)
                        .map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-sm"
                    disabled={!transferDept || transferDept === settingsEmp.department}
                    style={{
                      background: '#d97706',
                      color: '#fff',
                      borderColor: '#d97706',
                      fontWeight: 700,
                      cursor: !transferDept || transferDept === settingsEmp.department ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ⇄ Execute Department Transfer
                  </button>
                </div>
              </form>
            </div>

            {/* Section 2: Account Lifecycle & Status */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div className="section-label" style={{ marginTop: 0, marginBottom: '8px', color: 'var(--ink)' }}>
                Account Lifecycle &amp; Status
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px' }}>
                {settingsEmp.status === 'Archived'
                  ? 'This account is currently archived. Restoring it will re-enable portal access and restore them to active evaluation cycles.'
                  : 'Archiving disables active portal access for this employee and hides them from active evaluation cycles, while securely preserving all historical MARs and evaluation records.'}
              </p>
              {settingsEmp.status === 'Archived' ? (
                <button
                  type="button"
                  className="btn"
                  style={{
                    color: 'var(--green-700)',
                    borderColor: '#bfe8cd',
                    background: 'var(--green-50)',
                    fontWeight: 700,
                  }}
                  onClick={() => handleRestoreEmployee(settingsEmp.id)}
                >
                  ↩ Restore Employee
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{
                    color: 'var(--red-600)',
                    borderColor: '#f3c2c2',
                    background: 'var(--red-50)',
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to archive the personnel record for "${settingsEmp.fullName}"? They will be moved to the Archived directory.`
                      )
                    ) {
                      handleArchiveEmployee(settingsEmp.id);
                    }
                  }}
                >
                  📦 Archive Employee
                </button>
              )}
            </div>

            {/* Section 3: Future Administrative Controls (Placeholders) */}
            <div
              style={{
                background: '#fdfdfe',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                  Administrative Controls (Upcoming)
                </span>
                <span className="badge badge-unassigned" style={{ fontSize: '11px' }}>
                  Future Release
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Reset Password Credentials</div>
                    <div className="muted" style={{ fontSize: '11px' }}>Dispatches a 24-hr secure password reset link to institutional email</div>
                  </div>
                  <button type="button" className="btn btn-sm" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    Send Reset Link
                  </button>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Institutional Email Update</div>
                    <div className="muted" style={{ fontSize: '11px' }}>Requires HR Master Administrator identity verification token</div>
                  </div>
                  <button type="button" className="btn btn-sm" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    Edit Email
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSettingsEmp(null)}
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
