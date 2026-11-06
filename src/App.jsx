import React, { useState, useEffect, useCallback } from 'react';
import './styles/style.css';
import {
  AppLayout,
  Login,
  TokenizedSignUp,
  ForgotPassword,
  VerifyOtp,
  ResetNewPassword,
  ProfileSettings,
  CampusGeofence,
  // COS Employee GUI Modules (SRS Section 8.1)
  EmployeeDashboard,
  DailyReporting,
  MonthlyReport,
  ContractStatus,
  PeerEvaluations,
  // Department Head GUI Modules (SRS Section 8.1)
  DeptHeadDashboard,
  PendingEvaluations,
  IntentReview,
  // HR Personnel GUI Modules (SRS Section 8.1)
  HRDashboard,
  ExecutiveAnalytics,
  EvaluationManagement,
  HREvaluationsProxy,
  EmployeeManagement,
  AdministratorManagement,
  DepartmentManagement,
  ReportGenerator,
  AuditTrail,
  BackupData,
  NotificationHistory,
} from './components';
import { getInitialNotifications } from './utils/notificationsData';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  // Check for invitation token in URL query parameter (?token=... or ?invite=...)
  const [inviteToken, setInviteToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('invite') || '';
    }
    return '';
  });

  const [authView, setAuthView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('token') || params.get('invite')) {
        return 'signup';
      }
    }
    return 'login';
  }); // 'login' | 'signup' | 'forgot' | 'otp' | 'reset_pw'
  
  // Initialize state from existing localStorage token/user if present
  const storedUser = api.auth.getCurrentUser();
  const hasToken = Boolean(localStorage.getItem('performa_token'));

  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(hasToken && storedUser));
  const [currentUser, setCurrentUser] = useState(() => {
    if (storedUser) {
      return {
        id: storedUser.id,
        fullName: storedUser.fullName || 'User',
        role: storedUser.role || storedUser.roleLabel || 'COS Employee',
        department: storedUser.department || 'Unassigned',
        departmentId: storedUser.departmentId,
        initials: (storedUser.fullName || 'U')
          .replace(/^(Dr\.|Engr\.|Prof\.)\s*/i, '')
          .split(' ')
          .map((n) => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join(''),
        employeeIdNumber: storedUser.employeeIdNumber || '',
        jobTitle: storedUser.jobTitle || storedUser.role,
        avatarUrl: storedUser.avatarUrl || null,
        dateAppointed: storedUser.dateAppointed || null,
        contractStartDate: storedUser.contractStartDate || null,
        contractEndDate: storedUser.contractEndDate || null,
      };
    }
    return {
      fullName: 'Jorge Mikhael Gubantes',
      role: 'HR Personnel',
      department: 'HRMDO Office',
      initials: 'JG',
      employeeIdNumber: 'G11032026JMR',
      jobTitle: 'System Administrator',
      avatarUrl: null,
    };
  });

  // Password recovery flow states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryResetToken, setRecoveryResetToken] = useState('');
  const [recoveryError, setRecoveryError] = useState(null);
  const [recoveryStatusMsg, setRecoveryStatusMsg] = useState(null);

  // Dynamic role-aware notifications
  const [notifications, setNotifications] = useState(() =>
    getInitialNotifications(currentUser.role)
  );

  // Live in-app notifications from API (initial load + 30s background cycle + window focus)
  const refreshNotifications = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;
    try {
      const data = await api.notifications.list();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Notification sync notice:', err.message);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    refreshNotifications();

    const intervalId = setInterval(refreshNotifications, 30000);

    const onFocus = () => refreshNotifications();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser?.id, currentUser?.role, refreshNotifications]);

  const handleMarkAsRead = async (id, readState = false) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: readState } : n))
    );
    if (!readState) {
      try {
        await api.notifications.markAsRead(id);
      } catch (err) {
        console.error('Failed to mark notification read on API:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await api.notifications.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications read on API:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.notifications.delete(id);
    } catch (err) {
      console.error('Failed to delete notification on API:', err);
    }
  };

  const handleLogin = (userAccount) => {
    if (userAccount) {
      const roleStr = userAccount.role || userAccount.roleLabel || 'COS Employee';
      setCurrentUser({
        id: userAccount.id,
        fullName: userAccount.fullName,
        role: roleStr,
        department: userAccount.department,
        departmentId: userAccount.departmentId,
        initials: userAccount.initials || 'U',
        employeeIdNumber: userAccount.employeeIdNumber,
        jobTitle:
          userAccount.jobTitle ||
          (roleStr === 'COS Employee'
            ? 'Admin Aide'
            : roleStr === 'Department Head'
            ? 'Department Head'
            : 'HRMO Officer'),
        avatarUrl: userAccount.avatarUrl || null,
        dateAppointed: userAccount.dateAppointed || null,
        contractStartDate: userAccount.contractStartDate || null,
        contractEndDate: userAccount.contractEndDate || null,
      });
      setNotifications(getInitialNotifications(roleStr));
    }
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
    setAuthView('login');
  };

  const handleForgotSubmit = async (email) => {
    setRecoveryError(null);
    try {
      await api.auth.forgotPassword(email);
      setRecoveryEmail(email);
      setRecoveryStatusMsg(`An OTP code was dispatched to ${email}. Check your inbox.`);
      setAuthView('otp');
    } catch (err) {
      setRecoveryError(err.message || 'Failed to dispatch OTP. Please verify email.');
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    setRecoveryError(null);
    try {
      const res = await api.auth.verifyOtp(recoveryEmail, otpCode);
      setRecoveryResetToken(res.reset_token);
      setAuthView('reset_pw');
    } catch (err) {
      setRecoveryError(err.message || 'Invalid or expired OTP code.');
    }
  };

  const handleResetPassword = async ({ newPassword }) => {
    setRecoveryError(null);
    try {
      await api.auth.resetPassword(recoveryResetToken, newPassword);
      setAuthView('login');
    } catch (err) {
      setRecoveryError(err.message || 'Failed to reset password.');
    }
  };

  // 1. Unauthenticated Login & Recovery Flows (UC-08, UC-07)
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <Login
          onLogin={handleLogin}
          onForgotPassword={() => {
            setRecoveryError(null);
            setRecoveryStatusMsg(null);
            setAuthView('forgot');
          }}
        />
      );
    }
    if (authView === 'signup') {
      return (
        <TokenizedSignUp
          initialToken={inviteToken}
          onBackToLogin={() => {
            setAuthView('login');
            setInviteToken('');
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onLoginAsNewUser={(newUser) => {
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              window.history.replaceState({}, '', window.location.pathname);
            }
            handleLogin(newUser);
          }}
        />
      );
    }
    if (authView === 'forgot') {
      return (
        <ForgotPassword
          statusMessage={recoveryStatusMsg}
          onSubmitEmail={handleForgotSubmit}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'otp') {
      return (
        <VerifyOtp
          emailHint={recoveryEmail}
          errorMessage={recoveryError}
          onVerifyOtp={handleVerifyOtp}
          onResendOtp={() => handleForgotSubmit(recoveryEmail)}
          onBack={() => setAuthView('forgot')}
        />
      );
    }
    if (authView === 'reset_pw') {
      return (
        <ResetNewPassword
          errorMessage={recoveryError}
          onResetPassword={handleResetPassword}
        />
      );
    }
  }

  // 2. Authenticated System Shell (SRS Section 8.1)
  return (
    <AppLayout
      currentUser={currentUser}
      currentPath={currentView}
      notifications={notifications}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onNavigate={(path) => setCurrentView(path)}
      onLogout={handleLogout}
    >
      {/* ========================================================
          ROLE-SPECIFIC SCREEN ROUTING (SRS Section 8.1)
         ======================================================== */}

      {/* Universal Dashboard */}
      {currentView === 'dashboard' && currentUser.role === 'COS Employee' && (
        <EmployeeDashboard currentUser={currentUser} onNavigate={setCurrentView} />
      )}
      {currentView === 'dashboard' && currentUser.role === 'Department Head' && (
        <DeptHeadDashboard
          currentUser={currentUser}
          onNavigate={setCurrentView}
        />
      )}
      {currentView === 'dashboard' && currentUser.role === 'HR Personnel' && (
        <HRDashboard currentUser={currentUser} onNavigate={setCurrentView} />
      )}

      {/* COS Employee Modules (SRS Section 8.1) */}
      {currentUser.role === 'COS Employee' && (
        <>
          {currentView === 'daily_report' && (
            <DailyReporting
              currentUser={currentUser}
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'monthly_report' && (
            <MonthlyReport
              employeeId={currentUser.id}
              employeeName={currentUser.fullName}
              department={currentUser.department}
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
              backLabel="Back to Dashboard"
            />
          )}
          {currentView === 'contract_status' && (
            <ContractStatus
              currentUser={currentUser}
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'peer_evaluations' && (
            <PeerEvaluations
              departmentName={currentUser.department}
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
        </>
      )}

      {/* Department Head Modules (SRS Section 8.1) */}
      {currentUser.role === 'Department Head' && (
        <>
          {(currentView === 'pending_evaluations' || currentView === 'intent_review') && (
            <IntentReview
              departmentName={currentUser.department}
              onBack={() => setCurrentView('dashboard')}
              onNavigate={setCurrentView}
            />
          )}
          {(currentView === 'employee_records' ||
            currentView === 'report_generator' ||
            currentView === 'department_records') && (
            <ReportGenerator
              restrictDepartment={currentUser.department}
              departmentName={currentUser.department}
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
        </>
      )}

      {/* HR Personnel Modules (SRS Section 8.1) */}
      {currentUser.role === 'HR Personnel' && (
        <>
          {currentView === 'evaluation_management' && (
            <EvaluationManagement
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'hr_evaluations_proxy' && (
            <HREvaluationsProxy
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'employee_management' && (
            <EmployeeManagement
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'administrator_management' && (
            <AdministratorManagement
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'department_management' && (
            <DepartmentManagement
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'executive_analytics' && (
            <ExecutiveAnalytics
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {(currentView === 'report_generator' || currentView === 'employee_records') && (
            <ReportGenerator
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'audit_trail' && (
            <AuditTrail
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'backup_data' && (
            <BackupData
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
        </>
      )}

      {/* Institutional Campus Geofence Page (Universal for HR & Dept Heads) */}
      {currentView === 'campus_geofence' && (
        <CampusGeofence
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* Universal Profile, Account Settings & Security (UC-11) */}
      {(currentView === 'profile_settings' ||
        currentView === 'view_profile' ||
        currentView === 'account_settings' ||
        currentView === 'change_password') && (
        <ProfileSettings
          currentUser={currentUser}
          initialTab={currentView}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* Universal Notification Center & History (UC-09, SRS Section 8.1) */}
      {(currentView === 'notifications' || currentView === 'notification_history') && (
        <NotificationHistory
          notifications={notifications}
          currentUser={currentUser}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDeleteNotification={handleDeleteNotification}
          onRefreshNotifications={refreshNotifications}
          onNavigate={setCurrentView}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
    </AppLayout>
  );
}
