import React from 'react';
import { REQUEST_BUCKET_META } from '../../utils/requestHelpers';

/**
 * Filter pill bar separating requests by lifecycle/schedule timeline:
 * Pending Review, Currently In Progress, Upcoming, and Past Records.
 */
export default function RequestTimelineFilterBar({
  value = 'pending',
  onChange = () => {},
  counts = {},
  includePending = true,
}) {
  const pills = [
    ...(includePending ? [REQUEST_BUCKET_META.pending] : []),
    REQUEST_BUCKET_META.in_progress,
    REQUEST_BUCKET_META.upcoming,
    REQUEST_BUCKET_META.past,
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      {pills.map((pill) => {
        const isActive = value === pill.key;
        const count = counts[pill.key] || 0;
        return (
          <button
            key={pill.key}
            type="button"
            onClick={() => onChange(pill.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: isActive ? pill.text : pill.bg,
              color: isActive ? '#ffffff' : pill.text,
              border: `1px solid ${isActive ? pill.text : pill.border}`,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{pill.label}</span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '11px',
                background: isActive ? 'rgba(255,255,255,0.22)' : '#ffffff',
                color: isActive ? '#ffffff' : pill.text,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
