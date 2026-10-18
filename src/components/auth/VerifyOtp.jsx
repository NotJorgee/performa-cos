import React, { useState } from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';

export default function VerifyOtp({
  emailHint = 'user@evsu.edu.ph',
  onVerifyOtp = () => {},
  onResendOtp = () => {},
  onBack = () => {},
  errorMessage = null,
}) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    onVerifyOtp(otp);
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
            <span className="auth-feature-icon"><i>✉</i></span>
            <b>Check Your Inbox</b>
            <small>OTP sent to {emailHint}</small>
          </div>
          <div>
            <span className="auth-feature-icon"><i>⏱</i></span>
            <b>Time-Limited</b>
            <small>Expires in 10 minutes</small>
          </div>
          <div>
            <span className="auth-feature-icon"><i>🔄</i></span>
            <b>Resend</b>
            <small>Didn't get it? Request new OTP</small>
          </div>
          <div>
            <span className="auth-feature-icon"><i>🛡</i></span>
            <b>One-Time Code</b>
            <small>Single use only</small>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-panel-inner">
          <div className="auth-card">
            <div className="auth-card-brand">
              <span className="auth-card-brand-title">Enter your code</span>
              <span className="auth-card-brand-sub">PerformaCOS — Performance Management System</span>
              <span className="auth-card-brand-org">Eastern Visayas State University</span>
            </div>
            <img src={evsuSeal} alt="EVSU Seal" className="auth-mark-mobile" />

            <div className="auth-steps" aria-label="Step 2 of 3">
              Step 2 of 3
              <span className="dot"></span>
              <span className="dot on"></span>
              <span className="dot"></span>
            </div>

            {errorMessage && (
              <div className="flash-stack">
                <div className="flash flash-danger flash-shake">{errorMessage}</div>
              </div>
            )}

            <p className="muted" style={{ margin: '0 0 18px' }}>
              We sent a 6-digit verification code to <b>{emailHint}</b>. Enter it below — it expires in 10 minutes.
            </p>

            <form onSubmit={handleSubmit} id="otpForm">
              <div className="form-group">
                <label htmlFor="otpCode">6-Digit Code</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">🔢</span>
                  <input
                    className="form-control"
                    type="text"
                    id="otpCode"
                    name="otp"
                    placeholder="123456"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    style={{ letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoading || otp.length !== 6}
              >
                <span className="btn-label">{isLoading ? 'Validating...' : 'Verify Code'}</span>
              </button>

              <div className="flex-between" style={{ marginTop: '16px' }}>
                <a
                  href="#back"
                  className="auth-link"
                  onClick={(e) => { e.preventDefault(); onBack(); }}
                >
                  ← Change Email
                </a>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={onResendOtp}
                  style={{ background: 'transparent', border: 'none', color: 'var(--brand-600)' }}
                >
                  Resend Code
                </button>
              </div>
            </form>

            <div className="auth-footer">Secured with EVSU Authentication &amp; OTP Layer</div>
          </div>
        </div>
      </div>
    </div>
  );
}
