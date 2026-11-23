import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/common.dart';
import 'auth_widgets.dart';

/// Step 1 — request an OTP (auth/ForgotPassword.jsx).
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, required this.onSubmitEmail, required this.onBackToLogin, this.error});
  final Future<void> Function(String email) onSubmitEmail;
  final VoidCallback onBackToLogin;
  final String? error;
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _loading = false;

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty) return;
    setState(() => _loading = true);
    await widget.onSubmitEmail(_email.text.trim());
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) widget.onBackToLogin();
      },
      child: AuthScaffold(
        title: 'Reset Password',
        subtitle: 'Performance Management System • Account Recovery',
        children: [
          const MutedText(
              'Enter your registered institutional email address. If the account exists in the database, '
              'a 6-digit one-time verification code will be sent to it.'),
          const SizedBox(height: 16),
          if (widget.error != null) FlashBanner(widget.error!),
          const FieldLabel('Institutional Email'),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(hintText: 'name@evsu.edu.ph'),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: Text(_loading ? 'Sending Code…' : 'Send Verification Code'),
          ),
          const SizedBox(height: 8),
          TextButton(onPressed: widget.onBackToLogin, child: const Text('← Back to Sign In')),
        ],
      ),
    );
  }
}

/// Step 2 — enter the 6-digit OTP (auth/VerifyOtp.jsx).
class VerifyOtpScreen extends StatefulWidget {
  const VerifyOtpScreen({
    super.key,
    required this.emailHint,
    required this.onVerify,
    required this.onResend,
    required this.onBack,
    this.statusMessage,
    this.error,
  });
  final String emailHint;
  final Future<void> Function(String otp) onVerify;
  final Future<void> Function() onResend;
  final VoidCallback onBack;
  final String? statusMessage;
  final String? error;
  @override
  State<VerifyOtpScreen> createState() => _VerifyOtpScreenState();
}

class _VerifyOtpScreenState extends State<VerifyOtpScreen> {
  final _otp = TextEditingController();
  bool _loading = false;

  Future<void> _submit() async {
    if (_otp.text.trim().length != 6) return;
    setState(() => _loading = true);
    await widget.onVerify(_otp.text.trim());
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) widget.onBack();
      },
      child: AuthScaffold(
        title: 'Enter Verification Code',
        subtitle: 'Performance Management System • Step 2 of 3',
        children: [
          if (widget.statusMessage != null) FlashBanner(widget.statusMessage!, tone: FlashTone.success),
          MutedText('Enter the 6-digit code sent to ${widget.emailHint}.'),
          const SizedBox(height: 14),
          if (widget.error != null) FlashBanner(widget.error!),
          const FieldLabel('6-Digit Code'),
          TextField(
            controller: _otp,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 22, letterSpacing: 10, fontWeight: FontWeight.w700),
            decoration: const InputDecoration(hintText: '123456', counterText: ''),
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _loading || _otp.text.trim().length != 6 ? null : _submit,
            child: Text(_loading ? 'Verifying…' : 'Verify Code'),
          ),
          const SizedBox(height: 8),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            TextButton(onPressed: widget.onBack, child: const Text('← Back')),
            TextButton(onPressed: widget.onResend, child: const Text('Resend Code')),
          ]),
        ],
      ),
    );
  }
}

/// Step 3 — set a new password (auth/ResetNewPassword.jsx).
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.onReset, this.error});
  final Future<void> Function(String newPassword) onReset;
  final String? error;
  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _pw = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final p = _pw.text;
    final hasLen = p.length >= 12;
    final hasUpper = RegExp(r'[A-Z]').hasMatch(p);
    final hasLower = RegExp(r'[a-z]').hasMatch(p);
    final hasNum = RegExp(r'[0-9]').hasMatch(p);
    final hasSym = RegExp(r'[^A-Za-z0-9]').hasMatch(p);
    final match = p.isNotEmpty && p == _confirm.text;
    final valid = hasLen && hasUpper && hasLower && hasNum && hasSym && match;

    return AuthScaffold(
      title: 'Create New Password',
      subtitle: 'Performance Management System • Step 3 of 3',
      children: [
        const MutedText(
            'Your OTP code checked out successfully. Set your new secure password below to complete account recovery.'),
        const SizedBox(height: 14),
        if (widget.error != null) FlashBanner(widget.error!),
        const FieldLabel('New Password'),
        PasswordField(controller: _pw, hint: 'At least 12 characters', onChanged: (_) => setState(() {})),
        const SizedBox(height: 12),
        const FieldLabel('Confirm New Password'),
        PasswordField(controller: _confirm, hint: 'Re-enter new password', onChanged: (_) => setState(() {})),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.line)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Password Requirements:',
                style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.ink700, fontSize: 13)),
            const SizedBox(height: 6),
            RequirementRow('At least 12 characters', hasLen),
            RequirementRow('One uppercase letter', hasUpper),
            RequirementRow('One lowercase letter', hasLower),
            RequirementRow('One number', hasNum),
            RequirementRow('One symbol', hasSym),
            RequirementRow('Passwords match', match),
          ]),
        ),
        const SizedBox(height: 18),
        ElevatedButton(
          onPressed: !valid || _loading
              ? null
              : () async {
                  setState(() => _loading = true);
                  await widget.onReset(_pw.text);
                  if (mounted) setState(() => _loading = false);
                },
          child: Text(_loading ? 'Updating Password…' : 'Reset Password'),
        ),
      ],
    );
  }
}
