import 'dart:ui' as ui;

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:image/image.dart' as img;
import 'package:intl/intl.dart';

class WatermarkResult {
  WatermarkResult(this.jpegBytes, this.photoHash);
  final Uint8List jpegBytes;
  final String photoHash;
}

/// SHA-256 fingerprint of the original photo (backend duplicate / gallery-replay detection).
String computeImageHash(Uint8List bytes) => sha256.convert(bytes).toString();

/// Burns the "Style 2" glassmorphism geotag badge into the bottom-right corner of the photo
/// (port of applyStyle2GeotagWatermark in src/utils/geotagWatermark.js).
Future<WatermarkResult> applyGeotagWatermark(
  Uint8List original, {
  required String campusName,
  required double latitude,
  required double longitude,
  double? accuracyM,
  required String employeeName,
  String employeeRole = 'COS Employee',
  DateTime? timestamp,
  bool isVerified = true,
}) async {
  final photoHash = computeImageHash(original);

  // Decode, downscaling to max 2048px on the long side.
  final probe = await ui.instantiateImageCodec(original);
  final probeFrame = await probe.getNextFrame();
  final w0 = probeFrame.image.width;
  final h0 = probeFrame.image.height;
  probeFrame.image.dispose();
  const maxDim = 2048;
  var tw = w0, th = h0;
  if (w0 > maxDim || h0 > maxDim) {
    if (w0 > h0) {
      th = (h0 * maxDim / w0).round();
      tw = maxDim;
    } else {
      tw = (w0 * maxDim / h0).round();
      th = maxDim;
    }
  }
  final codec = await ui.instantiateImageCodec(original, targetWidth: tw, targetHeight: th);
  final photo = (await codec.getNextFrame()).image;

  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);
  canvas.drawImage(photo, ui.Offset.zero, ui.Paint());

  final scale = (tw / 1200).clamp(0.7, 2.2).toDouble();
  final ts = timestamp ?? DateTime.now();
  final timeLine = DateFormat('MMM dd, yyyy, hh:mm:ss a').format(ts);
  final latText = '${latitude.abs().toStringAsFixed(5)}° ${latitude >= 0 ? 'N' : 'S'}';
  final lngText = '${longitude.abs().toStringAsFixed(5)}° ${longitude >= 0 ? 'E' : 'W'}';
  final accText = accuracyM != null ? ' (±${accuracyM.round()}m)' : '';
  final hashShort = photoHash.substring(0, 16).toUpperCase();

  final titleText =
      isVerified ? 'EVSU PERFORMA-COS • VERIFIED EVIDENCE' : 'EVSU PERFORMA-COS • UNVERIFIED LOCATION';
  final siteLine = '$campusName ${isVerified ? '• In-Bounds' : '• Out-of-Bounds'}';
  final gpsLine = '$latText, $lngText$accText';
  final userLine = '$employeeName ($employeeRole)';
  final hashLine = 'FINGERPRINT: $hashShort';

  final headerSize = 10.5 * scale;
  final bodySize = 11.5 * scale;
  final metaSize = 9.5 * scale;
  final lineHeight = 17 * scale;

  TextPainter painter(String text, double size, Color color,
      {bool bold = false, bool mono = false}) {
    return TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          fontSize: size,
          color: color,
          fontWeight: bold ? FontWeight.bold : FontWeight.normal,
          fontFamily: mono ? 'monospace' : null,
        ),
      ),
      textDirection: ui.TextDirection.ltr,
    )..layout();
  }

  final verifiedColor = isVerified ? const Color(0xFF34D399) : const Color(0xFFF87171);
  final lines = [
    painter(siteLine, bodySize, const Color(0xFFFFFFFF), bold: true),
    painter(gpsLine, bodySize - 0.5 * scale, const Color(0xFF38BDF8), mono: true),
    painter(timeLine, bodySize - 0.5 * scale, const Color(0xFFF1F5F9)),
    painter(userLine, bodySize - 1 * scale, const Color(0xFFCBD5E1)),
    painter(hashLine, metaSize, const Color(0xFF94A3B8), mono: true),
  ];
  final title = painter(titleText, headerSize, verifiedColor, bold: true);

  var maxTextWidth = title.width + 11 * scale;
  for (final l in lines) {
    if (l.width > maxTextWidth) maxTextWidth = l.width;
  }

  final padX = 14 * scale;
  final padY = 12 * scale;
  final badgeW = maxTextWidth + padX * 2 + 10 * scale;
  final badgeH = padY * 2 + lineHeight * 5 + 10 * scale + headerSize;
  final margin = 14 * scale;
  final badgeX = tw - badgeW - margin;
  final badgeY = th - badgeH - margin;
  final rrect = ui.RRect.fromRectAndRadius(
      ui.Rect.fromLTWH(badgeX, badgeY, badgeW, badgeH), ui.Radius.circular(9 * scale));

  // Glassmorphic backdrop with drop shadow and tinted border.
  canvas.drawShadow(ui.Path()..addRRect(rrect), const Color(0x73000000), 6 * scale, false);
  canvas.drawRRect(rrect, ui.Paint()..color = const Color(0xBD0F172A));
  canvas.drawRRect(
    rrect,
    ui.Paint()
      ..style = ui.PaintingStyle.stroke
      ..strokeWidth = (1.5 * scale).clamp(1, 10).toDouble()
      ..color = isVerified ? const Color(0x7334D399) : const Color(0x73EF4444),
  );

  var y = badgeY + padY;
  // Header dot + title
  canvas.drawCircle(ui.Offset(badgeX + padX + 3.5 * scale, y + title.height / 2), 3.5 * scale,
      ui.Paint()..color = isVerified ? const Color(0xFF10B981) : const Color(0xFFEF4444));
  title.paint(canvas, ui.Offset(badgeX + padX + 11 * scale, y));
  y += title.height + 5 * scale;

  // Divider
  canvas.drawLine(
    ui.Offset(badgeX + padX, y),
    ui.Offset(badgeX + badgeW - padX, y),
    ui.Paint()
      ..color = const Color(0x2EFFFFFF)
      ..strokeWidth = scale.clamp(1, 4).toDouble(),
  );
  y += 7 * scale;

  for (final l in lines) {
    l.paint(canvas, ui.Offset(badgeX + padX, y));
    y += lineHeight;
  }

  final rendered = await recorder.endRecording().toImage(tw, th);
  final rgba = await rendered.toByteData(format: ui.ImageByteFormat.rawRgba);
  photo.dispose();
  rendered.dispose();

  final jpeg = await compute(_encodeJpeg, _RawImage(tw, th, rgba!.buffer.asUint8List()));
  return WatermarkResult(jpeg, photoHash);
}

class _RawImage {
  _RawImage(this.width, this.height, this.rgba);
  final int width;
  final int height;
  final Uint8List rgba;
}

Uint8List _encodeJpeg(_RawImage raw) {
  final image = img.Image.fromBytes(
    width: raw.width,
    height: raw.height,
    bytes: raw.rgba.buffer,
    numChannels: 4,
  );
  return Uint8List.fromList(img.encodeJpg(image, quality: 92));
}
