import React, { useState } from 'react';
import { Settings, Lock, MapPin, Zap, Mail, Eye, EyeOff } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';

export default function Login({
  onLogin = () => {},
  onForgotPassword = () => {},
  errorMessage = null,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    onLogin({ email, password, remember });
  };

  return (
    <div className="auth-split">
      <div className="auth-hero">
        <div className="auth-hero-bg" aria-hidden="true"></div>
        <div className="auth-hero-rings" aria-hidden="true"></div>

        <div className="auth-hero-inner">
          <div className="auth-hero-brand">
            <img src={evsuSeal} alt="EVSU Seal" className="auth-hero-seal" />
          </div>
        </div>

        <div className="auth-feature-strip">
          <div>
            <span className="auth-feature-icon"><Settings size={18} /></span>
            <b>Smart Automation</b>
            <small>Automated Evaluation Cycles</small>
          </div>
          <div>
            <span className="auth-feature-icon"><Lock size={18} /></span>
            <b>Secure Access</b>
            <small>Role-Based Authentication</small>
          </div>
          <div>
            <span className="auth-feature-icon"><MapPin size={18} /></span>
            <b>Geofenced DAR</b>
            <small>Campus Boundary Validated</small>
          </div>
          <div>
            <span className="auth-feature-icon"><Zap size={18} /></span>
            <b>AI MAR Summary</b>
            <small>Fast-Track Decision Support</small>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-panel-inner">
          <div className="auth-card">
            <div className="auth-card-brand">
              <span className="auth-card-brand-title">PerformaCOS</span>
              <span className="auth-card-brand-sub">Performance Management System</span>
              <span className="auth-card-brand-org">Eastern Visayas State University</span>
            </div>
            <img src={evsuSeal} alt="EVSU Seal" className="auth-mark-mobile" />

            {errorMessage && (
              <div className="flash-stack">
                <div className="flash flash-danger flash-shake">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} id="loginForm">
              <div className="form-group">
                <label htmlFor="loginEmail">Institutional Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    className="form-control"
                    type="email"
                    id="loginEmail"
                    name="email"
                    placeholder="name@evsu.edu.ph"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    className="form-control"
                    type={showPassword ? 'text' : 'password'}
                    id="loginPassword"
                    name="password"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    id="passwordToggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />{' '}
                  Remember me
                </label>
                <a
                  className="auth-link"
                  href="#forgot-password"
                  onClick={(e) => { e.preventDefault(); onForgotPassword(); }}
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                id="loginSubmit"
                disabled={isLoading}
              >
                <span className="btn-label">{isLoading ? 'Signing In...' : 'Sign In'}</span>
                {isLoading && <span className="btn-spinner" aria-hidden="true"></span>}
              </button>
            </form>

            <div className="auth-footer">Secured with EVSU Authentication &amp; BCRYPT</div>
          </div>
        </div>
      </div>
    </div>
  );
}
