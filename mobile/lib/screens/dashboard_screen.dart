import 'package:flutter/material.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/animated_seal.dart';
import '../widgets/app_shell.dart';
import '../widgets/common.dart';

/// COS Employee dashboard (port of dashboard/EmployeeDashboard.jsx).
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _metrics;
  Map<String, dynamic>? _today;

  String get _metricsKey => 'emp_dashboard_metrics_${AppScope.read(context).user?.id}';
  String get _todayKey => 'emp_att_today_${AppScope.read(context).user?.id}';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final cache = AppScope.read(context).cache;
    _metrics ??= cache[_metricsKey] as Map<String, dynamic>?;
    _today ??= cache[_todayKey] as Map<String, dynamic>?;
    if (_loaded) return;
    _loaded = true;
    _load();
  }

  bool _loaded = false;

  Future<void> _load() async {
    final state = AppScope.read(context);
    await Future.wait([
      () async {
        try {
          final m = await Api.instance.employeeDashboard();
          state.cache[_metricsKey] = m;
          if (mounted) setState(() => _metrics = m);
        } catch (_) {}
      }(),
      () async {
        try {
          final t = await Api.instance.attendanceToday();
          state.cache[_todayKey] = t;
          if (mounted) setState(() => _today = t);
        } catch (_) {}
      }(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final user = state.user!;
    final days = (_metrics?['daysUntilExpiration'] as num?)?.toInt() ?? 0;
    final expiringSoon = days <= 30 && days > 0;
    final darsToday = (_metrics?['darTasksToday'] as num?)?.toInt() ?? 0;

    String attendanceText() {
      final t = _today!;
      if (t['has_timed_out'] == true) return 'Timed Out (${t['time_out']})';
      if (t['has_timed_in'] == true) return 'Timed In (${t['time_in']})';
      if (t['on_approved_leave'] == true) return 'On Leave (${t['leave_type']})';
      return 'Pending Clock-In';
    }

    return PageBody(
      onRefresh: _load,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(color: AppColors.brand700, borderRadius: BorderRadius.circular(16)),
          child: Row(children: [
            AnimatedSeal(
              size: 58,
              groundShadow: false,
              floatHeight: 5,
              child: Container(
                width: 58,
                height: 58,
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                child: Image.asset('assets/images/evsu-seal.png'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Welcome, ${getFullFirstName(user.fullName)}',
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('${user.department} | Eastern Visayas State University Ormoc Campus',
                    style: const TextStyle(color: Color(0xEBFFFFFF), fontSize: 13.5, height: 1.4)),
              ]),
            ),
          ]),
        ),
        LayoutBuilder(builder: (context, c) {
          final cols = c.maxWidth >= 760 ? 4 : (c.maxWidth >= 420 ? 2 : 1);
          final cards = [
            _StatCard(
              label: 'Contract Expiration',
              icon: Icons.schedule,
              value: _metrics == null ? null : '$days Days',
              valueColor: expiringSoon ? AppColors.amber600 : AppColors.ink900,
              valueSize: 24,
              linkText: 'Check Contract Status',
              onTap: () => state.navigate('contract_status'),
            ),
            _StatCard(
              label: 'Attendance',
              icon: Icons.check_circle_outline,
              iconColor: AppColors.brand700,
              value: _today == null ? null : attendanceText(),
              valueColor: _today?['has_timed_in'] == true ? AppColors.green700 : AppColors.amber600,
              valueSize: 19,
              linkText: 'Clock In / Out & Apply Leave',
              onTap: () => state.navigate('employee_attendance'),
            ),
            _StatCard(
              label: "Today's DAR Status",
              icon: Icons.place_outlined,
              value: _metrics == null ? null : '$darsToday Task(s) Logged',
              valueColor: darsToday == 0 ? AppColors.amber600 : AppColors.ink900,
              valueSize: 19,
              linkText: 'Log Campus DAR',
              onTap: () => state.navigate('daily_report'),
            ),
            _StatCard(
              label: 'Accumulated DAR Logs',
              icon: Icons.description_outlined,
              value: _metrics == null ? null : '${_metrics!['totalDarsLogged'] ?? 0} Logs',
              valueSize: 24,
              linkText: 'View Accumulated DARs',
              onTap: () => state.navigate('monthly_report'),
            ),
          ];
          final width = (c.maxWidth - (cols - 1) * 14) / cols;
          return Wrap(
            spacing: 14,
            children: [for (final card in cards) SizedBox(width: width, child: card)],
          );
        }),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.icon,
    required this.value,
    required this.linkText,
    required this.onTap,
    this.iconColor = AppColors.ink500,
    this.valueColor = AppColors.ink900,
    this.valueSize = 22,
  });

  final String label;
  final IconData icon;
  final Color iconColor;
  final String? value;
  final Color valueColor;
  final double valueSize;
  final String linkText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 14),
      onTap: onTap,
      child: SizedBox(
        height: 118,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text(label.toUpperCase(),
                  style: const TextStyle(
                      fontSize: 11.5, fontWeight: FontWeight.w700, letterSpacing: 0.5, color: AppColors.ink500)),
            ),
            Icon(icon, size: 18, color: iconColor),
          ]),
          const Spacer(),
          value == null
              ? Skeleton(width: 120, height: valueSize)
              : Text(value!, style: TextStyle(fontSize: valueSize, fontWeight: FontWeight.w800, color: valueColor)),
          const Spacer(),
          Row(children: [
            Flexible(
              child: Text(linkText,
                  style: const TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w600, fontSize: 13)),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.arrow_forward, size: 14, color: AppColors.brand700),
          ]),
        ]),
      ),
    );
  }
}
