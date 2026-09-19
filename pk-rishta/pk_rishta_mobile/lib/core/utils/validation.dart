/// Shared field validators mirroring the web app
/// (frontend/src/app/core/utils/validation.ts).
library;

final RegExp emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');
final RegExp nameRe = RegExp(r"^[a-zA-Z\u0600-\u06FF\s.'-]{2,80}$");
final RegExp pkPhoneRe = RegExp(r'^(\+92|0)?3[0-9]{2}[\s-]?[0-9]{7}$');
final RegExp intlPhoneRe = RegExp(r'^\+[1-9]\d{7,14}$');

String normalizePhone(String value) => value.replaceAll(RegExp(r'[\s()-]'), '');

bool isEmptyValue(String? value) => value == null || value.trim().isEmpty;

String? validateRequired(String? value, String label) {
  if (isEmptyValue(value)) return '$label is required';
  return null;
}

String? validateEmail(String? value) {
  if (isEmptyValue(value)) return 'Email is required';
  if (!emailRe.hasMatch(value!.trim())) return 'Enter a valid email address';
  return null;
}

String? validateEmailOptional(String? value) {
  if (isEmptyValue(value)) return null;
  if (!emailRe.hasMatch(value!.trim())) return 'Enter a valid email address';
  return null;
}

String? validateName(String? value, String label) {
  final required = validateRequired(value, label);
  if (required != null) return required;
  if (!nameRe.hasMatch(value!.trim())) {
    return '$label must be 2–80 characters (letters only)';
  }
  return null;
}

String? validatePhone(String? value, {bool required = false}) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) return required ? 'Phone number is required' : null;
  final normalized = normalizePhone(trimmed);
  if (pkPhoneRe.hasMatch(normalized) || intlPhoneRe.hasMatch(normalized)) return null;
  return 'Enter a valid number (e.g. +92 300 1234567, +1 416 555 0100, +971 50 123 4567)';
}

String? validatePassword(String? value, {int minLen = 8}) {
  if (isEmptyValue(value)) return 'Password is required';
  if (value!.length < minLen) return 'Password must be at least $minLen characters';
  if (!RegExp(r'[a-zA-Z]').hasMatch(value) || !RegExp(r'[0-9]').hasMatch(value)) {
    return 'Password must include letters and numbers';
  }
  return null;
}

String? validateMinLength(String? value, int min, String label) {
  final required = validateRequired(value, label);
  if (required != null) return required;
  if (value!.trim().length < min) return '$label must be at least $min characters';
  return null;
}

int? calcAgeFromDob(String dob) {
  final birth = DateTime.tryParse(dob);
  if (birth == null) return null;
  final today = DateTime.now();
  var age = today.year - birth.year;
  final m = today.month - birth.month;
  if (m < 0 || (m == 0 && today.day < birth.day)) age--;
  return age;
}

String? validateDobAge(String? dob, {int minAge = 18, int maxAge = 80}) {
  final required = validateRequired(dob, 'Date of birth');
  if (required != null) return required;
  final age = calcAgeFromDob(dob!);
  if (age == null) return 'Enter a valid date of birth';
  if (age < minAge) return 'You must be at least $minAge years old';
  if (age > maxAge) return 'Age cannot exceed $maxAge years';
  return null;
}

String? validateAgeRange(int? min, int? max) {
  if (min != null && (min < 18 || min > 80)) return 'Minimum age must be between 18 and 80';
  if (max != null && (max < 18 || max > 80)) return 'Maximum age must be between 18 and 80';
  if (min != null && max != null && min > max) {
    return 'Minimum age cannot exceed maximum age';
  }
  return null;
}

String? validateHeightRange(int? minCm, int? maxCm) {
  if (minCm != null && (minCm < 120 || minCm > 230)) return 'Minimum height is out of range';
  if (maxCm != null && (maxCm < 120 || maxCm > 230)) return 'Maximum height is out of range';
  if (minCm != null && maxCm != null && minCm > maxCm) {
    return 'Minimum height cannot exceed maximum height';
  }
  return null;
}

String? validateWeightKg(String? value) {
  if (isEmptyValue(value)) return 'Please enter your weight';
  final n = double.tryParse(value!.trim());
  if (n == null) return 'Please enter your weight';
  if (n < 30 || n > 200) return 'Enter a valid weight (30–200 kg)';
  return null;
}
