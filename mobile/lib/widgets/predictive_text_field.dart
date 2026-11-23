import 'dart:async';

import 'package:flutter/material.dart';

import '../services/api.dart';
import '../theme.dart';

/// AI ghost-text autocomplete (port of common/PredictiveTextarea.jsx).
/// After a 350ms typing pause it asks /ai/predictive-text for a continuation, shows it as
/// ghost text under the field, and lets the user tap it (or "Accept") to append it.
class PredictiveTextField extends StatefulWidget {
  const PredictiveTextField({
    super.key,
    required this.controller,
    required this.contextType,
    required this.fieldName,
    this.role = 'COS Personnel',
    this.department = 'Computer Studies Department',
    this.hintText,
    this.minLines = 4,
    this.enabled = true,
    this.validator,
  });

  final TextEditingController controller;
  final String contextType;
  final String fieldName;
  final String role;
  final String department;
  final String? hintText;
  final int minLines;
  final bool enabled;
  final FormFieldValidator<String>? validator;

  @override
  State<PredictiveTextField> createState() => _PredictiveTextFieldState();
}

class _PredictiveTextFieldState extends State<PredictiveTextField> {
  Timer? _debounce;
  String _ghost = '';
  String _lastFetched = '';
  bool _justAccepted = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    widget.controller.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() {
    _debounce?.cancel();
    final trimmed = widget.controller.text.trim();
    if (!widget.enabled || trimmed.length < 3) {
      if (_ghost.isNotEmpty) setState(() => _ghost = '');
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), () => _fetch(widget.controller.text));
  }

  Future<void> _fetch(String text) async {
    final trimmed = text.trim();
    if (trimmed == _lastFetched) return;
    _lastFetched = trimmed;
    try {
      final res = await Api.instance.predictText({
        'context_type': widget.contextType,
        'current_text': text,
        'field_name': widget.fieldName,
        'employee_role': widget.role,
        'department': widget.department,
      });
      if (!mounted) return;
      // Discard if the user kept typing while the request was in flight
      if (widget.controller.text.trim() == trimmed) {
        setState(() => _ghost = (res['ghost_text'] ?? '').toString());
      }
    } catch (_) {
      // Predictive text is best-effort.
    }
  }

  void _accept() {
    final current = widget.controller.text;
    final ghost = _ghost.trim();
    if (ghost.isEmpty || current.trim().length < 3) {
      setState(() => _ghost = '');
      return;
    }
    var sep = ' ';
    if (current.endsWith(' ') || current.endsWith('\n') || RegExp(r'^[,.;:]').hasMatch(ghost)) sep = '';
    final next = '$current$sep$ghost';
    _lastFetched = next.trim();
    widget.controller.value = TextEditingValue(
      text: next,
      selection: TextSelection.collapsed(offset: next.length),
    );
    setState(() {
      _ghost = '';
      _justAccepted = true;
    });
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) setState(() => _justAccepted = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: widget.controller,
          enabled: widget.enabled,
          minLines: widget.minLines,
          maxLines: widget.minLines + 4,
          validator: widget.validator,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(hintText: widget.hintText),
        ),
        if (_ghost.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Material(
              color: AppColors.brand50,
              borderRadius: BorderRadius.circular(8),
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: _accept,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(10, 8, 6, 8),
                  child: Row(
                    children: [
                      const Icon(Icons.auto_awesome, size: 15, color: AppColors.brand600),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text('…${_ghost.trim()}',
                            style: const TextStyle(
                                color: AppColors.ink500, fontStyle: FontStyle.italic, fontSize: 13)),
                      ),
                      TextButton.icon(
                        onPressed: _accept,
                        icon: const Icon(Icons.subdirectory_arrow_left, size: 15),
                        label: const Text('Accept'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.brand700,
                          visualDensity: VisualDensity.compact,
                          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        if (_justAccepted)
          const Padding(
            padding: EdgeInsets.only(top: 6),
            child: Row(children: [
              Icon(Icons.check, size: 14, color: AppColors.green700),
              SizedBox(width: 4),
              Text('Suggestion added',
                  style: TextStyle(color: AppColors.green700, fontSize: 12, fontWeight: FontWeight.w600)),
            ]),
          ),
      ],
    );
  }
}
