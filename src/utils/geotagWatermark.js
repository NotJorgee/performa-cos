/**
 * src/utils/geotagWatermark.js
 * 
 * Client-Side Geotag Watermarking & Anti-Spoofing Engine for Performa-COS.
 * Burns an official, semi-transparent Style 2 Glassmorphism Corner Badge into photo
 * evidence pixels and computes SHA-256 fingerprints to prevent gallery replay attacks.
 */

/**
 * Computes a standard SHA-256 cryptographic hexadecimal hash of a File or Blob.
 * Used for backend duplicate detection to prevent gallery photo reuse.
 * 
 * @param {Blob|File} blob 
 * @returns {Promise<string>} 64-character hex hash
 */
export async function computeImageHash(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Crypto subtle hash fallback:', err);
    // Fallback pseudo-hash based on size, name, and timestamp
    const str = `${blob.name || 'blob'}_${blob.size}_${blob.lastModified || Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

/**
 * Helper to draw a rounded rectangle on an HTML5 2D Canvas context.
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Applies Style 2 (Floating Glassmorphism Corner Badge) onto an image file.
 * The badge is positioned tightly in the bottom-right corner to preserve visibility
 * of the core task accomplishment while preventing documentation tampering.
 * 
 * @param {File|Blob} imageFile 
 * @param {Object} options
 * @param {string} options.campusName - Verified campus site (e.g. "EVSU Ormoc — Main Campus")
 * @param {number} options.latitude - GPS latitude
 * @param {number} options.longitude - GPS longitude
 * @param {number} [options.accuracyM] - Location accuracy in meters
 * @param {string} [options.employeeName] - Employee's full name
 * @param {string} [options.employeeRole] - Employee's role (e.g. "COS Employee")
 * @param {Date|string} [options.timestamp] - Capture date/time
 * @param {boolean} [options.isVerified=true] - Whether geofence is valid
 * @returns {Promise<{ watermarkedFile: File, watermarkedUrl: string, photoHash: string }>}
 */
export async function applyStyle2GeotagWatermark(imageFile, options = {}) {
  const {
    campusName = 'EVSU Ormoc Campus',
    latitude = 10.9995,
    longitude = 124.6075,
    accuracyM = null,
    employeeName = 'COS Personnel',
    employeeRole = 'COS Employee',
    timestamp = new Date(),
    isVerified = true,
  } = options;

  // 1. Calculate raw original image hash (Anti-Replay fingerprint)
  const photoHash = await computeImageHash(imageFile);

  // 2. Load the source image via FileReader for universal mobile browser compatibility
  const img = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to decode image data.'));
      image.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file from device.'));
    reader.readAsDataURL(imageFile);
  });

  // 3. Setup Canvas with performance-optimized max dimensions
  // Standard phone cameras shoot 12MP to 48MP; downscale to max 2048px to prevent browser memory leaks
  const maxDimension = 2048;
  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  // Draw base photograph
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 4. Calculate dynamic scaling for typography & badge geometry
  // Scale factor based on canvas resolution (normalized to 1200px width reference)
  const scale = Math.max(0.7, Math.min(2.2, targetWidth / 1200));

  // Formatted data strings
  const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const timeFormatted = dateObj.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const latText = `${Math.abs(latitude).toFixed(5)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lngText = `${Math.abs(longitude).toFixed(5)}° ${longitude >= 0 ? 'E' : 'W'}`;
  const accText = accuracyM ? ` (±${Math.round(accuracyM)}m)` : '';
  const hashShort = photoHash.slice(0, 16).toUpperCase();

  // Badge typography specs
  const headerFontSize = Math.round(10.5 * scale);
  const bodyFontSize = Math.round(11.5 * scale);
  const metaFontSize = Math.round(9.5 * scale);
  const lineHeight = Math.round(17 * scale);

  ctx.font = `bold ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  // Measure text widths for auto-sizing
  const titleText = isVerified ? 'EVSU PERFORMA-COS • VERIFIED EVIDENCE' : 'EVSU PERFORMA-COS • UNVERIFIED LOCATION';
  const siteLine = `${campusName} ${isVerified ? '• In-Bounds' : '• Out-of-Bounds'}`;
  const gpsLine = `${latText}, ${lngText}${accText}`;
  const timeLine = `${timeFormatted}`;
  const userLine = `${employeeName} (${employeeRole})`;
  const hashLine = `FINGERPRINT: ${hashShort}`;

  const textLines = [siteLine, gpsLine, timeLine, userLine, hashLine];
  let maxTextWidth = ctx.measureText(titleText).width;
  for (const line of textLines) {
    const w = ctx.measureText(line).width;
    if (w > maxTextWidth) maxTextWidth = w;
  }

  // Badge Dimensions
  const paddingX = Math.round(14 * scale);
  const paddingY = Math.round(12 * scale);
  const badgeWidth = Math.round(maxTextWidth + paddingX * 2 + 10 * scale);
  const badgeHeight = Math.round(paddingY * 2 + lineHeight * 5 + 10 * scale);

  // Position: Bottom-Right Corner with tight margin
  const margin = Math.round(14 * scale);
  const badgeX = targetWidth - badgeWidth - margin;
  const badgeY = targetHeight - badgeHeight - margin;
  const borderRadius = Math.round(9 * scale);

  // 5. Render Glassmorphic Badge Background
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = Math.round(10 * scale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(2 * scale);

  // Semi-transparent deep slate backdrop (74% opacity for true glassmorphic view)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.74)';
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, borderRadius);
  ctx.fill();

  // Subtle frosted glass border
  ctx.strokeStyle = isVerified ? 'rgba(52, 211, 153, 0.45)' : 'rgba(239, 68, 68, 0.45)';
  ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
  ctx.stroke();
  ctx.restore();

  // 6. Render Badge Contents
  let currentY = badgeY + paddingY + headerFontSize;

  // Header Dot
  ctx.beginPath();
  ctx.arc(badgeX + paddingX + Math.round(3.5 * scale), currentY - Math.round(3.5 * scale), Math.round(3.5 * scale), 0, Math.PI * 2);
  ctx.fillStyle = isVerified ? '#10b981' : '#ef4444';
  ctx.fill();

  // Header Title
  ctx.font = `bold ${headerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = isVerified ? '#34d399' : '#f87171';
  ctx.fillText(titleText, badgeX + paddingX + Math.round(11 * scale), currentY);

  // Divider Line
  currentY += Math.round(7 * scale);
  ctx.beginPath();
  ctx.moveTo(badgeX + paddingX, currentY);
  ctx.lineTo(badgeX + badgeWidth - paddingX, currentY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = Math.max(1, Math.round(1 * scale));
  ctx.stroke();

  currentY += Math.round(11 * scale);

  // Line 1: Campus Site
  ctx.font = `bold ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(siteLine, badgeX + paddingX, currentY);

  // Line 2: GPS Coordinates
  currentY += lineHeight;
  ctx.font = `${bodyFontSize - 0.5 * scale}px "SF Mono", Consolas, Menlo, monospace`;
  ctx.fillStyle = '#38bdf8'; // Soft cyan for GPS coordinates
  ctx.fillText(gpsLine, badgeX + paddingX, currentY);

  // Line 3: Timestamp
  currentY += lineHeight;
  ctx.font = `${bodyFontSize - 0.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillText(timeLine, badgeX + paddingX, currentY);

  // Line 4: Personnel
  currentY += lineHeight;
  ctx.font = `${bodyFontSize - 1 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(userLine, badgeX + paddingX, currentY);

  // Line 5: Anti-Tamper SHA-256 Fingerprint
  currentY += Math.round(lineHeight * 0.95);
  ctx.font = `${metaFontSize}px "SF Mono", Consolas, Menlo, monospace`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(hashLine, badgeX + paddingX, currentY);

  // 7. Export watermarked canvas as JPEG Blob and File
  const watermarkedBlob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });

  const cleanOriginalName = imageFile.name ? imageFile.name.replace(/\.[^/.]+$/, '') : 'dar_proof';
  const watermarkedFile = new File([watermarkedBlob], `${cleanOriginalName}_geotagged.jpg`, {
    type: 'image/jpeg',
  });

  const watermarkedUrl = URL.createObjectURL(watermarkedBlob);

  return {
    watermarkedFile,
    watermarkedUrl,
    photoHash,
  };
}
