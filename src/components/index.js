// Layout & Shell (SRS Section 8.1)
export { default as AppLayout } from './layout/AppLayout';

// Authentication & Account Recovery (UC-08, UC-11)
export { default as Login } from './auth/Login';
export { default as TokenizedSignUp } from './auth/TokenizedSignUp';
export { default as ForgotPassword } from './auth/ForgotPassword';
export { default as VerifyOtp } from './auth/VerifyOtp';
export { default as ResetNewPassword } from './auth/ResetNewPassword';
export { default as ProfileSettings } from './auth/ProfileSettings';

// Common Rubrics & Modals
export { default as DynamicRubric } from './common/DynamicRubric';
export { default as OfficialRatingSheetModal } from './common/OfficialRatingSheetModal';
export { default as FastTrackModal } from './common/FastTrackModal';
export { default as CampusGeofence } from './common/CampusGeofence';
export { default as AiPerformanceAnalysis } from './common/AiPerformanceAnalysis';
export { default as HistoricalAttendanceRoster } from './common/HistoricalAttendanceRoster';

// 1. COS Employee GUI Modules (SRS Section 8.1)
export { default as EmployeeDashboard } from './dashboard/EmployeeDashboard';
export { default as DailyReporting } from './employee/DailyReporting';
export { default as MonthlyReport } from './employee/MonthlyReport';
export { default as ContractStatus } from './employee/ContractStatus';
export { default as PeerEvaluations } from './employee/PeerEvaluations';
export { default as EmployeeAttendance } from './employee/EmployeeAttendance';
export { default as AttendanceLogs } from './employee/AttendanceLogs';

// 2. Department Head GUI Modules (SRS Section 8.1)
export { default as DeptHeadDashboard } from './dashboard/DeptHeadDashboard';
export { default as IntentReview } from './depthead/IntentReview';
export { default as DepartmentAttendance } from './depthead/DepartmentAttendance';

// 3. HR Personnel GUI Modules (SRS Section 8.1)
export { default as HRDashboard } from './dashboard/HRDashboard';
export { default as ExecutiveAnalytics } from './analytics/ExecutiveAnalytics';
export { default as EvaluationManagement } from './hr/EvaluationManagement';
export { default as EvaluationSettings } from './hr/EvaluationSettings';
export { default as EvaluationFormEditor } from './hr/EvaluationFormEditor';
export { default as HREvaluationsProxy } from './hr/HREvaluationsProxy';
export { default as CampusAttendance } from './hr/CampusAttendance';
export { default as UserManagement } from './management/UserManagement';
export { default as EmployeeRecordView } from './management/EmployeeRecordView';
export { default as ReportGenerator } from './reports/ReportGenerator';
export { default as AuditTrail } from './reports/AuditTrail';
export { default as BackupData } from './reports/BackupData';

// Notifications Center (UC-09, SRS Section 8.1)
export { default as NotificationHistory } from './notifications/NotificationHistory';
