import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/brand_logo.dart';
import '../../core/widgets/floating_hearts.dart';
import '../shell/app_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 2600), _goHome);
  }

  void _goHome() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        transitionDuration: const Duration(milliseconds: 700),
        pageBuilder: (context, animation, secondaryAnimation) => const AppShell(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
            child: child,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(gradient: AppColors.weddingGradient),
        child: Stack(
          children: [
            const FloatingHearts(count: 16),
            Positioned(
              top: -40,
              right: -20,
              child: Icon(Icons.favorite, size: 120, color: Colors.white.withValues(alpha: 0.08)),
            ),
            Positioned(
              bottom: 80,
              left: -30,
              child: Icon(Icons.favorite, size: 90, color: Colors.white.withValues(alpha: 0.06)),
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const BrandLogo(height: 150, animated: true, heroTag: 'pk-logo')
                    .animate()
                    .fadeIn(duration: 500.ms)
                    .scale(
                      begin: const Offset(0.85, 0.85),
                      end: const Offset(1, 1),
                      duration: 700.ms,
                      curve: Curves.easeOutBack,
                    ),
                const SizedBox(height: 24),
                Text(
                  'Making Meaningful Matches',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.goldLight,
                        letterSpacing: 1.2,
                      ),
                )
                    .animate(delay: 400.ms)
                    .fadeIn(duration: 500.ms)
                    .slideY(begin: 0.2, end: 0),
                const SizedBox(height: 36),
                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppColors.goldLight.withValues(alpha: 0.9),
                  ),
                ).animate(delay: 800.ms).fadeIn(),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
