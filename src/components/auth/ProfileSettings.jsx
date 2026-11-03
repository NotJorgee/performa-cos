import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Key,
  Lock,
  Shield,
  Bell,
  Laptop,
  Smartphone,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';

export default function ProfileSettings({
  currentUser = {
    fullName: 'Jorge Mikhael Gubantes',
    email: 'jorge.gubantes@evsu.edu.ph',
    role: 'COS Employee',
    department: 'Computer Studies Department',
    jobTitle: 'Admin Aide',
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
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'notifications' | 'sessions'

  // Editable Contact State
  const [contactNumber, setContactNumber] = useState(currentUser.contactNumber || '+63 912 345 6789');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [officeLocation, setOfficeLocation] = useState(
    currentUser.role === 'Department Head'
      ? 'College of Technology, Rm 204'
      : currentUser.role === 'HR Personnel'
      ? 'HRMDO Central Office, Administration Bldg'
      : 'CSD Office Staff Station, Tech Bldg'
  );
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);

  // Password Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Notification Preferences State
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [contractNotices, setContractNotices] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  // Active Sessions State
  const [currentSessionInfo, setCurrentSessionInfo] = useState(null);
  const [otherSessions, setOtherSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const list = await api.sessions.list();
        if (Array.isArray(list)) {
          const current = list.find((s) => s.isCurrentSession) || list[0];
          const others = list.filter((s) => !s.isCurrentSession);
          if (current) {
            setCurrentSessionInfo({
              device: current.deviceDescription || 'Web Browser',
              network: `${current.networkInfo || 'Broadband'} (IP: ${current.ipAddress || '127.0.0.1'})`,
              lastActive: 'Active Now (This Device)',
              type: (current.deviceDescription || '').toLowerCase().includes('phone') ? 'mobile' : 'laptop',
            });
          }
          setOtherSessions(
            others.map((o) => ({
              id: o.id,
              device: o.deviceDescription || 'Web Browser',
              network: `${o.networkInfo || 'Broadband'} (IP: ${o.ipAddress || '127.0.0.1'})`,
              lastActive: o.lastActive ? new Date(o.lastActive).toLocaleString() : 'Recently Active',
              type: (o.deviceDescription || '').toLowerCase().includes('phone') ? 'mobile' : 'laptop',
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load user sessions:', err);
      }
    };
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  // Flash Feedback
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync tab with initialTab prop
  useEffect(() => {
    if (initialTab === 'change_password' || initialTab === 'security') {
      setActiveTab('security');
    } else if (initialTab === 'notifications') {
      setActiveTab('notifications');
    } else if (initialTab === 'sessions') {
      setActiveTab('sessions');
    } else {
      setActiveTab('profile');
    }
  }, [initialTab]);

  // Password Strength Evaluation
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!newPassword) return { text: 'Not entered', color: 'var(--muted)' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'var(--red-600)' };
    if (strengthScore === 2) return { text: 'Fair', color: 'var(--amber-600)' };
    if (strengthScore === 3) return { text: 'Good', color: '#0284c7' };
    return { text: 'Strong', color: 'var(--green-700)' };
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({
      contactNumber,
      alternateEmail,
      emergencyContact,
      officeLocation,
      avatarUrl: avatarPreview,
    });
    setToastMsg('Personal contact information updated successfully.');
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
    if (strengthScore < 3) {
      setErrorMsg('Please choose a stronger password matching the security criteria.');
      return;
    }
    onChangePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToastMsg('Password successfully updated.');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    setToastMsg('Notification & communication preferences saved.');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.sessions.revoke(sessionId);
      setOtherSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setToastMsg('Selected device session was revoked successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revoke session.');
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSignOutAllOther = async () => {
    try {
      await api.sessions.revokeAllOthers();
      setOtherSessions([]);
      setToastMsg('All other device sessions have been terminated. You remain active on this computer.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revoke other sessions.');
    }
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setToastMsg('Profile avatar updated.');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Department Head':
        return { label: 'Department Head', badgeClass: 'badge-confirmed', icon: Building2 };
      case 'HR Personnel':
        return { label: 'HRMO Administrator', badgeClass: 'badge-dept', icon: Shield };
      case 'COS Employee':
      default:
        return { label: 'COS Personnel', badgeClass: 'badge-completed', icon: User };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={26} color="var(--brand-700)" />
            Personal Profile &amp; Security
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
            Manage your personal contact info, review official institutional credentials, and secure your account.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack} style={{ cursor: 'pointer' }}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flash flash-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Universal 4-Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <User size={15} /> Profile Overview
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'security' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('security')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Key size={15} /> Security &amp; Credentials
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'notifications' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('notifications')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Bell size={15} /> Notifications &amp; Alerts
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('sessions')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Laptop size={15} /> Active Sessions
        </button>
      </div>

      {/* TAB 1: PROFILE OVERVIEW (Universal) */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Identity Hero Banner Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '82px',
                  height: '82px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--brand-700), var(--brand-500))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  color: '#fff',
                  fontWeight: 800,
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '3px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                )}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span className="emp-id-chip" style={{ margin: 0 }}>
                    {currentUser.employeeIdNumber || 'G10222026JMR'}
                  </span>
                  <span
                    className={`badge ${roleInfo.badgeClass}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px' }}
                  >
                    <RoleIcon size={12} /> {roleInfo.label}
                  </span>
                </div>
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', color: 'var(--ink-900)' }}>
                  {currentUser.fullName}
                </h2>
                <div className="muted" style={{ fontSize: '13px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span>{currentUser.jobTitle || (currentUser.role === 'COS Employee' ? 'Admin Aide' : currentUser.role)}</span>
                  <span>•</span>
                  <span>{currentUser.department}</span>
                  <span>•</span>
                  <span>EVSU — Ormoc Campus</span>
                </div>
              </div>

              <div>
                <label
                  className="btn btn-sm"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  Change Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ marginLeft: '8px', color: 'var(--red-600)', cursor: 'pointer' }}
                    onClick={() => setAvatarPreview(null)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section A: Institutional Identity (HRMO-Locked) */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} color="var(--ink-600)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink-900)' }}>
                  Official Institutional Identity
                </h3>
              </div>
              <span className="badge badge-dept" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={11} /> HRMDO Managed Records
              </span>
            </div>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '12.5px', lineHeight: 1.45 }}>
              Official university personnel records are maintained by the Human Resource Management Office. For legal name or primary assignment adjustments, please contact the HR office.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Employee ID
                  </span>
                  <Lock size={12} color="var(--ink-400)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px', color: 'var(--ink-900)' }}>
                  {currentUser.employeeIdNumber || 'G10222026JMR'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Employee Job Title
                  </span>
                  <Lock size={12} color="var(--ink-400)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px', color: 'var(--ink-900)' }}>
                  {currentUser.jobTitle || (currentUser.role === 'COS Employee' ? 'Admin Aide' : currentUser.role)}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Institutional Email
                  </span>
                  <Lock size={12} color="var(--ink-400)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px', color: 'var(--ink-900)', wordBreak: 'break-all' }}>
                  {currentUser.email || 'jorge.gubantes@evsu.edu.ph'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Assigned Department
                  </span>
                  <Lock size={12} color="var(--ink-400)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px', color: 'var(--ink-900)' }}>
                  {currentUser.department}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    System Role &amp; Access Tier
                  </span>
                  <Lock size={12} color="var(--ink-400)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '3px', color: 'var(--ink-900)' }}>
                  {currentUser.role}
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Personal Contact & Details (Editable) */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--ink-900)' }}>
              Personal Contact &amp; Operational Info
            </h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '12.5px', lineHeight: 1.45 }}>
              Self-service contact information utilized for operational routing, deadline reminders, and emergency communications.
            </p>

            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Mobile Contact Number <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    style={{ fontSize: '13.5px' }}
                    placeholder="+63 9XX XXX XXXX"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Alternate Recovery Email
                  </label>
                  <input
                    className="form-control"
                    type="email"
                    style={{ fontSize: '13.5px' }}
                    placeholder="personal@gmail.com"
                    value={alternateEmail}
                    onChange={(e) => setAlternateEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Emergency Contact Person &amp; Phone
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    style={{ fontSize: '13.5px' }}
                    placeholder="e.g. Maria Clara Ramos (+63 917 111 2233)"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Office Station / Room Location
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    style={{ fontSize: '13.5px' }}
                    placeholder="e.g. Technology Bldg, Room 204"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ cursor: 'pointer', fontWeight: 700 }}>
                  Save Contact Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & CREDENTIALS (Universal) */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Change Account Password Card */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--ink-900)' }}>
              Change Account Password
            </h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '12.5px' }}>
              Ensure your new password meets the security requirements below. Your password is encrypted and stored securely.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Current Password <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    style={{ paddingRight: '40px', fontSize: '13.5px' }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-400)',
                    }}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                    New Password <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  {newPassword && (
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: getStrengthLabel().color }}>
                      Strength: {getStrengthLabel().text}
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type={showNewPw ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    style={{ paddingRight: '40px', fontSize: '13.5px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-400)',
                    }}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                <div style={{ marginTop: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                  <span className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Password Security Criteria:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '12px' }}>
                    <span style={{ color: hasLength ? 'var(--green-700)' : 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {hasLength ? '✓' : '○'} At least 8 characters
                    </span>
                    <span style={{ color: hasUpper ? 'var(--green-700)' : 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {hasUpper ? '✓' : '○'} Contains uppercase letter
                    </span>
                    <span style={{ color: hasNumber ? 'var(--green-700)' : 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {hasNumber ? '✓' : '○'} Contains a number
                    </span>
                    <span style={{ color: hasSpecial ? 'var(--green-700)' : 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {hasSpecial ? '✓' : '○'} Contains special symbol
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Confirm New Password <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    style={{ paddingRight: '40px', fontSize: '13.5px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-400)',
                    }}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <span style={{ fontSize: '11.5px', color: 'var(--red-600)', marginTop: '4px', display: 'block' }}>
                    Passwords do not match.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ cursor: 'pointer', fontWeight: 700 }}>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS & ALERTS (Universal) */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '22px 24px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--ink-900)' }}>
            Notification &amp; Communication Preferences
          </h3>
          <p className="muted" style={{ margin: '0 0 20px', fontSize: '12.5px' }}>
            Choose which operational alerts, evaluation milestones, and administrative updates you receive.
          </p>

          <form onSubmit={handleNotificationSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={deadlineAlerts}
                  onChange={(e) => setDeadlineAlerts(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <div>
                  <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>Evaluation &amp; Monthly Report Deadlines</b>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    Receive email &amp; in-app alerts 72 hours and 24 hours prior to MAR cut-offs and evaluation cycles.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={contractNotices}
                  onChange={(e) => setContractNotices(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <div>
                  <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>Contract Renewal &amp; Expiration Warnings</b>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    Notifications when a 6-month contract enters the 60-day or 30-day renewal intent window.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={approvalAlerts}
                  onChange={(e) => setApprovalAlerts(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <div>
                  <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>Review Confirmations &amp; Feedback Updates</b>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    Immediate alerts when a supervisor signs a monthly report or releases triad evaluation results.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <div>
                  <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>SMS Urgent Alerts</b>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    Dispatch critical time-sensitive notices directly to verified phone: {contactNumber}.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ cursor: 'pointer', fontWeight: 700 }}>
                Save Notification Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ACTIVE SESSIONS & DEVICES (Universal) */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--ink-900)' }}>
                  Active Web Sessions &amp; Devices
                </h3>
                <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>
                  Review all active logins across campus desktop workstations, home computers, and mobile devices.
                </p>
              </div>
              {otherSessions.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleSignOutAllOther}
                  style={{
                    color: 'var(--red-600)',
                    borderColor: '#fecaca',
                    background: 'var(--red-50)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <LogOut size={14} /> Sign Out of All Other Devices
                </button>
              )}
            </div>

            {/* Current Session */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', color: 'var(--green-700)', border: '1px solid #bbf7d0' }}>
                  <Laptop size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <b style={{ fontSize: '14px', color: 'var(--ink-900)' }}>
                      {currentSessionInfo?.device || 'This Device · Web Browser'}
                    </b>
                    <span className="badge badge-active" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                      Current Session
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    {currentSessionInfo?.network || 'Active Connection'} • {currentSessionInfo?.lastActive || 'Active Now (This Device)'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green-700)' }}>
                Active
              </span>
            </div>

            {/* Secondary Active Sessions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {otherSessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    background: '#fafbfc',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', color: 'var(--ink-600)', border: '1px solid var(--line)' }}>
                      {session.type === 'mobile' ? <Smartphone size={20} /> : <Laptop size={20} />}
                    </div>
                    <div>
                      <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>{session.device}</b>
                      <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                        {session.network} • Last active: {session.lastActive}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => handleRevokeSession(session.id)}
                    style={{ fontSize: '12px', color: 'var(--red-600)', cursor: 'pointer' }}
                  >
                    Revoke Session
                  </button>
                </div>
              ))}

              {otherSessions.length === 0 && (
                <div style={{ padding: '18px', textAlign: 'center', background: '#fafbfc', borderRadius: '8px', border: '1px dashed var(--line)' }}>
                  <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                    No other active sessions. You are only signed in on this current browser.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
