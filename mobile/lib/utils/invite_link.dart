/// Extracts the invitation token carried by a registration link.
///
/// Accepted shapes (all produced by the Performa-COS backend or by HR copying a link):
///   https://app.example/?token=EVSU-INV-COS-12345
///   https://app.example/?invite=EVSU-INV-COS-12345
///   https://app.example/register/EVSU-INV-COS-12345
///   https://app.example/#/register?token=EVSU-INV-COS-12345
///   performacos://register?token=EVSU-INV-COS-12345
///   performacos://register/EVSU-INV-COS-12345
String? invitationTokenFromUri(Uri uri) {
  final q = uri.queryParameters['token'] ?? uri.queryParameters['invite'];
  if (q != null && q.trim().isNotEmpty) return q.trim();

  final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
  // performacos://register/<token>: "register" is the host, the token the only path segment.
  if (uri.host == 'register' && segments.length == 1 && segments.first.trim().isNotEmpty) {
    return segments.first.trim();
  }
  final i = segments.indexOf('register');
  if (i >= 0 && i + 1 < segments.length && segments[i + 1].trim().isNotEmpty) {
    return segments[i + 1].trim();
  }

  if (uri.fragment.isNotEmpty) {
    final frag = uri.fragment.startsWith('/') ? uri.fragment.substring(1) : uri.fragment;
    final nested = Uri.tryParse(frag);
    if (nested != null) return invitationTokenFromUri(nested);
  }
  return null;
}

/// Same as [invitationTokenFromUri] but tolerant of raw text (a pasted link or a bare token).
String? invitationTokenFromText(String text) {
  final t = text.trim();
  if (t.isEmpty) return null;
  final uri = Uri.tryParse(t);
  if (uri != null && (uri.hasScheme || t.contains('?') || t.contains('/'))) {
    final fromUri = invitationTokenFromUri(uri);
    if (fromUri != null) return fromUri;
  }
  return RegExp(r'^[A-Za-z0-9-]+$').hasMatch(t) ? t : null;
}
