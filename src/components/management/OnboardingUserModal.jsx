import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  X,
  Check,
  Copy,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Mail,
  Briefcase,
  Phone,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import { EVSU_DEPARTMENT_GROUPS } from '../../utils/departments';
import { generateEvsuEmployeeId } from '../../utils/idGenerator';
import {
  UNIVERSITY_TITLES,
  getTodayIsoDate,
  formatFullLegalName,
  evaluatePasswordComplexity,
  calculateSixMonthContractEnd,
  formatReadableDate,
  generateTemporaryPassword,
} from '../../utils/onboardingHelpers';
import PasswordComplexityChecklist from '../common/PasswordComplexityChecklist';

export default function OnboardingUserModal({
  isOpen = false,
  initialRole = 'COS Employee',
  initialDepartmentName = '',
  scope = 'departments', // 'departments' | 'hr_admins'
  departments = [],
  existingEmployeeIds = [],
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

  // Manual creation state (parity with TokenizedSignUp + manual features)
  const [titlePrefix, setTitlePrefix] = useState('None');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [startingDate, setStartingDate] = useState(getTodayIsoDate());
  const [contractStartDate, setContractStartDate] = useState(getTodayIsoDate());
  const [contractStartTouched, setContractStartTouched] = useState(false);
  const [jobPosition, setJobPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [showCustomIdOverride, setShowCustomIdOverride] = useState(false);
  const [customIdOverride, setCustomIdOverride] = useState('');
  const [isActiveAccount, setIsActiveAccount] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState(null);
  const [createdManualUser, setCreatedManualUser] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedTempPwd, setCopiedTempPwd] = useState(false);

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
    setContractStartDate(today);
    setContractStartTouched(false);
    setJobPosition('');
    setPhone('');
    setTempPassword('');
    setShowPassword(true);
    setShowCustomIdOverride(false);
    setCustomIdOverride('');
    setIsActiveAccount(true);
    setSendWelcomeEmail(true);
    setIsSubmittingManual(false);
    setManualError(null);
    setCreatedManualUser(null);
    setCopiedCreds(false);
    setCopiedTempPwd(false);
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
  const groupedDepartmentOptions = useMemo(() => {
    const groupedNames = new Set();
    const groups = EVSU_DEPARTMENT_GROUPS.map((grp) => {
      const matches = departments.filter((d) => grp.departments.includes(d.name));
      matches.forEach((m) => groupedNames.add(m.name));
      return { key: grp.key, label: grp.name, items: matches };
    }).filter((g) => g.items.length > 0);

    const customUnits = departments.filter((d) => !groupedNames.has(d.name));
    if (customUnits.length > 0) {
      groups.push({ key: 'custom', label: 'Additional / Custom Units', items: customUnits });
    }
    return groups;
  }, [departments]);

  const previewEmployeeId = useMemo(() => {
    if (showCustomIdOverride && customIdOverride.trim()) {
      return customIdOverride.trim();
    }
    return generateEvsuEmployeeId({
      firstName,
      middleInitial,
      lastName,
      startingDate,
      existingIds: existingEmployeeIds,
    });
  }, [
    showCustomIdOverride,
    customIdOverride,
    firstName,
    middleInitial,
    lastName,
    startingDate,
    existingEmployeeIds,
  ]);

  const previewContractEndIso = useMemo(() => {
    if (effectiveRole !== 'COS Employee') return '';
    return calculateSixMonthContractEnd(contractStartDate);
  }, [effectiveRole, contractStartDate]);

  if (!isOpen) return null;

  const selectedDeptObj = departments.find((d) => d.name === effectiveDeptName);

  const handleSendInviteSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteError(null);
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
      setInviteError(err.message || 'Failed to generate invitation link. Please check your inputs and try again.');
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
    if (!firstName.trim() || !lastName.trim()) {
      setManualError('Please enter both First Name and Last Name.');
      return;
    }

    const complexity = evaluatePasswordComplexity(tempPassword);
    if (!complexity.isValid) {
      setManualError(
        'Temporary password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special symbol.'
      );
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
        job_title:
          jobPosition.trim() ||
          (effectiveRole === 'COS Employee'
            ? 'Administrative Aide'
            : effectiveRole === 'HR Personnel'
              ? 'HRMO Officer'
              : 'Department Head'),
        contact_number: phone.trim() || null,
        starting_date: startingDate || getTodayIsoDate(),
        date_appointed: startingDate || getTodayIsoDate(),
        contract_start_date:
          effectiveRole === 'COS Employee' ? contractStartDate || startingDate : null,
        contract_end_date:
          effectiveRole === 'COS Employee' && previewContractEndIso ? previewContractEndIso : null,
        employee_id_number: showCustomIdOverride && customIdOverride.trim() ? customIdOverride.trim() : null,
        password: tempPassword,
        is_active: isActiveAccount,
        send_welcome_email: sendWelcomeEmail,
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
      setManualError(err.message || 'Failed to create user account. Please verify the entered details.');
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

  const handleCopyTempPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopiedTempPwd(true);
    setTimeout(() => setCopiedTempPwd(false), 2000);
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
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
              <button type="submit" className="btn btn-sm btn-primary" disabled={isSendingInvite}>
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
                Token: <b>{createdInvite.token}</b> · Role: <b>{createdInvite.role}</b>
              </div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                Department: <b>{createdInvite.department}</b> · Sent to: <b>{createdInvite.email}</b>
              </div>
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="firstname.lastname@evsu.edu.ph"
                    style={{ paddingLeft: '34px' }}
                  />
                  <Mail
                    size={15}
                    color="var(--ink-400)"
                    style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
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

              {/* Campus Starting Date & Contract Dates */}
              {effectiveRole === 'COS Employee' ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        Campus Starting Date <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-control"
                          type="date"
                          required
                          value={startingDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStartingDate(val);
                            if (!contractStartTouched) {
                              setContractStartDate(val);
                            }
                          }}
                          style={{ paddingLeft: '34px', fontSize: '12px' }}
                        />
                        <Calendar
                          size={15}
                          color="var(--ink-400)"
                          style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--ink-500)', display: 'block', marginTop: '2px' }}>
                        Original hiring date. Formats official ID.
                      </span>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600 }}>
                        Current Contract Start <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-control"
                          type="date"
                          required
                          value={contractStartDate}
                          onChange={(e) => {
                            setContractStartTouched(true);
                            setContractStartDate(e.target.value);
                          }}
                          style={{ paddingLeft: '34px', fontSize: '12px' }}
                        />
                        <Calendar
                          size={15}
                          color="var(--ink-400)"
                          style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--ink-500)', display: 'block', marginTop: '2px' }}>
                        Active 6-month evaluation cycle start.
                      </span>
                    </div>
                  </div>
                  {previewContractEndIso && (
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--ink-600)' }}>
                      Auto-Calculated Contract End Date:{' '}
                      <strong style={{ color: 'var(--brand-700)' }}>
                        {formatReadableDate(previewContractEndIso)}
                      </strong>{' '}
                      (6-month contract cycle)
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Campus Starting Date (Date of Initial Appointment) <span style={{ color: 'var(--red-600)' }}>*</span>
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
                </div>
              )}

              {/* Job Position & Contact Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Job Position / Designation</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="text"
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                      placeholder={
                        effectiveRole === 'COS Employee'
                          ? 'e.g. Administrative Aide VI'
                          : effectiveRole === 'HR Personnel'
                            ? 'e.g. HRMO Officer'
                            : 'e.g. Department Head'
                      }
                      style={{ paddingLeft: '34px' }}
                    />
                    <Briefcase
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Official Contact Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      style={{ paddingLeft: '34px' }}
                    />
                    <Phone
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>
              </div>

              {/* System Generated EVSU ID Preview + Optional Custom Override */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed var(--line)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ink-600)' }}>
                    {showCustomIdOverride ? 'Assigned Official ID (Custom):' : 'System Generated Official ID:'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--brand-700)',
                        letterSpacing: '0.8px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {previewEmployeeId}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setShowCustomIdOverride((prev) => !prev);
                        if (showCustomIdOverride) setCustomIdOverride('');
                      }}
                      style={{ padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      {showCustomIdOverride ? 'Use Auto ID' : 'Override ID'}
                    </button>
                  </div>
                </div>
                {showCustomIdOverride && (
                  <input
                    type="text"
                    className="form-control"
                    value={customIdOverride}
                    onChange={(e) => setCustomIdOverride(e.target.value)}
                    placeholder="Enter custom institutional Employee ID (optional)"
                    style={{ marginTop: '8px', fontSize: '12.5px', fontFamily: 'monospace' }}
                  />
                )}
              </div>

              {/* Temporary Password + Generator + Complexity Rules */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>
                    Temporary Password <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setTempPassword(generateTemporaryPassword());
                      setShowPassword(true);
                    }}
                    style={{
                      padding: '2px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <KeyRound size={12} />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="form-control"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Enter or generate compliant temporary password"
                      style={{ paddingLeft: '34px', paddingRight: '36px', fontFamily: showPassword ? 'monospace' : 'inherit' }}
                    />
                    <Lock
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
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
                      aria-label={showPassword ? 'Hide temporary password' : 'Show temporary password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {tempPassword && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={handleCopyTempPassword}
                      style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedTempPwd ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedTempPwd ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <PasswordComplexityChecklist password={tempPassword} />
              </div>

              {/* Manual Onboarding Toggles */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', paddingTop: '2px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink-700)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActiveAccount}
                    onChange={(e) => setIsActiveAccount(e.target.checked)}
                  />
                  <span>Activate account immediately</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink-700)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  />
                  <span>Send welcome confirmation email</span>
                </label>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button type="button" className="btn btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={isSubmittingManual}
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
