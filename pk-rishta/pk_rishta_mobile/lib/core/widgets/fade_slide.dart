import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Soft entrance used across list/content screens.
class FadeSlide extends StatelessWidget {
  const FadeSlide({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.offset = const Offset(0, 0.12),
    this.duration = const Duration(milliseconds: 550),
  });

  final Widget child;
  final Duration delay;
  final Offset offset;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(delay: delay)
        .fadeIn(duration: duration, curve: Curves.easeOutCubic)
        .slideY(
          begin: offset.dy,
          end: 0,
          duration: duration,
          curve: Curves.easeOutCubic,
        );
  }
}

/// Top-of-screen header motion used app-wide.
class AnimatedTopBar extends StatelessWidget {
  const AnimatedTopBar({
    super.key,
    required this.child,
    this.delay = Duration.zero,
  });

  final Widget child;
  final Duration delay;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(delay: delay)
        .fadeIn(duration: 480.ms, curve: Curves.easeOut)
        .slideY(begin: -0.18, end: 0, duration: 560.ms, curve: Curves.easeOutCubic);
  }
}

/// Staggered section card entrance.
class AnimatedSection extends StatelessWidget {
  const AnimatedSection({
    super.key,
    required this.child,
    required this.index,
  });

  final Widget child;
  final int index;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(delay: (80 + index * 70).ms)
        .fadeIn(duration: 420.ms)
        .slideY(begin: 0.08, end: 0, duration: 480.ms, curve: Curves.easeOutCubic)
        .scale(
          begin: const Offset(0.98, 0.98),
          end: const Offset(1, 1),
          duration: 480.ms,
          curve: Curves.easeOutCubic,
        );
  }
}
