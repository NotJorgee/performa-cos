import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  X,
  ArrowLeft,
  History,
} from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';
import HistoricalAttendanceRoster from '../common/HistoricalAttendanceRoster';
import { getCachedData, setCachedData, invalidateCache } from '../../utils/swrCache';

export default function DepartmentAttendance({ currentUser, onBack = null, initialTab = 'radar' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'radar'); // 'radar' | 'leaves' | 'history'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [toast, setToast] = useState(null);

  // SWR Instant Cache Keys
  const cacheKeyRoster = `dept_roster_${currentUser?.departmentId || 'all'}`;
  const cacheKeyLeaves = `dept_leaves_${currentUser?.departmentId || 'all'}`;

  // Radar State — Instant 0ms perceived load time from cache
  const [rosterData, setRosterData] = useState(() => getCachedData(cacheKeyRoster));
  const [isLoading, setIsLoading] = useState(!rosterData);
  const [searchQuery, setSearchQuery] = useState('');

  // Leaves Queue State (Connected to Live Database API)
  const [leaveQueue, setLeaveQueue] = useState(() => getCachedData(cacheKeyLeaves) || []);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(!leaveQueue.length);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Load Department Attendance Roster
  const loadRoster = async (silent = Boolean(rosterData)) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.attendance.getDepartmentRoster();
      setRosterData(res);
      setCachedData(cacheKeyRoster, res);
    } catch (err) {
      console.warn('Roster load warning:', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Load Department Leave Queue
  const loadLeaveQueue = async (silent = Boolean(leaveQueue.length)) => {
    try {
      if (!silent) setIsLoadingLeaves(true);
      const res = await api.leaves.getDepartmentQueue();
      setLeaveQueue(res || []);
      setCachedData(cacheKeyLeaves, res || []);
    } catch (err) {
      console.warn('Leave queue load warning:', err.message);
    } finally {
      if (!silent) setIsLoadingLeaves(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('performa_subordinate_leave_queue');
    } catch (e) {
      // Ignore cleanup error
    }
    loadRoster();
    loadLeaveQueue();
  }, []);

  // Smart Window Focus Re-fetch: Silently syncs whenever supervisor returns to this browser tab
  useEffect(() => {
    const handleWindowFocus = () => {
      loadRoster(true);
      loadLeaveQueue(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRoster(true);
        loadLeaveQueue(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle Leave Review (Approve/Reject)
  const handleReviewLeave = async (action, e) => {
    if (e) e.preventDefault();
    if (!selectedLeave || !action) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.leaves.review(selectedLeave.id, {
        action: action,
        review_notes: reviewNotes.trim() || undefined,
      });

      const statusText = action === 'APPROVE' ? 'approved' : 'disapproved';
      setToast({
        type: 'success',
        message: res?.message || `Leave request #${selectedLeave.id} for ${selectedLeave.employee_name} has been ${statusText} successfully.`,
      });

      setSelectedLeave(null);
      setReviewNotes('');
      // Action-Triggered Invalidation: update state & cache immediately
      invalidateCache('dept_leaves_');
      invalidateCache('dept_roster_');
      await loadLeaveQueue(false);
      await loadRoster(false);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to review leave request.' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredRoster = (rosterData?.roster || []).filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.employee_id_number.toLowerCase().includes(q) ||
      r.job_title.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '22px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="var(--brand-700)" /> Subordinate Daily Monitoring
          </h1>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line)', marginBottom: '22px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'radar' ? '2px solid var(--brand-700)' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'radar' ? 'var(--brand-700)' : 'var(--ink-500)',
            fontWeight: activeTab === 'radar' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={16} /> Live Presence &amp; DAR Radar
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'leaves' ? '2px solid var(--brand-700)' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'leaves' ? 'var(--brand-700)' : 'var(--ink-500)',
            fontWeight: activeTab === 'leaves' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calendar size={16} /> Subordinate Leave Queue
          {leaveQueue.filter((l) => l.status === 'PENDING_DEPT_HEAD').length > 0 && (
            <span
              style={{
                background: 'var(--brand-700)',
                color: '#fff',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '12px',
                fontWeight: 700,
              }}
            >
              {leaveQueue.filter((l) => l.status === 'PENDING_DEPT_HEAD').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--brand-700)' : '2px solid transparent',
            background: 'none',
            color: activeTab === 'history' ? 'var(--brand-700)' : 'var(--ink-500)',
            fontWeight: activeTab === 'history' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <History size={16} /> Historical Attendance Roster
        </button>
      </div>

      {/* TAB 1: LIVE ATTENDANCE RADAR */}
      {activeTab === 'radar' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div className="card-title" style={{ margin: 0 }}>
                Today's Department Attendance Roster ({rosterData?.date})
              </div>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={15}
                color="#94a3b8"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search subordinate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Presence Status</th>
                  <th>Campus Site</th>
                  <th>Today's DAR</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                      Loading roster...
                    </td>
                  </tr>
                ) : filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No subordinates found in this department.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                          {sub.name}
                        </div>
                        <div className="muted" style={{ fontSize: '11.5px' }}>
                          {sub.employee_id_number} &bull; {sub.job_title}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: sub.time_in !== '—' ? 600 : 400 }}>
                        {sub.time_in}
                        {sub.is_early && (
                          <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
                            Credited: {sub.credited_time_in}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: sub.time_out !== '—' ? 600 : 400 }}>
                        {sub.time_out}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sub.badge_type === 'on_time'
                              ? 'badge-completed'
                              : sub.badge_type === 'late'
                              ? 'badge-archived'
                              : sub.badge_type === 'undertime'
                              ? 'badge-pending'
                              : sub.badge_type === 'leave'
                              ? 'badge-active'
                              : 'badge-inactive'
                          }`}
                          style={{ fontSize: '11.5px' }}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>{sub.geofence_site}</td>
                      <td>
                        {sub.dar_submitted ? (
                          <span style={{ fontSize: '12px', color: 'var(--green-700, #15803d)', fontWeight: 600 }}>
                            {sub.dar_tasks_count} task(s) logged
                          </span>
                        ) : (
                          <span className="muted" style={{ fontSize: '12px' }}>
                            Not submitted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUBORDINATE LEAVE QUEUE */}
      {activeTab === 'leaves' && (
        <div>
          {/* Leave Queue Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                background: '#fff',
              }}
            >
              <div className="card-title" style={{ margin: 0 }}>
                Staff Leave Requests
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Review Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingLeaves ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        Loading leave requests...
                      </td>
                    </tr>
                  ) : leaveQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No leave requests filed in your department.
                      </td>
                    </tr>
                  ) : (
                    leaveQueue.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{l.employee_name}</div>
                          <div className="muted" style={{ fontSize: '11.5px' }}>{l.employee_id_number}</div>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '13px' }}>{l.leave_type}</td>
                        <td style={{ fontSize: '12.5px' }}>
                          {l.start_date} to {l.end_date} ({l.days_count}d)
                        </td>
                        <td style={{ fontSize: '12px', maxWidth: '240px' }}>
                          {l.reason}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              l.status === 'APPROVED'
                                ? 'badge-completed'
                                : l.status === 'REJECTED'
                                ? 'badge-reject'
                                : 'badge-pending'
                            }`}
                            style={{ fontSize: '11.5px' }}
                          >
                            {l.status === 'PENDING_DEPT_HEAD'
                              ? 'Pending Review'
                              : l.status === 'APPROVED'
                              ? 'Approved'
                              : 'Disapproved'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {l.status === 'PENDING_DEPT_HEAD' ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setSelectedLeave(l);
                                setReviewNotes(l.review_notes || '');
                              }}
                              style={{ fontSize: '12px', padding: '6px 14px' }}
                            >
                              Review Request
                            </button>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => {
                                  setSelectedLeave(l);
                                  setReviewNotes(l.review_notes || '');
                                }}
                                style={{ fontSize: '11.5px', padding: '4px 10px', background: '#f1f5f9', color: 'var(--ink-700)' }}
                              >
                                View Details
                              </button>
                              <span className="muted" style={{ fontSize: '11px' }}>
                                Decided ({l.reviewed_by || 'Supervisor'})
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORICAL ATTENDANCE ROSTER */}
      {activeTab === 'history' && (
        <HistoricalAttendanceRoster
          currentUser={currentUser}
          departmentId={currentUser?.department_id}
          departmentName={typeof currentUser?.department === 'object' ? currentUser?.department?.name : currentUser?.department}
          isHR={false}
        />
      )}

      {/* Review / View Leave Modal */}
      {selectedLeave && (
        <div
          className="modal-overlay open"
          style={{ zIndex: 1100 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedLeave(null);
              setReviewNotes('');
            }
          }}
        >
          <div className="modal-card" style={{ maxWidth: '640px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--brand-700)" />
                  <span>
                    {selectedLeave.status === 'PENDING_DEPT_HEAD'
                      ? 'Review Subordinate Leave Request'
                      : 'Subordinate Leave Request Details'}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
                  {selectedLeave.employee_name} &bull; {selectedLeave.employee_id_number}
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setSelectedLeave(null);
                  setReviewNotes('');
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Leave Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '18px',
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid var(--line)',
              }}
            >
              <div>
                <span className="muted" style={{ fontSize: '11.5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Leave Category
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--ink-900)' }}>
                  {selectedLeave.leave_type}
                </strong>
              </div>

              <div>
                <span className="muted" style={{ fontSize: '11.5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Duration &amp; Inclusive Dates
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--ink-900)' }}>
                  {selectedLeave.start_date} to {selectedLeave.end_date}
                </strong>
                <div className="muted" style={{ fontSize: '11.5px' }}>
                  ({selectedLeave.days_count} working day{selectedLeave.days_count > 1 ? 's' : ''})
                </div>
              </div>

              <div>
                <span className="muted" style={{ fontSize: '11.5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Department Assignment
                </span>
                <span style={{ fontSize: '13px', color: 'var(--ink-800)', fontWeight: 500 }}>
                  {selectedLeave.department || 'Computer Studies Department'}
                </span>
              </div>

              <div>
                <span className="muted" style={{ fontSize: '11.5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Date Filed
                </span>
                <span style={{ fontSize: '13px', color: 'var(--ink-800)', fontWeight: 500 }}>
                  {selectedLeave.created_at}
                </span>
              </div>
            </div>

            {/* Employee Justification */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink-800)' }}>
                Employee Justification &amp; Particulars
              </label>
              <div
                style={{
                  padding: '12px 14px',
                  background: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  color: 'var(--ink-800)',
                  lineHeight: '1.5',
                }}
              >
                {selectedLeave.reason}
              </div>
            </div>

            {/* Past Decision Box if already decided */}
            {selectedLeave.status !== 'PENDING_DEPT_HEAD' && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  marginBottom: '18px',
                  background: selectedLeave.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${selectedLeave.status === 'APPROVED' ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: selectedLeave.status === 'APPROVED' ? 'var(--green-700, #15803d)' : 'var(--red-600)',
                    }}
                  >
                    Decision: {selectedLeave.status === 'APPROVED' ? 'Approved' : 'Disapproved'}
                  </span>
                  <span className="muted" style={{ fontSize: '11.5px' }}>
                    Reviewed by: {selectedLeave.reviewed_by || 'Supervisor'}
                  </span>
                </div>
                {selectedLeave.review_notes && (
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-800)', fontStyle: 'italic' }}>
                    "{selectedLeave.review_notes}"
                  </div>
                )}
              </div>
            )}

            {/* Supervisor Action Form for Pending Requests */}
            {selectedLeave.status === 'PENDING_DEPT_HEAD' ? (
              <form onSubmit={(e) => e.preventDefault()}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink-800)' }}>
                    Supervisor Endorsement Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Provide notes, conditions, or recommendations..."
                    className="form-control"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    autoFocus
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--line, #e2e8f0)',
                  }}
                >
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={(e) => handleReviewLeave('REJECT', e)}
                    className="btn btn-sm"
                    style={{
                      background: '#dc2626',
                      border: '1px solid #dc2626',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      padding: '8px 18px',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={15} /> Disapprove Leave
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={(e) => handleReviewLeave('APPROVE', e)}
                    className="btn btn-sm"
                    style={{
                      background: '#15803d',
                      border: '1px solid #15803d',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      padding: '8px 18px',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={15} /> Approve Leave
                  </button>
                </div>
              </form>
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLeave(null);
                    setReviewNotes('');
                  }}
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
