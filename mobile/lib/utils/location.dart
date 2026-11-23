import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class LocationFix {
  LocationFix(this.latitude, this.longitude, this.accuracy);
  final double latitude;
  final double longitude;
  final double? accuracy;
}

class LocationException implements Exception {
  LocationException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Gets the device's live GPS position: high accuracy first (7s), then Wi-Fi / cell
/// triangulation (6s), then the last known fix — same strategy as DailyReporting.jsx.
Future<LocationFix> getCurrentLocation() async {
  if (!kIsWeb && !await Geolocator.isLocationServiceEnabled()) {
    throw LocationException('Location services are turned off. Please enable GPS / Location on your device.');
  }

  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied) {
    throw LocationException('Location permission was denied. PerformaCOS needs your location to verify campus attendance.');
  }
  if (permission == LocationPermission.deniedForever) {
    throw LocationException('Location permission is permanently denied. Enable it for PerformaCOS in your device settings.');
  }

  Position? pos;
  try {
    pos = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 7),
      ),
    );
  } catch (_) {
    try {
      pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 6),
        ),
      );
    } catch (_) {
      if (!kIsWeb) {
        try {
          pos = await Geolocator.getLastKnownPosition();
        } catch (_) {}
      }
    }
  }

  if (pos == null) {
    throw LocationException('Unable to detect your GPS location. Move to an open area and try again.');
  }
  return LocationFix(pos.latitude, pos.longitude, pos.accuracy);
}
