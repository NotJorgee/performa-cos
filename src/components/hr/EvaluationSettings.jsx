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
} from 'lucide-react';
import Toast from '../common/Toast';
import EvaluationFormEditor from './EvaluationFormEditor';
import { api } from '../../services/api';
import { EVSU_DEPARTMENTS } from '../../utils/departments';

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

  // Batch Tweak State
  const [batchAction, setBatchAction] = useState('extend'); // 'extend' | 'shorten'
  const [batchDurationType, setBatchDurationType] = useState('30'); // '15' | '30' | '60' | '90' | '180' | 'custom'
  const [customBatchDays, setCustomBatchDays] = useState(45);
  const [batchDept, setBatchDept] = useState('ALL');
  const [batchMemo, setBatchMemo] = useState('');
  const [showBatchConfirmModal, setShowBatchConfirmModal] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);

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

  useEffect(() => {
    loadEmployees();
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

  const addDaysToDate = (dateStr, days) => {
    const base = dateStr ? new Date(dateStr) : new Date();
    base.setDate(base.getDate() + days);
    return base.toISOString().split('T')[0];
  };

  // Quick single-employee extend/shorten by 30 days
  const handleQuickAdjust = async (employee, deltaDays) => {
    const currentEnd = employee.contract_end_date || employee.contractEndDate || new Date().toISOString().split('T')[0];
    const newEnd = addDaysToDate(currentEnd, deltaDays);

    // Safeguard: Ensure new end date does not precede start date
    const start = employee.contract_start_date || employee.contractStartDate;
    if (start && new Date(newEnd) < new Date(start)) {
      showToast('Contract end date cannot be earlier than contract start date.', 'warning');
      return;
    }

    try {
      await api.users.adminUpdate(employee.id, { contract_end_date: newEnd });
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employee.id ? { ...emp, contract_end_date: newEnd, contractEndDate: newEnd } : emp
        )
      );
      const actionName = deltaDays > 0 ? 'extended' : 'shortened';
      showToast(
        `Contract for ${employee.full_name || employee.fullName} ${actionName} by ${Math.abs(deltaDays)} days to ${newEnd}.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update contract date on server.', 'danger');
    }
  };

  // Open modal to edit specific custom dates
  const handleOpenEditModal = (employee) => {
    setEditingEmployee(employee);
    setEditStartDate(employee.contract_start_date || employee.contractStartDate || '');
    setEditEndDate(employee.contract_end_date || employee.contractEndDate || '');
  };

  const handleAdjustModalEndDate = (deltaDays) => {
    const base = editEndDate || editStartDate || new Date().toISOString().split('T')[0];
    const newDate = addDaysToDate(base, deltaDays);
    setEditEndDate(newDate);
  };

  const handleSaveCustomDates = async () => {
    if (!editingEmployee) return;
    if (editStartDate && editEndDate && new Date(editEndDate) < new Date(editStartDate)) {
      showToast('Contract end date cannot precede start date.', 'warning');
      return;
    }

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

      showToast(`Contract dates updated for ${editingEmployee.full_name || editingEmployee.fullName}.`, 'success');
      setEditingEmployee(null);
    } catch (err) {
      showToast(err.message || 'Failed to update contract dates.', 'danger');
    } finally {
      setIsSavingSingle(false);
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

  // Calculate target employees for batch tweak
  const batchTargetEmployees = employees.filter((emp) => {
    if (batchDept === 'ALL') return true;
    const empDept =
      (emp.department && typeof emp.department === 'object' ? emp.department.name : emp.department) || '';
    return empDept === batchDept;
  });

  const effectiveBatchDays =
    batchDurationType === 'custom' ? Number(customBatchDays) || 1 : Number(batchDurationType);

  // Execute Batch Tweak
  const handleApplyBatchTweak = async () => {
    if (batchTargetEmployees.length === 0) {
      showToast('No active COS employees match the selected department scope.', 'warning');
      return;
    }

    const deltaDays = batchAction === 'extend' ? effectiveBatchDays : -effectiveBatchDays;
    setBatchApplying(true);

    try {
      const updatedList = [];
      for (const emp of batchTargetEmployees) {
        const curEnd = emp.contract_end_date || emp.contractEndDate || new Date().toISOString().split('T')[0];
        const newEnd = addDaysToDate(curEnd, deltaDays);
        await api.users.adminUpdate(emp.id, { contract_end_date: newEnd });
        updatedList.push({ id: emp.id, newEnd });
      }

      setEmployees((prev) =>
        prev.map((emp) => {
          const match = updatedList.find((u) => u.id === emp.id);
          return match
            ? { ...emp, contract_end_date: match.newEnd, contractEndDate: match.newEnd }
            : emp;
        })
      );

      const actionText = batchAction === 'extend' ? 'Extended' : 'Shortened';
      showToast(
        `Batch directive applied: ${actionText} contracts for ${updatedList.length} personnel by ${Math.abs(deltaDays)} days.`,
        'success'
      );
      setShowBatchConfirmModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to complete batch update.', 'danger');
    } finally {
      setBatchApplying(false);
    }
  };

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

      {/* Top Bar Navigation (Back to Dashboard on the Right) */}
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

      {/* Institutional Header */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          marginBottom: '20px',
          border: '1px solid var(--line)',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #701a28, #991b1b)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(112, 26, 40, 0.22)',
            }}
          >
            <Sliders size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '21px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                Evaluation Settings
              </h1>
              <span className="badge badge-dept" style={{ fontSize: '11px', fontWeight: 700 }}>
                HR Administration
              </span>
            </div>
            <p className="muted" style={{ margin: '3px 0 0', fontSize: '13px' }}>
              Configure appraisal rubric architecture and manage institutional Contract of Service durations
            </p>
          </div>
        </div>
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
          {/* Directive Quick Tweak Bar (Batch Extension / Shortening) */}
          <div
            className="card"
            style={{
              padding: '24px 28px',
              border: '1px solid var(--line)',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Clock size={19} color="var(--brand-700)" />
              <h2 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                University Directive Contract Tweak (Batch Adjustment)
              </h2>
            </div>
            <p className="muted" style={{ margin: '0 0 18px', fontSize: '13px' }}>
              Extend or shorten contract lengths when university management or the Board issues term adjustments.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
                alignItems: 'flex-end',
              }}
            >
              {/* Action: Extend vs Shorten */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-700)', marginBottom: '6px' }}>
                  Action
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setBatchAction('extend')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: batchAction === 'extend' ? '2px solid #16a34a' : '1px solid var(--line)',
                      background: batchAction === 'extend' ? '#f0fdf4' : '#fff',
                      color: batchAction === 'extend' ? '#15803d' : 'var(--ink-700)',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={14} /> Extend (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchAction('shorten')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: batchAction === 'shorten' ? '2px solid #dc2626' : '1px solid var(--line)',
                      background: batchAction === 'shorten' ? '#fef2f2' : '#fff',
                      color: batchAction === 'shorten' ? '#b91c1c' : 'var(--ink-700)',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Minus size={14} /> Shorten (-)
                  </button>
                </div>
              </div>

              {/* Adjustment Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-700)', marginBottom: '6px' }}>
                  Duration Adjustment
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-control"
                    value={batchDurationType}
                    onChange={(e) => setBatchDurationType(e.target.value)}
                    style={{ ...customSelectStyle, paddingRight: '36px' }}
                  >
                    <option value="15">15 Days</option>
                    <option value="30">1 Month (30 Days)</option>
                    <option value="60">2 Months (60 Days)</option>
                    <option value="90">3 Months (90 Days)</option>
                    <option value="180">6 Months (180 Days)</option>
                    <option value="custom">Custom Days...</option>
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
                {batchDurationType === 'custom' && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        className="form-control"
                        value={customBatchDays}
                        onChange={(e) => setCustomBatchDays(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Enter days..."
                        style={{ height: '38px', borderRadius: '8px', fontSize: '13px', paddingRight: '52px' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '12px',
                          color: 'var(--ink-400)',
                          fontWeight: 700,
                          pointerEvents: 'none',
                        }}
                      >
                        Days
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Department Target Scope */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-700)', marginBottom: '6px' }}>
                  Target Department Scope
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-control"
                    value={batchDept}
                    onChange={(e) => setBatchDept(e.target.value)}
                    style={{ ...customSelectStyle, paddingRight: '36px' }}
                  >
                    <option value="ALL">All University Departments ({employees.length} Staff)</option>
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

              {/* Apply Button */}
              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '9px 16px',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onClick={() => setShowBatchConfirmModal(true)}
                >
                  <Check size={16} /> Apply Batch Tweak
                </button>
              </div>
            </div>

            <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--ink-500)' }}>
              Targeting: <b>{batchTargetEmployees.length} active COS personnel</b> in scope. Each employee's expiration date will be shifted relative to their current end date.
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
                <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
                  Fine-tune contract start/end dates individually or apply quick extensions.
                </p>
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
                      <th style={{ width: '18%' }}>Department</th>
                      <th style={{ width: '12%' }}>Start Date</th>
                      <th style={{ width: '13%' }}>End Date</th>
                      <th style={{ width: '25%' }}>Duration</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Manage</th>
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

      {/* Confirmation Modal for Batch Tweak */}
      {showBatchConfirmModal && (
        <div className="modal-backdrop" onClick={() => !batchApplying && setShowBatchConfirmModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '24px 28px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: batchAction === 'extend' ? '#f0fdf4' : '#fef2f2',
                  color: batchAction === 'extend' ? '#16a34a' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {batchAction === 'extend' ? <Plus size={18} /> : <Minus size={18} />}
              </div>
              <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                Confirm Batch Contract {batchAction === 'extend' ? 'Extension' : 'Reduction'}
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 16px' }}>
              You are about to {batchAction === 'extend' ? 'extend' : 'shorten'} the contract expiration date for{' '}
              <b>{batchTargetEmployees.length} personnel</b> in <b>{batchDept === 'ALL' ? 'All Departments' : batchDept}</b> by{' '}
              <b>{effectiveBatchDays} days{batchDurationType === 'custom' ? ' (Custom)' : ''}</b>.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-700)', marginBottom: '4px' }}>
                Authority / Directive Reference (Optional)
              </label>
              <input
                type="text"
                className="form-control"
                value={batchMemo}
                onChange={(e) => setBatchMemo(e.target.value)}
                placeholder="e.g. Board Resolution No. 42 / Campus Directive"
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={batchApplying}
                onClick={() => setShowBatchConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={batchApplying}
                style={{
                  background: batchAction === 'extend' ? '#16a34a' : '#dc2626',
                  borderColor: batchAction === 'extend' ? '#16a34a' : '#dc2626',
                }}
                onClick={handleApplyBatchTweak}
              >
                {batchApplying ? 'Applying Updates...' : `Confirm ${batchAction === 'extend' ? 'Extension' : 'Reduction'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Editing Specific Employee Contract Dates */}
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
                  Configure Contract Length
                </h3>
                <div className="muted" style={{ fontSize: '12px' }}>
                  {editingEmployee.full_name || editingEmployee.fullName} · {editingEmployee.employee_id_number || editingEmployee.idNumber || 'COS Staff'}
                </div>
              </div>
            </div>

            {/* Quick Adjust Buttons inside Modal */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-700)', letterSpacing: '0.04em' }}>
                  Quick Adjust End Date
                </span>
                <span className="muted" style={{ fontSize: '11px' }}>
                  One-click shift
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#15803d',
                  }}
                  title="Extend end date by 15 Days"
                  onClick={() => handleAdjustModalEndDate(15)}
                >
                  +15 Days
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#15803d',
                  }}
                  title="Extend end date by 1 Month (30 Days)"
                  onClick={() => handleAdjustModalEndDate(30)}
                >
                  +1 Month
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#15803d',
                  }}
                  title="Extend end date by 3 Months (90 Days)"
                  onClick={() => handleAdjustModalEndDate(90)}
                >
                  +3 Months
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#15803d',
                  }}
                  title="Extend end date by 6 Months (180 Days)"
                  onClick={() => handleAdjustModalEndDate(180)}
                >
                  +6 Months
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: '#fef2f2',
                    borderColor: '#fca5a5',
                    color: '#b91c1c',
                  }}
                  title="Shorten end date by 15 Days"
                  onClick={() => handleAdjustModalEndDate(-15)}
                >
                  -15 Days
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: '#fef2f2',
                    borderColor: '#fca5a5',
                    color: '#b91c1c',
                  }}
                  title="Shorten end date by 1 Month (30 Days)"
                  onClick={() => handleAdjustModalEndDate(-30)}
                >
                  -1 Month
                </button>
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
                  onChange={(e) => setEditStartDate(e.target.value)}
                  style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink-700)', marginBottom: '4px' }}>
                  Contract End Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
                />
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
                {isSavingSingle ? 'Saving...' : 'Save Dates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
