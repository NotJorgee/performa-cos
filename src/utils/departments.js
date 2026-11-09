/**
 * Official Eastern Visayas State University (EVSU) - Ormoc Campus
 * Departments & Administrative Offices Taxonomy
 * 
 * EVSU Ormoc operates without an intermediate college tier.
 * Institutional units are organized into four functional domains:
 * 1. Academic Departments
 * 2. Administrative & Fiscal Services
 * 3. Student Support & Services
 * 4. Extension & Operations
 */

export const EVSU_DEPARTMENTS = [
  'Administrative and Finance',
  'Campus Director Office',
  'Computer Studies Department',
  'Disbursing / Cashier Office',
  'Education Department',
  'Engineering Department',
  'Extension Service Office',
  'Guidance Office',
  'Hospitality & Tourism Management',
  'HRMDO Office',
  'IGP Office',
  'IPDO Office',
  'Library Office',
  'Maintenance/Janitorial (MESO) Office',
  'Procurement Office',
  'Quality Assurance & Accreditation Office',
  'Registrar Office',
  'Research Office',
  'SASO Office',
  'School Clinic',
  'Sports And Development Office',
  'Technology Department',
];

export const EVSU_DEPARTMENT_DOMAINS = {
  academic: {
    key: 'academic',
    name: 'Academic Departments',
    shortName: 'Academic',
    description: 'Degree-granting teaching units and instructional faculties.',
    style: {
      bg: '#eff6ff',
      text: '#1d4ed8',
      border: '#bfdbfe',
    },
    departments: [
      'Computer Studies Department',
      'Education Department',
      'Engineering Department',
      'Hospitality & Tourism Management',
      'Technology Department',
    ],
  },
  administrative: {
    key: 'administrative',
    name: 'Administrative & Fiscal Services',
    shortName: 'Administrative',
    description: 'Executive leadership, human resources, procurement, and fiscal offices.',
    style: {
      bg: '#fdf2f8',
      text: '#9d174d',
      border: '#fbcfe8',
    },
    departments: [
      'Administrative and Finance',
      'Campus Director Office',
      'Disbursing / Cashier Office',
      'HRMDO Office',
      'Procurement Office',
    ],
  },
  student_services: {
    key: 'student_services',
    name: 'Student Support & Services',
    shortName: 'Student Services',
    description: 'Student affairs, admissions, health clinic, library, and guidance.',
    style: {
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#bbf7d0',
    },
    departments: [
      'Guidance Office',
      'Library Office',
      'Registrar Office',
      'SASO Office',
      'School Clinic',
    ],
  },
  extension_operations: {
    key: 'extension_operations',
    name: 'Extension & Operations',
    shortName: 'Extension & Operations',
    description: 'Community extension, research, accreditation, facilities, and campus operations.',
    style: {
      bg: '#faf5ff',
      text: '#6b21a8',
      border: '#e9d5ff',
    },
    departments: [
      'Extension Service Office',
      'IGP Office',
      'IPDO Office',
      'Maintenance/Janitorial (MESO) Office',
      'Quality Assurance & Accreditation Office',
      'Research Office',
      'Sports And Development Office',
    ],
  },
};

// Backward-compatible alias for research_operations
EVSU_DEPARTMENT_DOMAINS.research_operations = EVSU_DEPARTMENT_DOMAINS.extension_operations;

export const EVSU_DEPARTMENT_GROUPS = [
  EVSU_DEPARTMENT_DOMAINS.academic,
  EVSU_DEPARTMENT_DOMAINS.administrative,
  EVSU_DEPARTMENT_DOMAINS.student_services,
  EVSU_DEPARTMENT_DOMAINS.extension_operations,
];

// Department-to-Domain reverse lookup map
const DEPARTMENT_TO_DOMAIN_MAP = {};
EVSU_DEPARTMENT_GROUPS.forEach((domain) => {
  domain.departments.forEach((dept) => {
    DEPARTMENT_TO_DOMAIN_MAP[dept.toLowerCase()] = domain;
  });
});

/**
 * Returns domain details for a department name or explicit domain key.
 * @param {string} deptName
 * @param {string|null} explicitDomain
 * @returns {object} domain configuration object
 */
export function getDepartmentDomain(deptName, explicitDomain = null) {
  // If an explicit domain key or name is provided (e.g., from database), use it
  if (explicitDomain && typeof explicitDomain === 'string') {
    const norm = explicitDomain.trim().toLowerCase();
    if (EVSU_DEPARTMENT_DOMAINS[norm]) {
      return EVSU_DEPARTMENT_DOMAINS[norm];
    }
    const matchByGroup = EVSU_DEPARTMENT_GROUPS.find(
      (g) => g.name.toLowerCase() === norm || g.shortName.toLowerCase() === norm || g.key === norm
    );
    if (matchByGroup) return matchByGroup;
  }

  if (!deptName || typeof deptName !== 'string') {
    return {
      key: 'general',
      name: 'General Unit',
      shortName: 'General',
      style: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    };
  }

  const found = DEPARTMENT_TO_DOMAIN_MAP[deptName.trim().toLowerCase()];
  if (found) return found;

  // Fuzzy matches if string varies slightly
  const lower = deptName.toLowerCase();
  if (
    lower.includes('computer') ||
    lower.includes('education') ||
    lower.includes('engineering') ||
    lower.includes('hospitality') ||
    lower.includes('technology')
  ) {
    return EVSU_DEPARTMENT_DOMAINS.academic;
  }
  if (
    lower.includes('finance') ||
    lower.includes('director') ||
    lower.includes('cashier') ||
    lower.includes('hrmdo') ||
    lower.includes('procurement')
  ) {
    return EVSU_DEPARTMENT_DOMAINS.administrative;
  }
  if (
    lower.includes('guidance') ||
    lower.includes('library') ||
    lower.includes('registrar') ||
    lower.includes('saso') ||
    lower.includes('clinic')
  ) {
    return EVSU_DEPARTMENT_DOMAINS.student_services;
  }
  if (
    lower.includes('research') ||
    lower.includes('extension') ||
    lower.includes('ipdo') ||
    lower.includes('meso') ||
    lower.includes('maintenance') ||
    lower.includes('quality') ||
    lower.includes('igp') ||
    lower.includes('sports')
  ) {
    return EVSU_DEPARTMENT_DOMAINS.extension_operations;
  }

  return {
    key: 'general',
    name: 'Institutional Unit',
    shortName: 'Institutional',
    style: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  };
}

export default EVSU_DEPARTMENTS;
