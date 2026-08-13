import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

const _accentRose = Color(0xFFD4567A);

/// Continuous layer of soft hearts drifting upward.
/// Used as a background flourish on splash, auth and hero surfaces.
class FloatingHearts extends StatefulWidget {
  const FloatingHearts({
    super.key,
    this.count = 14,
    this.light = false,
    this.duration = const Duration(seconds: 26),
  });

  final int count;

  /// When true, hearts render in the site's dark-maroon accent so they stay
  /// visible over light surfaces (auth form panel, CTA).
  final bool light;

  final Duration duration;

  @override
  State<FloatingHearts> createState() => _FloatingHeartsState();
}

class _FloatingHeartsState extends State<FloatingHearts>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final List<_HeartSpec> _hearts;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
    _hearts = List.generate(widget.count, (_) => _HeartSpec.random());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) => CustomPaint(
            painter: _FloatingHeartsPainter(
              progress: _controller.value,
              hearts: _hearts,
              light: widget.light,
            ),
            child: const SizedBox.expand(),
          ),
        ),
      ),
    );
  }
}

class _HeartSpec {
  _HeartSpec.random()
      : x = math.Random().nextDouble(),
        phase = math.Random().nextDouble(),
        speed = 0.6 + math.Random().nextDouble() * 0.9,
        size = 10.0 + math.Random().nextDouble() * 26.0,
        sway = 12.0 + math.Random().nextDouble() * 40.0,
        opacity = 0.18 + math.Random().nextDouble() * 0.32,
        solid = math.Random().nextDouble() > 0.55,
        beatPhase = math.Random().nextDouble() * 3.2;

  final double x;
  final double phase;
  final double speed;
  final double size;
  final double sway;
  final double opacity;
  final bool solid;
  final double beatPhase;
}

class _FloatingHeartsPainter extends CustomPainter {
  _FloatingHeartsPainter({
    required this.progress,
    required this.hearts,
    required this.light,
  });

  final double progress;
  final List<_HeartSpec> hearts;
  final bool light;

  @override
  void paint(Canvas canvas, Size size) {
    for (final h in hearts) {
      final t = (progress * h.speed + h.phase) % 1.0;
      final y = size.height + h.size - t * (size.height + h.size * 2);
      final swayWave = math.sin((progress * 2.6 + h.phase * 4) * math.pi * 2);
      final x = h.x * size.width + swayWave * h.sway;
      final fadeIn = (t / 0.12).clamp(0.0, 1.0);
      final fadeOut = ((1 - t) / 0.22).clamp(0.0, 1.0);
      final alpha = h.opacity * fadeIn * fadeOut;
      if (alpha <= 0.01) continue;

      final pulse =
          0.92 + 0.12 * math.sin((progress * 2.4 + h.beatPhase) * math.pi * 2);

      final color = light
          ? (h.solid
              ? AppColors.primary.withValues(alpha: alpha)
              : _accentRose.withValues(alpha: alpha))
          : (h.solid
              ? AppColors.goldShine.withValues(alpha: alpha)
              : Colors.white.withValues(alpha: alpha));

      final paint = Paint()..color = color;
      canvas.drawPath(_heartPath(Offset(x, y), h.size * pulse), paint);
    }
  }

  /// Classic rounded-heart bezier path pointing up.
  Path _heartPath(Offset center, double s) {
    final path = Path();
    path.moveTo(center.dx, center.dy + s * 0.25);
    path.cubicTo(
      center.dx - s * 0.9,
      center.dy - s * 0.35,
      center.dx - s * 0.55,
      center.dy - s * 0.95,
      center.dx,
      center.dy - s * 0.4,
    );
    path.cubicTo(
      center.dx + s * 0.55,
      center.dy - s * 0.95,
      center.dx + s * 0.9,
      center.dy - s * 0.35,
      center.dx,
      center.dy + s * 0.25,
    );
    path.close();
    return path;
  }

  @override
  bool shouldRepaint(covariant _FloatingHeartsPainter oldDelegate) =>
      oldDelegate.progress != progress ||
      oldDelegate.light != light ||
      oldDelegate.hearts != hearts;
}
