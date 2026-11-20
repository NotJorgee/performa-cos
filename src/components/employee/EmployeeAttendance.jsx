import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Download,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  X,
} from 'lucide-react';
import api from '../../services/api';
import Toast from '../common/Toast';
import PredictiveTextarea from '../common/PredictiveTextarea';
import { getCachedData, setCachedData, invalidateCache } from '../../utils/swrCache';

export default function EmployeeAttendance({ currentUser, onBack = null, onNavigate = null, initialTab = 'dtr' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'dtr'); // 'dtr' | 'leaves'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [toast, setToast] = useState(null);
  const [isPunching, setIsPunching] = useState(false);
  const [punchAction, setPunchAction] = useState(null); // 'locating_in' | 'saving_in' | 'locating_out' | 'saving_out' | null

  // Real-Time Running Clock
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate =
    currentDateTime.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }) + ` (${currentDateTime.toLocaleDateString('en-US', { weekday: 'long' })})`;

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // SWR Instant Cache Keys
  const cacheKeyToday = `emp_att_today_${currentUser?.id || 'me'}`;
  const cacheKeyLeaves = `emp_leaves_${currentUser?.id || 'me'}`;

  // Today's Status State — SWR immediate 0ms initialization from cache
  const [todayData, setTodayData] = useState(() => getCachedData(cacheKeyToday));
  const [isLoading, setIsLoading] = useState(!todayData);

  // GPS Location State (Cached from on-demand button tap)
  const [gpsLocation, setGpsLocation] = useState(null);

  // Semi-Monthly DTR State
  const [cutoffPeriod, setCutoffPeriod] = useState('1st_half'); // '1st_half' | '2nd_half'
  const now = new Date();
  const [dtrMonth, setDtrMonth] = useState(now.getMonth() + 1);
  const [dtrYear, setDtrYear] = useState(now.getFullYear());
  const cacheKeyDtr = `emp_dtr_${currentUser?.id || 'me'}_${dtrYear}_${dtrMonth}_${cutoffPeriod}`;
  const [dtrPacket, setDtrPacket] = useState(() => getCachedData(cacheKeyDtr));
  const [isLoadingDtr, setIsLoadingDtr] = useState(!dtrPacket);

  // Leave & Shift Request State
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('2');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState(() => getCachedData(cacheKeyLeaves) || []);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Computed weekend overtime flags
  const selectedDateObj = startDate ? new Date(startDate + 'T00:00:00') : null;
  const isWeekendOt = selectedDateObj ? (selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6) : false;
  const weekendDayLabel = selectedDateObj ? selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';

  // Load Today's Status (Silent background revalidation when cached)
  const loadTodayStatus = async (silent = Boolean(todayData)) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.attendance.getTodayStatus();
      setTodayData(res);
      setCachedData(cacheKeyToday, res);
    } catch (err) {
      console.warn('Attendance load warning:', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const watchIdRef = useRef(null);
  const timeoutIdRef = useRef(null);

  // Acquire Fresh High-Accuracy Satellite GPS Position on Demand
  const acquireFreshLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your device or browser.'));
      }

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      let bestPos = null;
      let completed = false;

      const finish = (finalPos = null) => {
        if (completed) return;
        completed = true;
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (timeoutIdRef.current !== null) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        const target = finalPos || bestPos;
        if (target) {
          const loc = {
            latitude: target.coords.latitude,
            longitude: target.coords.longitude,
            accuracy: target.coords.accuracy,
          };
          setGpsLocation(loc);
          resolve(loc);
        } else {
          reject(new Error('Unable to acquire accurate GPS position. Please check your device location settings and try again.'));
        }
      };

      // Failsafe timer (6 seconds maximum to lock satellites)
      timeoutIdRef.current = setTimeout(() => {
        finish();
      }, 6000);

      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
              bestPos = pos;
            }
            if (pos.coords.accuracy && pos.coords.accuracy <= 25) {
              finish(pos);
            }
          },
          (err) => {
            console.warn('GPS acquisition warning:', err.message);
            if (!bestPos) finish();
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      } catch (err) {
        finish();
      }
    });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // Load Semi-Monthly DTR Packet
  const loadDtrPacket = async (silent = Boolean(dtrPacket)) => {
    try {
      if (!silent) setIsLoadingDtr(true);
      const res = await api.attendance.getPayrollPacket({
        cutoff: cutoffPeriod,
        month: dtrMonth,
        year: dtrYear,
      });
      setDtrPacket(res);
      setCachedData(cacheKeyDtr, res);
    } catch (err) {
      console.warn('DTR load warning:', err.message);
    } finally {
      if (!silent) setIsLoadingDtr(false);
    }
  };

  // Load User's Past Leaves
  const loadMyLeaves = async () => {
    try {
      const res = await api.leaves.getMyRequests();
      setLeaveRequests(res || []);
      setCachedData(cacheKeyLeaves, res || []);
    } catch (err) {
      console.warn('Leaves load warning:', err.message);
    }
  };

  useEffect(() => {
    loadTodayStatus();
    loadDtrPacket();
  }, []);

  useEffect(() => {
    if (activeTab === 'dtr') {
      loadDtrPacket();
    } else if (activeTab === 'leaves') {
      loadMyLeaves();
    }
  }, [activeTab, cutoffPeriod, dtrMonth, dtrYear]);

  // Handle Punch (Time-In or Time-Out) with Integrated On-Demand Satellite GPS Acquisition
  const handlePunch = async (type) => {
    if (isPunching) return;
    setIsPunching(true);
    setPunchAction(type === 'time_in' ? 'locating_in' : 'locating_out');

    try {
      // 1. Automatically acquire fresh GPS satellite coordinates on button tap
      let coords = null;
      try {
        coords = await acquireFreshLocation();
      } catch (locErr) {
        if (gpsLocation) {
          coords = gpsLocation;
        } else {
          throw locErr;
        }
      }

      setPunchAction(type === 'time_in' ? 'saving_in' : 'saving_out');

      // 2. Submit punch with verified coordinates and accuracy
      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      };

      let res;
      if (type === 'time_in') {
        res = await api.attendance.timeIn(payload);
      } else {
        res = await api.attendance.timeOut(payload);
      }

      setToast({ type: 'success', message: res.message || 'Punch recorded successfully!' });
      // Action-Triggered Invalidation: update state & cache immediately
      invalidateCache('emp_att_today_');
      invalidateCache('emp_dtr_');
      invalidateCache('dtr_logs_');
      invalidateCache('dept_roster_');
      await loadTodayStatus(false);
      await loadDtrPacket(false);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to record attendance punch.' });
    } finally {
      setIsPunching(false);
      setPunchAction(null);
    }
  };

  // Handle Time & Shift Request Submission
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    const isOt = leaveType === 'Overtime (OT)';
    if (!startDate || (!isOt && !endDate) || !leaveReason.trim()) {
      setToast({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const payload = {
        leave_type: leaveType,
        start_date: startDate,
        end_date: isOt ? startDate : endDate,
        reason: leaveReason.trim(),
        hours: isOt ? parseFloat(overtimeHours) || 2.0 : null,
      };
      const res = await api.leaves.apply(payload);
      setToast({ type: 'success', message: res.message || (isOt ? 'Overtime authorization request submitted!' : 'Request submitted to Department Head!') });
      setStartDate('');
      setEndDate('');
      setOvertimeHours('2');
      setLeaveReason('');
      // Action-Triggered Invalidation: update state & cache immediately
      invalidateCache('emp_leaves_');
      invalidateCache('dept_leaves_');
      await loadMyLeaves();
      await loadTodayStatus();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit request.' });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header with Navigation */}
      <div className="flex-between" style={{ marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeTab === 'leaves' ? (
              <>
                <FileText size={28} color="var(--brand-700)" /> Time &amp; Shift Requests
              </>
            ) : (
              <>
                <Clock size={28} color="var(--brand-700)" /> Daily Attendance
              </>
            )}
          </h1>
        </div>
        {activeTab === 'leaves' ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveTab('dtr')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to Attendance Clock
          </button>
        ) : (
          onBack && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          )
        )}
      </div>

      {/* TAB 1: COMBINED DAILY TIME RECORD (DTR) & CAMPUS PUNCH */}
      {activeTab === 'dtr' && (
        <div>
          {/* Today's Punch Action Card */}
          <div className="card" style={{ padding: '24px', marginBottom: '22px' }}>
            <div className="flex-between" style={{ marginBottom: '18px', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: '19px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Clock size={22} color="var(--brand-700)" /> Today's Attendance Status
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--ink-900)' }}>
                    {formattedDate}
                  </span>
                  <span style={{ color: 'var(--ink-300)', fontSize: '16px' }}>&bull;</span>
                  <span style={{ fontSize: '15px', color: 'var(--ink-700)' }}>
                    Server Time: <strong style={{ color: 'var(--brand-700)', fontFamily: 'monospace', fontSize: '18px', fontWeight: 800 }}>{formattedTime}</strong>
                  </span>
                </div>
              </div>
              <span
                className={`badge ${
                  todayData?.status === 'ON_TIME'
                    ? 'badge-completed'
                    : todayData?.status === 'LATE'
                    ? 'badge-archived'
                    : todayData?.status === 'UNDERTIME'
                    ? 'badge-pending'
                    : todayData?.status === 'OVERTIME'
                    ? 'badge-active'
                    : todayData?.on_approved_leave
                    ? 'badge-active'
                    : 'badge-inactive'
                }`}
                style={{ fontSize: '12.5px', padding: '5px 12px', fontWeight: 700 }}
              >
                {todayData?.on_approved_leave
                  ? `ON LEAVE (${todayData.leave_type})`
                  : todayData?.status || 'PENDING PUNCH'}
              </span>
            </div>

            {/* Time In / Time Out Display */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '16px',
                borderRadius: '10px',
                background: todayData?.has_timed_in ? 'var(--green-50)' : '#f8fafc',
                border: todayData?.has_timed_in ? '1px solid var(--green-200)' : '1px solid var(--line)',
                marginBottom: '18px',
              }}
            >
              <div>
                <div className="muted" style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em' }}>TIME IN</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink-900)', marginTop: '4px' }}>
                  {todayData?.time_in || '—'}
                </div>
                {todayData?.is_early && (
                  <div style={{ fontSize: '11.5px', color: 'var(--brand-700)', fontWeight: 600, marginTop: '2px' }}>
                    Credited: {todayData.credited_time_in} (Early Arrival)
                  </div>
                )}
                {todayData?.minutes_late > 0 && (
                  <span style={{ fontSize: '11.5px', color: 'var(--red-600)', fontWeight: 600 }}>
                    Late by {todayData.minutes_late} min(s)
                  </span>
                )}
              </div>

              <div>
                <div className="muted" style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em' }}>TIME OUT</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink-900)', marginTop: '4px' }}>
                  {todayData?.time_out || '—'}
                </div>
                {todayData?.undertime_minutes > 0 && (
                  <span style={{ fontSize: '11.5px', color: 'var(--amber-600)', fontWeight: 600 }}>
                    Undertime: {todayData.undertime_minutes} min(s)
                  </span>
                )}
                {todayData?.overtime_hours > 0 && (
                  <span style={{ fontSize: '11.5px', color: 'var(--green-600)', fontWeight: 600 }}>
                    Authorized OT: {todayData.overtime_hours} hr(s)
                  </span>
                )}
              </div>

              <div>
                <div className="muted" style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.04em' }}>GEOFENCE PERIMETER</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-900)', marginTop: '4px' }}>
                  {todayData?.has_timed_in
                    ? (todayData?.geofence_site || 'EVSU Campus Perimeter')
                    : '—'}
                </div>
                {todayData?.has_timed_in && todayData?.in_latitude && (
                  <div className="muted" style={{ fontSize: '11.5px', marginTop: '2px' }}>
                    {todayData.in_latitude.toFixed(4)}, {todayData.in_longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* Punch Action Buttons with Integrated On-Demand Satellite GPS */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn"
                disabled={isPunching || todayData?.has_timed_in}
                onClick={() => handlePunch('time_in')}
                style={{
                  flex: 1,
                  padding: '13px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  background: todayData?.has_timed_in ? '#e2e8f0' : 'var(--brand-700)',
                  color: todayData?.has_timed_in ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  cursor: todayData?.has_timed_in ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                }}
              >
                <CheckCircle2 size={16} />
                {todayData?.has_timed_in
                  ? 'Timed In'
                  : punchAction === 'locating_in'
                  ? 'Acquiring GPS...'
                  : punchAction === 'saving_in'
                  ? 'Recording Punch...'
                  : 'Clock In'}
              </button>

              <button
                type="button"
                className="btn"
                disabled={isPunching || !todayData?.has_timed_in || todayData?.has_timed_out}
                onClick={() => handlePunch('time_out')}
                style={{
                  flex: 1,
                  padding: '13px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  background: (!todayData?.has_timed_in || todayData?.has_timed_out) ? '#e2e8f0' : 'var(--ink-800, #1e293b)',
                  color: (!todayData?.has_timed_in || todayData?.has_timed_out) ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  cursor: (!todayData?.has_timed_in || todayData?.has_timed_out) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                }}
              >
                <Clock size={16} />
                {todayData?.has_timed_out
                  ? 'Timed Out'
                  : punchAction === 'locating_out'
                  ? 'Acquiring GPS...'
                  : punchAction === 'saving_out'
                  ? 'Recording Punch...'
                  : 'Clock Out'}
              </button>
            </div>
          </div>
          {/* Action Cards: Apply for Leave (Left) & Attendance Logs (Right) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {/* Left Button: Time & Shift Requests */}
            <div
              className="card stat-card-clickable"
              onClick={() => setActiveTab('leaves')}
              style={{
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--brand-50)',
                    color: 'var(--brand-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={22} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink-900)' }}>
                  Time &amp; Shift Requests
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-700)', fontWeight: 700, fontSize: '13.5px' }}>
                <span>Manage</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Right Button: View Full Attendance Logs */}
            <div
              className="card stat-card-clickable"
              onClick={() => onNavigate && onNavigate('attendance_logs')}
              style={{
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--brand-50)',
                    color: 'var(--brand-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink-900)' }}>
                  View Full Attendance Logs
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-700)', fontWeight: 700, fontSize: '13.5px' }}>
                <span>Open Logs</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIME & SHIFT REQUESTS */}
      {activeTab === 'leaves' && (
        <div>
          <div className="leave-management-grid">
          {/* File a Request Form */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '17px' }}>New Time &amp; Shift Request</h3>
            <form onSubmit={handleSubmitLeave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Request Category
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="Sick Leave">Sick Leave / Medical Excuse</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Official Business (OB)">Official Business (OB) — Off Campus</option>
                  <option value="Overtime (OT)">Overtime (OT) / Extended Shift Authorization</option>
                  <option value="Bereavement">Bereavement Leave</option>
                  <option value="Leave Without Pay">Leave of Absence Without Pay</option>
                </select>
              </div>

              {leaveType === 'Overtime (OT)' ? (
                <div>
                  {startDate && (
                    <div style={{ marginBottom: '10px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: isWeekendOt ? '#f3e8ff' : '#f1f5f9',
                          color: isWeekendOt ? '#7e22ce' : '#334155',
                          border: `1px solid ${isWeekendOt ? '#d8b4fe' : '#cbd5e1'}`,
                        }}
                      >
                        {isWeekendOt ? `Weekend Duty · ${weekendDayLabel}` : 'Weekday Evening Extended Shift'}
                      </span>
                    </div>
                  )}

                  <div className="leave-dates-row" style={{ marginBottom: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                        Target Overtime Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setEndDate(e.target.value);
                        }}
                        className="form-control"
                        style={{ width: '100%', padding: '9px 12px' }}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                        Estimated Hours
                      </label>
                      <select
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '9px 12px' }}
                      >
                        {(isWeekendOt
                          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                          : [1, 2, 3, 4, 5, 6, 7, 8]
                        ).map((h) => (
                          <option key={h} value={h}>
                            {h}.0 {h === 1 ? 'Hour' : 'Hours'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="leave-dates-row">
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '9px 12px' }}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  {leaveType === 'Overtime (OT)' ? 'Deliverables & Work Justification' : 'Justification / Specific Reason'}
                </label>
                <PredictiveTextarea
                  id="leaveReasonInput"
                  rows={4}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder={
                    leaveType === 'Overtime (OT)'
                      ? isWeekendOt
                        ? "Detail the specific weekend tasks, student consultation, laboratory maintenance, or make-up deliverables to be executed on campus..."
                        : "Detail the urgent tasks, document preparations, or lab maintenance to be executed during overtime..."
                      : "State the reason for absence or off-campus assignment for Department Head review..."
                  }
                  contextType="leave"
                  fieldName={`leaveReason (${leaveType})`}
                  role={currentUser?.job_title || currentUser?.jobTitle || 'COS Personnel'}
                  department={typeof currentUser?.department === 'object' ? (currentUser?.department?.name || 'Computer Studies Department') : (currentUser?.department || 'Computer Studies Department')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLeave}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Send size={15} />
                {isSubmittingLeave
                  ? 'Submitting Request...'
                  : leaveType === 'Overtime (OT)'
                  ? 'Request Overtime Authorization'
                  : 'Submit to Department Head'}
              </button>
            </form>
          </div>

          {/* Past Requests History */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
              <div className="card-title" style={{ margin: 0 }}>
                My Submitted Requests
              </div>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '460px' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Schedule</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((l) => {
                    const isOt = l.leave_type?.toLowerCase().includes('overtime');
                    const isOb = l.leave_type?.toLowerCase().includes('official business') || l.leave_type?.toLowerCase().includes('ob');
                    return (
                      <tr key={l.id}>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: isOt ? '#f5f3ff' : isOb ? '#eff6ff' : '#f8fafc',
                              color: isOt ? '#6d28d9' : isOb ? '#1d4ed8' : '#334155',
                              border: `1px solid ${isOt ? '#ddd6fe' : isOb ? '#bfdbfe' : '#e2e8f0'}`,
                            }}
                          >
                            {l.leave_type}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px' }}>
                          {l.start_date === l.end_date ? l.start_date : `${l.start_date} to ${l.end_date}`}
                        </td>
                        <td style={{ fontSize: '12.5px' }}>
                          {isOt ? 'Overtime' : `${l.days_count} day(s)`}
                        </td>
                      <td>
                        <span
                          className={`badge ${
                            l.status === 'APPROVED'
                              ? 'badge-completed'
                              : l.status === 'REJECTED'
                              ? 'badge-archived'
                              : 'badge-active'
                          }`}
                          style={{ fontSize: '11.5px' }}
                        >
                          {l.status === 'PENDING_DEPT_HEAD' ? 'Pending Review' : l.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--ink-700)' }}>
                        {l.review_notes || '—'}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
