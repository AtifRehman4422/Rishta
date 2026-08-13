import 'package:flutter/material.dart';

import '../../features/profile/my_profile_screen.dart';
import '../../features/profile/profile_detail_screen.dart';

/// Lets deep links / notification taps switch the bottom-nav tab.
class ShellNavigator extends ChangeNotifier {
  ShellNavigator._();
  static final ShellNavigator instance = ShellNavigator._();

  int? _pendingTab;
  int? get pendingTab => _pendingTab;

  void goToTab(int index) {
    _pendingTab = index;
    notifyListeners();
  }

  void goHome() => goToTab(0);
  void goSearch() => goToTab(1);
  void goActivity() => goToTab(2);
  void goProfile() => goToTab(3);

  void consume() {
    _pendingTab = null;
  }

  /// Maps web notification links to mobile tab destinations.
  void openNotificationLink(String? link) {
    final path = (link ?? '/dashboard').split('?').first.trim();
    if (path.startsWith('/profile/')) {
      goActivity();
      return;
    }
    switch (path) {
      case '/search':
        goSearch();
        return;
      case '/my-profile':
        goProfile();
        return;
      case '/dashboard':
      case '/admin/contact-requests':
      case '/admin/complaints':
      default:
        goActivity();
    }
  }
}

Future<void> openNotificationDestination(
  BuildContext context,
  String? link,
) async {
  final path = (link ?? '/dashboard').split('?').first.trim();

  if (path.startsWith('/profile/')) {
    final id = path.replaceFirst('/profile/', '').split('/').first;
    if (id.isNotEmpty) {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => ProfileDetailScreen(profileId: id),
        ),
      );
      return;
    }
  }

  if (path == '/my-profile') {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const MyProfileScreen()),
    );
    return;
  }

  ShellNavigator.instance.openNotificationLink(path);
}
