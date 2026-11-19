/**
 * EVSU Ormoc & Luna Campus Geofencing Engine
 * Handles multi-campus GPS perimeters, Haversine Euclidean distance calculations,
 * Ray-Casting Point-in-Polygon boundary checks, and out-of-bounds validation for DAR submissions.
 */

export const DEFAULT_MAIN_POLYGON = [
  [11.0085, 124.6058],
  [11.0088, 124.6090],
  [11.0052, 124.6095],
  [11.0046, 124.6065],
  [11.0060, 124.6050],
];

export const DEFAULT_LUNA_POLYGON = [
  [11.0625, 124.6120],
  [11.0628, 124.6152],
  [11.0592, 124.6155],
  [11.0588, 124.6122],
];

export const DEFAULT_CAMPUSES = [
  {
    id: 'evsu_ormoc_main',
    name: 'EVSU Ormoc — Main Campus',
    shortName: 'Main Campus',
    locationNote: 'Brgy. Don Felipe Larrazabal, Ormoc City',
    latitude: 11.010466,
    longitude: 124.605469,
    radiusM: 500,
    boundaryType: 'polygon', // 'radius' | 'polygon'
    polygon: DEFAULT_MAIN_POLYGON,
    polygonCoords: DEFAULT_MAIN_POLYGON,
    enforceGeofence: true,
    isPrimary: true,
  },
  {
    id: 'evsu_luna',
    name: 'EVSU Ormoc — Luna Campus',
    shortName: 'Luna Campus',
    locationNote: 'Barangay Luna, Ormoc City',
    latitude: 11.06428,
    longitude: 124.618097,
    radiusM: 500,
    boundaryType: 'radius', // 'radius' | 'polygon'
    polygon: DEFAULT_LUNA_POLYGON,
    polygonCoords: DEFAULT_LUNA_POLYGON,
    enforceGeofence: true,
    isPrimary: false,
  },
];

const STORAGE_KEY = 'evsu_campus_geofences_v2';

export const getCampusGeofences = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load campus geofences from storage', err);
  }
  return DEFAULT_CAMPUSES;
};

export const saveCampusGeofences = (campuses) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campuses));
  } catch (err) {
    console.error('Failed to persist campus geofences to storage', err);
  }
};

/**
 * Ray-Casting algorithm for 2D Point-in-Polygon validation.
 */
export const isPointInPolygon = (lat, lon, polygon) => {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;
  let p1x = polygon[0][0];
  let p1y = polygon[0][1];
  for (let i = 1; i <= n; i++) {
    const p2x = polygon[i % n][0];
    const p2y = polygon[i % n][1];
    if (lon > Math.min(p1y, p2y) && lon <= Math.max(p1y, p2y) && lat <= Math.max(p1x, p2x)) {
      if (p1y !== p2y) {
        const xinters = ((lon - p1y) * (p2x - p1x)) / (p2y - p1y) + p1x;
        if (p1x === p2x || lat <= xinters) {
          inside = !inside;
        }
      }
    }
    p1x = p2x;
    p1y = p2y;
  }
  return inside;
};

/**
 * Calculates perpendicular Euclidean distance in meters from a point to a geographic line segment.
 */
export const distanceToSegmentMeters = (lat, lon, p1Lat, p1Lon, p2Lat, p2Lon) => {
  const midLatRad = ((lat + p1Lat + p2Lat) / 3.0) * (Math.PI / 180);
  const mPerDegLat = 111139.0;
  const mPerDegLon = 111139.0 * Math.cos(midLatRad);
  const px = (lon - p1Lon) * mPerDegLon;
  const py = (lat - p1Lat) * mPerDegLat;
  const bx = (p2Lon - p1Lon) * mPerDegLon;
  const by = (p2Lat - p1Lat) * mPerDegLat;
  const segLenSq = bx * bx + by * by;
  if (segLenSq === 0) return Math.sqrt(px * px + py * py);
  const t = Math.max(0.0, Math.min(1.0, (px * bx + py * by) / segLenSq));
  const cx = t * bx;
  const cy = t * by;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
};

/**
 * Returns 0.0 if inside polygon, or shortest distance in meters to any boundary segment.
 */
export const distanceToPolygonMeters = (lat, lon, polygon) => {
  if (!polygon || polygon.length < 3) return Infinity;
  if (isPointInPolygon(lat, lon, polygon)) return 0.0;
  let minDist = Infinity;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];
    const d = distanceToSegmentMeters(lat, lon, p1[0], p1[1], p2[0], p2[1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
};

/**
 * Calculates great-circle distance in meters between two GPS coordinates using the Haversine formula.
 */
export const calculateHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Validates whether GPS coordinates fall within any active EVSU campus perimeter.
 * Supports polygon perimeters with mobile accuracy tolerance buffer.
 */
export const verifyCoordinatesAgainstCampuses = (userLat, userLng, customCampuses = null, accuracy = null) => {
  const allCampuses = customCampuses || getCampusGeofences();
  const activeCampuses = allCampuses.filter((c) => c.enforceGeofence !== false);

  if (activeCampuses.length === 0) {
    return {
      isValid: true,
      verifiedCampus: null,
      nearestCampus: null,
      nearestDistanceM: 0,
      allDisabled: true,
    };
  }

  const deviceAcc = Number(accuracy) > 0 ? Number(accuracy) : 0;
  const toleranceM = Math.max(50, Math.min(deviceAcc, 150));

  let matchedCampus = null;
  let nearestCampus = null;
  let nearestDistanceM = Infinity;

  for (const campus of activeCampuses) {
    const poly = campus.polygonCoords || campus.polygon;
    let distToPerimeter = Infinity;

    if (campus.boundaryType === 'polygon' && poly && poly.length >= 3) {
      distToPerimeter = distanceToPolygonMeters(userLat, userLng, poly);
      if (distToPerimeter < nearestDistanceM) {
        nearestDistanceM = distToPerimeter;
        nearestCampus = campus;
      }
      if (distToPerimeter <= toleranceM) {
        matchedCampus = campus;
        break;
      }
    } else {
      const distToCenter = calculateHaversineDistanceMeters(
        userLat,
        userLng,
        Number(campus.latitude),
        Number(campus.longitude)
      );
      const radius = Number(campus.radiusM || 500);
      distToPerimeter = Math.max(0, distToCenter - radius);
      if (distToPerimeter < nearestDistanceM) {
        nearestDistanceM = distToPerimeter;
        nearestCampus = campus;
      }
      if (distToCenter <= radius + toleranceM) {
        matchedCampus = campus;
        break;
      }
    }
  }

  return {
    isValid: !!matchedCampus,
    verifiedCampus: matchedCampus,
    nearestCampus,
    nearestDistanceM: Math.round(nearestDistanceM),
    allDisabled: false,
  };
};
