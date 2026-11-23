import 'package:flutter_test/flutter_test.dart';
import 'package:performa_cos/utils/invite_link.dart';

void main() {
  group('invitation links', () {
    test('backend email link (?token=)', () {
      expect(invitationTokenFromUri(Uri.parse('https://cos.example.edu/?token=EVSU-INV-COS-12345')),
          'EVSU-INV-COS-12345');
    });

    test('legacy ?invite= link', () {
      expect(invitationTokenFromUri(Uri.parse('https://cos.example.edu/?invite=EVSU-INV-COS-12345')),
          'EVSU-INV-COS-12345');
    });

    test('custom scheme used by the Android / iOS app', () {
      expect(invitationTokenFromUri(Uri.parse('performacos://register?token=EVSU-INV-COS-777')),
          'EVSU-INV-COS-777');
      expect(invitationTokenFromUri(Uri.parse('performacos://register/EVSU-INV-COS-777')), 'EVSU-INV-COS-777');
    });

    test('path and hash variants', () {
      expect(invitationTokenFromUri(Uri.parse('https://cos.example.edu/register/EVSU-INV-COS-1')),
          'EVSU-INV-COS-1');
      expect(invitationTokenFromUri(Uri.parse('https://cos.example.edu/#/register?token=EVSU-INV-COS-2')),
          'EVSU-INV-COS-2');
    });

    test('links without a token yield null', () {
      expect(invitationTokenFromUri(Uri.parse('https://cos.example.edu/')), isNull);
      expect(invitationTokenFromUri(Uri.parse('https://cos.example.edu/?token=')), isNull);
    });

    test('pasted text accepts a link or a bare token', () {
      expect(invitationTokenFromText(' https://cos.example.edu/?token=EVSU-INV-COS-9 '), 'EVSU-INV-COS-9');
      expect(invitationTokenFromText('EVSU-INV-COS-9'), 'EVSU-INV-COS-9');
      expect(invitationTokenFromText('not a token!'), isNull);
    });
  });
}
