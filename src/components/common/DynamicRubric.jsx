import React, { useState } from 'react';

// Criteria for "COS-ADMINISTRATIVE OFFICES" (SRS Section 2.2 & FR-07)
export const ADMINISTRATIVE_CRITERIA = [
  {
    dimLetter: 'A',
    dimTitle: 'Quality of Work',
    items: [
      { id: 'adm_1', text: 'Produces accurate and reliable work outputs with minimal supervision' },
      { id: 'adm_2', text: 'Completes assigned tasks efficiently and adheres to established standards' },
      { id: 'adm_3', text: 'Demonstrates meticulous attention to detail in document preparation and filing' },
      { id: 'adm_4', text: 'Strictly follows office procedures, institutional guidelines, and routing protocols' },
    ],
  },
  {
    dimLetter: 'B',
    dimTitle: 'Productivity and Dependability',
    items: [
      { id: 'adm_5', text: 'Consistently reports to work regularly and on time' },
      { id: 'adm_6', text: 'Meets deadlines and prompt delivery of required service requests' },
      { id: 'adm_7', text: 'Exhibits self-reliance and initiative in accomplishing departmental tasks' },
      { id: 'adm_8', text: 'Responds positively and constructively to urgent or additional assignments' },
    ],
  },
  {
    dimLetter: 'C',
    dimTitle: 'Professionalism and Work Ethics',
    items: [
      { id: 'adm_9', text: 'Demonstrates high standards of honesty, integrity, and ethical conduct' },
      { id: 'adm_10', text: 'Consistently observes proper grooming, decorum, and compliance with university ID/uniform' },
      { id: 'adm_11', text: 'Treats students, faculty, co-workers, and campus clients with courtesy and respect' },
      { id: 'adm_12', text: 'Handles university supplies, office property, and confidential records responsibly' },
    ],
  },
  {
    dimLetter: 'D',
    dimTitle: 'Teamwork and Interpersonal Relations',
    items: [
      { id: 'adm_13', text: 'Collaborates constructively with departmental colleagues and supervisors' },
      { id: 'adm_14', text: 'Communicates clearly and effectively both verbally and in written correspondence' },
      { id: 'adm_15', text: 'Contributes toward maintaining a harmonious and productive work environment' },
      { id: 'adm_16', text: 'Accepts constructive feedback and suggestions with an open and positive mindset' },
    ],
  },
  {
    dimLetter: 'E',
    dimTitle: 'Initiative and Adaptability',
    items: [
      { id: 'adm_17', text: 'Anticipates office needs and takes proactive action without being prompted' },
      { id: 'adm_18', text: 'Adapts quickly and effectively to changes in office procedures or work schedules' },
      { id: 'adm_19', text: 'Demonstrates willingness to acquire new technical skills and system knowledge' },
      { id: 'adm_20', text: 'Handles workplace stress, challenges, and peak periods composedly and responsibly' },
    ],
  },
];

// Criteria for "COS-Maintenance/Janitorial Personnel" (SRS Section 2.2 & FR-07)
export const MAINTENANCE_CRITERIA = [
  {
    dimLetter: 'A',
    dimTitle: 'Quality of Upkeep and Physical Maintenance',
    items: [
      { id: 'mnt_1', text: 'Maintains thorough cleanliness, sanitation, and orderliness of assigned campus facilities' },
      { id: 'mnt_2', text: 'Performs routine facility maintenance and physical checks efficiently and thoroughly' },
      { id: 'mnt_3', text: 'Promptly identifies and reports facility hazards, leakages, or damage to supervisor' },
      { id: 'mnt_4', text: 'Properly segregates and disposes of institutional waste following environmental guidelines' },
    ],
  },
  {
    dimLetter: 'B',
    dimTitle: 'Promptness and Operational Reliability',
    items: [
      { id: 'mnt_5', text: 'Reports for assigned campus shifts reliably and observes scheduled duty hours' },
      { id: 'mnt_6', text: 'Responds promptly and diligently to service requests, repairs, and venue preparations' },
      { id: 'mnt_7', text: 'Accomplishes assigned maintenance tasks within designated operational timeframes' },
      { id: 'mnt_8', text: 'Remains readily available and responsive during campus emergency operations or major events' },
    ],
  },
  {
    dimLetter: 'C',
    dimTitle: 'Occupational Safety and Equipment Care',
    items: [
      { id: 'mnt_9', text: 'Adheres strictly to university occupational safety, hazard protocols, and protective gear rules' },
      { id: 'mnt_10', text: 'Operates custodial machinery, electrical equipment, and physical tools with proper caution' },
      { id: 'mnt_11', text: 'Maintains, cleans, and securely stores all assigned custodial tools and equipment after use' },
      { id: 'mnt_12', text: 'Prevents wastage of institutional cleaning materials, water, and electrical utilities' },
    ],
  },
  {
    dimLetter: 'D',
    dimTitle: 'Cooperation and Interpersonal Conduct',
    items: [
      { id: 'mnt_13', text: 'Works harmoniously and cooperatively with maintenance peers and campus personnel' },
      { id: 'mnt_14', text: 'Interacts with students, faculty, and university visitors respectfully and courteously' },
      { id: 'mnt_15', text: 'Accepts supervisory directives, work assignments, and reassignments with a positive attitude' },
      { id: 'mnt_16', text: 'Observes university rules, proper work attire, and identification at all times' },
    ],
  },
  {
    dimLetter: 'E',
    dimTitle: 'Initiative and Physical Dependability',
    items: [
      { id: 'mnt_17', text: 'Demonstrates initiative in inspecting and tidying up public areas without waiting for orders' },
      { id: 'mnt_18', text: 'Adapts flexibly to changing weather conditions, venue shifts, or special university events' },
      { id: 'mnt_19', text: 'Shows eagerness to learn proper maintenance techniques, basic repairs, and safety skills' },
      { id: 'mnt_20', text: 'Exhibits physical stamina and continuous diligence throughout work shifts' },
    ],
  },
];

// Official University HR Rating Scale (1 – 5)
export const RATING_SCALE_DEFINITIONS = [
  { rating: 5, label: 'Outstanding', desc: 'Performance consistently exceeds expectations', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { rating: 4, label: 'Very Satisfactory', desc: 'Frequently exceeds expectations', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { rating: 3, label: 'Satisfactory', desc: 'Meets expectations', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { rating: 2, label: 'Needs Improvement', desc: 'Sometimes fails to meet expectations', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { rating: 1, label: 'Unsatisfactory', desc: 'Frequently fails to meet expectations', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
];

// Official University HR Performance Interpretation & System Recommendation (Score 20 – 100)
export const getPerformanceInterpretation = (score) => {
  const num = Number(score) || 0;
  if (num >= 90) {
    return {
      scoreRange: '90 – 100',
      interpretation: 'Outstanding',
      recommendation: 'Strongly Recommended for Renewal',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      badgeClass: 'badge-completed',
    };
  }
  if (num >= 80) {
    return {
      scoreRange: '80 – 89',
      interpretation: 'Very Satisfactory',
      recommendation: 'Recommended for Renewal',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      badgeClass: 'badge-completed',
    };
  }
  if (num >= 70) {
    return {
      scoreRange: '70 – 79',
      interpretation: 'Satisfactory',
      recommendation: 'Renewal with Monitoring',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      badgeClass: 'badge-completed',
    };
  }
  if (num >= 60) {
    return {
      scoreRange: '60 – 69',
      interpretation: 'Needs Improvement',
      recommendation: 'Renewal Subject to Evaluation',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      badgeClass: 'badge-pending',
    };
  }
  return {
    scoreRange: 'Below 60',
    interpretation: 'Unsatisfactory',
    recommendation: 'Not Recommended for Renewal',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    badgeClass: 'badge-delayed',
  };
};

export const OFFICIAL_RECOMMENDATIONS = [
  {
    value: 'Strongly Recommended for Renewal',
    label: 'Strongly Recommended for Renewal',
    bracket: '90 – 100 Outstanding',
    color: '#16a34a',
  },
  {
    value: 'Recommended for Renewal',
    label: 'Recommended for Renewal',
    bracket: '80 – 89 Very Satisfactory',
    color: '#2563eb',
  },
  {
    value: 'Renewal with Monitoring',
    label: 'Renewal with Monitoring',
    bracket: '70 – 79 Satisfactory',
    color: '#0284c7',
  },
  {
    value: 'Renewal Subject to Evaluation',
    label: 'Renewal Subject to Evaluation',
    bracket: '60 – 69 Needs Improvement',
    color: '#d97706',
  },
  {
    value: 'Not Recommended for Renewal',
    label: 'Not Recommended for Renewal',
    bracket: 'Below 60 Unsatisfactory',
    color: '#dc2626',
  },
];

export default function DynamicRubric({
  cosCategory = 'Administrative', // 'Administrative' | 'Maintenance/Janitorial'
  evaluatorRole = 'Immediate Supervisor', // 'Immediate Supervisor' | 'Peer' | 'HRMO'
  initialScores = {},
  initialStrengths = '',
  initialRecommendation = 'Recommended for Renewal',
  onSaveDraft = () => {},
  onSubmit = () => {},
  readOnly = false,
  hideAlerts = false,
}) {
  const isMaintenance = cosCategory.toLowerCase().includes('maintenance') || cosCategory.toLowerCase().includes('janitorial');
  const criteria = isMaintenance ? MAINTENANCE_CRITERIA : ADMINISTRATIVE_CRITERIA;
  const categoryLabel = isMaintenance ? 'COS-Maintenance/Janitorial Personnel' : 'COS-ADMINISTRATIVE OFFICES';

  const [scores, setScores] = useState(initialScores);
  const [strengths, setStrengths] = useState(initialStrengths);
  const [recommendation, setRecommendation] = useState(initialRecommendation);

  const handleScoreClick = (itemId, val) => {
    if (readOnly) return;
    setScores((prev) => ({ ...prev, [itemId]: val }));
  };

  const totalItems = 20;
  const scoredCount = Object.keys(scores).length;
  const rawSum = Object.values(scores).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  // Total raw score scaled to 100 points (each item 1-5, 20 items = 100 max points)
  const currentInterpretation = scoredCount > 0 ? getPerformanceInterpretation(rawSum) : null;
  const isComplete = scoredCount === totalItems && strengths.trim().length > 0 && !!recommendation;

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
          <b>{categoryLabel}</b> · 20 Specific Items (Max 100 pts)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', flexWrap: 'wrap' }}>
          <span><b>{scoredCount} / {totalItems}</b> Scored</span>
          <span className="muted">·</span>
          <span>Raw Score: <b>{rawSum} / 100</b></span>
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
              {currentInterpretation.interpretation} ({currentInterpretation.scoreRange})
            </span>
          )}
        </div>
      </div>

      {/* Official University HR Rating Scale Reference Bar (1 – 5) */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px 14px',
          background: '#ffffff',
          border: '1px solid var(--line)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-900)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Official Rating Scale (1 – 5)
          </span>
          <span className="muted" style={{ fontSize: '11.5px' }}>
            Eastern Visayas State University COS Performance Standard
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          {RATING_SCALE_DEFINITIONS.map((def) => (
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
                    width: '18px',
                    height: '18px',
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

      {!hideAlerts && readOnly && (
        <div className="flash flash-info" style={{ marginBottom: '14px', fontSize: '13px' }}>
          This evaluation has already been submitted and is locked in read-only mode while undergoing peer and HR review.
        </div>
      )}

      {!hideAlerts && evaluatorRole === 'Peer' && (
        <div className="flash flash-info" style={{ marginBottom: '14px', fontSize: '12.5px', padding: '8px 12px' }}>
          <b>Anonymous Grading:</b> Your identity will be permanently stripped when your 20% peer score is recorded.
        </div>
      )}

      {/* Rubric Matrix */}
      <div className="rubric-matrix-wrap" style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table className="data-table rubric-matrix">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>Evaluation Dimensions &amp; Specific Criteria</th>
              <th style={{ width: '40%', textAlign: 'center' }}>Scale (1 – 5)</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((dim) => (
              <React.Fragment key={dim.dimLetter}>
                <tr className="rubric-dim-row">
                  <td colSpan="2">
                    {dim.dimLetter}. {dim.dimTitle.toUpperCase()}
                  </td>
                </tr>
                {dim.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="rubric-item-cell" style={{ fontSize: '13.5px', lineHeight: 1.45 }}>
                      <b>{idx + 1}.</b> {item.text}
                    </td>
                    <td className="rubric-score-cell" style={{ textAlign: 'center' }}>
                      <div className="score-buttons score-buttons-inline" style={{ justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map((val) => {
                          const def = RATING_SCALE_DEFINITIONS.find((d) => d.rating === val);
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={readOnly}
                              className={`score-btn score-btn-sm ${scores[item.id] === val ? 'selected' : ''}`}
                              onClick={() => handleScoreClick(item.id, val)}
                              title={`${val} – ${def?.label}: ${def?.desc}`}
                            >
                              <span className="num">{val}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Qualitative Feedback (FR-10, US-03) */}
      <div className="card" style={{ marginBottom: '20px', background: '#fafbfc', border: '1px solid var(--line)' }}>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label htmlFor="strengthsField" style={{ fontWeight: 700, fontSize: '13.5px' }}>
            Strengths / Areas for Improvement <span style={{ color: 'var(--red-600)' }}>*</span>
          </label>
          <p className="muted" style={{ margin: '0 0 6px', fontSize: '12.5px' }}>
            Required qualitative comments on performance deliverables, task efficiency, diligence, or areas requiring development.
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

        {/* Final Recommendation Radio Group (FR-10, US-03, Official HR Scale) */}
        <div className="form-group" style={{ margin: 0 }}>
          <div className="flex-between" style={{ alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ fontWeight: 700, fontSize: '13.5px', margin: 0 }}>
              Final Recommendation <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            {currentInterpretation && (
              <span className="muted" style={{ fontSize: '12px' }}>
                HR Guidance for {rawSum} pts: <b style={{ color: currentInterpretation.color }}>{currentInterpretation.recommendation}</b>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {OFFICIAL_RECOMMENDATIONS.map((opt) => (
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
                  background: recommendation === opt.value ? '#ffffff' : 'transparent',
                  border: recommendation === opt.value ? `1px solid ${opt.color}` : '1px solid transparent',
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
                <span style={{ color: opt.color, fontWeight: 700 }}>{opt.label}</span>
                <span className="muted" style={{ fontSize: '12px' }}>({opt.bracket})</span>
              </label>
            ))}

            {/* Backward-compatible fallback for legacy values */}
            {recommendation &&
              !OFFICIAL_RECOMMENDATIONS.some((r) => r.value === recommendation) && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#fff',
                    border: '1px solid var(--line)',
                  }}
                >
                  <input
                    type="radio"
                    name="finalRecommendation"
                    value={recommendation}
                    disabled={readOnly}
                    checked
                    readOnly
                  />
                  <span style={{ color: 'var(--ink-800)', fontWeight: 600 }}>{recommendation}</span>
                  <span className="muted" style={{ fontSize: '11px' }}>(Recorded Value)</span>
                </label>
              )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      {!readOnly && (
        <div className="flex-between" style={{ paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
          <button
            type="button"
            className="btn"
            onClick={() => onSaveDraft({ scores, strengths, recommendation, rawSum })}
          >
            Save as Draft
          </button>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isComplete}
              onClick={() => onSubmit({ scores, strengths, recommendation, rawSum })}
            >
              Submit Evaluation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
