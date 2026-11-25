import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/api.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../utils/invite_link.dart';
import '../../widgets/common.dart';
import 'auth_widgets.dart';

const universityTitles = ['None', 'Engr.', 'Dr.', 'Prof.', 'Assoc. Prof.', 'Asst. Prof.', 'Instr.', 'Atty.', 'Arch.'];

/// Invitation-based COS Employee registration (streamlined port of auth/TokenizedSignUp.jsx).
/// Collects essential account/ID creation details; job title and contact details are completed post-login,
/// and contract dates are assigned by HRMDO.
class SignUpScreen extends StatefulWidget {
  const SignUpScreen(
      {super.key, required this.onBackToLogin, required this.onLoginAsNewUser, this.invitationToken = ''});
  final VoidCallback onBackToLogin;
  final ValueChanged<Map<String, dynamic>> onLoginAsNewUser;
  final String invitationToken;

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  late String _token = widget.invitationToken;
  final _pastedLink = TextEditingController();
  final _email = TextEditingController();
  final _first = TextEditingController();
  final _middle = TextEditingController();
  final _last = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  String _titlePrefix = 'None';
  DateTime _startingDate = DateTime.now();
  String _dept = 'Computer Studies Department';
  bool _agreed = false;

  Map<String, dynamic>? _tokenData;
  String? _tokenError;
  bool _validating = false;
  bool _submitting = false;
  String? _formError;

  @override
  void initState() {
    super.initState();
    _validateToken();
  }

  @override
  void dispose() {
    _pastedLink.dispose();
    _email.dispose();
    _first.dispose();
    _middle.dispose();
    _last.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  /// Fallback when the e-mail link did not open the app: accept the pasted link.
  void _usePastedLink() {
    final token = invitationTokenFromText(_pastedLink.text);
    if (token == null) {
      setState(() => _tokenError = 'That does not look like a PerformaCOS invitation link.');
      return;
    }
    _token = token;
    _validateToken();
  }

  Future<void> _validateToken() async {
    final raw = _token.trim();
    if (raw.isEmpty) {
      setState(() {
        _tokenData = null;
        _tokenError = null;
        _validating = false;
      });
      return;
    }
    setState(() {
      _validating = true;
      _tokenError = null;
    });
    try {
      final data = await Api.instance.validateInvitation(raw);
      if (!mounted || _token.trim() != raw) return;
      // COS Employee App boundary: administrator invitations register on the main portal
      if (data['role'] != null && data['role'] != cosEmployeeRole) {
        setState(() {
          _tokenData = null;
          _tokenError =
              'This invitation is for a ${data['role']} account. Please register through the main PerformaCOS web portal.';
        });
        return;
      }
      setState(() {
        _tokenData = data;
        if ((data['email'] ?? '').toString().isNotEmpty) _email.text = data['email'].toString();
        if ((data['department_name'] ?? '').toString().isNotEmpty) _dept = data['department_name'].toString();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _tokenData = null;
        _tokenError = e.toString().isEmpty ? 'Invalid or expired invitation link.' : e.toString();
      });
    } finally {
      if (mounted) setState(() => _validating = false);
    }
  }

  bool get _hasLen => _password.text.length >= 8;
  bool get _hasUpper => RegExp(r'[A-Z]').hasMatch(_password.text);
  bool get _hasLower => RegExp(r'[a-z]').hasMatch(_password.text);
  bool get _hasNum => RegExp(r'[0-9]').hasMatch(_password.text);
  bool get _hasSpecial => RegExp(r'[^A-Za-z0-9]').hasMatch(_password.text);
  bool get _complex => _hasLen && _hasUpper && _hasLower && _hasNum && _hasSpecial;

  Future<void> _pickStartingDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startingDate,
      firstDate: DateTime(1980),
      lastDate: DateTime(DateTime.now().year + 2),
    );
    if (picked != null) setState(() => _startingDate = picked);
  }

  Future<void> _submit() async {
    setState(() => _formError = null);
    final token = _token.trim();
    final first = _first.text.trim();
    final middle = _middle.text.trim();
    final last = _last.text.trim();
    final emailToUse = ((_tokenData?['email']?.toString() ?? '').trim().isNotEmpty
            ? _tokenData!['email'].toString()
            : _email.text)
        .trim();

    String? err;
    if (token.isEmpty || _tokenData == null) {
      err = 'Please open the invitation link sent to your email to register.';
    } else if (emailToUse.isEmpty) {
      err = 'Invitation email is missing. Please request an updated registration link from HRMO.';
    } else if (first.isEmpty || last.isEmpty) {
      err = 'Please enter both your First Name and Last Name.';
    } else if (!_complex) {
      err = 'Password does not meet institutional requirements. It must have at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.';
    } else if (_password.text != _confirm.text) {
      err = 'Passwords do not match. Please ensure both password fields match.';
    } else if (!_agreed) {
      err = 'Please confirm the institutional acknowledgement before completing registration.';
    }
    if (err != null) {
      setState(() => _formError = err);
      return;
    }

    setState(() => _submitting = true);
    try {
      final prefix = _titlePrefix != 'None' ? '$_titlePrefix ' : '';
      final mi = middle.isNotEmpty ? '${middle.replaceAll(RegExp(r'\.$'), '')}. ' : '';
      final fullName = '$prefix$first $mi$last'.trim();
      final res = await Api.instance.register({
        'invitation_token': token,
        'email': emailToUse,
        'full_name': fullName,
        'first_name': first,
        'middle_initial': middle,
        'last_name': last,
        'title': _titlePrefix != 'None' ? _titlePrefix : null,
        'starting_date': isoDate(_startingDate),
        'contract_start_date': null,
        'password': _password.text,
        'role': cosEmployeeRole,
        'job_title': 'COS Staff',
        'contact_number': '',
      });
      if (!mounted) return;
      _showSuccess(Map<String, dynamic>.from(res['user'] as Map));
    } catch (e) {
      setState(() => _formError = e.toString().isEmpty
          ? 'Registration failed. Please check your invitation link and institutional credentials.'
          : e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showSuccess(Map<String, dynamic> user) {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        contentPadding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFBBF7D0), width: 2)),
            child: const Icon(Icons.check, size: 36, color: Color(0xFF16A34A)),
          ),
          const SizedBox(height: 14),
          const Text('Account Successfully Activated!',
              textAlign: TextAlign.center, style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const MutedText('Your official EVSU user profile is now registered and active in the PerformaCOS system.',
              align: TextAlign.center),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0))),
            child: Column(children: [
              _row('Assigned ID:', '${user['employeeIdNumber'] ?? ''}', mono: true),
              _row('Full Name:', '${user['fullName'] ?? ''}'),
              _row('System Role:', '${user['role'] ?? cosEmployeeRole}'),
              _row('Department:', '${user['department'] ?? _dept}'),
            ]),
          ),
        ]),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                widget.onLoginAsNewUser(user);
              },
              child: Text('Sign In to Dashboard as ${(user['fullName'] ?? '').toString().split(' ').first} →'),
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                Api.instance.clearSession();
                widget.onBackToLogin();
              },
              child: const Text('Return to Login Page'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value, {bool mono = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: AppColors.ink500, fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(value,
                textAlign: TextAlign.right,
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: mono ? AppColors.brand600 : AppColors.ink900,
                    fontFamily: mono ? 'monospace' : null)),
          ),
        ]),
      );

  Widget _dateField(String label, DateTime value, String help) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FieldLabel(label, required: true),
          InkWell(
            onTap: _pickStartingDate,
            child: InputDecorator(
              decoration: const InputDecoration(suffixIcon: Icon(Icons.calendar_today, size: 18)),
              child: Text(DateFormat('MMM d, yyyy').format(value), style: const TextStyle(fontSize: 14)),
            ),
          ),
          const SizedBox(height: 4),
          MutedText(help, size: 11.5),
        ],
      );

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) widget.onBackToLogin();
      },
      child: AuthScaffold(
        maxWidth: 620,
        title: 'COS Employee Registration',
        subtitle: 'Complete your profile to access accomplishment reports and performance evaluations.',
        children: [
          if (_validating)
            const FlashBanner('Verifying your institutional invitation link...', tone: FlashTone.info, icon: Icons.sync),
          if (_tokenError != null)
            FlashBanner('Invalid or Expired Invitation — $_tokenError Please ensure you are opening the exact link sent to your email, or contact HRMDO.'),
          if (_tokenData == null && !_validating) ...[
            if (_tokenError == null)
              const FlashBanner(
                'Registration opens from the invitation link HRMDO sent to your institutional email. '
                'Tap that link on this phone and the form will open automatically.',
                tone: FlashTone.info,
                icon: Icons.mark_email_read_outlined,
              ),
            const SizedBox(height: 12),
            const FieldLabel('Link did not open the app? Paste it here'),
            TextField(
              controller: _pastedLink,
              autocorrect: false,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(hintText: 'https://.../?token=...'),
              onSubmitted: (_) => _usePastedLink(),
            ),
            const SizedBox(height: 10),
            OutlinedButton(onPressed: _usePastedLink, child: const Text('Open Invitation')),
            const SizedBox(height: 8),
            TextButton(onPressed: widget.onBackToLogin, child: const Text('← Back to Sign In')),
          ],
          if (_tokenData != null) ..._form(),
        ],
      ),
    );
  }

  /// The streamlined registration form, shown only once the invitation link has been verified.
  List<Widget> _form() => [
          if (_formError != null) FlashBanner(_formError!),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(
              width: 120,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const FieldLabel('Title'),
                DropdownButtonFormField<String>(
                  initialValue: _titlePrefix,
                  isExpanded: true,
                  items: [for (final t in universityTitles) DropdownMenuItem(value: t, child: Text(t))],
                  onChanged: (v) => setState(() => _titlePrefix = v ?? 'None'),
                ),
              ]),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const FieldLabel('First Name', required: true),
                TextField(
                  controller: _first,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(hintText: 'e.g. Maria'),
                ),
              ]),
            ),
          ]),
          const SizedBox(height: 12),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(
              width: 80,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const FieldLabel('M.I.'),
                TextField(
                  controller: _middle,
                  maxLength: 2,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(hintText: 'S', counterText: ''),
                ),
              ]),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const FieldLabel('Last Name', required: true),
                TextField(
                  controller: _last,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(hintText: 'e.g. Dela Cruz'),
                ),
              ]),
            ),
          ]),
          const SizedBox(height: 12),
          _dateField('Date Appointed (Campus Starting Date)', _startingDate,
              'Your official appointment date on campus. Formats the date segment of your generated ID number. Official contract terms are assigned by HRMO.'),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(child: FieldLabel('Assigned Department / Academic Unit')),
              Row(mainAxisSize: MainAxisSize.min, children: const [
                Icon(Icons.lock_outline, size: 12, color: AppColors.brand700),
                SizedBox(width: 4),
                Text('Pre-assigned by HR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.brand700)),
              ]),
            ],
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: Text(
              _dept,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink800),
            ),
          ),
          const SizedBox(height: 14),
          const FieldLabel('Password', required: true),
          PasswordField(controller: _password, hint: 'Min. 8 characters', onChanged: (_) => setState(() {})),
          const SizedBox(height: 8),
          RequirementRow('At least 8 characters', _hasLen),
          RequirementRow('Uppercase & lowercase letters', _hasUpper && _hasLower),
          RequirementRow('At least one number', _hasNum),
          RequirementRow('At least one special character', _hasSpecial),
          const SizedBox(height: 10),
          const FieldLabel('Confirm Password', required: true),
          PasswordField(controller: _confirm, hint: 'Re-type password', onChanged: (_) => setState(() {})),
          const SizedBox(height: 12),
          InkWell(
            onTap: () => setState(() => _agreed = !_agreed),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Checkbox(
                value: _agreed,
                visualDensity: VisualDensity.compact,
                onChanged: (v) => setState(() => _agreed = v ?? false),
              ),
              const Expanded(
                child: Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: Text(
                    'I affirm that the institutional details provided are true and correct under Eastern Visayas State University guidelines.',
                    style: TextStyle(fontSize: 12, color: AppColors.ink700, height: 1.45),
                  ),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: _submitting || _validating || !_agreed ? null : _submit,
            child: Text(_submitting ? 'Registering & Activating...' : 'Complete COS Staff Registration'),
          ),
          const SizedBox(height: 8),
          TextButton(onPressed: widget.onBackToLogin, child: const Text('← Back to Sign In')),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0))),
            child: const MutedText(
              'If the assigned department above is incorrect, please contact the Human Resource Management & Development Office (HRMDO) to issue an updated registration invitation.',
              size: 11.5,
              align: TextAlign.center,
            ),
          ),
        ];
}
