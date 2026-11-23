import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../utils/geofence.dart';
import '../utils/location.dart';
import '../utils/watermark.dart';
import '../widgets/app_shell.dart';
import '../widgets/common.dart';
import '../widgets/predictive_text_field.dart';

class _GeotagMeta {
  _GeotagMeta({
    required this.campusName,
    required this.latitude,
    required this.longitude,
    required this.hash,
    required this.isGeofenceValid,
    required this.nearestDistanceM,
  });
  final String campusName;
  final double latitude;
  final double longitude;
  final String hash;
  final bool isGeofenceValid;
  final int nearestDistanceM;
}

/// Daily Accomplishment Reporting with live geotagged photo evidence
/// (port of employee/DailyReporting.jsx).
class DailyReportScreen extends StatefulWidget {
  const DailyReportScreen({super.key});
  @override
  State<DailyReportScreen> createState() => _DailyReportScreenState();
}

class _DailyReportScreenState extends State<DailyReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _job = TextEditingController();
  final _work = TextEditingController();
  final _qty = TextEditingController();
  final _remarks = TextEditingController();

  List<Campus> _campuses = defaultCampuses;
  Uint8List? _photo;
  _GeotagMeta? _meta;
  bool _geotagging = false;
  bool _submitting = false;
  String? _geoError;
  Map<String, dynamic>? _todayAttendance;
  bool _loadingAttendance = false;

  bool get _hasClockedInToday {
    if (_todayAttendance == null) return true; // optimistic until response
    return _todayAttendance!['has_timed_in'] == true || _todayAttendance!['on_approved_leave'] == true;
  }

  @override
  void initState() {
    super.initState();
    _syncCampuses();
    _checkAttendance();
  }

  Future<void> _checkAttendance() async {
    setState(() => _loadingAttendance = true);
    try {
      final res = await Api.instance.attendanceToday();
      if (mounted) setState(() => _todayAttendance = res);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingAttendance = false);
    }
  }

  Future<void> _syncCampuses() async {
    try {
      final remote = await Api.instance.geofences();
      if (remote.isNotEmpty && mounted) {
        setState(() => _campuses = remote.map((c) => Campus.fromJson(Map<String, dynamic>.from(c as Map))).toList());
      }
    } catch (_) {
      // Keep default EVSU Ormoc perimeters.
    }
  }

  Future<void> _capture({ImageSource source = ImageSource.camera}) async {
    final user = AppScope.read(context).user!;
    final XFile? shot;
    try {
      shot = await ImagePicker().pickImage(
        source: source,
        preferredCameraDevice: CameraDevice.rear,
        maxWidth: 2048,
        maxHeight: 2048,
        imageQuality: 92,
      );
    } catch (e) {
      setState(() => _geoError = 'Unable to select image: $e');
      return;
    }
    if (shot == null) return;
    final raw = await shot.readAsBytes();

    setState(() {
      _geoError = null;
      _geotagging = true;
      _photo = raw;
      _meta = null;
    });

    try {
      final LocationFix fix;
      try {
        fix = await getCurrentLocation();
      } on LocationException catch (e) {
        setState(() {
          _photo = null;
          _geoError = '${e.message} A live GPS fix is required to geotag DAR photo evidence.';
        });
        return;
      }

      final v = verifyCoordinatesAgainstCampuses(fix.latitude, fix.longitude, _campuses);
      final campusLabel = v.verifiedCampus?.name ?? v.nearestCampus?.name ?? 'EVSU Ormoc — Main Campus';

      final stamped = await applyGeotagWatermark(
        raw,
        campusName: campusLabel,
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracyM: fix.accuracy,
        employeeName: user.fullName,
        employeeRole: user.role,
        timestamp: DateTime.now(),
        isVerified: v.isValid,
      );
      if (!mounted) return;
      setState(() {
        _photo = stamped.jpegBytes;
        _meta = _GeotagMeta(
          campusName: campusLabel,
          latitude: fix.latitude,
          longitude: fix.longitude,
          hash: stamped.photoHash,
          isGeofenceValid: v.isValid,
          nearestDistanceM: v.nearestDistanceM,
        );
        if (!v.isValid) {
          final km = (v.nearestDistanceM / 1000).toStringAsFixed(1);
          _geoError =
              'Out of Campus Bounds: You are ~$km km from ${v.nearestCampus?.shortName ?? 'campus'}. Your photo and geotag badge have been stamped. Submission will be marked as "Pending Geofence Verification".';
        }
      });
    } catch (e) {
      if (mounted) setState(() => _geoError = 'Error stamping geotag onto photo: $e');
    } finally {
      if (mounted) setState(() => _geotagging = false);
    }
  }

  Future<void> _submit() async {
    setState(() => _geoError = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_photo == null) {
      setState(() => _geoError = 'Live photo evidence is strictly required for daily task logging.');
      return;
    }
    if (_meta == null) {
      setState(() => _geoError = 'Geotag verification metadata is missing. Please capture or retake a photo.');
      return;
    }
    setState(() => _submitting = true);
    final meta = _meta!;
    try {
      final up = await Api.instance.uploadDarPhoto(_photo!, 'dar_proof_${DateTime.now().millisecondsSinceEpoch}_geotagged.jpg');
      final url = (up is Map ? up['url'] : null)?.toString();
      if (url == null || url.isEmpty) throw ApiException('Photo upload did not return a storage URL.');

      await Api.instance.submitDar({
        'latitude': meta.latitude,
        'longitude': meta.longitude,
        'job_description': _job.text.trim(),
        'work_accomplished': _work.text.trim(),
        'quantity': _qty.text.trim(),
        'remarks': _remarks.text.trim(),
        'photo_evidence_url': url,
        'photo_hash': meta.hash,
      });
      if (!mounted) return;
      final state = AppScope.read(context);
      state.invalidateCache('emp_dashboard_metrics_');
      state.invalidateCache('dtr_logs_');
      setState(() {
        _job.clear();
        _work.clear();
        _qty.clear();
        _remarks.clear();
        _photo = null;
        _meta = null;
      });
      final note = meta.isGeofenceValid ? 'verified at ${meta.campusName}' : 'submitted as Pending Geofence Verification';
      showToast(context, 'Daily Accomplishment Report $note with tamper-proof geotag and submitted successfully!');
    } catch (e) {
      if (mounted) {
        final errStr = e.toString();
        if (errStr.toLowerCase().contains('clock-in required') || errStr.toLowerCase().contains('clock in first')) {
          _checkAttendance();
          setState(() => _geoError =
              'Clock-in required: You must record your attendance time-in on the Attendance screen before submitting today\'s Daily Accomplishment Report.');
        } else {
          setState(() => _geoError = errStr.isEmpty ? 'Failed to submit report. Please try again.' : errStr);
        }
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _inspect() {
    if (_photo == null) return;
    showDialog<void>(
      context: context,
      barrierColor: const Color(0xF20F172A),
      builder: (ctx) => Dialog.fullscreen(
        backgroundColor: Colors.transparent,
        child: SafeArea(
          child: Column(children: [
            Row(children: [
              const SizedBox(width: 16),
              const Icon(Icons.photo_camera_outlined, color: AppColors.sky, size: 18),
              const SizedBox(width: 8),
              const Expanded(
                  child: Text('Inspect Photo Evidence', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
              IconButton(
                  onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close, color: Colors.white), tooltip: 'Close'),
            ]),
            Expanded(child: InteractiveViewer(maxScale: 6, child: Center(child: Image.memory(_photo!)))),
            const Padding(
              padding: EdgeInsets.all(10),
              child: Text('Pinch to zoom • Tap close to return', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
            ),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final user = state.user!;
    return PageBody(
      maxWidth: 820,
      children: [
        PageHeader(
          title: 'Daily Accomplishment Reporting',
          subtitle:
              'Submit your end-of-shift task log with geotagged photo evidence and verified EVSU-Ormoc campus coordinates.',
          onBack: () => state.navigate('dashboard'),
        ),
        if (!_hasClockedInToday && !_loadingAttendance)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 24),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Clock-In Required for Daily Report',
                          style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF991B1B), fontSize: 13.5)),
                      SizedBox(height: 2),
                      Text('Please record your attendance time-in before submitting today\'s DAR task log.',
                          style: TextStyle(color: Color(0xFFB91C1C), fontSize: 12)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => state.navigate('employee_attendance'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFDC2626),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  child: const Text('Clock In'),
                ),
              ],
            ),
          ),
        if (_geoError != null) FlashBanner(_geoError!),
        if (kIsWeb)
          const FlashBanner(
              'Browser preview: camera capture opens your device camera or file picker. Use the Android / iOS app for live capture.',
              tone: FlashTone.info),
        AppCard(
          child: Form(
            key: _formKey,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const CardTitle('New Daily Accomplishment Entry', bottom: 14),
              const FieldLabel('Submission Date & Time (Locked)'),
              TextField(
                enabled: false,
                controller: TextEditingController(text: DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now())),
                decoration: const InputDecoration(fillColor: Color(0xFFF1F5F9)),
              ),
              const SizedBox(height: 14),
              const FieldLabel('Job Description', required: true),
              TextFormField(
                controller: _job,
                textCapitalization: TextCapitalization.sentences,
                validator: (v) => (v ?? '').trim().isEmpty ? 'Job description is required.' : null,
                decoration: const InputDecoration(
                    hintText: 'e.g. Conducted computer laboratory maintenance and hardware diagnostics...'),
              ),
              const SizedBox(height: 14),
              const FieldLabel('Specific Work Accomplished', required: true),
              PredictiveTextField(
                controller: _work,
                contextType: 'dar',
                fieldName: 'workAccomplished',
                role: user.jobTitle,
                department: user.department,
                hintText: 'Detail the work outputs, procedures executed, or targets completed...',
                validator: (v) => (v ?? '').trim().isEmpty ? 'Please describe the work accomplished.' : null,
              ),
              const SizedBox(height: 14),
              const FieldLabel('Quantity / Output Units'),
              TextField(controller: _qty, decoration: const InputDecoration(hintText: 'e.g. 24 units, 15 files, 3 sections')),
              const SizedBox(height: 14),
              const FieldLabel('Remarks'),
              TextField(
                  controller: _remarks, decoration: const InputDecoration(hintText: 'Optional notes or operational observations')),
              const SizedBox(height: 18),
              const FieldLabel('Live Photo Evidence', required: true),
              const MutedText(
                  'Capture live photo evidence of your completed task. Physical presence within campus grounds will be verified and stamped with a geotag badge.',
                  size: 12),
              const SizedBox(height: 10),
              _photo == null ? _viewfinder() : _preview(),
              const SizedBox(height: 18),
              SizedBox(
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _submitting || _geotagging || _photo == null ? null : _submit,
                  icon: _submitting ? const Icon(Icons.place, size: 17) : const SizedBox.shrink(),
                  label: Text(_submitting ? 'Submitting Verified Accomplishment Report...' : 'Submit DAR'),
                ),
              ),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _viewfinder() => Container(
        padding: const EdgeInsets.symmetric(vertical: 26, horizontal: 20),
        decoration: BoxDecoration(
          color: AppColors.brand50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.ink300, width: 2),
        ),
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(color: AppColors.brand600, shape: BoxShape.circle),
              child: const Icon(Icons.photo_camera_outlined, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 14),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.brandBorder),
              ),
              child: const Icon(Icons.photo_library_outlined, color: AppColors.brand700, size: 26),
            ),
          ]),
          const SizedBox(height: 12),
          const Text('Attach Live Photo Evidence',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.brand700)),
          const SizedBox(height: 6),
          const MutedText(
              'Capture directly with your camera or select from device files. Automatically records GPS coordinates and stamps tamper-proof watermark.',
              size: 12.5,
              align: TextAlign.center),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              ElevatedButton.icon(
                onPressed: _geotagging ? null : () => _capture(source: ImageSource.camera),
                icon: const Icon(Icons.camera_alt, size: 16),
                label: const Text('Open Camera'),
              ),
              OutlinedButton.icon(
                onPressed: _geotagging ? null : () => _capture(source: ImageSource.gallery),
                icon: const Icon(Icons.photo_library, size: 16),
                label: const Text('Browse Files'),
                style: OutlinedButton.styleFrom(backgroundColor: Colors.white),
              ),
            ],
          ),
        ]),
      );

  Widget _preview() {
    final meta = _meta;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.line),
        color: AppColors.slate900,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        GestureDetector(
          onTap: _geotagging ? null : _inspect,
          child: Stack(children: [
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 420, minHeight: 200),
              child: Center(child: Image.memory(_photo!, fit: BoxFit.contain)),
            ),
            if (_geotagging)
              Positioned.fill(
                child: Container(
                  color: const Color(0xC70F172A),
                  child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    CircularProgressIndicator(color: AppColors.sky),
                    SizedBox(height: 12),
                    Text('Reading GPS & Stamping Geotag...',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14.5)),
                    SizedBox(height: 4),
                    Text('Please keep the app open', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  ]),
                ),
              )
            else
              Positioned(
                left: 10,
                top: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(color: const Color(0xE00F172A), borderRadius: BorderRadius.circular(999)),
                  child: const Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.zoom_in, size: 13, color: Colors.white),
                    SizedBox(width: 4),
                    Text('Tap photo to inspect', style: TextStyle(color: Colors.white, fontSize: 11.5)),
                  ]),
                ),
              ),
          ]),
        ),
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(10),
          child: meta == null
              ? const MutedText('Photo evidence captured. Verifying campus geofence and stamping geotag badge...', size: 12)
              : Row(children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: meta.isGeofenceValid
                          ? StatusBadge.tone('Verified On-Campus (${meta.campusName})', 'completed', icon: Icons.verified_user)
                          : StatusBadge.tone(
                              'Out of Bounds (~${(meta.nearestDistanceM / 1000).toStringAsFixed(1)} km from campus)', 'warning',
                              icon: Icons.warning_amber_rounded),
                    ),
                  ),
                  const SizedBox(width: 8),
                  PopupMenuButton<ImageSource>(
                    enabled: !_geotagging,
                    tooltip: 'Change Photo',
                    onSelected: (src) => _capture(source: src),
                    itemBuilder: (ctx) => const [
                      PopupMenuItem(
                        value: ImageSource.camera,
                        child: Row(children: [
                          Icon(Icons.camera_alt_outlined, size: 16),
                          SizedBox(width: 8),
                          Text('Retake with Camera'),
                        ]),
                      ),
                      PopupMenuItem(
                        value: ImageSource.gallery,
                        child: Row(children: [
                          Icon(Icons.photo_library_outlined, size: 16),
                          SizedBox(width: 8),
                          Text('Browse Files / Gallery'),
                        ]),
                      ),
                    ],
                    child: const OutlinedButton(
                      onPressed: null,
                      style: ButtonStyle(visualDensity: VisualDensity.compact),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.replay, size: 14),
                        SizedBox(width: 4),
                        Text('Change Photo'),
                      ]),
                    ),
                  ),
                ]),
        ),
      ]),
    );
  }
}
