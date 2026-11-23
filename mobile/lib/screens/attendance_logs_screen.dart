import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/app_shell.dart';
import '../widgets/common.dart';
import '../widgets/loading_buffer.dart';

/// Semi-monthly attendance log (port of employee/AttendanceLogs.jsx).
class AttendanceLogsScreen extends StatefulWidget {
  const AttendanceLogsScreen({super.key});
  @override
  State<AttendanceLogsScreen> createState() => _AttendanceLogsScreenState();
}

class _AttendanceLogsScreenState extends State<AttendanceLogsScreen> {
  String _cutoff = DateTime.now().day <= 15 ? '1st_half' : '2nd_half';
  int _month = DateTime.now().month;
  int _year = DateTime.now().year;
  Map<String, dynamic>? _packet;
  bool _loading = false;
  bool _initialized = false;

  AppState get _state => AppScope.read(context);
  String get _key => 'dtr_logs_${_state.user?.id}_${_year}_${_month}_$_cutoff';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    _load();
  }

  Future<void> _load() async {
    final cached = _state.cache[_key] as Map<String, dynamic>?;
    setState(() {
      _packet = cached;
      _loading = cached == null;
    });
    try {
      final res = await Api.instance.payrollPacket({
        'cutoff': _cutoff,
        'month': _month,
        'year': _year,
        'employee_id': _state.user?.id,
      });
      _state.cache[_key] = res;
      if (mounted) setState(() => _packet = res);
    } catch (e) {
      if (mounted && cached == null) showToast(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _records =>
      ((_packet?['records'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();

  Future<void> _exportCsv() async {
    if (_records.isEmpty) {
      showToast(context, 'No attendance records available for export.', error: true);
      return;
    }
    const headers = ['Date', 'Day', 'Time In', 'Credited Time In', 'Time Out', 'Status', 'Shift', 'Campus Site', 'DAR Tasks'];
    String cell(dynamic v) => '"${(v ?? '').toString().replaceAll('"', '""')}"';
    final rows = _records.map((r) => [
          r['date'],
          r['day_of_week'],
          r['time_in'],
          r['credited_time_in'] ?? r['time_in'],
          r['time_out'],
          r['status'],
          r['shift_type'],
          r['geofence_site'],
          r['dar_tasks_count'],
        ].map(cell).join(','));
    final csv = [headers.join(','), ...rows].join('\n');
    final name = 'attendance_logs_${_year}_${_month}_$_cutoff.csv';
    try {
      await SharePlus.instance.share(ShareParams(
        files: [XFile.fromData(Uint8List.fromList(utf8.encode(csv)), mimeType: 'text/csv', name: name)],
        fileNameOverrides: [name],
        subject: 'PerformaCOS Attendance Logs',
      ));
      if (mounted) showToast(context, 'Attendance logs CSV exported successfully.');
    } catch (e) {
      if (mounted) showToast(context, 'Unable to export CSV: $e', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return PageBody(
      onRefresh: _load,
      children: [
        PageHeader(
          title: 'Attendance Logs',
          icon: Icons.calendar_month_outlined,
          backLabel: 'Back to Attendance Clock-In',
          onBack: () => state.navigate('employee_attendance'),
          actions: [
            OutlinedButton.icon(
              onPressed: _exportCsv,
              icon: const Icon(Icons.download, size: 16),
              label: const Text('Export Data'),
            ),
          ],
        ),
        AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Window:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            const SizedBox(height: 8),
            ChoiceChips<String>(
              options: const [('1st_half', '1st Half (1st – 15th)'), ('2nd_half', '2nd Half (16th – End)')],
              value: _cutoff,
              onChanged: (v) {
                _cutoff = v;
                _load();
              },
            ),
            const SizedBox(height: 12),
            const Text('Month:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                flex: 3,
                child: DropdownButtonFormField<int>(
                  initialValue: _month,
                  isExpanded: true,
                  items: [for (var i = 1; i <= 12; i++) DropdownMenuItem(value: i, child: Text(monthNames[i - 1]))],
                  onChanged: (v) {
                    if (v == null) return;
                    _month = v;
                    _load();
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: DropdownButtonFormField<int>(
                  initialValue: _year,
                  isExpanded: true,
                  items: [
                    for (final y in [DateTime.now().year - 1, DateTime.now().year, DateTime.now().year + 1])
                      DropdownMenuItem(value: y, child: Text('$y'))
                  ],
                  onChanged: (v) {
                    if (v == null) return;
                    _year = v;
                    _load();
                  },
                ),
              ),
            ]),
          ]),
        ),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 4),
              child: CardTitle(
                  'Daily Attendance Records (${_packet?['cutoff_label'] ?? '${monthNames[_month - 1]} $_year'})'),
            ),
            const Divider(height: 1),
            if (_loading && _packet == null)
              const LoadingBuffer(message: 'Loading attendance records...')
            else if (_records.isEmpty)
              const Padding(
                padding: EdgeInsets.all(28),
                child: MutedText('No attendance records logged for this period.', align: TextAlign.center),
              )
            else
              for (final r in _records) _RecordTile(r),
          ]),
        ),
      ],
    );
  }
}

/// Badge colors from getStatusBadgeStyle in AttendanceLogs.jsx.
String _toneFor(String status, String badge) {
  final s = status.toLowerCase();
  final b = badge.toLowerCase();
  if (s == 'n/a' || b == 'na') return 'na';
  if (s.contains('on-time') || b == 'on_time') return 'on_time';
  if (s.contains('late') || b == 'late') return 'late';
  if (s.contains('undertime') || b == 'undertime') return 'undertime';
  if (s.contains('overtime') || b == 'overtime') return 'overtime';
  if (s.contains('approved') || s.contains('leave') || b == 'leave') return 'leave';
  if (s.contains('absent') || b == 'absent') return 'absent';
  if (s.contains('weekend') || b == 'weekend') return 'weekend';
  if (s.contains('pending') || b == 'pending') return 'pending_review';
  return 'inactive';
}

class _RecordTile extends StatelessWidget {
  const _RecordTile(this.r);
  final Map<String, dynamic> r;

  @override
  Widget build(BuildContext context) {
    final status = '${r['status'] ?? ''}';
    final badge = '${r['badge_type'] ?? ''}';
    final na = status == 'N/A' || badge == 'na';
    final tasks = (r['dar_tasks_count'] as num?)?.toInt() ?? 0;
    final late = (r['minutes_late'] as num?)?.toInt() ?? 0;
    final under = (r['undertime_minutes'] as num?)?.toInt() ?? 0;

    Widget col(String label, String value, [List<Widget> extra = const []]) => Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            MutedText(label, size: 11),
            Text(value,
                style: TextStyle(fontSize: 13.5, fontWeight: value != '—' ? FontWeight.w600 : FontWeight.w400)),
            ...extra,
          ]),
        );

    return Container(
      color: r['is_weekend'] == true ? const Color(0xFFFAFAFA) : Colors.white,
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text.rich(TextSpan(children: [
              TextSpan(text: '${r['display_date'] ?? r['date']}', style: const TextStyle(fontWeight: FontWeight.w700)),
              TextSpan(text: '  ${r['day_of_week'] ?? ''}', style: const TextStyle(color: AppColors.ink500, fontSize: 12.5)),
            ])),
          ),
          StatusBadge.tone(status, _toneFor(status, badge)),
        ]),
        const SizedBox(height: 8),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          col('Time In', '${r['time_in'] ?? '—'}', [
            if (r['is_early'] == true)
              Text('Credited: ${r['credited_time_in']}',
                  style: const TextStyle(fontSize: 11, color: AppColors.brand700, fontWeight: FontWeight.w600)),
            if (late > 0)
              Text('+${late}m late',
                  style: const TextStyle(fontSize: 11, color: AppColors.amber700, fontWeight: FontWeight.w600)),
          ]),
          col('Time Out', '${r['time_out'] ?? '—'}', [
            if (under > 0)
              Text('-${under}m undertime',
                  style: const TextStyle(fontSize: 11, color: AppColors.amber700, fontWeight: FontWeight.w600)),
          ]),
          col('DAR Tasks', na ? '—' : (tasks > 0 ? '$tasks logged' : 'No tasks')),
        ]),
        if ((r['geofence_site'] ?? '').toString().isNotEmpty && r['geofence_site'] != '—') ...[
          const SizedBox(height: 6),
          Row(children: [
            const Icon(Icons.place_outlined, size: 13, color: AppColors.ink500),
            const SizedBox(width: 4),
            Expanded(child: MutedText('${r['geofence_site']}', size: 12)),
          ]),
        ],
        const SizedBox(height: 4),
        const Divider(height: 1),
      ]),
    );
  }
}
