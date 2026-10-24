// Layout & Shell (SRS Section 8.1)
export { default as AppLayout } from './layout/AppLayout';

// Authentication & Account Recovery (UC-08, UC-11)
export { default as Login } from './auth/Login';
export { default as ForgotPassword } from './auth/ForgotPassword';
export { default as VerifyOtp } from './auth/VerifyOtp';
export { default as ResetNewPassword } from './auth/ResetNewPassword';
export { default as ProfileSettings } from './auth/ProfileSettings';

// Common Rubrics & Modals
export { default as DynamicRubric } from './common/DynamicRubric';
export { default as FastTrackModal } from './common/FastTrackModal';
export { default as CampusGeofenceModal } from './common/CampusGeofenceModal';

// 1. COS Employee GUI Modules (SRS Section 8.1)
export { default as EmployeeDashboard } from './dashboard/EmployeeDashboard';
export { default as DailyReporting } from './employee/DailyReporting';
export { default as MonthlyReport } from './employee/MonthlyReport';
export { default as ContractStatus } from './employee/ContractStatus';
export { default as PeerEvaluations } from './employee/PeerEvaluations';

// 2. Department Head GUI Modules (SRS Section 8.1)
export { default as DeptHeadDashboard } from './dashboard/DeptHeadDashboard';
export { default as PendingEvaluations } from './depthead/PendingEvaluations';

// 3. HR Personnel GUI Modules (SRS Section 8.1)
export { default as HRDashboard } from './dashboard/HRDashboard';
export { default as EvaluationManagement } from './hr/EvaluationManagement';
export { default as HREvaluationsProxy } from './hr/HREvaluationsProxy';
export { default as EmployeeManagement } from './management/EmployeeManagement';
export { default as EmployeeRecordView } from './management/EmployeeRecordView';
export { default as AdministratorManagement } from './management/AdministratorManagement';
export { default as DepartmentManagement } from './management/DepartmentManagement';
export { default as ReportGenerator } from './reports/ReportGenerator';
export { default as AuditTrail } from './reports/AuditTrail';
