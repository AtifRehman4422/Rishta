import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/theme/app_colors.dart';
import '../../core/state/shell_navigator.dart';
import '../../data/models/search_filters.dart';
import '../auth/login_screen.dart';
import '../home/home_screen.dart';
import '../profile/my_profile_screen.dart';
import '../profile/profile_screen.dart';
import '../search/search_screen.dart';
import '../activity/activity_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  final _searchKey = GlobalKey<SearchScreenState>();

  late final List<Widget> _screens = [
    HomeScreen(
      onNavigateTab: _setTab,
      onLogin: _openLogin,
      onCompleteProfile: _openMyProfile,
      onSearchWithFilters: _openSearchWithFilters,
    ),
    SearchScreen(
      key: _searchKey,
      onLogin: _openLogin,
      onCompleteProfile: _openMyProfile,
    ),
    ActivityScreen(onLogin: _openLogin, onCompleteProfile: _openMyProfile),
    ProfileScreen(onLogin: _openLogin),
  ];

  @override
  void initState() {
    super.initState();
    ShellNavigator.instance.addListener(_onShellNav);
  }

  @override
  void dispose() {
    ShellNavigator.instance.removeListener(_onShellNav);
    super.dispose();
  }

  void _onShellNav() {
    final tab = ShellNavigator.instance.pendingTab;
    if (tab == null) return;
    ShellNavigator.instance.consume();
    _setTab(tab);
  }

  void _setTab(int index) {
    if (_index == index) return;
    setState(() => _index = index);
  }

  void _openSearchWithFilters(SearchFilters filters) {
    _searchKey.currentState?.applyFilters(filters);
    _setTab(1);
  }

  Future<void> _openLogin() {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
    );
  }

  Future<void> _openMyProfile() {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const MyProfileScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: AppColors.ivory,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.romanticBackground),
        child: Stack(
          fit: StackFit.expand,
          children: [
            const Positioned(
              top: -140,
              right: -120,
              child: _Glow(size: 340, color: Color(0x1FD4AF37)),
            ),
            const Positioned(
              bottom: -160,
              left: -140,
              child: _Glow(size: 380, color: Color(0x1AD4567A)),
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              child: IndexedStack(
                index: _index,
                children: _screens,
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, 0, 16, 10 + (bottomInset > 0 ? 2 : 0)),
          child: _AtelierBottomNav(
            index: _index,
            onTap: _setTab,
          )
              .animate()
              .fadeIn(duration: 450.ms, curve: Curves.easeOut)
              .slideY(begin: 0.25, end: 0, duration: 550.ms, curve: Curves.easeOutCubic),
        ),
      ),
    );
  }
}

class _AtelierBottomNav extends StatelessWidget {
  const _AtelierBottomNav({
    required this.index,
    required this.onTap,
  });

  final int index;
  final ValueChanged<int> onTap;

  static const _items = [
    (Icons.home_outlined, Icons.home_rounded, 'Home'),
    (Icons.search_outlined, Icons.search_rounded, 'Search'),
    (Icons.favorite_border_rounded, Icons.favorite_rounded, 'Activity'),
    (Icons.person_outline_rounded, Icons.person_rounded, 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: AppColors.gold.withValues(alpha: 0.12),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          for (var i = 0; i < _items.length; i++)
            Expanded(
              child: _NavItem(
                inactiveIcon: _items[i].$1,
                activeIcon: _items[i].$2,
                label: _items[i].$3,
                selected: index == i,
                onTap: () => onTap(i),
              ),
            ),
        ],
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color, color.withValues(alpha: 0)],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.inactiveIcon,
    required this.activeIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData inactiveIcon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: selected ? AppColors.weddingGradient : null,
            color: selected ? null : Colors.transparent,
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.28),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                selected ? activeIcon : inactiveIcon,
                size: selected ? 22 : 22,
                color: selected ? Colors.white : const Color(0xFFB39A9A),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                  letterSpacing: 0.2,
                  color: selected ? Colors.white : const Color(0xFFB39A9A),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
