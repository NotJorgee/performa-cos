import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EVSU_SEAL_BASE64 } from './evsuSealBase64';
import { getDepartmentSupervisor } from './departments';

/**
 * Generate and automatically trigger download of an official EVSU Daily Accomplishment Report (DAR) PDF
 * Pictures are intentionally excluded from the printable PDF per university requirements.
 */
export async function generateDarPdf({
  employee = {},
  employeeName = '',
  employeeIdNumber = '',
  department = '',
  cutoffLabel = '',
  records = [],
  supervisorName = '',
}) {
  const empName = employeeName || employee?.fullName || 'COS Personnel';
  const empId = employeeIdNumber || employee?.idNumber || employee?.id || '—';
  const deptName =
    typeof department === 'object' && department !== null
      ? department.name || '—'
      : department || employee?.department || '—';
  const period = cutoffLabel || 'Accumulated DAR Logs';

  const resolvedSupervisor =
    supervisorName &&
    supervisorName !== 'Immediate Supervisor (Dept Head)' &&
    supervisorName !== 'Immediate Supervisor'
      ? supervisorName
      : getDepartmentSupervisor(department || employee?.department);

  const cleanPeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const safeEmp = (employee?.idNumber || employeeIdNumber || empName).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `EVSU_COS_DAR_${safeEmp}_${cleanPeriod}.pdf`;

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
      <div style="font-size: 13.5px; font-weight: bold; letter-spacing: 1px;">INDIVIDUAL DAILY ACCOMPLISHMENT REPORT (DAR)</div>
    </div>

    <!-- Personnel & Coverage Information -->
    <div style="border: 2px solid #000; margin-bottom: 14px;">
      <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11.5px; text-transform: uppercase; background: #f8fafc;">
        PERSONNEL &amp; COVERAGE INFORMATION
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tbody>
          <tr>
            <td style="width: 50%; padding: 5px 8px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
              <b>Personnel Name:</b> ${empName}
            </td>
            <td style="width: 50%; padding: 5px 8px; border-bottom: 1px solid #000;">
              <b>ID Number:</b> ${empId}
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 5px 8px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
              <b>Department:</b> ${deptName}
            </td>
            <td style="width: 50%; padding: 5px 8px; border-bottom: 1px solid #000;">
              <b>Status:</b> Contract of Service (COS)
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 5px 8px;">
              <b>Coverage Period:</b> ${period}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- DAR Accomplishments Table (Photos excluded from PDF per user requirements) -->
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-bottom: 16px; font-size: 11px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #000;">
          <th style="padding: 6px 8px; text-align: left; width: 17%; border-right: 1px solid #000; font-weight: bold;">Date &amp; Time</th>
          <th style="padding: 6px 8px; text-align: left; width: 23%; border-right: 1px solid #000; font-weight: bold;">Job Description / Task</th>
          <th style="padding: 6px 8px; text-align: left; width: 35%; border-right: 1px solid #000; font-weight: bold;">Specific Work Accomplished</th>
          <th style="padding: 6px 8px; text-align: center; width: 10%; border-right: 1px solid #000; font-weight: bold;">Quantity</th>
          <th style="padding: 6px 8px; text-align: left; width: 15%; font-weight: bold;">Verification &amp; Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${
          records.length > 0
            ? records
                .map((row) => {
                  const dateParts = String(row.dateSubmitted || '').split(',');
                  const mainDate = dateParts[0] || '—';
                  const timePart = dateParts.slice(1).join(',').trim();

                  return `
            <tr style="border-bottom: 1px solid #000;">
              <td style="padding: 6px 8px; border-right: 1px solid #000; vertical-align: top; white-space: nowrap;">
                <b>${mainDate}</b>
                ${timePart ? `<div style="font-size: 10px; color: #444; margin-top: 2px;">${timePart}</div>` : ''}
              </td>
              <td style="padding: 6px 8px; border-right: 1px solid #000; vertical-align: top;">
                <b>${row.jobDescription || '—'}</b>
              </td>
              <td style="padding: 6px 8px; border-right: 1px solid #000; vertical-align: top; line-height: 1.35;">
                ${row.workAccomplished || '—'}
              </td>
              <td style="padding: 6px 8px; border-right: 1px solid #000; vertical-align: top; text-align: center;">
                ${row.quantity || '1 task'}
              </td>
              <td style="padding: 6px 8px; vertical-align: top; font-size: 10.5px; line-height: 1.3;">
                ${row.remarks || '—'}
              </td>
            </tr>
          `;
                })
                .join('')
            : `
            <tr>
              <td colspan="5" style="padding: 24px; text-align: center; font-style: italic; color: #555;">
                No daily accomplishment records logged for this period.
              </td>
            </tr>
          `
        }
        <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #000;">
          <td colspan="3" style="padding: 6px 8px; border-right: 1px solid #000;">
            Total Verified Tasks Logged:
          </td>
          <td colspan="2" style="padding: 6px 8px; text-align: right;">
            ${records.length} Accomplishment Record(s)
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Official Sign-Off Signatures -->
    <div style="display: flex; justify-content: space-between; margin-top: 28px; font-size: 11px; line-height: 1.6;">
      <div style="width: 31%; text-align: center;">
        <div style="font-weight: bold; margin-bottom: 38px;">Prepared By:</div>
        <div style="border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 11.5px; white-space: nowrap;">
          ${empName.toUpperCase()}
        </div>
        <div style="font-size: 10px; color: #333;">COS Employee / Personnel</div>
      </div>

      <div style="width: 31%; text-align: center;">
        <div style="font-weight: bold; margin-bottom: 38px;">Noted &amp; Verified By:</div>
        <div style="border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 11.5px; white-space: nowrap;">
          ${resolvedSupervisor.toUpperCase()}
        </div>
        <div style="font-size: 10px; color: #333;">Immediate Supervisor (Dept Head)</div>
      </div>

      <div style="width: 31%; text-align: center;">
        <div style="font-weight: bold; margin-bottom: 38px;">Approved &amp; Audited:</div>
        <div style="border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 11.5px; white-space: nowrap;">
          HRMDO IN-CHARGE
        </div>
        <div style="font-size: 10px; color: #333;">Human Resource Management Office</div>
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
