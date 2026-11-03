/**
 * Dynamically generates a unique EVSU Employee ID formatted as:
 * Last Name Initial + MMDDYYYY of the campus starting date + First Name Initial(s) + Middle Name Initial
 * Example: 'G10222026JMR' (Gubantes, Oct 22 2026, Jorge Mikhael, R.)
 *
 * Missing / Unentered parts fallback to 'X' (e.g., 'X11032026X', 'G11032026X').
 *
 * Collision handling:
 * - The original user receives no numeric suffix (e.g., 'G10222026JMR')
 * - Any subsequent users with the exact same resulting string receive an incremental suffix (e.g., '-1', '-2')
 */
export function generateEvsuEmployeeId(arg1 = '', arg2 = new Date(), arg3 = []) {
  let firstName = '';
  let middleInitial = '';
  let lastName = '';
  let startingDate = new Date();
  let existingIds = [];

  // Support structured object: { firstName, middleInitial, lastName, startingDate, existingIds }
  if (typeof arg1 === 'object' && arg1 !== null && !(arg1 instanceof Date)) {
    firstName = arg1.firstName || '';
    middleInitial = arg1.middleInitial || '';
    lastName = arg1.lastName || '';
    startingDate = arg1.startingDate || new Date();
    existingIds = arg1.existingIds || [];
  } else {
    // Legacy signature: (fullName, contractStartDate, existingIds)
    const fullName = typeof arg1 === 'string' ? arg1 : '';
    startingDate = arg2 || new Date();
    existingIds = arg3 || [];

    const clean = fullName.replace(/^(Dr\.|Engr\.|Prof\.|Mr\.|Ms\.|Mrs\.|Atty\.|Arch\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean).map(p => p.replace(/[.,]/g, '')).filter(Boolean);

    if (parts.length === 1) {
      firstName = parts[0];
      lastName = parts[0];
    } else if (parts.length > 1) {
      let lastIdx = parts.length - 1;
      if (/^(JR|SR|II|III|IV|V)$/i.test(parts[lastIdx]) && parts.length > 2) {
        lastIdx = parts.length - 2;
      }
      lastName = parts[lastIdx];
      const givenParts = parts.filter((_, i) => i !== lastIdx);
      if (givenParts.length > 1 && givenParts[givenParts.length - 1].length === 1) {
        middleInitial = givenParts[givenParts.length - 1];
        firstName = givenParts.slice(0, -1).join(' ');
      } else {
        firstName = givenParts.join(' ');
      }
    }
  }

  // 1. Format date to MMDDYYYY
  let d;
  if (typeof startingDate === 'string') {
    const parts = startingDate.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(startingDate);
      if (isNaN(d.getTime())) d = new Date();
    }
  } else if (startingDate instanceof Date) {
    d = startingDate;
  } else {
    d = new Date();
  }

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const dateStr = `${mm}${dd}${yyyy}`;

  // 2. Parse initials with 'X' fallback placeholder
  const cleanLast = (lastName || '').trim().replace(/[.,]/g, '');
  const cleanFirst = (firstName || '').trim().replace(/[.,]/g, '');
  const cleanMiddle = (middleInitial || '').trim().replace(/[.,]/g, '');

  const lastInit = cleanLast ? cleanLast[0].toUpperCase() : 'X';
  const firstInits = cleanFirst
    ? cleanFirst.split(/\s+/).map(w => w[0]?.toUpperCase()).filter(Boolean).join('')
    : 'X';
  const middleInit = cleanMiddle ? cleanMiddle[0].toUpperCase() : '';

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
