import React, { useState } from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';

export default function ResetNewPassword({
  onResetPassword = () => {},
  errorMessage = null,
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password rules validation
  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol && passwordsMatch;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    setIsLoading(true);
    onResetPassword({ newPassword, confirmPassword });
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
            <span className="auth-feature-icon"><i>🛡</i></span>
            <b>Strong Password</b>
            <small>12+ chars, mixed symbols</small>
          </div>
          <div>
            <span className="auth-feature-icon"><i>👁</i></span>
            <b>Show / Hide</b>
            <small>Verify before submitting</small>
          </div>
          <div>
            <span className="auth-feature-icon"><i>✓</i></span>
            <b>Live Checklist</b>
            <small>Real-time requirements validation</small>
          </div>
          <div>
            <span className="auth-feature-icon"><i>🔒</i></span>
            <b>BCRYPT Hashed</b>
            <small>Irreversible secure storage</small>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-panel-inner">
          <div className="auth-card">
            <div className="auth-card-brand">
              <span className="auth-card-brand-title">Create a new password</span>
              <span className="auth-card-brand-sub">PerformaCOS — Performance Management System</span>
              <span className="auth-card-brand-org">Eastern Visayas State University</span>
            </div>
            <img src={evsuSeal} alt="EVSU Seal" className="auth-mark-mobile" />

            <div className="auth-steps" aria-label="Step 3 of 3">
              Step 3 of 3
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot on"></span>
            </div>

            {errorMessage && (
              <div className="flash-stack">
                <div className="flash flash-danger flash-shake">{errorMessage}</div>
              </div>
            )}

            <p className="muted" style={{ margin: '0 0 18px' }}>
              Your OTP code checked out successfully. Set your new secure password below to complete account recovery.
            </p>

            <form onSubmit={handleSubmit} id="pwForm">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">🔒</span>
                  <input
                    className="form-control"
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    placeholder="At least 12 characters"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? '👁‍🗨' : '👁'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">🔒</span>
                  <input
                    className="form-control"
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Password checklist */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', marginBottom: '18px', fontSize: '13px' }}>
                <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--ink-700)' }}>Password Requirements:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span style={{ color: hasMinLength ? 'var(--green-600)' : 'var(--ink-500)' }}>
                    {hasMinLength ? '✓' : '○'} 12+ Characters
                  </span>
                  <span style={{ color: hasUpper ? 'var(--green-600)' : 'var(--ink-500)' }}>
                    {hasUpper ? '✓' : '○'} Uppercase Letter
                  </span>
                  <span style={{ color: hasLower ? 'var(--green-600)' : 'var(--ink-500)' }}>
                    {hasLower ? '✓' : '○'} Lowercase Letter
                  </span>
                  <span style={{ color: hasNumber ? 'var(--green-600)' : 'var(--ink-500)' }}>
                    {hasNumber ? '✓' : '○'} Number
                  </span>
                  <span style={{ color: hasSymbol ? 'var(--green-600)' : 'var(--ink-500)' }}>
                    {hasSymbol ? '✓' : '○'} Special Symbol
                  </span>
                  <span style={{ color: passwordsMatch ? 'var(--green-600)' : 'var(--ink-500)' }}>
                    {passwordsMatch ? '✓' : '○'} Passwords Match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={!isValid || isLoading}
              >
                <span className="btn-label">{isLoading ? 'Saving Password...' : 'Save New Password & Sign In'}</span>
              </button>
            </form>

            <div className="auth-footer">Secured with EVSU Authentication &amp; BCRYPT</div>
          </div>
        </div>
      </div>
    </div>
  );
}
