import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

const String cosEmployeeRole = 'COS Employee';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => message;
}

/// Centralized client for the Performa-COS FastAPI backend (COS Employee endpoints only).
/// Mirrors src/services/api.js of the web portal.
class Api {
  Api._();
  static final Api instance = Api._();

  static const _tokenKey = 'performa_token';
  static const _userKey = 'performa_user';

  String? _token;
  Map<String, dynamic>? _storedUser;

  /// Invoked when an authenticated request returns 401 (expired / revoked session).
  VoidCallback? onUnauthorized;

  String? get token => _token;
  Map<String, dynamic>? get storedUser => _storedUser;

  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    final raw = prefs.getString(_userKey);
    if (raw != null) {
      try {
        _storedUser = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      } catch (_) {
        _storedUser = null;
      }
    }
  }

  Future<void> _saveSession(String token, Map<String, dynamic> user) async {
    _token = token;
    _storedUser = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user));
  }

  Future<void> updateStoredUser(Map<String, dynamic> patch) async {
    _storedUser = {...?_storedUser, ...patch};
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(_storedUser));
  }

  Future<void> clearSession() async {
    _token = null;
    _storedUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  Uri _uri(String endpoint, [Map<String, dynamic>? query]) {
    final base = Uri.parse('${AppConfig.baseUrl}$endpoint');
    if (query == null) return base;
    final q = <String, String>{};
    query.forEach((k, v) {
      if (v != null && v.toString().isNotEmpty) q[k] = v.toString();
    });
    return base.replace(queryParameters: q.isEmpty ? null : q);
  }

  Map<String, String> _headers({bool json = true}) => {
        if (json) 'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<dynamic> _send(Future<http.Response> Function() call) async {
    final hadToken = _token != null;
    http.Response res;
    try {
      res = await call().timeout(const Duration(seconds: 30));
    } on TimeoutException {
      throw ApiException('The PerformaCOS server took too long to respond. Please try again.');
    } catch (_) {
      throw ApiException('Unable to reach the PerformaCOS server. Check your connection and server address.');
    }
    return _handle(res, hadToken);
  }

  dynamic _handle(http.Response res, bool hadToken) {
    final body = res.body.isEmpty ? null : _tryDecode(res.body);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      var detail = 'An unexpected server error occurred.';
      if (body is Map && body['detail'] != null) {
        final d = body['detail'];
        if (d is String) {
          detail = d;
        } else if (d is List && d.isNotEmpty && d.first is Map && d.first['msg'] != null) {
          detail = d.first['msg'].toString();
        } else {
          detail = d.toString();
        }
      } else if (res.reasonPhrase != null) {
        detail = res.reasonPhrase!;
      }
      if (res.statusCode == 401 && hadToken) onUnauthorized?.call();
      throw ApiException(detail, statusCode: res.statusCode);
    }
    return body;
  }

  dynamic _tryDecode(String s) {
    try {
      return jsonDecode(s);
    } catch (_) {
      return s;
    }
  }

  Future<dynamic> get(String endpoint, [Map<String, dynamic>? query]) =>
      _send(() => http.get(_uri(endpoint, query), headers: _headers()));

  Future<dynamic> post(String endpoint, [Object? data]) => _send(() => http.post(_uri(endpoint),
      headers: _headers(), body: data == null ? null : jsonEncode(data)));

  Future<dynamic> patch(String endpoint, [Object? data]) => _send(() => http.patch(_uri(endpoint),
      headers: _headers(), body: data == null ? null : jsonEncode(data)));

  Future<dynamic> delete(String endpoint) =>
      _send(() => http.delete(_uri(endpoint), headers: _headers()));

  Future<dynamic> upload(String endpoint, List<int> bytes, String filename, String mimeType) {
    final hadToken = _token != null;
    return () async {
      final req = http.MultipartRequest('POST', _uri(endpoint));
      req.headers.addAll(_headers(json: false));
      final parts = mimeType.split('/');
      req.files.add(http.MultipartFile.fromBytes('file', bytes,
          filename: filename, contentType: MediaType(parts[0], parts[1])));
      http.Response res;
      try {
        res = await http.Response.fromStream(await req.send()).timeout(const Duration(seconds: 90));
      } on TimeoutException {
        throw ApiException('Upload timed out. Please check your connection and try again.');
      } catch (_) {
        throw ApiException('Unable to upload the file. Check your connection and server address.');
      }
      return _handle(res, hadToken);
    }();
  }

  // ---------------- System ----------------
  Future<dynamic> checkHealth() => get('/health');

  // ---------------- Auth ----------------
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = Map<String, dynamic>.from(
        await post('/auth/login', {'email': email, 'password': password}) as Map);
    final user = Map<String, dynamic>.from((res['user'] ?? {}) as Map);
    // COS Employee App boundary: only COS Employee accounts may sign in here
    if (user['role'] != cosEmployeeRole) {
      throw ApiException(
          'This app is for COS Employees only. ${user['role'] ?? 'This'} accounts must sign in through the main PerformaCOS web portal.');
    }
    if (res['access_token'] != null) await _saveSession(res['access_token'] as String, user);
    return res;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    final res = Map<String, dynamic>.from(await post('/auth/register', payload) as Map);
    if (res['access_token'] != null) {
      await _saveSession(res['access_token'] as String, Map<String, dynamic>.from(res['user'] as Map));
    }
    return res;
  }

  Future<Map<String, dynamic>> getMe() async => Map<String, dynamic>.from(await get('/auth/me') as Map);
  Future<dynamic> forgotPassword(String email) => post('/auth/forgot-password', {'email': email});
  Future<dynamic> verifyOtp(String email, String otp) =>
      post('/auth/verify-otp', {'email': email, 'otp_code': otp});
  Future<dynamic> resetPassword(String resetToken, String newPassword) =>
      post('/auth/reset-password', {'reset_token': resetToken, 'new_password': newPassword});

  // ---------------- Own profile ----------------
  Future<dynamic> updateContact(int userId, Map<String, dynamic> data) => patch('/users/$userId', data);
  Future<dynamic> changePassword(int? userId, String current, String next) => patch(
      userId != null ? '/users/$userId/password' : '/users/me/password',
      {'current_password': current, 'new_password': next});

  // ---------------- Invitations ----------------
  Future<Map<String, dynamic>> validateInvitation(String token) async =>
      Map<String, dynamic>.from(await get('/invitations/validate', {'token': token}) as Map);

  // ---------------- DAR ----------------
  Future<List<dynamic>> darMonthly({int? userId, String? monthName, int? year, String? cutoff}) async {
    final res = await get('/dar/monthly', {
      'user_id': userId,
      'month_name': monthName,
      'year': year,
      if (cutoff != null && cutoff != 'all') 'cutoff': cutoff,
    });
    return res is List ? res : <dynamic>[];
  }

  Future<dynamic> submitDar(Map<String, dynamic> data) => post('/dar', data);

  // ---------------- Uploads ----------------
  Future<dynamic> uploadDarPhoto(List<int> bytes, String filename) =>
      upload('/uploads/dar-photo', bytes, filename, 'image/jpeg');
  Future<dynamic> uploadAvatar(List<int> bytes, String filename) =>
      upload('/uploads/avatar', bytes, filename, 'image/png');

  // ---------------- Renewals ----------------
  Future<dynamic> submitRenewal(Map<String, dynamic> data) => post('/renewals', data);

  // ---------------- Analytics ----------------
  Future<Map<String, dynamic>> employeeDashboard() async =>
      Map<String, dynamic>.from(await get('/analytics/employee-dashboard') as Map);

  // ---------------- Notifications ----------------
  Future<List<dynamic>> notifications() async {
    final res = await get('/notifications');
    return res is List ? res : <dynamic>[];
  }

  Future<dynamic> markNotificationRead(int id) => patch('/notifications/$id/read');
  Future<dynamic> markAllNotificationsRead() => patch('/notifications/read-all');

  // ---------------- Sessions ----------------
  Future<List<dynamic>> sessions() async {
    final res = await get('/sessions');
    return res is List ? res : <dynamic>[];
  }

  Future<dynamic> revokeSession(int id) => delete('/sessions/$id');
  Future<dynamic> revokeOtherSessions() => delete('/sessions/all/others');

  // ---------------- Geofences ----------------
  Future<List<dynamic>> geofences() async {
    final res = await get('/geofences');
    return res is List ? res : <dynamic>[];
  }

  // ---------------- Attendance (DTR) ----------------
  Future<Map<String, dynamic>> attendanceToday() async =>
      Map<String, dynamic>.from(await get('/attendance/today') as Map);
  Future<dynamic> timeIn(double lat, double lng, {double? accuracy}) =>
      post('/attendance/time-in', {'latitude': lat, 'longitude': lng, if (accuracy != null) 'accuracy': accuracy});
  Future<dynamic> timeOut(double lat, double lng, {double? accuracy}) =>
      post('/attendance/time-out', {'latitude': lat, 'longitude': lng, if (accuracy != null) 'accuracy': accuracy});
  Future<Map<String, dynamic>> payrollPacket(Map<String, dynamic> params) async =>
      Map<String, dynamic>.from(await get('/attendance/payroll-packet', params) as Map);

  // ---------------- Leaves ----------------
  Future<dynamic> applyLeave(Map<String, dynamic> data) => post('/attendance/leaves/apply', data);
  Future<List<dynamic>> myLeaves() async {
    final res = await get('/attendance/leaves/my-requests');
    return res is List ? res : <dynamic>[];
  }

  // ---------------- AI predictive text ----------------
  Future<Map<String, dynamic>> predictText(Map<String, dynamic> payload) async =>
      Map<String, dynamic>.from(await post('/ai/predictive-text', payload) as Map);
}
