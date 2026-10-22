/**
 * Extracts the user's full first name(s), supporting individuals with multiple first names
 * (e.g., 'Jorge Mikhael Gubantes' -> 'Jorge Mikhael', 'Dr. Maria Clara Ramos' -> 'Maria Clara').
 */
export function getFullFirstName(fullName = '') {
  if (!fullName) return '';
  // Clean honorific prefixes (Dr., Engr., Prof., Mr., Ms., Mrs.)
  const clean = fullName.replace(/^(Dr\.|Engr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || fullName;

  // Account for optional suffixes (Jr., Sr., III, etc.)
  let lastNameIdx = parts.length - 1;
  if (/^(Jr\.?|Sr\.?|II|III|IV|V)$/i.test(parts[lastNameIdx]) && parts.length > 2) {
    lastNameIdx = parts.length - 2;
  }

  // Handle common Filipino / Spanish compound surnames: Del, Dela, De, San, Santa
  if (lastNameIdx > 1 && /^(Del|Dela|De|San|Santa)$/i.test(parts[lastNameIdx - 1])) {
    lastNameIdx = lastNameIdx - 1;
  }

  // Extract all parts before the last name
  let firstParts = parts.slice(0, lastNameIdx);

  // If the last token before surname is a single letter (middle initial like 'R.' or 'M.'), strip it from first name
  if (firstParts.length > 1 && /^[A-Z]\.?$/i.test(firstParts[firstParts.length - 1])) {
    firstParts = firstParts.slice(0, -1);
  }

  return firstParts.join(' ') || parts[0];
}
