import React, { useState } from 'react';

export default function ProfileSettings({
  currentUser = {
    fullName: 'Jorge Mikhael Gubantes',
    email: 'jorge.gubantes@evsu.edu.ph',
    role: 'COS Employee',
    department: 'Computer Studies Department',
    employeeIdNumber: '2026-00101',
    contactNumber: '+63 912 345 6789',
    avatarUrl: null,
  },
  onUpdateProfile = () => {},
  onChangePassword = () => {},
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [contactNumber, setContactNumber] = useState(currentUser.contactNumber || '');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);

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
            Manage your personal contact details, profile picture, and secure password credentials.
          </p>
        </div>
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile Information (FR-24, FR-25)
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'security' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 Security &amp; Password
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: '640px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>Account Information</div>
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
              <label>Full Name</label>
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
