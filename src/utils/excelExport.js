import * as XLSX from 'xlsx';

/**
 * Exports tabular data as a true Microsoft Excel (.xlsx) workbook with auto-fitted column widths.
 *
 * @param {Object} options
 * @param {string} options.filename - The output filename (e.g., 'EVSU_Executive_Personnel_Records.xlsx')
 * @param {string} [options.sheetName='Sheet1'] - Name of the worksheet tab
 * @param {Array<string>} [options.headers=[]] - Array of header strings (optional if rows already contain headers)
 * @param {Array<Array<any>>} [options.rows=[]] - 2D array of row cell values
 * @param {Array<number>} [options.customColWidths] - Optional manual character widths per column
 */
export function exportToExcel({
  filename,
  sheetName = 'Data Export',
  headers = [],
  rows = [],
  titleRows = [],
  customColWidths = null,
}) {
  const data = [];
  if (titleRows && Array.isArray(titleRows) && titleRows.length > 0) {
    data.push(...titleRows);
  }
  if (headers && Array.isArray(headers) && headers.length > 0) {
    data.push(headers);
  }
  if (rows && Array.isArray(rows) && rows.length > 0) {
    data.push(...rows);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Compute column widths so Excel automatically fits the text
  if (customColWidths && Array.isArray(customColWidths)) {
    ws['!cols'] = customColWidths.map((w) => ({ wch: w }));
  } else {
    let colCount = (headers && headers.length) || 0;
    for (let r = 0; r < data.length; r++) {
      if (data[r] && data[r].length > colCount) {
        colCount = data[r].length;
      }
    }

    const computedWidths = [];
    for (let c = 0; c < colCount; c++) {
      let maxLen = 10;
      for (let r = 0; r < data.length; r++) {
        // Skip banner title rows (single-cell rows in multi-column tables) so they do not inflate column width
        if (colCount > 1 && data[r] && data[r].length <= 1) {
          continue;
        }
        const cell = data[r] ? data[r][c] : '';
        const len = cell !== undefined && cell !== null ? String(cell).length : 0;
        if (len > maxLen && len < 80) {
          maxLen = len;
        }
      }
      computedWidths.push({ wch: Math.max(maxLen + 4, 12) });
    }
    ws['!cols'] = computedWidths;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
}
