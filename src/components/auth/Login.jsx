import React, { useState } from 'react';
import { Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import loginBg from '../../assets/images/login-bg.png';
import { api } from '../../services/api';

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

              {/* Institutional Footer */}
              <div className="lv2-footer" style={{ marginTop: '28px' }}>
                <span>Official Institutional Portal &bull; Eastern Visayas State University</span>
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
              Signing in as {welcomeUser?.roleLabel || welcomeUser?.role || 'User'} &bull; {welcomeUser?.fullName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
