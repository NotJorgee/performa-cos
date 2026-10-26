import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  Database,
  User,
  Settings,
  LogOut,
  Menu,
  Bell,
  ArrowRight,
} from 'lucide-react';
import evsuSeal from '../../assets/images/evsu-seal.png';
import { getInitialNotifications } from '../../utils/notificationsData';

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
  notifications: propNotifications = null,
  onMarkAsRead = null,
  onMarkAllAsRead = null,
  onNavigate = () => {},
  onLogout = () => {},
}) {
  // Sidebar only pops up when pressing the menu button (Off-canvas drawer)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // In-system notifications state (uses prop if available, otherwise role-based defaults)
  const [localNotifications, setLocalNotifications] = useState(() =>
    getInitialNotifications(currentUser.role)
  );

  const notifications = propNotifications || localNotifications;
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAsRead = (id) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    } else {
      setLocalNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
      );
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    }
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

        {/* Navigation Items */}
        <nav className="nav">
          <a
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
            className={`nav-item ${currentPath === 'dashboard' ? 'active' : ''}`}
          >
            <span className="icon"><LayoutDashboard size={17} /></span> Dashboard
          </a>

          {/* Notifications Center Page */}
          <a
            href="#notifications"
            onClick={(e) => { e.preventDefault(); handleNavClick('notifications'); }}
            className={`nav-item ${currentPath === 'notifications' || currentPath === 'notification_history' ? 'active' : ''}`}
          >
            <span className="icon"><Bell size={17} /></span> Notifications
            {unreadCount > 0 && (
              <span
                className="badge badge-delayed"
                style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 7px', fontWeight: 700 }}
              >
                {unreadCount}
              </span>
            )}
          </a>

          {/* Institutional Campus Geofence Page (HR Only) */}
          {currentUser.role === 'HR Personnel' && (
            <a
              href="#campus-geofence"
              onClick={(e) => { e.preventDefault(); handleNavClick('campus_geofence'); }}
              className={`nav-item ${currentPath === 'campus_geofence' ? 'active' : ''}`}
            >
              <span className="icon"><MapPin size={17} /></span> Campus Geofence
            </a>
          )}

          {/* Security Logs Page (HR Only) */}
          {currentUser.role === 'HR Personnel' && (
            <a
              href="#security-logs"
              onClick={(e) => { e.preventDefault(); handleNavClick('audit_trail'); }}
              className={`nav-item ${currentPath === 'audit_trail' ? 'active' : ''}`}
            >
              <span className="icon"><ShieldAlert size={17} /></span> Security Logs
            </a>
          )}

          {/* Database Backup Data Page (HR / Admin) */}
          {currentUser.role === 'HR Personnel' && (
            <a
              href="#backup-data"
              onClick={(e) => { e.preventDefault(); handleNavClick('backup_data'); }}
              className={`nav-item ${currentPath === 'backup_data' ? 'active' : ''}`}
            >
              <span className="icon"><Database size={17} /></span> Backup Data
            </a>
          )}

          {/* Role-Unified Burger Menu: View Profile, Account Settings, Logout */}
          <a
            href="#view-profile"
            onClick={(e) => { e.preventDefault(); handleNavClick('view_profile'); }}
            className={`nav-item ${currentPath === 'view_profile' ? 'active' : ''}`}
          >
            <span className="icon"><User size={17} /></span> View Profile
          </a>
          <a
            href="#account-settings"
            onClick={(e) => { e.preventDefault(); handleNavClick('account_settings'); }}
            className={`nav-item ${currentPath === 'account_settings' ? 'active' : ''}`}
          >
            <span className="icon"><Settings size={17} /></span> Account Settings
          </a>
          <button
            type="button"
            onClick={() => {
              closeSidebar();
              onLogout();
            }}
            className="nav-item logout"
          >
            <span className="icon"><LogOut size={17} /></span> Logout
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
              <Menu size={20} />
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
                <Bell size={19} />
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

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notification-row ${n.unread ? 'unread' : ''}`}
                        onClick={() => {
                          handleMarkAsRead(n.id);
                          if (n.actionView) {
                            setNotifOpen(false);
                            onNavigate(n.actionView);
                          }
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
                          <div className="flex-between" style={{ marginTop: '4px' }}>
                            <span className="muted" style={{ fontSize: '11px' }}>
                              {n.time}
                            </span>
                            {n.actionLabel && (
                              <span style={{ fontSize: '11.5px', color: 'var(--brand-700)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                {n.actionLabel} <ArrowRight size={11} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ fontSize: '12px', border: 'none', background: 'transparent', color: 'var(--brand-700)', fontWeight: 600, padding: '4px 6px', cursor: 'pointer' }}
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all as read
                      </button>
                    ) : (
                      <span className="muted" style={{ fontSize: '11px' }}>All caught up</span>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ fontSize: '12px', border: 'none', background: 'transparent', color: 'var(--ink-700)', fontWeight: 600, padding: '4px 6px', cursor: 'pointer', marginLeft: 'auto' }}
                      onClick={() => {
                        setNotifOpen(false);
                        onNavigate('notifications');
                      }}
                    >
                      View all history →
                    </button>
                  </div>
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
    </div>
  );
}
