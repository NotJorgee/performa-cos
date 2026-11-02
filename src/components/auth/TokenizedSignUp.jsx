import React, { useState } from 'react';
import {
  User,
  Shield,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Mail,
  AlertCircle,
} from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { generateEvsuEmployeeId } from '../../utils/idGenerator';

const DEPARTMENTS = [
  'Computer Studies Department',
  'Technology Department',
  'Engineering Department',
  'Education Department',
  'Mathematics Department',
  'Maintenance/Janitorial (MESO) Office',
  'Library Office',
  'HRMDO Office',
];

export default function TokenizedSignUp({
  onBackToLogin = () => {},
  onLoginAsNewUser = () => {},
}) {
  // Mode: 'cos' | 'admin'
  const [roleMode, setRoleMode] = useState('cos');

  // Form State - COS
  const [cosEmail, setCosEmail] = useState('newhire.cos@evsu.edu.ph');
  const [cosName, setCosName] = useState('Camille Joy Reyes');
  const [cosDept, setCosDept] = useState('Computer Studies Department');
  const [cosTitle, setCosTitle] = useState('Administrative Aide VI (COS)');
  const [cosPhone, setCosPhone] = useState('+63 912 345 6789');
  const [cosPassword, setCosPassword] = useState('@Password_123');
  const [cosConfirm, setCosConfirm] = useState('@Password_123');
  const [cosAgreed, setCosAgreed] = useState(true);

  // Form State - Admin
  const [adminEmail, setAdminEmail] = useState('admin.staff@evsu.edu.ph');
  const [adminName, setAdminName] = useState('Dr. Ronald Allan Santos');
  const [adminRole, setAdminRole] = useState('Department Head'); // 'Department Head' | 'HR Personnel'
  const [adminDept, setAdminDept] = useState('Computer Studies Department');
  const [adminTitle, setAdminTitle] = useState('Department Chairperson');
  const [adminPhone, setAdminPhone] = useState('+63 917 888 9922');
  const [adminPassword, setAdminPassword] = useState('@Password_123');
  const [adminConfirm, setAdminConfirm] = useState('@Password_123');
  const [adminAgreed, setAdminAgreed] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Dynamic EVSU Employee ID calculation
  const currentFullName = roleMode === 'cos' ? cosName : adminName;
  const currentGeneratedId = generateEvsuEmployeeId(
    currentFullName || (roleMode === 'cos' ? 'COS Staff' : 'Admin Staff'),
    new Date()
  );

  // Handle Quick Autofill for demo
  const handleQuickAutofill = () => {
    if (roleMode === 'cos') {
      setCosEmail('camille.reyes@evsu.edu.ph');
      setCosName('Camille Joy Reyes');
      setCosDept('Computer Studies Department');
      setCosTitle('Administrative Aide VI (COS)');
      setCosPhone('+63 912 345 6789');
      setCosPassword('@Password_123');
      setCosConfirm('@Password_123');
      setCosAgreed(true);
    } else {
      setAdminEmail('ronald.santos@evsu.edu.ph');
      setAdminName('Dr. Ronald Allan Santos');
      setAdminRole('Department Head');
      setAdminDept('Computer Studies Department');
      setAdminTitle('Department Chairperson');
      setAdminPhone('+63 917 888 9922');
      setAdminPassword('@Password_123');
      setAdminConfirm('@Password_123');
      setAdminAgreed(true);
    }
    setErrorMsg(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const isCos = roleMode === 'cos';
    const pwd = isCos ? cosPassword : adminPassword;
    const confirm = isCos ? cosConfirm : adminConfirm;
    const agreed = isCos ? cosAgreed : adminAgreed;

    if (!agreed) {
      setErrorMsg('Please accept the institutional terms to complete account registration.');
      return;
    }

    if (pwd !== confirm) {
      setErrorMsg('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    if (pwd.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    const newUser = isCos
      ? {
          fullName: cosName,
          roleLabel: 'COS Employee',
          department: cosDept,
          jobTitle: cosTitle,
          employeeIdNumber: currentGeneratedId,
          email: cosEmail,
          initials: cosName
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join(''),
          avatarUrl: null,
        }
      : {
          fullName: adminName,
          roleLabel: adminRole,
          department: adminDept,
          jobTitle: adminTitle,
          employeeIdNumber: currentGeneratedId,
          email: adminEmail,
          initials: adminName
            .replace(/^(Dr\.|Engr\.|Prof\.)\s*/i, '')
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join(''),
          avatarUrl: null,
        };

    setTimeout(() => {
      setIsSubmitting(false);
      setRegisteredUser(newUser);
    }, 700);
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
              Invitation Onboarding
            </span>
          </div>

          {/* Title */}
          <div className="auth-card-brand" style={{ marginBottom: '14px' }}>
            <span className="auth-card-brand-title">Account Registration</span>
            <span className="auth-card-brand-sub">
              Complete your profile and set up your institutional credentials.
            </span>
          </div>

            {/* Invitation Token Info Pill */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '12px',
                color: 'var(--ink-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span className="muted">Invitation Token:</span>{' '}
                <code
                  style={{
                    background: '#e2e8f0',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    color: 'var(--ink-900)',
                    fontWeight: 700,
                  }}
                >
                  {roleMode === 'cos' ? 'EVSU-INV-COS-84920' : 'EVSU-INV-ADM-39104'}
                </code>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
                Expires in 72h
              </span>
            </div>

            {/* DEMO SWITCHER: COS vs Administrator Toggle */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-700)', letterSpacing: '0.5px' }}>
                  Demo View Switcher
                </label>
                <button
                  type="button"
                  onClick={handleQuickAutofill}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-700)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 4px',
                  }}
                  title="Fill realistic demo values for testing"
                >
                  <Sparkles size={13} /> Autofill Demo Data
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  background: 'var(--brand-50, #fdf2f4)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid var(--brand-100, #fce7eb)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setRoleMode('cos');
                    setErrorMsg(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: roleMode === 'cos' ? '1px solid var(--brand-700)' : '1px solid transparent',
                    background: roleMode === 'cos' ? '#ffffff' : 'transparent',
                    color: roleMode === 'cos' ? 'var(--brand-700)' : 'var(--ink-600)',
                    fontWeight: roleMode === 'cos' ? 800 : 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: roleMode === 'cos' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <User size={15} />
                  <span>Regular COS Sign-Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoleMode('admin');
                    setErrorMsg(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: roleMode === 'admin' ? '1px solid var(--brand-700)' : '1px solid transparent',
                    background: roleMode === 'admin' ? '#ffffff' : 'transparent',
                    color: roleMode === 'admin' ? 'var(--brand-700)' : 'var(--ink-600)',
                    fontWeight: roleMode === 'admin' ? 800 : 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: roleMode === 'admin' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Shield size={15} />
                  <span>Admin Sign-Up</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
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
                <span>{errorMsg}</span>
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
                        placeholder="newhire.cos@evsu.edu.ph"
                        style={{ paddingLeft: '34px', background: '#f8fafc' }}
                      />
                      <Mail
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Full Legal Name <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={cosName}
                      onChange={(e) => setCosName(e.target.value)}
                      placeholder="e.g. Camille Joy Reyes"
                    />
                  </div>

                  {/* Department & Designation Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>
                        Assigned Department <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        value={cosDept}
                        onChange={(e) => setCosDept(e.target.value)}
                        required
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>
                        Position / Job Title <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                      <input
                        className="form-control"
                        type="text"
                        required
                        value={cosTitle}
                        onChange={(e) => setCosTitle(e.target.value)}
                        placeholder="e.g. Admin Aide VI (COS)"
                      />
                    </div>
                  </div>

                  {/* System-Assigned Employee ID Preview */}
                  <div
                    style={{
                      background: 'var(--brand-50, #fdf2f4)',
                      border: '1px solid var(--brand-200, #f8c5cd)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-800)', textTransform: 'uppercase' }}>
                        Auto-Assigned EVSU Employee ID
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '1px' }}>
                        Formula: Initial + MMDDYYYY + First Initial + Middle Initial
                      </div>
                    </div>
                    <code
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--brand-300, #fca5a5)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--brand-700)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {currentGeneratedId}
                    </code>
                  </div>

                  {/* Contact Number */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>Contact Number (Mobile / SMS)</label>
                    <input
                      className="form-control"
                      type="tel"
                      value={cosPhone}
                      onChange={(e) => setCosPhone(e.target.value)}
                      placeholder="+63 912 345 6789"
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>Create Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-control"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={cosPassword}
                          onChange={(e) => setCosPassword(e.target.value)}
                          placeholder="••••••••••"
                          style={{ paddingRight: '34px' }}
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
                            color: 'var(--ink-400)',
                            cursor: 'pointer',
                          }}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>Confirm Password</label>
                      <input
                        className="form-control"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={cosConfirm}
                        onChange={(e) => setCosConfirm(e.target.value)}
                        placeholder="••••••••••"
                      />
                    </div>
                  </div>

                  {/* Compliance Checkbox */}
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
                      I agree to submit daily accomplishment reports (DAR) and comply with institutional campus geofence verification policies.
                    </span>
                  </label>
                </div>
              ) : (
                /* ====================================================
                   2. ADMINISTRATOR SIGN-UP FIELDS
                   ==================================================== */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Institutional Email */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Administrator Email Address <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-control"
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin.staff@evsu.edu.ph"
                        style={{ paddingLeft: '34px', background: '#f8fafc' }}
                      />
                      <Mail
                        size={15}
                        color="var(--ink-400)"
                        style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Administrator Full Name <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Dr. Ronald Allan Santos"
                    />
                  </div>

                  {/* Admin Role Selector & Department */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>
                        System Role <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        value={adminRole}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setAdminRole(newRole);
                          if (newRole === 'HR Personnel') {
                            setAdminDept('HRMDO Office');
                            setAdminTitle('HRMO Officer');
                          } else {
                            setAdminDept('Computer Studies Department');
                            setAdminTitle('Department Chairperson');
                          }
                        }}
                        required
                      >
                        <option value="Department Head">Department Head</option>
                        <option value="HR Personnel">HR Personnel</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>
                        Assigned Unit / Office <span style={{ color: 'var(--red-600)' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        value={adminDept}
                        onChange={(e) => setAdminDept(e.target.value)}
                        required
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Administrative Title */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>
                      Official Administrative Title <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      required
                      value={adminTitle}
                      onChange={(e) => setAdminTitle(e.target.value)}
                      placeholder="e.g. Department Chairperson / Supervising HRMO"
                    />
                  </div>

                  {/* System-Assigned ID Preview */}
                  <div
                    style={{
                      background: 'var(--brand-50, #fdf2f4)',
                      border: '1px solid var(--brand-200, #f8c5cd)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-800)', textTransform: 'uppercase' }}>
                        Assigned Administrator ID
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '1px' }}>
                        Official institutional personnel identifier
                      </div>
                    </div>
                    <code
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--brand-300, #fca5a5)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--brand-700)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {currentGeneratedId}
                    </code>
                  </div>

                  {/* Contact Number */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>Administrative Phone Contact</label>
                    <input
                      className="form-control"
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="+63 917 888 9922"
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>Create Admin Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-control"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••••"
                          style={{ paddingRight: '34px' }}
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
                            color: 'var(--ink-400)',
                            cursor: 'pointer',
                          }}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px' }}>Confirm Password</label>
                      <input
                        className="form-control"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminConfirm}
                        onChange={(e) => setAdminConfirm(e.target.value)}
                        placeholder="••••••••••"
                      />
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
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(122, 12, 46, 0.25)',
                  }}
                >
                  {isSubmitting ? 'Registering & Activating...' : `Complete ${roleMode === 'cos' ? 'COS Staff' : 'Administrator'} Registration`}
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
