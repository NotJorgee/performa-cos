import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/attendance_logs_screen.dart';
import 'screens/attendance_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/recovery_screens.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/contract_status_screen.dart';
import 'screens/daily_report_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/monthly_report_screen.dart';
import 'screens/peer_evaluations_screen.dart';
import 'screens/profile_settings_screen.dart';
import 'services/api.dart';
import 'state/app_state.dart';
import 'theme.dart';
import 'utils/invite_link.dart';
import 'widgets/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final state = AppState();
  await state.restoreSession();
  runApp(PerformaCosApp(state: state));
}

class PerformaCosApp extends StatelessWidget {
  const PerformaCosApp({super.key, required this.state});
  final AppState state;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: state,
      child: MaterialApp(
        title: 'PerformaCOS — COS Employee',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const _Root(),
      ),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: state.isAuthenticated ? SystemUiOverlayStyle.dark : SystemUiOverlayStyle.light,
      child: state.isAuthenticated ? const _EmployeeShell() : const _AuthFlow(),
    );
  }
}

/// Unauthenticated flows: login, invitation sign-up, and the 3-step password recovery (UC-07, UC-08).
///
/// Registration is reached only through the invitation link HRMDO emails to the employee:
/// on the web the link's `?token=` query opens the form directly; on Android / iOS the link
/// opens the app (App Link / custom `performacos://` scheme) and the token arrives via app_links.
class _AuthFlow extends StatefulWidget {
  const _AuthFlow();
  @override
  State<_AuthFlow> createState() => _AuthFlowState();
}

class _AuthFlowState extends State<_AuthFlow> {
  String _view = 'login'; // 'login' | 'signup' | 'forgot' | 'otp' | 'reset_pw'
  String _inviteToken = '';
  String _email = '';
  String _resetToken = '';
  String? _error;
  String? _status;
  StreamSubscription<Uri>? _linkSub;

  @override
  void initState() {
    super.initState();
    if (kIsWeb) {
      _openInvite(invitationTokenFromUri(Uri.base));
    } else {
      final links = AppLinks();
      links.getInitialLink().then((uri) {
        if (uri != null) _openInvite(invitationTokenFromUri(uri));
      }).catchError((_) {});
      _linkSub = links.uriLinkStream.listen((uri) => _openInvite(invitationTokenFromUri(uri)));
    }
  }

  @override
  void dispose() {
    _linkSub?.cancel();
    super.dispose();
  }

  void _openInvite(String? token) {
    if (token == null || token.isEmpty || !mounted) return;
    setState(() {
      _error = null;
      _inviteToken = token;
      _view = 'signup';
    });
  }

  Future<void> _forgot(String email) async {
    setState(() => _error = null);
    try {
      await Api.instance.forgotPassword(email);
      setState(() {
        _email = email;
        _status = 'An OTP code was dispatched to $email. Check your inbox.';
        _view = 'otp';
      });
    } catch (e) {
      setState(() => _error = e.toString().isEmpty ? 'Failed to dispatch OTP. Please verify email.' : e.toString());
    }
  }

  Future<void> _verify(String otp) async {
    setState(() => _error = null);
    try {
      final res = await Api.instance.verifyOtp(_email, otp);
      setState(() {
        _resetToken = '${(res as Map)['reset_token']}';
        _view = 'reset_pw';
      });
    } catch (e) {
      setState(() => _error = e.toString().isEmpty ? 'Invalid or expired OTP code.' : e.toString());
    }
  }

  Future<void> _reset(String newPassword) async {
    setState(() => _error = null);
    try {
      await Api.instance.resetPassword(_resetToken, newPassword);
      if (!mounted) return;
      setState(() => _view = 'login');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password reset successfully. Please sign in with your new password.')),
      );
    } catch (e) {
      setState(() => _error = e.toString().isEmpty ? 'Failed to reset password.' : e.toString());
    }
  }

  void _go(String view) => setState(() {
        _error = null;
        _view = view;
      });

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return switch (_view) {
      'signup' => SignUpScreen(
          key: ValueKey('signup-$_inviteToken'),
          invitationToken: _inviteToken,
          onBackToLogin: () => _go('login'),
          onLoginAsNewUser: state.signIn,
        ),
      'forgot' => ForgotPasswordScreen(onSubmitEmail: _forgot, onBackToLogin: () => _go('login'), error: _error),
      'otp' => VerifyOtpScreen(
          emailHint: _email,
          statusMessage: _status,
          error: _error,
          onVerify: _verify,
          onResend: () => _forgot(_email),
          onBack: () => _go('forgot'),
        ),
      'reset_pw' => ResetPasswordScreen(onReset: _reset, error: _error),
      _ => LoginScreen(
          onLogin: state.signIn,
          onForgotPassword: () => setState(() {
            _error = null;
            _status = null;
            _view = 'forgot';
          }),
        ),
    };
  }
}

/// Authenticated COS Employee shell and screen routing (SRS Section 8.1).
class _EmployeeShell extends StatelessWidget {
  const _EmployeeShell();

  @override
  Widget build(BuildContext context) {
    final view = AppScope.of(context).currentView;
    final Widget screen = switch (view) {
      'daily_report' => const DailyReportScreen(),
      'monthly_report' => const MonthlyReportScreen(),
      'contract_status' => const ContractStatusScreen(),
      'peer_evaluations' => const PeerEvaluationsScreen(),
      'employee_attendance' => const AttendanceScreen(key: ValueKey('attendance'), initialTab: 'dtr'),
      'my_attendance' || 'leave_filing' || 'my_leaves' =>
        const AttendanceScreen(key: ValueKey('attendance'), initialTab: 'leaves'),
      'attendance_logs' => const AttendanceLogsScreen(),
      'profile_settings' || 'view_profile' || 'account_settings' =>
        const ProfileSettingsScreen(key: ValueKey('profile'), initialTab: 'profile'),
      'change_password' => const ProfileSettingsScreen(key: ValueKey('profile'), initialTab: 'change_password'),
      _ => const DashboardScreen(),
    };
    return AppShell(child: KeyedSubtree(key: ValueKey(view), child: screen));
  }
}
