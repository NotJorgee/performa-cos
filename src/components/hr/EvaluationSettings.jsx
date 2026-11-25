import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  ArrowLeft,
  Check,
  ShieldCheck,
  Info,
  Send,
} from 'lucide-react';
import Toast from '../common/Toast';
import EvaluationFormEditor from './EvaluationFormEditor';
import { api } from '../../services/api';
import { getCachedData, setCachedData } from '../../utils/swrCache';

export default function EvaluationSettings({
  currentUser = null,
  onBack = null,
  onNavigate = null,
  initialTab = 'form_editor', // 'form_editor' | 'contract_length'
}) {
  const policyCacheKey = 'contract_policy';
  const cachedPolicy = getCachedData(policyCacheKey);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [toast, setToast] = useState(null);

  // Institutional Standard Contract Policy State (SWR seeded)
  const [policyMonths, setPolicyMonths] = useState(cachedPolicy?.duration_months || 6);
  const [policyMemo, setPolicyMemo] = useState(cachedPolicy?.memo || '');
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState(cachedPolicy?.updated_at || null);
  const [policyUpdatedByName, setPolicyUpdatedByName] = useState(cachedPolicy?.updated_by_name || 'HRMDO');
  const [contractMonthsInput, setContractMonthsInput] = useState(cachedPolicy?.duration_months || 6);
  const [directiveMemoInput, setDirectiveMemoInput] = useState('');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [showPolicyConfirmModal, setShowPolicyConfirmModal] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load institutional contract policy
  const loadContractPolicy = async () => {
    try {
      if (api.systemSettings?.getContractPolicy) {
        const res = await api.systemSettings.getContractPolicy();
        if (res) {
          setCachedData(policyCacheKey, res);
          const duration = res.duration_months || 6;
          setPolicyMonths(duration);
          setContractMonthsInput(duration);
          setPolicyMemo(res.memo || '');
          setPolicyUpdatedAt(res.updated_at);
          setPolicyUpdatedByName(res.updated_by_name || 'HRMDO');
        }
      }
    } catch (err) {
      console.warn('Could not load contract policy from API:', err.message);
    }
  };

  useEffect(() => {
    loadContractPolicy();
  }, []);

  // Enact University Standard COS Contract Policy Directive
  const handleApplyPolicyDirective = async () => {
    const finalMonths = parseInt(contractMonthsInput, 10);
    if (!finalMonths || finalMonths < 1 || finalMonths > 60) {
      showToast('Contract duration must be a valid number between 1 and 60 months.', 'warning');
      return;
    }

    setIsSavingPolicy(true);
    try {
      const res = await api.systemSettings.updateContractPolicy({
        duration_months: finalMonths,
        memo: directiveMemoInput.trim() || undefined,
      });

      setCachedData(policyCacheKey, res);
      setPolicyMonths(res.duration_months);
      setContractMonthsInput(res.duration_months);
      setPolicyMemo(res.memo);
      setPolicyUpdatedAt(res.updated_at);
      setPolicyUpdatedByName(res.updated_by_name);
      setDirectiveMemoInput('');
      setShowPolicyConfirmModal(false);

      showToast(
        `Standard COS contract length updated to ${finalMonths} months. Broadcast notification dispatched to all users.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update contract policy.', 'danger');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  return (
    <div className="view-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: 'var(--ink-900)' }}>
            Evaluation Settings
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            Configure institutional evaluation rubrics, criteria matrices, and COS contract duration directives.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: '8px',
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
          TAB 2: CONTRACT LENGTH ADJUSTER (Standard COS Contract Duration)
         ===================================================================== */}
      {activeTab === 'contract_length' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
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
            {/* Header: Title and Current Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Calendar size={22} color="var(--brand-700)" />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                    COS Contract Length Adjuster
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-600)', lineHeight: 1.5, maxWidth: '680px' }}>
                  Set the university-wide contract duration for upcoming Contract of Service terms. The adjusted length applies automatically to each employee's next contract cycle after their current active contract ends.
                </p>
              </div>

              {/* Current Contract Length Badge */}
              <div
                style={{
                  background: 'var(--brand-50, #fdf2f4)',
                  border: '1px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '200px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-800)', letterSpacing: '0.04em' }}>
                  Current Policy
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-900)' }}>
                  {policyMonths} Months
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '2px' }}>
                  {policyUpdatedAt ? `Enacted ${new Date(policyUpdatedAt).toLocaleDateString()} by ${policyUpdatedByName}` : 'Institutional Standard Directive'}
                </div>
              </div>
            </div>

            {/* Custom Months Editor Form */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 260px) minmax(260px, 1fr) auto',
                gap: '16px',
                alignItems: 'flex-end',
                marginBottom: '22px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink-800)', marginBottom: '6px' }}>
                  Next Contract Length (Months)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="form-control"
                    value={contractMonthsInput}
                    onChange={(e) => setContractMonthsInput(e.target.value)}
                    placeholder="Enter months..."
                    style={{ height: '42px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, paddingRight: '68px' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--ink-500)', fontWeight: 700, pointerEvents: 'none' }}>
                    Months
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink-800)', marginBottom: '6px' }}>
                  Directive Authority / Board Resolution Reference (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={directiveMemoInput}
                  onChange={(e) => setDirectiveMemoInput(e.target.value)}
                  placeholder="e.g. BOR Resolution No. 2026-14 / HRMDO Directive"
                  style={{ height: '42px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowPolicyConfirmModal(true)}
                  disabled={!contractMonthsInput || parseInt(contractMonthsInput, 10) < 1}
                  style={{
                    height: '42px',
                    padding: '0 22px',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Send size={15} /> Save &amp; Broadcast Directive
                </button>
              </div>
            </div>

            {/* University Policy Notice Alert */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '12.5px',
                color: 'var(--ink-600)',
                lineHeight: 1.5,
              }}
            >
              <Info size={17} color="var(--brand-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ color: 'var(--ink-900)' }}>Policy Transition Rule:</b> Adjusting this value sets the standard duration for <b>upcoming renewal terms</b> and future COS appointments across the university. <b>Current active signed contracts remain fixed and cannot be edited or truncated</b>; they will run until their scheduled expiration date. When each employee's current contract concludes, their subsequent contract will adopt this new length. An in-app notification will be broadcast to all users when updated.
              </div>
            </div>
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
                Confirm Contract Length Directive
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 16px' }}>
              You are about to establish <b>{contractMonthsInput} Months</b> as the standard contract duration for upcoming COS appointments.
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
                <b style={{ color: 'var(--ink-900)' }}>1. Upcoming Renewal Cycles:</b> Subsequent contracts will automatically adopt this new {contractMonthsInput}-month length.
              </div>
              <div>
                <b style={{ color: 'var(--ink-900)' }}>2. Active Contracts Remain Fixed:</b> Current active contracts will run undisturbed until their scheduled expiration.
              </div>
              <div>
                <b style={{ color: 'var(--ink-900)' }}>3. Official Notification:</b> An in-app broadcast notification will be delivered immediately to all university users.
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
                  'Saving...'
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
    </div>
  );
}
