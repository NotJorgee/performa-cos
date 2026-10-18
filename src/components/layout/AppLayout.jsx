import React, { useState, useEffect } from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

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
        setUserMenuOpen(false);
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
            className={`nav-item ${
              currentPath === 'dashboard' ||
              (currentUser.role === 'Department Head' && currentPath === 'pending_evaluations')
                ? 'active'
                : ''
            }`}
          >
            <span className="icon">▦</span> Dashboard
          </a>

          {/* 1. COS Employee Modules */}
          {currentUser.role === 'COS Employee' && (
            <>
              <a
                href="#daily-report"
                onClick={(e) => { e.preventDefault(); handleNavClick('daily_report'); }}
                className={`nav-item ${currentPath === 'daily_report' ? 'active' : ''}`}
              >
                <span className="icon">◷</span> Daily Report (DAR)
              </a>
              <a
                href="#monthly-report"
                onClick={(e) => { e.preventDefault(); handleNavClick('monthly_report'); }}
                className={`nav-item ${currentPath === 'monthly_report' ? 'active' : ''}`}
              >
                <span className="icon">📑</span> Monthly Report (MAR)
              </a>
              <a
                href="#contract-status"
                onClick={(e) => { e.preventDefault(); handleNavClick('contract_status'); }}
                className={`nav-item ${currentPath === 'contract_status' ? 'active' : ''}`}
              >
                <span className="icon">📋</span> Contract Status
              </a>
              <a
                href="#peer-evaluations"
                onClick={(e) => { e.preventDefault(); handleNavClick('peer_evaluations'); }}
                className={`nav-item ${currentPath === 'peer_evaluations' ? 'active' : ''}`}
              >
                <span className="icon">👥</span> Peer Evaluations
              </a>
            </>
          )}

          {/* 2. Department Head has their complete appraisal workspace in the main Dashboard */}

          {/* 3. HR Personnel Modules */}
          {currentUser.role === 'HR Personnel' && (
            <>
              <a
                href="#evaluation-management"
                onClick={(e) => { e.preventDefault(); handleNavClick('evaluation_management'); }}
                className={`nav-item ${currentPath === 'evaluation_management' ? 'active' : ''}`}
              >
                <span className="icon">⏱️</span> Evaluation Management
              </a>
              <a
                href="#hr-evaluations-proxy"
                onClick={(e) => { e.preventDefault(); handleNavClick('hr_evaluations_proxy'); }}
                className={`nav-item ${currentPath === 'hr_evaluations_proxy' ? 'active' : ''}`}
              >
                <span className="icon">📝</span> HR &amp; Proxy Evaluations
              </a>
              <a
                href="#employee-management"
                onClick={(e) => { e.preventDefault(); handleNavClick('employee_management'); }}
                className={`nav-item ${currentPath === 'employee_management' ? 'active' : ''}`}
              >
                <span className="icon">◍</span> Employee Management
              </a>
              <a
                href="#department-management"
                onClick={(e) => { e.preventDefault(); handleNavClick('department_management'); }}
                className={`nav-item ${currentPath === 'department_management' ? 'active' : ''}`}
              >
                <span className="icon">▣</span> Department Management
              </a>
              <a
                href="#report-generator"
                onClick={(e) => { e.preventDefault(); handleNavClick('report_generator'); }}
                className={`nav-item ${currentPath === 'report_generator' ? 'active' : ''}`}
              >
                <span className="icon">▥</span> Executive Reports
              </a>
              <a
                href="#audit-trail"
                onClick={(e) => { e.preventDefault(); handleNavClick('audit_trail'); }}
                className={`nav-item ${currentPath === 'audit_trail' ? 'active' : ''}`}
              >
                <span className="icon">🛡️</span> Audit Trail &amp; Backup
              </a>
            </>
          )}

          {/* Profile & Security (UC-11) */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <a
              href="#profile-settings"
              onClick={(e) => { e.preventDefault(); handleNavClick('profile_settings'); }}
              className={`nav-item ${currentPath === 'profile_settings' ? 'active' : ''}`}
            >
              <span className="icon">⚙️</span> Profile &amp; Security
            </a>
          </div>
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

            {/* User Profile Chip with Caret */}
            <div className="user-menu" style={{ position: 'relative' }}>
              <button
                type="button"
                className="user-chip"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
              >
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
                <span className="user-menu-caret">▾</span>
              </button>

              {/* User Menu Panel Dropdown */}
              <div className={`user-menu-panel ${userMenuOpen ? 'open' : ''}`}>
                <div className="user-menu-header">
                  <div className="user-menu-avatar">
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
                  <div className="user-menu-name">{currentUser.fullName}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '3px' }}>{currentUser.role}</div>
                  <div style={{ fontSize: '11px', opacity: 0.75 }}>{currentUser.department}</div>
                </div>

                <div className="user-menu-items">
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => {
                      onNavigate('profile_settings');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="icon">⚙️</span> Profile &amp; Security
                  </button>
                  <button
                    type="button"
                    className="user-menu-item logout"
                    onClick={() => {
                      onLogout();
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="icon">↪</span> Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
