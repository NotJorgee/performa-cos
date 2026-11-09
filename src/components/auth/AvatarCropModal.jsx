import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Crop, Move } from 'lucide-react';

const VIEWPORT_SIZE = 280; // Square crop viewport in pixels

export default function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef(null);
  const pinchStartZoomRef = useRef(1);
  const imgElementRef = useRef(null);
  const viewportRef = useRef(null);

  // Calculate base scale so image fills the crop frame at zoom=1
  const baseScale = naturalSize.width > 0 && naturalSize.height > 0
    ? Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height)
    : 1;

  // Clamp pan within frame boundaries so avatar circle is never empty
  const clampPan = useCallback((x, y, currentZoom) => {
    if (!naturalSize.width || !naturalSize.height) return { x: 0, y: 0 };
    const renderedW = naturalSize.width * baseScale * currentZoom;
    const renderedH = naturalSize.height * baseScale * currentZoom;
    const maxPanX = Math.max(0, (renderedW - VIEWPORT_SIZE) / 2);
    const maxPanY = Math.max(0, (renderedH - VIEWPORT_SIZE) / 2);
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, y)),
    };
  }, [naturalSize, baseScale]);

  // Load natural image dimensions when imageSrc changes
  useEffect(() => {
    if (!imageSrc || !isOpen) return;
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Handle zoom changes and re-clamp pan
  const handleZoomChange = (nextZoom) => {
    const clampedZoom = Math.min(3, Math.max(1, nextZoom));
    setZoom(clampedZoom);
    setPan((currentPan) => clampPan(currentPan.x, currentPan.y, clampedZoom));
  };

  // Reset zoom and pan to initial center
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan(clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoom));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom, clampPan]);

  // Touch drag & pinch-to-zoom handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
      pinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchDistRef.current = dist;
      pinchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan(clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoom));
    } else if (e.touches.length === 2 && pinchDistRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchDistRef.current;
      handleZoomChange(pinchStartZoomRef.current * ratio);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchDistRef.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    handleZoomChange(zoom + delta);
  };

  // Canvas Crop & Export
  const handleConfirmCrop = () => {
    if (!imgElementRef.current || naturalSize.width === 0 || naturalSize.height === 0) return;

    const OUTPUT_SIZE = 400; // Crisp 400x400 avatar output
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const renderedW = naturalSize.width * baseScale * zoom;
    const renderedH = naturalSize.height * baseScale * zoom;
    const scaleToOutput = OUTPUT_SIZE / VIEWPORT_SIZE;

    // Viewport-to-Canvas coordinate transformation
    const drawX = (VIEWPORT_SIZE / 2 + pan.x - renderedW / 2) * scaleToOutput;
    const drawY = (VIEWPORT_SIZE / 2 + pan.y - renderedH / 2) * scaleToOutput;
    const drawW = renderedW * scaleToOutput;
    const drawH = renderedH * scaleToOutput;

    ctx.drawImage(imgElementRef.current, drawX, drawY, drawW, drawH);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    canvas.toBlob((blob) => {
      const file = blob ? new File([blob], 'avatar.jpg', { type: 'image/jpeg' }) : null;
      onCropComplete({ dataUrl, blob: file });
      onClose();
    }, 'image/jpeg', 0.92);
  };

  if (!isOpen || !imageSrc) return null;

  const currentW = naturalSize.width * baseScale * zoom;
  const currentH = naturalSize.height * baseScale * zoom;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(226, 232, 240, 0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crop size={18} color="var(--brand-700, #800000)" />
              <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 700, color: 'var(--ink-900, #0f172a)' }}>
                Crop Profile Picture
              </h3>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '12.5px', lineHeight: 1.4 }}>
              Drag to position and adjust the zoom slider to frame your face nicely.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--ink-600, #64748b)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Crop Viewport */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          {/* Viewport Frame */}
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onWheel={handleWheel}
            style={{
              width: `${VIEWPORT_SIZE}px`,
              height: `${VIEWPORT_SIZE}px`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {/* The Image */}
            <img
              ref={imgElementRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${currentW}px`,
                height: `${currentH}px`,
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
                pointerEvents: 'none',
                userSelect: 'none',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
            />

            {/* Circular Vignette Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                border: '2.5px solid rgba(255, 255, 255, 0.95)',
                pointerEvents: 'none',
              }}
            />

            {/* Subtle Rule-of-Thirds Grid inside circular aperture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                opacity: 0.18,
              }}
            >
              <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
              <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
              <div style={{ borderBottom: '1px dashed #ffffff' }} />
              <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
              <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
              <div style={{ borderBottom: '1px dashed #ffffff' }} />
              <div style={{ borderRight: '1px dashed #ffffff' }} />
              <div style={{ borderRight: '1px dashed #ffffff' }} />
              <div />
            </div>

            {/* Pan Hint Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '12px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <Move size={11} /> Drag to reposition
            </div>
          </div>

          {/* Zoom Slider and Controls */}
          <div
            style={{
              width: '100%',
              maxWidth: `${VIEWPORT_SIZE}px`,
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleZoomChange(zoom - 0.2)}
              aria-label="Zoom out"
              title="Zoom out"
              style={{
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              aria-label="Avatar Zoom Slider"
              style={{
                flex: 1,
                cursor: 'pointer',
                accentColor: 'var(--brand-700, #800000)',
              }}
            />

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleZoomChange(zoom + 0.2)}
              aria-label="Zoom in"
              title="Zoom in"
              style={{
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              className="btn btn-sm"
              onClick={handleReset}
              aria-label="Reset zoom and position"
              title="Reset center"
              style={{
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--line, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmCrop}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Check size={16} /> Apply &amp; Set Photo
          </button>
        </div>
      </div>
    </div>
  );
}
