import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/api.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../utils/id_generator.dart';
import '../../utils/invite_link.dart';
import '../../widgets/common.dart';
import 'auth_widgets.dart';

const universityTitles = ['None', 'Engr.', 'Dr.', 'Prof.', 'Assoc. Prof.', 'Asst. Prof.', 'Instr.', 'Atty.', 'Arch.'];

/// Invitation-based COS Employee registration (port of the COS branch of auth/TokenizedSignUp.jsx).
/// Administrator / Department Head invitations are refused and pointed to the main web portal.
///
/// The screen is opened only from the invitation link HRMDO emails to the employee; the link
/// carries [invitationToken], so the employee never types a token. If the link could not be
/// opened in the app (e.g. the e-mail client stripped it), the employee can paste the link.
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
  final _job = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  String _titlePrefix = 'None';
  DateTime _startingDate = DateTime.now();
  DateTime _contractStartDate = DateTime.now();
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

  Future<void> _pickDate(bool contract) async {
    final initial = contract ? _contractStartDate : _startingDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1980),
      lastDate: DateTime(DateTime.now().year + 2),
    );
    if (picked != null) setState(() => contract ? _contractStartDate = picked : _startingDate = picked);
  }

  Future<void> _submit() async {
    setState(() => _formError = null);
    final token = _token.trim();
    final first = _first.text.trim();
    final middle = _middle.text.trim();
    final last = _last.text.trim();

    String? err;
    if (token.isEmpty || _tokenData == null) {
      err = 'Please open the invitation link sent to your email to register.';
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
        'email': _email.text.trim(),
        'full_name': fullName,
        'first_name': first,
        'middle_initial': middle,
        'last_name': last,
        'title': _titlePrefix != 'None' ? _titlePrefix : null,
        'starting_date': isoDate(_startingDate),
        'contract_start_date': isoDate(_contractStartDate),
        'password': _password.text,
        'role': cosEmployeeRole,
        'job_title': _job.text.trim(),
        'contact_number': _phone.text.trim(),
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

  Widget _dateField(String label, DateTime value, String help, bool contract) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FieldLabel(label, required: true),
          InkWell(
            onTap: () => _pickDate(contract),
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
    final generatedId = generateEvsuEmployeeId(
      firstName: _first.text,
      middleInitial: _middle.text,
      lastName: _last.text,
      startingDate: _startingDate,
    );

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
          if (_tokenData != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0))),
              child: Row(children: [
                const CircleAvatar(
                    radius: 18, backgroundColor: Color(0xFF10B981), child: Icon(Icons.check, color: Colors.white, size: 20)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Institutional COS Employee Onboarding',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF065F46))),
                    Text('Assigned to ${_tokenData!['department_name'] ?? 'Eastern Visayas State University'}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF047857))),
                  ]),
                ),
                StatusBadge('${_tokenData!['role'] ?? 'COS Staff'}'.toUpperCase(),
                    bg: const Color(0xFFD1FAE5), fg: const Color(0xFF065F46)),
              ]),
            ),
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
          if (_tokenData != null) ..._form(generatedId),
        ],
      ),
    );
  }

  /// The registration form, shown only once the invitation link has been verified.
  List<Widget> _form(String generatedId) => [
          if (_formError != null) FlashBanner(_formError!),
          const FieldLabel('Institutional Email', required: true),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(hintText: 'name@evsu.edu.ph'),
          ),
          const SizedBox(height: 12),
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
                  onChanged: (_) => setState(() {}),
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
                  onChanged: (_) => setState(() {}),
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
                  onChanged: (_) => setState(() {}),
                ),
              ]),
            ),
          ]),
          const SizedBox(height: 12),
          _dateField('Starting Date', _startingDate, 'Original hiring date on campus. Formats your official ID.', false),
          const SizedBox(height: 12),
          _dateField('Contract Start Date', _contractStartDate, 'Active contract evaluation cycle.', true),
          const SizedBox(height: 12),
          const FieldLabel('Assigned Department / Academic Unit'),
          TextField(
            enabled: false,
            controller: TextEditingController(text: _dept),
            decoration: const InputDecoration(fillColor: Color(0xFFF1F5F9)),
          ),
          const SizedBox(height: 12),
          const FieldLabel('Job Position / Designation'),
          TextField(
            controller: _job,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(hintText: 'e.g. Administrative Aide VI'),
          ),
          const SizedBox(height: 12),
          const FieldLabel('Official Contact Number'),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(hintText: '+63 9XX XXX XXXX'),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: AppColors.brand50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.brandBorder)),
            child: Row(children: [
              const Expanded(
                child: Text('System Generated Official ID:',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.ink700)),
              ),
              Text(generatedId,
                  style: const TextStyle(
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.w800,
                      color: AppColors.brand700,
                      letterSpacing: 0.6)),
            ]),
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
