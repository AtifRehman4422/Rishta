import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/state/auth_controller.dart';
import '../../core/state/notification_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/atelier_atmosphere.dart';
import '../../core/widgets/brand_logo.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_avatar.dart';
import '../auth/register_screen.dart';
import '../info/info_screens.dart';
import '../admin/admin_complaints_screen.dart';
import 'favorites_screen.dart';
import 'my_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.onLogin});

  final VoidCallback onLogin;

  @override
  State<ProfileScreen> createState() => ProfileScreenState();
}

class ProfileScreenState extends State<ProfileScreen> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  /// Scrolls this tab's list back to the top when its nav item is tapped.
  void scrollToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _open(BuildContext context, Widget page) {
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));
  }

  void _openMyProfile(BuildContext context) {
    if (!AuthController.instance.isLoggedIn) {
      widget.onLogin();
      return;
    }
    _open(context, const MyProfileScreen());
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListenableBuilder(
        listenable: Listenable.merge([
          AuthController.instance,
          NotificationController.instance,
        ]),
        builder: (context, _) {
          final auth = AuthController.instance;
          final incomplete = auth.needsProfileCompletion;
          final unread = auth.isLoggedIn
              ? NotificationController.instance.unreadCount
              : 0;
          return ListView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            children: [
              FadeSlide(
                child: auth.isLoggedIn
                    ? _AccountCard(
                        onCompleteProfile: () => _openMyProfile(context),
                      )
                    : _GuestCard(onLogin: widget.onLogin),
              ),
              const SizedBox(height: 22),
              FadeSlide(
                delay: 120.ms,
                child: _MenuSection(
                  title: 'Account',
                  items: [
                    _MenuItem(
                      icon: incomplete ? Icons.edit_outlined : Icons.person_outline,
                      label: incomplete ? 'Complete Profile' : 'My Profile',
                      onTap: () => _openMyProfile(context),
                    ),
                    _MenuItem(
                      icon: Icons.notifications_none_rounded,
                      label: 'Notifications',
                      badgeCount: unread,
                      onTap: () {
                        if (!auth.isLoggedIn) {
                          widget.onLogin();
                          return;
                        }
                        _open(context, const NotificationsScreen());
                      },
                    ),
                    if (auth.isAdmin)
                      _MenuItem(
                        icon: Icons.forum_outlined,
                        label: 'Complaint Chats',
                        onTap: () => _open(context, const AdminComplaintsScreen()),
                      ),
                    _MenuItem(
                      icon: Icons.favorite_border_rounded,
                      label: 'Favorites',
                      onTap: () {
                        if (!auth.isLoggedIn) {
                          widget.onLogin();
                          return;
                        }
                        _open(context, const FavoritesScreen());
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              FadeSlide(
                delay: 220.ms,
                child: _MenuSection(
                  title: 'More',
                  items: [
                    _MenuItem(
                      icon: Icons.article_outlined,
                      label: 'Blog & Tips',
                      onTap: () => _open(context, const BlogScreen()),
                    ),
                    _MenuItem(
                      icon: Icons.info_outline,
                      label: 'About PK Rishta',
                      onTap: () => _open(context, const AboutScreen()),
                    ),
                    _MenuItem(
                      icon: Icons.support_agent_outlined,
                      label: 'Contact Support',
                      onTap: () => _open(context, const ContactScreen()),
                    ),
                    _MenuItem(
                      icon: Icons.privacy_tip_outlined,
                      label: 'Privacy Policy',
                      onTap: () => _open(context, const PrivacyScreen()),
                    ),
                    _MenuItem(
                      icon: Icons.description_outlined,
                      label: 'Terms of Service',
                      onTap: () => _open(context, const TermsScreen()),
                    ),
                  ],
                ),
              ),
              if (auth.isLoggedIn) ...[
                const SizedBox(height: 20),
                FadeSlide(
                  delay: 280.ms,
                  child: PrimaryButton(
                    label: 'Logout',
                    icon: Icons.logout_rounded,
                    style: PrimaryButtonStyle.outline,
                    expanded: true,
                    onPressed: () => auth.logout(),
                  ),
                ),
              ],
              const SizedBox(height: 12),
            ],
          );
        },
      ),
    );
  }
}

class _AccountCard extends StatelessWidget {
  const _AccountCard({this.onCompleteProfile});

  final VoidCallback? onCompleteProfile;

  @override
  Widget build(BuildContext context) {
    final user = AuthController.instance.user!;
    final incomplete = AuthController.instance.needsProfileCompletion;
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: Stack(
        children: [
          const Positioned.fill(child: AtelierAtmosphere(compact: true)),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              children: [
                ProfileAvatar(
                  photoUrl: user.profilePhoto,
                  gender: user.gender ?? '',
                  firstName: user.firstName ?? '',
                  lastName: user.lastName ?? '',
                  size: 72,
                  borderWidth: 2,
                  showVerified: true,
                  verified: user.profileVerified,
                ),
                const SizedBox(height: 14),
                Text(
                  user.displayName,
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(user.email, style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    _Tag(label: user.isAdmin ? 'Admin' : 'Member'),
                    _Tag(label: incomplete ? 'Profile incomplete' : 'Profile complete'),
                  ],
                ),
                if (incomplete) ...[
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                    ),
                    child: const Text(
                      '🔒 Complete your profile first to unlock search, matching, and activity — same as the website.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, height: 1.4, fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 12),
                  PrimaryButton(
                    label: 'Complete Your Profile',
                    icon: Icons.edit_outlined,
                    style: PrimaryButtonStyle.gold,
                    expanded: true,
                    onPressed: onCompleteProfile ?? () {},
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

class _GuestCard extends StatelessWidget {
  const _GuestCard({required this.onLogin});

  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: Stack(
        children: [
          const Positioned.fill(child: AtelierAtmosphere(compact: true)),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              children: [
                const BrandLogo(height: 88),
                const SizedBox(height: 16),
                Text(
                  'Welcome to PK Rishta',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in to manage your profile, send requests, and receive notifications.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, height: 1.5),
                ),
                const SizedBox(height: 18),
                PrimaryButton(
                  label: 'Login',
                  style: PrimaryButtonStyle.gold,
                  expanded: true,
                  onPressed: onLogin,
                ),
                const SizedBox(height: 10),
                PrimaryButton(
                  label: 'Create Account',
                  style: PrimaryButtonStyle.light,
                  expanded: true,
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => const RegisterScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  const _MenuSection({
    required this.title,
    required this.items,
  });

  final String title;
  final List<_MenuItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.playfairDisplay(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.text,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: 36,
          height: 3,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(99),
            gradient: const LinearGradient(colors: [AppColors.primary, AppColors.gold]),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.05),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Material(
            color: Colors.transparent,
            child: Column(
                  children: [
                for (var i = 0; i < items.length; i++) ...[
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.blush,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(items[i].icon, color: AppColors.primary, size: 20),
                    ),
                    title: Text(items[i].label, style: const TextStyle(fontWeight: FontWeight.w600)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if ((items[i].badgeCount ?? 0) > 0)
                          Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              items[i].badgeCount! > 9 ? '9+' : '${items[i].badgeCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                      ],
                    ),
                    onTap: items[i].onTap,
                  ),
                  if (i != items.length - 1) const Divider(height: 1, indent: 72),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MenuItem {
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badgeCount,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int? badgeCount;
}
