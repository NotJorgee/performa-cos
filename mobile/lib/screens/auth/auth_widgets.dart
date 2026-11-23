import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/common.dart';

/// Centered seal + "PerformaCOS / Eastern Visayas State University" header used by the
/// registration and recovery screens (.auth-header-center).
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
    this.maxWidth = 460,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 28, 16, 28),
          children: [
            Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: maxWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Image.asset('assets/images/evsu-seal.png', height: 72),
                    const SizedBox(height: 10),
                    const Text('PerformaCOS',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.brand700)),
                    const Text('Eastern Visayas State University',
                        textAlign: TextAlign.center, style: TextStyle(color: AppColors.ink500, fontSize: 13)),
                    const SizedBox(height: 20),
                    AppCard(
                      padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          MutedText(subtitle, size: 12.5),
                          const SizedBox(height: 18),
                          ...children,
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Password field with show / hide toggle.
class PasswordField extends StatefulWidget {
  const PasswordField({super.key, required this.controller, this.hint = '••••••••••', this.onChanged});
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _show = false;
  @override
  Widget build(BuildContext context) => TextField(
        controller: widget.controller,
        obscureText: !_show,
        onChanged: widget.onChanged,
        autocorrect: false,
        enableSuggestions: false,
        decoration: InputDecoration(
          hintText: widget.hint,
          suffixIcon: IconButton(
            tooltip: _show ? 'Hide password' : 'Show password',
            icon: Icon(_show ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
            onPressed: () => setState(() => _show = !_show),
          ),
        ),
      );
}

class RequirementRow extends StatelessWidget {
  const RequirementRow(this.label, this.ok, {super.key});
  final String label;
  final bool ok;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 3),
        child: Row(children: [
          Icon(ok ? Icons.check_circle : Icons.radio_button_unchecked,
              size: 15, color: ok ? AppColors.green600 : AppColors.ink300),
          const SizedBox(width: 6),
          Expanded(
            child: Text(label,
                style: TextStyle(fontSize: 12.5, color: ok ? AppColors.green700 : AppColors.ink500)),
          ),
        ]),
      );
}
