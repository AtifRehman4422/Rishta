import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../state/auth_controller.dart';
import '../theme/app_colors.dart';
import 'fade_slide.dart';
import 'primary_button.dart';

/// Blurs real content behind a login / complete-profile card ("dundla" preview).
class ProfileAccessGate extends StatelessWidget {
  const ProfileAccessGate({
    super.key,
    required this.child,
    required this.onLogin,
    required this.onCompleteProfile,
    this.onRegister,
    this.enabled = true,
    this.minHeight = 280,
    this.blurSigma = 16,
  });

  final Widget child;
  final VoidCallback onLogin;
  final VoidCallback onCompleteProfile;
  final VoidCallback? onRegister;
  final bool enabled;
  final double minHeight;
  final double blurSigma;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AuthController.instance,
      builder: (context, _) {
        final canView = !enabled || AuthController.instance.canViewProfiles;
        if (canView) return child;

        final loggedIn = AuthController.instance.isLoggedIn;
        final card = Padding(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
          child: FadeSlide(
            child: _AccessCard(
              loggedIn: loggedIn,
              onLogin: onLogin,
              onRegister: onRegister ?? onLogin,
              onCompleteProfile: onCompleteProfile,
            ),
          ),
        );
        final blurred = IgnorePointer(
          child: ImageFiltered(
            imageFilter: ImageFilter.blur(
              sigmaX: blurSigma,
              sigmaY: blurSigma,
              tileMode: TileMode.decal,
            ),
            child: child,
          ),
        );

        return LayoutBuilder(
          builder: (context, constraints) {
            final expand = constraints.hasBoundedHeight && constraints.maxHeight.isFinite;
            if (expand) {
              return Stack(
                fit: StackFit.expand,
                alignment: Alignment.topCenter,
                children: [
                  blurred,
                  Align(alignment: Alignment.topCenter, child: card),
                ],
              );
            }
            return Stack(
              alignment: Alignment.topCenter,
              children: [
                ConstrainedBox(
                  constraints: BoxConstraints(minHeight: minHeight),
                  child: blurred,
                ),
                card,
              ],
            );
          },
        );
      },
    );
  }
}

class _AccessCard extends StatelessWidget {
  const _AccessCard({
    required this.loggedIn,
    required this.onLogin,
    required this.onRegister,
    required this.onCompleteProfile,
  });

  final bool loggedIn;
  final VoidCallback onLogin;
  final VoidCallback onRegister;
  final VoidCallback onCompleteProfile;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 12,
      shadowColor: AppColors.primary.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 26, 24, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: AppColors.goldGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withValues(alpha: 0.35),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: const Icon(Icons.lock_rounded, color: AppColors.primaryDark, size: 26),
            ),
            const SizedBox(height: 14),
            Text(
              loggedIn ? 'Complete your profile first' : 'Login to view profiles',
              textAlign: TextAlign.center,
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              loggedIn
                  ? 'Fill required fields to unlock search and matching profiles.'
                  : 'Profiles are blurred for privacy. Login or register to continue.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted, height: 1.45, fontSize: 14),
            ),
            const SizedBox(height: 20),
            if (!loggedIn) ...[
              PrimaryButton(
                label: 'Login',
                icon: Icons.login_rounded,
                expanded: true,
                onPressed: onLogin,
              ),
              const SizedBox(height: 10),
              PrimaryButton(
                label: 'Register Free',
                style: PrimaryButtonStyle.outline,
                expanded: true,
                onPressed: onRegister,
              ),
            ] else
              PrimaryButton(
                label: 'Complete Your Profile',
                icon: Icons.edit_outlined,
                style: PrimaryButtonStyle.gold,
                expanded: true,
                onPressed: onCompleteProfile,
              ),
          ],
        ),
      ),
    );
  }
}
