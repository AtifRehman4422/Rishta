import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import 'atelier_atmosphere.dart';
import 'fade_slide.dart';

class GradientHeader extends StatelessWidget {
  const GradientHeader({
    super.key,
    required this.child,
    this.bottomRadius = 36,
    this.animated = true,
    this.compactAtmosphere = true,
  });

  final Widget child;
  final double bottomRadius;
  final bool animated;
  final bool compactAtmosphere;

  @override
  Widget build(BuildContext context) {
    final box = Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(bottomRadius),
          bottomRight: Radius.circular(bottomRadius),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.22),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: AtelierAtmosphere(compact: compactAtmosphere),
          ),
          child,
        ],
      ),
    );

    if (!animated) return box;
    return AnimatedTopBar(child: box);
  }
}

/// Playfair + gold rule title block for tab headers.
class AtelierHeaderTitle extends StatelessWidget {
  const AtelierHeaderTitle({
    super.key,
    required this.title,
    this.subtitle,
  });

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.playfairDisplay(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: Colors.white,
            height: 1.15,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.78),
              fontSize: 13.5,
              height: 1.35,
            ),
          ),
        ],
        const SizedBox(height: 12),
        Container(
          width: 48,
          height: 3,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(99),
            gradient: const LinearGradient(
              colors: [AppColors.gold, AppColors.goldLight],
            ),
          ),
        ),
      ],
    );
  }
}
