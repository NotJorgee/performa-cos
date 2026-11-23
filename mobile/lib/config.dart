import 'package:flutter/foundation.dart';

/// Resolves the Performa-COS FastAPI base URL (e.g. https://api.performacos.example/api).
///
/// Priority: `--dart-define=API_BASE_URL=...` → [productionApiBaseUrl] → platform default
/// (web: same origin `/api`; Android emulator: 10.0.2.2; iOS simulator: 127.0.0.1).
///
/// The address is fixed at build time. There is no in-app server setting: release builds
/// always talk to the deployed backend.
class AppConfig {
  /// The deployed Performa-COS backend, e.g. 'https://api.performacos.example/api'.
  /// Fill this in before building a release, or pass it per build with
  /// `--dart-define=API_BASE_URL=...`.
  static const String productionApiBaseUrl = 'https://performacos-api.onrender.com/api';

  static const _defineUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_defineUrl.isNotEmpty) return normalize(_defineUrl);
    if (productionApiBaseUrl.isNotEmpty) return normalize(productionApiBaseUrl);
    if (kIsWeb) return normalize('${Uri.base.origin}/api');
    return 'https://performacos-api.onrender.com/api';
  }

  /// Accepts "192.168.1.10:8000", "https://host" or "https://host/api".
  static String normalize(String url) {
    var u = url.trim().replaceAll(RegExp(r'/+$'), '');
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'http://$u';
    if (!u.endsWith('/api')) u = '$u/api';
    return u;
  }
}
