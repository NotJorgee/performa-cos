import React, { useState } from 'react';
import { Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import loginBg from '../../assets/images/login-bg.png';
import { api } from '../../services/api';

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5511 0 .9993.4486.9993 1.0003s-.4482 1.0003-.9993 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5511 0 .9993.4486.9993 1.0003s-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125s-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5676-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3438 14.6589 0 18.75h24c-.3438-4.0911-2.6889-7.5633-6.1185-9.4286" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.56.64-1.05 1.7-0.92 2.73 1.01.08 2.01-.48 2.63-1.23z" />
    </svg>
  );
}

export default function Login({
  onLogin = () => {},
  onForgotPassword = () => {},
  externalErrorMessage = null,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(externalErrorMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  // Live input validity indicators
  const emailTrimmed = email.trim();
  const emailOk = emailTrimmed.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const passwordOk = password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = email.trim();
    if (!inputEmail || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate with real FastAPI + Supabase PostgreSQL backend
      const response = await api.auth.login(inputEmail, password);
      const user = response.user;

      const userAccount = {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        roleLabel: user.role,
        department: user.department,
        departmentId: user.departmentId,
        jobTitle: user.jobTitle || user.role,
        employeeIdNumber: user.employeeIdNumber,
        avatarUrl: user.avatarUrl,
        initials: user.fullName
          ? user.fullName
              .replace(/^(Dr\.|Engr\.|Prof\.)\s*/i, '')
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
          : 'U',
      };

      setWelcomeUser(userAccount);
      setShowWelcome(true);

      setTimeout(() => {
        onLogin(userAccount);
      }, 1800);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(
        err.message ||
          'Invalid institutional credentials. Please check your email and password, or contact HRMDO if your account is locked.'
      );
    }
  };

  return (
    <div className="lv2" data-screen-label="Sign in">
      {/* Background graphic & radial gradient */}
      <div
        className="lv2-bg"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden="true"
      />
      <div className="lv2-gradient" aria-hidden="true" />
      <img
        src={evsuSeal}
        alt=""
        aria-hidden="true"
        className="lv2-watermark"
      />

      <div className="lv2-wrap">
        <div className="lv2-inner">
          {/* Left Column: University Branding & Floating Seal */}
          <div className="lv2-left">
            <img
              src={evsuSeal}
              alt="Eastern Visayas State University seal"
              className="lv2-left-seal"
            />
            <div className="lv2-left-text">
              <div className="lv2-left-title">PerformaCOS</div>
              <div className="lv2-left-sub">Performance Management System</div>
              <div className="lv2-left-rule" />
              <div className="lv2-left-org">Eastern Visayas State University</div>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="lv2-right">
            <img src={evsuSeal} alt="EVSU Seal" className="lv2-mark-mobile" />
            <h1 className="lv2-h1">
              <span className="lv2-brand-desktop">Sign in</span>
              <span className="lv2-brand-mobile">PerformaCOS</span>
            </h1>
            <p className="lv2-sub">
              <span className="lv2-brand-desktop">Use the email address the university gave you.</span>
              <span className="lv2-brand-mobile">Eastern Visayas State University</span>
            </p>

            {/* Legit Warning Alert */}
            {errorMessage && (
              <div className="lv2-error" role="alert">
                <AlertCircle size={19} color="#ffd9e1" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} id="loginForm">
              {/* Email Field */}
              <div className="lv2-field">
                <label htmlFor="loginEmail">Institutional Email</label>
                <div className="lv2-input-wrap">
                  <input
                    className={`lv2-input ${emailOk ? 'ok' : ''}`}
                    type="email"
                    id="loginEmail"
                    name="email"
                    placeholder="name@evsu.edu.ph"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                  <span className={`lv2-check ${emailOk ? 'visible' : ''}`} aria-hidden="true">
                    <Check size={20} strokeWidth={2.6} />
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div className="lv2-field">
                <label htmlFor="loginPassword">Password</label>
                <div className="lv2-input-wrap has-toggle">
                  <input
                    className={`lv2-input ${passwordOk ? 'ok' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    id="loginPassword"
                    name="password"
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                  <span className={`lv2-check ${passwordOk ? 'visible' : ''}`} aria-hidden="true">
                    <Check size={20} strokeWidth={2.6} />
                  </span>
                  <button
                    type="button"
                    className="lv2-pw-toggle"
                    id="passwordToggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="lv2-options" style={{ justifyContent: 'flex-end', marginTop: '2px', marginBottom: '22px' }}>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    onForgotPassword();
                  }}
                  style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', fontWeight: 600 }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`lv2-submit ${isLoading ? 'is-loading' : ''}`}
                id="loginSubmit"
                disabled={isLoading}
              >
                <span className="btn-label">Sign In</span>
                {isLoading && <span className="btn-spinner" aria-hidden="true" />}
              </button>

              {/* Get The App Section */}
              <div className="lv2-app-divider">
                <span>Get the app</span>
              </div>

              <div className="lv2-app-buttons">
                <a
                  href="/downloads/PerformaCOS.apk"
                  download="PerformaCOS.apk"
                  className="lv2-app-btn"
                  title="Download PerformaCOS for Android"
                >
                  <span className="lv2-app-btn-icon"><AndroidIcon /></span>
                  <div className="lv2-app-btn-text">
                    <span className="lv2-app-btn-sub">Get the app for</span>
                    <span className="lv2-app-btn-title">Android</span>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveLegalModal('ios')}
                  className="lv2-app-btn"
                  title="Install PerformaCOS on iOS"
                >
                  <span className="lv2-app-btn-icon"><AppleIcon /></span>
                  <div className="lv2-app-btn-text">
                    <span className="lv2-app-btn-sub">Get the app for</span>
                    <span className="lv2-app-btn-title">iOS</span>
                  </div>
                </button>
              </div>

              {/* Legal & About Footer */}
              <div className="lv2-footer">
                <div className="lv2-legal-links">
                  <button
                    type="button"
                    className="lv2-legal-link-btn"
                    onClick={() => setActiveLegalModal('terms')}
                  >
                    Terms and Conditions
                  </button>
                  <span className="lv2-legal-dot">&bull;</span>
                  <button
                    type="button"
                    className="lv2-legal-link-btn"
                    onClick={() => setActiveLegalModal('privacy')}
                  >
                    Privacy Notice
                  </button>
                  <span className="lv2-legal-dot">&bull;</span>
                  <button
                    type="button"
                    className="lv2-legal-link-btn"
                    onClick={() => setActiveLegalModal('about')}
                  >
                    About
                  </button>
                </div>
                <div className="lv2-legal-copy">
                  &copy; 2026 PerformaCOS. All rights reserved.
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Legal & App Modals */}
      {activeLegalModal && (
        <div
          className="lv2-modal-backdrop"
          onClick={() => setActiveLegalModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lv2-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="lv2-modal-head">
              <h3 className="lv2-modal-title">
                {activeLegalModal === 'ios' && 'PerformaCOS for iOS (iPhone & iPad)'}
                {activeLegalModal === 'terms' && 'Terms and Conditions'}
                {activeLegalModal === 'privacy' && 'Privacy Notice'}
                {activeLegalModal === 'about' && 'About PerformaCOS'}
              </h3>
              <button
                type="button"
                className="lv2-modal-close"
                onClick={() => setActiveLegalModal(null)}
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            <div className="lv2-modal-body">
              {activeLegalModal === 'ios' && (
                <div>
                  <p style={{ marginBottom: '14px', fontSize: '0.95em' }}>
                    You can install PerformaCOS directly on your iPhone or iPad like a regular app without going to the App Store:
                  </p>
                  <ol style={{ lineHeight: '1.7', paddingLeft: '22px', margin: '0 0 16px' }}>
                    <li style={{ marginBottom: '8px' }}>
                      Open this website in <strong>Safari</strong> on your device.
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      Tap the <strong>Share</strong> button (the square icon with an arrow pointing up at the bottom of your screen).
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      Scroll down the menu and tap <strong>"Add to Home Screen"</strong>.
                    </li>
                    <li style={{ marginBottom: '4px' }}>
                      Tap <strong>"Add"</strong> in the top-right corner.
                    </li>
                  </ol>
                  <p style={{ marginTop: '16px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.88em', color: '#475569', lineHeight: '1.55' }}>
                    The PerformaCOS icon will appear on your home screen. Tapping it opens the app in full screen with easy camera access for Daily Accomplishment Reports (DAR) and campus attendance tracking.
                  </p>
                </div>
              )}

              {activeLegalModal === 'terms' && (
                <div>
                  <h4>1. Acceptance of Terms</h4>
                  <p>
                    By accessing or using the PerformaCOS Performance Management System, you agree to comply with all operational guidelines, attendance policies, and institutional standards established by Eastern Visayas State University (EVSU) - Ormoc Campus and the Human Resource Management and Development Office (HRMDO).
                  </p>

                  <h4>2. Authorized Account Access</h4>
                  <p>
                    Access is restricted strictly to active Contract of Service (COS) personnel, Department Heads / Immediate Supervisors, and authorized Human Resource personnel. Sharing account credentials, accessing accounts without authorization, or misrepresenting personnel identity is strictly prohibited and audited via system security logs.
                  </p>

                  <h4>3. Attendance Verification & Daily Accomplishment Reporting (DAR)</h4>
                  <p>
                    All attendance clock-in/clock-out logs and Daily Accomplishment Reports (DAR) submitted through PerformaCOS must reflect authentic, verifiable official duty. Attendance logging is validated against the authorized campus geofence perimeter, and task accomplishments require camera-captured photographic verification. Falsification of attendance or accomplishment records constitutes serious misconduct under Civil Service Commission (CSC) guidelines and university disciplinary policies.
                  </p>

                  <h4>4. Performance Evaluation and Contract Renewal</h4>
                  <p>
                    Performance evaluations, supervisory rubric scores, accomplishment dossiers, and contract renewal recommendations processed via this portal constitute official university administrative records. Evaluation ratings directly inform contract renewal qualification and institutional endorsement.
                  </p>
                </div>
              )}

              {activeLegalModal === 'privacy' && (
                <div>
                  <h4>Republic Act No. 10173 (Data Privacy Act of 2012)</h4>
                  <p>
                    Eastern Visayas State University - Ormoc Campus is committed to safeguarding personal data in accordance with Republic Act No. 10173 (Data Privacy Act of 2012) and National Privacy Commission (NPC) regulations.
                  </p>

                  <h4>Data Collected</h4>
                  <ul>
                    <li><strong>Personnel Identity:</strong> Full name, institutional email address, assigned department, employee identification number, and system role.</li>
                    <li><strong>Attendance & Geolocation:</strong> High-precision device GPS coordinates and server timestamps captured strictly at the moment of clock-in and clock-out to verify physical presence within the campus geofence perimeter. Background location tracking is never conducted.</li>
                    <li><strong>Accomplishment & Task Proof:</strong> Daily accomplishment descriptions, task categories, completion timestamps, and live camera-captured verification photos submitted with daily accomplishment reports.</li>
                  </ul>

                  <h4>Purpose of Processing & Security</h4>
                  <p>
                    Collected information is processed exclusively for official Civil Service Form 48 Daily Time Record (DTR) compilation, semi-monthly payroll packet aggregation, supervisory DAR verification, and Contract of Service performance evaluation and contract renewal workflows. Records are secured using PostgreSQL Row Level Security (RLS) policies, encrypted HTTPS communication, and role-based access restrictions. Personal data is never shared with unauthorized external entities.
                  </p>
                </div>
              )}

              {activeLegalModal === 'about' && (
                <div>
                  <p>
                    <strong>PerformaCOS</strong> is the official Performance Management and Contract Renewal Evaluation System engineered specifically for Contract of Service (COS) personnel at Eastern Visayas State University (EVSU) - Ormoc Campus.
                  </p>
                  <h4>Core Capabilities</h4>
                  <ul>
                    <li><strong>Geofenced Campus Attendance:</strong> Tamper-resistant attendance clock-in and clock-out validated against the EVSU Ormoc Campus geofence perimeter, automatically compiling Civil Service Form 48 Daily Time Records (DTR).</li>
                    <li><strong>Daily Accomplishment Reports (DAR):</strong> Photo-verified daily task tracking with streamlined Department Head review, verification statuses, and monthly accomplishment archiving.</li>
                    <li><strong>Objective Performance Evaluation:</strong> Standardized quantitative evaluation scoring by immediate supervisors, performance category analytics, and objective contract renewal recommendations.</li>
                    <li><strong>HRMDO Payroll & Compliance Packets:</strong> Automated semi-monthly DTR aggregation, departmental attendance rosters, audit-ready compliance reporting, and native Excel data exports.</li>
                  </ul>
                  <p style={{ marginTop: '14px', fontSize: '0.85em', color: '#64748b' }}>
                    PerformaCOS Production System &bull; Eastern Visayas State University - Ormoc Campus &bull; &copy; 2026.
                  </p>
                </div>
              )}
            </div>

            <div className="lv2-modal-foot">
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.88em', borderRadius: '8px' }}
                onClick={() => setActiveLegalModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Login Welcome Transition — Extended duration for readable presentation */}
      {showWelcome && (
        <div className="welcome-overlay" role="status">
          <div>
            <div className="lv2-success-ring-wrap">
              <svg
                className="lv2-success-ring"
                viewBox="0 0 140 140"
                width="220"
                height="220"
                aria-hidden="true"
              >
                <circle
                  cx="70"
                  cy="70"
                  r="61"
                  fill="none"
                  stroke="rgba(255,255,255,.9)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="383"
                />
              </svg>
              <img
                src={evsuSeal}
                alt=""
                aria-hidden="true"
                className="lv2-success-seal"
              />
            </div>
            <div className="lv2-success-title">Welcome to PerformaCOS</div>
            <div className="lv2-success-sub">
              Signing in as {welcomeUser?.roleLabel || welcomeUser?.role || 'User'} &bull; {welcomeUser?.fullName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
