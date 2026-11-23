import 'package:flutter/material.dart';

import '../theme.dart';

/// White rounded card with the portal's soft border and shadow (.card).
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.color = AppColors.white,
    this.borderColor = AppColors.line,
    this.onTap,
    this.margin = const EdgeInsets.only(bottom: 16),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final Color borderColor;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    final content = Padding(padding: padding, child: child);
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
        boxShadow: const [
          BoxShadow(color: Color(0x0A10192B), blurRadius: 2, offset: Offset(0, 1)),
          BoxShadow(color: Color(0x1410192B), blurRadius: 24, offset: Offset(0, 8), spreadRadius: -12),
        ],
      ),
      child: Material(
        type: MaterialType.transparency,
        child: onTap == null
            ? content
            : InkWell(borderRadius: BorderRadius.circular(14), onTap: onTap, child: content),
      ),
    );
  }
}

/// Status pill (.badge-*).
class StatusBadge extends StatelessWidget {
  const StatusBadge(this.label, {super.key, required this.bg, required this.fg, this.border, this.icon});

  final String label;
  final Color bg;
  final Color fg;
  final Color? border;
  final IconData? icon;

  factory StatusBadge.tone(String label, String tone, {IconData? icon}) {
    final t = badgeTones[tone] ?? badgeTones['inactive']!;
    return StatusBadge(label, bg: t.$1, fg: t.$2, border: t.$3, icon: icon);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: border != null ? Border.all(color: border!) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 13, color: fg), const SizedBox(width: 4)],
          Flexible(
            child: Text(label,
                style: TextStyle(color: fg, fontSize: 11.5, fontWeight: FontWeight.w700),
                overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}

/// (background, foreground, border) per badge class of style.css.
const Map<String, (Color, Color, Color?)> badgeTones = {
  'completed': (AppColors.green50, AppColors.greenText, null),
  'pending': (AppColors.amber50, AppColors.amber600, null),
  'delayed': (AppColors.red50, AppColors.red600, null),
  'inprogress': (AppColors.brand50, AppColors.brand700, null),
  'active': (AppColors.brand50, AppColors.brand700, null),
  'archived': (Color(0xFFFEF3C7), Color(0xFFB45309), Color(0xFFFDE68A)),
  'on_time': (Color(0xFFDCFCE7), Color(0xFF15803D), Color(0xFF86EFAC)),
  'late': (Color(0xFFFEF3C7), Color(0xFFB45309), Color(0xFFFDE68A)),
  'undertime': (Color(0xFFFFEDD5), Color(0xFFC2410C), Color(0xFFFED7AA)),
  'overtime': (Color(0xFFE0E7FF), Color(0xFF4338CA), Color(0xFFC7D2FE)),
  'leave': (Color(0xFFE0F2FE), Color(0xFF0369A1), Color(0xFFBAE6FD)),
  'absent': (Color(0xFFFEE2E2), Color(0xFFB91C1C), Color(0xFFFECACA)),
  'weekend': (Color(0xFFF8FAFC), Color(0xFF64748B), Color(0xFFE2E8F0)),
  'na': (Color(0xFFF1F5F9), Color(0xFF94A3B8), Color(0xFFE2E8F0)),
  'pending_review': (Color(0xFFFEF9C3), Color(0xFFA16207), Color(0xFFFDE047)),
  'inactive': (Color(0xFFF1F5F9), Color(0xFF64748B), Color(0xFFE2E8F0)),
  'dept': (Color(0xFFEFF6FF), Color(0xFF1D4ED8), null),
  'warning': (AppColors.amber50, AppColors.amber600, null),
};

/// Screen title + subtitle + optional back button (flex-between header of each module).
class PageHeader extends StatelessWidget {
  const PageHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.backLabel,
    this.onBack,
    this.actions = const [],
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final String? backLabel;
  final VoidCallback? onBack;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (onBack != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: OutlinedButton.icon(
                onPressed: onBack,
                icon: const Icon(Icons.arrow_back, size: 15),
                label: Text(backLabel ?? 'Back to Dashboard'),
                style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    visualDensity: VisualDensity.compact),
              ),
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (icon != null) ...[Icon(icon, size: 26, color: AppColors.brand700), const SizedBox(width: 10)],
              Expanded(
                child: Text(title,
                    style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
              ),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(subtitle!, style: const TextStyle(color: AppColors.ink500, fontSize: 13.5, height: 1.45)),
          ],
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: actions),
          ],
        ],
      ),
    );
  }
}

class CardTitle extends StatelessWidget {
  const CardTitle(this.text, {super.key, this.color = AppColors.ink900, this.bottom = 12});
  final String text;
  final Color color;
  final double bottom;
  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: bottom),
        child: Text(text, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color)),
      );
}

class FieldLabel extends StatelessWidget {
  const FieldLabel(this.text, {super.key, this.required = false, this.hint});
  final String text;
  final bool required;
  final String? hint;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text.rich(TextSpan(children: [
          TextSpan(
              text: text,
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.ink800)),
          if (required) const TextSpan(text: ' *', style: TextStyle(color: AppColors.red600)),
          if (hint != null)
            TextSpan(text: ' $hint', style: const TextStyle(color: AppColors.ink500, fontWeight: FontWeight.w400)),
        ])),
      );
}

class MutedText extends StatelessWidget {
  const MutedText(this.text, {super.key, this.size = 12.5, this.align});
  final String text;
  final double size;
  final TextAlign? align;
  @override
  Widget build(BuildContext context) =>
      Text(text, textAlign: align, style: TextStyle(color: AppColors.ink500, fontSize: size, height: 1.45));
}

/// Inline alert banner (.flash).
class FlashBanner extends StatelessWidget {
  const FlashBanner(this.message, {super.key, this.tone = FlashTone.danger, this.icon});
  final String message;
  final FlashTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (tone) {
      FlashTone.danger => (const Color(0xFFFEF2F2), const Color(0xFF991B1B), const Color(0xFFFECACA)),
      FlashTone.success => (AppColors.green50, AppColors.greenText, AppColors.greenBorder),
      FlashTone.warning => (AppColors.amber50, AppColors.amber700, const Color(0xFFFDE68A)),
      FlashTone.info => (const Color(0xFFF8FAFC), AppColors.ink700, AppColors.line),
    };
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: border)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon ?? (tone == FlashTone.success ? Icons.check_circle_outline : Icons.warning_amber_rounded),
              size: 18, color: fg),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: TextStyle(color: fg, fontSize: 13, height: 1.45))),
        ],
      ),
    );
  }
}

enum FlashTone { danger, success, warning, info }

/// Toast (common/Toast.jsx) rendered as a floating SnackBar.
void showToast(BuildContext context, String message, {bool error = false}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Row(children: [
        Icon(error ? Icons.error_outline : Icons.check_circle_outline, color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(message)),
      ]),
      backgroundColor: error ? AppColors.red700 : AppColors.ink900,
      duration: const Duration(milliseconds: 4200),
    ));
}

/// 1st / 2nd half (and optional full month) window selector.
class ChoiceChips<T> extends StatelessWidget {
  const ChoiceChips({super.key, required this.options, required this.value, required this.onChanged});
  final List<(T, String)> options;
  final T value;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final (v, label) in options)
          ChoiceChip(
            label: Text(label),
            selected: v == value,
            onSelected: (_) => onChanged(v),
            showCheckmark: false,
            labelStyle: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: v == value ? Colors.white : AppColors.ink800),
            selectedColor: AppColors.brand600,
            backgroundColor: AppColors.white,
            side: BorderSide(color: v == value ? AppColors.brand600 : AppColors.line),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
      ],
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, required this.message, this.action});
  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
      child: Column(
        children: [
          Icon(icon, size: 34, color: const Color(0xFF94A3B8)),
          const SizedBox(height: 8),
          Text(title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5, color: AppColors.ink800)),
          const SizedBox(height: 6),
          MutedText(message, size: 13, align: TextAlign.center),
          if (action != null) ...[const SizedBox(height: 12), action!],
        ],
      ),
    );
  }
}

class LoadingRow extends StatelessWidget {
  const LoadingRow(this.label, {super.key});
  final String label;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          const SizedBox(
              width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand600)),
          const SizedBox(width: 10),
          Flexible(child: MutedText(label, size: 13)),
        ]),
      );
}

/// Grey shimmer placeholder (.skeleton-shimmer).
class Skeleton extends StatelessWidget {
  const Skeleton({super.key, required this.width, required this.height});
  final double width;
  final double height;
  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: const Color(0xFFEEF1F6), borderRadius: BorderRadius.circular(6)),
      );
}

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.initials, this.url, this.size = 36});
  final String initials;
  final String? url;
  final double size;
  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(color: AppColors.brand600, shape: BoxShape.circle),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: url != null
          ? Image.network(url!, width: size, height: size, fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _initials())
          : _initials(),
    );
  }

  Widget _initials() => Text(initials,
      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: size * 0.36));
}

/// Label / value pair used in detail grids.
class InfoTile extends StatelessWidget {
  const InfoTile({super.key, required this.label, required this.value, this.valueColor, this.trailing});
  final String label;
  final String value;
  final Color? valueColor;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label.toUpperCase(),
              style: const TextStyle(
                  color: AppColors.ink500, fontSize: 11.5, fontWeight: FontWeight.w700, letterSpacing: 0.4)),
          const SizedBox(height: 3),
          Wrap(crossAxisAlignment: WrapCrossAlignment.center, spacing: 8, runSpacing: 4, children: [
            Text(value,
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: valueColor ?? AppColors.ink900)),
            ?trailing,
          ]),
        ]),
      );
}
