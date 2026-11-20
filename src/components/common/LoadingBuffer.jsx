import React from 'react';

/**
 * Minimalist Loading Buffer Screen.
 * Generic, non-flashy filler screen used for universal module transitions
 * and initial asynchronous database data loading.
 */
export default function LoadingBuffer({
  message = 'Loading...',
  minHeight = '380px',
  style = {},
}) {
  return (
    <div
      className="loading-buffer-wrap"
      style={{ minHeight, ...style }}
      role="status"
      aria-live="polite"
    >
      <div className="loading-buffer-spinner" aria-hidden="true" />
      <span className="loading-buffer-text">{message}</span>
    </div>
  );
}
