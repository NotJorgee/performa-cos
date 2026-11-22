import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EVSU_PERFORMANCE_CRITERIA, getPerformanceInterpretation } from '../components/common/DynamicRubric';
import { EVSU_SEAL_BASE64 } from './evsuSealBase64';
import { getDepartmentSupervisor, isGenericSupervisorPlaceholder } from './departments';

/**
 * Distribute a percentage score (0-100) across 6 rubric criteria using valid discrete scale values (2, 4, 6, 8, 10, totaling max 60 pts)
 */
function generateCriteriaScores(scorePercent) {
  const rawScaled = Math.min(60, Math.max(12, Math.round(((Number(scorePercent) || 85) / 100) * 60)));
  const scaled = Math.round(rawScaled / 2) * 2;
  const baseEven = Math.min(10, Math.max(2, Math.floor(scaled / 12) * 2));
  let rem = scaled - baseEven * 6;
  const keys = ['job_knowledge', 'work_quality', 'attendance', 'work_attitude', 'initiative', 'dependability'];
  const res = {};
  keys.forEach((k) => { res[k] = baseEven; });
  for (let i = 0; i < keys.length && rem > 0; i++) {
    if (res[keys[i]] < 10) {
      res[keys[i]] += 2;
      rem -= 2;
    }
  }
  return res;
}

/**
 * Export any existing DOM element (like OfficialRatingSheetModal's printArea) directly to a downloadable PDF
 */
export async function exportElementToPdf(element, filename = 'document.pdf') {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
  } else {
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
  }

  pdf.save(filename);
  return filename;
}

/**
 * Generate and automatically trigger download of an official EVSU Performance Rating PDF
 */
export async function generateEvaluationPdf({
  employee = {},
  cycle = {},
  supervisorName = '',
  qualitativeStrengths = '',
  qualitativeRecommendations = '',
}) {
  const resolvedSupervisor =
    supervisorName && !isGenericSupervisorPlaceholder(supervisorName)
      ? supervisorName
      : getDepartmentSupervisor(employee?.department);

  const scoreVal = Number(cycle.supervisorScore ?? cycle.finalGrade ?? employee?.latestScore ?? 85);
  const rawSum =
    cycle.rawScore !== undefined && cycle.rawScore !== null
      ? Number(cycle.rawScore)
      : Math.round((scoreVal / 100) * 60);
  const scaledScore = Number(cycle.scaledScore ?? scoreVal);
  const interpretation =
    cycle.interpretation || getPerformanceInterpretation(scaledScore)?.interpretation || 'Satisfactory';

  const defaultScores = generateCriteriaScores(scoreVal);
  const scores = cycle.dimensionScores || defaultScores;

  const strengths =
    cycle.strengths ||
    qualitativeStrengths ||
    'Consistently fulfilled assigned duties with dependable quality and reliable university service.';
  const recommendation =
    cycle.recommendation ||
    qualitativeRecommendations ||
    'Recommended for Renewal';

  const periodLabel = cycle.periodDates || employee?.contractPeriod || 'Contract Evaluation Cycle';
  const cleanPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const safeEmpId = employee.idNumber || employee.fullName || 'Personnel';
  const filename = `EVSU_COS_Evaluation_${safeEmpId}_${cleanPeriod}.pdf`;

  const deptName =
    typeof employee.department === 'object' && employee.department !== null
      ? employee.department.name || '—'
      : employee.department || '—';

  // Construct printable DOM node
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.padding = '32px 38px';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = '"Times New Roman", Times, serif';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.35';

  container.innerHTML = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 14px;">
      <img src="${EVSU_SEAL_BASE64}" alt="EVSU Seal" style="width: 58px; height: 58px; object-fit: contain; margin-bottom: 4px;" />
      <div style="font-size: 11.5px; letter-spacing: 0.5px;">Republic of the Philippines</div>
      <div style="font-size: 14px; font-weight: bold; letter-spacing: 0.8px;">EASTERN VISAYAS STATE UNIVERSITY</div>
      <div style="font-size: 12.5px; font-weight: bold;">Ormoc Campus</div>
      <div style="font-size: 11px; font-style: italic; margin-bottom: 8px;">Ormoc City</div>
      <div style="font-size: 13.5px; font-weight: bold; letter-spacing: 1px;">EMPLOYEE PERFORMANCE RATING</div>
    </div>

    <!-- Employee Information -->
    <div style="border: 2px solid #000; margin-bottom: 12px;">
      <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11.5px; text-transform: uppercase; background: #f8fafc;">
        EMPLOYEE INFORMATION
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tbody>
          <tr>
            <td style="width: 50%; padding: 5px 8px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
              <b>Name:</b> ${employee.fullName || '—'}
            </td>
            <td style="width: 50%; padding: 5px 8px; border-bottom: 1px solid #000;">
              <b>Employee Job Title:</b> ${employee.jobTitle || 'Admin Aide'}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 5px 8px; border-bottom: 1px solid #000;">
              <b>Department:</b> ${deptName}
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 5px 8px; border-right: 1px solid #000;">
              <b>Supervisor:</b> ${supervisorName}
            </td>
            <td style="width: 50%; padding: 5px 8px;">
              <b>Period:</b> ${periodLabel}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Performance Criteria Table -->
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-bottom: 12px; font-size: 11.5px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #000;">
          <th style="padding: 5px 8px; text-align: left; width: 60%; border-right: 1px solid #000; font-weight: bold;">
            Rating
          </th>
          <th style="width: 8%; text-align: center; padding: 5px 4px; border-right: 1px solid #000; font-weight: bold;">2</th>
          <th style="width: 8%; text-align: center; padding: 5px 4px; border-right: 1px solid #000; font-weight: bold;">4</th>
          <th style="width: 8%; text-align: center; padding: 5px 4px; border-right: 1px solid #000; font-weight: bold;">6</th>
          <th style="width: 8%; text-align: center; padding: 5px 4px; border-right: 1px solid #000; font-weight: bold;">8</th>
          <th style="width: 8%; text-align: center; padding: 5px 4px; font-weight: bold;">10</th>
        </tr>
      </thead>
      <tbody>
        ${EVSU_PERFORMANCE_CRITERIA.map((item) => {
          const itemScore = Number(scores[item.id]) || 0;
          return `
            <tr style="border-bottom: 1px solid #000;">
              <td style="padding: 6px 8px; border-right: 1px solid #000; vertical-align: top;">
                <div style="font-weight: bold;">${item.title} – <span style="font-weight: normal;">${item.description}</span></div>
              </td>
              ${[2, 4, 6, 8, 10]
                .map(
                  (val) => `
                <td style="text-align: center; vertical-align: middle; border-right: ${val === 10 ? 'none' : '1px solid #000'}; padding: 4px;">
                  <div style="width: 18px; height: 18px; border: 1.5px solid #000; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; background: ${itemScore === val ? '#f1f5f9' : '#fff'};">
                    ${itemScore === val ? '✓' : ''}
                  </div>
                </td>
              `
                )
                .join('')}
            </tr>
          `;
        }).join('')}
        <tr style="background: #f8fafc;">
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; font-size: 12px; border-right: 1px solid #000;">
            Overall rating
          </td>
          <td colspan="5" style="padding: 6px; text-align: center; font-weight: bold; font-size: 12px;">
            <div style="border: 1.5px solid #000; padding: 3px 10px; display: inline-block; min-width: 120px; background: #fff;">
              ${scaledScore.toFixed(1)}% (${interpretation})
            </div>
            <div style="font-size: 10.5px; font-weight: normal; margin-top: 2px;">
              Raw Score: ${rawSum} / 60
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Comments and Recommendations -->
    <div style="border: 2px solid #000; margin-bottom: 14px; padding: 8px 10px; font-size: 11.5px;">
      <div style="font-weight: bold; font-size: 12px; margin-bottom: 6px;">COMMENTS AND RECOMMENDATIONS</div>
      <div style="margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 3px;">Strengths of the Employee/Areas for Improvement:</div>
        <div style="min-height: 28px; padding: 2px 4px; border-bottom: 1px solid #555; font-size: 11.5px; line-height: 1.4;">
          ${strengths}
        </div>
      </div>
      <div>
        <div style="font-weight: bold; margin-bottom: 4px;">Recommendation:</div>
        <div style="display: flex; flex-direction: column; gap: 4px; margin-left: 6px;">
          ${['Recommended for Renewal', 'Recommended with Conditions', 'Not Recommended for Renewal']
            .map((recOption) => {
              const isChecked = recommendation === recOption;
              return `
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 14px; height: 14px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px;">
                  ${isChecked ? '✓' : ''}
                </div>
                <span>${recOption}</span>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    </div>

    <!-- Sign-Off Block -->
    <div style="font-size: 11.5px; line-height: 1.7;">
      <div style="width: 100%;">
        <div><b>Rated by:</b> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 220px;">${resolvedSupervisor}</span></div>
        <div><b>Position:</b> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 220px;">Immediate Supervisor (Dept Head)</span></div>
        <div><b>Date:</b> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 220px;">${cycle.evaluationDate || 'Dec 18, 2026'}</span></div>
        <div><b>Signature:</b> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 220px;">&nbsp;</span></div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(filename);
    return filename;
  } finally {
    document.body.removeChild(container);
  }
}
