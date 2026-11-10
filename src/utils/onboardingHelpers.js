/**
 * Shared onboarding helpers for tokenized sign-up and manual account provisioning.
 * Kept aligned with backend institutional rules in backend/app/auth.py.
 */

export const UNIVERSITY_TITLES = [
  'None',
  'Engr.',
  'Dr.',
  'Prof.',
  'Assoc. Prof.',
  'Asst. Prof.',
  'Instr.',
  'Atty.',
  'Arch.',
];

export const getTodayIsoDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function formatFullLegalName({
  titlePrefix = 'None',
  firstName = '',
  middleInitial = '',
  lastName = '',
}) {
  const prefix = titlePrefix && titlePrefix !== 'None' ? `${titlePrefix.trim()} ` : '';
  const cleanFirst = (firstName || '').trim();
  const cleanMiddle = (middleInitial || '').trim().replace(/\.$/, '');
  const middlePart = cleanMiddle ? `${cleanMiddle}. ` : '';
  const cleanLast = (lastName || '').trim();
  return `${prefix}${cleanFirst} ${middlePart}${cleanLast}`.replace(/\s+/g, ' ').trim();
}

export function evaluatePasswordComplexity(password = '') {
  const value = password || '';
  const hasMinLength = value.length >= 8;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  return {
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isValid: hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial,
  };
}

export function calculateSixMonthContractEnd(startDateStr) {
  if (!startDateStr || typeof startDateStr !== 'string') return '';
  const parts = startDateStr.split('-').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return '';
  const [y, m, d] = parts;
  const targetZeroMonth = m - 1 + 6;
  const targetYear = y + Math.floor(targetZeroMonth / 12);
  const targetMonthIndex = ((targetZeroMonth % 12) + 12) % 12;
  const maxDay = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  const endDate = new Date(targetYear, targetMonthIndex, Math.min(d, maxDay));
  endDate.setDate(endDate.getDate() - 1);
  const yy = endDate.getFullYear();
  const mm = String(endDate.getMonth() + 1).padStart(2, '0');
  const dd = String(endDate.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function formatReadableDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const parts = isoDate.split('-').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generateTemporaryPassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@!#$%&*';
  const all = upper + lower + digits + special;

  const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < length) {
    chars.push(pick(all));
  }
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
