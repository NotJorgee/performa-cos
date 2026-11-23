import 'package:flutter_test/flutter_test.dart';
import 'package:performa_cos/utils/format.dart';
import 'package:performa_cos/utils/geofence.dart';
import 'package:performa_cos/utils/id_generator.dart';

void main() {
  group('geofence', () {
    test('EVSU Ormoc main campus centre is inside the perimeter', () {
      final r = verifyCoordinatesAgainstCampuses(11.0065, 124.6075, defaultCampuses);
      expect(r.isValid, isTrue);
      expect(r.verifiedCampus?.id, 'evsu_ormoc_main');
    });

    test('Tacloban is far outside every campus', () {
      final r = verifyCoordinatesAgainstCampuses(11.2443, 125.0039, defaultCampuses);
      expect(r.isValid, isFalse);
      expect(r.nearestDistanceM, greaterThan(40000));
    });

    test('polygon boundary uses ray casting', () {
      expect(isPointInPolygon(11.0065, 124.6075, defaultMainPolygon), isTrue);
      expect(isPointInPolygon(11.0200, 124.6075, defaultMainPolygon), isFalse);
    });
  });

  test('employee ID matches the web portal format', () {
    final id = generateEvsuEmployeeId(
      firstName: 'Jorge Mikhael',
      middleInitial: 'R',
      lastName: 'Gubantes',
      startingDate: DateTime(2026, 10, 22),
    );
    expect(id, 'G10222026JMR');
  });

  test('name helpers', () {
    expect(getFullFirstName('Jorge Mikhael Gubantes'), 'Jorge Mikhael');
    expect(getFullFirstName('Dr. Maria Clara Ramos'), 'Maria Clara');
    expect(getFullFirstName('Juan R. Dela Cruz'), 'Juan');
    expect(formatDisplayDate('2026-01-05'), 'January 05, 2026');
  });
}
