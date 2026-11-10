import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Eye,
  Save,
  Copy,
  Edit3,
  Award,
  CircleAlert,
  ArrowLeft,
} from 'lucide-react';
import Toast from '../common/Toast';
import {
  getActiveEvaluationTemplate,
  saveEvaluationTemplate,
  resetEvaluationTemplateToDefault,
  fetchActiveTemplateFromApi,
  publishTemplateToApi,
  resetTemplateOnApi,
  getNextTemplateVersion,
  DEFAULT_RATING_SCALE,
  DEFAULT_RECOMMENDATIONS,
} from '../../utils/evaluationTemplate';
import { getPerformanceInterpretation } from '../common/DynamicRubric';

export default function EvaluationFormEditor({
  onBack = null,
  onNavigate = null,
  hideBackButton = false,
  hideHeader = false,
}) {
  const [template, setTemplate] = useState(() => getActiveEvaluationTemplate());
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'
  const [toast, setToast] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Live scoring state (mirrors DynamicRubric evaluator behavior)
  const [scores, setScores] = useState({});
  const [strengths, setStrengths] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // Load active template from backend API on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchActiveTemplateFromApi()
      .then((data) => {
        if (isMounted && data) {
          setTemplate(data);
        }
      })
      .catch((err) => {
        console.warn('API template load notice:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Field update handlers
  const handleUpdateCriterion = (id, field, value) => {
    setTemplate((prev) => ({
      ...prev,
      criteria: prev.criteria.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddCriterion = () => {
    const newId = `criterion_${Date.now()}`;
    const newCriterion = {
      id: newId,
      title: 'New Evaluation Criterion',
      description:
        'Accuracy, efficiency, and dependability of contracted work deliverables.',
    };
    setTemplate((prev) => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion],
    }));
    setHasUnsavedChanges(true);
    showToast('New criterion row added to the evaluation rubric.', 'info');
  };

  const handleDuplicateCriterion = (index) => {
    const source = template.criteria[index];
    const newId = `criterion_${Date.now()}`;
    const duplicated = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
    };
    const nextCriteria = [...template.criteria];
    nextCriteria.splice(index + 1, 0, duplicated);
    setTemplate((prev) => ({ ...prev, criteria: nextCriteria }));
    setHasUnsavedChanges(true);
    showToast(`Duplicated "${source.title}".`, 'info');
  };

  const handleDeleteCriterion = (id, title) => {
    if (template.criteria.length <= 1) {
      showToast('The evaluation form must retain at least one criterion.', 'warning');
      return;
    }
    setTemplate((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((item) => item.id !== id),
    }));
    setScores((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setHasUnsavedChanges(true);
    showToast(`Removed "${title}".`, 'info');
  };

  const handleMoveCriterion = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= template.criteria.length) return;
    const nextCriteria = [...template.criteria];
    const [moved] = nextCriteria.splice(index, 1);
    nextCriteria.splice(targetIndex, 0, moved);
    setTemplate((prev) => ({ ...prev, criteria: nextCriteria }));
    setHasUnsavedChanges(true);
  };

  const handleUpdatePrompt = (id, field, value) => {
    setTemplate((prev) => ({
      ...prev,
      qualitativePrompts: (prev.qualitativePrompts || []).map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const handleScoreClick = (itemId, val) => {
    setScores((prev) => ({ ...prev, [itemId]: val }));
  };

  const handleSaveAndPublish = async () => {
    const emptyCriteria = template.criteria.filter(
      (c) => !c.title.trim() || !c.description.trim()
    );
    if (emptyCriteria.length > 0) {
      showToast('Please provide a title and description for all criteria.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const nextVersion = getNextTemplateVersion(template.version);
      const templateToPublish = {
        ...template,
        version: nextVersion,
      };
      const published = await publishTemplateToApi(templateToPublish);
      setTemplate(published);
      setHasUnsavedChanges(false);
      showToast(
        `Active evaluation rubric (${published.version || nextVersion}) published and saved to institutional server.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to publish rubric to server.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsSaving(true);
    try {
      const fresh = await resetTemplateOnApi();
      setTemplate(fresh);
      setScores({});
      setHasUnsavedChanges(false);
      setShowResetModal(false);
      showToast('Reset evaluation form back to official EVSU standard rubric on institutional server.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to reset rubric on server.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // Mathematical scoring calculation (mirrors DynamicRubric)
  const criteria = template.criteria;
  const totalItems = criteria.length;
  const maxRawScore = totalItems * 10;
  const scoredCount = Object.keys(scores).filter((k) =>
    criteria.some((c) => c.id === k)
  ).length;
  const rawSum = criteria.reduce(
    (acc, curr) => acc + (Number(scores[curr.id]) || 0),
    0
  );
  const scaledScore =
    scoredCount > 0 && maxRawScore > 0
      ? Math.round(((rawSum / maxRawScore) * 100) * 10) / 10
      : 0;
  const currentInterpretation =
    scoredCount > 0 ? getPerformanceInterpretation(scaledScore) : null;

  const isEditMode = viewMode === 'edit';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Bar Navigation (Back to Dashboard on the Right) */}
      {!hideBackButton && (
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
      )}

      {/* Header & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #701a28, #991b1b)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(112, 26, 40, 0.25)',
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                Evaluation Form Editor
              </h1>
              <span
                className="badge"
                style={{
                  background: hasUnsavedChanges ? '#fef3c7' : '#f0fdf4',
                  color: hasUnsavedChanges ? '#b45309' : '#15803d',
                  border: `1px solid ${hasUnsavedChanges ? '#fde68a' : '#bbf7d0'}`,
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {hasUnsavedChanges ? 'Unsaved Changes' : 'Active Template'}
              </span>
            </div>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
              Institutional Evaluation Rubric for Contract of Service (COS) Personnel
            </p>
          </div>
        </div>

        {/* Mode Switcher: Edit Form vs Evaluator View */}
        <div
          style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--line)',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            style={{
              border: 'none',
              background: isEditMode ? '#ffffff' : 'transparent',
              color: isEditMode ? 'var(--brand-700)' : 'var(--ink-600)',
              fontWeight: isEditMode ? 800 : 600,
              fontSize: '12.5px',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isEditMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Edit3 size={13} />
            <span>Edit Rubric (Inline)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            style={{
              border: 'none',
              background: !isEditMode ? '#ffffff' : 'transparent',
              color: !isEditMode ? 'var(--brand-700)' : 'var(--ink-600)',
              fontWeight: !isEditMode ? 800 : 600,
              fontSize: '12.5px',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: !isEditMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Eye size={13} />
            <span>Evaluator View</span>
          </button>
        </div>
      </div>

      {/* Editing Instructions Banner */}
      {isEditMode && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CircleAlert size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
            <b>Inline Editing Active:</b> You can modify criteria titles, update behavioral descriptions, reorder rows, and test the Likert rating buttons directly on the evaluation rubric below.
          </span>
        </div>
      )}

      {/* =====================================================================
          AUTHENTIC EVALUATION FORM WRAPPER (DynamicRubric Format)
         ===================================================================== */}
      <div className="dynamic-rubric">
        {/* Questionnaire Header & Live Scaled Performance Score */}
        <div
          className="flex-between"
          style={{
            marginBottom: '14px',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid var(--line)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--ink-700)' }}>
            <b>EVSU Ormoc Campus · Employee Performance Rating</b> · {criteria.length} Universal Criteria (Max {maxRawScore} pts)
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              flexWrap: 'wrap',
            }}
          >
            <span>
              <b>{scoredCount} / {totalItems}</b> Scored
            </span>
            <span className="muted">·</span>
            <span>
              Raw Total: <b>{rawSum} / {maxRawScore}</b>
            </span>
            <span className="muted">·</span>
            <span>
              Scaled: <b>{scaledScore.toFixed(1)}%</b>
            </span>
            {currentInterpretation && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: currentInterpretation.color,
                  background: currentInterpretation.bg,
                  border: `1px solid ${currentInterpretation.border}`,
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {currentInterpretation.interpretation}
              </span>
            )}
          </div>
        </div>

        {/* Official Rating Scale Reference Guide (2, 4, 6, 8, 10) */}
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--ink-900)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Official Rating Scale (2, 4, 6, 8, 10)
            </span>
            <span className="muted" style={{ fontSize: '11.5px' }}>
              Eastern Visayas State University – Ormoc Campus
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px',
            }}
          >
            {DEFAULT_RATING_SCALE.map((def) => (
              <div
                key={def.rating}
                style={{
                  padding: '6px 10px',
                  background: def.bg,
                  border: `1px solid ${def.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: def.color,
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {def.rating}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: def.color }}>
                    {def.label}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: '11px', lineHeight: 1.3 }}>
                  {def.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rubric Matrix Table (Actual Evaluation Format) */}
        <div className="rubric-matrix-wrap" style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table className="data-table rubric-matrix">
            <thead>
              <tr>
                <th style={{ width: isEditMode ? '48%' : '55%' }}>Criteria &amp; Description</th>
                <th style={{ width: isEditMode ? '37%' : '45%', textAlign: 'center' }}>
                  Rating Scale (2 · 4 · 6 · 8 · 10)
                </th>
                {isEditMode && (
                  <th style={{ width: '15%', textAlign: 'center' }}>Row Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {criteria.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === criteria.length - 1;
                const currentVal = scores[item.id];

                return (
                  <tr key={item.id} style={{ background: currentVal ? '#fafbfc' : '#ffffff' }}>
                    {/* Left Cell: Criteria & Description */}
                    <td
                      className="rubric-item-cell"
                      style={{
                        fontSize: '13.5px',
                        lineHeight: 1.45,
                        verticalAlign: 'top',
                        padding: '14px 12px',
                      }}
                    >
                      {isEditMode ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--brand-700)', fontSize: '14px', flexShrink: 0 }}>
                              {idx + 1}.
                            </span>
                            <input
                              type="text"
                              className="input"
                              value={item.title}
                              onChange={(e) => handleUpdateCriterion(item.id, 'title', e.target.value)}
                              style={{
                                fontWeight: 800,
                                fontSize: '13.5px',
                                padding: '5px 8px',
                                flex: 1,
                                borderColor: 'var(--line)',
                              }}
                              placeholder="Criterion title..."
                            />
                          </div>
                          <textarea
                            className="input"
                            rows={2}
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateCriterion(item.id, 'description', e.target.value)
                            }
                            style={{
                              fontSize: '12.5px',
                              lineHeight: 1.4,
                              padding: '6px 8px',
                              resize: 'vertical',
                              width: '100%',
                              borderColor: 'var(--line)',
                            }}
                            placeholder="Detailed description of performance standard..."
                          />
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              color: 'var(--ink-900)',
                              marginBottom: '3px',
                            }}
                          >
                            {idx + 1}. {item.title}
                          </div>
                          <div className="muted" style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                            {item.description}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Middle Cell: Actual Score Buttons (2, 4, 6, 8, 10) */}
                    <td
                      className="rubric-score-cell"
                      style={{ textAlign: 'center', verticalAlign: 'middle', padding: '14px 12px' }}
                    >
                      <div
                        className="score-buttons score-buttons-inline"
                        style={{ justifyContent: 'center', gap: '8px' }}
                      >
                        {[2, 4, 6, 8, 10].map((val) => {
                          const def = DEFAULT_RATING_SCALE.find((d) => d.rating === val);
                          const isSelected = currentVal === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              className={`score-btn score-btn-sm ${isSelected ? 'selected' : ''}`}
                              style={{
                                minWidth: '40px',
                                height: '36px',
                                fontWeight: isSelected ? 800 : 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleScoreClick(item.id, val)}
                              title={`${val} – ${def?.label}: ${def?.desc}`}
                            >
                              <span className="num">{val}</span>
                            </button>
                          );
                        })}
                      </div>
                      {currentVal && (
                        <div
                          style={{
                            marginTop: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: DEFAULT_RATING_SCALE.find((d) => d.rating === currentVal)?.color,
                          }}
                        >
                          {DEFAULT_RATING_SCALE.find((d) => d.rating === currentVal)?.label}
                        </div>
                      )}
                    </td>

                    {/* Right Cell: Row Controls (Edit Mode only) */}
                    {isEditMode && (
                      <td
                        style={{
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          padding: '14px 8px',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              padding: '3px 6px',
                              background: '#fff',
                              borderColor: 'var(--line)',
                              opacity: isFirst ? 0.35 : 1,
                              cursor: isFirst ? 'not-allowed' : 'pointer',
                            }}
                            disabled={isFirst}
                            onClick={() => handleMoveCriterion(idx, 'up')}
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              padding: '3px 6px',
                              background: '#fff',
                              borderColor: 'var(--line)',
                              opacity: isLast ? 0.35 : 1,
                              cursor: isLast ? 'not-allowed' : 'pointer',
                            }}
                            disabled={isLast}
                            onClick={() => handleMoveCriterion(idx, 'down')}
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              padding: '3px 6px',
                              background: '#fff',
                              borderColor: 'var(--line)',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleDuplicateCriterion(idx)}
                            title="Duplicate Criterion"
                          >
                            <Copy size={12} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              padding: '3px 6px',
                              background: '#fff',
                              borderColor: '#fca5a5',
                              color: '#dc2626',
                              opacity: criteria.length <= 1 ? 0.35 : 1,
                              cursor: criteria.length <= 1 ? 'not-allowed' : 'pointer',
                            }}
                            disabled={criteria.length <= 1}
                            onClick={() => handleDeleteCriterion(item.id, item.title)}
                            title="Delete Criterion"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* In Edit Mode: Add New Criterion Row */}
              {isEditMode && (
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan={3} style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleAddCriterion}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      <Plus size={14} /> Add New Evaluation Criterion
                    </button>
                  </td>
                </tr>
              )}

              {/* Overall Rating Row (Average of Criteria) */}
              <tr
                style={{
                  background: '#f8fafc',
                  borderTop: '2px solid var(--line)',
                  fontWeight: 800,
                }}
              >
                <td style={{ padding: '14px 12px', fontSize: '14px' }}>
                  Overall Rating
                </td>
                <td
                  colSpan={isEditMode ? 2 : 1}
                  style={{ textAlign: 'center', padding: '14px 12px' }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 14px',
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  >
                    <span>
                      Raw Sum: <b>{rawSum} / {maxRawScore}</b>
                    </span>
                    <span className="muted">|</span>
                    <span
                      style={{
                        color: currentInterpretation
                          ? currentInterpretation.color
                          : 'var(--ink-800)',
                        fontWeight: 800,
                      }}
                    >
                      {scaledScore.toFixed(1)}% (
                      {currentInterpretation
                        ? currentInterpretation.interpretation
                        : 'Unrated'}
                      )
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* COMMENTS AND RECOMMENDATIONS (Actual Evaluation Format) */}
        <div
          className="card"
          style={{
            marginBottom: '20px',
            background: '#fafbfc',
            border: '1px solid var(--line)',
            padding: '20px',
          }}
        >
          <h3
            style={{
              margin: '0 0 14px',
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--ink-900)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            COMMENTS AND RECOMMENDATIONS
          </h3>

          {/* Qualitative Prompt: Strengths and Areas for Improvement */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '4px' }}>
              Strengths of the Employee / Areas for Improvement <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <p className="muted" style={{ margin: '0 0 6px', fontSize: '12.5px' }}>
              Detailed qualitative feedback highlighting observed competencies, dependability, task outputs, and areas for professional development.
            </p>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Type specific qualitative observations here..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
            />
          </div>

          {/* Recommendation: Exact 3 Options from Section V */}
          <div className="form-group" style={{ margin: 0 }}>
            <label
              style={{
                fontWeight: 700,
                fontSize: '13.5px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Recommendation: <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {DEFAULT_RECOMMENDATIONS.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: recommendation === opt.value ? '#ffffff' : 'transparent',
                    border: recommendation === opt.value ? '1px solid var(--line)' : '1px solid transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="rubric_editor_recommendation"
                    value={opt.value}
                    checked={recommendation === opt.value}
                    onChange={(e) => setRecommendation(e.target.value)}
                  />
                  <span style={{ fontWeight: recommendation === opt.value ? 700 : 500 }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Save & Action Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '16px 20px',
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--ink-600)' }}>
            Active Rubric Version: <b>{template.version}</b> · Last saved: <b>{template.lastUpdated || 'Initial Standard'}</b>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-sm"
              disabled={isSaving}
              onClick={() => setShowResetModal(true)}
              style={{ borderColor: '#fca5a5', color: '#dc2626' }}
            >
              <RotateCcw size={13} /> Reset Defaults
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={isSaving}
              onClick={handleSaveAndPublish}
              style={{ fontWeight: 700 }}
            >
              <Save size={13} /> {isSaving ? 'Publishing to Server...' : 'Save & Publish Rubric'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting to Defaults */}
      {showResetModal && (
        <div className="modal-backdrop" onClick={() => !isSaving && setShowResetModal(false)}>
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
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RotateCcw size={18} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>
                Reset to Official EVSU Rubric?
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 20px' }}>
              This will discard custom modifications and restore the standard universal 6 criteria (Job Knowledge, Work Quality, Attendance, Initiative, Work Attitude and Cooperation, Dependability) with default phrasing on the institutional server.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={isSaving}
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={isSaving}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleConfirmReset}
              >
                {isSaving ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
