import 'dart:async';

import 'package:flutter/widgets.dart';

import '../services/api.dart';
import '../utils/format.dart';

/// Authenticated COS Employee profile (mirrors buildCurrentUser in the web App.jsx).
class CurrentUser {
  CurrentUser({
    required this.id,
    required this.fullName,
    required this.department,
    this.departmentId,
    this.email = '',
    this.employeeIdNumber = '',
    this.jobTitle = 'COS Employee',
    this.avatarUrl,
    this.dateAppointed,
    this.contractStartDate,
    this.contractEndDate,
    this.contactNumber = '',
    this.alternateEmail = '',
    this.emergencyContact = '',
    this.officeLocation = '',
  });

  final int id;
  final String fullName;
  final String department;
  final int? departmentId;
  final String email;
  final String employeeIdNumber;
  final String jobTitle;
  final String? avatarUrl;
  final String? dateAppointed;
  final String? contractStartDate;
  final String? contractEndDate;
  final String contactNumber;
  final String alternateEmail;
  final String emergencyContact;
  final String officeLocation;

  String get role => cosEmployeeRole;
  String get initials => toInitials(fullName);

  factory CurrentUser.fromJson(Map<String, dynamic> j) => CurrentUser(
        id: (j['id'] as num).toInt(),
        fullName: (j['fullName'] ?? 'User').toString(),
        department: _deptName(j['department']),
        departmentId: (j['departmentId'] as num?)?.toInt(),
        email: (j['email'] ?? '').toString(),
        employeeIdNumber: (j['employeeIdNumber'] ?? '').toString(),
        jobTitle: (j['jobTitle'] ?? '').toString().isEmpty ? 'COS Employee' : j['jobTitle'].toString(),
        avatarUrl: (j['avatarUrl'] ?? '').toString().isEmpty ? null : j['avatarUrl'].toString(),
        dateAppointed: j['dateAppointed']?.toString(),
        contractStartDate: j['contractStartDate']?.toString(),
        contractEndDate: j['contractEndDate']?.toString(),
        contactNumber: (j['contactNumber'] ?? '').toString(),
        alternateEmail: (j['alternateEmail'] ?? '').toString(),
        emergencyContact: (j['emergencyContact'] ?? '').toString(),
        officeLocation: (j['officeLocation'] ?? '').toString(),
      );

  static String _deptName(dynamic d) {
    if (d is Map) return (d['name'] ?? 'Unassigned').toString();
    final s = (d ?? '').toString();
    return s.isEmpty ? 'Unassigned' : s;
  }

  CurrentUser copyWith({
    String? jobTitle,
    String? avatarUrl,
    bool clearAvatar = false,
    String? contactNumber,
    String? alternateEmail,
    String? emergencyContact,
    String? officeLocation,
  }) =>
      CurrentUser(
        id: id,
        fullName: fullName,
        department: department,
        departmentId: departmentId,
        email: email,
        employeeIdNumber: employeeIdNumber,
        jobTitle: jobTitle ?? this.jobTitle,
        avatarUrl: clearAvatar ? null : (avatarUrl ?? this.avatarUrl),
        dateAppointed: dateAppointed,
        contractStartDate: contractStartDate,
        contractEndDate: contractEndDate,
        contactNumber: contactNumber ?? this.contactNumber,
        alternateEmail: alternateEmail ?? this.alternateEmail,
        emergencyContact: emergencyContact ?? this.emergencyContact,
        officeLocation: officeLocation ?? this.officeLocation,
      );
}

/// Every screen reachable inside the COS Employee App (same route keys as the web portal).
const cosViews = <String>{
  'dashboard',
  'daily_report',
  'monthly_report',
  'contract_status',
  'peer_evaluations',
  'employee_attendance',
  'my_attendance',
  'leave_filing',
  'my_leaves',
  'attendance_logs',
  'profile_settings',
  'view_profile',
  'account_settings',
  'change_password',
};

class AppState extends ChangeNotifier {
  AppState() {
    Api.instance.onUnauthorized = () {
      if (isAuthenticated) logout();
    };
  }

  CurrentUser? user;
  bool get isAuthenticated => user != null;

  String? pendingInviteToken;

  String currentView = 'dashboard';
  final List<String> _history = [];

  List<Map<String, dynamic>> notifications = [];
  int get unreadCount => notifications.where((n) => n['unread'] == true).length;
  Timer? _pollTimer;

  /// Stale-while-revalidate cache (mirrors utils/swrCache.js) so revisited screens render instantly.
  final Map<String, dynamic> cache = {};

  /// Restores a stored COS Employee session and revalidates it against the backend.
  Future<void> restoreSession() async {
    await Api.instance.loadSession();
    final stored = Api.instance.storedUser;
    if (Api.instance.token == null || stored == null) return;
    if (stored['role'] != cosEmployeeRole) {
      await Api.instance.clearSession();
      return;
    }
    user = CurrentUser.fromJson(stored);
    _startPolling();
    notifyListeners();
    unawaited(_revalidate());
  }

  Future<void> _revalidate() async {
    try {
      final me = await Api.instance.getMe();
      if (me['role'] != cosEmployeeRole) {
        await logout();
        return;
      }
      await Api.instance.updateStoredUser(me);
      user = CurrentUser.fromJson(me);
      notifyListeners();
    } catch (_) {
      // Offline or server unreachable: keep the cached profile.
    }
  }

  void signIn(Map<String, dynamic> userJson) {
    if (userJson['role'] != cosEmployeeRole) {
      unawaited(logout());
      return;
    }
    user = CurrentUser.fromJson(userJson);
    currentView = 'dashboard';
    _history.clear();
    notifications = [];
    _startPolling();
    notifyListeners();
  }

  Future<void> logout() async {
    _pollTimer?.cancel();
    _pollTimer = null;
    await Api.instance.clearSession();
    cache.clear();
    user = null;
    notifications = [];
    currentView = 'dashboard';
    _history.clear();
    notifyListeners();
  }

  void updateUser(CurrentUser next) {
    user = next;
    notifyListeners();
  }

  void setPendingInviteToken(String? token) {
    final clean = token?.trim();
    if (clean == null || clean.isEmpty) return;
    if (pendingInviteToken == clean) return;
    pendingInviteToken = clean;
    notifyListeners();
  }

  void clearPendingInviteToken() {
    if (pendingInviteToken == null) return;
    pendingInviteToken = null;
    notifyListeners();
  }

  // ---------------- Navigation ----------------
  void navigate(String? view) {
    final target = (view != null && cosViews.contains(view)) ? view : 'dashboard';
    if (target == currentView) return;
    _history.add(currentView);
    if (_history.length > 30) _history.removeAt(0);
    currentView = target;
    notifyListeners();
  }

  /// Returns false when there is nothing to go back to (lets the OS close the app).
  bool goBack() {
    if (_history.isEmpty) {
      if (currentView != 'dashboard') {
        currentView = 'dashboard';
        notifyListeners();
        return true;
      }
      return false;
    }
    currentView = _history.removeLast();
    notifyListeners();
    return true;
  }

  // ---------------- Notifications ----------------
  void _startPolling() {
    _pollTimer?.cancel();
    unawaited(refreshNotifications());
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => refreshNotifications());
  }

  Future<void> refreshNotifications() async {
    if (!isAuthenticated) return;
    try {
      final list = await Api.instance.notifications();
      notifications = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      notifyListeners();
    } catch (_) {
      // Notification sync notice: retry on next cycle.
    }
  }

  Future<void> markAsRead(int id) async {
    notifications = [
      for (final n in notifications) n['id'] == id ? {...n, 'unread': false} : n,
    ];
    notifyListeners();
    try {
      await Api.instance.markNotificationRead(id);
    } catch (_) {}
  }

  Future<void> markAllAsRead() async {
    notifications = [for (final n in notifications) {...n, 'unread': false}];
    notifyListeners();
    try {
      await Api.instance.markAllNotificationsRead();
    } catch (_) {}
  }

  void invalidateCache(String prefix) => cache.removeWhere((k, _) => k.startsWith(prefix));

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }
}

/// Exposes [AppState] to the widget tree.
class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;

  static AppState read(BuildContext context) =>
      context.getInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
