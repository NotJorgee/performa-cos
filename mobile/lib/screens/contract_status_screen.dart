import 'package:flutter/material.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../utils/departments.dart';
import '../utils/format.dart';
import '../widgets/app_shell.dart';
import '../widgets/common.dart';
import '../widgets/predictive_text_field.dart';

const _confirmedStatuses = ['Renewal Intent Confirmed', 'Submitted', 'Under Review', 'Pending HRMO', 'Pending HR Mediation'];

/// Contract of Service lifecycle and digital renewal intent (port of employee/ContractStatus.jsx).
class ContractStatusScreen extends StatefulWidget {
  const ContractStatusScreen({super.key});
  @override
  State<ContractStatusScreen> createState() => _ContractStatusScreenState();
}

class _ContractStatusScreenState extends State<ContractStatusScreen> {
  String _startDate = 'Not Specified';
  String _endDate = 'Not Specified';
  int _daysRemaining = 0;
  int _totalDars = 0;
  String _department = '';
  String _status = 'Open for Intent Confirmation';
  final _declineReason = TextEditingController();
  bool _processing = false;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final user = AppScope.read(context).user!;
    final rawStart = user.contractStartDate ?? user.dateAppointed;
    _startDate = formatDisplayDate(rawStart);
    _endDate = formatDisplayDate(user.contractEndDate);
    _daysRemaining = daysRemaining(user.contractEndDate);
    _department = user.department;
    _load();
  }

  Future<void> _load() async {
    final user = AppScope.read(context).user!;
    try {
      final d = await Api.instance.employeeDashboard();
      if (!mounted) return;
      setState(() {
        final rawStart = d['rawStartDate']?.toString() ?? user.contractStartDate ?? user.dateAppointed;
        final rawEnd = d['rawEndDate']?.toString() ?? user.contractEndDate;
        _startDate = d['contractStartDate'] != null ? formatDisplayDate('${d['contractStartDate']}') : formatDisplayDate(rawStart);
        _endDate = d['contractEndDate'] != null ? formatDisplayDate('${d['contractEndDate']}') : formatDisplayDate(rawEnd);
        _daysRemaining = d['daysUntilExpiration'] is num ? (d['daysUntilExpiration'] as num).toInt() : daysRemaining(rawEnd);
        _totalDars = (d['totalDarsLogged'] as num?)?.toInt() ?? _totalDars;
        _department = (d['department'] ?? user.department).toString();
        if (d['renewalIntentStatus'] != null) _status = d['renewalIntentStatus'].toString();
        if ((d['declineReason'] ?? '').toString().isNotEmpty) _declineReason.text = d['declineReason'].toString();
      });
    } catch (_) {
      // Keep profile-derived contract dates.
    }
  }

  String get _period => '$_startDate – $_endDate';

  Future<bool> _renew() async {
    setState(() => _processing = true);
    try {
      await Api.instance.submitRenewal({
        'period': _period,
        'intent': 'renew',
        'mar_narrative': 'Aggregated DAR portfolio across $_totalDars logs submitted for supervisory review.',
      });
      setState(() => _status = 'Renewal Intent Confirmed');
      if (mounted) {
        showToast(context, 'Contract renewal intent confirmed! Accumulated DARs synthesized and evaluation workflow initiated.');
      }
      return true;
    } catch (e) {
      if (mounted) showToast(context, 'Failed to submit renewal intent: $e', error: true);
      return false;
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<bool> _decline() async {
    setState(() => _processing = true);
    try {
      final reason = _declineReason.text.trim();
      await Api.instance.submitRenewal({
        'period': _period,
        'intent': 'decline',
        'reason': reason,
        'mar_narrative': reason.isNotEmpty
            ? '[COS DECLINED RENEWAL]: $reason'
            : '[COS DECLINED RENEWAL]: Employee opted not to renew contract.',
      });
      setState(() => _status = 'Declined');
      if (mounted) showToast(context, 'Non-renewal decision recorded. HRMO has been notified for offboarding.');
      return true;
    } catch (e) {
      if (mounted) showToast(context, 'Failed to record non-renewal decision: $e', error: true);
      return false;
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _openActions() {
    final user = AppScope.read(context).user!;
    String? selected;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setLocal) {
        Widget option({
          required String key,
          required IconData icon,
          required String label,
          required Color color,
          required Widget body,
        }) {
          final open = selected == key;
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            SizedBox(
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: color),
                onPressed: () => setLocal(() => selected = open ? null : key),
                child: Row(children: [
                  Icon(icon, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(label)),
                  Icon(open ? Icons.expand_less : Icons.expand_more, size: 18),
                ]),
              ),
            ),
            if (open) body,
            const SizedBox(height: 12),
          ]);
        }

        return Padding(
          padding: EdgeInsets.fromLTRB(18, 0, 18, MediaQuery.viewInsetsOf(ctx).bottom + 18),
          child: SingleChildScrollView(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Row(children: [
                Icon(Icons.fact_check_outlined, color: AppColors.brand700, size: 20),
                SizedBox(width: 8),
                Text('Contract Action', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 8),
              const MutedText(
                  'Choose your intended contract lifecycle action for your upcoming contract period. A final confirmation is required before submitting your decision to the evaluation workflow.',
                  size: 13),
              const SizedBox(height: 16),
              option(
                key: 'renew',
                icon: Icons.check,
                label: 'Renew Contract',
                color: AppColors.green600,
                body: _confirmBox(
                  bg: AppColors.green50,
                  border: AppColors.greenBorder,
                  title: 'Confirmation: Standard Contract Renewal',
                  titleColor: AppColors.greenText,
                  text:
                      'You are confirming your intent to renew your Contract of Service under $_department. This will aggregate your $_totalDars Daily Accomplishment Reports (DAR) into an AI-synthesized performance analysis and forward your renewal intent to your Department Head for endorsement.',
                  confirmLabel: _processing ? 'Initiating Workflow...' : 'Confirm & Renew',
                  confirmColor: AppColors.green600,
                  onCancel: () => setLocal(() => selected = null),
                  onConfirm: _processing
                      ? null
                      : () async {
                          setLocal(() {});
                          if (await _renew() && ctx.mounted) Navigator.pop(ctx);
                        },
                ),
              ),
              option(
                key: 'decline',
                icon: Icons.close,
                label: 'Decline Renewal',
                color: AppColors.red600,
                body: _confirmBox(
                  bg: AppColors.red50,
                  border: AppColors.redBorder,
                  title: 'Confirmation: Non-Renewal Decision',
                  titleColor: AppColors.red600,
                  text:
                      'Are you sure you do not wish to renew your Contract of Service? This will halt all evaluation routing and schedule contract closure with HRMO at the end of your contract period.',
                  extra: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    const FieldLabel('Reason for Exiting', hint: '(Optional):'),
                    PredictiveTextField(
                      controller: _declineReason,
                      contextType: 'exit_reason',
                      fieldName: 'declineReason',
                      role: user.jobTitle,
                      department: _department,
                      minLines: 3,
                      hintText: 'Career transition, further studies, relocation, etc.',
                    ),
                    const SizedBox(height: 12),
                  ]),
                  confirmLabel: _processing ? 'Recording Decline...' : 'Confirm Decline & Exit',
                  confirmColor: AppColors.red600,
                  onCancel: () => setLocal(() => selected = null),
                  onConfirm: _processing
                      ? null
                      : () async {
                          setLocal(() {});
                          if (await _decline() && ctx.mounted) Navigator.pop(ctx);
                        },
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton(onPressed: _processing ? null : () => Navigator.pop(ctx), child: const Text('Close')),
              ),
            ]),
          ),
        );
      }),
    );
  }

  Widget _confirmBox({
    required Color bg,
    required Color border,
    required String title,
    required Color titleColor,
    required String text,
    Widget? extra,
    required String confirmLabel,
    required Color confirmColor,
    required VoidCallback onCancel,
    required VoidCallback? onConfirm,
  }) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(title, style: TextStyle(fontWeight: FontWeight.w700, color: titleColor, fontSize: 13.5)),
        const SizedBox(height: 6),
        Text(text, style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.ink800)),
        const SizedBox(height: 12),
        ?extra,
        Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          OutlinedButton(onPressed: onCancel, child: const Text('Cancel')),
          const SizedBox(width: 10),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: confirmColor, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
            onPressed: onConfirm,
            child: Text(confirmLabel),
          ),
        ]),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final isPendingContract = _status == 'Pending Contract';
    final expiringSoon = !isPendingContract && _daysRemaining <= 30;
    final domain = getDepartmentDomain(_department);

    return PageBody(
      onRefresh: _load,
      children: [
        PageHeader(
          title: 'Contract Status',
          subtitle: 'Monitor your Contract of Service lifecycle and submit your formal digital renewal confirmation.',
          onBack: () => state.navigate('dashboard'),
        ),
        if (isPendingContract) ...[
          AppCard(
            color: const Color(0xFFFFFBEB),
            child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.info_outline, size: 20, color: Color(0xFFB45309)),
                SizedBox(width: 8),
                Text('Pending Contract Terms Assignment',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFFB45309))),
              ]),
              SizedBox(height: 6),
              Text(
                'Your institutional account is registered and active. Your official contract duration and evaluation dates are currently awaiting assignment by the Human Resources Management Office (HRMO). Once HR records your contract terms, your active cycle and renewal workflow will become active here.',
                style: TextStyle(fontSize: 13, height: 1.45, color: Color(0xFF92400E)),
              ),
            ]),
          ),
          const SizedBox(height: 14),
        ],
        AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const CardTitle('Contract of Service Lifecycle Details', bottom: 16),
            InfoTile(label: 'Contract Period', value: isPendingContract ? 'Pending HR Assignment' : _period),
            InfoTile(
              label: 'Days Until Expiration',
              value: isPendingContract ? 'Awaiting HR Terms' : '$_daysRemaining Days',
              valueColor: (isPendingContract || expiringSoon) ? AppColors.amber600 : AppColors.green700,
            ),
            InfoTile(label: 'Accumulated DAR Logs', value: '$_totalDars Entries', valueColor: AppColors.brand700),
            InfoTile(
              label: 'Department Assignment',
              value: _department,
              trailing: StatusBadge(domain.name, bg: domain.bg, fg: domain.text, border: domain.border),
            ),
          ]),
        ),
        if (expiringSoon && (_status == 'Open for Intent Confirmation' || _status == 'Contract Active'))
          AppCard(
            borderColor: AppColors.brandBorder,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const CardTitle('Contract Renewal Action Required', color: AppColors.brand700),
              Text(
                'Your Contract of Service is approaching its expiration date ($_daysRemaining days remaining). Would you like to renew your contract for the upcoming term? Confirming your renewal intent will submit your accumulated Daily Accomplishment Reports (DAR) for AI performance synthesis and forward your intent to your Department Head for endorsement review.',
                style: const TextStyle(fontSize: 13.5, height: 1.5),
              ),
              const SizedBox(height: 14),
              ElevatedButton(onPressed: _openActions, child: const Text('View Options')),
            ]),
          ),
        if (!expiringSoon && !isPendingContract)
          AppCard(
            color: AppColors.surfaceMuted,
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: AppColors.green50, borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.fact_check_outlined, color: AppColors.green700, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Contract Active & In Good Standing',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 4),
                  MutedText(
                    'Your Contract of Service is currently active with $_daysRemaining days remaining until expiration ($_endDate). '
                    'The formal digital renewal confirmation workflow will automatically unlock 30 days prior to contract expiration. '
                    'Please continue logging your Daily Accomplishment Reports (DAR) to maintain your evaluation portfolio.',
                    size: 13,
                  ),
                ]),
              ),
            ]),
          ),
        if (expiringSoon && _confirmedStatuses.contains(_status))
          AppCard(
            color: AppColors.green50,
            borderColor: AppColors.greenBorder,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [
                Icon(Icons.check, color: AppColors.greenText, size: 20),
                SizedBox(width: 8),
                Expanded(child: CardTitle('Renewal Intent Confirmed & AI DAR Synthesized', color: AppColors.greenText, bottom: 0)),
              ]),
              const SizedBox(height: 8),
              Text(
                'All $_totalDars DAR logs have been successfully aggregated into your Accomplishment Report. Performance evaluation routing is now active (Status: $_status):',
                style: const TextStyle(fontSize: 13.5, height: 1.45),
              ),
              const SizedBox(height: 8),
              const Text(
                '• Immediate Supervisor Evaluation (100%): Department Head notified with live DAR summary and performance rubric.\n'
                '• HRMO Compliance & Contract Finalization: Institutional review and renewal appointment determination.',
                style: TextStyle(fontSize: 13, height: 1.6),
              ),
              if (['Renewal Intent Confirmed', 'Submitted'].contains(_status)) ...[
                const SizedBox(height: 12),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.greenText, side: const BorderSide(color: AppColors.greenBorder)),
                  onPressed: () {
                    setState(() => _status = 'Open for Intent Confirmation');
                    _openActions();
                  },
                  child: const Text('Change Decision'),
                ),
              ],
            ]),
          ),
        if (expiringSoon && _status == 'Approved')
          const AppCard(
            color: AppColors.green50,
            borderColor: AppColors.greenBorder,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.check, color: AppColors.greenText, size: 20),
                SizedBox(width: 8),
                CardTitle('Contract Renewal Approved', color: AppColors.greenText, bottom: 0),
              ]),
              SizedBox(height: 8),
              Text(
                'Your contract renewal has been approved and endorsed by your Department Head and HRMO. Your renewed Contract of Service term is officially finalized.',
                style: TextStyle(fontSize: 13.5, height: 1.5),
              ),
            ]),
          ),
        if (_status == 'Non-Renewal Finalized')
          AppCard(
            color: AppColors.red50,
            borderColor: AppColors.redBorder,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const CardTitle('Contract Non-Renewal Finalized by HRMO', color: AppColors.red600, bottom: 6),
              Text(
                'Your contract renewal request was concluded as Do Not Renew by the Human Resource Management Office. Your current contract concludes on $_endDate.',
                style: const TextStyle(fontSize: 13.5, height: 1.5),
              ),
            ]),
          ),
        if (_status == 'Declined')
          AppCard(
            color: AppColors.red50,
            borderColor: AppColors.redBorder,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const CardTitle('Non-Renewal Intent Recorded', color: AppColors.red600, bottom: 6),
              const Text(
                'You have indicated that you do not intend to renew your contract. All evaluation routing has been halted, and HRMO has been notified for standard end-of-contract offboarding procedures.',
                style: TextStyle(fontSize: 13.5, height: 1.5),
              ),
              if (_declineReason.text.trim().isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.redBorder)),
                  child: Text('Reason for Exiting: "${_declineReason.text.trim()}"',
                      style: const TextStyle(fontSize: 12.5, color: AppColors.ink700)),
                ),
              const SizedBox(height: 12),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.red600, side: const BorderSide(color: AppColors.redBorder)),
                onPressed: () {
                  setState(() => _status = 'Open for Intent Confirmation');
                  _openActions();
                },
                child: const Text('Change Decision'),
              ),
            ]),
          ),
      ],
    );
  }
}
