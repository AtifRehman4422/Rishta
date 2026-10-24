import 'dart:async';

import 'package:flutter/material.dart';

import 'core/ads/ads_controller.dart';
import 'core/config/api_config.dart';
import 'core/state/auth_controller.dart';
import 'core/state/notification_controller.dart';
import 'core/theme/app_theme.dart';
import 'features/splash/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.init();
  await AuthController.instance.bootstrap();
  await NotificationController.instance.bootstrap();
  runApp(const HumRishtaApp());
  unawaited(AdsController.instance.init());
}

class HumRishtaApp extends StatelessWidget {
  const HumRishtaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hum Rishta',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light().copyWith(
        pageTransitionsTheme: const PageTransitionsTheme(
          builders: {
            TargetPlatform.android: _SoftPageTransition(),
            TargetPlatform.iOS: _SoftPageTransition(),
            TargetPlatform.windows: _SoftPageTransition(),
            TargetPlatform.macOS: _SoftPageTransition(),
            TargetPlatform.linux: _SoftPageTransition(),
          },
        ),
      ),
      home: const SplashScreen(),
    );
  }
}

class _SoftPageTransition extends PageTransitionsBuilder {
  const _SoftPageTransition();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.04),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      ),
    );
  }
}
