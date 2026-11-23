import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/app_shell.dart';
import '../widgets/common.dart';
import '../widgets/loading_buffer.dart';

/// Accumulated DAR logs per quincena with an official printable report
/// (port of employee/MonthlyReport.jsx).
class MonthlyReportScreen extends StatefulWidget {
  const MonthlyReportScreen({super.key});
  @override
  State<MonthlyReportScreen> createState() => _MonthlyReportScreenState();
}

class _MonthlyReportScreenState extends State<MonthlyReportScreen> {
  final _now = DateTime.now();
  String _cutoff = '1st_half';
  late String _month = monthNames[_now.month - 1];
  late String _year = '${_now.year}';
  List<Map<String, dynamic>> _records = [];
  bool _loading = true;
  String? _error;
  bool _printing = false;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    _load();
  }

  Future<void> _load() async {
    final user = AppScope.read(context).user!;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await Api.instance.darMonthly(
          userId: user.id, monthName: _month, year: int.parse(_year), cutoff: _cutoff);
      if (mounted) setState(() => _records = data.map((e) => Map<String, dynamic>.from(e as Map)).toList());
    } catch (e) {
      if (mounted) {
        setState(() {
          _records = [];
          _error = 'Failed to fetch accumulated logs: $e';
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<String> get _years {
    final set = <String>{for (var y = _now.year - 4; y <= _now.year + 1; y++) '$y'};
    for (final r in _records) {
      if (r['year'] != null) set.add('${r['year']}');
    }
    return set.toList()..sort((a, b) => b.compareTo(a));
  }

  String get _cutoffLabel {
    final idx = monthNames.indexOf(_month);
    final days = DateTime(int.parse(_year), idx + 2, 0).day;
    if (_cutoff == '1st_half') return '$_month 01–15, $_year (1st Quincena)';
    if (_cutoff == '2nd_half') return '$_month 16–$days, $_year (2nd Quincena)';
    return '$_month 01–$days, $_year (Full Month)';
  }

  bool get _isFuture {
    final y = int.parse(_year);
    final m = monthNames.indexOf(_month) + 1;
    if (y != _now.year) return y > _now.year;
    if (m != _now.month) return m > _now.month;
    return _cutoff == '2nd_half' && _now.day < 16;
  }

  int? _dayOf(Map<String, dynamic> r) {
    if (r['day'] is num) return (r['day'] as num).toInt();
    final log = r['logDate']?.toString();
    if (log != null) {
      final parts = log.split('-');
      if (parts.length == 3) return int.tryParse(parts[2].substring(0, 2));
    }
    final m = RegExp(r'\b([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})').firstMatch('${r['dateSubmitted'] ?? ''}');
    return m != null ? int.parse(m.group(2)!) : null;
  }

  List<Map<String, dynamic>> get _filtered => _records.where((r) {
        if (r['month'] != null && r['month'] != _month) return false;
        if (r['year'] != null && '${r['year']}' != _year) return false;
        if (_cutoff == 'full_month') return true;
        final d = _dayOf(r);
        if (d != null) return _cutoff == '1st_half' ? d <= 15 : d >= 16;
        if (r['cutoff'] != null) return r['cutoff'] == _cutoff;
        return true;
      }).toList();

  Future<void> _print() async {
    final user = AppScope.read(context).user!;
    setState(() => _printing = true);
    try {
      final seal = pw.MemoryImage((await rootBundle.load('assets/images/evsu-seal.png')).buffer.asUint8List());
      final rows = _filtered;
      final photos = <int, pw.ImageProvider>{};
      for (var i = 0; i < rows.length; i++) {
        final url = rows[i]['photoEvidenceUrl']?.toString();
        if (url == null || url.isEmpty) continue;
        try {
          photos[i] = await networkImage(url);
        } catch (_) {}
      }
      final doc = _buildPdf(user, rows, photos, seal);
      await Printing.layoutPdf(
        name: 'DAR_Report_${user.fullName.replaceAll(' ', '_')}_${_month}_$_year.pdf',
        onLayout: (_) async => doc.save(),
      );
    } catch (e) {
      if (mounted) showToast(context, 'Unable to generate report: $e', error: true);
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }

  /// Built-in PDF fonts only cover Latin-1, so typographic dashes/bullets are normalised.
  String _pdfText(Object? v) => '${v ?? ''}'
      .replaceAll('–', '-')
      .replaceAll('—', '-')
      .replaceAll('•', '-')
      .replaceAll('’', "'")
      .replaceAll(RegExp(r'[^\x00-\xFF]'), '');

  pw.Document _buildPdf(CurrentUser user, List<Map<String, dynamic>> rows, Map<int, pw.ImageProvider> photos,
      pw.ImageProvider seal) {
    final doc = pw.Document(title: 'Individual Accomplishment Report (DAR)', author: user.fullName);
    const maroon = PdfColor.fromInt(0xFF8B0000);
    pw.Widget cell(String text, {bool bold = false}) => pw.Padding(
          padding: const pw.EdgeInsets.all(4),
          child: pw.Text(_pdfText(text),
              style: pw.TextStyle(fontSize: 8.5, fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal)),
        );
    pw.Widget signature(String caption, String name, String sub) => pw.Expanded(
          child: pw.Padding(
            padding: const pw.EdgeInsets.symmetric(horizontal: 10),
            child: pw.Column(children: [
              pw.Text(caption, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 36),
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.only(top: 4),
                decoration: const pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(width: 1))),
                child: pw.Text(_pdfText(name),
                    textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
              ),
              pw.Text(_pdfText(sub),
                  textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey700)),
            ]),
          ),
        );

    doc.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4.landscape,
      margin: const pw.EdgeInsets.all(28),
      build: (_) => [
        pw.Row(mainAxisAlignment: pw.MainAxisAlignment.center, children: [
          pw.Image(seal, width: 54, height: 54),
          pw.SizedBox(width: 12),
          pw.Column(children: [
            pw.Text('REPUBLIC OF THE PHILIPPINES', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
            pw.Text('EASTERN VISAYAS STATE UNIVERSITY',
                style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: maroon)),
            pw.Text('Ormoc City Campus - Ormoc City, Leyte', style: const pw.TextStyle(fontSize: 9.5)),
          ]),
        ]),
        pw.SizedBox(height: 8),
        pw.Container(
          padding: const pw.EdgeInsets.only(top: 6),
          decoration: const pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(width: 2))),
          child: pw.Column(children: [
            pw.Text('INDIVIDUAL ACCOMPLISHMENT REPORT (DAR)',
                style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
            pw.Text('Coverage Period: ${_pdfText(_cutoffLabel)}', style: const pw.TextStyle(fontSize: 9.5)),
          ]),
        ),
        pw.SizedBox(height: 10),
        pw.Container(
          padding: const pw.EdgeInsets.only(bottom: 5),
          decoration: const pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(width: 1))),
          child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
            pw.Text('Employee: ${_pdfText(user.fullName)}', style: const pw.TextStyle(fontSize: 9.5)),
            pw.Text('Department: ${_pdfText(user.department)}', style: const pw.TextStyle(fontSize: 9.5)),
            pw.Text('Status: Contract of Service (COS)', style: const pw.TextStyle(fontSize: 9.5)),
          ]),
        ),
        pw.SizedBox(height: 10),
        if (rows.isEmpty)
          pw.Padding(
            padding: const pw.EdgeInsets.all(20),
            child: pw.Text('No daily accomplishment reports were submitted for this period.',
                textAlign: pw.TextAlign.center),
          )
        else
          pw.Table(
            border: pw.TableBorder.all(width: 0.5, color: PdfColors.grey600),
            columnWidths: const {
              0: pw.FlexColumnWidth(1.4),
              1: pw.FlexColumnWidth(2.3),
              2: pw.FlexColumnWidth(2.8),
              3: pw.FlexColumnWidth(1),
              4: pw.FlexColumnWidth(1.2),
              5: pw.FlexColumnWidth(1.4),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                children: [
                  for (final h in [
                    'Date & Time',
                    'Job Description / Task',
                    'Specific Work Accomplished',
                    'Quantity',
                    'Photo Evidence',
                    'Verification & Remarks'
                  ])
                    cell(h, bold: true),
                ],
              ),
              for (var i = 0; i < rows.length; i++)
                pw.TableRow(children: [
                  cell('${rows[i]['dateSubmitted'] ?? ''}'),
                  cell('${rows[i]['jobDescription'] ?? ''}', bold: true),
                  cell('${rows[i]['workAccomplished'] ?? ''}'),
                  cell('${(rows[i]['quantity'] ?? '').toString().isEmpty ? '1 task' : rows[i]['quantity']}'),
                  pw.Padding(
                    padding: const pw.EdgeInsets.all(3),
                    child: photos[i] != null
                        ? pw.Image(photos[i]!, height: 52, fit: pw.BoxFit.cover)
                        : pw.Text('-', style: const pw.TextStyle(fontSize: 8.5)),
                  ),
                  cell('${rows[i]['isGeofenceValid'] == true ? 'Geotag Verified. ' : ''}${rows[i]['remarks'] ?? '-'}'),
                ]),
            ],
          ),
        pw.SizedBox(height: 36),
        pw.Row(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
          signature('Prepared By:', user.fullName.toUpperCase(), 'COS Employee / Personnel'),
          signature('Noted & Verified By:', 'DEPARTMENT HEAD', user.department),
          signature('Approved & Audited:', 'HRMDO IN-CHARGE', 'Human Resource Management Office'),
        ]),
      ],
    ));
    return doc;
  }

  void _showPhoto(Map<String, dynamic> row) {
    final url = row['photoEvidenceUrl'].toString();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        titlePadding: const EdgeInsets.fromLTRB(18, 14, 8, 0),
        contentPadding: const EdgeInsets.fromLTRB(18, 12, 18, 0),
        title: Row(children: [
          const Icon(Icons.photo_camera_outlined, color: AppColors.brand700, size: 18),
          const SizedBox(width: 8),
          const Expanded(child: Text('Verified DAR Photo Evidence', style: TextStyle(fontSize: 16))),
          IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close, size: 18), tooltip: 'Close'),
        ]),
        content: SingleChildScrollView(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Container(
              decoration: BoxDecoration(color: AppColors.slate900, borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.all(6),
              child: InteractiveViewer(child: Image.network(url, fit: BoxFit.contain)),
            ),
            const SizedBox(height: 12),
            Text.rich(TextSpan(style: const TextStyle(fontSize: 12.5, height: 1.5), children: [
              const TextSpan(text: 'Task: ', style: TextStyle(fontWeight: FontWeight.w700)),
              TextSpan(text: '${row['jobDescription'] ?? ''}\n'),
              const TextSpan(text: 'Accomplishment: ', style: TextStyle(fontWeight: FontWeight.w700)),
              TextSpan(text: '${row['workAccomplished'] ?? ''}\n'),
              const TextSpan(text: 'Date Submitted: ', style: TextStyle(fontWeight: FontWeight.w700)),
              TextSpan(text: '${row['dateSubmitted'] ?? ''}'),
            ])),
            const SizedBox(height: 4),
            Text('${row['campusSite'] ?? 'EVSU Ormoc Campus'} • Tamper-Proof Geotag Badge Active',
                style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w600, fontSize: 12.5)),
          ]),
        ),
        actions: [
          TextButton.icon(
            onPressed: () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
            icon: const Icon(Icons.open_in_new, size: 15),
            label: const Text('Open High-Res Original'),
          ),
          ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final user = state.user!;
    final rows = _filtered;

    return PageBody(
      onRefresh: _load,
      children: [
        PageHeader(
          title: 'Accumulated DAR Logs',
          subtitle:
              '${user.department} — Official quincena compilation of verified daily accomplishment reports for ${user.fullName}.',
          onBack: () => state.navigate('dashboard'),
          actions: [
            ElevatedButton.icon(
              onPressed: _printing ? null : _print,
              icon: _printing
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.print_outlined, size: 17),
              label: const Text('Print / Save DAR Report (PDF)'),
            ),
          ],
        ),
        AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Window:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            const SizedBox(height: 8),
            ChoiceChips<String>(
              options: const [
                ('1st_half', '1st Half (1st – 15th)'),
                ('2nd_half', '2nd Half (16th – End)'),
                ('full_month', 'Full Month'),
              ],
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
                child: DropdownButtonFormField<String>(
                  initialValue: _month,
                  isExpanded: true,
                  items: [for (final m in monthNames) DropdownMenuItem(value: m, child: Text(m))],
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
                child: DropdownButtonFormField<String>(
                  initialValue: _year,
                  isExpanded: true,
                  items: [for (final y in _years) DropdownMenuItem(value: y, child: Text(y))],
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
        if (_error != null) FlashBanner(_error!),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                CardTitle('Daily Accomplishment Records ($_cutoffLabel)', bottom: 2),
                MutedText('Showing ${rows.length} verified task accomplishment record(s)'),
              ]),
            ),
            const Divider(height: 1),
            if (_loading && rows.isEmpty)
              const LoadingBuffer(message: 'Loading accumulated accomplishment reports...')
            else if (rows.isEmpty)
              _isFuture
                  ? EmptyState(
                      icon: Icons.calendar_month_outlined,
                      title: 'Period Has Not Started Yet',
                      message:
                          'This quincena period ($_cutoffLabel) has not started yet. Accomplishments can be logged once this period begins.')
                  : EmptyState(
                      icon: Icons.description_outlined,
                      title: 'No Accomplishment Records Logged',
                      message: 'No daily accomplishment reports were submitted for this period ($_cutoffLabel).')
            else ...[
              for (final r in rows) _DarTile(row: r, onPhoto: () => _showPhoto(r)),
              Container(
                color: AppColors.surfaceMuted,
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
                child: MutedText('Total entries displayed: ${rows.length} verified logs • Period: $_cutoffLabel', size: 12),
              ),
            ],
          ]),
        ),
      ],
    );
  }
}

class _DarTile extends StatelessWidget {
  const _DarTile({required this.row, required this.onPhoto});
  final Map<String, dynamic> row;
  final VoidCallback onPhoto;

  @override
  Widget build(BuildContext context) {
    final submitted = '${row['dateSubmitted'] ?? ''}';
    final parts = submitted.split(',');
    final url = row['photoEvidenceUrl']?.toString();
    final qty = (row['quantity'] ?? '').toString();

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.line))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text.rich(TextSpan(children: [
              TextSpan(text: parts.first, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              if (parts.length > 1)
                TextSpan(
                    text: '  ${parts.sublist(1).join(',').trim()}',
                    style: const TextStyle(color: AppColors.ink500, fontSize: 11.5)),
            ])),
            const SizedBox(height: 6),
            Text('${row['jobDescription'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
            const SizedBox(height: 3),
            Text('${row['workAccomplished'] ?? ''}', style: const TextStyle(fontSize: 13, height: 1.45)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
              StatusBadge.tone(qty.isEmpty ? '1 task' : qty, 'dept'),
              if (row['isGeofenceValid'] == true) StatusBadge.tone('Geotag Verified', 'completed', icon: Icons.verified_user),
            ]),
            if ((row['remarks'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 6),
              MutedText('Remarks: ${row['remarks']}', size: 12),
            ],
          ]),
        ),
        const SizedBox(width: 12),
        if (url != null && url.isNotEmpty)
          GestureDetector(
            onTap: onPhoto,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(url,
                  width: 72,
                  height: 72,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                      width: 72,
                      height: 72,
                      color: AppColors.bg,
                      child: const Icon(Icons.broken_image_outlined, color: AppColors.ink300))),
            ),
          ),
      ]),
    );
  }
}
