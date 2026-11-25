import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  X,
  Check,
  Copy,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import { groupDepartmentsByDomain } from '../../utils/departments';
import {
  UNIVERSITY_TITLES,
  getTodayIsoDate,
  formatFullLegalName,
  evaluatePasswordComplexity,
  formatReadableDate,
} from '../../utils/onboardingHelpers';
import PasswordComplexityChecklist from '../common/PasswordComplexityChecklist';

export default function OnboardingUserModal({
  isOpen = false,
  initialRole = 'COS Employee',
  initialDepartmentName = '',
  scope = 'departments', // 'departments' | 'hr_admins'
  departments = [],
  existingEmployeeIds = [],
  existingUsers = [],
  onClose = () => {},
  onToast = () => {},
  onUserCreated = async () => {},
}) {
  const isHrScope = scope === 'hr_admins';

  const [modalMode, setModalMode] = useState('invite'); // 'invite' | 'manual'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(isHrScope ? 'HR Personnel' : initialRole || 'COS Employee');
  const [deptName, setDeptName] = useState(
    isHrScope ? 'HRMDO Office' : initialDepartmentName || departments[0]?.name || 'Computer Studies Department'
  );

  // Invite flow state
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Detect whether the recipient email is already registered in the system
  const matchedExistingUser = useMemo(() => {
    if (!email.trim() || !Array.isArray(existingUsers) || existingUsers.length === 0) return null;
    const clean = email.trim().toLowerCase();
    return existingUsers.find((u) => (u.email || '').toLowerCase() === clean);
  }, [email, existingUsers]);

  // Manual creation state (aligned with TokenizedSignUp)
  const [titlePrefix, setTitlePrefix] = useState('None');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [startingDate, setStartingDate] = useState(getTodayIsoDate());
  const [tempPassword, setTempPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState(null);
  const [createdManualUser, setCreatedManualUser] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Compute default non-HRMDO department fallback for University Departments tab
  const defaultDeptOption = useMemo(() => {
    const nonHrmdo = departments.find((d) => d.name !== 'HRMDO Office');
    return initialDepartmentName || nonHrmdo?.name || departments[0]?.name || 'Computer Studies Department';
  }, [departments, initialDepartmentName]);

  const resetFormState = (nextMode = 'invite') => {
    const today = getTodayIsoDate();
    setModalMode(nextMode);
    setEmail('');
    setRole(isHrScope ? 'HR Personnel' : initialRole || 'COS Employee');
    setDeptName(isHrScope ? 'HRMDO Office' : defaultDeptOption);
    setIsSendingInvite(false);
    setInviteError(null);
    setCreatedInvite(null);
    setCopiedLink(false);
    setTitlePrefix('None');
    setFirstName('');
    setMiddleInitial('');
    setLastName('');
    setStartingDate(today);
    setTempPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSubmittingManual(false);
    setManualError(null);
    setCreatedManualUser(null);
    setCopiedCreds(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetFormState('invite');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialRole, initialDepartmentName, scope]);

  // Enforce strict role and department rules
  const effectiveRole = isHrScope
    ? 'HR Personnel'
    : role === 'HR Personnel'
      ? 'COS Employee'
      : role;
  const isDepartmentLocked = isHrScope || effectiveRole === 'HR Personnel';
  const effectiveDeptName = isDepartmentLocked ? 'HRMDO Office' : deptName;

  // Include both standard grouped EVSU units and any custom departments added via + Add Department
  const groupedDepartmentOptions = useMemo(() => groupDepartmentsByDomain(departments), [departments]);

  if (!isOpen) return null;

  const selectedDeptObj = departments.find((d) => d.name === effectiveDeptName);

  const handleSendInviteSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteError(null);

    if (matchedExistingUser) {
      setInviteError(
        `Personnel account already exists: ${matchedExistingUser.full_name} (${matchedExistingUser.email}) is already registered as an ${matchedExistingUser.is_archived ? 'archived' : 'active'} ${matchedExistingUser.role}.`
      );
      return;
    }

    setIsSendingInvite(true);

    try {
      const res = await api.invitations.create({
        email: email.trim(),
        role: effectiveRole,
        department_id: selectedDeptObj?.id || null,
        department_name: effectiveDeptName,
      });

      const fullUrl = res.invite_url || `${window.location.origin}/?token=${res.token}`;
      setCreatedInvite({
        token: res.token,
        email: email.trim(),
        role: effectiveRole,
        department: effectiveDeptName,
        url: fullUrl,
      });
      onToast(`Official invitation link created for ${email.trim()}!`);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('not authenticated') || msg.toLowerCase().includes('expired token')) {
        setInviteError('Your administrator session has expired or is unauthenticated. Please sign out and log back in to generate invitations.');
      } else {
        setInviteError(msg || 'Failed to generate invitation link. Please check your inputs and try again.');
      }
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleManualCreateSubmit = async (e) => {
    e.preventDefault();
    setManualError(null);

    if (!email.trim()) {
      setManualError('Institutional email address is required.');
      return;
    }

    if (matchedExistingUser) {
      setManualError(
        `Personnel account already exists: ${matchedExistingUser.full_name} (${matchedExistingUser.email}) is already registered as an ${matchedExistingUser.is_archived ? 'archived' : 'active'} ${matchedExistingUser.role}.`
      );
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setManualError('Please enter both First Name and Last Name.');
      return;
    }

    const complexity = evaluatePasswordComplexity(tempPassword);
    if (!complexity.isValid) {
      setManualError(
        'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    if (tempPassword !== confirmPassword) {
      setManualError('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    setIsSubmittingManual(true);
    try {
      const fullLegalName = formatFullLegalName({
        titlePrefix,
        firstName,
        middleInitial,
        lastName,
      });

      const payload = {
        email: email.trim(),
        full_name: fullLegalName,
        first_name: firstName.trim(),
        middle_initial: middleInitial.trim() || null,
        last_name: lastName.trim(),
        title: titlePrefix !== 'None' ? titlePrefix : null,
        role: effectiveRole,
        department_id: selectedDeptObj?.id || null,
        department_name: effectiveDeptName,
        job_title: effectiveRole === 'COS Employee' ? 'COS Staff' : effectiveRole,
        contact_number: '',
        starting_date: startingDate || getTodayIsoDate(),
        date_appointed: startingDate || getTodayIsoDate(),
        contract_start_date: null,
        contract_end_date: null,
        password: tempPassword,
        is_active: true,
        send_welcome_email: true,
      };

      const created = await api.users.create(payload);
      setCreatedManualUser({
        user: created,
        tempPassword,
        departmentName: created?.department?.name || effectiveDeptName,
      });
      onToast(
        `Account created for ${created.full_name} (ID: ${created.employee_id_number}).`
      );
      await onUserCreated();
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('not authenticated') || msg.toLowerCase().includes('expired token')) {
        setManualError('Your administrator session has expired or is unauthenticated. Please sign out and log back in to register personnel.');
      } else {
        setManualError(msg || 'Failed to create user account. Please verify the entered details.');
      }
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!createdInvite?.url) return;
    navigator.clipboard.writeText(createdInvite.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCredentials = () => {
    if (!createdManualUser) return;
    const { user, tempPassword: pwd, departmentName } = createdManualUser;
    const lines = [
      `EVSU PerformaCOS Account Credentials`,
      `Name: ${user.full_name}`,
      `Employee ID: ${user.employee_id_number}`,
      `Role: ${user.role}`,
      `Department: ${departmentName}`,
      `Email: ${user.email}`,
      `Temporary Password: ${pwd}`,
      `Portal URL: ${window.location.origin}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const renderRoleAndDepartmentControls = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '14px',
      }}
    >
      <div className="form-group" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>Account Role</label>
          {isHrScope && (
            <span style={{ fontSize: '10.5px', color: 'var(--brand-700)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Lock size={10} /> Fixed
            </span>
          )}
        </div>
        {isHrScope ? (
          <input
            type="text"
            className="form-control"
            readOnly
            disabled
            value="HR Personnel"
            style={{
              background: '#f8fafc',
              fontWeight: 700,
              color: 'var(--ink-800)',
              cursor: 'not-allowed',
            }}
          />
        ) : (
          <select
            className="form-control"
            value={effectiveRole}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="COS Employee">COS Employee</option>
            <option value="Department Head">Department Head</option>
          </select>
        )}
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>Target Department</label>
          {isDepartmentLocked && (
            <span style={{ fontSize: '10.5px', color: 'var(--brand-700)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Lock size={10} /> Locked
            </span>
          )}
        </div>
        {isDepartmentLocked ? (
          <input
            type="text"
            className="form-control"
            readOnly
            disabled
            value="HRMDO Office"
            style={{
              background: '#f8fafc',
              fontWeight: 700,
              color: 'var(--ink-800)',
              cursor: 'not-allowed',
            }}
          />
        ) : (
          <select
            className="form-control"
            value={effectiveDeptName}
            onChange={(e) => setDeptName(e.target.value)}
          >
            {groupedDepartmentOptions.map((grp) => (
              <optgroup key={grp.key} label={grp.label}>
                {grp.items.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  const modalTitle =
    modalMode === 'invite'
      ? isHrScope
        ? 'Invite HR Administrator'
        : 'Generate Official Registration Invite'
      : isHrScope
        ? 'Create HR Administrator Account Manually'
        : 'Create Personnel Account Manually';

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: modalMode === 'manual' ? '590px' : '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div className="modal-header">
          <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} color="var(--brand-700)" />
            <span>{modalTitle}</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ======================================================= */}
        {/* MODE A: INVITATION TOKEN GENERATION                     */}
        {/* ======================================================= */}
        {modalMode === 'invite' && !createdInvite && (
          <form onSubmit={handleSendInviteSubmit}>
            <p className="muted" style={{ margin: '0 0 14px', fontSize: '12.5px', lineHeight: 1.5 }}>
              {isHrScope
                ? 'Generate a verified onboarding link for a new HR Personnel officer under the HRMDO Office.'
                : 'Generate a verified institutional registration token. Invited personnel will self-enroll with their credentials.'}
            </p>

            {inviteError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{inviteError}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Recipient Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. employee@evsu.edu.ph"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (inviteError) setInviteError(null);
                }}
                required
                style={{
                  borderColor: matchedExistingUser ? '#ef4444' : undefined,
                }}
              />
              {matchedExistingUser && (
                <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  <span>
                    Personnel already registered: <strong>{matchedExistingUser.full_name}</strong> ({matchedExistingUser.role})
                  </span>
                </div>
              )}
            </div>

            {renderRoleAndDepartmentControls()}

            {/* Direct Manual Creation Option */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed var(--line)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-800)' }}>
                  Register directly without sending link?
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-500)' }}>
                  Input personnel details directly and assign a temporary password.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setManualError(null);
                  setModalMode('manual');
                }}
                style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
              >
                <UserPlus size={14} />
                <span>Add Manually</span>
              </button>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={isSendingInvite || Boolean(matchedExistingUser)}
                style={{
                  opacity: matchedExistingUser ? 0.6 : 1,
                  cursor: matchedExistingUser ? 'not-allowed' : 'pointer',
                }}
              >
                {isSendingInvite ? 'Generating...' : 'Generate Invitation Link'}
              </button>
            </div>
          </form>
        )}

        {modalMode === 'invite' && createdInvite && (
          <div>
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, marginBottom: '6px' }}>
                <Check size={18} />
                <span>Invitation Successfully Generated!</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#166534' }}>
                Role: <b>{createdInvite.role}</b> · Department: <b>{createdInvite.department}</b>
              </div>
              {createdInvite.email && (
                <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                  Sent to: <b>{createdInvite.email}</b>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Single-Use Enrollment URL</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  readOnly
                  value={createdInvite.url}
                  style={{ background: '#f8fafc', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                  onClick={handleCopyInviteLink}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="muted" style={{ fontSize: '11.5px', marginTop: '6px', marginBottom: 0 }}>
                Valid for 24 hours from creation · Single-use institutional onboarding link
              </p>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => resetFormState('invite')}
              >
                Invite Another User
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* MODE B: MANUAL ACCOUNT PROVISIONING                     */}
        {/* ======================================================= */}
        {modalMode === 'manual' && !createdManualUser && (
          <form onSubmit={handleManualCreateSubmit} autoComplete="off">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
              <p className="muted" style={{ margin: 0, fontSize: '12px', lineHeight: 1.45 }}>
                Provision an active institutional account directly with full onboarding details and a temporary password.
              </p>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setManualError(null);
                  setModalMode('invite');
                }}
                style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
              >
                <ArrowLeft size={13} />
                <span>Back to Invite</span>
              </button>
            </div>

            {manualError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{manualError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Institutional Email */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 700 }}>
                  Institutional Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (manualError) setManualError(null);
                    }}
                    placeholder="firstname.lastname@evsu.edu.ph"
                    style={{
                      paddingLeft: '34px',
                      borderColor: matchedExistingUser ? '#ef4444' : undefined,
                    }}
                  />
                  <Mail
                    size={15}
                    color={matchedExistingUser ? '#ef4444' : 'var(--ink-400)'}
                    style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
                {matchedExistingUser && (
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span>
                      Personnel already registered: <strong>{matchedExistingUser.full_name}</strong> ({matchedExistingUser.role})
                    </span>
                  </div>
                )}
              </div>

              {/* Scoped Role & Target Department */}
              <div style={{ marginBottom: '-14px' }}>{renderRoleAndDepartmentControls()}</div>

              {/* Structured Name Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1.4fr 65px 1.4fr', gap: '8px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600 }}>Title</label>
                  <select
                    className="form-control"
                    value={titlePrefix}
                    onChange={(e) => setTitlePrefix(e.target.value)}
                    style={{ padding: '8px 6px', fontSize: '12.5px' }}
                  >
                    {UNIVERSITY_TITLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600 }}>
                    First Name <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Maria"
                    style={{ padding: '8px 10px', fontSize: '12.5px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600 }}>M.I.</label>
                  <input
                    className="form-control"
                    type="text"
                    maxLength={2}
                    value={middleInitial}
                    onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                    placeholder="S"
                    style={{ padding: '8px 6px', fontSize: '12.5px', textAlign: 'center' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600 }}>
                    Last Name <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Dela Cruz"
                    style={{ padding: '8px 10px', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* Date of Employment (Matches Invitation Sign-Up) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, margin: '0 0 3px', display: 'block' }}>
                  Date of Employment <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type="date"
                    required
                    value={startingDate}
                    onChange={(e) => setStartingDate(e.target.value)}
                    style={{ paddingLeft: '34px', fontSize: '12px' }}
                  />
                  <Calendar
                    size={15}
                    color="var(--ink-400)"
                    style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--ink-500)', marginTop: '2px', display: 'block' }}>
                  Official appointment date on campus. Formats the date segment of the generated ID number. Official contract terms can be assigned in Account Settings.
                </span>
              </div>

              {/* Password + Confirm Password (Matches Invitation Sign-Up) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Password <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      style={{ paddingLeft: '34px', paddingRight: '36px' }}
                    />
                    <Lock
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-500)',
                        cursor: 'pointer',
                      }}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Confirm Password <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      style={{ paddingLeft: '34px', paddingRight: '36px' }}
                    />
                    <Lock
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-500)',
                        cursor: 'pointer',
                      }}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <PasswordComplexityChecklist password={tempPassword} />
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button type="button" className="btn btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={isSubmittingManual || Boolean(matchedExistingUser)}
                style={{
                  opacity: matchedExistingUser ? 0.6 : 1,
                  cursor: matchedExistingUser ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmittingManual ? 'Creating Account...' : 'Save & Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* ======================================================= */}
        {/* MODE B SUCCESS: CREDENTIAL HANDOFF CONFIRMATION         */}
        {/* ======================================================= */}
        {modalMode === 'manual' && createdManualUser && (
          <div>
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, marginBottom: '6px' }}>
                <Check size={18} />
                <span>Account Successfully Created!</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#166534' }}>
                {createdManualUser.user.full_name} is now registered in PerformaCOS.
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Assigned EVSU ID:</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--brand-700)' }}>
                  {createdManualUser.user.employee_id_number}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">System Role:</span>
                <strong>{createdManualUser.user.role}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Assigned Unit:</span>
                <strong>{createdManualUser.departmentName}</strong>
              </div>
              {createdManualUser.user.contract_end_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Contract End Date:</span>
                  <strong>{formatReadableDate(createdManualUser.user.contract_end_date)}</strong>
                </div>
              )}
              <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '8px', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Login Email:</span>
                <strong>{createdManualUser.user.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Temporary Password:</span>
                <strong style={{ fontFamily: 'monospace' }}>{createdManualUser.tempPassword}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleCopyCredentials}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                {copiedCreds ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCreds ? 'Credentials Copied!' : 'Copy Login Credentials'}</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => resetFormState('manual')}
                >
                  Create Another User
                </button>
                <button type="button" className="btn btn-sm btn-primary" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
