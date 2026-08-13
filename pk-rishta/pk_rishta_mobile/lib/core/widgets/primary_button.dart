import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

enum PrimaryButtonStyle { wedding, gold, outline, light }

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.style = PrimaryButtonStyle.wedding,
    this.expanded = false,
  });

  final String label;
  final VoidCallback onPressed;
  final IconData? icon;
  final PrimaryButtonStyle style;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final labelStyle = TextStyle(
      fontWeight: FontWeight.w700,
      fontSize: expanded ? 13.5 : 14,
      color: switch (style) {
        PrimaryButtonStyle.gold => AppColors.primaryDark,
        PrimaryButtonStyle.outline => AppColors.primary,
        PrimaryButtonStyle.light => Colors.white,
        PrimaryButtonStyle.wedding => Colors.white,
      },
    );
    final labelWidget = Text(
      label,
      maxLines: 1,
      softWrap: false,
      overflow: TextOverflow.ellipsis,
      textAlign: TextAlign.center,
      style: labelStyle,
    );
    final child = Row(
      mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Icon(icon, size: expanded ? 16 : 18),
          SizedBox(width: expanded ? 6 : 8),
        ],
        if (expanded) Flexible(child: labelWidget) else labelWidget,
      ],
    );

    final decoration = switch (style) {
      PrimaryButtonStyle.wedding => BoxDecoration(
          gradient: AppColors.weddingGradient,
          borderRadius: BorderRadius.circular(999),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.28),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
      PrimaryButtonStyle.gold => BoxDecoration(
          gradient: AppColors.goldGradient,
          borderRadius: BorderRadius.circular(999),
          boxShadow: [
            BoxShadow(
              color: AppColors.gold.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
      PrimaryButtonStyle.outline => BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.primary, width: 2),
        ),
      PrimaryButtonStyle.light => BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white.withValues(alpha: 0.75), width: 1.5),
        ),
    };

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          width: expanded ? double.infinity : null,
          padding: EdgeInsets.symmetric(
            horizontal: expanded ? 12 : 22,
            vertical: 14,
          ),
          decoration: decoration,
          child: child,
        ),
      ),
    );
  }
}
