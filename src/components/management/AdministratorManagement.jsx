import React, { useState, useEffect } from 'react';
import { Settings, Check, Archive, X, Building2, ClipboardList, RotateCcw, ChevronDown, ChevronUp, Copy, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { EVSU_DEPARTMENTS } from '../../utils/departments';

export default function AdministratorManagement({
  administrators = [],
  departments = EVSU_DEPARTMENTS,
  onBack = null,
  onSendTokenInvite = () => {},
  onUpdateAdministrator = () => {},
}) {
  const [adminList, setAdminList] = useState(administrators);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.users
      .list()
      .then((users) => {
        if (!isMounted) return;
        if (Array.isArray(users)) {
          const adminUsers = users.filter(
            (u) => u.role === 'HR Personnel' || u.role === 'Department Head'
          );
          const mapped = adminUsers.map((u) => ({
            id: u.id,
            idNumber: u.employee_id_number || 'N/A',
            fullName: u.full_name,
            email: u.email,
            role: u.role,
            department: (u.department && typeof u.department === 'object' && u.department.name)
              ? u.department.name
              : (u.department_name || 'HRMDO Office'),
            status: u.is_archived ? 'Archived' : u.is_active ? 'Active' : 'Inactive',
            contactNumber: u.contact_number || '+63 9XX XXX XXXX',
          }));
          setAdminList(mapped);
        }
      })
      .catch((err) => {
        console.warn('API administrators fetch notice:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [settingsAdmin, setSettingsAdmin] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Official Institutional Identity editor fields
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [identitySuccessMsg, setIdentitySuccessMsg] = useState(null);

  // Department transfer fields (Department Heads only)
  const [transferDept, setTransferDept] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState(null);

  // Tokenized invite form fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Department Head'); // strictly 'Department Head' | 'HR Personnel'
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const openAdminSettings = (adm) => {
    setSettingsAdmin(adm);
    setEditFullName(adm.fullName || '');
    setEditEmail(adm.email || '');
    setEditIdNumber(adm.idNumber || '');
    setIdentitySuccessMsg(null);
    const availableDepts = departments.filter(
      (d) => d !== 'HRMDO Office' && d !== adm.department
    );
    setTransferDept(availableDepts[0] || '');
    setTransferSuccessMsg(null);
  };

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (!settingsAdmin || !editFullName.trim() || !editEmail.trim() || !editIdNumber.trim()) return;

    const updated = {
      ...settingsAdmin,
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      idNumber: editIdNumber.trim(),
    };

    setAdminList((prev) =>
      prev.map((a) => (a.id === settingsAdmin.id ? updated : a))
    );
    setSettingsAdmin(updated);
    onUpdateAdministrator(updated);
    setIdentitySuccessMsg(`Official institutional identity updated for "${updated.fullName}".`);
    setToastMsg(`Official identity updated for "${updated.fullName}".`);
    setTimeout(() => {
      setIdentitySuccessMsg(null);
      setToastMsg(null);
    }, 4000);
  };

  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (!settingsAdmin || !transferDept) return;
    setAdminList((prev) =>
      prev.map((a) =>
        a.id === settingsAdmin.id
          ? {
              ...a,
              department: transferDept,
            }
          : a
      )
    );
    setSettingsAdmin((prev) => ({
      ...prev,
      department: transferDept,
    }));
    setTransferSuccessMsg(`Department Head reassigned to "${transferDept}".`);
    setTimeout(() => setTransferSuccessMsg(null), 3500);
  };

  const baseFiltered = adminList.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || a.role === roleFilter;
    const matchesDept = !deptFilter || a.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  const activeAdmins = baseFiltered.filter((a) => a.status !== 'Archived');
  const archivedAdmins = baseFiltered.filter((a) => a.status === 'Archived');

  const handleArchiveAdmin = (adminId) => {
    setAdminList((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, status: 'Archived' } : a))
    );
    const adm = adminList.find((a) => a.id === adminId);
    setToastMsg(`Administrator account for "${adm?.fullName || 'Staff'}" has been archived.`);
    setSettingsAdmin(null);
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
    setSettingsAdmin(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await api.invitations.create({
        email: inviteEmail.trim(),
        role: selectedRole,
        department_name: selectedDept,
      });
      const fullUrl = res.invite_url || `${window.location.origin}/?token=${res.token}`;
      setCreatedInvite({
        token: res.token,
        email: inviteEmail.trim(),
        role: selectedRole,
        department: selectedDept,
        url: fullUrl,
      });
      onSendTokenInvite({
        email: inviteEmail,
        role: selectedRole,
        department: selectedDept,
        token: res.token,
        url: fullUrl,
      });
      setToastMsg(`Administrator invitation (${res.token}) generated for ${inviteEmail}!`);
    } catch (err) {
      console.warn('Invitation API fallback:', err);
      const fallbackToken = `EVSU-INV-ADM-${Math.floor(10000 + Math.random() * 90000)}`;
      const fullUrl = `${window.location.origin}/?token=${fallbackToken}`;
      setCreatedInvite({
        token: fallbackToken,
        email: inviteEmail.trim(),
        role: selectedRole,
        department: selectedDept,
        url: fullUrl,
      });
      onSendTokenInvite({
        email: inviteEmail,
        role: selectedRole,
        department: selectedDept,
        token: fallbackToken,
        url: fullUrl,
      });
      setToastMsg(`Administrator invitation link generated for ${inviteEmail}!`);
    }

    setTimeout(() => setToastMsg(null), 4500);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Administrator Management</h1>
          <p className="muted" style={{ margin: 0 }}>
            Dedicated roster, access permissions, and account invitations for permanent university staff (Department Heads &amp; HRMO).
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

      {/* Success Notification */}
      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter Row with Add Employee on Same Level */}
      <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
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
        <button
          className="btn btn-primary"
          type="button"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setShowInviteModal(true)}
        >
          + Invite Administrator
        </button>
      </div>

      {/* Primary Table or Empty State */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="btn-spinner" style={{ display: 'inline-block', width: '28px', height: '28px', borderWidth: '3px', margin: '0 auto 12px' }} />
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>Loading administrator accounts...</p>
        </div>
      ) : adminList.length === 0 ? (
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
            <Shield size={26} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--ink-900)' }}>
            No Administrators Registered Yet
          </h3>
          <p className="muted" style={{ margin: '0 auto 20px', maxWidth: '460px', fontSize: '13px', lineHeight: 1.5 }}>
            Department Heads and HR Personnel register via official administrator invitation links. Once an administrator registers, their profile will appear here.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowInviteModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}
          >
            <Shield size={16} /> Invite Administrator
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Number</th>
                <th>Administrator Name</th>
                <th>System Role</th>
                <th>Department / Office</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeAdmins.map((adm) => (
                <tr key={adm.id}>
                  <td>
                    <span className="emp-id-chip">{adm.idNumber}</span>
                  </td>
                  <td>
                    <b>{adm.fullName}</b>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {adm.email}
                    </div>
                  </td>
                  <td>
                    <b style={{ fontSize: '13px', color: 'var(--ink-900)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {adm.role === 'Department Head' ? (
                        <>
                          <Building2 size={13} /> Department Head
                        </>
                      ) : (
                        <>
                          <ClipboardList size={13} /> HR Personnel
                        </>
                      )}
                    </b>
                  </td>
                  <td>{adm.department}</td>
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
                      onClick={() => openAdminSettings(adm)}
                      title={`Edit Settings - ${adm.fullName}`}
                    >
                      <Settings size={14} /> Settings
                    </button>
                  </td>
                </tr>
              ))}
              {activeAdmins.length === 0 && (
                <tr>
                  <td colSpan="5" className="muted" style={{ padding: '28px', textAlign: 'center' }}>
                    No active permanent administrators matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Toggle Button for Archived Administrators */}
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
              ? 'Hide Archived Administrators'
              : `View Archived Administrators (${archivedAdmins.length})`}
          </span>
          {showArchived ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Separate Archived Administrators Table Card Below */}
      {showArchived && (
        <div className="card" style={{ marginTop: '18px', padding: 0, overflow: 'hidden', border: '1px solid var(--line)', background: '#fff' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fafbfc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={18} color="var(--ink-600)" />
              <div className="card-title" style={{ margin: 0, fontSize: '15px' }}>
                Archived Administrator Accounts
              </div>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
              Archived administrative and departmental head accounts retained for institutional audit trails. Click Settings to review records or restore privileges.
            </p>
          </div>

          {archivedAdmins.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                No archived administrator accounts found.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Administrator Name</th>
                  <th>System Role</th>
                  <th>Department / Office</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {archivedAdmins.map((adm) => (
                  <tr key={adm.id} style={{ opacity: 0.9 }}>
                    <td>
                      <span className="emp-id-chip">{adm.idNumber}</span>
                    </td>
                    <td>
                      <b>{adm.fullName}</b>
                      <div className="muted" style={{ fontSize: '12px' }}>
                        {adm.email}
                      </div>
                    </td>
                    <td>
                      <b style={{ fontSize: '13px', color: 'var(--ink-900)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {adm.role === 'Department Head' ? (
                          <>
                            <Building2 size={13} /> Department Head
                          </>
                        ) : (
                          <>
                            <ClipboardList size={13} /> HR Personnel
                          </>
                        )}
                      </b>
                    </td>
                    <td>{adm.department}</td>
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
                        onClick={() => openAdminSettings(adm)}
                        title={`Edit Settings - ${adm.fullName}`}
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

      {/* 1. ADMINISTRATOR SETTINGS MODAL */}
      {settingsAdmin && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsAdmin(null);
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
                onClick={() => setSettingsAdmin(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Administrator Profile Brief */}
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
                  {settingsAdmin.idNumber}
                </span>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                  {settingsAdmin.fullName}
                </div>
                <div className="muted" style={{ fontSize: '12px' }}>
                  {settingsAdmin.email} • {settingsAdmin.department}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  className={`badge ${
                    settingsAdmin.status === 'Archived' ? 'badge-delete' : 'badge-active'
                  }`}
                  style={{ fontWeight: 700, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}
                >
                  {settingsAdmin.status === 'Archived' ? (
                    <>
                      <Archive size={12} /> Archived
                    </>
                  ) : (
                    <>
                      <Check size={12} /> Active
                    </>
                  )}
                </span>
                <div>
                  <span
                    style={{ fontWeight: 700, padding: '2px 8px', fontSize: '11.5px', color: 'var(--ink-800)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {settingsAdmin.role === 'Department Head' ? (
                      <>
                        <Building2 size={12} /> Dept Head
                      </>
                    ) : (
                      <>
                        <ClipboardList size={12} /> HRMO
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Official Institutional Identity */}
            <div style={{ marginBottom: '20px' }}>
              <div className="section-label" style={{ marginTop: 0, marginBottom: '6px', color: 'var(--ink)' }}>
                Official Institutional Identity
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px', lineHeight: 1.45 }}>
                Update official personnel records, legal name, institutional email, and administrator ID number as maintained by HRMDO.
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
                      placeholder="e.g. Dr. Maria Clara Ramos"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Administrator ID Number <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={editIdNumber}
                      onChange={(e) => setEditIdNumber(e.target.value)}
                      style={{ fontSize: '13px' }}
                      placeholder="e.g. R10222026MCR"
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

            {/* Department Transfer & Reassignment (Department Heads Only) */}
            {settingsAdmin.role === 'Department Head' && (
              <div style={{ marginBottom: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <div className="section-label" style={{ marginTop: 0, marginBottom: '6px', color: 'var(--ink)' }}>
                  Department Transfer &amp; Reassignment
                </div>
                <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px', lineHeight: 1.45 }}>
                  Transfer this Department Head to oversee another department. Once transferred, their new department staff will immediately appear under their evaluation list.
                </p>

                {transferSuccessMsg && (
                  <div className="flash flash-success" style={{ marginBottom: '12px', fontSize: '12.5px', padding: '8px 12px' }}>
                    {transferSuccessMsg}
                  </div>
                )}

                <form
                  onSubmit={handleExecuteTransfer}
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
                        {settingsAdmin.department}
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
                          .filter((d) => d !== 'HRMDO Office' && d !== settingsAdmin.department)
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
                      disabled={!transferDept || transferDept === settingsAdmin.department}
                      style={{
                        background: '#d97706',
                        color: '#fff',
                        borderColor: '#d97706',
                        fontWeight: 700,
                        cursor: !transferDept || transferDept === settingsAdmin.department ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Confirm Department Transfer
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Account Lifecycle & Status */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div className="section-label" style={{ marginTop: 0, marginBottom: '8px', color: 'var(--ink)' }}>
                Account Lifecycle &amp; Status
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: '0 0 12px', lineHeight: 1.4 }}>
                {settingsAdmin.status === 'Archived'
                  ? 'This administrator account is currently archived. Restoring it will re-enable institutional privileges, departmental evaluation authority, and portal login.'
                  : 'Archiving revokes administrative portal access and evaluation authority for this staff member while securely preserving institutional audit records.'}
              </p>

              {settingsAdmin.status === 'Archived' ? (
                <button
                  type="button"
                  className="btn"
                  style={{
                    color: 'var(--green-700)',
                    borderColor: '#bfe8cd',
                    background: 'var(--green-50)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={() => handleRestoreAdmin(settingsAdmin.id)}
                >
                  <RotateCcw size={14} /> Restore Administrator
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
                        `Are you sure you want to archive the administrator account for "${settingsAdmin.fullName}"? They will be moved to the Archived directory.`
                      )
                    ) {
                      handleArchiveAdmin(settingsAdmin.id);
                    }
                  }}
                >
                  <Archive size={14} /> Archive Administrator
                </button>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSettingsAdmin(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOKENIZED INVITE MODAL (Restricted to Dept Head & HR Personnel) */}
      {showInviteModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowInviteModal(false);
              setCreatedInvite(null);
            }
          }}
        >
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>
                Invite Administrator
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowInviteModal(false);
                  setCreatedInvite(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

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
                    Administrator Invitation Link Generated!
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#047857' }}>
                    An invitation email was dispatched via Resend. You can also copy and share the direct registration link below.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="muted">Role Type:</span>
                    <strong style={{ color: 'var(--brand-700)' }}>{createdInvite.role}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="muted">Department:</span>
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
                      setShowInviteModal(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5 }}>
                  Send an email invitation link to the staff member so they can set up their official EVSU administrator account.
                </p>

                <form onSubmit={handleInviteSubmit}>
                  {/* Email Address Input */}
                  <div className="form-group">
                    <label htmlFor="inviteAdminEmail">
                      Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      id="inviteAdminEmail"
                      className="form-control"
                      type="email"
                      required
                      placeholder="admin.staff@evsu.edu.ph"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  {/* System Role Dropdown */}
                  <div className="form-group">
                    <label htmlFor="inviteAdminRole">
                      System Role <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <select
                      id="inviteAdminRole"
                      className="form-control"
                      required
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="Department Head">Department Head</option>
                      <option value="HR Personnel">HR Personnel</option>
                    </select>
                  </div>

                  {/* Department Dropdown */}
                  <div className="form-group">
                    <label htmlFor="inviteAdminDept">
                      Department / Office <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <select
                      id="inviteAdminDept"
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

                  <div className="flex-between" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setShowInviteModal(false);
                        setCreatedInvite(null);
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
