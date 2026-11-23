import 'package:intl/intl.dart';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

String toInitials(String fullName) {
  final clean = fullName.replaceFirst(RegExp(r'^(Dr\.|Engr\.|Prof\.)\s*', caseSensitive: false), '');
  final letters = clean.split(' ').where((p) => p.isNotEmpty).map((p) => p[0]).take(2).join();
  return letters.isEmpty ? 'U' : letters.toUpperCase();
}

/// 'Jorge Mikhael Gubantes' -> 'Jorge Mikhael', 'Dr. Maria Clara Ramos' -> 'Maria Clara'.
String getFullFirstName(String fullName) {
  if (fullName.isEmpty) return '';
  final clean = fullName
      .replaceFirst(RegExp(r'^(Dr\.|Engr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+', caseSensitive: false), '')
      .trim();
  final parts = clean.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.length <= 1) return parts.isEmpty ? fullName : parts.first;

  var lastIdx = parts.length - 1;
  if (RegExp(r'^(Jr\.?|Sr\.?|II|III|IV|V)$', caseSensitive: false).hasMatch(parts[lastIdx]) &&
      parts.length > 2) {
    lastIdx--;
  }
  if (lastIdx > 1 && RegExp(r'^(Del|Dela|De|San|Santa)$', caseSensitive: false).hasMatch(parts[lastIdx - 1])) {
    lastIdx--;
  }
  var firstParts = parts.sublist(0, lastIdx);
  if (firstParts.length > 1 && RegExp(r'^[A-Z]\.?$', caseSensitive: false).hasMatch(firstParts.last)) {
    firstParts = firstParts.sublist(0, firstParts.length - 1);
  }
  final out = firstParts.join(' ');
  return out.isEmpty ? parts.first : out;
}

DateTime? parseIsoDate(String? s) {
  if (s == null || s.isEmpty) return null;
  final m = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(s);
  if (m != null) {
    return DateTime(int.parse(m.group(1)!), int.parse(m.group(2)!), int.parse(m.group(3)!));
  }
  return DateTime.tryParse(s);
}

/// 'YYYY-MM-DD' -> 'January 05, 2026' (matches formatDisplayDate in ContractStatus.jsx).
String formatDisplayDate(String? input) {
  if (input == null || input.isEmpty) return 'Not Specified';
  if (RegExp(r'^[A-Z][a-z]+ \d{1,2}, \d{4}$').hasMatch(input)) return input;
  final d = parseIsoDate(input);
  if (d == null) return input;
  return DateFormat('MMMM dd, yyyy').format(d);
}

int daysRemaining(String? endDate) {
  final end = parseIsoDate(endDate);
  if (end == null) return 0;
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final diff = end.difference(today).inDays;
  return diff < 0 ? 0 : diff;
}

String isoDate(DateTime d) => DateFormat('yyyy-MM-dd').format(d);
