import 'package:flutter/material.dart';
import '../theme.dart';

/// Minimalist Loading Buffer Screen.
/// Generic, non-flashy filler screen used for universal module transitions
/// and initial asynchronous database data loading.
/// Direct Flutter port of src/components/common/LoadingBuffer.jsx and
/// .loading-buffer-* styles in src/styles/style.css.
class LoadingBuffer extends StatelessWidget {
  const LoadingBuffer({
    super.key,
    this.message = 'Loading...',
    this.minHeight = 380.0,
    this.expand = true,
  });

  final String message;
  final double minHeight;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final content = TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      builder: (context, opacity, child) {
        return Opacity(
          opacity: opacity,
          child: child,
        );
      },
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 48),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.brand700),
                  backgroundColor: AppColors.line,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w500,
                  color: AppColors.ink500,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (expand) {
      return ConstrainedBox(
        constraints: BoxConstraints(minHeight: minHeight),
        child: content,
      );
    }
    return content;
  }
}

/// Smooth Module Fade-and-Rise Transition Wrapper.
/// Direct Flutter port of .module-transition-enter in src/styles/style.css.
class ModuleTransitionEnter extends StatelessWidget {
  const ModuleTransitionEnter({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 4 * (1 - value)),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}
