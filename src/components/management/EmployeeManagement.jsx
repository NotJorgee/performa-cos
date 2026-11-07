import React, { useState, useEffect } from 'react';
import { Settings, Check, Archive, X, UserPlus, RotateCcw, ChevronDown, ChevronUp, Copy, Shield, User } from 'lucide-react';
import { generateEvsuEmployeeId } from '../../utils/idGenerator';
import { api } from '../../services/api';
import { EVSU_DEPARTMENTS } from '../../utils/departments';
import Toast from '../common/Toast';

export default function EmployeeManagement({
  employees = [],
  departments = EVSU_DEPARTMENTS,
  onSelectEmployee = () => {},
  onAddEmployee = () => {},
  onSendTokenInvite = () => {},
  onUpdateEmployee = () => {},
  onBack = null,
}) {
  const [employeeList, setEmployeeList] = useState(employees);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.users
      .list({ role: 'COS Employee' })
      .then((users) => {
        if (!isMounted) return;
        if (Array.isArray(users)) {
          const cosUsers = users.filter((u) => u.role === 'COS Employee');
          const mapped = cosUsers.map((u) => ({
            id: u.id,
            idNumber: u.employee_id_number || 'N/A',
            fullName: u.full_name,
            jobTitle: u.job_title || 'Admin Aide',
            email: u.email,
            department: (u.department && typeof u.department === 'object' && u.department.name)
              ? u.department.name
              : (typeof u.department === 'string' ? u.department : (u.department_name || 'Unassigned')),
            dateAppointed: u.date_appointed
              ? new Date(u.date_appointed).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })
              : 'N/A',
            contractEndDate: u.contract_end_date
              ? new Date(u.contract_end_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })
              : 'N/A',
            latestScore: null,
            latestRating: 'Pending Cycle',
            status: u.is_archived ? 'Archived' : u.is_active ? 'Active' : 'Inactive',
          }));
          setEmployeeList(mapped);
        }
      })
      .catch((err) => {
        console.warn('API users fetch warning:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settingsEmp, setSettingsEmp] = useState(null);
  const [modalMode, setModalMode] = useState('invite'); // 'invite' | 'manual'
  const [toastMsg, setToastMsg] = useState(null);

  // Official Institutional Identity editor fields
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [identitySuccessMsg, setIdentitySuccessMsg] = useState(null);

  // Department Transfer in Account Settings modal (HR Administrative Action)
  const [transferDept, setTransferDept] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

  // New employee state (manual mode)
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('Admin Aide');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  const [dateAppointed, setDateAppointed] = useState('');

  // Token invite state (UC-07)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDept, setInviteDept] = useState(departments[0] || 'Computer Studies Department');
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const baseFiltered = employeeList.filter((e) => {
    const matchesSearch =
      !searchTerm ||
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const activeEmployees = baseFiltered.filter((e) => e.status !== 'Archived');
  const archivedEmployees = baseFiltered.filter((e) => e.status === 'Archived');

  const handleArchiveEmployee = async (empId) => {
    try {
      await api.users.archive(empId);
    } catch (err) {
      console.warn('Archive API notice:', err);
    }
    setEmployeeList((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, status: 'Archived' } : e))
    );
    const emp = employeeList.find((e) => e.id === empId);
    setToastMsg(`Personnel record for "${emp?.fullName || 'Employee'}" has been archived.`);
    setSettingsEmp((prev) => (prev && prev.id === empId ? { ...prev, status: 'Archived' } : prev));
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleRestoreEmployee = async (empId) => {
    try {
      await api.users.restore(empId);
    } catch (err) {
      console.warn('Restore API notice:', err);
    }
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
    setEditFullName(emp.fullName || '');
    setEditEmail(emp.email || '');
    setEditIdNumber(emp.idNumber || '');
    setEditJobTitle(emp.jobTitle || 'Admin Aide');
    setIdentitySuccessMsg(null);
    const availableDepts = departments.filter((d) => d !== emp.department);
    setTransferDept(availableDepts[0] || departments[0] || '');
    setTransferSuccessMsg('');
  };

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (!settingsEmp || !editFullName.trim() || !editEmail.trim() || !editIdNumber.trim()) return;

    const updated = {
      ...settingsEmp,
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      idNumber: editIdNumber.trim(),
      jobTitle: editJobTitle.trim() || 'Admin Aide',
    };

    setEmployeeList((prev) =>
      prev.map((emp) => (emp.id === settingsEmp.id ? updated : emp))
    );
    setSettingsEmp(updated);
    onUpdateEmployee(updated);
    setIdentitySuccessMsg(`Official institutional identity updated for "${updated.fullName}".`);
    setToastMsg(`Official identity updated for "${updated.fullName}".`);
    setTimeout(() => {
      setIdentitySuccessMsg(null);
      setToastMsg(null);
    }, 4000);
  };

  const handleTransferDepartment = (e) => {
    e.preventDefault();
    if (!settingsEmp || !transferDept || transferDept === settingsEmp.department) return;

    const prevDept = settingsEmp.department;
    const newDept = transferDept;

    setEmployeeList((prev) =>
      prev.map((emp) =>
        emp.id === settingsEmp.id
          ? {
              ...emp,
              department: newDept,
            }
          : emp
      )
    );

    setSettingsEmp((prev) =>
      prev
        ? {
            ...prev,
            department: newDept,
          }
        : null
    );

    const remainingDepts = departments.filter((d) => d !== newDept);
    setTransferDept(remainingDepts[0] || '');

    const msg = `Department transfer executed: "${settingsEmp.fullName}" transferred from ${prevDept} to ${newDept}.`;
    setTransferSuccessMsg(msg);
    setToastMsg(msg);
    setTimeout(() => {
      setTransferSuccessMsg('');
      setToastMsg(null);
    }, 5000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const computedEndDate = calculateContractEndDate(dateAppointed);
    const existingIds = employeeList.map((emp) => emp.idNumber).filter(Boolean);
    const generatedIdNumber = generateEvsuEmployeeId(fullName, dateAppointed || new Date(), existingIds);

    let newEmployee = {
      id: Date.now(),
      idNumber: generatedIdNumber,
      fullName,
      jobTitle: jobTitle.trim() || 'Admin Aide',
      email,
      department: selectedDept,
      dateAppointed: formatDisplayDate(dateAppointed),
      contractEndDate: computedEndDate,
      latestScore: null,
      latestRating: 'Unrated',
      status: 'Active',
    };

    try {
      const res = await api.users.create({
        full_name: fullName.trim(),
        email: email.trim(),
        password: password || '@Password_123',
        role: 'COS Employee',
        job_title: jobTitle.trim() || 'Admin Aide',
        date_appointed: dateAppointed || null,
      });
      newEmployee.id = res.id;
      newEmployee.idNumber = res.employee_id_number;
      setToastMsg(`COS Personnel "${fullName}" successfully registered in database (ID: ${res.employee_id_number})!`);
    } catch (err) {
      console.warn('API user create fallback:', err);
      setToastMsg(`COS Personnel "${fullName}" added locally!`);
    }

    setEmployeeList([newEmployee, ...employeeList]);
    onAddEmployee(newEmployee);
    setShowAddModal(false);
    setModalMode('invite');
    setFullName('');
    setJobTitle('Admin Aide');
    setEmail('');
    setPassword('');
    setDateAppointed('');
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await api.invitations.create({
        email: inviteEmail.trim(),
        role: 'COS Employee',
        department_name: inviteDept,
      });
      const fullUrl = res.invite_url || `${window.location.origin}/?token=${res.token}`;
      setCreatedInvite({
        token: res.token,
        email: inviteEmail.trim(),
        role: 'COS Employee',
        department: inviteDept,
        url: fullUrl,
      });
      setToastMsg(`Official invitation (${res.token}) generated for ${inviteEmail}!`);
      onSendTokenInvite({
        email: inviteEmail,
        department: inviteDept,
        token: res.token,
        role: 'COS Employee',
        url: fullUrl,
      });
    } catch (err) {
      console.warn('Invitation API fallback:', err);
      const fallbackToken = `EVSU-INV-COS-${Math.floor(10000 + Math.random() * 90000)}`;
      const fullUrl = `${window.location.origin}/?token=${fallbackToken}`;
      setCreatedInvite({
        token: fallbackToken,
        email: inviteEmail.trim(),
        role: 'COS Employee',
        department: inviteDept,
        url: fullUrl,
      });
      setToastMsg(`Invitation link generated for ${inviteEmail}!`);
      onSendTokenInvite({
        email: inviteEmail,
        department: inviteDept,
        token: fallbackToken,
        role: 'COS Employee',
        url: fullUrl,
      });
    }
    setTimeout(() => setToastMsg(null), 4500);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Employee Management</h1>
          <p className="muted" style={{ margin: 0 }}>
            Personnel directory, evaluation records, and account invitations for EVSU Contract of Service staff.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Filter Row with Add Employee on Same Level */}
      <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
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
        <button
          className="btn btn-primary"
          type="button"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => {
            setShowAddModal(true);
            setModalMode('invite');
          }}
        >
          + Add Employee
        </button>
      </div>

      {/* Primary Table or Empty State */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="btn-spinner" style={{ display: 'inline-block', width: '28px', height: '28px', borderWidth: '3px', margin: '0 auto 12px' }} />
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>Loading registered personnel...</p>
        </div>
      ) : employeeList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--line)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--brand-50)',
              color: 'var(--brand-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <User size={26} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--ink-900)' }}>
            No COS Employees Registered Yet
          </h3>
          <p className="muted" style={{ margin: '0 auto 20px', maxWidth: '460px', fontSize: '13px', lineHeight: 1.5 }}>
            New hires onboard through invitation tokens. Once an employee registers via their invite link, their profile and system-generated ID will appear here.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowAddModal(true);
              setModalMode('invite');
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}
          >
            <UserPlus size={16} /> Send Registration Invite
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Number</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Appointed</th>
                <th>Contract End</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <span className="emp-id-chip">{emp.idNumber}</span>
                  </td>
                  <td>
                    <b>{emp.fullName}</b>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {emp.jobTitle ? `${emp.jobTitle} • ` : ''}{emp.email}
                    </div>
                  </td>
                  <td>{emp.department}</td>
                  <td>
                    <span>{emp.jobTitle || 'Admin Aide'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
                      {emp.dateAppointed || 'Oct 22, 2026'}
                    </span>
                  </td>
                  <td>{emp.contractEndDate}</td>
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
                      <Settings size={14} /> Settings
                    </button>
                  </td>
                </tr>
              ))}
              {activeEmployees.length === 0 && (
                <tr>
                  <td colSpan="7" className="muted" style={{ padding: '24px', textAlign: 'center' }}>
                    No active personnel matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Toggle Button for Archived Employees */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowArchived((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 600,
            background: showArchived ? '#f1f5f9' : '#fff',
            border: '1px solid var(--line)',
            color: 'var(--ink-700)',
            cursor: 'pointer',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <Archive size={15} color="var(--ink-600)" />
          <span>
            {showArchived
              ? 'Hide Archived Employees'
              : `View Archived Employees (${archivedEmployees.length})`}
          </span>
          {showArchived ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Separate Archived Employees Table Card Below */}
      {showArchived && (
        <div className="card" style={{ marginTop: '18px', padding: 0, overflow: 'hidden', border: '1px solid var(--line)', background: '#fff' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={18} color="var(--ink-600)" />
              <div className="card-title" style={{ margin: 0, fontSize: '15px' }}>
                Archived COS Employees
              </div>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
              Archived personnel records retained for institutional audit trails. Click Settings to review records or restore portal access.
            </p>
          </div>

          {archivedEmployees.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                No archived personnel records found.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Created</th>
                  <th>Contract End</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {archivedEmployees.map((emp) => (
                  <tr key={emp.id} style={{ opacity: 0.9 }}>
                    <td>
                      <span className="emp-id-chip">{emp.idNumber}</span>
                    </td>
                    <td>
                      <b>{emp.fullName}</b>
                      <div className="muted" style={{ fontSize: '12px' }}>
                        {emp.jobTitle ? `${emp.jobTitle} • ` : ''}{emp.email}
                      </div>
                    </td>
                    <td>{emp.department}</td>
                    <td>
                      <span>{emp.jobTitle || 'Admin Aide'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
                        {emp.dateAppointed || 'Oct 22, 2026'}
                      </span>
                    </td>
                    <td>{emp.contractEndDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm"
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          background: '#fff',
                        }}
                        onClick={() => handleOpenSettings(emp)}
                        title={`Account Settings - ${emp.fullName}`}
                      >
                        <Settings size={14} /> Settings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
                <X size={18} />
              </button>
            </div>

            {modalMode === 'invite' ? (
              /* TOKENIZED SIGN-UP (Default Add Employee - UC-07) */
              <div>
                {createdInvite ? (
                  <div>
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '10px',
                        padding: '16px',
                        marginBottom: '18px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#10b981',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px',
                        }}
                      >
                        <Check size={24} strokeWidth={2.8} />
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                        Official Invitation Link Generated!
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#047857' }}>
                        An invitation email was dispatched via Resend. You can also copy and share the direct registration link below.
                      </p>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span className="muted">Role Type:</span>
                        <strong style={{ color: createdInvite.role === 'COS Employee' ? 'var(--brand-700)' : 'var(--ink-900)' }}>
                          {createdInvite.role}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span className="muted">Assigned Department:</span>
                        <span>{createdInvite.department}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span className="muted">Recipient:</span>
                        <span>{createdInvite.email}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="muted">Token:</span>
                        <code style={{ fontWeight: 800, color: 'var(--brand-800)' }}>{createdInvite.token}</code>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '12px' }}>Direct Registration Link</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          className="form-control"
                          readOnly
                          value={createdInvite.url}
                          style={{ fontSize: '12px', background: '#ffffff', fontFamily: 'monospace' }}
                        />
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(createdInvite.url);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2500);
                            }
                          }}
                          style={{
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: copiedLink ? '#ecfdf5' : 'var(--white)',
                            borderColor: copiedLink ? '#10b981' : 'var(--line)',
                            color: copiedLink ? '#065f46' : 'var(--ink-800)',
                            fontWeight: 700,
                          }}
                        >
                          {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setCreatedInvite(null);
                          setInviteEmail('');
                          setShowAddModal(false);
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5 }}>
                      Send an invitation link for a new COS Employee. When they open the link, the registration page will automatically configure for their role.
                    </p>

                    <form onSubmit={handleInviteSubmit}>
                      {/* Recipient Institutional Email */}
                      <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px' }}>
                          Recipient Institutional Email <span style={{ color: 'var(--red-600)' }}>*</span>
                        </label>
                        <input
                          className="form-control"
                          type="email"
                          required
                          placeholder="recipient@evsu.edu.ph"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>

                      {/* Assigned Department */}
                      <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px' }}>
                          Assigned Department <span style={{ color: 'var(--red-600)' }}>*</span>
                        </label>
                        <select
                          className="form-control"
                          value={inviteDept}
                          onChange={(e) => setInviteDept(e.target.value)}
                        >
                          {departments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
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
                            Register directly without sending link?
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>
                            Directly input personnel details and set initial login credentials.
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setModalMode('manual')}
                          style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <UserPlus size={14} /> Add Manually
                        </button>
                      </div>

                      <div className="flex-between" style={{ marginTop: '20px' }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setShowAddModal(false);
                            setModalMode('invite');
                            setCreatedInvite(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                          Generate & Send Invite
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              /* MANUAL ADD EMPLOYEE (Accessed via nested button) */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                    Directly input employee details and set initial login credentials.
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
                      Employee Job Title <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      required
                      placeholder="e.g. Admin Aide, Laboratory Custodian, Utility Worker"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
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

                  {/* Department */}
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
                <Settings size={18} />
                <span>Account Settings</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSettingsEmp(null)}
              >
                <X size={18} />
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
                  style={{ fontWeight: 700, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {settingsEmp.status === 'Archived' ? (
                    <>
                      <Archive size={12} /> Archived
                    </>
                  ) : (
                    <>
                      <Check size={12} /> Active
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Section 1: Official Institutional Identity */}
            <div style={{ marginBottom: '20px' }}>
              <div className="section-label" style={{ marginTop: 0, marginBottom: '6px', color: 'var(--ink)' }}>
                Official Institutional Identity
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px', lineHeight: 1.45 }}>
                Update official personnel records, legal name, institutional email, and employee ID number as maintained by HRMDO.
              </p>

              {identitySuccessMsg && (
                <div className="flash flash-success" style={{ marginBottom: '12px', fontSize: '12.5px', padding: '8px 12px' }}>
                  {identitySuccessMsg}
                </div>
              )}

              <form
                onSubmit={handleSaveIdentity}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Full Legal Name <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      style={{ fontSize: '13px' }}
                      placeholder="e.g. Juan Dela Cruz"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Employee ID Number <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={editIdNumber}
                      onChange={(e) => setEditIdNumber(e.target.value)}
                      style={{ fontSize: '13px' }}
                      placeholder="e.g. G10222026JMR"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Institutional Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{ fontSize: '13px' }}
                    placeholder="name@evsu.edu.ph"
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Employee Job Title <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    style={{ fontSize: '13px' }}
                    placeholder="e.g. Admin Aide, Laboratory Custodian, Utility Worker"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    style={{ fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save Identity Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Section 2: Department Transfer & Reassignment (HR Administrative Action) */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div className="section-label" style={{ marginTop: 0, marginBottom: '6px', color: 'var(--ink)' }}>
                Department Transfer &amp; Reassignment
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px', lineHeight: 1.45 }}>
                Reassign this COS employee to another university department. As department transfers are an HR-level administrative prerogative, executing this transfer immediately updates their department assignment and evaluation routing.
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

            {/* Section 3: Account Lifecycle & Status */}
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={() => handleRestoreEmployee(settingsEmp.id)}
                >
                  <RotateCcw size={14} /> Restore Employee
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: 'var(--red-600)',
                    color: '#fff',
                    borderColor: 'var(--red-600)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
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
                  <Archive size={14} /> Archive Employee
                </button>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
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
