import 'dart:ui';
import 'package:flutter/material.dart';

/// Universal confirmation dialog matching src/components/common/ConfirmModal.jsx.
/// Features blurred backdrop, variant styling, icon badge, clear typography,
/// and cancel/confirm action buttons.
class ConfirmDialog extends StatelessWidget {
  const ConfirmDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmText = 'Confirm',
    this.cancelText = 'Cancel',
    this.variant = 'brand',
    this.icon,
  });

  final String title;
  final String message;
  final String confirmText;
  final String cancelText;
  final String variant;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final style = _getVariantStyle();
    final iconData = icon ?? style.defaultIcon;

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
      child: Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 460),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 25,
                offset: const Offset(0, 15),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header & Body
              Padding(
                padding: const EdgeInsets.fromLTRB(22, 22, 16, 20),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon Box
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: style.iconBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: style.iconBorder),
                      ),
                      child: Icon(iconData, size: 22, color: style.iconColor),
                    ),
                    const SizedBox(width: 14),
                    // Title & Message
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontSize: 16.5,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            message,
                            style: const TextStyle(
                              fontSize: 13.5,
                              color: Color(0xFF475569),
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Close (x) button
                    IconButton(
                      icon: const Icon(Icons.close, size: 18, color: Color(0xFF94A3B8)),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                      tooltip: 'Close',
                      onPressed: () => Navigator.of(context).pop(false),
                    ),
                  ],
                ),
              ),
              // Divider
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              // Actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF475569),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      child: Text(cancelText),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: style.btnBg,
                        foregroundColor: style.btnColor,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      child: Text(confirmText),
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

  _VariantStyle _getVariantStyle() {
    switch (variant) {
      case 'danger':
        return _VariantStyle(
          iconColor: const Color(0xFFDC2626),
          iconBg: const Color(0xFFFEF2F2),
          iconBorder: const Color(0xFFFECACA),
          btnBg: const Color(0xFFDC2626),
          btnColor: Colors.white,
          defaultIcon: Icons.warning_amber_rounded,
        );
      case 'warning':
        return _VariantStyle(
          iconColor: const Color(0xFFD97706),
          iconBg: const Color(0xFFFFFBEB),
          iconBorder: const Color(0xFFFDE68A),
          btnBg: const Color(0xFFD97706),
          btnColor: Colors.white,
          defaultIcon: Icons.warning_amber_rounded,
        );
      case 'brand':
      default:
        return _VariantStyle(
          iconColor: const Color(0xFF7A1128),
          iconBg: const Color(0xFFFDF2F4),
          iconBorder: const Color(0xFFFECDD3),
          btnBg: const Color(0xFF7A1128),
          btnColor: Colors.white,
          defaultIcon: Icons.logout,
        );
    }
  }
}

class _VariantStyle {
  _VariantStyle({
    required this.iconColor,
    required this.iconBg,
    required this.iconBorder,
    required this.btnBg,
    required this.btnColor,
    required this.defaultIcon,
  });

  final Color iconColor;
  final Color iconBg;
  final Color iconBorder;
  final Color btnBg;
  final Color btnColor;
  final IconData defaultIcon;
}

/// Helper function to display the confirmation dialog.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmText = 'Confirm',
  String cancelText = 'Cancel',
  String variant = 'brand',
  IconData? icon,
}) async {
  final result = await showDialog<bool>(
    context: context,
    barrierColor: const Color(0x990F172A),
    builder: (ctx) => ConfirmDialog(
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
      variant: variant,
      icon: icon,
    ),
  );
  return result ?? false;
}
