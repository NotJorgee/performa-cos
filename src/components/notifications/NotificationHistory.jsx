import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  RotateCcw,
  Trash2,
  Clock,
  ClipboardCheck,
  MapPin,
  FileText,
  BarChart3,
  ShieldAlert,
  Search,
  ArrowRight,
  Inbox,
  Filter,
} from 'lucide-react';

export default function NotificationHistory({
  notifications = [],
  currentUser = {
    fullName: 'Jorge Mikhael Gubantes',
    role: 'COS Employee',
    department: 'Computer Studies Department',
  },
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
  onDeleteNotification = () => {},
  onNavigate = () => {},
  onBack = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const getCategoryMeta = (category) => {
    switch (category) {
      case 'evaluation':
        return {
          label: 'Triad Evaluation',
          badgeClass: 'badge-dept',
          icon: <ClipboardCheck size={18} color="var(--blue-600, #2563eb)" />,
          bg: '#eff6ff',
          border: '#bfdbfe',
        };
      case 'contract':
        return {
          label: 'Contract Lifecycle',
          badgeClass: 'badge-pending',
          icon: <Clock size={18} color="var(--amber-600, #d97706)" />,
          bg: '#fffbeb',
          border: '#fde68a',
        };
      case 'dar':
        return {
          label: 'Campus DAR',
          badgeClass: 'badge-delayed',
          icon: <MapPin size={18} color="var(--red-600, #dc2626)" />,
          bg: '#fef2f2',
          border: '#fecaca',
        };
      case 'mar':
        return {
          label: 'Monthly MAR',
          badgeClass: 'badge-completed',
          icon: <FileText size={18} color="var(--brand-700, #7a0c2e)" />,
          bg: '#fdf2f4',
          border: '#fbcfe8',
        };
      case 'records':
        return {
          label: 'Personnel Records',
          badgeClass: 'badge-unassigned',
          icon: <BarChart3 size={18} color="var(--brand-700, #7a0c2e)" />,
          bg: '#faf5ff',
          border: '#e9d5ff',
        };
      case 'system':
      default:
        return {
          label: 'System Security',
          badgeClass: 'badge-dept',
          icon: <ShieldAlert size={18} color="var(--ink-700, #334155)" />,
          bg: '#f8fafc',
          border: '#e2e8f0',
        };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.message && n.message.toLowerCase().includes(q));

    const matchesCategory =
      categoryFilter === 'all' || n.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unread' && n.unread) ||
      (statusFilter === 'read' && !n.unread);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div>
      {/* Top Header */}
      <div
        className="flex-between"
        style={{
          marginBottom: '22px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={26} color="var(--brand-700)" />
            Notification Center &amp; History
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
            Audit trail of system notices, DAR reminders, evaluation milestones, and contract renewals for{' '}
            <b>{currentUser.fullName}</b> ({currentUser.role}).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => {
                onMarkAllAsRead();
                showToast('All notifications have been marked as read.');
              }}
            >
              <CheckCheck size={15} /> Mark All as Read
            </button>
          )}

          {onBack && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={onBack}
              style={{ cursor: 'pointer' }}
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div
          className="flash flash-success"
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Check size={16} /> <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Card with Filter Bar & Notification Rows */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            background: '#fff',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
              <Search
                size={16}
                color="var(--ink-400)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search notifications by keyword, title, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '13.5px' }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ minWidth: '170px' }}>
              <select
                className="form-control"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ fontSize: '13.5px' }}
              >
                <option value="all">All Categories</option>
                <option value="evaluation">Triad Evaluations</option>
                <option value="contract">Contract Lifecycles</option>
                <option value="dar">Campus DAR</option>
                <option value="mar">Monthly MAR</option>
                <option value="records">Personnel Records</option>
                <option value="system">System Security</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: '140px' }}>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: '13.5px' }}
              >
                <option value="all">All Status</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div>
          {filteredNotifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <Inbox size={42} color="var(--ink-400)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ margin: '0 0 6px', color: 'var(--ink-800)' }}>No notifications found</h3>
              <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
                There are no notifications matching your current search or filter criteria.
              </p>
              {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const meta = getCategoryMeta(n.category);
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '18px 22px',
                    borderBottom: '1px solid var(--line)',
                    background: n.unread ? 'var(--brand-50, #fdf2f4)' : '#fff',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Category Icon Capsule */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {meta.icon}
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '4px',
                      }}
                    >
                      <span className={`badge ${meta.badgeClass}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {meta.label}
                      </span>
                      {n.unread && (
                        <span
                          className="badge badge-completed"
                          style={{ fontSize: '10.5px', padding: '1px 7px', fontWeight: 700 }}
                        >
                          New
                        </span>
                      )}
                      <span className="muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
                        {n.time}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '14.5px',
                        fontWeight: n.unread ? 800 : 600,
                        color: 'var(--ink-900)',
                        marginBottom: '4px',
                      }}
                    >
                      {n.title}
                    </div>

                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: '13.5px',
                        color: 'var(--ink-700)',
                        lineHeight: 1.5,
                      }}
                    >
                      {n.message}
                    </p>

                    {/* Actionable Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {n.actionView && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '12px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            if (n.unread) onMarkAsRead(n.id);
                            onNavigate(n.actionView);
                          }}
                          title={`Navigate to ${n.actionLabel || 'relevant page'}`}
                        >
                          <span>{n.actionLabel || 'Open Module'}</span>
                          <ArrowRight size={13} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          background: '#fff',
                        }}
                        onClick={() => {
                          onMarkAsRead(n.id, !n.unread);
                          showToast(n.unread ? 'Marked as read' : 'Marked as unread');
                        }}
                        title={n.unread ? 'Mark as read' : 'Mark as unread'}
                      >
                        {n.unread ? (
                          <>
                            <Check size={13} /> Mark Read
                          </>
                        ) : (
                          <>
                            <RotateCcw size={13} /> Mark Unread
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          color: 'var(--ink-500)',
                          background: 'transparent',
                          border: 'none',
                        }}
                        onClick={() => {
                          onDeleteNotification(n.id);
                          showToast('Notification dismissed');
                        }}
                        title="Dismiss notification"
                      >
                        <Trash2 size={13} /> Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
