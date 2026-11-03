import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Check,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  AlertCircle,
  Building,
  Briefcase,
  Phone,
  Lock,
} from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { generateEvsuEmployeeId } from '../../utils/idGenerator';
import { api } from '../../services/api';

const DEPARTMENTS = [
  'Disbursing / Cashier Office',
  'HRMDO Office',
  'School Clinic',
  'IPDO Office',
  'Research Office',
  'Sports And Development Office',
  'Quality Assurance & Accreditation Office',
  'Technology Department',
  'Guidance Office',
  'Extension Service Office',
  'Education Department',
  'Procurement Office',
  'IGP Office',
  'Campus Director Office',
  'Computer Studies Department',
  'SASO Office',
  'Engineering Department',
  'Administrative and Finance',
  'Hospitality & Tourism Management',
  'Library Office',
  'Registrar Office',
  'Maintenance/Janitorial (MESO) Office',
];

export default function TokenizedSignUp({
  initialToken = '',
  onBackToLogin = () => {},
  onLoginAsNewUser = () => {},
}) {
  // Extract token candidate from prop or URL
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
  const [cosName, setCosName] = useState('');
  const [cosDept, setCosDept] = useState('Computer Studies Department');
  const [cosTitle, setCosTitle] = useState('Administrative Aide VI (COS)');
  const [cosPhone, setCosPhone] = useState('');
  const [cosPassword, setCosPassword] = useState('');
  const [cosConfirm, setCosConfirm] = useState('');
  const [cosAgreed, setCosAgreed] = useState(false);

  // Form State - Administrator / Department Head
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState('Department Head'); // 'Department Head' | 'HR Personnel'
  const [adminDept, setAdminDept] = useState('Computer Studies Department');
  const [adminTitle, setAdminTitle] = useState('Department Head');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirm, setAdminConfirm] = useState('');
  const [adminAgreed, setAdminAgreed] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
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

        // Pre-select department if invitation was bound to one
        if (data.department_name) {
          if (isCos) setCosDept(data.department_name);
          else setAdminDept(data.department_name);
        }

        if (!isCos && data.role) {
          setAdminRole(data.role);
          if (data.role === 'Department Head') {
            setAdminTitle('Department Head');
          }
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

  // Dynamic preview of employee ID
  const currentFullName = roleMode === 'cos' ? cosName : adminName;
  const currentGeneratedId = generateEvsuEmployeeId(
    currentFullName || (roleMode === 'cos' ? 'COS Staff' : 'Admin Staff'),
    new Date()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const isCos = roleMode === 'cos';
    const pwd = isCos ? cosPassword : adminPassword;
    const confirm = isCos ? cosConfirm : adminConfirm;
    const agreed = isCos ? cosAgreed : adminAgreed;
    const tokenToUse = tokenInput.trim();

    if (!tokenToUse) {
      setFormError('Please provide a valid invitation token.');
      return;
    }

    if (!agreed) {
      setFormError('Please accept the institutional terms to complete account registration.');
      return;
    }

    if (pwd !== confirm) {
      setFormError('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    if (pwd.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        invitation_token: tokenToUse,
        email: isCos ? cosEmail.trim() : adminEmail.trim(),
        full_name: isCos ? cosName.trim() : adminName.trim(),
        password: pwd,
        role: isCos ? 'COS Employee' : adminRole,
        cos_category: isCos ? 'Administrative' : null,
        job_title: isCos ? cosTitle.trim() : adminTitle.trim(),
        contact_number: isCos ? cosPhone.trim() : adminPhone.trim(),
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
        initials: user.fullName
          ? user.fullName
              .replace(/^(Dr\.|Engr\.|Prof\.)\s*/i, '')
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
          'Registration failed. Please check your invitation token and institutional credentials.'
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
          {/* Top Bar: Back Link */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <button
              type="button"
              className="btn btn-sm"
              onClick={onBackToLogin}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                color: 'var(--ink-700)',
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>

            <span style={{ fontSize: '12px', color: 'var(--ink-500)', fontWeight: 600 }}>
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
              <span>Verifying your institutional invitation token...</span>
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
                  {roleMode === 'cos' ? 'Official COS Employee Invitation' : 'Official Administrator Invitation'}
                </div>
                <div style={{ fontSize: '12px', color: roleMode === 'cos' ? '#047857' : '#9f1239' }}>
                  Token verified &bull; Assigned to {tokenData.department_name || 'Eastern Visayas State University'}
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
                {tokenData.role || (roleMode === 'cos' ? 'COS Staff' : 'Admin')}
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

          {/* Invitation Token Field (Shown if manual verification or adjustment needed) */}
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
          <form onSubmit={handleSubmit}>
            {roleMode === 'cos' ? (
              /* ====================================================
                 1. REGULAR COS EMPLOYEE SIGN-UP FIELDS
                 ==================================================== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Institutional Email */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>
                    Institutional Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="email"
                      required
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

                {/* Full Legal Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>
                    Full Legal Name <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={cosName}
                      onChange={(e) => setCosName(e.target.value)}
                      placeholder="e.g. Maria Santos Dela Cruz"
                      style={{ paddingLeft: '34px' }}
                    />
                    <User
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                {/* Department Selection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>
                    Assigned Department / Academic Unit <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      className="form-control"
                      value={cosDept}
                      onChange={(e) => setCosDept(e.target.value)}
                      style={{ paddingLeft: '34px' }}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <Building
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                {/* Job Title & Contact Number Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>Official Job Title</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="text"
                        value={cosTitle}
                        onChange={(e) => setCosTitle(e.target.value)}
                        placeholder="Admin Aide / Faculty"
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
                    <label style={{ fontSize: '12px' }}>Contact Phone</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="tel"
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
                    System Generated EVSU ID:
                  </span>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-700)', letterSpacing: '0.5px' }}>
                    {currentGeneratedId}
                  </span>
                </div>

                {/* Password Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Password <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={cosPassword}
                        onChange={(e) => setCosPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        style={{ paddingLeft: '34px' }}
                      />
                      <Lock
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Confirm Password <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={cosConfirm}
                        onChange={(e) => setCosConfirm(e.target.value)}
                        placeholder="Re-type password"
                        style={{ paddingLeft: '34px' }}
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
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--ink-700)',
                    cursor: 'pointer',
                    marginTop: '4px',
                    lineHeight: 1.4,
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
              </div>
            ) : (
              /* ====================================================
                 2. ADMINISTRATOR / DEPARTMENT HEAD SIGN-UP FIELDS
                 ==================================================== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Institutional Email */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>
                    Institutional Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="email"
                      required
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

                {/* Full Legal Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>
                    Full Legal Name & Title <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Engr. Roberto Del Rosario"
                      style={{ paddingLeft: '34px' }}
                    />
                    <User
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                {/* Department Selection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>
                    Department / Administrative Office <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      className="form-control"
                      value={adminDept}
                      onChange={(e) => setAdminDept(e.target.value)}
                      style={{ paddingLeft: '34px' }}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <Building
                      size={15}
                      color="var(--ink-400)"
                      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                {/* Admin Position & Contact Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>Administrative Title</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="text"
                        value={adminTitle}
                        onChange={(e) => setAdminTitle(e.target.value)}
                        placeholder="Department Head"
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
                    <label style={{ fontSize: '12px' }}>Official Contact Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="tel"
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
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-700)', letterSpacing: '0.5px' }}>
                    {currentGeneratedId}
                  </span>
                </div>

                {/* Password Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Password <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        style={{ paddingLeft: '34px' }}
                      />
                      <Lock
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Confirm Password <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminConfirm}
                        onChange={(e) => setAdminConfirm(e.target.value)}
                        placeholder="Re-type password"
                        style={{ paddingLeft: '34px' }}
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
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin Confidentiality Agreement */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--ink-700)',
                    cursor: 'pointer',
                    marginTop: '4px',
                    lineHeight: 1.4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={adminAgreed}
                    onChange={(e) => setAdminAgreed(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    I acknowledge administrative oversight responsibility, data privacy compliance, and strict evaluation confidentiality.
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <div style={{ marginTop: '20px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || isValidatingToken}
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(122, 12, 46, 0.25)',
                }}
              >
                {isSubmitting
                  ? 'Registering & Activating...'
                  : `Complete ${roleMode === 'cos' ? 'COS Staff' : 'Administrator'} Registration`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {registeredUser && (
        <div className="modal-overlay open" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '440px', textAlign: 'center', padding: '28px' }}>
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

            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: 'var(--ink-900)' }}>
              Account Successfully Activated!
            </h2>
            <p className="muted" style={{ margin: '0 0 18px', fontSize: '13px' }}>
              Your tokenized invitation has been verified and your official EVSU user profile is now active in the system.
            </p>

            {/* Profile Overview Card */}
            <div
              style={{
                background: '#fafbfc',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                padding: '14px',
                textAlign: 'left',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="muted">Assigned ID:</span>
                <strong style={{ color: 'var(--brand-700)' }}>{registeredUser.employeeIdNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="muted">Full Name:</span>
                <strong>{registeredUser.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="muted">System Role:</span>
                <span className="badge badge-dept" style={{ fontWeight: 700 }}>
                  {registeredUser.roleLabel}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Department:</span>
                <span style={{ fontWeight: 600 }}>{registeredUser.department}</span>
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
