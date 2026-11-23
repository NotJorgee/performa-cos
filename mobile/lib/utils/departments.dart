import 'package:flutter/material.dart';

/// EVSU Ormoc institutional domains (port of src/utils/departments.js).
class DepartmentDomain {
  const DepartmentDomain(this.key, this.name, this.shortName, this.bg, this.text, this.border,
      [this.departments = const []]);
  final String key;
  final String name;
  final String shortName;
  final Color bg;
  final Color text;
  final Color border;
  final List<String> departments;
}

const _academic = DepartmentDomain('academic', 'Academic Departments', 'Academic', Color(0xFFEFF6FF),
    Color(0xFF1D4ED8), Color(0xFFBFDBFE), [
  'Computer Studies Department',
  'Education Department',
  'Engineering Department',
  'Hospitality & Tourism Management',
  'Technology Department',
]);

const _administrative = DepartmentDomain('administrative', 'Administrative & Fiscal Services',
    'Administrative', Color(0xFFFDF2F8), Color(0xFF9D174D), Color(0xFFFBCFE8), [
  'Administrative and Finance',
  'Campus Director Office',
  'Disbursing / Cashier Office',
  'HRMDO Office',
  'Procurement Office',
]);

const _studentServices = DepartmentDomain('student_services', 'Student Support & Services',
    'Student Services', Color(0xFFF0FDF4), Color(0xFF15803D), Color(0xFFBBF7D0), [
  'Guidance Office',
  'Library Office',
  'Registrar Office',
  'SASO Office',
  'School Clinic',
]);

const _extension = DepartmentDomain('extension_operations', 'Extension & Operations',
    'Extension & Operations', Color(0xFFFAF5FF), Color(0xFF6B21A8), Color(0xFFE9D5FF), [
  'Extension Service Office',
  'IGP Office',
  'IPDO Office',
  'Maintenance/Janitorial (MESO) Office',
  'Quality Assurance & Accreditation Office',
  'Research Office',
  'Sports And Development Office',
]);

const _domains = [_academic, _administrative, _studentServices, _extension];

DepartmentDomain getDepartmentDomain(String? deptName) {
  const general = DepartmentDomain('general', 'Institutional Unit', 'Institutional',
      Color(0xFFF1F5F9), Color(0xFF475569), Color(0xFFCBD5E1));
  if (deptName == null || deptName.trim().isEmpty) {
    return const DepartmentDomain('general', 'General Unit', 'General', Color(0xFFF1F5F9),
        Color(0xFF475569), Color(0xFFCBD5E1));
  }
  final lower = deptName.trim().toLowerCase();
  for (final d in _domains) {
    if (d.departments.any((x) => x.toLowerCase() == lower)) return d;
  }
  bool has(List<String> words) => words.any(lower.contains);
  if (has(['computer', 'education', 'engineering', 'hospitality', 'technology'])) return _academic;
  if (has(['finance', 'director', 'cashier', 'hrmdo', 'procurement'])) return _administrative;
  if (has(['guidance', 'library', 'registrar', 'saso', 'clinic'])) return _studentServices;
  if (has(['research', 'extension', 'ipdo', 'meso', 'maintenance', 'quality', 'igp', 'sports'])) {
    return _extension;
  }
  return general;
}
