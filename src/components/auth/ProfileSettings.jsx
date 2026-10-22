import React, { useState, useEffect } from 'react';

export default function ProfileSettings({
  currentUser = {
    fullName: 'Jorge Mikhael Gubantes',
    email: 'jorge.gubantes@evsu.edu.ph',
    role: 'COS Employee',
    department: 'Computer Studies Department',
    position: 'College Office Staff',
    cosCategory: 'Administrative',
    employeeIdNumber: 'G10222026JMR',
    contactNumber: '+63 912 345 6789',
    avatarUrl: null,
  },
  initialTab = 'profile',
  onBack = null,
  onUpdateProfile = () => {},
  onChangePassword = () => {},
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'account' | 'security'
  const [contactNumber, setContactNumber] = useState(currentUser.contactNumber || '');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);

  // Sync tab with initialTab prop when navigating from burger menu
  useEffect(() => {
    if (initialTab === 'change_password' || initialTab === 'security') {
      setActiveTab('security');
    } else if (initialTab === 'account_settings' || initialTab === 'account') {
      setActiveTab('account');
    } else {
      setActiveTab('profile');
    }
  }, [initialTab]);

  // Security password fields (FR-24)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({ contactNumber, alternateEmail, avatarUrl: avatarPreview });
    setToastMsg('Personal contact information updated successfully (UC-11).');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }
    onChangePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToastMsg('Password securely updated with BCRYPT encryption (UC-11, FR-24).');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Personal Profile &amp; Security (UC-11)</h1>
          <p className="muted" style={{ margin: 0 }}>
            View your institutional profile, manage personal contact details, and update secure credentials.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {toastMsg}
        </div>
      )}

      {errorMsg && (
        <div className="flash flash-danger" style={{ marginBottom: '16px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          ◉ View Profile
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'account' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          ⚙ Account Settings
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'security' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔑 Change Password
        </button>
      </div>

      {/* 1. VIEW PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--line)', marginBottom: '20px' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'var(--brand-50)',
                border: '2px solid var(--brand-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                color: 'var(--brand-700)',
                fontWeight: 700,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
              )}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-900)' }}>
                {currentUser.fullName}
              </div>
              <div className="muted" style={{ fontSize: '13px', marginTop: '2px' }}>
                {currentUser.position || 'College Office Staff'} · {currentUser.department}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-completed">Active Contract</span>
                <span className="badge badge-dept">{currentUser.cosCategory || 'Administrative'}</span>
              </div>
            </div>
          </div>

          <div className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
            Institutional Profile Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Employee ID</span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px' }}>{currentUser.employeeIdNumber || 'G10222026JMR'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Institutional Email</span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px', wordBreak: 'break-all' }}>{currentUser.email || 'jorge.gubantes@evsu.edu.ph'}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Assigned College / Dept</span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px' }}>{currentUser.department}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Campus Assignment</span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px' }}>EVSU - Ormoc Campus</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Contract Term</span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px' }}>July 01, 2026 – Dec 31, 2026</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Contact Phone</span>
              <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px' }}>{contactNumber || 'Not provided'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setActiveTab('account')}
            >
              ⚙ Edit Account Settings →
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setActiveTab('security')}
            >
              🔑 Change Password →
            </button>
          </div>
        </div>
      )}

      {/* 2. ACCOUNT SETTINGS TAB */}
      {activeTab === 'account' && (
        <div className="card" style={{ maxWidth: '640px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>Account Settings &amp; Personal Info</div>
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--brand-50)',
                  border: '2px solid var(--brand-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  color: 'var(--brand-700)',
                  fontWeight: 700,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
                )}
              </div>
              <div>
                <label className="btn btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  Upload Profile Picture (FR-25)
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ marginLeft: '8px', color: 'var(--red-600)' }}
                    onClick={() => setAvatarPreview(null)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Full Legal Name (Institutional Record)</label>
              <input className="form-control" type="text" disabled value={currentUser.fullName} />
            </div>

            <div className="form-group">
              <label>Institutional Email (EVSU)</label>
              <input className="form-control" type="email" disabled value={currentUser.email} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assigned Department</label>
                <input className="form-control" type="text" disabled value={currentUser.department} />
              </div>
              <div className="form-group">
                <label>System Role</label>
                <input className="form-control" type="text" disabled value={currentUser.role} />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                className="form-control"
                type="text"
                placeholder="+63 9XX XXX XXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Alternate Email (Optional)</label>
              <input
                className="form-control"
                type="email"
                placeholder="personal@gmail.com"
                value={alternateEmail}
                onChange={(e) => setAlternateEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save Contact Details
            </button>
          </form>
        </div>
      )}

      {/* 3. CHANGE PASSWORD TAB */}
      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: '540px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>Change Account Password (FR-24)</div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                className="form-control"
                type="password"
                required
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>New Password (min 8 characters)</label>
              <input
                className="form-control"
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                className="form-control"
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Update Password with BCRYPT Hashing
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
