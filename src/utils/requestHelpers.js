/**
 * Shared helpers for normalizing COS attendance/time/leave request statuses
 * and separating requests into Pending, In Progress, Upcoming, and Past buckets.
 */

export function getTodayPhtIso() {
  const phtMs = Date.now() + 8 * 60 * 60 * 1000;
  return new Date(phtMs).toISOString().slice(0, 10);
}

export function formatRequestStatus(status) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Approved', badgeClass: 'badge-completed' };
    case 'REJECTED':
      return { label: 'Disapproved', badgeClass: 'badge-reject' };
    case 'CANCELLED':
      return { label: 'Cancelled', badgeClass: 'badge-inactive' };
    default:
      return { label: 'Pending Review', badgeClass: 'badge-pending' };
  }
}

export const REQUEST_BUCKET_ORDER = ['pending', 'in_progress', 'upcoming', 'past'];

export const REQUEST_BUCKET_META = {
  pending: {
    key: 'pending',
    label: 'Pending Review',
    sectionTitle: 'Pending Supervisory Review',
    bg: '#fef3c7',
    text: '#b45309',
    border: '#fde68a',
  },
  in_progress: {
    key: 'in_progress',
    label: 'In Progress',
    sectionTitle: 'Currently In Progress',
    bg: '#dcfce7',
    text: '#15803d',
    border: '#86efac',
  },
  upcoming: {
    key: 'upcoming',
    label: 'Upcoming',
    sectionTitle: 'Upcoming Approved Schedules',
    bg: '#e0e7ff',
    text: '#4338ca',
    border: '#c7d2fe',
  },
  past: {
    key: 'past',
    label: 'Past Records',
    sectionTitle: 'Past & Concluded Records',
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
  },
};

export function classifyRequestBucket(req, todayIso = getTodayPhtIso()) {
  const start = String(req?.start_date || '').slice(0, 10);
  const end = String(req?.end_date || start || '').slice(0, 10);
  const status = req?.status;

  if (status === 'APPROVED') {
    if (start && end && start <= todayIso && todayIso <= end) return 'in_progress';
    if (start && start > todayIso) return 'upcoming';
    return 'past';
  }
  if (status === 'PENDING_DEPT_HEAD') {
    if (!end || end >= todayIso) return 'pending';
    return 'past';
  }
  return 'past';
}

export function partitionRequestsByTimeline(items = [], todayIso = getTodayPhtIso()) {
  const grouped = {
    pending: [],
    in_progress: [],
    upcoming: [],
    past: [],
  };

  (items || []).forEach((item) => {
    const bucket = classifyRequestBucket(item, todayIso);
    grouped[bucket].push({ ...item, _timelineBucket: bucket });
  });

  grouped.pending.sort((a, b) => String(a.start_date || '').localeCompare(String(b.start_date || '')));
  grouped.in_progress.sort((a, b) => String(a.start_date || '').localeCompare(String(b.start_date || '')));
  grouped.upcoming.sort((a, b) => String(a.start_date || '').localeCompare(String(b.start_date || '')));
  grouped.past.sort(
    (a, b) =>
      String(b.end_date || b.start_date || '').localeCompare(String(a.end_date || a.start_date || '')) ||
      (b.id || 0) - (a.id || 0)
  );

  const counts = {
    all: (items || []).length,
    pending: grouped.pending.length,
    in_progress: grouped.in_progress.length,
    upcoming: grouped.upcoming.length,
    past: grouped.past.length,
  };

  const orderedGroups = REQUEST_BUCKET_ORDER
    .map((key) => ({ ...REQUEST_BUCKET_META[key], items: grouped[key] }))
    .filter((grp) => grp.items.length > 0);

  return { grouped, counts, orderedGroups };
}
