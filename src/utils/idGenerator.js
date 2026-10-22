/**
 * Dynamically generates a unique EVSU Employee ID formatted as:
 * Last Name Initial + MMDDYYYY of the contract start date + First Name Initial(s) + Middle Name Initial
 * Example: 'G10222026JMR' (Gubantes, Oct 22 2026, Jorge Mikhael, R.)
 *
 * Collision handling:
 * - The original user receives no numeric suffix (e.g., 'G10222026JMR')
 * - Any subsequent users with the exact same resulting string receive an incremental suffix (e.g., '-1', '-2')
 */
export function generateEvsuEmployeeId(
  fullName = '',
  contractStartDate = new Date(),
  existingIds = []
) {
  // 1. Format date to MMDDYYYY
  let d;
  if (typeof contractStartDate === 'string') {
    const parts = contractStartDate.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(contractStartDate);
      if (isNaN(d.getTime())) d = new Date();
    }
  } else if (contractStartDate instanceof Date) {
    d = contractStartDate;
  } else {
    d = new Date();
  }

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const dateStr = `${mm}${dd}${yyyy}`;

  // 2. Parse initials
  const clean = (fullName || '').replace(/^(Dr\.|Engr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const rawParts = clean.split(/\s+/).filter(Boolean);
  const parts = rawParts.map(p => p.replace(/[.,]/g, '')).filter(Boolean);

  let lastInit = 'E';
  let firstInits = 'X';
  let middleInit = '';

  if (parts.length === 0) {
    lastInit = 'E';
    firstInits = 'X';
  } else if (parts.length === 1) {
    lastInit = parts[0][0]?.toUpperCase() || 'E';
    firstInits = parts[0][0]?.toUpperCase() || 'X';
  } else {
    let lastIdx = parts.length - 1;
    if (/^(JR|SR|II|III|IV|V)$/i.test(parts[lastIdx]) && parts.length > 2) {
      lastIdx = parts.length - 2;
    }
    lastInit = parts[lastIdx][0]?.toUpperCase() || 'E';

    const givenParts = parts.filter((_, i) => i !== lastIdx);
    if (givenParts.length > 1 && givenParts[givenParts.length - 1].length === 1) {
      middleInit = givenParts[givenParts.length - 1].toUpperCase();
      firstInits = givenParts.slice(0, -1).map(w => w[0]?.toUpperCase()).join('');
    } else {
      firstInits = givenParts.map(w => w[0]?.toUpperCase()).join('');
    }
  }

  const baseId = `${lastInit}${dateStr}${firstInits}${middleInit}`;

  // 3. Collision resolution: original has no suffix; subsequent get '-1', '-2', etc.
  const existingSet = new Set(
    (existingIds || []).map(id => (typeof id === 'string' ? id.trim() : ''))
  );

  if (!existingSet.has(baseId)) {
    return baseId;
  }

  let suffix = 1;
  while (existingSet.has(`${baseId}-${suffix}`)) {
    suffix++;
  }
  return `${baseId}-${suffix}`;
}
