import React, { useState } from 'react';
import { Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import loginBg from '../../assets/images/login-bg.png';

export const DEMO_CREDENTIALS = [
  {
    roleName: 'COS',
    roleLabel: 'COS Employee',
    email: 'COS@evsu.edu.ph',
    password: '@Password_123',
    fullName: 'Jorge Mikhael Gubantes',
    department: 'Computer Studies Department',
    initials: 'JG',
    employeeIdNumber: 'G10222026JMR',
    avatarUrl: null,
  },
  {
    roleName: 'Department Head',
    roleLabel: 'Department Head',
    email: 'DH@evsu.edu.ph',
    password: '@Password_123',
    fullName: 'Engr. Roberto Del Rosario',
    department: 'Computer Studies Department',
    initials: 'RD',
    employeeIdNumber: 'D10222026RDR',
    avatarUrl: null,
  },
  {
    roleName: 'HR',
    roleLabel: 'HR Personnel',
    email: 'HR@evsu.edu.ph',
    password: '@Password_123',
    fullName: 'Dr. Maria Clara Ramos',
    department: 'HRMDO Office',
    initials: 'MR',
    employeeIdNumber: 'R10222026MCR',
    avatarUrl: null,
  },
];

export default function Login({
  onLogin = () => {},
  onForgotPassword = () => {},
  externalErrorMessage = null,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMessage, setErrorMessage] = useState(externalErrorMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);

  // Live input validity indicators
  const emailTrimmed = email.trim();
  const emailOk = emailTrimmed.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const passwordOk = password.length >= 6;

  const handleFillDemo = (demoItem) => {
    setEmail(demoItem.email);
    setPassword(demoItem.password);
    setErrorMessage(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedInputEmail = email.trim().toLowerCase();
    const matchedAccount = DEMO_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === normalizedInputEmail
    );

    // Legitimate institutional security warning without exposing credential details
    if (!matchedAccount || password !== matchedAccount.password) {
      setErrorMessage(
        'Invalid institutional credentials. Please check your email and password, or contact HRMDO if your account is locked.'
      );
      return;
    }

    // Success! Show loading & extended welcome animation so user can comfortably read it
    setIsLoading(true);
    setWelcomeUser(matchedAccount);
    setShowWelcome(true);

    setTimeout(() => {
      onLogin(matchedAccount);
    }, 2800);
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
            <h1 className="lv2-h1">Sign in</h1>
            <p className="lv2-sub">Use the email address the university gave you.</p>

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
                    autoFocus
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
              <div className="lv2-options">
                <label className="lv2-remember">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    onForgotPassword();
                  }}
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

              {/* Quick Demo Credentials Autofill */}
              <div className="lv2-demo-card">
                <div className="lv2-demo-head">
                  <span>Demo Quick Select</span>
                  <span style={{ opacity: 0.7 }}>1-click credentials setup</span>
                </div>
                <div className="lv2-demo-buttons">
                  {DEMO_CREDENTIALS.map((demo) => (
                    <button
                      key={demo.roleName}
                      type="button"
                      className="lv2-demo-btn"
                      onClick={() => handleFillDemo(demo)}
                      title={`Select ${demo.roleLabel}`}
                    >
                      {demo.roleName}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

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
              Signing in as {welcomeUser?.roleLabel || 'User'} &bull; {welcomeUser?.fullName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
