import React, { useState, useEffect } from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import CampusGeofenceModal from '../common/CampusGeofenceModal';

export default function AppLayout({
  children,
  currentUser = {
    fullName: 'Jorge Mikhael Gubantes',
    role: 'COS Employee', // 'COS Employee' | 'Department Head' | 'HR Personnel'
    department: 'Computer Studies Department',
    initials: 'JG',
    avatarUrl: null,
  },
  currentPath = 'dashboard',
  onNavigate = () => {},
  onLogout = () => {},
}) {
  // Sidebar only pops up when pressing the menu button (Off-canvas drawer)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);

  // In-system notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Evaluation Period Initiated',
      message: '1st Semester 2026-2027 evaluation period is active. Deadline is Nov 15, 2026.',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Geofenced DAR Validated',
      message: 'Your end-of-shift DAR task log was verified within EVSU-Ormoc campus bounds.',
      time: 'Today, 4:45 PM',
      unread: true,
    },
    {
      id: 3,
      title: 'Contract Expiration Alert',
      message: 'Your 6-month Contract of Service enters the renewal confirmation window in 14 days.',
      time: 'Yesterday',
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavClick = (path) => {
    onNavigate(path);
    closeSidebar();
  };

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell">
      {/* Off-Canvas Backdrop: Clicking outside closes the drawer */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* POP-UP SIDEBAR DRAWER: Only visible when menu button is pressed */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Main Navigation">
        {/* Brand Header with Close Button */}
        <div className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img className="brand-mark" src={evsuSeal} alt="EVSU Seal" />
            <div className="brand-text">
              <div className="brand-title">PerformaCOS</div>
              <div className="brand-sub">EVSU PERFORMANCE MANAGEMENT</div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: 'var(--ink-500)',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        {/* Navigation Items strictly mapped per SRS Section 8.1 */}
        <nav className="nav">
          <a
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
            className={`nav-item ${currentPath === 'dashboard' ? 'active' : ''}`}
          >
            <span className="icon">▦</span> Dashboard
          </a>

          {/* Institutional Campus Geofence (Universal scope for all departments) */}
          {(currentUser.role === 'HR Personnel' || currentUser.role === 'Department Head') && (
            <a
              href="#campus-geofence"
              onClick={(e) => {
                e.preventDefault();
                closeSidebar();
                setShowGeofenceModal(true);
              }}
              className="nav-item"
            >
              <span className="icon">📍</span> Campus Geofence
            </a>
          )}

          {/* Role-Unified Burger Menu: Dashboard, View Profile, Account Settings, Logout */}
          <a
            href="#view-profile"
            onClick={(e) => { e.preventDefault(); handleNavClick('view_profile'); }}
            className={`nav-item ${currentPath === 'view_profile' ? 'active' : ''}`}
          >
            <span className="icon">◉</span> View Profile
          </a>
          <a
            href="#account-settings"
            onClick={(e) => { e.preventDefault(); handleNavClick('account_settings'); }}
            className={`nav-item ${currentPath === 'account_settings' ? 'active' : ''}`}
          >
            <span className="icon">⚙</span> Account Settings
          </a>
          <button
            type="button"
            onClick={() => {
              closeSidebar();
              onLogout();
            }}
            className="nav-item logout"
          >
            <span className="icon">⎋</span> Logout
          </button>
        </nav>
      </aside>

      {/* Main Column */}
      <div className="main-col">
        {/* TOP BAR: Reverted to Old Design with Hamburger on Left, Role Pill, Bell with Badge, User Chip */}
        <header className="topbar">
          {/* Topbar Left: Just the Hamburger Menu Button */}
          <div className="topbar-left">
            <button
              type="button"
              className="hamburger-btn"
              id="sidebarToggle"
              aria-label="Open Navigation Menu"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          </div>

          {/* Topbar Right: Role Pill, Notifications Bell, User Profile Chip */}
          <div className="topbar-right">
            {/* Role Pill Badge */}
            <span className="role-pill">
              {currentUser.role}
            </span>

            {/* Notification Bell with Red Badge Count */}
            <div className="notif-wrap" style={{ position: 'relative' }}>
              <button
                type="button"
                className="bell"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <span style={{ fontSize: '18px' }}>🔔</span>
                {unreadCount > 0 && <span className="dot">{unreadCount}</span>}
              </button>

              {/* Notifications Dropdown Panel */}
              {notifOpen && (
                <div className="notifications-panel">
                  <div className="flex-between" style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', background: '#fafbfc' }}>
                    <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>Notifications</b>
                    {unreadCount > 0 ? (
                      <span className="badge badge-completed" style={{ fontSize: '11px' }}>{unreadCount} New</span>
                    ) : (
                      <span className="muted" style={{ fontSize: '11px' }}>All caught up</span>
                    )}
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notification-row ${n.unread ? 'unread' : ''}`}
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                          );
                        }}
                      >
                        <div className={`notification-dot ${n.unread ? 'unread' : ''}`} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: n.unread ? 700 : 500, color: 'var(--ink-900)' }}>
                            {n.title}
                          </div>
                          <p className="muted" style={{ margin: '2px 0 0', fontSize: '12px', lineHeight: 1.4 }}>
                            {n.message}
                          </p>
                          <div className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                            {n.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {unreadCount > 0 && (
                    <div style={{ padding: '8px 12px', textAlign: 'center', borderTop: '1px solid var(--line)', background: '#fafbfc' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ width: '100%', fontSize: '12px', border: 'none', background: 'transparent', color: 'var(--brand-700)', fontWeight: 600 }}
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Chip (Static display without dropdown - profile features moved to burger menu) */}
            <div className="user-chip-static">
              <div className="user-avatar">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  currentUser.initials || 'JG'
                )}
              </div>
              <div className="user-info" style={{ textAlign: 'left' }}>
                <div className="user-name">{currentUser.fullName}</div>
                <div className="user-org">Eastern Visayas State University</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="content">{children}</main>
      </div>

      {/* University Campus Geofence Configuration Modal */}
      <CampusGeofenceModal
        isOpen={showGeofenceModal}
        onClose={() => setShowGeofenceModal(false)}
      />
    </div>
  );
}
