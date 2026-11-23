import 'package:flutter/material.dart';

import '../../services/api.dart';
import '../../theme.dart';
import '../../widgets/animated_seal.dart';

/// Sign-in screen (port of auth/Login.jsx): maroon backdrop, seal, institutional email +
/// password with live validity checks, then the "Welcome to PerformaCOS" transition.
///
/// New employees do not register from here: the invitation link emailed by HRMDO opens
/// the registration form directly (see _AuthFlow in main.dart).
class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.onLogin,
    required this.onForgotPassword,
  });

  final ValueChanged<Map<String, dynamic>> onLogin;
  final VoidCallback onForgotPassword;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _welcomeUser;

  bool get _emailOk => RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(_email.text.trim());
  bool get _passwordOk => _password.text.length >= 6;

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (email.isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Please enter both your institutional email and password.');
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final res = await Api.instance.login(email, _password.text);
      final user = Map<String, dynamic>.from(res['user'] as Map);
      setState(() => _welcomeUser = user);
      await Future.delayed(const Duration(milliseconds: 1800));
      widget.onLogin(user);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().isNotEmpty
            ? e.toString()
            : 'Invalid institutional credentials. Please check your email and password, or contact HRMDO if your account is locked.';
      });
    }
  }

  InputDecoration _decoration(String hint, {required bool ok, Widget? toggle}) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0x99FFFFFF)),
        filled: true,
        fillColor: const Color(0x1FFFFFFF),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: ok ? const Color(0xFF6EE7B7) : const Color(0x40FFFFFF))),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.white, width: 1.4)),
        suffixIcon: Row(mainAxisSize: MainAxisSize.min, children: [
          if (ok) const Icon(Icons.check, color: Color(0xFF6EE7B7), size: 20),
          ?toggle,
          const SizedBox(width: 8),
        ]),
      );

  @override
  Widget build(BuildContext context) {
    const label = TextStyle(color: Color(0xE6FFFFFF), fontWeight: FontWeight.w600, fontSize: 13.5);
    return Scaffold(
      backgroundColor: AppColors.loginBg,
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.4),
                  radius: 1.2,
                  colors: [AppColors.brand600.withValues(alpha: 0.55), const Color(0xF24A0718)],
                ),
              ),
            ),
          ),
          // Oversized EVSU seal watermark (.lv2-watermark)
          Positioned.fill(
            child: IgnorePointer(
              child: LayoutBuilder(
                builder: (context, c) {
                  final size = (c.maxWidth < c.maxHeight ? c.maxWidth : c.maxHeight) * 1.15;
                  return OverflowBox(
                    maxWidth: size,
                    maxHeight: size,
                    child: Opacity(
                      opacity: 0.08,
                      child: Image.asset('assets/images/evsu-seal.png', width: size, height: size),
                    ),
                  );
                },
              ),
            ),
          ),
          SafeArea(
            child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                children: [
                  Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 420),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const AnimatedSeal(size: 140),
                          const SizedBox(height: 14),
                          const Text('PerformaCOS',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                          const Text('Eastern Visayas State University',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Color(0xD9FFFFFF), fontSize: 15)),
                          const SizedBox(height: 28),
                          if (_error != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0x33FF4D6D),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0x66FFD9E1)),
                              ),
                              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                const Icon(Icons.error_outline, color: Color(0xFFFFD9E1), size: 19),
                                const SizedBox(width: 10),
                                Expanded(
                                    child: Text(_error!,
                                        style: const TextStyle(color: Colors.white, fontSize: 13.5, height: 1.4))),
                              ]),
                            ),
                          const Text('Institutional Email', style: label),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            autocorrect: false,
                            autofillHints: const [AutofillHints.username],
                            style: const TextStyle(color: Colors.white, fontSize: 16),
                            cursorColor: Colors.white,
                            onChanged: (_) => setState(() => _error = null),
                            decoration: _decoration('name@evsu.edu.ph', ok: _emailOk),
                          ),
                          const SizedBox(height: 16),
                          const Text('Password', style: label),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _password,
                            obscureText: !_showPassword,
                            autofillHints: const [AutofillHints.password],
                            style: const TextStyle(color: Colors.white, fontSize: 16),
                            cursorColor: Colors.white,
                            onChanged: (_) => setState(() => _error = null),
                            onSubmitted: (_) => _submit(),
                            decoration: _decoration('••••••••••',
                                ok: _passwordOk,
                                toggle: IconButton(
                                  tooltip: _showPassword ? 'Hide password' : 'Show password',
                                  icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                      color: const Color(0xCCFFFFFF), size: 20),
                                  onPressed: () => setState(() => _showPassword = !_showPassword),
                                )),
                          ),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: widget.onForgotPassword,
                              child: const Text('Forgot password?',
                                  style: TextStyle(color: Color(0xD9FFFFFF), fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(height: 6),
                          SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              onPressed: _loading ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppColors.brand700,
                                disabledBackgroundColor: const Color(0xCCFFFFFF),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                              ),
                              child: _loading
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.brand700))
                                  : const Text('Sign In'),
                            ),
                          ),
                          const SizedBox(height: 28),
                          const Text('COS Employee Portal • Eastern Visayas State University',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Color(0x99FFFFFF), fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
          ),
          if (_welcomeUser != null) _WelcomeOverlay(user: _welcomeUser!),
        ],
      ),
    );
  }
}

class _WelcomeOverlay extends StatelessWidget {
  const _WelcomeOverlay({required this.user});
  final Map<String, dynamic> user;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: AppColors.loginBg,
        alignment: Alignment.center,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          SizedBox(
            width: 200,
            height: 200,
            child: Stack(alignment: Alignment.center, children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 1400),
                curve: Curves.easeOutCubic,
                builder: (_, v, _) => SizedBox(
                  width: 190,
                  height: 190,
                  child: CircularProgressIndicator(value: v, strokeWidth: 2.5, color: const Color(0xE6FFFFFF)),
                ),
              ),
              Image.asset('assets/images/evsu-seal.png', width: 130),
            ]),
          ),
          const SizedBox(height: 22),
          const Text('Welcome to PerformaCOS',
              style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text('Signing in as ${user['role'] ?? 'User'} • ${user['fullName'] ?? ''}',
                textAlign: TextAlign.center, style: const TextStyle(color: Color(0xD9FFFFFF), fontSize: 14)),
          ),
        ]),
      ),
    );
  }
}
