import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

import '../theme.dart';

/// Pan / pinch-to-zoom circular avatar cropper (port of auth/AvatarCropModal.jsx).
/// Returns a 512×512 PNG of the framed area.
Future<Uint8List?> showAvatarCropDialog(BuildContext context, Uint8List imageBytes) {
  return showDialog<Uint8List>(
    context: context,
    barrierDismissible: false,
    builder: (_) => _AvatarCropDialog(imageBytes),
  );
}

class _AvatarCropDialog extends StatefulWidget {
  const _AvatarCropDialog(this.bytes);
  final Uint8List bytes;
  @override
  State<_AvatarCropDialog> createState() => _AvatarCropDialogState();
}

class _AvatarCropDialogState extends State<_AvatarCropDialog> {
  final _boundary = GlobalKey();
  final _transform = TransformationController();
  bool _saving = false;
  static const _frame = 280.0;

  Future<void> _crop() async {
    setState(() => _saving = true);
    try {
      final ro = _boundary.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await ro.toImage(pixelRatio: 512 / _frame);
      final data = await image.toByteData(format: ui.ImageByteFormat.png);
      image.dispose();
      if (mounted) Navigator.pop(context, data!.buffer.asUint8List());
    } catch (_) {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Crop Profile Photo'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Drag to reposition and pinch to zoom.', style: TextStyle(fontSize: 12.5, color: AppColors.ink500)),
        const SizedBox(height: 14),
        SizedBox(
          width: _frame,
          height: _frame,
          child: Stack(children: [
            RepaintBoundary(
              key: _boundary,
              child: ClipRect(
                child: SizedBox(
                  width: _frame,
                  height: _frame,
                  child: ColoredBox(
                    color: Colors.white,
                    child: InteractiveViewer(
                      transformationController: _transform,
                      minScale: 1,
                      maxScale: 6,
                      constrained: false,
                      boundaryMargin: const EdgeInsets.all(_frame),
                      child: SizedBox(
                        width: _frame,
                        height: _frame,
                        child: Image.memory(widget.bytes, fit: BoxFit.cover),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Circular guide overlay (not captured in the crop)
            IgnorePointer(
              child: CustomPaint(size: const Size(_frame, _frame), painter: _CircleGuidePainter()),
            ),
          ]),
        ),
      ]),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(onPressed: _saving ? null : _crop, child: Text(_saving ? 'Cropping…' : 'Apply Crop')),
      ],
    );
  }
}

class _CircleGuidePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final path = Path()
      ..addRect(rect)
      ..addOval(rect.deflate(6))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, Paint()..color = const Color(0x8C0F172A));
    canvas.drawCircle(rect.center, size.width / 2 - 6,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
