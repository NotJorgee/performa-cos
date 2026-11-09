import React, { useState, useEffect, useRef } from 'react';
import { getActiveEvaluationTemplate, fetchActiveTemplateFromApi } from '../../utils/evaluationTemplate';

export { getActiveEvaluationTemplate };

// Official EVSU Ormoc Campus Employee Performance Rating Criteria (Universal 6 Criteria)
export const EVSU_PERFORMANCE_CRITERIA = [
  {
    id: 'job_knowledge',
    title: 'Job Knowledge',
    description:
      'Understands duties, responsibilities, has ability to use materials needed, and has the level of proficiency required to accomplish the work.',
  },
  {
    id: 'work_quality',
    title: 'Work Quality',
    description: 'Accuracy, thoroughness, dependability of result.',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description:
      'Reports to work as scheduled. Follows established procedures for breaks. Notifies supervisor in advance of scheduling changes.',
  },
  {
    id: 'initiative',
    title: 'Initiative',
    description:
      'Ability to be self-directed, efficient, creative and resourceful. Assumes extra work on own initiative, adapts quickly to new responsibilities.',
  },
  {
    id: 'work_attitude',
    title: 'Work Attitude and Cooperation',
    description:
      'Extent to which employee demonstrates a positive attitude and promotes cooperation with supervisors, peers, and others.',
  },
  {
    id: 'dependability',
    title: 'Dependability',
    description:
      'Extent to which employee can be counted on to carry out instructions and fulfill job responsibilities.',
  },
];

// Official Rating Scale (2, 4, 6, 8, 10)
export const EVSU_RATING_SCALE = [
  {
    rating: 10,
    label: 'Outstanding',
    desc: 'Performance consistently exceeds expectations',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    rating: 8,
    label: 'Very Satisfactory',
    desc: 'Frequently exceeds expectations',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    rating: 6,
    label: 'Satisfactory',
    desc: 'Meets expectations',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    rating: 4,
    label: 'Needs Improvement',
    desc: 'Sometimes fails to meet expectations',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    rating: 2,
    label: 'Unsatisfactory',
    desc: 'Frequently fails to meet expectations',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
  },
];

// Official 3 Recommendations from Section V
export const EVSU_RECOMMENDATIONS = [
  {
    value: 'Recommended for Renewal',
    label: 'Recommended for Renewal',
    color: '#16a34a',
  },
  {
    value: 'Recommended with Conditions',
    label: 'Recommended with Conditions',
    color: '#d97706',
  },
  {
    value: 'Not Recommended for Renewal',
    label: 'Not Recommended for Renewal',
    color: '#dc2626',
  },
];

// Calibrated University HR Performance Interpretation (Centering 2, 4, 6, 8, 10 Likert rating tiers)
// Note: Recommendation is strictly manual input by supervisor; no system recommendation is emitted.
export const getPerformanceInterpretation = (score) => {
  const num = Number(score) || 0;
  if (num >= 90) {
    return {
      scoreRange: '90.0 – 100.0',
      interpretation: 'Outstanding',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      badgeClass: 'badge-completed',
    };
  }
  if (num >= 70) {
    return {
      scoreRange: '70.0 – 89.9',
      interpretation: 'Very Satisfactory',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      badgeClass: 'badge-completed',
    };
  }
  if (num >= 50) {
    return {
      scoreRange: '50.0 – 69.9',
      interpretation: 'Satisfactory',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      badgeClass: 'badge-completed',
    };
  }
  if (num >= 30) {
    return {
      scoreRange: '30.0 – 49.9',
      interpretation: 'Needs Improvement',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      badgeClass: 'badge-pending',
    };
  }
  return {
    scoreRange: 'Below 30.0',
    interpretation: 'Unsatisfactory',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    badgeClass: 'badge-delayed',
  };
};

export default function DynamicRubric({
  employeeJobTitle = 'Admin Aide',
  evaluatorRole = 'Immediate Supervisor', // 'Immediate Supervisor' | 'Peer' | 'HRMO'
  initialScores = {},
  initialStrengths = '',
  initialRecommendation = '',
  onSaveDraft = () => {},
  onSubmit = () => {},
  readOnly = false,
  hideAlerts = false,
  criteria: propCriteria = null,
}) {
  const [template, setTemplate] = useState(() => getActiveEvaluationTemplate());

  useEffect(() => {
    let isMounted = true;
    fetchActiveTemplateFromApi()
      .then((tpl) => {
        if (isMounted && tpl) setTemplate(tpl);
      })
      .catch(() => {});

    const onTemplateUpdated = (e) => {
      if (e.detail) setTemplate(e.detail);
    };

    window.addEventListener('performa_template_updated', onTemplateUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('performa_template_updated', onTemplateUpdated);
    };
  }, []);

  const criteria = propCriteria || template.criteria || EVSU_PERFORMANCE_CRITERIA;

  const defaultStrengths = initialStrengths || 'Demonstrates consistent and commendable execution of contracted departmental deliverables.';
  const [scores, setScores] = useState(initialScores || {});
  const [strengths, setStrengths] = useState(defaultStrengths);
  const [recommendation, setRecommendation] = useState(initialRecommendation || 'Recommended for Renewal');

  const totalItems = criteria.length;
  const maxRawScore = totalItems > 0 ? totalItems * 10 : 60;
  const scoredCount = Object.keys(scores).filter((k) =>
    criteria.some((c) => c.id === k)
  ).length;

  const rawSum = criteria.reduce(
    (acc, curr) => acc + (Number(scores[curr.id]) || 0),
    0
  );
  // Max raw score is totalItems * 10 points
  // Scaled percentage out of 100 = (rawSum / maxRawScore) * 100
  const scaledScore =
    scoredCount > 0 && maxRawScore > 0 ? Math.round(((rawSum / maxRawScore) * 100) * 10) / 10 : 0;
  const currentInterpretation =
    scoredCount > 0 ? getPerformanceInterpretation(scaledScore) : null;

  const hasProgress = Object.keys(scores).length > 0 || (strengths && strengths !== defaultStrengths);

  const onSaveDraftRef = useRef(onSaveDraft);
  useEffect(() => {
    onSaveDraftRef.current = onSaveDraft;
  }, [onSaveDraft]);

  // Auto-save whenever rubric scoring or qualitative feedback is modified
  useEffect(() => {
    if (readOnly) return;
    if (hasProgress && onSaveDraftRef.current) {
      onSaveDraftRef.current({
        scores,
        strengths,
        recommendation,
        rawSum,
        scaledScore,
        scoredCount,
        hasProgress: true,
      });
    }
  }, [scores, strengths, recommendation, rawSum, scaledScore, scoredCount, readOnly, hasProgress]);

  // Flush auto-save on component unmount (e.g. user clicks back button or navigates away)
  useEffect(() => {
    return () => {
      if (!readOnly && hasProgress && onSaveDraftRef.current) {
        onSaveDraftRef.current({
          scores,
          strengths,
          recommendation,
          rawSum,
          scaledScore,
          scoredCount,
          hasProgress: true,
        });
      }
    };
  }, [readOnly, hasProgress, scores, strengths, recommendation, rawSum, scaledScore, scoredCount]);

  const handleScoreClick = (itemId, val) => {
    if (readOnly) return;
    setScores((prev) => ({ ...prev, [itemId]: val }));
  };

  const isComplete = scoredCount === totalItems && !!recommendation;

  return (
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
          <b>EVSU Ormoc Campus · Employee Performance Rating</b> · 6 Universal
          Criteria (Max 60 pts)
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
            <b>
              {scoredCount} / {totalItems}
            </b>{' '}
            Scored
          </span>
          <span className="muted">·</span>
          <span>
            Raw Total: <b>{rawSum} / 60</b>
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
          {EVSU_RATING_SCALE.map((def) => (
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
                <span
                  style={{ fontWeight: 700, fontSize: '12px', color: def.color }}
                >
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

      {!hideAlerts && readOnly && (
        <div
          className="flash flash-info"
          style={{ marginBottom: '14px', fontSize: '13px' }}
        >
          This evaluation has already been submitted and is locked in read-only
          mode while undergoing peer and HR review.
        </div>
      )}

      {!hideAlerts && evaluatorRole === 'Peer' && (
        <div
          className="flash flash-info"
          style={{
            marginBottom: '14px',
            fontSize: '12.5px',
            padding: '8px 12px',
          }}
        >
          <b>Anonymous Grading:</b> Your identity will be permanently stripped
          when your 20% peer score is recorded and printed.
        </div>
      )}

      {/* Rubric Matrix */}
      <div
        className="rubric-matrix-wrap"
        style={{ overflowX: 'auto', marginBottom: '20px' }}
      >
        <table className="data-table rubric-matrix">
          <thead>
            <tr>
              <th style={{ width: '55%' }}>Criteria &amp; Description</th>
              <th style={{ width: '45%', textAlign: 'center' }}>
                Rating Scale (2 · 4 · 6 · 8 · 10)
              </th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((item, idx) => (
              <tr key={item.id}>
                <td
                  className="rubric-item-cell"
                  style={{
                    fontSize: '13.5px',
                    lineHeight: 1.45,
                    verticalAlign: 'top',
                    padding: '14px 12px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: 'var(--ink-900)',
                      marginBottom: '3px',
                    }}
                  >
                    {idx + 1}. {item.title}
                  </div>
                  <div
                    className="muted"
                    style={{ fontSize: '12.5px', lineHeight: 1.4 }}
                  >
                    {item.description}
                  </div>
                </td>
                <td
                  className="rubric-score-cell"
                  style={{ textAlign: 'center', verticalAlign: 'middle' }}
                >
                  <div
                    className="score-buttons score-buttons-inline"
                    style={{ justifyContent: 'center', gap: '8px' }}
                  >
                    {[2, 4, 6, 8, 10].map((val) => {
                      const def = EVSU_RATING_SCALE.find(
                        (d) => d.rating === val
                      );
                      const isSelected = scores[item.id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={readOnly}
                          className={`score-btn score-btn-sm ${
                            isSelected ? 'selected' : ''
                          }`}
                          style={{
                            minWidth: '40px',
                            height: '36px',
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: '13px',
                          }}
                          onClick={() => handleScoreClick(item.id, val)}
                          title={`${val} – ${def?.label}: ${def?.desc}`}
                        >
                          <span className="num">{val}</span>
                        </button>
                      );
                    })}
                  </div>
                  {scores[item.id] && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: EVSU_RATING_SCALE.find(
                          (d) => d.rating === scores[item.id]
                        )?.color,
                      }}
                    >
                      {
                        EVSU_RATING_SCALE.find(
                          (d) => d.rating === scores[item.id]
                        )?.label
                      }
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {/* Overall Rating Row in Table */}
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
              <td style={{ textAlign: 'center', padding: '14px 12px' }}>
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
                    Raw Sum: <b>{rawSum} / 60</b>
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

      {/* COMMENTS AND RECOMMENDATIONS */}
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

        {/* Strengths of the Employee / Areas for Improvement */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label
            htmlFor="strengthsField"
            style={{ fontWeight: 700, fontSize: '13.5px' }}
          >
            Strengths of the Employee / Areas for Improvement{' '}
            <span style={{ color: 'var(--red-600)' }}>*</span>
          </label>
          <p
            className="muted"
            style={{ margin: '0 0 6px', fontSize: '12.5px' }}
          >
            Detailed qualitative feedback highlighting observed competencies,
            dependability, task outputs, and areas for professional development.
          </p>
          <textarea
            id="strengthsField"
            className="form-control"
            rows="3"
            disabled={readOnly}
            placeholder="Type specific qualitative observations here..."
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
          />
        </div>

        {/* Recommendation (Exact 3 Options from Section V) */}
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
            {EVSU_RECOMMENDATIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  cursor: readOnly ? 'default' : 'pointer',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background:
                    recommendation === opt.value ? '#ffffff' : 'transparent',
                  border:
                    recommendation === opt.value
                      ? `1px solid ${opt.color}`
                      : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="finalRecommendation"
                  value={opt.value}
                  disabled={readOnly}
                  checked={recommendation === opt.value}
                  onChange={(e) => setRecommendation(e.target.value)}
                />
                <span style={{ color: opt.color, fontWeight: 700 }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      {!readOnly && (
        <div
          className="flex-between"
          style={{ paddingTop: '14px', borderTop: '1px solid var(--line)', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!isComplete && (
              <span className="muted" style={{ fontSize: '12.5px' }}>
                {scoredCount < totalItems
                  ? `Score all criteria (${scoredCount}/${totalItems}) to submit`
                  : 'Please select a recommendation to submit'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isComplete}
              onClick={() =>
                onSubmit({
                  scores,
                  strengths: strengths.trim() || 'Demonstrates consistent and commendable execution of contracted departmental deliverables.',
                  recommendation,
                  rawSum,
                  scaledScore,
                })
              }
            >
              Submit Evaluation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
