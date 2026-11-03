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
    latitude: 11.0065,
    longitude: 124.6075,
    radiusM: 500,
    boundaryType: 'radius', // 'radius' | 'polygon'
    polygon: DEFAULT_MAIN_POLYGON,
    enforceGeofence: true,
    isPrimary: true,
  },
  {
    id: 'evsu_luna',
    name: 'EVSU Ormoc — Luna Campus',
    shortName: 'Luna Campus',
    locationNote: 'Barangay Luna, Ormoc City',
    latitude: 11.0607,
    longitude: 124.6137,
    radiusM: 500,
    boundaryType: 'radius', // 'radius' | 'polygon'
    polygon: DEFAULT_LUNA_POLYGON,
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
 */
export const verifyCoordinatesAgainstCampuses = (userLat, userLng, customCampuses = null) => {
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

  let matchedCampus = null;
  let nearestCampus = null;
  let nearestDistanceM = Infinity;

  for (const campus of activeCampuses) {
    const dist = calculateHaversineDistanceMeters(
      userLat,
      userLng,
      Number(campus.latitude),
      Number(campus.longitude)
    );

    if (dist < nearestDistanceM) {
      nearestDistanceM = dist;
      nearestCampus = campus;
    }

    if (campus.boundaryType === 'polygon' && campus.polygon && campus.polygon.length >= 3) {
      if (isPointInPolygon(userLat, userLng, campus.polygon)) {
        matchedCampus = campus;
        break;
      }
    } else {
      if (dist <= Number(campus.radiusM || 500)) {
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
