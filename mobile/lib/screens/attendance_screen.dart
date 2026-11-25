import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../utils/location.dart';
import '../widgets/app_shell.dart';
import '../widgets/common.dart';
import '../widgets/confirm_dialog.dart';
import '../widgets/predictive_text_field.dart';

const leaveTypes = [
  ('Sick Leave', 'Sick Leave / Medical Excuse'),
  ('Emergency Leave', 'Emergency Leave'),
  ('Official Business (OB)', 'Official Business (OB) — Off Campus'),
  ('Overtime (OT)', 'Overtime (OT) — Additional Hours Worked'),
  ('Bereavement', 'Bereavement Leave'),
  ('Leave Without Pay', 'Leave of Absence Without Pay'),
];

/// Daily attendance (DTR clock-in / clock-out) and leave filing
/// (port of employee/EmployeeAttendance.jsx).
class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key, this.initialTab = 'dtr'});
  final String initialTab;
  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  late String _tab = widget.initialTab;
  Timer? _clock;
  DateTime _now = DateTime.now();

  Map<String, dynamic>? _today;
  List<Map<String, dynamic>> _leaves = [];
  bool _loadingToday = false;
  bool _punching = false;
  String? _punchAction;

  String _leaveType = leaveTypes.first.$1;
  DateTime? _start;
  DateTime? _end;
  final _reason = TextEditingController();
  bool _submittingLeave = false;
  bool _initialized = false;

  AppState get _state => AppScope.read(context);
  String get _todayKey => 'emp_att_today_${_state.user?.id}';
  String get _leavesKey => 'emp_leaves_${_state.user?.id}';

  @override
  void initState() {
    super.initState();
    _clock = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _now = DateTime.now()));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    _today = _state.cache[_todayKey] as Map<String, dynamic>?;
    _leaves = (_state.cache[_leavesKey] as List<Map<String, dynamic>>?) ?? [];
    _loadToday(silent: _today != null);
    if (_tab == 'leaves') _loadLeaves();
  }

  @override
  void didUpdateWidget(covariant AttendanceScreen old) {
    super.didUpdateWidget(old);
    if (old.initialTab != widget.initialTab) _switchTab(widget.initialTab);
  }

  @override
  void dispose() {
    _clock?.cancel();
    _reason.dispose();
    super.dispose();
  }

  void _switchTab(String tab) {
    setState(() => _tab = tab);
    if (tab == 'leaves') _loadLeaves();
  }

  Future<void> _loadToday({bool silent = false}) async {
    if (!silent) setState(() => _loadingToday = true);
    try {
      final res = await Api.instance.attendanceToday();
      _state.cache[_todayKey] = res;
      if (mounted) setState(() => _today = res);
    } catch (_) {
    } finally {
      if (mounted && !silent) setState(() => _loadingToday = false);
    }
  }

  Future<void> _loadLeaves() async {
    try {
      final res = await Api.instance.myLeaves();
      final list = res.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      _state.cache[_leavesKey] = list;
      if (mounted) setState(() => _leaves = list);
    } catch (_) {}
  }

  Future<void> _punch(bool timeIn) async {
    final confirmed = await showConfirmDialog(
      context,
      title: timeIn ? 'Confirm Attendance Clock-In' : 'Confirm Attendance Clock-Out',
      message: timeIn
          ? 'Record your attendance time-in for today? Your live GPS coordinates will be verified against the EVSU campus perimeter.'
          : 'Record your attendance time-out for today? Please ensure your Daily Accomplishment Report for today has been submitted.',
      confirmText: timeIn ? 'Clock In' : 'Clock Out',
      cancelText: 'Cancel',
      variant: 'brand',
      icon: timeIn ? Icons.check_circle_outline : Icons.schedule,
    );
    if (!confirmed) return;

    setState(() {
      _punching = true;
      _punchAction = timeIn ? 'locating_in' : 'locating_out';
    });
    try {
      // Automatically acquire fresh satellite GPS coordinates on-demand
      LocationFix fix;
      try {
        fix = await getCurrentLocation();
      } catch (e) {
        if (mounted) {
          showToast(
            context,
            'Unable to acquire accurate GPS position. Please check your device location settings and try again.',
            error: true,
          );
        }
        return;
      }

      setState(() => _punchAction = timeIn ? 'saving_in' : 'saving_out');

      final res = timeIn
          ? await Api.instance.timeIn(fix.latitude, fix.longitude, accuracy: fix.accuracy)
          : await Api.instance.timeOut(fix.latitude, fix.longitude, accuracy: fix.accuracy);

      if (!mounted) return;
      showToast(context, (res is Map ? res['message'] : null)?.toString() ?? 'Punch recorded successfully!');
      for (final p in ['emp_att_today_', 'emp_dtr_', 'dtr_logs_', 'emp_dashboard_metrics_']) {
        _state.invalidateCache(p);
      }
      await _loadToday();
    } catch (e) {
      if (mounted) {
        showToast(context, e.toString().isEmpty ? 'Failed to record attendance punch.' : e.toString(), error: true);
      }
    } finally {
      if (mounted) {
        setState(() {
          _punching = false;
          _punchAction = null;
        });
      }
    }
  }

  Future<void> _pickDate(bool start) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: (start ? _start : _end) ?? _start ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => start ? _start = picked : _end = picked);
  }

  Future<void> _submitLeave() async {
    if (_start == null || _end == null || _reason.text.trim().isEmpty) {
      showToast(context, 'Please complete all required fields.', error: true);
      return;
    }
    if (_end!.isBefore(_start!)) {
      showToast(context, 'End date cannot be earlier than the start date.', error: true);
      return;
    }

    final confirmed = await showConfirmDialog(
      context,
      title: 'Submit Time & Shift Request?',
      message: 'Submit your $_leaveType request for department review and endorsement?',
      confirmText: 'Submit Request',
      cancelText: 'Cancel',
      variant: 'brand',
      icon: Icons.description_outlined,
    );
    if (!confirmed) return;

    setState(() => _submittingLeave = true);
    try {
      final res = await Api.instance.applyLeave({
        'leave_type': _leaveType,
        'start_date': isoDate(_start!),
        'end_date': isoDate(_end!),
        'reason': _reason.text.trim(),
      });
      if (!mounted) return;
      showToast(context, (res is Map ? res['message'] : null)?.toString() ?? 'Leave request submitted!');
      setState(() {
        _start = null;
        _end = null;
        _reason.clear();
      });
      _state.invalidateCache('emp_leaves_');
      await _loadLeaves();
      await _loadToday(silent: true);
    } catch (e) {
      if (mounted) showToast(context, e.toString().isEmpty ? 'Failed to submit leave request.' : e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _submittingLeave = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final leaves = _tab == 'leaves';
    return PageBody(
      onRefresh: () async {
        await _loadToday(silent: true);
        if (leaves) await _loadLeaves();
      },
      children: [
        PageHeader(
          title: leaves ? 'Leave & Absence Filing' : 'Daily Attendance',
          icon: leaves ? Icons.description_outlined : Icons.schedule,
          backLabel: leaves ? 'Back to Attendance Clock-In' : 'Back to Dashboard',
          onBack: leaves ? () => _switchTab('dtr') : () => state.navigate('dashboard'),
        ),
        if (!leaves) ..._buildDtr(state) else ..._buildLeaves(state),
      ],
    );
  }

  List<Widget> _buildDtr(AppState state) {
    final t = _today;
    final status = t?['status']?.toString();
    final onLeave = t?['on_approved_leave'] == true;
    final tone = switch (status) {
      'ON_TIME' => 'completed',
      'LATE' => 'archived',
      'UNDERTIME' => 'pending',
      'OVERTIME' => 'active',
      _ => onLeave ? 'active' : 'inactive',
    };
    final timedIn = t?['has_timed_in'] == true;
    final timedOut = t?['has_timed_out'] == true;
    final isContractActive = t == null ? true : t['is_contract_active'] != false;
    final contractState = (t?['contract_state'] ?? 'ACTIVE').toString();
    final contractGateMsg = (t?['contract_gate_message'] ??
            'Attendance punching is locked until your official contract is active.')
        .toString();
    final isExpired = contractState == 'EXPIRED';

    Widget timeBlock(String label, String value, List<Widget> notes) => Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label,
                style: const TextStyle(
                    color: AppColors.ink500, fontSize: 11.5, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
            ...notes,
          ]),
        );

    Text note(String s, Color c) => Text(s, style: TextStyle(fontSize: 11.5, color: c, fontWeight: FontWeight.w600));

    return [
      AppCard(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.schedule, color: AppColors.brand700, size: 22),
            const SizedBox(width: 8),
            const Expanded(
              child: Text("Today's Attendance Status", style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            ),
            if (_loadingToday)
              const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
            else
              StatusBadge.tone(onLeave ? 'ON LEAVE (${t?['leave_type']})' : (status ?? 'PENDING PUNCH'), tone),
          ]),
          const SizedBox(height: 8),
          Text('${DateFormat('MMMM dd, yyyy').format(_now)} (${DateFormat('EEEE').format(_now)})',
              style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text.rich(TextSpan(children: [
            const TextSpan(text: 'Server Time: ', style: TextStyle(color: AppColors.ink700, fontSize: 14)),
            TextSpan(
                text: DateFormat('hh:mm:ss a').format(_now),
                style: const TextStyle(
                    color: AppColors.brand700, fontFamily: 'monospace', fontSize: 18, fontWeight: FontWeight.w800)),
          ])),
          const SizedBox(height: 16),
          if (!isContractActive) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isExpired ? const Color(0xFFFEF2F2) : const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isExpired ? const Color(0xFFFECACA) : const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.error_outline, color: isExpired ? AppColors.red600 : const Color(0xFFD97706), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isExpired
                              ? 'Contract Expired - Attendance Paused'
                              : contractState == 'NOT_STARTED'
                                  ? 'Contract Term Has Not Started Yet'
                                  : 'Pending Contract Assignment - Attendance Locked',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                            color: isExpired ? const Color(0xFF991B1B) : const Color(0xFF92400E),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          contractGateMsg,
                          style: TextStyle(
                            fontSize: 12.5,
                            height: 1.4,
                            color: isExpired ? const Color(0xFFB91C1C) : const Color(0xFFB45309),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.line)),
            child: Column(children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                timeBlock('TIME IN', '${t?['time_in'] ?? '—'}', [
                  if (t?['is_early'] == true) note('Credited: ${t?['credited_time_in']} (Early Arrival)', AppColors.brand700),
                  if (((t?['minutes_late'] as num?) ?? 0) > 0) note('Late by ${t?['minutes_late']} min(s)', AppColors.red600),
                ]),
                const SizedBox(width: 12),
                timeBlock('TIME OUT', '${t?['time_out'] ?? '—'}', [
                  if (((t?['undertime_minutes'] as num?) ?? 0) > 0)
                    note('Undertime: ${t?['undertime_minutes']} min(s)', AppColors.amber600),
                  if (((t?['overtime_hours'] as num?) ?? 0) > 0)
                    note('Saturday OT: ${t?['overtime_hours']} hr(s)', AppColors.green600),
                ]),
              ]),
              const Divider(height: 24),
              Row(children: [
                timeBlock('GEOFENCE PERIMETER', timedIn ? '${t?['geofence_site'] ?? 'EVSU Campus Perimeter'}' : '—', [
                  if (timedIn && t?['in_latitude'] is num)
                    MutedText(
                        '${(t!['in_latitude'] as num).toStringAsFixed(4)}, ${(t['in_longitude'] as num).toStringAsFixed(4)}',
                        size: 11.5),
                ]),
              ]),
            ]),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _punching || timedIn || !isContractActive ? null : () => _punch(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: (timedIn || !isContractActive) ? const Color(0xFFE2E8F0) : AppColors.brand700,
                    foregroundColor: (timedIn || !isContractActive) ? const Color(0xFF94A3B8) : Colors.white,
                    disabledBackgroundColor: const Color(0xFFE2E8F0),
                    disabledForegroundColor: const Color(0xFF94A3B8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_punchAction == 'locating_in' || _punchAction == 'saving_in') ...[
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                      ] else ...[
                        const Icon(Icons.check_circle_outline, size: 18),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Text(
                          timedIn
                              ? 'Timed In'
                              : !isContractActive
                                  ? (isExpired ? 'Contract Expired' : 'Awaiting Contract')
                                  : _punchAction == 'locating_in'
                                      ? 'Acquiring GPS...'
                                      : _punchAction == 'saving_in'
                                          ? 'Recording Punch...'
                                          : 'Clock In',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _punching || !timedIn || timedOut ? null : () => _punch(false),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: (!timedIn || timedOut) ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                    foregroundColor: (!timedIn || timedOut) ? const Color(0xFF94A3B8) : Colors.white,
                    disabledBackgroundColor: const Color(0xFFE2E8F0),
                    disabledForegroundColor: const Color(0xFF94A3B8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_punchAction == 'locating_out' || _punchAction == 'saving_out') ...[
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                      ] else ...[
                        const Icon(Icons.schedule, size: 18),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Text(
                          timedOut
                              ? 'Timed Out'
                              : _punchAction == 'locating_out'
                                  ? 'Acquiring GPS...'
                                  : _punchAction == 'saving_out'
                                      ? 'Recording Punch...'
                                      : 'Clock Out',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ]),
        ]),
      ),
      _ActionCard(
        icon: Icons.description_outlined,
        title: 'Time & Shift Requests',
        link: 'Manage',
        onTap: () => _switchTab('leaves'),
      ),
      _ActionCard(
        icon: Icons.calendar_month_outlined,
        title: 'View Full Attendance Records',
        link: 'Open Records',
        onTap: () => state.navigate('attendance_logs'),
      ),
    ];
  }

  List<Widget> _buildLeaves(AppState state) {
    final user = state.user!;
    final t = _today;
    final isContractActive = t == null ? true : t['is_contract_active'] != false;
    final isExpired = (t?['contract_state'] ?? '').toString() == 'EXPIRED';
    final contractGateMsg = (t?['contract_gate_message'] ??
            'Leave requests are locked until your official contract is active.')
        .toString();
    String fmt(DateTime? d) => d == null ? 'Select date' : DateFormat('MMM d, yyyy').format(d);

    Widget dateBox(String label, DateTime? value, bool start) => Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            FieldLabel(label, required: true),
            InkWell(
              onTap: () => _pickDate(start),
              child: InputDecorator(
                decoration: const InputDecoration(suffixIcon: Icon(Icons.calendar_today, size: 17)),
                child: Text(fmt(value),
                    style: TextStyle(fontSize: 14, color: value == null ? AppColors.ink500 : AppColors.ink900)),
              ),
            ),
          ]),
        );

    return [
      AppCard(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const CardTitle('File Leave / Absence Notice'),
          if (!isContractActive) ...[
            FlashBanner(
              contractGateMsg,
              tone: isExpired ? FlashTone.danger : FlashTone.warning,
              icon: Icons.lock_clock_outlined,
            ),
          ],
          const FieldLabel('Leave / Absence Category'),
          DropdownButtonFormField<String>(
            initialValue: _leaveType,
            isExpanded: true,
            items: [for (final (v, l) in leaveTypes) DropdownMenuItem(value: v, child: Text(l))],
            onChanged: (v) => setState(() => _leaveType = v ?? _leaveType),
          ),
          const SizedBox(height: 14),
          Row(children: [dateBox('Start Date', _start, true), const SizedBox(width: 12), dateBox('End Date', _end, false)]),
          const SizedBox(height: 14),
          const FieldLabel('Justification / Specific Reason', required: true),
          PredictiveTextField(
            controller: _reason,
            contextType: 'leave',
            fieldName: 'leaveReason ($_leaveType)',
            role: user.jobTitle,
            department: user.department,
            hintText: 'State the reason for absence for Department Head review...',
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _submittingLeave || !isContractActive ? null : _submitLeave,
              icon: const Icon(Icons.send, size: 16),
              label: Text(_submittingLeave ? 'Submitting Leave...' : 'Submit to Department Head'),
            ),
          ),
        ]),
      ),
      AppCard(
        padding: EdgeInsets.zero,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Padding(padding: EdgeInsets.fromLTRB(18, 16, 18, 4), child: CardTitle('My Request History')),
          const Divider(height: 1),
          if (_leaves.isEmpty)
            const Padding(
              padding: EdgeInsets.all(28),
              child: MutedText('No requests submitted yet.', align: TextAlign.center),
            )
          else
            for (final l in _sortedRequests()) _LeaveTile(l),
        ]),
      ),
    ];
  }

  List<Map<String, dynamic>> _sortedRequests() {
    final todayIso = _todayPhtIso();
    final copy = List<Map<String, dynamic>>.from(_leaves);
    int rank(Map<String, dynamic> r) {
      final bucket = _classifyTimeline(r, todayIso);
      return switch (bucket) {
        'pending' => 0,
        'in_progress' => 1,
        'upcoming' => 2,
        _ => 3,
      };
    }

    copy.sort((a, b) => rank(a).compareTo(rank(b)));
    return copy;
  }
}

String _todayPhtIso() {
  final pht = DateTime.now().toUtc().add(const Duration(hours: 8));
  return '${pht.year.toString().padLeft(4, '0')}-${pht.month.toString().padLeft(2, '0')}-${pht.day.toString().padLeft(2, '0')}';
}

String _classifyTimeline(Map<String, dynamic> l, String todayIso) {
  final status = '${l['status'] ?? ''}';
  final start = '${l['start_date'] ?? ''}';
  final end = '${l['end_date'] ?? start}';
  if (status == 'APPROVED') {
    if (start.isNotEmpty && end.isNotEmpty && start.compareTo(todayIso) <= 0 && todayIso.compareTo(end) <= 0) {
      return 'in_progress';
    }
    if (start.isNotEmpty && start.compareTo(todayIso) > 0) return 'upcoming';
    return 'past';
  }
  if (status == 'PENDING_DEPT_HEAD') {
    if (end.isEmpty || end.compareTo(todayIso) >= 0) return 'pending';
    return 'past';
  }
  return 'past';
}

class _LeaveTile extends StatelessWidget {
  const _LeaveTile(this.l);
  final Map<String, dynamic> l;
  @override
  Widget build(BuildContext context) {
    final status = '${l['status'] ?? ''}';
    final statusLabel = switch (status) {
      'APPROVED' => 'Approved',
      'REJECTED' => 'Disapproved',
      'CANCELLED' => 'Cancelled',
      _ => 'Pending Review',
    };
    final statusTone = switch (status) {
      'APPROVED' => 'completed',
      'REJECTED' => 'delayed',
      'CANCELLED' => 'inactive',
      _ => 'pending',
    };
    final bucket = _classifyTimeline(l, _todayPhtIso());
    final (timelineLabel, timelineTone) = switch (bucket) {
      'in_progress' => ('In Progress', 'completed'),
      'upcoming' => ('Upcoming', 'inprogress'),
      'pending' => ('Pending Review', 'pending'),
      _ => ('Past Record', 'inactive'),
    };
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.line))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text('${l['leave_type']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5))),
          StatusBadge.tone(statusLabel, statusTone),
        ]),
        const SizedBox(height: 5),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text('${l['start_date']} to ${l['end_date']} • ${l['days_count']} day(s)',
                style: const TextStyle(fontSize: 12.5, color: AppColors.ink700)),
            StatusBadge.tone(timelineLabel, timelineTone),
          ],
        ),
        if ((l['review_notes'] ?? '').toString().isNotEmpty) ...[
          const SizedBox(height: 4),
          MutedText('Notes: ${l['review_notes']}', size: 12),
        ],
      ]),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.icon, required this.title, required this.link, required this.onTap});
  final IconData icon;
  final String title;
  final String link;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => AppCard(
        onTap: onTap,
        child: Row(children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: AppColors.brand700, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
          Text(link, style: const TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w700, fontSize: 13)),
          const SizedBox(width: 4),
          const Icon(Icons.arrow_forward, size: 16, color: AppColors.brand700),
        ]),
      );
}
