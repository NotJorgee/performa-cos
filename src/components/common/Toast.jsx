import React from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Institutional Floating Toast Notification
 * Displays ephemeral action feedback at the top-right of the viewport
 * with zero cumulative layout shift (CLS = 0) and smooth slide-in animation.
 */
export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error' || type === 'danger';
  const isWarning = type === 'warning';
  const isInfo = type === 'info';

  const typeClass = isError
    ? 'toast-error'
    : isWarning
    ? 'toast-warning'
    : isInfo
    ? 'toast-info'
    : 'toast-success';

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast-item ${typeClass}`}>
        <div className="toast-content">
          <div className="toast-icon">
            {isSuccess && <Check size={18} strokeWidth={2.5} />}
            {isError && <AlertTriangle size={18} strokeWidth={2.5} />}
            {isWarning && <AlertTriangle size={18} strokeWidth={2.5} />}
            {isInfo && <Info size={18} strokeWidth={2.5} />}
          </div>
          <span>{message}</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="toast-close-btn"
            onClick={onClose}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
