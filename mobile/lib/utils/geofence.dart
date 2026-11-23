import 'dart:math' as math;

/// EVSU Ormoc multi-campus geofencing engine (port of src/utils/campusGeofence.js).
class Campus {
  Campus({
    required this.id,
    required this.name,
    required this.shortName,
    required this.latitude,
    required this.longitude,
    this.radiusM = 500,
    this.boundaryType = 'radius',
    this.polygon = const [],
    this.enforceGeofence = true,
  });

  final String id;
  final String name;
  final String shortName;
  final double latitude;
  final double longitude;
  final double radiusM;
  final String boundaryType;
  final List<List<double>> polygon;
  final bool enforceGeofence;

  factory Campus.fromJson(Map<String, dynamic> c) {
    final rawPoly = c['polygon_coords'] ?? c['polygonCoords'] ?? c['polygon'];
    final poly = <List<double>>[];
    if (rawPoly is List) {
      for (final p in rawPoly) {
        if (p is List && p.length >= 2) {
          poly.add([(p[0] as num).toDouble(), (p[1] as num).toDouble()]);
        }
      }
    }
    final name = (c['name'] ?? 'EVSU Campus').toString();
    return Campus(
      id: (c['id'] ?? name).toString(),
      name: name,
      shortName: (c['short_name'] ?? c['shortName'] ?? name).toString(),
      latitude: _num(c['latitude']),
      longitude: _num(c['longitude']),
      radiusM: _num(c['radius_meters'] ?? c['radiusM'], 500),
      boundaryType: (c['boundary_type'] ?? c['boundaryType'] ?? 'radius').toString(),
      polygon: poly.isEmpty ? defaultMainPolygon : poly,
      enforceGeofence: c['enforce_geofence'] ?? c['enforceGeofence'] ?? true,
    );
  }

  static double _num(dynamic v, [double fallback = 0]) {
    if (v is num) return v.toDouble();
    return double.tryParse('$v') ?? fallback;
  }
}

const defaultMainPolygon = [
  [11.0085, 124.6058],
  [11.0088, 124.6090],
  [11.0052, 124.6095],
  [11.0046, 124.6065],
  [11.0060, 124.6050],
];

const _defaultLunaPolygon = [
  [11.0625, 124.6120],
  [11.0628, 124.6152],
  [11.0592, 124.6155],
  [11.0588, 124.6122],
];

final defaultCampuses = [
  Campus(
    id: 'evsu_ormoc_main',
    name: 'EVSU Ormoc — Main Campus',
    shortName: 'Main Campus',
    latitude: 11.0065,
    longitude: 124.6075,
    polygon: defaultMainPolygon,
  ),
  Campus(
    id: 'evsu_luna',
    name: 'EVSU Ormoc — Luna Campus',
    shortName: 'Luna Campus',
    latitude: 11.0607,
    longitude: 124.6137,
    polygon: _defaultLunaPolygon,
  ),
];

class GeofenceResult {
  GeofenceResult(this.isValid, this.verifiedCampus, this.nearestCampus, this.nearestDistanceM);
  final bool isValid;
  final Campus? verifiedCampus;
  final Campus? nearestCampus;
  final int nearestDistanceM;
}

/// Ray-casting point-in-polygon test.
bool isPointInPolygon(double lat, double lon, List<List<double>> polygon) {
  if (polygon.length < 3) return false;
  var inside = false;
  final n = polygon.length;
  var p1x = polygon[0][0];
  var p1y = polygon[0][1];
  for (var i = 1; i <= n; i++) {
    final p2x = polygon[i % n][0];
    final p2y = polygon[i % n][1];
    if (lon > math.min(p1y, p2y) && lon <= math.max(p1y, p2y) && lat <= math.max(p1x, p2x)) {
      if (p1y != p2y) {
        final xinters = ((lon - p1y) * (p2x - p1x)) / (p2y - p1y) + p1x;
        if (p1x == p2x || lat <= xinters) inside = !inside;
      }
    }
    p1x = p2x;
    p1y = p2y;
  }
  return inside;
}

/// Great-circle distance in meters (Haversine).
double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
  const r = 6371000.0;
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(lat2 - lat1);
  final dLon = rad(lon2 - lon1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(rad(lat1)) * math.cos(rad(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2);
  return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

GeofenceResult verifyCoordinatesAgainstCampuses(double lat, double lng, List<Campus> campuses) {
  final active = campuses.where((c) => c.enforceGeofence).toList();
  if (active.isEmpty) return GeofenceResult(true, null, null, 0);

  Campus? matched;
  Campus? nearest;
  var nearestDist = double.infinity;
  for (final campus in active) {
    final dist = haversineMeters(lat, lng, campus.latitude, campus.longitude);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = campus;
    }
    if (campus.boundaryType == 'polygon' && campus.polygon.length >= 3) {
      if (isPointInPolygon(lat, lng, campus.polygon)) {
        matched = campus;
        break;
      }
    } else if (dist <= campus.radiusM) {
      matched = campus;
      break;
    }
  }
  return GeofenceResult(matched != null, matched, nearest, nearestDist.isFinite ? nearestDist.round() : 0);
}
