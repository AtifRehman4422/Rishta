import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Shared maroon silk + gold ring atmosphere used across auth & main tabs.
class AtelierAtmosphere extends StatelessWidget {
  const AtelierAtmosphere({
    super.key,
    this.compact = false,
  });

  /// When true, rings sit higher for shorter headers (Search / Activity).
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: AtelierAtmospherePainter(compact: compact),
      child: const SizedBox.expand(),
    );
  }
}

class AtelierAtmospherePainter extends CustomPainter {
  AtelierAtmospherePainter({this.compact = false});

  final bool compact;

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFF4A0A14),
          AppColors.primaryDark,
          AppColors.primary,
          Color(0xFF7A1528),
        ],
        stops: [0, 0.35, 0.7, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, bg);

    final wash = Paint()
      ..shader = RadialGradient(
        center: Alignment(compact ? 0.9 : 0.85, compact ? -0.2 : -0.55),
        radius: compact ? 1.35 : 1.1,
        colors: [
          AppColors.gold.withValues(alpha: 0.28),
          AppColors.gold.withValues(alpha: 0.0),
        ],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, wash);

    _drawSilkArc(
      canvas,
      Offset(size.width * 1.05, size.height * (compact ? 0.02 : 0.08)),
      size.width * 0.72,
      AppColors.gold.withValues(alpha: 0.12),
    );
    _drawSilkArc(
      canvas,
      Offset(size.width * 1.12, size.height * (compact ? 0.28 : 0.18)),
      size.width * 0.55,
      Colors.white.withValues(alpha: 0.06),
    );
    _drawSilkArc(
      canvas,
      Offset(-size.width * 0.15, size.height * (compact ? 0.85 : 0.42)),
      size.width * 0.55,
      AppColors.primaryLight.withValues(alpha: 0.22),
    );

    final ringCenter = Offset(
      size.width * 0.82,
      size.height * (compact ? 0.28 : 0.16),
    );
    final ring = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..color = AppColors.gold.withValues(alpha: 0.45);
    canvas.drawCircle(ringCenter, compact ? 22 : 34, ring);
    canvas.drawCircle(
      ringCenter,
      compact ? 34 : 46,
      ring..color = AppColors.gold.withValues(alpha: 0.22),
    );

    final sparkle = Paint()..color = AppColors.goldShine.withValues(alpha: 0.55);
    for (final p in [
      Offset(size.width * 0.14, size.height * 0.18),
      Offset(size.width * 0.38, size.height * 0.1),
      Offset(size.width * 0.58, size.height * 0.32),
      Offset(size.width * 0.9, size.height * 0.55),
    ]) {
      canvas.drawCircle(p, 1.6, sparkle);
    }
  }

  void _drawSilkArc(Canvas canvas, Offset c, double r, Color color) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 48
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      math.pi * 0.85,
      math.pi * 0.9,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant AtelierAtmospherePainter oldDelegate) =>
      oldDelegate.compact != compact;
}
