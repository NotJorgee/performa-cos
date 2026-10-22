import React, { useState } from 'react';
import { generateEvsuEmployeeId } from '../../utils/idGenerator';

export default function AdministratorManagement({
  administrators = [
    {
      id: 1,
      idNumber: 'R10222026MCR',
      fullName: 'Dr. Maria Clara Ramos',
      email: 'maria.ramos@evsu.edu.ph',
      role: 'HR Personnel',
      department: 'HRMDO Office',
      status: 'Active',
      contactNumber: '+63 917 112 2334',
    },
    {
      id: 2,
      idNumber: 'D10222026RDR',
      fullName: 'Engr. Roberto Del Rosario',
      email: 'roberto.delrosario@evsu.edu.ph',
      role: 'Department Head',
      department: 'Computer Studies Department',
      status: 'Active',
      contactNumber: '+63 918 223 3445',
    },
    {
      id: 3,
      idNumber: 'S10222026EDS',
      fullName: 'Dr. Eduardo Santos',
      email: 'eduardo.santos@evsu.edu.ph',
      role: 'Department Head',
      department: 'Engineering Department',
      status: 'Active',
      contactNumber: '+63 919 334 4556',
    },
    {
      id: 4,
      idNumber: 'M10222026EPM',
      fullName: 'Prof. Elena Mendoza',
      email: 'elena.mendoza@evsu.edu.ph',
      role: 'Department Head',
      department: 'Technology Department',
      status: 'Active',
      contactNumber: '+63 920 445 5667',
    },
    {
      id: 5,
      idNumber: 'G10222026RGA',
      fullName: 'Atty. Ronald Gomez',
      email: 'ronald.gomez@evsu.edu.ph',
      role: 'HR Personnel',
      department: 'HRMDO Office',
      status: 'Active',
      contactNumber: '+63 921 556 6778',
    },
    {
      id: 6,
      idNumber: 'C10222026AAC',
      fullName: 'Dr. Alicia Cruz',
      email: 'alicia.cruz@evsu.edu.ph',
      role: 'Department Head',
      department: 'Education Department',
      status: 'Active',
      contactNumber: '+63 922 667 7889',
    },
  ],
  departments = [
    'Computer Studies Department',
    'Technology Department',
    'Engineering Department',
    'Education Department',
    'Library Office',
    'HRMDO Office',
  ],
  onBack = null,
  onSendTokenInvite = () => {},
}) {
  const [adminList, setAdminList] = useState(administrators);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Archived'
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Tokenized invite form fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Department Head'); // strictly 'Department Head' | 'HR Personnel'
  const [selectedDept, setSelectedDept] = useState(departments[0]);

  const filtered = adminList.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || a.role === roleFilter;
    const matchesDept = !deptFilter || a.department === deptFilter;
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Archived'
        ? a.status === 'Archived'
        : a.status !== 'Archived';
    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  const handleArchiveAdmin = (adminId) => {
    setAdminList((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, status: 'Archived' } : a))
    );
    const adm = adminList.find((a) => a.id === adminId);
    setToastMsg(`Administrator account for "${adm?.fullName || 'Staff'}" has been archived.`);
    setSelectedAdmin(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleRestoreAdmin = (adminId) => {
    setAdminList((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, status: 'Active' } : a))
    );
    const adm = adminList.find((a) => a.id === adminId);
    setToastMsg(
      `Administrator account for "${adm?.fullName || 'Staff'}" has been restored to Active status.`
    );
    setSelectedAdmin(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    // Generate a placeholder name and official EVSU ID from email username
    const username = inviteEmail.split('@')[0].replace(/[._]/g, ' ');
    const placeholderName = username
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const existingIds = adminList.map((a) => a.idNumber);
    const newId = generateEvsuEmployeeId(placeholderName || 'Admin Staff', new Date(), existingIds);

    const newAdmin = {
      id: Date.now(),
      idNumber: newId,
      fullName: placeholderName || 'Permanent Administrator',
      email: inviteEmail,
      role: selectedRole,
      department: selectedDept,
      status: 'Active',
      contactNumber: '+63 999 000 0000',
    };

    setAdminList([newAdmin, ...adminList]);
    onSendTokenInvite({ email: inviteEmail, role: selectedRole, department: selectedDept });
    setShowInviteModal(false);
    setInviteEmail('');
    setSelectedRole('Department Head');
    setToastMsg(
      `Tokenized administrator sign-up link dispatched to ${inviteEmail} as ${selectedRole}!`
    );
    setTimeout(() => setToastMsg(null), 4500);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Administrator Management</h1>
          <p className="muted" style={{ margin: 0 }}>
            Dedicated roster, access permissions, and tokenized invitations for permanent university staff (Department Heads &amp; HRMO).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
          {/* Keep button name strictly as + Add Employee */}
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowInviteModal(true)}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Success Notification */}
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
          placeholder="Search by name, institutional email, or ID..."
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
          <option value="All">All Statuses ({adminList.length})</option>
          <option value="Active">Active ({adminList.filter((a) => a.status !== 'Archived').length})</option>
          <option value="Archived">Archived ({adminList.filter((a) => a.status === 'Archived').length})</option>
        </select>
        <select
          className="form-control"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">All Roles</option>
          <option value="Department Head">Department Head</option>
          <option value="HR Personnel">HR Personnel</option>
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

      {/* Administrator Roster Table (Appointment Type removed) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Full Name</th>
              <th>System Role</th>
              <th>Department / Office</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((adm) => (
              <tr key={adm.id}>
                <td>
                  <span className="emp-id-chip" style={{ margin: 0 }}>
                    {adm.idNumber}
                  </span>
                </td>
                <td>
                  <b>{adm.fullName}</b>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {adm.email}
                  </div>
                </td>
                <td>
                  <span
                    className={`badge ${
                      adm.role === 'Department Head' ? 'badge-inprogress' : 'badge-dept'
                    }`}
                    style={{
                      fontWeight: 700,
                      padding: '3px 9px',
                      fontSize: '12px',
                    }}
                  >
                    {adm.role === 'Department Head' ? '🏛️ Department Head' : '📋 HR Personnel'}
                  </span>
                </td>
                <td>{adm.department}</td>
                <td>
                  <span
                    className={`badge ${
                      adm.status === 'Archived' ? 'badge-delete' : 'badge-active'
                    }`}
                  >
                    {adm.status === 'Archived' ? '📦 Archived' : '✓ Active'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => setSelectedAdmin(adm)}
                  >
                    View Record
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="muted" style={{ padding: '28px', textAlign: 'center' }}>
                  No permanent administrators matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tokenized Invite Modal (Strictly Restricted to Dept Head & HR Personnel) */}
      {showInviteModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInviteModal(false);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>
                Add Administrator (Tokenized Sign-Up)
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowInviteModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5 }}>
              Dispatches a secure, single-use tokenized sign-up URL to the permanent staff member. Upon completion, their official EVSU Administrator Account is activated.
            </p>

            <form onSubmit={handleInviteSubmit}>
              {/* Email Address Input */}
              <div className="form-group">
                <label>
                  Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <input
                  className="form-control"
                  type="email"
                  required
                  placeholder="admin.staff@evsu.edu.ph"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              {/* System Role Dropdown (Restricted strictly to Dept Head and HR Personnel) */}
              <div className="form-group">
                <label>
                  System Role <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="Department Head">Department Head</option>
                  <option value="HR Personnel">HR Personnel</option>
                </select>
                <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--ink-500)' }}>
                  Institutional access permissions are automatically provisioned based on the chosen role.
                </div>
              </div>

              {/* Assigned Department */}
              <div className="form-group">
                <label>
                  Assigned Department / Office <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  required
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-between" style={{ marginTop: '22px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowInviteModal(false)}
                >
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

      {/* Administrator Record Dossier Modal (Styled like Employee Version, Appointment Type removed) */}
      {selectedAdmin && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAdmin(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>
                Personnel Record Dossier (UC-09)
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedAdmin(null)}
              >
                ✕
              </button>
            </div>

            {/* Administrator Header */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span className="emp-id-chip" style={{ margin: '0 auto 8px', display: 'inline-block' }}>
                {selectedAdmin.idNumber}
              </span>
              <h2 style={{ margin: '6px 0 2px' }}>{selectedAdmin.fullName}</h2>
              <div className="muted" style={{ fontSize: '13px' }}>
                {selectedAdmin.email}
              </div>
              <div style={{ marginTop: '8px' }}>
                <span
                  className={`badge ${
                    selectedAdmin.status === 'Archived' ? 'badge-delete' : 'badge-active'
                  }`}
                  style={{ fontWeight: 700, padding: '4px 10px' }}
                >
                  {selectedAdmin.status === 'Archived'
                    ? '📦 Archived Administrator'
                    : '✓ Active Administrator'}
                </span>
              </div>
            </div>

            {/* Dossier Details Sections */}
            <div
              style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                marginBottom: '20px',
              }}
            >
              <div className="section-label" style={{ marginTop: 0 }}>
                Institutional Assignment
              </div>
              <div className="detail-row">
                <span>System Role:</span>
                <span>
                  <span
                    className={`badge ${
                      selectedAdmin.role === 'Department Head'
                        ? 'badge-inprogress'
                        : 'badge-dept'
                    }`}
                    style={{ fontWeight: 700, padding: '3px 8px', fontSize: '12px' }}
                  >
                    {selectedAdmin.role === 'Department Head'
                      ? '🏛️ Department Head'
                      : '📋 HR Personnel'}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span>Department / Office:</span>
                <span>
                  <b>{selectedAdmin.department}</b>
                </span>
              </div>
              <div className="detail-row">
                <span>Campus Location:</span>
                <span>Eastern Visayas State University Ormoc Campus</span>
              </div>

              <div className="section-label">Administrative Privileges &amp; Scope</div>
              <div className="detail-row">
                <span>Evaluation Authority:</span>
                <span>
                  {selectedAdmin.role === 'Department Head'
                    ? 'Subordinate Performance Appraisal (50%) & Fast-Track Rejection'
                    : 'HR Triad Evaluation (30%), Proxy Scoring & Contract Lifecycle Management'}
                </span>
              </div>
              <div className="detail-row">
                <span>Contact Number:</span>
                <span>{selectedAdmin.contactNumber || '—'}</span>
              </div>
              <div className="detail-row" style={{ borderBottom: 'none' }}>
                <span>Account Security:</span>
                <span>Institutional SSO &amp; MFA Enabled</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex-between" style={{ alignItems: 'center' }}>
              {selectedAdmin.status === 'Archived' ? (
                <button
                  type="button"
                  className="btn"
                  style={{
                    color: 'var(--green-700)',
                    borderColor: '#bfe8cd',
                    background: 'var(--green-50)',
                    fontWeight: 700,
                  }}
                  onClick={() => handleRestoreAdmin(selectedAdmin.id)}
                >
                  ↩ Restore Administrator
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
                        `Are you sure you want to archive the administrator account for "${selectedAdmin.fullName}"? They will be moved to the Archived directory.`
                      )
                    ) {
                      handleArchiveAdmin(selectedAdmin.id);
                    }
                  }}
                >
                  📦 Archive Administrator
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedAdmin(null)}
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
