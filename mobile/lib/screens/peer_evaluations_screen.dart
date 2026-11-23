import 'package:flutter/material.dart';

import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/app_shell.dart';
import '../widgets/common.dart';

/// System-assigned peer review board (port of employee/PeerEvaluations.jsx).
/// Peers are only assigned when a triad evaluation cycle is opened for the department;
/// the backend exposes no peer assignments to COS Employees, so the board shows its empty state.
class PeerEvaluationsScreen extends StatelessWidget {
  const PeerEvaluationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return PageBody(
      children: [
        PageHeader(title: 'Pending Peer Evaluations', onBack: () => state.navigate('dashboard')),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(18, 16, 18, 14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                CardTitle('System-Assigned Peer Review Board', bottom: 4),
                MutedText(
                    'These colleagues from your department were randomly assigned by the system to evenly distribute evaluation workload and eliminate selection bias.',
                    size: 13),
              ]),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
              child: Column(children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(color: Color(0xFFFEF2F2), shape: BoxShape.circle),
                  child: const Icon(Icons.lock_outline, color: Color(0xFF991B1B), size: 22),
                ),
                const SizedBox(height: 12),
                const Text('No Assigned Peer Evaluations',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.ink800)),
                const SizedBox(height: 6),
                const MutedText(
                    'Peer evaluations will be assigned automatically by the system when an active triad evaluation cycle is initiated for your department.',
                    size: 13.5,
                    align: TextAlign.center),
              ]),
            ),
          ]),
        ),
      ],
    );
  }
}
