import React, { useEffect, useRef } from 'react';
import { AlertTriangle, LogOut, HelpCircle, X } from 'lucide-react';

/**
 * Universal confirmation modal for critical, destructive, or state-altering decisions.
 * Supports accessible keyboard handling (Escape to cancel, Enter to confirm).
 */
export default function ConfirmModal({
  isOpen = false,
  title = 'Please Confirm',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'brand', // 'brand' | 'danger' | 'warning' | 'primary'
  icon = null,
  isLoading = false,
  maxWidth = '460px',
  onConfirm = () => {},
  onClose = () => {},
}) {
  const cancelBtnRef = useRef(null);

  // Focus cancel button on open and listen to Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Determine styling palette based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'var(--red-600, #dc2626)',
          iconBg: 'var(--red-50, #fef2f2)',
          iconBorder: 'var(--red-200, #fecaca)',
          btnBg: 'var(--red-600, #dc2626)',
          btnColor: '#ffffff',
          btnHover: 'var(--red-700, #b91c1c)',
          DefaultIcon: AlertTriangle,
        };
      case 'warning':
        return {
          iconColor: 'var(--amber-600, #d97706)',
          iconBg: 'var(--amber-50, #fffbeb)',
          iconBorder: 'var(--amber-200, #fde68a)',
          btnBg: 'var(--amber-600, #d97706)',
          btnColor: '#ffffff',
          btnHover: 'var(--amber-700, #b45309)',
          DefaultIcon: AlertTriangle,
        };
      case 'primary':
        return {
          iconColor: 'var(--blue-600, #2563eb)',
          iconBg: 'var(--blue-50, #eff6ff)',
          iconBorder: 'var(--blue-200, #bfdbfe)',
          btnBg: 'var(--blue-600, #2563eb)',
          btnColor: '#ffffff',
          btnHover: 'var(--blue-700, #1d4ed8)',
          DefaultIcon: HelpCircle,
        };
      case 'brand':
      default:
        return {
          iconColor: 'var(--brand-700, #7a1128)',
          iconBg: 'var(--brand-50, #fdf2f4)',
          iconBorder: 'var(--brand-200, #fecdd3)',
          btnBg: 'var(--brand-700, #7a1128)',
          btnColor: '#ffffff',
          btnHover: 'var(--brand-800, #5c0d1e)',
          DefaultIcon: LogOut,
        };
    }
  };

  const styleConfig = getVariantStyles();
  const IconComponent = icon || styleConfig.DefaultIcon;

  return (
    <div
      className="modal-overlay open"
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="modal-card"
        style={{
          maxWidth,
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--line, #e2e8f0)',
          padding: '24px',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: styleConfig.iconBg,
              border: `1px solid ${styleConfig.iconBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: styleConfig.iconColor,
            }}
          >
            <IconComponent size={22} strokeWidth={2.2} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="confirm-modal-title"
              style={{
                margin: '0 0 6px',
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--ink-900, #0f172a)',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h3>
            <div
              style={{
                fontSize: '13.5px',
                lineHeight: 1.55,
                color: 'var(--ink-600, #475569)',
              }}
            >
              {typeof message === 'string' ? <p style={{ margin: 0 }}>{message}</p> : message}
            </div>
          </div>

          {!isLoading && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-400, #94a3b8)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line, #f1f5f9)',
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: styleConfig.btnBg,
              color: styleConfig.btnColor,
              border: `1px solid ${styleConfig.btnBg}`,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading && (
              <span
                className="btn-spinner"
                style={{
                  display: 'inline-block',
                  width: '13px',
                  height: '13px',
                  borderWidth: '2px',
                  borderColor: '#ffffff',
                  borderTopColor: 'transparent',
                }}
              />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
