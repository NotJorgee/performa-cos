import React, { useState } from 'react';
import './styles/style.css';
import {
  AppLayout,
  Login,
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
  // HR Personnel GUI Modules (SRS Section 8.1)
  HRDashboard,
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

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot' | 'otp' | 'reset_pw'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    fullName: 'Jorge Mikhael Gubantes',
    role: 'COS Employee', // 'COS Employee' | 'Department Head' | 'HR Personnel'
    department: 'Computer Studies Department',
    initials: 'JG',
    employeeIdNumber: 'G10222026JMR',
    avatarUrl: null,
  });

  // Dynamic role-aware notifications
  const [notifications, setNotifications] = useState(() =>
    getInitialNotifications(currentUser.role)
  );

  const handleMarkAsRead = (id, readState = false) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: readState } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleLogin = (userAccount) => {
    if (userAccount) {
      setCurrentUser({
        fullName: userAccount.fullName,
        role: userAccount.roleLabel,
        department: userAccount.department,
        initials: userAccount.initials,
        employeeIdNumber: userAccount.employeeIdNumber,
        avatarUrl: userAccount.avatarUrl || null,
      });
      setNotifications(getInitialNotifications(userAccount.roleLabel));
    }
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  // 1. Unauthenticated Login & Recovery Flows (UC-08)
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <Login
          onLogin={handleLogin}
          onForgotPassword={() => setAuthView('forgot')}
        />
      );
    }
    if (authView === 'forgot') {
      return (
        <ForgotPassword
          onSubmitEmail={() => setAuthView('otp')}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'otp') {
      return (
        <VerifyOtp
          onVerifyOtp={() => setAuthView('reset_pw')}
          onBack={() => setAuthView('forgot')}
        />
      );
    }
    if (authView === 'reset_pw') {
      return (
        <ResetNewPassword
          onResetPassword={() => {
            setAuthView('login');
          }}
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
      onLogout={() => {
        setIsAuthenticated(false);
        setAuthView('login');
      }}
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
              onNavigate={setCurrentView}
              onBack={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'monthly_report' && (
            <MonthlyReport
              onNavigate={setCurrentView}
              employeeName={currentUser.fullName}
              department={currentUser.department}
              onBack={() => setCurrentView('dashboard')}
              backLabel="← Back to Dashboard"
            />
          )}
          {currentView === 'contract_status' && (
            <ContractStatus
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
          {currentView === 'pending_evaluations' && (
            <PendingEvaluations
              departmentName={currentUser.department}
              onBack={() => setCurrentView('dashboard')}
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
          {currentView === 'report_generator' && (
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
          onNavigate={setCurrentView}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
    </AppLayout>
  );
}
