import 'package:flutter/material.dart';

/// PerformaCOS design tokens (mirrors the :root variables of the web portal's style.css).
class AppColors {
  static const brand600 = Color(0xFF7A1128);
  static const brand700 = Color(0xFF57091C);
  static const brand50 = Color(0xFFFBEAEE);
  static const brandBorder = Color(0xFFE9C7D0);
  static const loginBg = Color(0xFF4A0718);

  static const ink900 = Color(0xFF10192B);
  static const ink800 = Color(0xFF1E293B);
  static const ink700 = Color(0xFF33415C);
  static const ink500 = Color(0xFF64748B);
  static const ink300 = Color(0xFFCBD5E1);
  static const line = Color(0xFFE6EAF0);
  static const bg = Color(0xFFF5F7FB);
  static const white = Colors.white;
  static const surfaceMuted = Color(0xFFFAFBFC);

  static const green700 = Color(0xFF15803D);
  static const green600 = Color(0xFF16A34A);
  static const green50 = Color(0xFFE9F9EF);
  static const greenText = Color(0xFF0F6B32);
  static const greenBorder = Color(0xFFBFE8CD);
  static const amber700 = Color(0xFF92400E);
  static const amber600 = Color(0xFFB45309);
  static const amber50 = Color(0xFFFEF3E0);
  static const red700 = Color(0xFFB91C1C);
  static const red600 = Color(0xFFDC2626);
  static const red50 = Color(0xFFFDECEC);
  static const redBorder = Color(0xFFF3C2C2);
  static const sky = Color(0xFF38BDF8);
  static const slate900 = Color(0xFF0F172A);
}

ThemeData buildAppTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brand600,
      primary: AppColors.brand600,
      onPrimary: Colors.white,
      surface: AppColors.white,
    ),
    scaffoldBackgroundColor: AppColors.bg,
    fontFamily: 'Segoe UI',
  );

  final inputBorder = OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: const BorderSide(color: AppColors.line),
  );

  return base.copyWith(
    textTheme: base.textTheme.apply(bodyColor: AppColors.ink900, displayColor: AppColors.ink900),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.white,
      foregroundColor: AppColors.ink900,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      surfaceTintColor: Colors.transparent,
    ),
    dividerColor: AppColors.line,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.white,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      hintStyle: const TextStyle(color: AppColors.ink500, fontSize: 14),
      border: inputBorder,
      enabledBorder: inputBorder,
      disabledBorder: inputBorder,
      focusedBorder: inputBorder.copyWith(
        borderSide: const BorderSide(color: AppColors.brand600, width: 1.4),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brand600,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.brand600.withValues(alpha: 0.5),
        disabledForegroundColor: Colors.white70,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.ink800,
        side: const BorderSide(color: AppColors.line),
        backgroundColor: AppColors.white,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      ),
    ),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}
