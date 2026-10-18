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

export default function DynamicRubric({
  cosCategory = 'Administrative', // 'Administrative' | 'Maintenance'
  evaluatorRole = 'Immediate Supervisor', // 'Immediate Supervisor' | 'Peer' | 'HRMO'
  initialScores = {},
  initialStrengths = '',
  initialRecommendation = 'Recommended for Renewal',
  onSaveDraft = () => {},
  onSubmit = () => {},
  onFastTrackReject = null, // Callback if supervisor wants to trigger Fast-Track Rejection (UC-06)
  readOnly = false,
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
  const isComplete = scoredCount === totalItems && strengths.trim().length > 0 && !!recommendation;

  return (
    <div className="dynamic-rubric">
      {/* Questionnaire Header */}
      <div className="flex-between" style={{ marginBottom: '12px' }}>
        <div>
          <span className="badge badge-dept" style={{ marginRight: '8px' }}>
            {categoryLabel}
          </span>
          <span className="muted" style={{ fontSize: '13px' }}>
            Dynamic Questionnaire Criteria (FR-07)
          </span>
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px' }}>
          <b>{scoredCount} / {totalItems}</b> Scored · Raw Sum: <b>{rawSum} / 100</b>
        </div>
      </div>

      {evaluatorRole === 'Peer' && (
        <div className="flash flash-info" style={{ marginBottom: '14px', fontSize: '12.5px', padding: '8px 12px' }}>
          🔒 <b>Anonymous Grading (UC-04, FR-27):</b> Your identity will be permanently stripped when your 20% peer score is recorded.
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
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            disabled={readOnly}
                            className={`score-btn score-btn-sm ${scores[item.id] === val ? 'selected' : ''}`}
                            onClick={() => handleScoreClick(item.id, val)}
                            title={`Score ${val}`}
                          >
                            <span className="num">{val}</span>
                          </button>
                        ))}
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
            Required qualitative comments on performance, attendance, diligence, or areas requiring development.
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

        {/* Final Recommendation Radio Group (FR-10, US-03, Section 2.2) */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '8px' }}>
            Final Recommendation <span style={{ color: 'var(--red-600)' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="finalRecommendation"
                value="Recommended for Renewal"
                disabled={readOnly}
                checked={recommendation === 'Recommended for Renewal'}
                onChange={(e) => setRecommendation(e.target.value)}
              />
              <span style={{ color: '#0f6b32', fontWeight: 600 }}>Recommended for Renewal</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="finalRecommendation"
                value="Recommended with Conditions"
                disabled={readOnly}
                checked={recommendation === 'Recommended with Conditions'}
                onChange={(e) => setRecommendation(e.target.value)}
              />
              <span style={{ color: '#b45309', fontWeight: 600 }}>Recommended with Conditions</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="finalRecommendation"
                value="Not Recommended"
                disabled={readOnly}
                checked={recommendation === 'Not Recommended'}
                onChange={(e) => setRecommendation(e.target.value)}
              />
              <span style={{ color: '#dc2626', fontWeight: 600 }}>Not Recommended</span>
            </label>
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
            💾 Save as Draft
          </button>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {onFastTrackReject && (
              <button
                type="button"
                className="btn btn-sm"
                style={{ color: 'var(--red-600)', borderColor: 'var(--red-600)', background: 'transparent' }}
                onClick={onFastTrackReject}
              >
                ⚠️ Fast-Track Rejection (UC-06)
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={!isComplete}
              onClick={() => onSubmit({ scores, strengths, recommendation, rawSum })}
            >
              Submit {evaluatorRole} Evaluation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
