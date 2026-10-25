import React, { useState } from 'react';
import { Mail, Clock, Lock, ShieldCheck } from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';

export default function ForgotPassword({
  onSubmitEmail = () => {},
  onBackToLogin = () => {},
  statusMessage = null,
}) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    onSubmitEmail(email);
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
            <span className="auth-feature-icon"><Mail size={18} /></span>
            <b>Email OTP Verification</b>
            <small>Code sent to institutional email</small>
          </div>
          <div>
            <span className="auth-feature-icon"><Clock size={18} /></span>
            <b>Time-Limited</b>
            <small>Expires in 10 minutes</small>
          </div>
          <div>
            <span className="auth-feature-icon"><Lock size={18} /></span>
            <b>One-Time Code</b>
            <small>Single use security token</small>
          </div>
          <div>
            <span className="auth-feature-icon"><ShieldCheck size={18} /></span>
            <b>Anti-Enumeration</b>
            <small>Protected verification layer</small>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-panel-inner">
          <div className="auth-card">
            <div className="auth-card-brand">
              <span className="auth-card-brand-title">Reset Password</span>
              <span className="auth-card-brand-sub">PerformaCOS — Performance Management System</span>
              <span className="auth-card-brand-org">Eastern Visayas State University</span>
            </div>
            <img src={evsuSeal} alt="EVSU Seal" className="auth-mark-mobile" />

            <div className="auth-steps" aria-label="Step 1 of 3">
              Step 1 of 3
              <span className="dot on"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>

            {statusMessage && (
              <div className="flash-stack">
                <div className="flash flash-info">{statusMessage}</div>
              </div>
            )}

            <p className="muted" style={{ margin: '0 0 18px' }}>
              Enter your registered institutional email address. If the account exists in the database,
              we will dispatch an email-delivered one-time password (OTP) to securely verify your identity.
            </p>

            <form onSubmit={handleSubmit} id="forgotForm">
              <div className="form-group">
                <label htmlFor="resetEmail">Institutional Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    className="form-control"
                    type="email"
                    id="resetEmail"
                    name="email"
                    placeholder="name@evsu.edu.ph"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoading}
              >
                <span className="btn-label">{isLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <a
                  href="#login"
                  className="auth-link"
                  onClick={(e) => { e.preventDefault(); onBackToLogin(); }}
                >
                  ← Back to Sign In
                </a>
              </div>
            </form>

            <div className="auth-footer">Secured with EVSU Authentication &amp; OTP Layer</div>
          </div>
        </div>
      </div>
    </div>
  );
}
