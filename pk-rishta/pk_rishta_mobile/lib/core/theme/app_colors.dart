import 'package:flutter/material.dart';

abstract final class AppColors {
  static const primary = Color(0xFF9B1B30);
  static const primaryDark = Color(0xFF6B0F1A);
  static const primaryLight = Color(0xFFC4314E);
  static const gold = Color(0xFFD4AF37);
  static const goldLight = Color(0xFFF5E6B8);
  static const goldShine = Color(0xFFF0D78C);
  static const blush = Color(0xFFFFF0F3);
  static const ivory = Color(0xFFFFF8F3);
  static const text = Color(0xFF2D1B1B);
  static const textMuted = Color(0xFF7A6363);
  static const border = Color(0xFFF0DDD0);
  static const card = Colors.white;

  static const weddingGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryDark, primary, primaryLight],
  );

  static const goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFA67C00), gold, goldLight],
  );

  static const heroOverlay = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xCC6B0F1A),
      Color(0xE69B1B30),
      Color(0xF2FFF8F3),
    ],
  );

  static const romanticBackground = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xFFFFF8F3), // ivory
      Color(0xFFFFF0F3), // blush
      Color(0xFFFDF3EE), // soft peach
    ],
  );
}
