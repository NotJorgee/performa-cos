/**
 * src/utils/swrCache.js
 * Lightweight Stale-While-Revalidate (SWR) cache utility for instant 0ms perceived load times.
 * Caches API payloads in sessionStorage to eliminate the 1-2s blank dash flash on page navigation.
 */

const CACHE_PREFIX = 'performa_swr_';

export function getCachedData(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? fallback;
  } catch (err) {
    console.warn('SWR cache read warning:', err.message);
    return fallback;
  }
}

export function setCachedData(key, data) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      timestamp: Date.now(),
      data,
    };
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('SWR cache write warning:', err.message);
  }
}

export function invalidateCache(key) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    console.warn('SWR cache invalidate warning:', err.message);
  }
}

export const invalidateCachedData = invalidateCache;

export function clearAllPerformaCache() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (err) {
    console.warn('SWR cache clear warning:', err.message);
  }
}
