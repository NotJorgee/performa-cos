import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/app_shell.dart';
import '../widgets/avatar_crop_dialog.dart';
import '../widgets/common.dart';
import 'auth/auth_widgets.dart';

/// Personal Profile & Security (port of auth/ProfileSettings.jsx): profile overview,
/// password, notification preferences (policy-enforced for COS) and active sessions.
class ProfileSettingsScreen extends StatefulWidget {
  const ProfileSettingsScreen({super.key, this.initialTab = 'profile'});
  final String initialTab;
  @override
  State<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  late String _tab = _tabFor(widget.initialTab);

  final _contact = TextEditingController();
  final _altEmail = TextEditingController();
  final _emergency = TextEditingController();
  final _office = TextEditingController();
  String? _avatarUrl;
  Uint8List? _avatarBytes;
  bool _pendingAvatar = false;
  bool _savingProfile = false;

  final _currentPw = TextEditingController();
  final _newPw = TextEditingController();
  final _confirmPw = TextEditingController();
  bool _updatingPw = false;

  Map<String, dynamic>? _currentSession;
  List<Map<String, dynamic>> _otherSessions = [];
  bool _loadingSessions = false;
  bool _initialized = false;

  static String _tabFor(String v) => switch (v) {
        'change_password' || 'security' => 'security',
        'notifications' => 'notifications',
        'sessions' => 'sessions',
        _ => 'profile',
      };

  @override
  void didUpdateWidget(covariant ProfileSettingsScreen old) {
    super.didUpdateWidget(old);
    if (old.initialTab != widget.initialTab) _setTab(_tabFor(widget.initialTab));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final user = AppScope.read(context).user!;
    _contact.text = user.contactNumber;
    _altEmail.text = user.alternateEmail;
    _emergency.text = user.emergencyContact;
    _office.text = user.officeLocation;
    _avatarUrl = user.avatarUrl;
    _loadFreshProfile();
    if (_tab == 'sessions') _loadSessions();
  }

  Future<void> _loadFreshProfile() async {
    try {
      final me = await Api.instance.getMe();
      if (!mounted) return;
      setState(() {
        _contact.text = '${me['contactNumber'] ?? ''}';
        _altEmail.text = '${me['alternateEmail'] ?? ''}';
        _emergency.text = '${me['emergencyContact'] ?? ''}';
        _office.text = '${me['officeLocation'] ?? ''}';
        if ((me['avatarUrl'] ?? '').toString().isNotEmpty && !_pendingAvatar) _avatarUrl = me['avatarUrl'].toString();
      });
    } catch (_) {}
  }

  void _setTab(String t) {
    setState(() => _tab = t);
    if (t == 'sessions') _loadSessions();
  }

  // ---------------- Profile ----------------
  Future<void> _pickAvatar() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.photo_camera_outlined),
            title: const Text('Take a photo'),
            onTap: () => Navigator.pop(ctx, ImageSource.camera),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library_outlined),
            title: const Text('Choose from gallery'),
            onTap: () => Navigator.pop(ctx, ImageSource.gallery),
          ),
        ]),
      ),
    );
    if (source == null) return;
    final file = await ImagePicker().pickImage(source: source, maxWidth: 1600, maxHeight: 1600, imageQuality: 90);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    if (!mounted) return;
    final cropped = await showAvatarCropDialog(context, bytes);
    if (cropped == null || !mounted) return;
    setState(() {
      _avatarBytes = cropped;
      _pendingAvatar = true;
    });
    showToast(context, 'Photo cropped. Tap "Save Profile Changes" below to submit changes.');
  }

  void _removePhoto() {
    setState(() {
      _avatarBytes = null;
      _avatarUrl = null;
      _pendingAvatar = true;
    });
    showToast(context, 'Profile photo removed. Tap "Save Profile Changes" below to submit.');
  }

  Future<void> _saveProfile() async {
    final state = AppScope.read(context);
    final user = state.user!;
    setState(() => _savingProfile = true);
    try {
      var finalUrl = _avatarUrl;
      if (_avatarBytes != null) {
        final up = await Api.instance.uploadAvatar(_avatarBytes!, 'avatar_${user.id}.png');
        final url = (up is Map ? up['url'] : null)?.toString();
        if (url == null || url.isEmpty) throw ApiException('Avatar upload did not return a storage URL.');
        finalUrl = url;
      }
      await Api.instance.updateContact(user.id, {
        'contact_number': _contact.text.trim(),
        'alternate_email': _altEmail.text.trim(),
        'emergency_contact': _emergency.text.trim(),
        'office_location': _office.text.trim(),
        'avatar_url': finalUrl,
      });
      await Api.instance.updateStoredUser({
        'contactNumber': _contact.text.trim(),
        'alternateEmail': _altEmail.text.trim(),
        'emergencyContact': _emergency.text.trim(),
        'officeLocation': _office.text.trim(),
        'avatarUrl': finalUrl,
      });
      state.updateUser(user.copyWith(
        avatarUrl: finalUrl,
        clearAvatar: finalUrl == null,
        contactNumber: _contact.text.trim(),
        alternateEmail: _altEmail.text.trim(),
        emergencyContact: _emergency.text.trim(),
        officeLocation: _office.text.trim(),
      ));
      if (!mounted) return;
      setState(() {
        _avatarUrl = finalUrl;
        _avatarBytes = null;
        _pendingAvatar = false;
      });
      showToast(context, 'Profile and photo updated successfully.');
    } catch (e) {
      if (mounted) showToast(context, e.toString().isEmpty ? 'Failed to update contact information.' : e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  // ---------------- Password ----------------
  Future<void> _changePassword() async {
    final next = _newPw.text;
    final score = [
      next.length >= 8,
      RegExp(r'[A-Z]').hasMatch(next),
      RegExp(r'[0-9]').hasMatch(next),
      RegExp(r'[^A-Za-z0-9]').hasMatch(next),
    ].where((x) => x).length;
    if (_currentPw.text.isEmpty || next.isEmpty || _confirmPw.text.isEmpty) {
      showToast(context, 'Please fill in all password fields.', error: true);
      return;
    }
    if (next != _confirmPw.text) {
      showToast(context, 'New password and confirmation do not match.', error: true);
      return;
    }
    if (score < 3) {
      showToast(context, 'Please choose a stronger password matching the security criteria (at least 3 criteria satisfied).',
          error: true);
      return;
    }
    setState(() => _updatingPw = true);
    try {
      await Api.instance.changePassword(AppScope.read(context).user!.id, _currentPw.text, next);
      _currentPw.clear();
      _newPw.clear();
      _confirmPw.clear();
      if (mounted) showToast(context, 'Password successfully updated.');
    } catch (e) {
      if (mounted) showToast(context, e.toString().isEmpty ? 'Failed to update password.' : e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _updatingPw = false);
    }
  }

  // ---------------- Sessions ----------------
  Future<void> _loadSessions() async {
    setState(() => _loadingSessions = true);
    try {
      final list = (await Api.instance.sessions()).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      if (!mounted) return;
      setState(() {
        _currentSession = list.firstWhere((s) => s['isCurrentSession'] == true,
            orElse: () => list.isNotEmpty ? list.first : <String, dynamic>{});
        _otherSessions = list.where((s) => s['isCurrentSession'] != true).toList();
      });
    } catch (e) {
      if (mounted) showToast(context, 'Failed to load user sessions: $e', error: true);
    } finally {
      if (mounted) setState(() => _loadingSessions = false);
    }
  }

  Future<void> _revoke(int id) async {
    try {
      await Api.instance.revokeSession(id);
      setState(() => _otherSessions.removeWhere((s) => s['id'] == id));
      if (mounted) showToast(context, 'Selected device session was revoked successfully.');
    } catch (e) {
      if (mounted) showToast(context, e.toString(), error: true);
    }
  }

  Future<void> _revokeAll() async {
    try {
      await Api.instance.revokeOtherSessions();
      setState(() => _otherSessions = []);
      if (mounted) showToast(context, 'All other device sessions have been terminated. You remain active on this device.');
    } catch (e) {
      if (mounted) showToast(context, e.toString(), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final tabs = [
      ('profile', Icons.person_outline, 'Profile Overview'),
      ('security', Icons.key_outlined, 'Security & Credentials'),
      ('notifications', Icons.notifications_none, 'Notifications'),
      ('sessions', Icons.devices_outlined, 'Active Sessions'),
    ];
    return PageBody(
      maxWidth: 860,
      children: [
        PageHeader(
          title: 'Personal Profile & Security',
          icon: Icons.person_outline,
          subtitle: 'Manage your personal contact info, review official institutional credentials, and secure your account.',
          onBack: () => state.navigate('dashboard'),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            for (final (key, icon, label) in tabs)
              Padding(
                padding: const EdgeInsets.only(right: 8, bottom: 16),
                child: _tab == key
                    ? ElevatedButton.icon(
                        onPressed: () => _setTab(key), icon: Icon(icon, size: 16), label: Text(label))
                    : OutlinedButton.icon(
                        onPressed: () => _setTab(key), icon: Icon(icon, size: 16), label: Text(label)),
              ),
          ]),
        ),
        ...switch (_tab) {
          'security' => _security(),
          'notifications' => _notifications(),
          'sessions' => _sessions(),
          _ => _profile(state.user!),
        },
      ],
    );
  }

  List<Widget> _profile(CurrentUser user) {
    Widget avatar() {
      const size = 92.0;
      Widget inner;
      if (_avatarBytes != null) {
        inner = Image.memory(_avatarBytes!, fit: BoxFit.cover);
      } else if (_avatarUrl != null) {
        inner = Image.network(_avatarUrl!, fit: BoxFit.cover, errorBuilder: (_, _, _) => _initials(user));
      } else {
        inner = _initials(user);
      }
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
            shape: BoxShape.circle, color: AppColors.brand600, border: Border.all(color: AppColors.brandBorder, width: 3)),
        clipBehavior: Clip.antiAlias,
        child: inner,
      );
    }

    InputDecoration dec(String hint) => InputDecoration(hintText: hint);

    return [
      AppCard(
        child: Column(children: [
          avatar(),
          const SizedBox(height: 12),
          Text(user.fullName, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 6, children: [
            StatusBadge.tone('COS Personnel', 'completed', icon: Icons.person_outline),
            StatusBadge.tone(user.jobTitle, 'inactive'),
            StatusBadge.tone('EVSU — Ormoc Campus', 'inactive'),
          ]),
          const SizedBox(height: 14),
          Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 8, children: [
            OutlinedButton.icon(
                onPressed: _pickAvatar, icon: const Icon(Icons.photo_camera_outlined, size: 16), label: const Text('Change Photo')),
            if (_avatarUrl != null || _avatarBytes != null)
              OutlinedButton.icon(
                onPressed: _removePhoto,
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.red600),
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Remove'),
              ),
          ]),
          if (_pendingAvatar) ...[
            const SizedBox(height: 10),
            StatusBadge.tone('Unsaved photo change ready', 'pending'),
          ],
        ]),
      ),
      AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const CardTitle('Official Institutional Identity', bottom: 4),
          const MutedText(
              'Official university personnel records are maintained by the Human Resource Management Office. For legal name or primary assignment adjustments, please contact the HR office.',
              size: 12.5),
          const SizedBox(height: 14),
          InfoTile(label: 'Employee ID', value: user.employeeIdNumber.isEmpty ? '—' : user.employeeIdNumber, valueColor: AppColors.brand700),
          InfoTile(label: 'Employee Job Title', value: user.jobTitle),
          InfoTile(label: 'Institutional Email', value: user.email.isEmpty ? '—' : user.email),
          InfoTile(label: 'Assigned Department', value: user.department),
          InfoTile(label: 'System Role & Access Tier', value: user.role),
        ]),
      ),
      AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const CardTitle('Personal Contact & Operational Info', bottom: 4),
          const MutedText(
              'Self-service contact information utilized for operational routing, deadline reminders, and emergency communications.',
              size: 12.5),
          const SizedBox(height: 14),
          const FieldLabel('Mobile Contact Number'),
          TextField(controller: _contact, keyboardType: TextInputType.phone, decoration: dec('Enter mobile number')),
          const SizedBox(height: 12),
          const FieldLabel('Alternate Recovery Email'),
          TextField(controller: _altEmail, keyboardType: TextInputType.emailAddress, decoration: dec('Enter alternate email')),
          const SizedBox(height: 12),
          const FieldLabel('Emergency Contact Person & Phone'),
          TextField(controller: _emergency, decoration: dec('Enter emergency contact person & phone')),
          const SizedBox(height: 12),
          const FieldLabel('Office Station / Room Location'),
          TextField(controller: _office, decoration: dec('Enter office / room location')),
          const SizedBox(height: 18),
          SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _savingProfile ? null : _saveProfile,
              icon: const Icon(Icons.save_outlined, size: 17),
              label: Text(_savingProfile ? 'Saving Changes…' : 'Save Profile Changes'),
            ),
          ),
        ]),
      ),
    ];
  }

  Widget _initials(CurrentUser u) => Center(
        child: Text(u.initials, style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800)),
      );

  List<Widget> _security() {
    final p = _newPw.text;
    final checks = [
      ('At least 8 characters', p.length >= 8),
      ('One uppercase letter', RegExp(r'[A-Z]').hasMatch(p)),
      ('One number', RegExp(r'[0-9]').hasMatch(p)),
      ('One special character', RegExp(r'[^A-Za-z0-9]').hasMatch(p)),
    ];
    final score = checks.where((c) => c.$2).length;
    final (label, color) = p.isEmpty
        ? ('Not entered', AppColors.ink500)
        : score <= 1
            ? ('Weak', AppColors.red600)
            : score == 2
                ? ('Fair', AppColors.amber600)
                : score == 3
                    ? ('Good', const Color(0xFF0284C7))
                    : ('Strong', AppColors.green700);
    final mismatch = _confirmPw.text.isNotEmpty && _confirmPw.text != p;

    return [
      AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const CardTitle('Change Account Password', bottom: 4),
          const MutedText(
              'Ensure your new password meets the security requirements below. Your password is encrypted and stored securely.',
              size: 12.5),
          const SizedBox(height: 14),
          const FieldLabel('Current Password'),
          PasswordField(controller: _currentPw, hint: '••••••••••••'),
          const SizedBox(height: 12),
          const FieldLabel('New Password'),
          PasswordField(controller: _newPw, hint: '••••••••••••', onChanged: (_) => setState(() {})),
          const SizedBox(height: 10),
          Row(children: [
            const Text('Strength: ', style: TextStyle(fontSize: 12.5, color: AppColors.ink700)),
            Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: color)),
          ]),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
                value: score / 4, minHeight: 6, color: color, backgroundColor: const Color(0xFFEEF1F6)),
          ),
          const SizedBox(height: 10),
          const Text('Password Security Criteria:',
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.ink700)),
          const SizedBox(height: 4),
          for (final (l, ok) in checks) RequirementRow(l, ok),
          const SizedBox(height: 12),
          const FieldLabel('Confirm New Password'),
          PasswordField(controller: _confirmPw, hint: '••••••••••••', onChanged: (_) => setState(() {})),
          if (mismatch)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text('Passwords do not match.', style: TextStyle(color: AppColors.red600, fontSize: 12)),
            ),
          const SizedBox(height: 18),
          SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _updatingPw ? null : _changePassword,
              icon: const Icon(Icons.lock_reset, size: 17),
              label: Text(_updatingPw ? 'Updating Password…' : 'Update Password'),
            ),
          ),
        ]),
      ),
    ];
  }

  List<Widget> _notifications() {
    Widget pref(String title, String desc) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.line)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Padding(
              padding: EdgeInsets.only(top: 2),
              child: Icon(Icons.check_box, color: AppColors.brand600, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Wrap(spacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  Text(title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
                  StatusBadge.tone('Mandatory', 'active', icon: Icons.lock_outline),
                ]),
                const SizedBox(height: 4),
                MutedText(desc, size: 12),
              ]),
            ),
          ]),
        );

    return [
      AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            const Expanded(child: CardTitle('Notification & Communication Preferences', bottom: 0)),
            StatusBadge.tone('Policy Enforced', 'pending', icon: Icons.lock_outline),
          ]),
          const SizedBox(height: 12),
          const FlashBanner(
            'Mandatory University Compliance Policy — In accordance with EVSU HRMO Contract of Service (COS) guidelines, institutional alerts for contract expiration, renewal intent windows, monthly report cut-offs, and evaluation milestones are statutory requirements and cannot be disabled by personnel.',
            tone: FlashTone.warning,
            icon: Icons.shield_outlined,
          ),
          pref('Evaluation & Monthly Report Deadlines',
              'Reminders before DAR cut-offs, monthly report compilation windows, and evaluation deadlines.'),
          pref('Contract Renewal & Expiration Warnings',
              'Advance notices when your contract nears expiration and the renewal intent window opens.'),
          pref('Review Confirmations & Feedback Updates',
              'Immediate alerts when a supervisor signs a monthly report or releases triad evaluation results.'),
          const SizedBox(height: 4),
          const Row(children: [
            Icon(Icons.verified_user_outlined, size: 16, color: AppColors.green700),
            SizedBox(width: 6),
            Text('Preferences Enforced by University Policy',
                style: TextStyle(fontSize: 12.5, color: AppColors.green700, fontWeight: FontWeight.w600)),
          ]),
        ]),
      ),
    ];
  }

  List<Widget> _sessions() {
    String lastActive(dynamic iso) {
      final d = DateTime.tryParse('${iso ?? ''}');
      return d == null ? 'Recently Active' : DateFormat('MMM d, yyyy h:mm a').format(d.toLocal());
    }

    IconData iconFor(Map<String, dynamic> s) =>
        '${s['deviceDescription'] ?? ''}'.toLowerCase().contains(RegExp(r'phone|android|ios|mobile'))
            ? Icons.smartphone
            : Icons.laptop;

    Widget tile(Map<String, dynamic> s, {required bool current}) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: current ? AppColors.green50 : AppColors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: current ? AppColors.greenBorder : AppColors.line),
          ),
          child: Row(children: [
            Icon(iconFor(s), color: current ? AppColors.green700 : AppColors.ink700),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${s['deviceDescription'] ?? 'Mobile App'}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                MutedText('${s['networkInfo'] ?? 'Broadband'} (IP: ${s['ipAddress'] ?? '127.0.0.1'})', size: 12),
                MutedText(current ? 'Active Now (This Device)' : lastActive(s['lastActive']), size: 12),
              ]),
            ),
            if (current)
              StatusBadge.tone('Current Session', 'completed')
            else
              TextButton(
                onPressed: () => _revoke((s['id'] as num).toInt()),
                style: TextButton.styleFrom(foregroundColor: AppColors.red600),
                child: const Text('Revoke Session'),
              ),
          ]),
        );

    return [
      AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const CardTitle('Active Sessions & Devices', bottom: 4),
          const MutedText(
              'Review all active logins across campus desktop workstations, home computers, and mobile devices.', size: 12.5),
          const SizedBox(height: 12),
          if (_otherSessions.isNotEmpty)
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: _revokeAll,
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.red600),
                icon: const Icon(Icons.logout, size: 16),
                label: const Text('Sign Out All Other Sessions'),
              ),
            ),
          const SizedBox(height: 12),
          if (_loadingSessions)
            const LoadingRow('Loading active sessions…')
          else ...[
            if (_currentSession != null && _currentSession!.isNotEmpty) tile(_currentSession!, current: true),
            for (final s in _otherSessions) tile(s, current: false),
            if (_otherSessions.isEmpty)
              const MutedText('No other active sessions. You are only signed in on this current device.', size: 12.5),
          ],
        ]),
      ),
    ];
  }
}
