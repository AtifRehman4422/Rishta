import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/state/favorites_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/atelier_atmosphere.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/floating_hearts.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_card.dart';
import '../../data/models/profile_model.dart';
import 'profile_detail_screen.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  void _openProfile(BuildContext context, Profile profile) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            ProfileDetailScreen(profileId: profile.id, preview: profile),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ivory,
      body: ListenableBuilder(
        listenable: FavoritesController.instance,
        builder: (context, _) {
          final favorites = FavoritesController.instance;
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () => FavoritesController.instance.load(),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverAppBar(
                  pinned: true,
                  expandedHeight: 180,
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  surfaceTintColor: Colors.transparent,
                  leading: const BackButton(color: Colors.white),
                  flexibleSpace: FlexibleSpaceBar(
                    collapseMode: CollapseMode.parallax,
                    titlePadding: const EdgeInsetsDirectional.only(
                      start: 64,
                      bottom: 16,
                    ),
                    title: Text(
                      'Favorites',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        const Positioned.fill(child: AtelierAtmosphere()),
                        FloatingHearts(count: 10),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Padding(
                            padding: const EdgeInsets.only(
                              right: 20,
                              bottom: 18,
                            ),
                            child: Icon(
                              Icons.favorite_rounded,
                              color: Colors.white.withValues(alpha: 0.25),
                              size: 64,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (favorites.loading && favorites.profiles.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                      ),
                    ),
                  )
                else if (favorites.profiles.isEmpty)
                  _EmptyState(onBrowse: () => Navigator.of(context).maybePop())
                else ...[
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              gradient: AppColors.goldGradient,
                              borderRadius: BorderRadius.circular(999),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.gold.withValues(alpha: 0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.favorite_rounded,
                                  color: AppColors.primaryDark,
                                  size: 15,
                                ),
                                SizedBox(width: 6),
                                Text(
                                  'Saved',
                                  style: TextStyle(
                                    color: AppColors.primaryDark,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            '${favorites.profiles.length} profile${favorites.profiles.length == 1 ? '' : 's'} in your favorites',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontWeight: FontWeight.w600,
                              fontSize: 13.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 14,
                            crossAxisSpacing: 14,
                            mainAxisExtent: 248,
                          ),
                      delegate: SliverChildBuilderDelegate((context, index) {
                        final profile = favorites.profiles[index];
                        return FadeSlide(
                          delay: (index * 70).ms,
                          child: ProfileCard(
                            profile: profile,
                            width: double.infinity,
                            onTap: () => _openProfile(context, profile),
                          ),
                        );
                      }, childCount: favorites.profiles.length),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onBrowse});

  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return SliverFillRemaining(
      hasScrollBody: false,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: FadeSlide(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 340),
              decoration: BoxDecoration(
                gradient: AppColors.weddingGradient,
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.28),
                    blurRadius: 26,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child: Stack(
                  children: [
                    FloatingHearts(count: 8, light: true),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(26, 46, 26, 34),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 78,
                            height: 78,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.16),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.goldLight.withValues(
                                  alpha: 0.5,
                                ),
                                width: 2,
                              ),
                            ),
                            child: const Icon(
                              Icons.favorite_rounded,
                              size: 38,
                              color: Color(0xFFFFC1CB),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            'No saved profiles yet',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Tap the ♥ on any profile to keep it here and easily find your favorite matches again.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white70,
                              height: 1.5,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 22),
                          PrimaryButton(
                            label: 'Browse Profiles',
                            icon: Icons.search_rounded,
                            style: PrimaryButtonStyle.gold,
                            expanded: true,
                            onPressed: onBrowse,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
