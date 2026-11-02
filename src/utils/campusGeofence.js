/**
 * EVSU Ormoc & Luna Campus Geofencing Engine
 * Handles multi-campus GPS perimeters, Haversine Euclidean distance calculations,
 * and out-of-bounds validation for Daily Accomplishment Report (DAR) submissions.
 */

export const DEFAULT_CAMPUSES = [
  {
    id: 'evsu_ormoc_main',
    name: 'EVSU Ormoc — Main Campus',
    shortName: 'Main Campus',
    locationNote: 'Brgy. Don Felipe Larrazabal, Ormoc City',
    latitude: 11.0065,
    longitude: 124.6075,
    radiusM: 500,
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

    if (dist <= Number(campus.radiusM)) {
      matchedCampus = campus;
      break;
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
