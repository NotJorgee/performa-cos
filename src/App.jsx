import React, { useState } from 'react';
import './styles/style.css';
import {
  AppLayout,
  Login,
  ForgotPassword,
  VerifyOtp,
  ResetNewPassword,
  ProfileSettings,
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
  DepartmentManagement,
  ReportGenerator,
  AuditTrail,
} from './components';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot' | 'otp' | 'reset_pw'
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    fullName: 'Jorge Mikhael Gubantes',
    role: 'COS Employee', // 'COS Employee' | 'Department Head' | 'HR Personnel'
    department: 'Computer Studies Department',
    initials: 'JG',
    avatarUrl: null,
  });

  const handleRoleSwitch = (newRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role: newRole,
      department:
        newRole === 'HR Personnel'
          ? 'HRMDO Office'
          : 'Computer Studies Department',
    }));
    setCurrentView('dashboard');
  };

  // 1. Unauthenticated Login & Recovery Flows (UC-08)
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <Login
          onLogin={() => setIsAuthenticated(true)}
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
      onNavigate={(path) => setCurrentView(path)}
      onLogout={() => {
        setIsAuthenticated(false);
        setAuthView('login');
      }}
    >
      {/* Role Simulator Toolbar for Pair Programming / Capstone Evaluation */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          padding: '8px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
        }}
      >
        <div>
          <b>Simulate User Role:</b>{' '}
          <button
            className={`btn btn-sm ${currentUser.role === 'COS Employee' ? 'btn-primary' : ''}`}
            onClick={() => handleRoleSwitch('COS Employee')}
            style={{ margin: '0 4px' }}
          >
            COS Employee
          </button>
          <button
            className={`btn btn-sm ${currentUser.role === 'Department Head' ? 'btn-primary' : ''}`}
            onClick={() => handleRoleSwitch('Department Head')}
            style={{ margin: '0 4px' }}
          >
            Department Head
          </button>
          <button
            className={`btn btn-sm ${currentUser.role === 'HR Personnel' ? 'btn-primary' : ''}`}
            onClick={() => handleRoleSwitch('HR Personnel')}
            style={{ margin: '0 4px' }}
          >
            HR Personnel
          </button>
        </div>
        <span className="muted">
          Active View: <b>{currentView}</b>
        </span>
      </div>

      {/* ========================================================
          ROLE-SPECIFIC SCREEN ROUTING (SRS Section 8.1)
         ======================================================== */}

      {/* Universal Dashboard */}
      {currentView === 'dashboard' && currentUser.role === 'COS Employee' && (
        <EmployeeDashboard onNavigate={setCurrentView} />
      )}
      {currentView === 'dashboard' && currentUser.role === 'Department Head' && (
        <PendingEvaluations departmentName={currentUser.department} />
      )}
      {currentView === 'dashboard' && currentUser.role === 'HR Personnel' && (
        <HRDashboard onNavigate={setCurrentView} />
      )}

      {/* COS Employee Modules (SRS Section 8.1) */}
      {currentUser.role === 'COS Employee' && (
        <>
          {currentView === 'daily_report' && (
            <DailyReporting onNavigate={setCurrentView} />
          )}
          {currentView === 'monthly_report' && (
            <MonthlyReport
              onNavigate={setCurrentView}
              employeeName={currentUser.fullName}
              department={currentUser.department}
            />
          )}
          {currentView === 'contract_status' && (
            <ContractStatus />
          )}
          {currentView === 'peer_evaluations' && (
            <PeerEvaluations departmentName={currentUser.department} />
          )}
        </>
      )}

      {/* Department Head Modules (SRS Section 8.1) */}
      {currentUser.role === 'Department Head' && (
        <>
          {currentView === 'pending_evaluations' && (
            <PendingEvaluations departmentName={currentUser.department} />
          )}
        </>
      )}

      {/* HR Personnel Modules (SRS Section 8.1) */}
      {currentUser.role === 'HR Personnel' && (
        <>
          {currentView === 'evaluation_management' && (
            <EvaluationManagement />
          )}
          {currentView === 'hr_evaluations_proxy' && (
            <HREvaluationsProxy />
          )}
          {currentView === 'employee_management' && (
            <EmployeeManagement />
          )}
          {currentView === 'department_management' && (
            <DepartmentManagement />
          )}
          {currentView === 'report_generator' && (
            <ReportGenerator />
          )}
          {currentView === 'audit_trail' && (
            <AuditTrail />
          )}
        </>
      )}

      {/* Universal Profile & Security Settings (UC-11) */}
      {currentView === 'profile_settings' && (
        <ProfileSettings currentUser={currentUser} />
      )}
    </AppLayout>
  );
}
