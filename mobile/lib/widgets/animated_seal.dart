import 'package:flutter/material.dart';

/// EVSU seal with the web login's motion (lv2SealIn + lv2SealFloat) plus a 3D coin flip:
/// pops in, bobs up and down forever, and spins on its vertical axis every few seconds
/// (or when tapped). Motion is skipped when the OS asks for reduced animations.
class AnimatedSeal extends StatefulWidget {
  const AnimatedSeal({super.key, required this.size, this.child, this.groundShadow = true, this.floatHeight = 10});

  /// Seal image size (ignored when [child] is given).
  final double size;

  /// Replaces the bare seal image, e.g. the seal inside a white badge.
  final Widget? child;

  /// Soft shadow under the seal that shrinks as it floats up.
  final bool groundShadow;

  /// How far (px) the seal bobs upward.
  final double floatHeight;

  @override
  State<AnimatedSeal> createState() => _AnimatedSealState();
}

class _AnimatedSealState extends State<AnimatedSeal> with TickerProviderStateMixin {
  static const _flipEvery = Duration(seconds: 6);

  late final AnimationController _intro = AnimationController(vsync: this, duration: const Duration(milliseconds: 850));
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2250),
  );
  late final AnimationController _flip = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));

  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _intro.value = 1;
      return;
    }
    _intro.forward().whenComplete(() {
      if (!mounted) return;
      _float.repeat(reverse: true);
      _scheduleFlip();
    });
  }

  void _scheduleFlip() {
    Future.delayed(_flipEvery, () {
      if (!mounted) return;
      _doFlip().whenComplete(() {
        if (mounted) _scheduleFlip();
      });
    });
  }

  Future<void> _doFlip() {
    if (_flip.isAnimating) return Future.value();
    return _flip.forward(from: 0).orCancel.catchError((_) {});
  }

  @override
  void dispose() {
    _intro.dispose();
    _float.dispose();
    _flip.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final introCurve = CurvedAnimation(parent: _intro, curve: const Cubic(.2, .85, .3, 1.05));
    final floatCurve = CurvedAnimation(parent: _float, curve: Curves.easeInOut);
    final flipCurve = CurvedAnimation(parent: _flip, curve: Curves.easeInOutCubic);

    return GestureDetector(
      onTap: _doFlip,
      child: AnimatedBuilder(
        animation: Listenable.merge([_intro, _float, _flip]),
        builder: (context, _) {
          final t = introCurve.value;
          final lift = floatCurve.value; // 0 = rest, 1 = top of the bob
          final angle = flipCurve.value * 2 * 3.141592653589793;
          // Past 90° we'd see the image mirrored; un-mirror it so both faces read like a coin.
          final backFacing = angle > 3.141592653589793 / 2 && angle < 3 * 3.141592653589793 / 2;

          final m = Matrix4.identity()
            ..setEntry(3, 2, 0.0015)
            ..rotateY(angle);
          if (backFacing) m.multiply(Matrix4.diagonal3Values(-1, 1, 1));

          return Opacity(
            opacity: t.clamp(0.0, 1.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Transform.translate(
                  offset: Offset(0, -widget.floatHeight * lift),
                  child: Transform.rotate(
                    angle: (1 - t) * -6 * 3.141592653589793 / 180,
                    child: Transform.scale(
                      scale: 0.86 + 0.14 * t,
                      child: Transform(
                        alignment: Alignment.center,
                        transform: m,
                        child:
                            widget.child ??
                            Image.asset('assets/images/evsu-seal.png', width: widget.size, height: widget.size),
                      ),
                    ),
                  ),
                ),
                if (widget.groundShadow) ...[
                  const SizedBox(height: 6),
                  // Ground shadow: shrinks and fades as the seal floats up.
                  Transform.scale(
                    scaleX: 1 - 0.25 * lift,
                    child: Container(
                      width: widget.size * 0.6,
                      height: 8,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(widget.size),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.35 - 0.15 * lift),
                            blurRadius: 12,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
