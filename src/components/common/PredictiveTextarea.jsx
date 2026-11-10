import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CornerDownLeft, Check } from 'lucide-react';
import api from '../../services/api';

/**
 * PredictiveTextarea - Inline AI Ghost-Text Autocomplete.
 * Pure inline ghost text with:
 * - Desktop: Press Tab or ArrowRight to accept completion.
 * - Mobile / Touch: Floating [Accept (Tab)] touch button (e.preventDefault prevents keyboard blur).
 * - Click/Tap directly on ghost text to accept.
 */
export default function PredictiveTextarea({
  id = '',
  name = '',
  value = '',
  onChange = () => {},
  placeholder = 'Type here...',
  rows = 4,
  disabled = false,
  required = false,
  autoFocus = false,
  contextType = 'evaluation', // 'evaluation' | 'dar' | 'leave' | 'fast_track' | 'leave_review' | 'hr_renewal' | 'exit_reason'
  fieldName = 'strengths',
  role = 'COS Personnel',
  department = 'Computer Studies Department',
  dimensionScores = null,
  recentTasks = null,
  className = 'form-control',
  style = {},
}) {
  const [ghostText, setGhostText] = useState('');
  const [justAccepted, setJustAccepted] = useState(false);

  const textareaRef = useRef(null);
  const backdropRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastFetchedTextRef = useRef('');

  // Synchronize scroll between textarea and ghost text backdrop
  const handleScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.target.scrollTop;
      backdropRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Fetch predictive ghost text from API with debounce
  const fetchPrediction = useCallback(
    async (text) => {
      const trimmed = (text || '').trim();
      if (disabled || trimmed.length < 3) {
        setGhostText('');
        return;
      }
      if (trimmed === lastFetchedTextRef.current) return;
      lastFetchedTextRef.current = trimmed;

      try {
        const res = await api.ai.predictText({
          context_type: contextType,
          current_text: text || '',
          field_name: fieldName,
          employee_role: role,
          department: department,
          dimension_scores: dimensionScores,
          recent_tasks: recentTasks,
        });

        if (res) {
          // Verify current textarea value hasn't changed while request was in-flight
          const activeVal = textareaRef.current ? textareaRef.current.value : value;
          const currentTrimmed = (activeVal || '').trim();

          if (currentTrimmed.length >= 3 && currentTrimmed === trimmed) {
            setGhostText(res.ghost_text || '');
          } else {
            setGhostText('');
          }
        }
      } catch (err) {
        console.warn('Predictive text notice (using offline rules):', err.message);
      }
    },
    [contextType, fieldName, role, department, dimensionScores, recentTasks, disabled, value]
  );

  // Trigger prediction on typing after 350ms debounce
  useEffect(() => {
    if (disabled) {
      setGhostText('');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = (value || '').trim();

    // Clear ghost text immediately if text is cleared or under 3 characters
    if (trimmed.length < 3) {
      setGhostText('');
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPrediction(value);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, disabled, fetchPrediction]);

  // Accept ghost text completion with clean space separation
  const acceptGhostText = useCallback(() => {
    if (!ghostText || disabled) return;

    const currentVal = textareaRef.current ? textareaRef.current.value : value;
    if (!currentVal || currentVal.trim().length < 3) {
      setGhostText('');
      return;
    }

    const trimmedGhost = ghostText.trim();
    if (!trimmedGhost) {
      setGhostText('');
      return;
    }

    // Determine clean spacing
    let separator = ' ';
    if (currentVal.endsWith(' ') || currentVal.endsWith('\n')) {
      separator = '';
    } else if (
      trimmedGhost.startsWith(',') ||
      trimmedGhost.startsWith('.') ||
      trimmedGhost.startsWith(';') ||
      trimmedGhost.startsWith(':')
    ) {
      separator = '';
    }

    const nextVal = currentVal + separator + trimmedGhost;

    // Suppress immediate re-prediction
    lastFetchedTextRef.current = nextVal.trim();
    setGhostText('');
    setJustAccepted(true);
    setTimeout(() => setJustAccepted(false), 1200);

    // Call onChange
    onChange({ target: { value: nextVal, name: name || id } });

    // Keep focus and move cursor to end of inserted text
    if (textareaRef.current) {
      textareaRef.current.focus();
      const pos = nextVal.length;
      textareaRef.current.setSelectionRange(pos, pos);
    }
  }, [ghostText, value, disabled, onChange, name, id]);

  // Desktop keyboard interceptor (Tab / ArrowRight / Escape)
  const handleKeyDown = (e) => {
    if (disabled || !ghostText) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      acceptGhostText();
    } else if (e.key === 'ArrowRight') {
      const el = textareaRef.current;
      if (el && el.selectionStart === el.value.length) {
        e.preventDefault();
        acceptGhostText();
      }
    } else if (e.key === 'Escape') {
      setGhostText('');
    }
  };

  // Only consider ghost text valid when input has at least 3 characters
  const trimmedGhost = ghostText.trim();
  const hasValidGhost =
    !disabled &&
    Boolean(trimmedGhost) &&
    Boolean(value && value.trim().length >= 3);

  // Determine separator for visual ghost text alignment
  let visualSeparator = ' ';
  if (value && (value.endsWith(' ') || value.endsWith('\n'))) {
    visualSeparator = '';
  } else if (
    trimmedGhost.startsWith(',') ||
    trimmedGhost.startsWith('.') ||
    trimmedGhost.startsWith(';') ||
    trimmedGhost.startsWith(':')
  ) {
    visualSeparator = '';
  }

  return (
    <div className="predictive-textarea-wrapper" style={{ position: 'relative', width: '100%' }}>
      {/* Visual Input Field with Layered Ghost Text */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '8px',
          background: disabled ? '#f8fafc' : '#ffffff',
        }}
      >
        {/* Mirrored Backdrop for Accurate Ghost Text Positioning */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            padding: '10px 14px',
            fontFamily: 'inherit',
            fontSize: '13.5px',
            lineHeight: '1.5',
            letterSpacing: 'normal',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowY: 'hidden',
            overflowX: 'hidden',
            pointerEvents: 'none',
            border: '1px solid transparent',
            boxSizing: 'border-box',
            color: 'transparent',
            zIndex: 1,
            userSelect: 'none',
          }}
        >
          {/* Real typed text in transparent font (only if value exists) */}
          {value && <span>{value}</span>}

          {/* Projected Ghost Text Completion - ONLY when input has text */}
          {hasValidGhost && (
            <span
              onClick={acceptGhostText}
              style={{
                color: '#94a3b8',
                background: 'rgba(241, 245, 249, 0.75)',
                borderRadius: '3px',
                padding: '0 2px',
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click or tap to accept completion (or press Tab)"
            >
              {visualSeparator}
              {trimmedGhost}
            </span>
          )}
        </div>

        {/* Real Transparent Foreground Textarea */}
        <textarea
          ref={textareaRef}
          id={id}
          name={name}
          rows={rows}
          value={value}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={className}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'transparent',
            width: '100%',
            padding: '10px 14px',
            fontSize: '13.5px',
            lineHeight: '1.5',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            resize: 'vertical',
            ...style,
          }}
        />

        {/* Floating Mobile / Touch Accept Button (ONLY when ghost text is valid) */}
        {hasValidGhost && (
          <div
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                acceptGhostText();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                acceptGhostText();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                background: 'var(--brand-700, #701a28)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(112, 26, 40, 0.25)',
                transition: 'transform 0.1s ease',
              }}
              title="Tap to accept completion (or press Tab)"
            >
              <CornerDownLeft size={12} />
              <span>Accept</span>
              <span style={{ opacity: 0.8, fontSize: '10px', fontWeight: 500 }}>(Tab)</span>
            </button>
          </div>
        )}

        {/* Subtle Accepted Toast Indicator */}
        {justAccepted && (
          <div
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              zIndex: 3,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#16a34a',
            }}
          >
            <Check size={12} />
            <span>Accepted</span>
          </div>
        )}
      </div>
    </div>
  );
}
