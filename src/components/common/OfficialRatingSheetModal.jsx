import React, { useRef } from 'react';
import { Printer, X, Download, FileText } from 'lucide-react';
import evsuLogo from '../../assets/images/evsu-seal.png';
import {
  EVSU_PERFORMANCE_CRITERIA,
  EVSU_RATING_SCALE,
  getPerformanceInterpretation,
} from './DynamicRubric';

/**
 * Single authentic 1:1 EVSU Ormoc Campus rating sheet component
 */
function SingleRatingSheet({
  employee = {},
  supervisorName = 'Dr. Roberto Santos',
  contractPeriod = 'Jul 01, 2026 – Dec 31, 2026',
  sheet = {},
}) {
  const criteria = EVSU_PERFORMANCE_CRITERIA;
  const currentScores = sheet.scores || {};
  const computedRawSum =
    sheet.rawScore !== null && sheet.rawScore !== undefined
      ? sheet.rawScore
      : criteria.reduce((acc, curr) => acc + (Number(currentScores[curr.id]) || 0), 0);

  const computedScaledScore =
    sheet.scaledScore !== null && sheet.scaledScore !== undefined
      ? sheet.scaledScore
      : Math.round(((computedRawSum / 60) * 100) * 10) / 10;

  const interpretationObj = getPerformanceInterpretation(computedScaledScore);

  const isPeer = sheet.evaluatorRole === 'Peer';
  const displayEvaluatorName = isPeer ? 'Peer Evaluator (Anonymized)' : (sheet.evaluatorName || '—');
  const displayEvaluatorPosition = isPeer ? 'COS Colleague' : (sheet.evaluatorPosition || 'Department Head');
  const sheetStrengths = sheet.strengths || 'Consistent accomplishment of assigned departmental tasks.';
  const sheetRecommendation = sheet.recommendation || 'Recommended for Renewal';
  const sheetDate = sheet.evaluationDate || 'Dec 18, 2026';

  return (
    <div className="official-single-sheet-content">
      {/* Institutional Header */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        {evsuLogo && (
          <img
            src={evsuLogo}
            alt="EVSU Seal"
            style={{
              width: '64px',
              height: '64px',
              objectFit: 'contain',
              marginBottom: '6px',
            }}
          />
        )}
        <div style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
          Republic of the Philippines
        </div>
        <div style={{ fontSize: '15.5px', fontWeight: 'bold', letterSpacing: '0.8px' }}>
          EASTERN VISAYAS STATE UNIVERSITY
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 'bold' }}>
          Ormoc Campus
        </div>
        <div style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '12px' }}>
          Ormoc City
        </div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textDecoration: 'none',
          }}
        >
          EMPLOYEE PERFORMANCE RATING
        </div>
      </div>

      {/* EMPLOYEE INFORMATION Table Box */}
      <div
        style={{
          border: '2px solid #000',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            borderBottom: '1px solid #000',
            padding: '4px 8px',
            fontWeight: 'bold',
            fontSize: '13px',
            textTransform: 'uppercase',
            background: '#f8fafc',
          }}
        >
          EMPLOYEE INFORMATION
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: '50%',
                  padding: '5px 8px',
                  borderRight: '1px solid #000',
                  borderBottom: '1px solid #000',
                }}
              >
                <b>Name:</b> {employee.fullName || '—'}
              </td>
              <td
                style={{
                  width: '50%',
                  padding: '5px 8px',
                  borderBottom: '1px solid #000',
                }}
              >
                <b>Employee Job Title:</b> {employee.jobTitle || 'Admin Aide'}
              </td>
            </tr>
            <tr>
              <td
                colSpan="2"
                style={{
                  padding: '5px 8px',
                  borderBottom: '1px solid #000',
                }}
              >
                <b>Department:</b> {typeof employee?.department === 'object' && employee?.department !== null ? (employee.department.name || '—') : (employee?.department || '—')}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  width: '50%',
                  padding: '5px 8px',
                  borderRight: '1px solid #000',
                }}
              >
                <b>Supervisor:</b> {supervisorName || '—'}
              </td>
              <td style={{ width: '50%', padding: '5px 8px' }}>
                <b>Period:</b> {contractPeriod || '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Performance Criteria Rating Matrix */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '2px solid #000',
          marginBottom: '16px',
          fontSize: '12.5px',
        }}
      >
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #000' }}>
            <th
              style={{
                padding: '6px 8px',
                textAlign: 'left',
                width: '60%',
                borderRight: '1px solid #000',
                fontWeight: 'bold',
              }}
            >
              Rating
            </th>
            {[2, 4, 6, 8, 10].map((val) => (
              <th
                key={val}
                style={{
                  width: '8%',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRight: val === 10 ? 'none' : '1px solid #000',
                  fontWeight: 'bold',
                }}
              >
                {val}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((item) => {
            const itemScore = Number(currentScores[item.id]);
            return (
              <tr
                key={item.id}
                style={{
                  borderBottom: '1px solid #000',
                }}
              >
                <td
                  style={{
                    padding: '8px 8px',
                    borderRight: '1px solid #000',
                    verticalAlign: 'top',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {item.title}–{' '}
                    <span style={{ fontWeight: 'normal' }}>
                      {item.description}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      fontStyle: 'italic',
                      color: '#333',
                    }}
                  >
                    Comments:
                  </div>
                </td>
                {[2, 4, 6, 8, 10].map((val) => (
                  <td
                    key={val}
                    style={{
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      borderRight: val === 10 ? 'none' : '1px solid #000',
                      padding: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '1.5px solid #000',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        background: itemScore === val ? '#f1f5f9' : '#fff',
                      }}
                    >
                      {itemScore === val ? '✓' : ''}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}

          {/* Overall Rating Row */}
          <tr style={{ background: '#f8fafc' }}>
            <td
              style={{
                padding: '8px 8px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
                borderRight: '1px solid #000',
              }}
            >
              Overall rating
            </td>
            <td
              colSpan="5"
              style={{
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  border: '1.5px solid #000',
                  padding: '4px 10px',
                  display: 'inline-block',
                  minWidth: '120px',
                  background: '#fff',
                }}
              >
                {computedScaledScore.toFixed(1)}% ({interpretationObj.interpretation})
              </div>
              <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '2px' }}>
                Raw Score: {computedRawSum} / 60
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* COMMENTS AND RECOMMENDATIONS Section */}
      <div
        style={{
          border: '2px solid #000',
          marginBottom: '16px',
          padding: '10px 12px',
          fontSize: '12.5px',
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '13px',
            marginBottom: '8px',
          }}
        >
          COMMENTS AND RECOMMENDATIONS
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Strengths of the Employee/Areas for Improvement:
          </div>
          <div
            style={{
              minHeight: '44px',
              padding: '4px 6px',
              borderBottom: '1px solid #555',
              fontSize: '12px',
              lineHeight: 1.45,
            }}
          >
            {sheetStrengths}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
            Recommendation:
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              marginLeft: '8px',
            }}
          >
            {[
              'Recommended for Renewal',
              'Recommended with Conditions',
              'Not Recommended for Renewal',
            ].map((recOption) => {
              const isChecked = sheetRecommendation === recOption;
              return (
                <div
                  key={recOption}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '1.5px solid #000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    {isChecked ? '✓' : ''}
                  </div>
                  <span>{recOption}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Official Sign-Off Block */}
      <div
        style={{
          marginTop: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          lineHeight: 1.8,
        }}
      >
        <div style={{ width: '55%' }}>
          <div>
            <b>Rated by:</b>{' '}
            <span
              style={{
                borderBottom: '1px solid #000',
                display: 'inline-block',
                minWidth: '220px',
              }}
            >
              {displayEvaluatorName}
            </span>
          </div>
          <div>
            <b>Position:</b>{' '}
            <span
              style={{
                borderBottom: '1px solid #000',
                display: 'inline-block',
                minWidth: '220px',
              }}
            >
              {displayEvaluatorPosition}
            </span>
          </div>
          <div>
            <b>Date:</b>{' '}
            <span
              style={{
                borderBottom: '1px solid #000',
                display: 'inline-block',
                minWidth: '220px',
              }}
            >
              {sheetDate}
            </span>
          </div>
          <div>
            <b>Signature:</b>{' '}
            <span
              style={{
                borderBottom: '1px solid #000',
                display: 'inline-block',
                minWidth: '220px',
              }}
            >
              {isPeer ? '(Anonymous Peer Submission)' : '_____________________'}
            </span>
          </div>
        </div>

        <div
          style={{
            width: '40%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontStyle: 'italic',
              color: '#444',
              border: '1px dashed #999',
              padding: '8px 12px',
              borderRadius: '4px',
            }}
          >
            Official EVSU-Ormoc Performance Evaluation Instrument · Verified
            Digital Record
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OfficialRatingSheetModal({
  isOpen,
  onClose,
  employee = {},
  supervisorName = 'Dr. Roberto Santos',
  contractPeriod = 'Jul 01, 2026 – Dec 31, 2026',
  sheets = null,
  evaluatorRole = 'Immediate Supervisor',
  evaluatorName = 'Dr. Roberto Santos',
  evaluatorPosition = 'Department Head',
  evaluationDate = 'Dec 18, 2026',
  scores = {},
  strengths = '',
  recommendation = 'Recommended for Renewal',
  rawScore = null,
  scaledScore = null,
}) {
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  // Resolve sheet list: multiple sheets array or legacy single sheet
  const sheetList =
    sheets && sheets.length > 0
      ? sheets
      : [
          {
            pageNumber: 1,
            evaluatorRole,
            evaluatorName,
            evaluatorPosition,
            evaluationDate,
            scores,
            strengths,
            recommendation,
            rawScore,
            scaledScore,
          },
        ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        className="modal-container official-sheet-modal"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          maxWidth: '880px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Top Control Bar (Hidden in Print) */}
        <div
          className="no-print flex-between"
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--line)',
            background: '#f8fafc',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink-900)' }}>
              Official Employee Performance Rating Sheet{sheetList.length > 1 ? ` (${sheetList.length} Pages)` : ''}
            </span>
            <span className="muted" style={{ fontSize: '12px', marginLeft: '10px' }}>
              Eastern Visayas State University – Ormoc Campus
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Printer size={15} />
              <span>Print {sheetList.length > 1 ? `All ${sheetList.length} Pages` : 'Official Form'}</span>
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <X size={15} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div
          className="printable-sheet-wrapper"
          ref={printAreaRef}
          style={{
            overflowY: 'auto',
            padding: '36px 44px',
            background: '#ffffff',
            color: '#000000',
            fontFamily: '"Times New Roman", Times, serif',
            lineHeight: 1.35,
          }}
        >
          {sheetList.map((sheet, index) => (
            <div
              key={sheet.pageNumber || index}
              className="printable-sheet-page"
              style={{
                pageBreakAfter: index < sheetList.length - 1 ? 'always' : 'auto',
                breakAfter: index < sheetList.length - 1 ? 'page' : 'auto',
                marginBottom: index < sheetList.length - 1 ? '40px' : 0,
                paddingBottom: index < sheetList.length - 1 ? '24px' : 0,
                borderBottom: index < sheetList.length - 1 ? '2px dashed #cbd5e1' : 'none',
              }}
            >
              {/* On-screen Page Banner (Hidden in Print) */}
              {sheetList.length > 1 && (
                <div
                  className="no-print"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f1f5f9',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    marginBottom: '18px',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink-900)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} />
                    Page {index + 1} of {sheetList.length}: {sheet.evaluatorRole || 'Evaluator'} Rating Sheet
                    {sheet.weightLabel ? ` (${sheet.weightLabel})` : ''}
                  </span>
                  <span className="badge badge-dept" style={{ fontSize: '11.5px', fontWeight: 700 }}>
                    Adjectival Rating: {getPerformanceInterpretation(sheet.scaledScore || 0).interpretation}
                  </span>
                </div>
              )}

              <SingleRatingSheet
                employee={employee}
                supervisorName={supervisorName}
                contractPeriod={contractPeriod}
                sheet={sheet}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-sheet-wrapper,
          .printable-sheet-wrapper * {
            visibility: visible;
          }
          .printable-sheet-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px 30px !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .printable-sheet-page {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            border-bottom: none !important;
          }
          .printable-sheet-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
          .modal-overlay {
            position: static !important;
            background: none !important;
            padding: 0 !important;
          }
          .official-sheet-modal {
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
