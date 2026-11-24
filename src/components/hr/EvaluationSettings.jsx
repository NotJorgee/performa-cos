import React, { useState, useEffect } from 'react';
import {
  Sliders,
  FileText,
  Calendar,
  Clock,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Search,
  Users,
  Filter,
  CircleAlert,
  Edit3,
  Settings,
  ChevronDown,
  Lock,
  ShieldCheck,
  Info,
  Send,
} from 'lucide-react';
import Toast from '../common/Toast';
import EvaluationFormEditor from './EvaluationFormEditor';
import { api } from '../../services/api';
import { EVSU_DEPARTMENTS } from '../../utils/departments';
import { calculateContractEndDate } from '../../utils/onboardingHelpers';

export default function EvaluationSettings({
  currentUser = null,
  onBack = null,
  onNavigate = null,
  initialTab = 'form_editor', // 'form_editor' | 'contract_length'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [toast, setToast] = useState(null);

  // Contract Adjuster State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Institutional Standard Contract Policy State
  const [policyMonths, setPolicyMonths] = useState(6);
  const [policyName, setPolicyName] = useState('6 Months (Semestral Standard)');
  const [policyMemo, setPolicyMemo] = useState('EVSU Institutional Standard COS Contract Policy');
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState(null);
  const [policyUpdatedByName, setPolicyUpdatedByName] = useState('HRMDO');
  const [selectedDirectiveMonths, setSelectedDirectiveMonths] = useState(6);
  const [customMonthsInput, setCustomMonthsInput] = useState(4);
  const [directiveMemoInput, setDirectiveMemoInput] = useState('');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [showPolicyConfirmModal, setShowPolicyConfirmModal] = useState(false);

  // Single Employee Edit Modal
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load active COS employees
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.users.list({ role: 'COS Employee', is_archived: false });
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.warn('Could not load employees from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load institutional contract policy
  const loadContractPolicy = async () => {
    try {
      if (api.systemSettings?.getContractPolicy) {
        const res = await api.systemSettings.getContractPolicy();
        if (res) {
          setPolicyMonths(res.duration_months || 6);
          setPolicyName(res.policy_name || `${res.duration_months || 6} Months`);
          setPolicyMemo(res.memo || '');
          setPolicyUpdatedAt(res.updated_at);
          setPolicyUpdatedByName(res.updated_by_name || 'HRMDO');
          setSelectedDirectiveMonths(res.duration_months || 6);
        }
      }
    } catch (err) {
      console.warn('Could not load contract policy from API:', err.message);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadContractPolicy();
  }, []);

  // Helper date math
  const getDaysRemaining = (endDateStr) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Detailed combinations of years, months, and days (e.g. "1 month and 15 days", "6 months", "2 years")
  const formatDurationCombination = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 'Not Set';
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Not Set';
    if (end < start) return '0 days';

    // Check direct month anniversary (e.g. July 5 to Jan 5 = exactly 6 months)
    const isDirectAnniversary = start.getDate() === end.getDate();
    const directMonths =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    let years = 0;
    let months = 0;
    let days = 0;

    if (isDirectAnniversary && directMonths > 0) {
      years = Math.floor(directMonths / 12);
      months = directMonths % 12;
      days = 0;
    } else {
      // Inclusive date range (e.g. Jan 1 to Jun 30 covers 6 full months)
      const endInclusive = new Date(end);
      endInclusive.setDate(endInclusive.getDate() + 1);

      const y1 = start.getFullYear();
      const m1 = start.getMonth();
      const d1 = start.getDate();

      const y2 = endInclusive.getFullYear();
      const m2 = endInclusive.getMonth();
      const d2 = endInclusive.getDate();

      years = y2 - y1;
      months = m2 - m1;
      days = d2 - d1;

      if (days < 0) {
        months -= 1;
        const prevMonth = new Date(y2, m2, 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
    }

    const parts = [];
    if (years > 0) parts.push(years === 1 ? '1 year' : `${years} years`);
    if (months > 0) parts.push(months === 1 ? '1 month' : `${months} months`);
    if (days > 0) parts.push(days === 1 ? '1 day' : `${days} days`);

    if (parts.length === 0) return '0 days';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} and ${parts[2]}`;
  };

  // Open modal to configure dates for a specific employee
  const handleOpenEditModal = (employee) => {
    setEditingEmployee(employee);
    const start = employee.contract_start_date || employee.contractStartDate || '';
    setEditStartDate(start);
    if (employee.contract_end_date || employee.contractEndDate) {
      setEditEndDate(employee.contract_end_date || employee.contractEndDate);
    } else if (start) {
      setEditEndDate(calculateContractEndDate(start, policyMonths));
    } else {
      setEditEndDate('');
    }
  };

  const handleEditStartDateChange = (newStart) => {
    setEditStartDate(newStart);
    if (newStart) {
      setEditEndDate(calculateContractEndDate(newStart, policyMonths));
    } else {
      setEditEndDate('');
    }
  };

  const handleSaveCustomDates = async () => {
    if (!editingEmployee) return;

    setIsSavingSingle(true);
    try {
      await api.users.adminUpdate(editingEmployee.id, {
        contract_start_date: editStartDate || null,
        contract_end_date: editEndDate || null,
      });

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id
            ? {
                ...emp,
                contract_start_date: editStartDate || null,
                contractStartDate: editStartDate || null,
                contract_end_date: editEndDate || null,
                contractEndDate: editEndDate || null,
              }
            : emp
        )
      );

      showToast(`Contract terms updated for ${editingEmployee.full_name || editingEmployee.fullName}.`, 'success');
      setEditingEmployee(null);
    } catch (err) {
      showToast(err.message || 'Failed to update contract dates.', 'danger');
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Enact University Standard COS Contract Policy Directive
  const handleApplyPolicyDirective = async () => {
    const finalMonths =
      selectedDirectiveMonths === 'custom' ? Number(customMonthsInput) || 1 : Number(selectedDirectiveMonths);
    if (!finalMonths || finalMonths < 1 || finalMonths > 60) {
      showToast('Contract duration must be between 1 and 60 months.', 'warning');
      return;
    }

    setIsSavingPolicy(true);
    try {
      const res = await api.systemSettings.updateContractPolicy({
        duration_months: finalMonths,
        memo: directiveMemoInput.trim() || undefined,
      });

      setPolicyMonths(res.duration_months);
      setPolicyName(res.policy_name);
      setPolicyMemo(res.memo);
      setPolicyUpdatedAt(res.updated_at);
      setPolicyUpdatedByName(res.updated_by_name);
      setSelectedDirectiveMonths(res.duration_months);
      setDirectiveMemoInput('');
      setShowPolicyConfirmModal(false);

      showToast(
        `University Directive Enacted: Standard COS contract duration set to ${finalMonths} months. Broadcast notification dispatched to all users.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update contract policy.', 'danger');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Filtered employees for table
  const filteredEmployees = employees.filter((emp) => {
    const name = (emp.full_name || emp.fullName || '').toLowerCase();
    const idNum = (emp.employee_id_number || emp.idNumber || '').toLowerCase();
    const title = (emp.job_title || emp.jobTitle || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || idNum.includes(query) || title.includes(query);

    const empDept =
      (emp.department && typeof emp.department === 'object' ? emp.department.name : emp.department) || '';
    const matchesDept = selectedDeptFilter === 'ALL' || empDept === selectedDeptFilter;

    return matchesSearch && matchesDept;
  });

  const customSelectStyle = {
    height: '38px',
    padding: '0 32px 0 12px',
    fontSize: '13px',
    borderRadius: '8px',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    border: '1px solid var(--line)',
    color: 'var(--ink-900)',
    fontWeight: 600,
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={26} color="var(--brand-700)" />
            Evaluation Settings
          </h1>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
          onClick={onBack || (() => onNavigate && onNavigate('dashboard'))}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      {/* Primary Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--line)',
          marginBottom: '24px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('form_editor')}
          style={{
            padding: '11px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'form_editor' ? '3px solid var(--brand-700)' : '3px solid transparent',
            color: activeTab === 'form_editor' ? 'var(--brand-700)' : 'var(--ink-600)',
            fontWeight: activeTab === 'form_editor' ? 800 : 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={16} />
          <span>Evaluation Form Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contract_length')}
          style={{
            padding: '11px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'contract_length' ? '3px solid var(--brand-700)' : '3px solid transparent',
            color: activeTab === 'contract_length' ? 'var(--brand-700)' : 'var(--ink-600)',
            fontWeight: activeTab === 'contract_length' ? 800 : 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calendar size={16} />
          <span>Contract Length Adjuster</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: EVALUATION FORM EDITOR (Embedded 1:1 Rubric Matrix)
         ===================================================================== */}
      {activeTab === 'form_editor' && (
        <EvaluationFormEditor hideBackButton={true} onNavigate={onNavigate} />
      )}

      {/* =====================================================================
          TAB 2: CONTRACT LENGTH ADJUSTER (Extend / Shorten COS Contracts)
         ===================================================================== */}
      {activeTab === 'contract_length' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Executive University Directive Standard COS Contract Policy Card */}
          <div
            className="card"
            style={{
              padding: '28px 32px',
              border: '1px solid var(--line)',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Top Bar: Title and Current Standard Badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px',
                paddingBottom: '18px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <ShieldCheck size={22} color="var(--brand-700)" />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                    University Directive: Standard COS Contract Duration Policy
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-600)', lineHeight: 1.5, maxWidth: '680px' }}>
                  Establish the university-wide standard duration for upcoming Contract of Service (COS) terms and renewal cycles.
                  In accordance with institutional guidelines, adjustments apply to <b>subsequent contracts</b> after current terms conclude.
                </p>
              </div>

              {/* Current Policy Status Pill */}
              <div
                style={{
                  background: 'var(--brand-50, #fdf2f4)',
                  border: '1px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '220px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-800)', letterSpacing: '0.04em' }}>
                  Current Institutional Policy
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--brand-900)' }}>
                  {policyMonths} Months <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-700)' }}>({policyName})</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '2px' }}>
                  {policyUpdatedAt ? `Enacted ${new Date(policyUpdatedAt).toLocaleDateString()} · ${policyUpdatedByName}` : 'Institutional Standard Directive'}
                </div>
              </div>
            </div>

            {/* Directive Selection Options */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-700)', marginBottom: '10px', letterSpacing: '0.04em' }}>
                Select Directive Contract Duration for Upcoming Terms
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                {/* 3 Months Option */}
                <div
                  onClick={() => setSelectedDirectiveMonths(3)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: selectedDirectiveMonths === 3 ? '2px solid var(--brand-700)' : '1px solid var(--line)',
                    background: selectedDirectiveMonths === 3 ? '#fff5f7' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: selectedDirectiveMonths === 3 ? 'var(--brand-800)' : 'var(--ink-900)' }}>
                      3 Months
                    </span>
                    {selectedDirectiveMonths === 3 && <Check size={16} color="var(--brand-700)" />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-600)', lineHeight: 1.4 }}>
                    Quarterly Term (Previous EVSU Policy)
                  </div>
                </div>

                {/* 5 Months Option */}
                <div
                  onClick={() => setSelectedDirectiveMonths(5)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: selectedDirectiveMonths === 5 ? '2px solid var(--brand-700)' : '1px solid var(--line)',
                    background: selectedDirectiveMonths === 5 ? '#fff5f7' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: selectedDirectiveMonths === 5 ? 'var(--brand-800)' : 'var(--ink-900)' }}>
                      5 Months
                    </span>
                    {selectedDirectiveMonths === 5 && <Check size={16} color="var(--brand-700)" />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-600)', lineHeight: 1.4 }}>
                    Academic Semester (Shortened Term)
                  </div>
                </div>

                {/* 6 Months Option (Standard) */}
                <div
                  onClick={() => setSelectedDirectiveMonths(6)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: selectedDirectiveMonths === 6 ? '2px solid var(--brand-700)' : '1px solid var(--line)',
                    background: selectedDirectiveMonths === 6 ? '#fff5f7' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: selectedDirectiveMonths === 6 ? 'var(--brand-800)' : 'var(--ink-900)' }}>
                      6 Months
                    </span>
                    {selectedDirectiveMonths === 6 && <Check size={16} color="var(--brand-700)" />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-600)', lineHeight: 1.4 }}>
                    Semestral Standard (Current Standard)
                  </div>
                </div>

                {/* 12 Months Option */}
                <div
                  onClick={() => setSelectedDirectiveMonths(12)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: selectedDirectiveMonths === 12 ? '2px solid var(--brand-700)' : '1px solid var(--line)',
                    background: selectedDirectiveMonths === 12 ? '#fff5f7' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: selectedDirectiveMonths === 12 ? 'var(--brand-800)' : 'var(--ink-900)' }}>
                      1 Year (12 Mo.)
                    </span>
                    {selectedDirectiveMonths === 12 && <Check size={16} color="var(--brand-700)" />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-600)', lineHeight: 1.4 }}>
                    Annual Fiscal Term (Long-Term COS)
                  </div>
                </div>

                {/* Custom Option */}
                <div
                  onClick={() => setSelectedDirectiveMonths('custom')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: selectedDirectiveMonths === 'custom' ? '2px solid var(--brand-700)' : '1px solid var(--line)',
                    background: selectedDirectiveMonths === 'custom' ? '#fff5f7' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: selectedDirectiveMonths === 'custom' ? 'var(--brand-800)' : 'var(--ink-900)' }}>
                      Custom Months...
                    </span>
                    {selectedDirectiveMonths === 'custom' && <Check size={16} color="var(--brand-700)" />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-600)', lineHeight: 1.4 }}>
                    Set custom contract duration
                  </div>
                </div>
              </div>

              {selectedDirectiveMonths === 'custom' && (
                <div style={{ marginTop: '14px', maxWidth: '300px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-700)', marginBottom: '5px' }}>
                    Enter Custom Contract Duration (Months)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      className="form-control"
                      value={customMonthsInput}
                      onChange={(e) => setCustomMonthsInput(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="e.g. 4, 8, 9"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px', paddingRight: '65px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--ink-400)', fontWeight: 700, pointerEvents: 'none' }}>
                      Months
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Directive Authority Memo & Action Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1fr) auto',
                gap: '16px',
                alignItems: 'flex-end',
                marginBottom: '18px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-700)', marginBottom: '5px' }}>
                  Directive Authority / Board Resolution Reference (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={directiveMemoInput}
                  onChange={(e) => setDirectiveMemoInput(e.target.value)}
                  placeholder="e.g. BOR Resolution No. 2026-14 / HRMDO Advisory Memo"
                  style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowPolicyConfirmModal(true)}
                  style={{
                    height: '38px',
                    padding: '0 20px',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Send size={15} /> Save &amp; Broadcast University Directive
                </button>
              </div>
            </div>

            {/* University Policy Notice Alert */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12.5px',
                color: 'var(--ink-600)',
                lineHeight: 1.5,
              }}
            >
              <Info size={16} color="var(--brand-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ color: 'var(--ink-900)' }}>Policy Transition Rule:</b> Updating this directive establishes the duration for <b>upcoming renewal terms</b> and future COS appointments across the university ({employees.length} active COS personnel). <b>Currently active signed contracts remain strictly unchanged</b> and will run until their scheduled expiration date. When each employee's current term concludes, their renewal contract will automatically adopt the new standard duration. All active personnel will receive an institutional in-app notification when this directive is saved.
              </div>
            </div>
          </div>

          {/* Individual COS Employee Contracts Table */}
          <div
            className="card"
            style={{
              padding: '24px 28px',
              border: '1px solid var(--line)',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                  Active Contract of Service Personnel ({filteredEmployees.length})
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    className="form-control"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or ID..."
                    style={{
                      height: '38px',
                      paddingLeft: '32px',
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Filter by Department */}
                <div style={{ position: 'relative', width: '220px' }}>
                  <select
                    className="form-control"
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    style={{ ...customSelectStyle, paddingRight: '36px', fontSize: '12.5px' }}
                  >
                    <option value="ALL">All Departments</option>
                    {EVSU_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#64748b',
                    }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-500)', fontSize: '13px' }}>
                Loading COS employee contract records...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-500)', fontSize: '13px', border: '1px dashed var(--line)', borderRadius: '8px' }}>
                No COS personnel found matching the filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: '22%' }}>Personnel Name</th>
                      <th style={{ width: '16%' }}>Department</th>
                      <th style={{ width: '11%' }}>Start Date</th>
                      <th style={{ width: '12%' }}>End Date</th>
                      <th style={{ width: '18%' }}>Current Term</th>
                      <th style={{ width: '13%' }}>Upcoming Policy</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => {
                      const start = emp.contract_start_date || emp.contractStartDate;
                      const end = emp.contract_end_date || emp.contractEndDate;
                      const daysRem = getDaysRemaining(end);
                      const durationLabel = formatDurationCombination(start, end);

                      const isUrgent = daysRem !== null && daysRem <= 30 && daysRem >= 0;
                      const isExpired = daysRem !== null && daysRem < 0;

                      return (
                        <tr key={emp.id} style={{ background: '#ffffff' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  flexShrink: 0,
                                }}
                              >
                                {(emp.full_name || emp.fullName || 'U')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                              <div>
                                <b style={{ fontSize: '13.5px', color: 'var(--ink-900)' }}>
                                  {emp.full_name || emp.fullName}
                                </b>
                                <div className="muted" style={{ fontSize: '11.5px' }}>
                                  {emp.employee_id_number || emp.idNumber || '—'} · {emp.job_title || emp.jobTitle || 'Admin Aide'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ fontSize: '12.5px', color: 'var(--ink-700)' }}>
                            {(emp.department && typeof emp.department === 'object' ? emp.department.name : emp.department) || '—'}
                          </td>

                          <td style={{ fontSize: '12.5px', color: 'var(--ink-800)', fontWeight: 600 }}>
                            {start || 'Not Set'}
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <b style={{ fontSize: '12.5px', color: isExpired ? '#dc2626' : isUrgent ? '#d97706' : 'var(--ink-900)' }}>
                                {end || 'Not Set'}
                              </b>
                              {daysRem !== null && (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    width: 'fit-content',
                                    background: isExpired ? '#fef2f2' : isUrgent ? '#fffbeb' : '#f0fdf4',
                                    color: isExpired ? '#b91c1c' : isUrgent ? '#b45309' : '#15803d',
                                    border: `1px solid ${isExpired ? '#fca5a5' : isUrgent ? '#fde68a' : '#bbf7d0'}`,
                                  }}
                                >
                                  {isExpired ? 'Expired' : `${daysRem} days left`}
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ fontSize: '12.5px', color: 'var(--ink-800)', fontWeight: 600 }}>
                            {durationLabel}
                          </td>

                          <td>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'var(--brand-800)',
                                background: 'var(--brand-50, #fdf2f4)',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                border: '1px solid #fecdd3',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                              }}
                            >
                              Next: {policyMonths}M Policy
                            </span>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{
                                padding: '5px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#ffffff',
                                borderColor: 'var(--line)',
                                color: 'var(--ink-700)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleOpenEditModal(emp)}
                              title={`Configure contract for ${emp.full_name || emp.fullName}`}
                            >
                              <Settings size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Enacting University Directive */}
      {showPolicyConfirmModal && (
        <div className="modal-backdrop" onClick={() => !isSavingPolicy && setShowPolicyConfirmModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '24px 28px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--brand-50, #fdf2f4)',
                  color: 'var(--brand-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                Enact University Directive &amp; Broadcast
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 16px' }}>
              You are about to establish <b>{selectedDirectiveMonths === 'custom' ? `${customMonthsInput} Months` : `${selectedDirectiveMonths} Months`}</b> as the institutional standard duration for Contract of Service personnel.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12.5px',
                color: 'var(--ink-700)',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <b style={{ color: 'var(--ink-900)' }}>1. Upcoming Renewal Cycles:</b> All subsequent COS appointment contracts and renewals will automatically adopt this new term length.
              </div>
              <div>
                <b style={{ color: 'var(--ink-900)' }}>2. Active Contracts Intact:</b> Currently active signed contracts ({employees.length} personnel) remain strictly valid until their scheduled expiration.
              </div>
              <div>
                <b style={{ color: 'var(--ink-900)' }}>3. Official Notification:</b> An institutional notification broadcast will be delivered immediately to all university users.
              </div>
            </div>

            {directiveMemoInput && (
              <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--ink-500)' }}>
                <b>Authority Reference:</b> {directiveMemoInput}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={isSavingPolicy}
                onClick={() => setShowPolicyConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={isSavingPolicy}
                onClick={handleApplyPolicyDirective}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSavingPolicy ? (
                  'Enacting Directive...'
                ) : (
                  <>
                    <Send size={14} /> Confirm &amp; Broadcast Directive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Configuring Individual Employee Contract Dates */}
      {editingEmployee && (
        <div className="modal-backdrop" onClick={() => !isSavingSingle && setEditingEmployee(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px', padding: '24px 28px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--brand-50, #fdf2f4)',
                  color: 'var(--brand-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Settings size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                  Configure Contract Dates
                </h3>
                <div className="muted" style={{ fontSize: '12px' }}>
                  {editingEmployee.full_name || editingEmployee.fullName} · {editingEmployee.employee_id_number || editingEmployee.idNumber || 'COS Staff'}
                </div>
              </div>
            </div>

            {/* Current Active Status Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: 'var(--ink-700)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="muted">Current Signed Term:</span>
                <b>
                  {editingEmployee.contract_start_date || editingEmployee.contractStartDate || 'Not Set'} to{' '}
                  {editingEmployee.contract_end_date || editingEmployee.contractEndDate || 'Not Set'}
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Upcoming Renewal Directive:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-700)' }}>
                  {policyMonths} Months Standard Policy
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)', marginBottom: '4px' }}>
                  Contract Start Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={editStartDate}
                  onChange={(e) => handleEditStartDateChange(e.target.value)}
                  style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '3px', display: 'block' }}>
                  Official start of contract appointment.
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: 'var(--ink-700)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} color="var(--ink-500)" />
                    Contract End Date
                  </label>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: 'var(--brand-700)',
                      background: 'var(--brand-50, #fdf2f4)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      border: '1px solid #fecdd3',
                    }}
                  >
                    Auto-calculated ({policyMonths}M Policy)
                  </span>
                </div>
                <input
                  type="date"
                  className="form-control"
                  value={editEndDate}
                  disabled
                  readOnly
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#f8fafc',
                    color: 'var(--ink-700)',
                    cursor: 'not-allowed',
                    borderColor: 'var(--line)',
                    fontWeight: 600,
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '3px', display: 'block' }}>
                  Contract expiration is automatically set by the University Standard COS Policy ({policyMonths} Months) and cannot be manually modified.
                </span>
              </div>

              {editStartDate && editEndDate && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    color: 'var(--ink-800)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--ink-600)' }}>Calculated Duration:</span>
                    <b>{formatDurationCombination(editStartDate, editEndDate)}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-600)' }}>Expiration Status:</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: getDaysRemaining(editEndDate) < 0 ? '#dc2626' : '#15803d',
                      }}
                    >
                      {getDaysRemaining(editEndDate) < 0
                        ? 'Expired'
                        : `${getDaysRemaining(editEndDate)} days from today`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={isSavingSingle}
                onClick={() => setEditingEmployee(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={isSavingSingle}
                onClick={handleSaveCustomDates}
              >
                {isSavingSingle ? 'Saving Terms...' : 'Save Contract Terms'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
