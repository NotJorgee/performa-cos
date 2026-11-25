import 'package:flutter/material.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

/// Prompts newly onboarded COS Employees to provide their required job designation,
/// contact phone, emergency contact, and office assignment (port of CompleteProfileModal.jsx).
Future<void> showCompleteProfileDialog(BuildContext context) {
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => const _CompleteProfileDialog(),
  );
}

class _CompleteProfileDialog extends StatefulWidget {
  const _CompleteProfileDialog();

  @override
  State<_CompleteProfileDialog> createState() => _CompleteProfileDialogState();
}

class _CompleteProfileDialogState extends State<_CompleteProfileDialog> {
  final _job = TextEditingController();
  final _phone = TextEditingController();
  final _emergency = TextEditingController();
  final _office = TextEditingController();

  bool _submitting = false;
  String? _error;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final user = AppScope.read(context).user;
    if (user != null) {
      final j = user.jobTitle.trim();
      if (j.isNotEmpty && j != 'COS Staff' && j != 'COS Employee') {
        _job.text = j;
      }
      _phone.text = user.contactNumber;
      _emergency.text = user.emergencyContact;
      _office.text = user.officeLocation;
    }
  }

  @override
  void dispose() {
    _job.dispose();
    _phone.dispose();
    _emergency.dispose();
    _office.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    final cleanJob = _job.text.trim();
    final cleanPhone = _phone.text.trim();
    final cleanEmergency = _emergency.text.trim();
    final cleanOffice = _office.text.trim();

    if (cleanJob.isEmpty) {
      setState(() => _error = 'Please enter your Job Position or Designation.');
      return;
    }
    if (cleanPhone.isEmpty) {
      setState(() => _error = 'Please enter your official contact / mobile phone number.');
      return;
    }
    if (cleanEmergency.isEmpty) {
      setState(() => _error = 'Please enter your emergency contact person and phone number.');
      return;
    }
    if (cleanOffice.isEmpty) {
      setState(() => _error = 'Please enter your assigned office station or room assignment.');
      return;
    }

    final state = AppScope.read(context);
    final user = state.user;
    if (user == null) return;

    setState(() => _submitting = true);
    try {
      final payload = {
        'job_title': cleanJob,
        'contact_number': cleanPhone,
        'emergency_contact': cleanEmergency,
        'office_location': cleanOffice,
      };
      await Api.instance.updateContact(user.id, payload);
      await Api.instance.updateStoredUser({
        'jobTitle': cleanJob,
        'job_title': cleanJob,
        'contactNumber': cleanPhone,
        'contact_number': cleanPhone,
        'emergencyContact': cleanEmergency,
        'emergency_contact': cleanEmergency,
        'officeLocation': cleanOffice,
        'office_location': cleanOffice,
      });
      state.updateUser(user.copyWith(
        jobTitle: cleanJob,
        contactNumber: cleanPhone,
        emergencyContact: cleanEmergency,
        officeLocation: cleanOffice,
      ));
      if (!mounted) return;
      Navigator.of(context).pop();
      showToast(context, 'Personnel profile completed and saved!');
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString().isEmpty ? 'Failed to update profile. Please try again.' : e.toString());
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.fromLTRB(18, 16, 10, 14),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: AppColors.line)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.how_to_reg_outlined, color: Color(0xFFB45309), size: 22),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Complete Personnel Profile',
                            style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800, color: AppColors.ink900),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Please enter your job title and contact details to finish setting up your account.',
                            style: TextStyle(fontSize: 12.5, color: AppColors.ink500, height: 1.4),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: _submitting ? null : () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close, size: 20, color: AppColors.ink500),
                      tooltip: 'Close',
                    ),
                  ],
                ),
              ),
              // Form Body
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_error != null) FlashBanner(_error!),
                    const FieldLabel('Job Position / Designation', required: true),
                    TextField(
                      controller: _job,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.work_outline, size: 18),
                        hintText: 'e.g. Administrative Aide VI / Instructor I',
                      ),
                    ),
                    const SizedBox(height: 4),
                    const MutedText('Your role or position on campus. HR can adjust this if needed.', size: 11),
                    const SizedBox(height: 14),

                    const FieldLabel('Official Contact / Mobile Number', required: true),
                    TextField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.phone_outlined, size: 18),
                        hintText: 'e.g. 0123 456 7890',
                      ),
                    ),
                    const SizedBox(height: 4),
                    const MutedText('Used by HRMO and your department head for official communications.', size: 11),
                    const SizedBox(height: 14),

                    const FieldLabel('Emergency Contact Person & Phone', required: true),
                    TextField(
                      controller: _emergency,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.contact_emergency_outlined, size: 18),
                        hintText: 'e.g. Juan Dela Cruz (Spouse) - 0123 456 7890',
                      ),
                    ),
                    const SizedBox(height: 4),
                    const MutedText('Primary contact person in case of campus emergencies.', size: 11),
                    const SizedBox(height: 14),

                    const FieldLabel('Office Station / Room Assignment', required: true),
                    TextField(
                      controller: _office,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.location_on_outlined, size: 18),
                        hintText: 'e.g. IT Building, IT Office',
                      ),
                    ),
                    const SizedBox(height: 4),
                    const MutedText('Your assigned office, department laboratory, or workstation on campus.', size: 11),
                    const SizedBox(height: 18),

                    SizedBox(
                      height: 46,
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submit,
                        child: Text(
                          _submitting ? 'Saving Profile...' : 'Save & Complete Profile',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
