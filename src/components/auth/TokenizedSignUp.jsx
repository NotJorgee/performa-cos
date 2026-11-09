import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Check,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  Building,
  Briefcase,
  Phone,
  Lock,
  Calendar,
} from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { generateEvsuEmployeeId } from '../../utils/idGenerator';
import { api } from '../../services/api';

export const UNIVERSITY_TITLES = [
  'None',
  'Engr.',
  'Dr.',
  'Prof.',
  'Assoc. Prof.',
  'Asst. Prof.',
  'Instr.',
  'Atty.',
  'Arch.',
];

const getTodayStr = () => new Date().toISOString().split('T')[0];

export default function TokenizedSignUp({
  initialToken = '',
  onBackToLogin = () => {},
  onLoginAsNewUser = () => {},
}) {
  // Extract token candidate from prop or URL (?token=... or ?invite=...)
  const resolvedInitialToken = (() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('invite') || '';
    }
    return '';
  })();

  const [tokenInput, setTokenInput] = useState(resolvedInitialToken);
  const [tokenData, setTokenData] = useState(null);
  const [isValidatingToken, setIsValidatingToken] = useState(Boolean(resolvedInitialToken));
  const [tokenError, setTokenError] = useState(null);

  // Role mode: 'cos' | 'admin'
  const [roleMode, setRoleMode] = useState(() => {
    if (resolvedInitialToken.toUpperCase().includes('ADM')) return 'admin';
    return 'cos';
  });

  // Form State - COS Employee
  const [cosEmail, setCosEmail] = useState('');
  const [cosTitlePrefix, setCosTitlePrefix] = useState('None');
  const [cosFirstName, setCosFirstName] = useState('');
  const [cosMiddleInitial, setCosMiddleInitial] = useState('');
  const [cosLastName, setCosLastName] = useState('');
  const [cosStartingDate, setCosStartingDate] = useState(getTodayStr());
  const [cosContractStartDate, setCosContractStartDate] = useState(getTodayStr());
  const [cosDept, setCosDept] = useState('Computer Studies Department');
  const [cosJobPosition, setCosJobPosition] = useState('');
  const [cosPhone, setCosPhone] = useState('');
  const [cosPassword, setCosPassword] = useState('');
  const [cosConfirm, setCosConfirm] = useState('');
  const [cosAgreed, setCosAgreed] = useState(false);

  // Form State - Administrator / Department Head
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTitlePrefix, setAdminTitlePrefix] = useState('None');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminMiddleInitial, setAdminMiddleInitial] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminStartingDate, setAdminStartingDate] = useState(getTodayStr());
  const [adminRole, setAdminRole] = useState('Department Head'); // 'Department Head' | 'HR Personnel'
  const [adminDept, setAdminDept] = useState('Computer Studies Department');
  const [adminJobPosition, setAdminJobPosition] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirm, setAdminConfirm] = useState('');
  const [adminAgreed, setAdminAgreed] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [formError, setFormError] = useState(null);

  // Validate invitation token whenever tokenInput changes
  useEffect(() => {
    const rawToken = tokenInput.trim();
    if (!rawToken) {
      setTokenData(null);
      setTokenError(null);
      setIsValidatingToken(false);
      return;
    }

    let isMounted = true;
    setIsValidatingToken(true);
    setTokenError(null);

    api.invitations
      .validate(rawToken)
      .then((data) => {
        if (!isMounted) return;
        setTokenData(data);
        setTokenError(null);

        // Determine role mode from validated backend role
        const isCos = data.role === 'COS Employee' || rawToken.toUpperCase().includes('COS');
        setRoleMode(isCos ? 'cos' : 'admin');

        // Pre-fill email if invitation was bound to an email
        if (data.email) {
          if (isCos) setCosEmail(data.email);
          else setAdminEmail(data.email);
        }

        // Lock assigned department from token
        if (data.department_name) {
          if (isCos) setCosDept(data.department_name);
          else setAdminDept(data.department_name);
        }

        if (!isCos && data.role) {
          setAdminRole(data.role);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTokenData(null);
        setTokenError(
          err.message || 'Invalid or expired invitation token. Please check your link.'
        );
      })
      .finally(() => {
        if (isMounted) setIsValidatingToken(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tokenInput]);

  // Dynamic preview of employee ID with 'X' fallback placeholder
  const currentFirstName = roleMode === 'cos' ? cosFirstName : adminFirstName;
  const currentMiddleInitial = roleMode === 'cos' ? cosMiddleInitial : adminMiddleInitial;
  const currentLastName = roleMode === 'cos' ? cosLastName : adminLastName;
  const currentStartingDate = roleMode === 'cos' ? cosStartingDate : adminStartingDate;

  const currentGeneratedId = generateEvsuEmployeeId({
    firstName: currentFirstName,
    middleInitial: currentMiddleInitial,
    lastName: currentLastName,
    startingDate: currentStartingDate,
  });

  // Active password values and institutional complexity verification
  const currentPassword = roleMode === 'cos' ? cosPassword : adminPassword;
  const currentConfirm = roleMode === 'cos' ? cosConfirm : adminConfirm;

  const hasMinLength = currentPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(currentPassword);
  const hasLower = /[a-z]/.test(currentPassword);
  const hasNumber = /[0-9]/.test(currentPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(currentPassword);
  const isPasswordComplex = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const isCos = roleMode === 'cos';
    const pwd = isCos ? cosPassword : adminPassword;
    const confirm = isCos ? cosConfirm : adminConfirm;
    const agreed = isCos ? cosAgreed : adminAgreed;
    const tokenToUse = tokenInput.trim();

    const firstName = (isCos ? cosFirstName : adminFirstName).trim();
    const middleInitial = (isCos ? cosMiddleInitial : adminMiddleInitial).trim();
    const lastName = (isCos ? cosLastName : adminLastName).trim();
    const titlePrefix = isCos ? cosTitlePrefix : adminTitlePrefix;
    const startingDate = isCos ? cosStartingDate : adminStartingDate;
    const contractStartDate = isCos ? cosContractStartDate : null;

    if (!tokenToUse) {
      setFormError('Please provide a valid invitation token.');
      return;
    }

    if (!firstName || !lastName) {
      setFormError('Please enter both your First Name and Last Name.');
      return;
    }

    if (!isPasswordComplex) {
      setFormError(
        'Password does not meet institutional requirements. It must have at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    if (pwd !== confirm) {
      setFormError('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    if (!agreed) {
      setFormError('Please confirm the institutional acknowledgement before completing registration.');
      return;
    }

    setIsSubmitting(true);

    try {
      const prefix = titlePrefix && titlePrefix !== 'None' ? `${titlePrefix} ` : '';
      const middle = middleInitial ? `${middleInitial.replace(/\.$/, '')}. ` : '';
      const fullLegalName = `${prefix}${firstName} ${middle}${lastName}`.trim();

      const payload = {
        invitation_token: tokenToUse,
        email: (isCos ? cosEmail : adminEmail).trim(),
        full_name: fullLegalName,
        first_name: firstName,
        middle_initial: middleInitial,
        last_name: lastName,
        title: titlePrefix !== 'None' ? titlePrefix : null,
        starting_date: startingDate,
        contract_start_date: contractStartDate,
        password: pwd,
        role: isCos ? 'COS Employee' : adminRole,
        job_title: (isCos ? cosJobPosition : adminJobPosition).trim(),
        contact_number: (isCos ? cosPhone : adminPhone).trim(),
      };

      const response = await api.auth.register(payload);
      const user = response.user;

      const newUser = {
        id: user.id,
        fullName: user.fullName,
        roleLabel: user.role,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        employeeIdNumber: user.employeeIdNumber,
        email: user.email,
        dateAppointed: user.dateAppointed || startingDate,
        contractStartDate: user.contractStartDate || contractStartDate,
        contractEndDate: user.contractEndDate,
        initials: user.fullName
          ? user.fullName
              .replace(/^(Dr\.|Engr\.|Prof\.|Mr\.|Ms\.|Mrs\.|Atty\.|Arch\.)\s*/i, '')
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
          : 'U',
        avatarUrl: null,
      };

      setRegisteredUser(newUser);
    } catch (err) {
      setFormError(
        err.message ||
          'Registration failed. Please check your invitation link and institutional credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-container auth-container-wide">
        {/* Centered University Brand Header */}
        <div className="auth-header-center">
          <img src={evsuSeal} alt="EVSU Seal" className="auth-header-seal" />
          <h1 className="auth-header-title">PerformaCOS</h1>
          <p className="auth-header-sub">Eastern Visayas State University</p>
        </div>

        {/* Card */}
        <div className="auth-card" style={{ padding: '28px 32px' }}>
          {/* Top Bar: Official Onboarding Portal Indicator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--ink-500)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Official Onboarding Portal
            </span>
          </div>

          {/* Title */}
          <div className="auth-card-brand" style={{ marginBottom: '16px' }}>
            <span className="auth-card-brand-title">
              {roleMode === 'cos' ? 'COS Employee Registration' : 'Administrator / Department Head Registration'}
            </span>
            <span className="auth-card-brand-sub">
              {roleMode === 'cos'
                ? 'Complete your profile to access accomplishment reports and performance evaluations.'
                : 'Complete your profile to access supervisory evaluations, endorsement workflows, and administrative dashboards.'}
            </span>
          </div>

          {/* Invitation Status Banner */}
          {isValidatingToken && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '12.5px',
                color: 'var(--ink-600)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span className="btn-spinner" style={{ display: 'inline-block', width: '14px', height: '14px', borderWidth: '2px' }} />
              <span>Verifying your institutional invitation link...</span>
            </div>
          )}

          {tokenData && (
            <div
              style={{
                background: roleMode === 'cos' ? '#ecfdf5' : '#fdf2f4',
                border: `1px solid ${roleMode === 'cos' ? '#a7f3d0' : '#fecdd3'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: roleMode === 'cos' ? '#10b981' : '#7a1128',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {roleMode === 'cos' ? <Check size={20} strokeWidth={2.6} /> : <Shield size={19} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: roleMode === 'cos' ? '#065f46' : '#881337' }}>
                  {roleMode === 'cos' ? 'Institutional COS Employee Onboarding' : 'Institutional Administrator Onboarding'}
                </div>
                <div style={{ fontSize: '12px', color: roleMode === 'cos' ? '#047857' : '#9f1239' }}>
                  Assigned to <strong>{tokenData.department_name || 'Eastern Visayas State University'}</strong>
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: roleMode === 'cos' ? '#d1fae5' : '#ffe4e6',
                  color: roleMode === 'cos' ? '#065f46' : '#881337',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                {tokenData.role || (roleMode === 'cos' ? 'COS Staff' : 'Department Head')}
              </span>
            </div>
          )}

          {tokenError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Invalid or Expired Invitation</strong>
                <span>{tokenError} Please ensure you are opening the exact link sent to your email, or contact HRMDO.</span>
              </div>
            </div>
          )}

          {/* Invitation Token Field (Shown if manual verification needed) */}
          {(!tokenData || tokenError) && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
              }}
            >
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-700)', marginBottom: '6px' }}>
                Invitation Token
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="EVSU-INV-COS-..."
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  fontFamily: 'monospace',
                  color: 'var(--brand-800)',
                }}
              />
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
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
                marginBottom: '14px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          {/* REGISTRATION FORM */}
          <form onSubmit={handleSubmit} autoComplete="off">
            {roleMode === 'cos' ? (
              /* ====================================================
                 1. REGULAR COS EMPLOYEE SIGN-UP FIELDS
                 ==================================================== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Institutional Email */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Institutional Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="email"
                      required
                      autoComplete="email"
                      value={cosEmail}
                      onChange={(e) => setCosEmail(e.target.value)}
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

                {/* Separated Name Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1.5fr 70px 1.5fr', gap: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600 }}>Title</label>
                    <select
                      className="form-control"
                      value={cosTitlePrefix}
                      onChange={(e) => setCosTitlePrefix(e.target.value)}
                      style={{ padding: '8px 8px', fontSize: '12.5px' }}
                    >
                      {UNIVERSITY_TITLES.map((t) => (
                        <option key={t} value={t}>{t}</option>
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
                      autoComplete="given-name"
                      value={cosFirstName}
                      onChange={(e) => setCosFirstName(e.target.value)}
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
                      autoComplete="additional-name"
                      value={cosMiddleInitial}
                      onChange={(e) => setCosMiddleInitial(e.target.value.toUpperCase())}
                      placeholder="S"
                      style={{ padding: '8px 8px', fontSize: '12.5px', textAlign: 'center' }}
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
                      autoComplete="family-name"
                      value={cosLastName}
                      onChange={(e) => setCosLastName(e.target.value)}
                      placeholder="e.g. Dela Cruz"
                      style={{ padding: '8px 10px', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* Starting Dates (Original Campus Start vs Current 6-Mo Contract Start) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, margin: 0 }}>
                        Campus Starting Date <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="date"
                        required
                        value={cosStartingDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCosStartingDate(val);
                          if (cosContractStartDate === cosStartingDate) {
                            setCosContractStartDate(val);
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
                    <span style={{ fontSize: '10.5px', color: 'var(--ink-500)', marginTop: '2px', display: 'block' }}>
                      Original hiring date on campus. Formats your official ID.
                    </span>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, margin: 0 }}>
                        Current Contract Start <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="date"
                        required
                        value={cosContractStartDate}
                        onChange={(e) => setCosContractStartDate(e.target.value)}
                        style={{ paddingLeft: '34px', fontSize: '12px' }}
                      />
                      <Calendar
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--ink-500)', marginTop: '2px', display: 'block' }}>
                      Active contract evaluation cycle.
                    </span>
                  </div>
                </div>

                {/* Locked Department */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>
                      Assigned Department / Academic Unit
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={11} /> Pre-assigned by HR
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="text"
                      readOnly
                      disabled
                      value={cosDept || 'Assigned Department'}
                      style={{
                        paddingLeft: '34px',
                        background: '#f8fafc',
                        color: 'var(--ink-800)',
                        fontWeight: 600,
                        cursor: 'not-allowed',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Building
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                {/* Job Position & Contact Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Job Position / Designation</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="text"
                        value={cosJobPosition}
                        onChange={(e) => setCosJobPosition(e.target.value)}
                        placeholder="e.g. Administrative Aide VI"
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
                        autoComplete="tel"
                        value={cosPhone}
                        onChange={(e) => setCosPhone(e.target.value)}
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

                {/* Generated Employee ID Preview */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px dashed var(--line)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--ink-600)' }}>
                    System Generated Official ID:
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-700)', letterSpacing: '0.8px', fontFamily: 'monospace' }}>
                    {currentGeneratedId}
                  </span>
                </div>

                {/* Password Fields */}
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
                        value={cosPassword}
                        onChange={(e) => setCosPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        style={{ paddingLeft: '34px', paddingRight: '36px' }}
                      />
                      <Lock
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
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
                        value={cosConfirm}
                        onChange={(e) => setCosConfirm(e.target.value)}
                        placeholder="Re-type password"
                        style={{ paddingLeft: '34px', paddingRight: '36px' }}
                      />
                      <Lock
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Password Complexity Badges */}
                {cosPassword.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasMinLength ? '#dcfce7' : '#f1f5f9',
                        color: hasMinLength ? '#15803d' : '#64748b',
                        border: `1px solid ${hasMinLength ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasMinLength ? '✓' : '•'} 8+ Characters
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasUpper ? '#dcfce7' : '#f1f5f9',
                        color: hasUpper ? '#15803d' : '#64748b',
                        border: `1px solid ${hasUpper ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasUpper ? '✓' : '•'} Uppercase (A-Z)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasLower ? '#dcfce7' : '#f1f5f9',
                        color: hasLower ? '#15803d' : '#64748b',
                        border: `1px solid ${hasLower ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasLower ? '✓' : '•'} Lowercase (a-z)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasNumber ? '#dcfce7' : '#f1f5f9',
                        color: hasNumber ? '#15803d' : '#64748b',
                        border: `1px solid ${hasNumber ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasNumber ? '✓' : '•'} Number (0-9)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasSpecial ? '#dcfce7' : '#f1f5f9',
                        color: hasSpecial ? '#15803d' : '#64748b',
                        border: `1px solid ${hasSpecial ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasSpecial ? '✓' : '•'} Symbol (!@#$)
                    </span>
                  </div>
                )}

                {/* Agreement Checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--ink-700)',
                    cursor: 'pointer',
                    marginTop: '6px',
                    lineHeight: 1.45,
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={cosAgreed}
                    onChange={(e) => setCosAgreed(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    I affirm that the institutional details provided are true and correct under Eastern Visayas State University guidelines.
                  </span>
                </label>

                {/* Submit Button */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || isValidatingToken || !cosAgreed}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: cosAgreed ? 'pointer' : 'not-allowed',
                      opacity: cosAgreed ? 1 : 0.45,
                      filter: cosAgreed ? 'none' : 'grayscale(0.6)',
                      background: cosAgreed ? 'var(--brand-700, #7a1128)' : '#6b7280',
                      transition: 'all 0.2s ease',
                      boxShadow: cosAgreed ? '0 2px 6px rgba(122, 12, 46, 0.25)' : 'none',
                    }}
                  >
                    {isSubmitting ? 'Registering & Activating...' : 'Complete COS Staff Registration'}
                  </button>
                </div>
              </div>
            ) : (
              /* ====================================================
                 2. ADMINISTRATOR / DEPARTMENT HEAD SIGN-UP FIELDS
                 ==================================================== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Institutional Email */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Institutional Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="email"
                      required
                      autoComplete="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin.name@evsu.edu.ph"
                      style={{ paddingLeft: '34px' }}
                    />
                    <Mail
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                {/* Separated Name Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '105px 1.5fr 70px 1.5fr', gap: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600 }}>Title</label>
                    <select
                      className="form-control"
                      value={adminTitlePrefix}
                      onChange={(e) => setAdminTitlePrefix(e.target.value)}
                      style={{ padding: '8px 8px', fontSize: '12.5px' }}
                    >
                      {UNIVERSITY_TITLES.map((t) => (
                        <option key={t} value={t}>{t}</option>
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
                      autoComplete="given-name"
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      placeholder="e.g. Roberto"
                      style={{ padding: '8px 10px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600 }}>M.I.</label>
                    <input
                      className="form-control"
                      type="text"
                      maxLength={2}
                      autoComplete="additional-name"
                      value={adminMiddleInitial}
                      onChange={(e) => setAdminMiddleInitial(e.target.value.toUpperCase())}
                      placeholder="D"
                      style={{ padding: '8px 8px', fontSize: '12.5px', textAlign: 'center' }}
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
                      autoComplete="family-name"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      placeholder="e.g. Del Rosario"
                      style={{ padding: '8px 10px', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* Campus Starting Date (Initial Appointment) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>
                      Campus Starting Date (Date of Initial Appointment) <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="date"
                      required
                      value={adminStartingDate}
                      onChange={(e) => setAdminStartingDate(e.target.value)}
                      style={{ paddingLeft: '34px', fontSize: '12.5px' }}
                    />
                    <Calendar
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--ink-500)', marginTop: '2px', display: 'block' }}>
                    The date you initially began your service on campus. Sets the MMDDYYYY code in your official ID.
                  </span>
                </div>

                {/* Locked Department */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>
                      Department / Administrative Office
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={11} /> Pre-assigned by HR
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="text"
                      readOnly
                      disabled
                      value={adminDept || 'Assigned Department'}
                      style={{
                        paddingLeft: '34px',
                        background: '#f8fafc',
                        color: 'var(--ink-800)',
                        fontWeight: 600,
                        cursor: 'not-allowed',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Building
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                {/* Job Position & Contact Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Job Position / Designation</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="text"
                        value={adminJobPosition}
                        onChange={(e) => setAdminJobPosition(e.target.value)}
                        placeholder="e.g. Department Head"
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
                        autoComplete="tel"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
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

                {/* Generated Admin ID Preview */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px dashed var(--line)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--ink-600)' }}>
                    System Generated Official ID:
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-700)', letterSpacing: '0.8px', fontFamily: 'monospace' }}>
                    {currentGeneratedId}
                  </span>
                </div>

                {/* Password Fields */}
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
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        style={{ paddingLeft: '34px', paddingRight: '36px' }}
                      />
                      <Lock
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
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
                        value={adminConfirm}
                        onChange={(e) => setAdminConfirm(e.target.value)}
                        placeholder="Re-type password"
                        style={{ paddingLeft: '34px', paddingRight: '36px' }}
                      />
                      <Lock
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Password Complexity Badges */}
                {adminPassword.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasMinLength ? '#dcfce7' : '#f1f5f9',
                        color: hasMinLength ? '#15803d' : '#64748b',
                        border: `1px solid ${hasMinLength ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasMinLength ? '✓' : '•'} 8+ Characters
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasUpper ? '#dcfce7' : '#f1f5f9',
                        color: hasUpper ? '#15803d' : '#64748b',
                        border: `1px solid ${hasUpper ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasUpper ? '✓' : '•'} Uppercase (A-Z)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasLower ? '#dcfce7' : '#f1f5f9',
                        color: hasLower ? '#15803d' : '#64748b',
                        border: `1px solid ${hasLower ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasLower ? '✓' : '•'} Lowercase (a-z)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasNumber ? '#dcfce7' : '#f1f5f9',
                        color: hasNumber ? '#15803d' : '#64748b',
                        border: `1px solid ${hasNumber ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasNumber ? '✓' : '•'} Number (0-9)
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasSpecial ? '#dcfce7' : '#f1f5f9',
                        color: hasSpecial ? '#15803d' : '#64748b',
                        border: `1px solid ${hasSpecial ? '#86efac' : '#e2e8f0'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {hasSpecial ? '✓' : '•'} Symbol (!@#$)
                    </span>
                  </div>
                )}

                {/* Admin Confidentiality Agreement */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--ink-700)',
                    cursor: 'pointer',
                    marginTop: '6px',
                    lineHeight: 1.45,
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={adminAgreed}
                    onChange={(e) => setAdminAgreed(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    I acknowledge institutional administrative responsibility, data privacy compliance, and strict evaluation confidentiality under Eastern Visayas State University guidelines.
                  </span>
                </label>

                {/* Submit Button */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || isValidatingToken || !adminAgreed}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: adminAgreed ? 'pointer' : 'not-allowed',
                      opacity: adminAgreed ? 1 : 0.45,
                      filter: adminAgreed ? 'none' : 'grayscale(0.6)',
                      background: adminAgreed ? 'var(--brand-700, #7a1128)' : '#6b7280',
                      transition: 'all 0.2s ease',
                      boxShadow: adminAgreed ? '0 2px 6px rgba(122, 12, 46, 0.25)' : 'none',
                    }}
                  >
                    {isSubmitting
                      ? 'Registering & Activating...'
                      : `Complete ${roleMode === 'cos' ? 'COS Staff' : 'Administrator'} Registration`}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Department Correction Notice at the Very Bottom */}
          <div
            style={{
              marginTop: '20px',
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '11.5px',
              color: 'var(--ink-600)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            If the assigned department above is incorrect, please contact the <strong>Human Resource Management &amp; Development Office (HRMDO)</strong> to issue an updated registration invitation.
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {registeredUser && (
        <div className="modal-overlay open" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '440px', textAlign: 'center', padding: '28px', color: '#0f172a', background: '#ffffff' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid #bbf7d0',
              }}
            >
              <Check size={36} strokeWidth={2.8} />
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              Account Successfully Activated!
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#475569' }}>
              Your official EVSU user profile is now registered and active in the PerformaCOS system.
            </p>

            {/* Profile Overview Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#0f172a',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Assigned ID:</span>
                <strong style={{ color: 'var(--brand-700, #7a1128)', fontFamily: 'monospace', fontSize: '13.5px', letterSpacing: '0.5px' }}>
                  {registeredUser.employeeIdNumber}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Full Name:</span>
                <strong style={{ color: '#0f172a', fontWeight: 700 }}>{registeredUser.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>System Role:</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: registeredUser.role === 'COS Employee' ? '#dcfce7' : '#fee2e2',
                    color: registeredUser.role === 'COS Employee' ? '#166534' : '#991b1b',
                    border: `1px solid ${registeredUser.role === 'COS Employee' ? '#bbf7d0' : '#fecaca'}`,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {registeredUser.roleLabel || registeredUser.role}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Department:</span>
                <strong style={{ color: '#0f172a', fontWeight: 600 }}>{registeredUser.department}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '10px', fontWeight: 700, width: '100%', cursor: 'pointer' }}
                onClick={() => onLoginAsNewUser(registeredUser)}
              >
                Sign In to Dashboard as {registeredUser.fullName.split(' ')[0]} →
              </button>
              <button
                type="button"
                className="btn"
                style={{ padding: '8px', fontSize: '13px', width: '100%', cursor: 'pointer' }}
                onClick={onBackToLogin}
              >
                Return to Login Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
