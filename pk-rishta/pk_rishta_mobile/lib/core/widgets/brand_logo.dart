import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class BrandLogo extends StatelessWidget {
  const BrandLogo({
    super.key,
    this.height = 72,
    this.animated = false,
    this.heroTag,
  });

  final double height;
  final bool animated;
  final Object? heroTag;

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      'assets/images/logo.png',
      height: height,
      fit: BoxFit.contain,
    );

    Widget child = heroTag != null
        ? Hero(tag: heroTag!, child: image)
        : image;

    if (animated) {
      child = child
          .animate()
          .scale(
            begin: const Offset(0.92, 0.92),
            end: const Offset(1, 1),
            duration: 900.ms,
            curve: Curves.easeOutBack,
          )
          .shimmer(
            duration: 1400.ms,
            color: Colors.white.withValues(alpha: 0.25),
          );
    }

    return child;
  }
}
