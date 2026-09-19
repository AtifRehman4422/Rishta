import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:hum_rishta_mobile/core/theme/app_colors.dart';

void main() {
  test('Hum Rishta brand colors match web frontend', () {
    expect(AppColors.primary, const Color(0xFF9B1B30));
    expect(AppColors.gold, const Color(0xFFD4AF37));
    expect(AppColors.ivory, const Color(0xFFFFF8F3));
  });
}
