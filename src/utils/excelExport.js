import * as XLSX from 'xlsx';

/**
 * Exports tabular data as a true Microsoft Excel (.xlsx) workbook with auto-fitted column widths.
 *
 * @param {Object} options
 * @param {string} options.filename - The output filename (e.g., 'EVSU_Executive_Personnel_Records.xlsx')
 * @param {string} [options.sheetName='Sheet1'] - Name of the worksheet tab
 * @param {Array<string>} options.headers - Array of header strings
 * @param {Array<Array<any>>} options.rows - 2D array of row cell values
 * @param {Array<number>} [options.customColWidths] - Optional manual character widths per column
 */
export function exportToExcel({
  filename,
  sheetName = 'Personnel Records',
  headers = [],
  rows = [],
  customColWidths = null,
}) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Compute column widths so Excel automatically fits the text
  if (customColWidths && Array.isArray(customColWidths)) {
    ws['!cols'] = customColWidths.map((w) => ({ wch: w }));
  } else {
    const colCount = headers.length;
    const computedWidths = [];

    for (let c = 0; c < colCount; c++) {
      let maxLen = headers[c] ? String(headers[c]).length : 10;
      for (let r = 0; r < rows.length; r++) {
        const cell = rows[r] ? rows[r][c] : '';
        const len = cell !== undefined && cell !== null ? String(cell).length : 0;
        if (len > maxLen) {
          maxLen = len;
        }
      }
      // Add comfortable padding (at least 3-4 chars) so nothing is clipped
      computedWidths.push({ wch: Math.max(maxLen + 4, 12) });
    }
    ws['!cols'] = computedWidths;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
}
