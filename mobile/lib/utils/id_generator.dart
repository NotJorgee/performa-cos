/// EVSU employee ID preview (port of src/utils/idGenerator.js).
/// Format: [Last initial][MMDDYYYY][First initials][Middle initial], e.g. 'G10222026JMR'.
String generateEvsuEmployeeId({
  required String firstName,
  required String middleInitial,
  required String lastName,
  required DateTime startingDate,
}) {
  final mm = startingDate.month.toString().padLeft(2, '0');
  final dd = startingDate.day.toString().padLeft(2, '0');
  final dateStr = '$mm$dd${startingDate.year}';

  String clean(String s) => s.trim().replaceAll(RegExp(r'[.,]'), '');
  final last = clean(lastName);
  final first = clean(firstName);
  final middle = clean(middleInitial);

  final lastInit = last.isNotEmpty ? last[0].toUpperCase() : 'X';
  final firstInits = first.isNotEmpty
      ? first.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).map((w) => w[0].toUpperCase()).join()
      : 'X';
  final middleInit = middle.isNotEmpty ? middle[0].toUpperCase() : '';
  return '$lastInit$dateStr$firstInits$middleInit';
}
