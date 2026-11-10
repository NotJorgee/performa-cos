// Official EVSU Ormoc Campus Standard Evaluation Form Template and Manager
import { api } from '../services/api';

export const DEFAULT_EVSU_CRITERIA = [
  {
    id: 'job_knowledge',
    title: 'Job Knowledge',
    description:
      'Understands duties, responsibilities, has ability to use materials needed, and has the level of proficiency required to accomplish the work.',
  },
  {
    id: 'work_quality',
    title: 'Work Quality',
    description: 'Accuracy, thoroughness, dependability of result.',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    description:
      'Reports to work as scheduled. Follows established procedures for breaks. Notifies supervisor in advance of scheduling changes.',
  },
  {
    id: 'initiative',
    title: 'Initiative',
    description:
      'Ability to be self-directed, efficient, creative and resourceful. Assumes extra work on own initiative, adapts quickly to new responsibilities.',
  },
  {
    id: 'work_attitude',
    title: 'Work Attitude and Cooperation',
    description:
      'Extent to which employee demonstrates a positive attitude and promotes cooperation with supervisors, peers, and others.',
  },
  {
    id: 'dependability',
    title: 'Dependability',
    description:
      'Extent to which employee can be counted on to carry out instructions and fulfill job responsibilities.',
  },
];

export const DEFAULT_RATING_SCALE = [
  {
    rating: 10,
    label: 'Outstanding',
    desc: 'Performance consistently exceeds expectations',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    rating: 8,
    label: 'Very Satisfactory',
    desc: 'Frequently exceeds expectations',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    rating: 6,
    label: 'Satisfactory',
    desc: 'Meets expectations',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    rating: 4,
    label: 'Needs Improvement',
    desc: 'Sometimes fails to meet expectations',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    rating: 2,
    label: 'Unsatisfactory',
    desc: 'Frequently fails to meet expectations',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
  },
];

export const DEFAULT_QUALITATIVE_PROMPTS = [
  {
    id: 'strengths',
    title: 'Major Commendations and Notable Strengths',
    description:
      'Detail specific performance accomplishments, dependability, and positive work attitude displayed during the rating period.',
    required: true,
  },
  {
    id: 'improvements',
    title: 'Areas for Development and Target Objectives',
    description:
      'Provide constructive recommendations or competencies that the employee should develop in the upcoming contract cycle.',
    required: false,
  },
];

export const DEFAULT_RECOMMENDATIONS = [
  {
    value: 'Recommended for Renewal',
    label: 'Recommended for Renewal',
    color: '#16a34a',
  },
  {
    value: 'Recommended with Conditions',
    label: 'Recommended with Conditions',
    color: '#d97706',
  },
  {
    value: 'Not Recommended for Renewal',
    label: 'Not Recommended for Renewal',
    color: '#dc2626',
  },
];

export const DEFAULT_EVSU_TEMPLATE = {
  id: 'evsu-default-template',
  title: 'EVSU Contract of Service (COS) Performance Appraisal Form',
  subtitle: 'Official Performance Rating Instrument for Non-Regular Personnel',
  instructions:
    'Evaluate the contracted personnel based on verifiable work deliverables, daily accomplishment reports, and departmental contributions during the current rating period.',
  version: 'Form Series of 2026',
  lastUpdated: '2026-11-07',
  criteria: DEFAULT_EVSU_CRITERIA,
  ratingScale: DEFAULT_RATING_SCALE,
  qualitativePrompts: DEFAULT_QUALITATIVE_PROMPTS,
  recommendations: DEFAULT_RECOMMENDATIONS,
};

/**
 * Calculates the next version string according to EVSU institutional convention (Convention 1):
 * - Initial format: Form Series of YYYY (e.g. Form Series of 2026)
 * - Mid-year revisions: Form Series of YYYY (Rev. 1), (Rev. 2), etc.
 * - New calendar year: Form Series of <NEW_YEAR>
 */
export function getNextTemplateVersion(currentVersion, currentYear = new Date().getFullYear()) {
  if (!currentVersion || typeof currentVersion !== 'string') {
    return `Form Series of ${currentYear}`;
  }

  const regex = /Form Series of (\d{4})(?:\s*\(Rev\.\s*(\d+)\))?/i;
  const match = currentVersion.match(regex);

  if (match) {
    const year = parseInt(match[1], 10);
    const revNum = match[2] ? parseInt(match[2], 10) : 0;

    if (year === currentYear) {
      return `Form Series of ${year} (Rev. ${revNum + 1})`;
    }
    return `Form Series of ${currentYear}`;
  }

  if (currentVersion.includes('v1.') || currentVersion.includes('Standard')) {
    return `Form Series of ${currentYear}`;
  }

  return `Form Series of ${currentYear} (Rev. 1)`;
}

const STORAGE_KEY = 'performa_evaluation_form_template';

/**
 * Retrieves the currently active evaluation template.
 * Falls back to the official EVSU standard template if not modified or found.
 */
export function getActiveEvaluationTemplate() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return JSON.parse(JSON.stringify(DEFAULT_EVSU_TEMPLATE));
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.criteria) && parsed.criteria.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Unable to read evaluation template from storage:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_EVSU_TEMPLATE));
}

/**
 * Saves and activates a new evaluation form template in local storage.
 * Dispatches a window event so active views update immediately.
 */
export function saveEvaluationTemplate(template) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const updated = {
      ...template,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('performa_template_updated', { detail: updated })
    );
    return true;
  } catch (err) {
    console.error('Failed to save evaluation template:', err);
    return false;
  }
}

/**
 * Restores the evaluation form template back to the standard EVSU default.
 */
export function resetEvaluationTemplateToDefault() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return JSON.parse(JSON.stringify(DEFAULT_EVSU_TEMPLATE));
  }
  try {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_EVSU_TEMPLATE));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    window.dispatchEvent(
      new CustomEvent('performa_template_updated', { detail: fresh })
    );
    return fresh;
  } catch (err) {
    console.error('Failed to reset evaluation template:', err);
    return JSON.parse(JSON.stringify(DEFAULT_EVSU_TEMPLATE));
  }
}

/**
 * Asynchronously loads the active template from the FastAPI backend PostgreSQL database.
 * Syncs the local storage cache and broadcasts the performa_template_updated event.
 */
export async function fetchActiveTemplateFromApi() {
  try {
    const data = await api.evaluationTemplates.getActive();
    if (data && Array.isArray(data.criteria) && data.criteria.length > 0) {
      saveEvaluationTemplate(data);
      return data;
    }
  } catch (err) {
    console.warn('API template load notice (using local template cache):', err.message);
  }
  return getActiveEvaluationTemplate();
}

/**
 * Publishes and activates a new evaluation template on the backend PostgreSQL database.
 */
export async function publishTemplateToApi(template) {
  try {
    const published = await api.evaluationTemplates.publish(template);
    saveEvaluationTemplate(published);
    return published;
  } catch (err) {
    console.error('Failed to publish evaluation template to backend:', err);
    throw err;
  }
}

/**
 * Resets the active template back to the institutional EVSU default on the backend.
 */
export async function resetTemplateOnApi() {
  try {
    const reset = await api.evaluationTemplates.resetToDefault();
    saveEvaluationTemplate(reset);
    return reset;
  } catch (err) {
    console.error('Failed to reset evaluation template on backend:', err);
    throw err;
  }
}
