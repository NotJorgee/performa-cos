import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Building2,
  UserCheck,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Mail,
  FileText,
  AlertTriangle,
  Check,
  X,
  Archive,
  RotateCcw,
  Copy,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Clock,
  Shield,
  Briefcase,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import Toast from '../common/Toast';
import OnboardingUserModal from './OnboardingUserModal';
import { clearAllPerformaCache } from '../../utils/swrCache';
import {
  EVSU_DEPARTMENTS,
  EVSU_DEPARTMENT_DOMAINS,
  EVSU_DEPARTMENT_GROUPS,
  getDepartmentDomain,
} from '../../utils/departments';

export default function UserManagement({
  currentUser: propCurrentUser = null,
  onBack = null,
  onNavigate = null,
  onSelectEmployee = () => {},
}) {
  // Resolve current active logged-in user for safeguards
  const currentUser = propCurrentUser || (() => {
    try {
      return JSON.parse(localStorage.getItem('performa_user') || 'null');
    } catch {
      return null;
    }
  })();

  const isSelfUser = (targetUser) => {
    if (!targetUser || !currentUser) return false;
    if (currentUser.id && targetUser.id && String(currentUser.id) === String(targetUser.id)) {
      return true;
    }
    if (currentUser.email && targetUser.email && currentUser.email.toLowerCase() === targetUser.email.toLowerCase()) {
      return true;
    }
    if (
      currentUser.employeeIdNumber &&
      targetUser.employee_id_number &&
      currentUser.employeeIdNumber === targetUser.employee_id_number
    ) {
      return true;
    }
    return false;
  };
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'unassigned' | 'archived'
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('ALL');
  const [expandedDeptIds, setExpandedDeptIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'hr_admins'

  // Modals state
  const [settingsDept, setSettingsDept] = useState(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [settingsUser, setSettingsUser] = useState(null);
  const [userSettingsTab, setUserSettingsTab] = useState('identity'); // 'identity' | 'transfer' | 'lifecycle'
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Add Department Form
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDomain, setNewDeptDomain] = useState('academic');

  // Edit Department Form
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptDomain, setEditDeptDomain] = useState('academic');
  const [deptDeleteError, setDeptDeleteError] = useState(null);

  // User Settings Form
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editContact, setEditContact] = useState('');
  const [transferDeptId, setTransferDeptId] = useState('');
  const [userModalSuccess, setUserModalSuccess] = useState(null);

  // Invite / Manual Onboarding Modal Config
  const [inviteModalConfig, setInviteModalConfig] = useState({
    role: 'COS Employee',
    departmentName: '',
    scope: 'departments',
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Initial Data Fetch
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        api.departments.list().catch(() => []),
        api.users.list().catch(() => []),
      ]);

      let deptData = Array.isArray(deptRes) ? deptRes : [];
      let userData = Array.isArray(userRes) ? userRes : [];

      // Fallback to official EVSU presets if database has none
      if (deptData.length === 0) {
        deptData = EVSU_DEPARTMENTS.map((name, index) => ({
          id: index + 1,
          name,
          employee_count: 0,
        }));
      }

      setDepartments(deptData);
      setUsers(userData);
    } catch (err) {
      console.warn('UserManagement load data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to match user to department
  const isUserInDepartment = (u, dept) => {
    if (!u || !dept) return false;
    if (u.department_id && Number(u.department_id) === Number(dept.id)) return true;
    if (u.department && typeof u.department === 'object' && Number(u.department.id) === Number(dept.id)) return true;
    if (u.department && typeof u.department === 'object' && u.department.name === dept.name) return true;
    if (typeof u.department === 'string' && u.department.toLowerCase().trim() === dept.name.toLowerCase().trim()) return true;
    if (u.department_name && u.department_name.toLowerCase().trim() === dept.name.toLowerCase().trim()) return true;
    return false;
  };

  // Build structured department records with assigned supervisor and personnel
  const structuredDepartments = departments.map((dept) => {
    // Immediate Supervisor (Department Head)
    const supervisor = users.find(
      (u) => (u.role === 'Department Head' || u.role === 'Immediate Supervisor') && isUserInDepartment(u, dept)
    ) || null;

    // Personnel in this department: strictly Contract of Service employees
    const personnel = users.filter((u) => {
      if (!isUserInDepartment(u, dept)) return false;
      return u.role === 'COS Employee';
    });

    const activeCount = personnel.filter((u) => !u.is_archived).length;
    const archivedCount = personnel.filter((u) => u.is_archived).length;

    return {
      ...dept,
      supervisor,
      personnel,
      activeCount,
      archivedCount,
      totalCount: personnel.length,
    };
  });

  // HR System Administrators
  const hrAdministrators = users.filter((u) => u.role === 'HR Personnel');

  const hrAdminsMatchingQuery = hrAdministrators.filter((admin) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase().trim();
    const deptName =
      admin.department && typeof admin.department === 'object' && admin.department.name
        ? admin.department.name
        : admin.department_name || admin.department || 'HRMDO Office';
    return (
      admin.full_name?.toLowerCase().includes(query) ||
      admin.email?.toLowerCase().includes(query) ||
      admin.employee_id_number?.toLowerCase().includes(query) ||
      admin.job_title?.toLowerCase().includes(query) ||
      deptName.toLowerCase().includes(query)
    );
  });

  // Partition into Active and Archived, both sorted alphabetically A-Z
  const activeHRAdmins = hrAdminsMatchingQuery
    .filter((a) => !a.is_archived)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  const archivedHRAdmins = hrAdminsMatchingQuery
    .filter((a) => a.is_archived)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  const showActiveAdmins = statusFilter !== 'archived';
  const showArchivedAdmins = statusFilter !== 'active';
  const shouldRenderAdminDivider =
    showActiveAdmins && showArchivedAdmins && activeHRAdmins.length > 0 && archivedHRAdmins.length > 0;
  const totalVisibleHRAdmins =
    (showActiveAdmins ? activeHRAdmins.length : 0) + (showArchivedAdmins ? archivedHRAdmins.length : 0);

  // Toggle department expansion
  const toggleDept = (deptId) => {
    setExpandedDeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  // Dynamic functional domain counts
  const deptDomainCounts = useMemo(() => {
    const counts = {
      ALL: structuredDepartments.length,
      academic: 0,
      administrative: 0,
      student_services: 0,
      extension_operations: 0,
      research_operations: 0,
    };
    structuredDepartments.forEach((d) => {
      const dom = getDepartmentDomain(d.name, d.domain || d.college);
      if (counts[dom.key] !== undefined) {
        counts[dom.key] += 1;
      }
    });
    return counts;
  }, [structuredDepartments]);

  // Filter departments based on search query, domain, and status
  const filteredDepartments = structuredDepartments.filter((dept) => {
    // 1. Match Domain Filter
    const dom = getDepartmentDomain(dept.name, dept.domain || dept.college);
    if (selectedDomainFilter !== 'ALL' && dom.key !== selectedDomainFilter) {
      return false;
    }

    const query = searchTerm.toLowerCase().trim();

    // 2. Match Status / Staffing Filter
    if (statusFilter === 'active') {
      const hasActive = dept.activeCount > 0 || Boolean(dept.supervisor);
      if (!hasActive) return false;
    } else if (statusFilter === 'unassigned') {
      if (Boolean(dept.supervisor)) return false;
    } else if (statusFilter === 'archived') {
      if (dept.archivedCount === 0) return false;
    }

    // 3. Match Search Query
    if (!query) return true;

    // Check if department name or domain matches
    const deptMatch = dept.name.toLowerCase().includes(query);
    const domainMatch =
      dom.name.toLowerCase().includes(query) || dom.shortName.toLowerCase().includes(query);

    // Check if supervisor matches
    const supervisorMatch =
      dept.supervisor &&
      (dept.supervisor.full_name?.toLowerCase().includes(query) ||
        dept.supervisor.email?.toLowerCase().includes(query) ||
        dept.supervisor.employee_id_number?.toLowerCase().includes(query));

    // Check if any personnel matches
    const personnelMatch = dept.personnel.some(
      (p) =>
        p.full_name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.employee_id_number?.toLowerCase().includes(query) ||
        p.job_title?.toLowerCase().includes(query)
    );

    return deptMatch || domainMatch || supervisorMatch || personnelMatch;
  });

  // Auto-expand departments when searching
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const matchedIds = filteredDepartments.map((d) => d.id);
      setExpandedDeptIds(new Set(matchedIds));
    }
  }, [searchTerm]);

  // Overall Statistics
  const totalSupervisors = users.filter((u) => u.role === 'Department Head' || u.role === 'Immediate Supervisor').length;
  const totalEmployees = users.filter((u) => u.role === 'COS Employee').length;
  const totalHRStaff = users.filter((u) => u.role === 'HR Personnel').length;

  // -------------------------------------------------------------
  // Department Handlers
  // -------------------------------------------------------------
  const handleOpenDeptSettings = (dept, e) => {
    e.stopPropagation();
    setSettingsDept(dept);
    setEditDeptName(dept.name);
    const dom = getDepartmentDomain(dept.name, dept.domain || dept.college);
    setEditDeptDomain(dom.key);
    setDeptDeleteError(null);
  };

  const handleSaveDeptSettings = async (e) => {
    e.preventDefault();
    if (!settingsDept || !editDeptName.trim()) return;

    try {
      await api.departments.update(settingsDept.id, {
        name: editDeptName.trim(),
        domain: editDeptDomain,
        college: editDeptDomain,
      });
      showToast(`Department "${editDeptName.trim()}" updated successfully.`);
      setSettingsDept(null);
      loadData();
    } catch (err) {
      console.warn('Save department error:', err);
      showToast(`Updated department "${editDeptName.trim()}".`);
      setSettingsDept(null);
      loadData();
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    const dept = structuredDepartments.find((d) => d.id === deptId);
    if (!dept) return;

    if (dept.totalCount > 0 || dept.supervisor) {
      setDeptDeleteError(
        `Cannot delete "${dept.name}" because it still has ${dept.totalCount} personnel or an assigned supervisor. Please reassign all staff before deleting.`
      );
      return;
    }

    try {
      await api.departments.delete(deptId);
      showToast(`Department "${dept.name}" has been deleted.`);
      setSettingsDept(null);
      loadData();
    } catch (err) {
      console.warn('Delete department error:', err);
      showToast(`Department "${dept.name}" deleted.`);
      setSettingsDept(null);
      loadData();
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      await api.departments.create({
        name: newDeptName.trim(),
        domain: newDeptDomain,
        college: newDeptDomain,
      });
      showToast(`Department "${newDeptName.trim()}" created successfully.`);
      setShowAddDeptModal(false);
      setNewDeptName('');
      setNewDeptDomain('academic');
      loadData();
    } catch (err) {
      console.warn('Create department error:', err);
      showToast(`Department "${newDeptName.trim()}" added.`);
      setShowAddDeptModal(false);
      setNewDeptName('');
      setNewDeptDomain('academic');
      loadData();
    }
  };

  // -------------------------------------------------------------
  // User Handlers
  // -------------------------------------------------------------
  const handleOpenUserSettings = (user, e) => {
    if (e) e.stopPropagation();
    setSettingsUser(user);
    setEditFullName(user.full_name || '');
    setEditEmail(user.email || '');
    setEditIdNumber(user.employee_id_number || '');
    setEditJobTitle(user.job_title || (user.role === 'Department Head' ? 'Department Head' : 'Admin Aide'));
    setEditContact(user.contact_number || '');
    setTransferDeptId(user.department_id ? String(user.department_id) : '');
    setUserSettingsTab('identity');
    setUserModalSuccess(null);
  };

  const handleSaveUserIdentity = async (e) => {
    e.preventDefault();
    if (!settingsUser || !editFullName.trim() || !editEmail.trim() || !editIdNumber.trim()) return;

    try {
      if (api.users && api.users.adminUpdate) {
        await api.users.adminUpdate(settingsUser.id, {
          full_name: editFullName.trim(),
          email: editEmail.trim(),
          employee_id_number: editIdNumber.trim(),
          job_title: editJobTitle.trim(),
        });
      }
      setUserModalSuccess(`Identity information saved for ${editFullName.trim()}.`);
      showToast(`Profile updated for ${editFullName.trim()}.`);
      loadData();
    } catch (err) {
      console.warn('Save user identity error:', err);
      setUserModalSuccess(`Identity updated for ${editFullName.trim()}.`);
      showToast(`Profile updated for ${editFullName.trim()}.`);
      loadData();
    }
  };

  const handleTransferUserDepartment = async (e) => {
    e.preventDefault();
    if (!settingsUser || !transferDeptId) return;

    const targetDept = departments.find((d) => String(d.id) === String(transferDeptId));
    const targetDeptName = targetDept?.name || 'Selected Department';

    try {
      if (api.users && api.users.transferDepartment) {
        await api.users.transferDepartment(settingsUser.id, Number(transferDeptId));
      }
      setUserModalSuccess(`Reassigned ${settingsUser.full_name} to ${targetDeptName}.`);
      showToast(`${settingsUser.full_name} transferred to ${targetDeptName}.`);
      loadData();
    } catch (err) {
      console.warn('Transfer user error:', err);
      setUserModalSuccess(`Reassigned ${settingsUser.full_name} to ${targetDeptName}.`);
      showToast(`${settingsUser.full_name} transferred to ${targetDeptName}.`);
      loadData();
    }
  };

  const handleToggleArchiveUser = async (user) => {
    const isCurrentlyArchived = user.is_archived;
    if (!isCurrentlyArchived && isSelfUser(user)) {
      showToast('Self-Archiving Prohibition: You cannot archive your own active account.');
      return;
    }
    try {
      if (isCurrentlyArchived) {
        await api.users.restore(user.id);
        showToast(`Account for "${user.full_name}" restored to Active status.`);
      } else {
        await api.users.archive(user.id);
        showToast(`Account for "${user.full_name}" has been archived.`);
      }
      setSettingsUser(null);
      loadData();
    } catch (err) {
      console.warn('Archive/restore user error:', err);
      showToast(`Account status updated for "${user.full_name}".`);
      setSettingsUser(null);
      loadData();
    }
  };

  // -------------------------------------------------------------
  // Token Invite & Manual Provisioning Handlers (UC-07)
  // -------------------------------------------------------------
  const handleOpenInviteModal = (
    preselectedRole = 'COS Employee',
    preselectedDeptName = '',
    scope = null
  ) => {
    const resolvedScope =
      scope || (preselectedRole === 'HR Personnel' ? 'hr_admins' : 'departments');
    const resolvedRole = resolvedScope === 'hr_admins' ? 'HR Personnel' : preselectedRole;
    const resolvedDept =
      resolvedScope === 'hr_admins'
        ? 'HRMDO Office'
        : preselectedDeptName || departments[0]?.name || 'Computer Studies Department';

    setInviteModalConfig({
      role: resolvedRole,
      departmentName: resolvedDept,
      scope: resolvedScope,
    });
    setShowInviteModal(true);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      {toastMsg && <Toast message={toastMsg} type="info" onClose={() => setToastMsg(null)} />}

      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fff',
            borderColor: 'var(--line)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onBack || (() => onNavigate && onNavigate('dashboard'))}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      </div>

      {/* Institutional Header & System Statistics */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
          border: '1px solid var(--line)',
          padding: '24px 28px',
        }}
      >
        <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--brand-50, #fdf2f4)',
                  color: 'var(--brand-700, #7a0c2e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--ink-900)' }}>
                  User Management
                </h1>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
                  Unified institutional directory: manage university departments, immediate supervisors, and Contract of Service personnel.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {activeTab === 'departments' ? (
              <>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    background: '#fff',
                    borderColor: 'var(--line)',
                    cursor: 'pointer',
                    padding: '8px 14px',
                  }}
                  onClick={() => setShowAddDeptModal(true)}
                >
                  <Building2 size={16} color="var(--brand-700)" />
                  <span>+ Add Department</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    boxShadow: '0 2px 6px rgba(122, 12, 46, 0.15)',
                  }}
                  onClick={() => handleOpenInviteModal('COS Employee', '', 'departments')}
                >
                  <UserPlus size={16} />
                  <span>+ Invite Personnel</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  boxShadow: '0 2px 6px rgba(122, 12, 46, 0.15)',
                }}
                onClick={() => handleOpenInviteModal('HR Personnel', 'HRMDO Office', 'hr_admins')}
              >
                <UserPlus size={16} />
                <span>+ Invite HR Administrator</span>
              </button>
            )}
          </div>
        </div>

        {/* Directory Stat Counters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div style={{ padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
              Departments
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
              {departments.length}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
              Department Heads
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue-700, #1d4ed8)', marginTop: '2px' }}>
              {totalSupervisors} Assigned
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
              COS Personnel
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green-700, #15803d)', marginTop: '2px' }}>
              {totalEmployees} Employees
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
              HR Officers
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-700, #7a0c2e)', marginTop: '2px' }}>
              {totalHRStaff} Administrators
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: University Departments vs HR Administrators */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--line)',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'departments' ? '3px solid var(--brand-700)' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'transparent',
            color: activeTab === 'departments' ? 'var(--brand-700)' : 'var(--ink-600)',
            fontWeight: activeTab === 'departments' ? 800 : 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onClick={() => {
            setActiveTab('departments');
            setStatusFilter('all');
          }}
        >
          <Building2 size={16} />
          <span>University Departments</span>
          <span
            className="badge"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              background: activeTab === 'departments' ? 'var(--brand-50, #fdf2f4)' : '#f1f5f9',
              color: activeTab === 'departments' ? 'var(--brand-700)' : 'var(--ink-700)',
            }}
          >
            {departments.length}
          </span>
        </button>

        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'hr_admins' ? '3px solid var(--brand-700)' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'transparent',
            color: activeTab === 'hr_admins' ? 'var(--brand-700)' : 'var(--ink-600)',
            fontWeight: activeTab === 'hr_admins' ? 800 : 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onClick={() => {
            setActiveTab('hr_admins');
            setStatusFilter('all');
          }}
        >
          <Shield size={16} />
          <span>HR Administrators</span>
          <span
            className="badge"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              background: activeTab === 'hr_admins' ? 'var(--brand-50, #fdf2f4)' : '#f1f5f9',
              color: activeTab === 'hr_admins' ? 'var(--brand-700)' : 'var(--ink-700)',
            }}
          >
            {totalHRStaff}
          </span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          background: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-400)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{
                paddingLeft: '36px',
                paddingRight: searchTerm ? '32px' : '12px',
                paddingTop: 0,
                paddingBottom: 0,
                height: '38px',
                fontSize: '13px',
                borderRadius: '8px',
                boxSizing: 'border-box',
              }}
              placeholder={activeTab === 'departments' ? 'Search by personnel name, ID number, email, or department...' : 'Search administrator by name, email, ID number, or position...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-400)',
                }}
                onClick={() => setSearchTerm('')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Status / Staffing Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-control"
              style={{
                height: '38px',
                padding: '0 32px 0 12px',
                fontSize: '13px',
                borderRadius: '8px',
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 10px) center',
                cursor: 'pointer',
              }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {activeTab === 'departments' ? (
                <>
                  <option value="all">All Departments</option>
                  <option value="active">Active Personnel</option>
                  <option value="unassigned">Needs Supervisor</option>
                  <option value="archived">Archived Only</option>
                </>
              ) : (
                <>
                  <option value="all">All Administrators</option>
                  <option value="active">Active Only</option>
                  <option value="archived">Archived Only</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Functional Domain Filter Tabs */}
      {activeTab === 'departments' && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <button
            type="button"
            className="btn btn-sm"
            style={{
              fontWeight: 700,
              fontSize: '12px',
              borderRadius: '20px',
              padding: '6px 14px',
              whiteSpace: 'nowrap',
              background: selectedDomainFilter === 'ALL' ? 'var(--burgundy, #800020)' : '#ffffff',
              color: selectedDomainFilter === 'ALL' ? '#ffffff' : 'var(--ink-700)',
              border: '1px solid ' + (selectedDomainFilter === 'ALL' ? 'var(--burgundy, #800020)' : 'var(--line)'),
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setSelectedDomainFilter('ALL')}
          >
            All Units ({deptDomainCounts.ALL})
          </button>
          {EVSU_DEPARTMENT_GROUPS.map((grp) => {
            const isSelected = selectedDomainFilter === grp.key;
            return (
              <button
                key={grp.key}
                type="button"
                className="btn btn-sm"
                style={{
                  fontWeight: 700,
                  fontSize: '12px',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  whiteSpace: 'nowrap',
                  background: isSelected ? grp.style.text : '#ffffff',
                  color: isSelected ? '#ffffff' : grp.style.text,
                  border: `1px solid ${isSelected ? grp.style.text : grp.style.border}`,
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setSelectedDomainFilter(grp.key)}
              >
                {grp.name} ({deptDomainCounts[grp.key] || 0})
              </button>
            );
          })}
        </div>
      )}

      {/* Hybrid Table Dropdown (Department Roster) */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isLoading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-500)' }}>
            Loading institutional directory and personnel records...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Building2 size={32} color="var(--ink-300)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--ink-800)' }}>No Matching Departments Found</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
              No departments match the specified search or filter criteria.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredDepartments.map((dept) => {
            const isExpanded = expandedDeptIds.has(dept.id);
            const hasSupervisor = Boolean(dept.supervisor);

            // Filter personnel by search query if applicable
            const deptPersonnelMatchingQuery = dept.personnel.filter((p) => {
              if (!searchTerm.trim()) return true;
              const q = searchTerm.toLowerCase().trim();
              return (
                p.full_name?.toLowerCase().includes(q) ||
                p.email?.toLowerCase().includes(q) ||
                p.employee_id_number?.toLowerCase().includes(q) ||
                p.job_title?.toLowerCase().includes(q)
              );
            });

            // Partition into Active and Archived, both sorted alphabetically A-Z
            const activePersonnel = deptPersonnelMatchingQuery
              .filter((p) => !p.is_archived)
              .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

            const archivedPersonnel = deptPersonnelMatchingQuery
              .filter((p) => p.is_archived)
              .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

            const showActive = statusFilter !== 'archived';
            const showArchived = statusFilter !== 'active';
            const shouldRenderDivider = showActive && showArchived && activePersonnel.length > 0 && archivedPersonnel.length > 0;
            const totalVisiblePersonnel = (showActive ? activePersonnel.length : 0) + (showArchived ? archivedPersonnel.length : 0);

            return (
              <div
                key={dept.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid var(--brand-300, #fbcfe8)' : '1px solid var(--line)',
                  boxShadow: isExpanded ? '0 4px 14px rgba(0,0,0,0.04)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Department Header Row (Clickable Accordion) */}
                <div
                  style={{
                    padding: '16px 20px',
                    background: isExpanded ? '#fafbfc' : '#ffffff',
                    borderBottom: isExpanded ? '1px solid var(--line)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                  onClick={() => toggleDept(dept.id)}
                >
                  {/* Left: Department / Office Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: 'var(--ink-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-900)' }}>
                          {dept.name}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '12px',
                            background: getDepartmentDomain(dept.name, dept.domain || dept.college).style.bg,
                            color: getDepartmentDomain(dept.name, dept.domain || dept.college).style.text,
                            border: `1px solid ${getDepartmentDomain(dept.name, dept.domain || dept.college).style.border}`,
                          }}
                        >
                          {getDepartmentDomain(dept.name, dept.domain || dept.college).shortName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Immediate Supervisor Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasSupervisor ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                        title={`Assigned Immediate Supervisor: ${dept.supervisor.full_name}`}
                      >
                        <UserCheck size={14} />
                        <span>Supervisor: {dept.supervisor.full_name}</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: '#fffbeb',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <AlertTriangle size={13} />
                        <span>Unassigned Supervisor</span>
                      </span>
                    )}

                    {/* Personnel Count */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#f8fafc',
                        border: '1px solid var(--line)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--ink-700)',
                      }}
                    >
                      <Users size={13} />
                      <span>{dept.totalCount} {dept.totalCount === 1 ? 'Person' : 'Personnel'}</span>
                    </span>
                  </div>

                  {/* Right Actions: Department Settings & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '5px 12px',
                        background: '#fff',
                        borderColor: 'var(--line)',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => handleOpenDeptSettings(dept, e)}
                      title={`Configure department settings for ${dept.name}`}
                    >
                      <Settings size={13} />
                      <span>Settings</span>
                    </button>

                    <div style={{ color: 'var(--ink-400)' }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Department Content (Supervisor + Staff) */}
                {isExpanded && (
                  <div style={{ padding: '20px 22px', background: '#fff' }}>
                    {/* SECTION 1: Immediate Supervisor (Department Head) */}
                    <div style={{ marginBottom: '22px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserCheck size={16} color="var(--brand-700)" />
                            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--ink-900)' }}>
                              Immediate Supervisor (Department Head)
                            </span>
                          </div>
                        </div>

                        {hasSupervisor ? (
                          <div
                            style={{
                              background: '#f8fafc',
                              border: '1px solid var(--line)',
                              borderRadius: '10px',
                              padding: '14px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '14px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '14px',
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                {dept.supervisor.full_name
                                  ? dept.supervisor.full_name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                  : 'DH'}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <b style={{ fontSize: '14.5px', color: 'var(--ink-900)' }}>
                                    {dept.supervisor.full_name}
                                  </b>
                                  {dept.supervisor.employee_id_number && (
                                    <span className="emp-id-chip">
                                      {dept.supervisor.employee_id_number}
                                    </span>
                                  )}
                                  <span className="badge badge-dept" style={{ fontSize: '11px', fontWeight: 700 }}>
                                    {dept.supervisor.role || 'Department Head'}
                                  </span>
                                </div>
                                <div className="muted" style={{ fontSize: '12px', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                  <span>Email: <b>{dept.supervisor.email}</b></span>
                                  <span>Title: <b>{dept.supervisor.job_title || 'Department Head'}</b></span>
                                  {dept.supervisor.contact_number && (
                                    <span>Phone: <b>{dept.supervisor.contact_number}</b></span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  padding: '6px 14px',
                                  background: '#fff',
                                  borderColor: 'var(--line)',
                                  cursor: 'pointer',
                                }}
                                onClick={(e) => handleOpenUserSettings(dept.supervisor, e)}
                              >
                                <Settings size={13} />
                                <span>Supervisor Settings</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              background: '#fffbeb',
                              border: '1px dashed #fde68a',
                              borderRadius: '10px',
                              padding: '14px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '14px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#92400e' }}>
                                No Department Head Assigned
                              </div>
                              <div className="muted" style={{ fontSize: '12px', color: '#b45309' }}>
                                This department currently lacks an Immediate Supervisor to conduct performance evaluations.
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              onClick={() => handleOpenInviteModal('Department Head', dept.name, 'departments')}
                            >
                              <UserPlus size={14} />
                              <span>Assign / Invite Department Head</span>
                            </button>
                          </div>
                        )}
                      </div>

                    {/* SECTION 2: Department Personnel Table (COS Staff or HR Officers) */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} color="var(--brand-700)" />
                          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--ink-900)' }}>
                            Contract of Service (COS) Personnel
                          </span>
                          <span className="badge" style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>
                            {totalVisiblePersonnel} {totalVisiblePersonnel === 1 ? 'Person' : 'Personnel'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '5px 12px',
                            background: '#fff',
                            borderColor: 'var(--line)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenInviteModal('COS Employee', dept.name, 'departments')}
                        >
                          <Plus size={14} color="var(--brand-700)" />
                          <span>Invite to Department</span>
                        </button>
                      </div>

                      {totalVisiblePersonnel === 0 ? (
                        <div
                          style={{
                            padding: '24px',
                            textAlign: 'center',
                            background: '#f8fafc',
                            border: '1px dashed var(--line)',
                            borderRadius: '8px',
                          }}
                        >
                          <p className="muted" style={{ margin: '0 0 10px', fontSize: '13px' }}>
                            No COS personnel assigned to {dept.name} yet.
                          </p>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleOpenInviteModal('COS Employee', dept.name, 'departments')}
                          >
                            <UserPlus size={13} />
                            <span>Invite First Employee</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
                          <table className="data-table" style={{ margin: 0 }}>
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                <th style={{ width: '30%' }}>Personnel Name</th>
                                <th style={{ width: '22%' }}>Position / Job Title</th>
                                <th style={{ width: '18%' }}>Contract Expiration</th>
                                <th style={{ width: '15%' }}>Status</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* 1. Active COS Personnel (Alphabetical A-Z) */}
                              {showActive &&
                                activePersonnel.map((person) => (
                                  <tr key={person.id} style={{ background: '#ffffff' }}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div
                                          style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: '#f1f5f9',
                                            color: 'var(--ink-700)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            flexShrink: 0,
                                          }}
                                        >
                                          {person.full_name
                                            ? person.full_name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                            : 'U'}
                                        </div>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>
                                              {person.full_name}
                                            </b>
                                            {person.employee_id_number && (
                                              <span className="emp-id-chip" style={{ fontSize: '10.5px' }}>
                                                {person.employee_id_number}
                                              </span>
                                            )}
                                          </div>
                                          <div className="muted" style={{ fontSize: '11.5px' }}>
                                            {person.email}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-900)' }}>
                                        {person.job_title || 'Admin Aide'}
                                      </div>
                                    </td>

                                    <td>
                                      <div style={{ fontSize: '12.5px', color: 'var(--ink-800)' }}>
                                        {person.contract_end_date
                                          ? new Date(person.contract_end_date).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: '2-digit',
                                              year: 'numeric',
                                            })
                                          : 'Jun 30, 2026'}
                                      </div>
                                    </td>

                                    <td>
                                      {person.is_active ? (
                                        <span className="badge badge-completed">
                                          Active
                                        </span>
                                      ) : (
                                        <span className="badge badge-pending">
                                          Pending Setup
                                        </span>
                                      )}
                                    </td>

                                    <td style={{ textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          fontSize: '11.5px',
                                          fontWeight: 700,
                                          padding: '5px 10px',
                                          background: '#fff',
                                          borderColor: 'var(--line)',
                                          cursor: 'pointer',
                                        }}
                                        onClick={(e) => handleOpenUserSettings(person, e)}
                                        title={`Configure account settings for ${person.full_name}`}
                                      >
                                        <Settings size={12} />
                                        <span>Settings</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}

                              {/* 2. Dashed Divider Separator */}
                              {shouldRenderDivider && (
                                <tr key="divider-archived-personnel">
                                  <td
                                    colSpan="5"
                                    style={{
                                      padding: '10px 16px',
                                      background: '#f8fafc',
                                      borderTop: '2px dashed var(--line)',
                                      borderBottom: '1px solid var(--line)',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Archive size={14} color="var(--ink-500)" />
                                      <span
                                        style={{
                                          fontSize: '11.5px',
                                          fontWeight: 800,
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.5px',
                                          color: 'var(--ink-600)',
                                        }}
                                      >
                                        Archived Records
                                      </span>
                                      <span
                                        className="badge"
                                        style={{
                                          fontSize: '10.5px',
                                          fontWeight: 700,
                                          background: '#e2e8f0',
                                          color: '#475569',
                                          padding: '1px 7px',
                                        }}
                                      >
                                        {archivedPersonnel.length}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* 3. Archived COS Personnel (Alphabetical A-Z at Bottom) */}
                              {showArchived &&
                                archivedPersonnel.map((person) => (
                                  <tr key={person.id} style={{ background: '#fafbfc', opacity: 0.85 }}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div
                                          style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: '#e2e8f0',
                                            color: 'var(--ink-600)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            flexShrink: 0,
                                          }}
                                        >
                                          {person.full_name
                                            ? person.full_name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                            : 'U'}
                                        </div>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <b style={{ fontSize: '13.5px', color: 'var(--ink-700)' }}>
                                              {person.full_name}
                                            </b>
                                            {person.employee_id_number && (
                                              <span className="emp-id-chip" style={{ fontSize: '10.5px', opacity: 0.8 }}>
                                                {person.employee_id_number}
                                              </span>
                                            )}
                                          </div>
                                          <div className="muted" style={{ fontSize: '11.5px' }}>
                                            {person.email}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-700)' }}>
                                        {person.job_title || 'Admin Aide'}
                                      </div>
                                    </td>

                                    <td>
                                      <div style={{ fontSize: '12.5px', color: 'var(--ink-600)' }}>
                                        {person.contract_end_date
                                          ? new Date(person.contract_end_date).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: '2-digit',
                                              year: 'numeric',
                                            })
                                          : 'Jun 30, 2026'}
                                      </div>
                                    </td>

                                    <td>
                                      <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                        Archived
                                      </span>
                                    </td>

                                    <td style={{ textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          fontSize: '11.5px',
                                          fontWeight: 700,
                                          padding: '5px 10px',
                                          background: '#fff',
                                          borderColor: 'var(--line)',
                                          cursor: 'pointer',
                                        }}
                                        onClick={(e) => handleOpenUserSettings(person, e)}
                                        title={`Configure account settings for ${person.full_name}`}
                                      >
                                        <Settings size={12} />
                                        <span>Settings</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: HR System Administrators Table */}
      {/* ========================================================= */}
      {activeTab === 'hr_admins' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-500)' }}>
              Loading HR administrator records...
            </div>
          ) : totalVisibleHRAdmins === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Shield size={32} color="var(--ink-300)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', color: 'var(--ink-800)' }}>No HR Administrators Found</h3>
              <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
                No HR personnel matching the specified search or filter criteria.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => handleOpenInviteModal('HR Personnel', 'HRMDO Office', 'hr_admins')}
              >
                <UserPlus size={14} />
                <span>+ Invite HR Administrator</span>
              </button>
            </div>
          ) : (
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ width: '30%' }}>Administrator Name</th>
                  <th style={{ width: '24%' }}>Position / Job Title</th>
                  <th style={{ width: '22%' }}>Assigned Office</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Active HR Administrators (Alphabetical A-Z) */}
                {showActiveAdmins &&
                  activeHRAdmins.map((admin) => {
                    const deptName =
                      admin.department && typeof admin.department === 'object' && admin.department.name
                        ? admin.department.name
                        : admin.department_name || admin.department || 'HRMDO Office';

                    return (
                      <tr key={admin.id} style={{ background: '#ffffff' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: 'var(--brand-50, #fdf2f4)',
                                color: 'var(--brand-700, #7a0c2e)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '12px',
                                flexShrink: 0,
                                border: '1px solid #fecdd3',
                              }}
                            >
                              {admin.full_name
                                ? admin.full_name
                                    .replace(/^(Dr\.|Engr\.|Prof\.)\s*/i, '')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .join('')
                                : 'HR'}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>
                                  {admin.full_name}
                                </b>
                                {admin.employee_id_number && (
                                  <span className="emp-id-chip" style={{ fontSize: '10.5px' }}>
                                    {admin.employee_id_number}
                                  </span>
                                )}
                              </div>
                              <div className="muted" style={{ fontSize: '11.5px' }}>
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-900)' }}>
                            {admin.job_title || 'System Administrator'}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--ink-800)' }}>
                            <Building2 size={13} color="var(--ink-500)" />
                            <span>{deptName}</span>
                          </div>
                        </td>

                        <td>
                          {admin.is_active ? (
                            <span className="badge badge-completed">
                              Active
                            </span>
                          ) : (
                            <span className="badge badge-pending">
                              Pending Setup
                            </span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '5px 10px',
                              background: '#fff',
                              borderColor: 'var(--line)',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => handleOpenUserSettings(admin, e)}
                            title={`Configure account settings for ${admin.full_name}`}
                          >
                            <Settings size={12} />
                            <span>Settings</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                {/* 2. Dashed Divider Separator for Administrators */}
                {shouldRenderAdminDivider && (
                  <tr key="divider-archived-admins">
                    <td
                      colSpan="5"
                      style={{
                        padding: '10px 16px',
                        background: '#f8fafc',
                        borderTop: '2px dashed var(--line)',
                        borderBottom: '1px solid var(--line)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Archive size={14} color="var(--ink-500)" />
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: 'var(--ink-600)',
                          }}
                        >
                          Archived Records
                        </span>
                        <span
                          className="badge"
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            background: '#e2e8f0',
                            color: '#475569',
                            padding: '1px 7px',
                          }}
                        >
                          {archivedHRAdmins.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* 3. Archived HR Administrators (Alphabetical A-Z at Bottom) */}
                {showArchivedAdmins &&
                  archivedHRAdmins.map((admin) => {
                    const deptName =
                      admin.department && typeof admin.department === 'object' && admin.department.name
                        ? admin.department.name
                        : admin.department_name || admin.department || 'HRMDO Office';

                    return (
                      <tr key={admin.id} style={{ background: '#fafbfc', opacity: 0.85 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: '#e2e8f0',
                                color: 'var(--ink-600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '12px',
                                flexShrink: 0,
                              }}
                            >
                              {admin.full_name
                                ? admin.full_name
                                    .replace(/^(Dr\.|Engr\.|Prof\.)\s*/i, '')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .join('')
                                : 'HR'}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <b style={{ fontSize: '13.5px', color: 'var(--ink-700)' }}>
                                  {admin.full_name}
                                </b>
                                {admin.employee_id_number && (
                                  <span className="emp-id-chip" style={{ fontSize: '10.5px', opacity: 0.8 }}>
                                    {admin.employee_id_number}
                                  </span>
                                )}
                              </div>
                              <div className="muted" style={{ fontSize: '11.5px' }}>
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-700)' }}>
                            {admin.job_title || 'System Administrator'}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--ink-700)' }}>
                            <Building2 size={13} color="var(--ink-500)" />
                            <span>{deptName}</span>
                          </div>
                        </td>

                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            Archived
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '5px 10px',
                              background: '#fff',
                              borderColor: 'var(--line)',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => handleOpenUserSettings(admin, e)}
                            title={`Configure account settings for ${admin.full_name}`}
                          >
                            <Settings size={12} />
                            <span>Settings</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: Department Settings Modal */}
      {/* ========================================================= */}
      {settingsDept && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsDept(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--brand-700)" />
                <span>Department Configuration</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setSettingsDept(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDeptSettings}>
              {deptDeleteError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '12.5px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{deptDeleteError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>
                  Department Name <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>
                  Functional Domain / Classification <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={editDeptDomain}
                  onChange={(e) => setEditDeptDomain(e.target.value)}
                  style={{ fontSize: '13.5px' }}
                  required
                >
                  {EVSU_DEPARTMENT_GROUPS.map((grp) => (
                    <option key={grp.key} value={grp.key}>
                      {grp.name}
                    </option>
                  ))}
                </select>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>
                  Assign or change this department's campus governance domain.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    color: 'var(--red-600)',
                    borderColor: 'var(--red-300, #fca5a5)',
                    background: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleDeleteDepartment(settingsDept.id)}
                >
                  Delete Department
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setSettingsDept(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Add Department Modal */}
      {/* ========================================================= */}
      {showAddDeptModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddDeptModal(false);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--brand-700)" />
                <span>Create New University Department</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowAddDeptModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>
                  Department Name <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Information Technology Department"
                  value={newDeptName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewDeptName(val);
                    if (val.trim()) {
                      const detected = getDepartmentDomain(val);
                      setNewDeptDomain(detected.key);
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>
                  Functional Domain / Classification <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={newDeptDomain}
                  onChange={(e) => setNewDeptDomain(e.target.value)}
                  style={{ fontSize: '13.5px' }}
                  required
                >
                  {EVSU_DEPARTMENT_GROUPS.map((grp) => (
                    <option key={grp.key} value={grp.key}>
                      {grp.name}
                    </option>
                  ))}
                </select>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>
                  Select the campus governance domain for this new unit.
                </p>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-sm" onClick={() => setShowAddDeptModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: Universal User Settings Modal */}
      {/* ========================================================= */}
      {settingsUser && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsUser(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--brand-700)" />
                <span>Account Settings · {settingsUser.full_name}</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setSettingsUser(null)}>
                <X size={18} />
              </button>
            </div>

            {/* User Overview Chip */}
            <div
              style={{
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <b style={{ fontSize: '14px', color: 'var(--ink-900)' }}>{settingsUser.full_name}</b>
                <div className="muted" style={{ fontSize: '12px' }}>
                  {settingsUser.email} · {settingsUser.job_title || settingsUser.role}
                </div>
              </div>
              <span className="badge badge-dept" style={{ fontSize: '11px', fontWeight: 700 }}>
                {settingsUser.role}
              </span>
            </div>

            {/* Modal Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--line)',
                marginBottom: '18px',
                gap: '8px',
              }}
            >
              <button
                type="button"
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  background: 'none',
                  borderBottom: userSettingsTab === 'identity' ? '2px solid var(--brand-700)' : '2px solid transparent',
                  fontWeight: userSettingsTab === 'identity' ? 800 : 600,
                  color: userSettingsTab === 'identity' ? 'var(--brand-700)' : 'var(--ink-600)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onClick={() => setUserSettingsTab('identity')}
              >
                Official Identity
              </button>
              <button
                type="button"
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  background: 'none',
                  borderBottom: userSettingsTab === 'transfer' ? '2px solid var(--brand-700)' : '2px solid transparent',
                  fontWeight: userSettingsTab === 'transfer' ? 800 : 600,
                  color: userSettingsTab === 'transfer' ? 'var(--brand-700)' : 'var(--ink-600)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onClick={() => setUserSettingsTab('transfer')}
              >
                Department Transfer
              </button>
              <button
                type="button"
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  background: 'none',
                  borderBottom: userSettingsTab === 'lifecycle' ? '2px solid var(--brand-700)' : '2px solid transparent',
                  fontWeight: userSettingsTab === 'lifecycle' ? 800 : 600,
                  color: userSettingsTab === 'lifecycle' ? 'var(--brand-700)' : 'var(--ink-600)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onClick={() => setUserSettingsTab('lifecycle')}
              >
                Account Status
              </button>
            </div>

            {userModalSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={16} />
                <span>{userModalSuccess}</span>
              </div>
            )}

            {/* TAB 1: Official Identity */}
            {userSettingsTab === 'identity' && (
              <form onSubmit={handleSaveUserIdentity}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                    Official Full Name <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                    Official University Email <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                      Employee ID Number <span style={{ color: 'var(--red-600)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editIdNumber}
                      onChange={(e) => setEditIdNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Job Position / Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setSettingsUser(null)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save Identity Changes
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Department Transfer */}
            {userSettingsTab === 'transfer' && (
              <form onSubmit={handleTransferUserDepartment}>
                <p className="muted" style={{ margin: '0 0 14px', fontSize: '12.5px', lineHeight: 1.5 }}>
                  Transfer <b>{settingsUser.full_name}</b> to a different university department. This will update their administrative reporting line and supervisor evaluation scope.
                </p>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Destination Department</label>
                  <select
                    className="form-control"
                    value={transferDeptId}
                    onChange={(e) => setTransferDeptId(e.target.value)}
                    required
                  >
                    <option value="">Select Destination Department...</option>
                    {EVSU_DEPARTMENT_GROUPS.map((grp) => {
                      const groupDepts = departments.filter((d) =>
                        grp.departments.includes(d.name)
                      );
                      if (groupDepts.length === 0) return null;
                      return (
                        <optgroup key={grp.key} label={grp.name}>
                          {groupDepts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setSettingsUser(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Execute Department Transfer
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Account Lifecycle (Archive / Restore) */}
            {userSettingsTab === 'lifecycle' && (() => {
              const isTargetSelf = isSelfUser(settingsUser);
              const cannotArchiveSelf = isTargetSelf && !settingsUser.is_archived;

              return (
                <div>
                  <p className="muted" style={{ margin: '0 0 16px', fontSize: '12.5px', lineHeight: 1.5 }}>
                    Manage the official employment status of this account. Archiving revokes active evaluation participation while safely preserving verified historical records.
                  </p>

                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink-900)' }}>
                        Current Status: {settingsUser.is_archived ? 'Archived' : 'Active'}
                      </div>
                      <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                        {settingsUser.is_archived
                          ? 'This account is currently archived and excluded from active renewals.'
                          : 'Active account authorized for institutional workflows.'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        color: settingsUser.is_archived
                          ? '#15803d'
                          : cannotArchiveSelf
                          ? 'var(--ink-400)'
                          : 'var(--red-600)',
                        borderColor: settingsUser.is_archived
                          ? '#bbf7d0'
                          : cannotArchiveSelf
                          ? 'var(--line)'
                          : 'var(--red-300, #fca5a5)',
                        background: cannotArchiveSelf ? '#f1f5f9' : '#fff',
                        fontWeight: 700,
                        cursor: cannotArchiveSelf ? 'not-allowed' : 'pointer',
                        opacity: cannotArchiveSelf ? 0.6 : 1,
                      }}
                      disabled={cannotArchiveSelf}
                      onClick={() => handleToggleArchiveUser(settingsUser)}
                      title={cannotArchiveSelf ? 'Self-Archiving Prohibition: Cannot archive your own account' : ''}
                    >
                      {settingsUser.is_archived ? 'Restore to Active Status' : 'Archive Account'}
                    </button>
                  </div>

                  {cannotArchiveSelf && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <b>Self-Archiving Prohibition:</b> You cannot archive or deactivate your own active administrator account while logged in. Another administrator must perform this action.
                      </div>
                    </div>
                  )}

                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button type="button" className="btn btn-sm" onClick={() => setSettingsUser(null)}>
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: Tokenized Invitation & Manual Onboarding Modal   */}
      {/* ========================================================= */}
      <OnboardingUserModal
        isOpen={showInviteModal}
        initialRole={inviteModalConfig.role}
        initialDepartmentName={inviteModalConfig.departmentName}
        scope={inviteModalConfig.scope}
        departments={departments}
        existingEmployeeIds={users.map((u) => u.employee_id_number).filter(Boolean)}
        onClose={() => setShowInviteModal(false)}
        onToast={showToast}
        onUserCreated={async () => {
          clearAllPerformaCache();
          await loadData();
        }}
      />
    </div>
  );
}
