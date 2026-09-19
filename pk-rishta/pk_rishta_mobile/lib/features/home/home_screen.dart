import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/atelier_atmosphere.dart';
import '../../core/widgets/brand_logo.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/floating_hearts.dart';
import '../../core/widgets/notification_bell_button.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_access_gate.dart';
import '../../core/widgets/profile_card.dart';
import '../../core/widgets/urdu_text.dart';
import '../../data/constants/profile_options.dart';
import '../../data/content/home_content.dart';
import '../../data/models/profile_model.dart';
import '../../data/models/search_filters.dart';
import '../../data/repositories/profile_repository.dart';
import '../auth/register_screen.dart';
import '../matching/matching_profiles_screen.dart';
import '../profile/profile_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.onNavigateTab,
    required this.onLogin,
    required this.onCompleteProfile,
    required this.onSearchWithFilters,
  });

  final ValueChanged<int> onNavigateTab;
  final VoidCallback onLogin;
  final VoidCallback onCompleteProfile;
  final ValueChanged<SearchFilters> onSearchWithFilters;

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  final _repo = ProfileRepository();
  final _scrollController = ScrollController();
  List<Profile> _recent = [];
  bool _loadingRecent = true;
  String? _recentError;

  @override
  void initState() {
    super.initState();
    AuthController.instance.addListener(_onAuthChanged);
    _loadRecent();
  }

  @override
  void dispose() {
    AuthController.instance.removeListener(_onAuthChanged);
    _scrollController.dispose();
    super.dispose();
  }

  void _onAuthChanged() {
    if (!AuthController.instance.canViewProfiles) {
      if (_recent.isNotEmpty) {
        setState(() => _recent = []);
      }
      return;
    }
    if (_recent.isEmpty && !_loadingRecent) {
      _loadRecent();
    }
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

  Future<void> _loadRecent() async {
    if (!AuthController.instance.canViewProfiles) {
      if (!mounted) return;
      setState(() {
        _recent = [];
        _loadingRecent = false;
        _recentError = null;
      });
      return;
    }
    setState(() {
      _loadingRecent = true;
      _recentError = null;
    });
    try {
      final result = await _repo.search(page: 1, limit: 6);
      if (!mounted) return;
      setState(() {
        _recent = result.profiles;
        _loadingRecent = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _recentError = e.message;
        _loadingRecent = false;
      });
    }
  }

  void _openProfile(Profile profile) {
    // Open detail even for guests — detail/search gate shows blurred content.
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProfileDetailScreen(profileId: profile.id, preview: profile),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final onNavigateTab = widget.onNavigateTab;
    final onLogin = widget.onLogin;
    final onCompleteProfile = widget.onCompleteProfile;
    final onSearchWithFilters = widget.onSearchWithFilters;
    return SafeArea(
      bottom: false,
      child: ListenableBuilder(
        listenable: AuthController.instance,
        builder: (context, _) {
          return RefreshIndicator(
            onRefresh: _loadRecent,
            child: CustomScrollView(
              controller: _scrollController,
              slivers: [
                SliverToBoxAdapter(
                  child: _Hero(
                    onLogin: onLogin,
                    onSearch: () => onNavigateTab(1),
                    onSearchWithFilters: onSearchWithFilters,
                    onCompleteProfile: onCompleteProfile,
                  ),
                ),
                SliverToBoxAdapter(child: _SectionHeader(title: 'Why Families Trust Hum Rishta', urdu: 'خاندانوں کا اعتماد — ہمارا فخر', delay: 200.ms)),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 188,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      scrollDirection: Axis.horizontal,
                      itemCount: whyUsItems.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final item = whyUsItems[index];
                        return FadeSlide(
                          delay: (250 + index * 70).ms,
                          child: _WhyCard(icon: item.$1, title: item.$2, description: item.$3),
                        );
                      },
                    ),
                  ),
                ),
                SliverToBoxAdapter(child: _SectionHeader(title: 'Recent Profiles', subtitle: 'Verified matches from Pakistan and overseas', delay: 350.ms)),
                SliverToBoxAdapter(
                  child: ProfileAccessGate(
                    onLogin: onLogin,
                    onCompleteProfile: onCompleteProfile,
                    onRegister: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(builder: (_) => const RegisterScreen()),
                      );
                    },
                    blurSigma: 14,
                    child: _buildRecent(),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          if (!AuthController.instance.canViewProfiles) {
                            if (AuthController.instance.needsProfileCompletion) {
                              onCompleteProfile();
                            } else {
                              onLogin();
                            }
                            return;
                          }
                          onNavigateTab(1);
                        },
                        child: Text(
                          AuthController.instance.canViewProfiles
                              ? 'View all profiles →'
                              : AuthController.instance.isLoggedIn
                                  ? 'Complete profile to unlock →'
                                  : 'Login to view profiles →',
                        ),
                      ),
                    ),
                  ),
                ),
                const SliverToBoxAdapter(child: _HowItWorksSection()),
                SliverToBoxAdapter(child: _TestimonialsSection()),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                    child: FadeSlide(
                      delay: 700.ms,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(28),
                        child: Stack(
                          children: [
                            const Positioned.fill(child: AtelierAtmosphere(compact: true)),
                            Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                children: [
                                  Text(
                                    'Register your profile today',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.playfairDisplay(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const UrduText(
                                    'آج ہی اپنا رشتہ رجسٹر کریں',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: AppColors.goldLight, fontSize: 20),
                                  ),
                                  const SizedBox(height: 14),
                                  const Text(
                                    'Create a free profile and connect with verified families.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: Colors.white70, height: 1.5),
                                  ),
                                  const SizedBox(height: 18),
                                  PrimaryButton(
                                    label: AuthController.instance.isLoggedIn
                                        ? (AuthController.instance.canViewProfiles
                                            ? 'View Profiles'
                                            : 'Complete Your Profile')
                                        : 'Create a free profile',
                                    icon: Icons.favorite_rounded,
                                    style: PrimaryButtonStyle.gold,
                                    expanded: true,
                                    onPressed: AuthController.instance.canViewProfiles
                                        ? () => onNavigateTab(1)
                                        : AuthController.instance.isLoggedIn
                                            ? onCompleteProfile
                                            : onLogin,
                                  ),
                                  if (!AuthController.instance.isLoggedIn) ...[
                                    const SizedBox(height: 10),
                                    PrimaryButton(
                                      label: 'View Profiles',
                                      style: PrimaryButtonStyle.light,
                                      expanded: true,
                                      onPressed: () => onNavigateTab(1),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecent() {
    if (_loadingRecent) {
      return const SizedBox(
        height: 250,
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_recentError != null) {
      return SizedBox(
        height: 160,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _recentError!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textMuted),
                ),
                const SizedBox(height: 10),
                TextButton(onPressed: _loadRecent, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      );
    }
    if (_recent.isEmpty) {
      return const SizedBox(
        height: 120,
        child: Center(
          child: Text(
            'No profiles yet — be the first to register.',
            style: TextStyle(color: AppColors.textMuted),
          ),
        ),
      );
    }
    return SizedBox(
      height: 250,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: _recent.length,
        separatorBuilder: (_, index) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final profile = _recent[index];
          return FadeSlide(
            delay: (400 + index * 80).ms,
            child: ProfileCard(
              profile: profile,
              onTap: () => _openProfile(profile),
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.subtitle,
    this.urdu,
    required this.delay,
  });

  final String title;
  final String? subtitle;
  final String? urdu;
  final Duration delay;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
      child: FadeSlide(
        delay: delay,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(99),
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.gold],
                ),
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle!, style: const TextStyle(color: AppColors.textMuted)),
            ],
            if (urdu != null) ...[
              const SizedBox(height: 6),
              UrduText(urdu!, style: const TextStyle(color: AppColors.primary, fontSize: 18)),
            ],
          ],
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({
    required this.onLogin,
    required this.onSearch,
    required this.onSearchWithFilters,
    required this.onCompleteProfile,
  });

  final VoidCallback onLogin;
  final VoidCallback onSearch;
  final ValueChanged<SearchFilters> onSearchWithFilters;
  final VoidCallback onCompleteProfile;

  @override
  Widget build(BuildContext context) {
    final auth = AuthController.instance;
    final showSearch = !auth.isLoggedIn || auth.isAdmin || auth.canViewProfiles;
    final incomplete = auth.needsProfileCompletion;

    return Container(
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(36),
          bottomRight: Radius.circular(36),
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          const Positioned.fill(child: AtelierAtmosphere()),
          const FloatingHearts(count: 12),
          Positioned.fill(
            child: Opacity(
              opacity: 0.08,
              child: Image.asset(
                'assets/images/pattern-mandala.png',
                fit: BoxFit.cover,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const BrandLogo(height: 56, heroTag: 'hum-logo'),
                    const Spacer(),
                    const NotificationBellButton(),
                  ],
                ),
                const SizedBox(height: 18),
                FadeSlide(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.gold.withValues(alpha: 0.45)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified_rounded, color: AppColors.goldLight, size: 16),
                        SizedBox(width: 6),
                        Text(
                          'Pakistan\'s Trusted Matchmaking Platform',
                          style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                FadeSlide(
                  delay: 100.ms,
                  child: RichText(
                    text: TextSpan(
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 30,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        height: 1.15,
                      ),
                      children: const [
                        TextSpan(text: 'Your '),
                        TextSpan(text: 'Blessed', style: TextStyle(color: AppColors.goldLight)),
                        TextSpan(text: ' journey to a beautiful '),
                        TextSpan(text: 'Nikah', style: TextStyle(color: AppColors.goldLight)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                FadeSlide(
                  delay: 160.ms,
                  child: const UrduText(
                    'اللہ کے نام سے — اپنا رشتہ تلاش کریں',
                    style: TextStyle(color: Colors.white, fontSize: 20),
                  ),
                ),
                const SizedBox(height: 10),
                FadeSlide(
                  delay: 220.ms,
                  child: const Text(
                    'Halal matches, verified families, and thousands of profiles from across Pakistan.',
                    style: TextStyle(color: Colors.white70, height: 1.5),
                  ),
                ),
                const SizedBox(height: 12),
                FadeSlide(
                  delay: 240.ms,
                  child: Container(
                    width: 52,
                    height: 3,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(99),
                      gradient: const LinearGradient(
                        colors: [AppColors.gold, AppColors.goldLight],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                FadeSlide(
                  delay: 280.ms,
                  child: incomplete
                      ? _ProfileGateCard(onCompleteProfile: onCompleteProfile)
                      : _SearchCard(onSearchWithFilters: onSearchWithFilters),
                ),
                if (showSearch) ...[
                  const SizedBox(height: 16),
                  FadeSlide(
                    delay: 360.ms,
                    child: Row(
                      children: [
                        if (!auth.isLoggedIn) ...[
                          Expanded(
                            child: PrimaryButton(
                              label: 'Register Free',
                              style: PrimaryButtonStyle.gold,
                              expanded: true,
                              onPressed: onLogin,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: PrimaryButton(
                              label: 'Search Profiles',
                              style: PrimaryButtonStyle.light,
                              expanded: true,
                              onPressed: onSearch,
                            ),
                          ),
                        ] else if (!auth.isAdmin) ...[
                          Expanded(
                            child: PrimaryButton(
                              label: 'Matching Profiles',
                              style: PrimaryButtonStyle.gold,
                              expanded: true,
                              onPressed: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const MatchingProfilesScreen(),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: PrimaryButton(
                              label: 'My Profile',
                              style: PrimaryButtonStyle.light,
                              expanded: true,
                              onPressed: onCompleteProfile,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                FadeSlide(
                  delay: 440.ms,
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: trustBadges
                        .map(
                          (badge) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                            ),
                            child: Text(
                              badge,
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchCard extends StatefulWidget {
  const _SearchCard({required this.onSearchWithFilters});

  final ValueChanged<SearchFilters> onSearchWithFilters;

  @override
  State<_SearchCard> createState() => _SearchCardState();
}

class _SearchCardState extends State<_SearchCard> {
  String _gender = '';
  String _province = '';
  String _city = '';

  List<String> get _cityOptions {
    if (_province.isEmpty) return const [];
    if (_province == 'Overseas') return overseasCountries;
    return List<String>.from(citiesForProvince(_province));
  }

  InputDecoration get _fieldDec => InputDecoration(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.border.withValues(alpha: 0.7)),
        ),
      );

  void _submit() {
    widget.onSearchWithFilters(
      SearchFilters(
        gender: _gender,
        province: _province,
        city: _city,
        country: _province == 'Overseas' ? _city : '',
      ),
    );
  }

  Future<void> _pickCity() async {
    if (_province.isEmpty) return;
    final cities = _cityOptions;
    if (cities.isEmpty) return;

    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.ivory,
      builder: (context) => _CityPickerSheet(
        title: _province == 'Overseas'
            ? 'Select country'
            : 'Cities in ${provinceLabel(_province)}',
        cities: ['Any', ...cities],
        selected: _city.isEmpty ? 'Any' : _city,
      ),
    );
    if (selected == null || !mounted) return;
    setState(() => _city = selected == 'Any' ? '' : selected);
  }

  @override
  Widget build(BuildContext context) {
    final cities = _cityOptions;
    final cityEnabled = _province.isNotEmpty;
    final cityLabel = !cityEnabled
        ? 'Any'
        : (_city.isNotEmpty
            ? _city
            : 'Any');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '🔍 Find your ideal match',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 14),
          // Gender dropdown (web parity)
          DropdownButtonFormField<String>(
            key: ValueKey('gender-$_gender'),
            initialValue: _gender,
            isExpanded: true,
            decoration: _fieldDec,
            items: const [
              DropdownMenuItem(value: '', child: Text('Any')),
              DropdownMenuItem(value: 'male', child: Text('Male')),
              DropdownMenuItem(value: 'female', child: Text('Female')),
            ],
            onChanged: (v) => setState(() => _gender = v ?? ''),
          ),
          const SizedBox(height: 10),
          // Province dropdown
          DropdownButtonFormField<String>(
            key: ValueKey('prov-$_province'),
            initialValue: _province,
            isExpanded: true,
            decoration: _fieldDec,
            items: [
              const DropdownMenuItem(value: '', child: Text('Any')),
              for (final p in pakistanProvinces)
                DropdownMenuItem(value: p, child: Text(provinceLabel(p))),
            ],
            onChanged: (v) => setState(() {
              _province = v ?? '';
              final allowed = _cityOptions;
              if (_city.isNotEmpty && !allowed.contains(_city)) {
                _city = '';
              }
            }),
          ),
          const SizedBox(height: 10),
          // City — full province list via searchable sheet (same cities as web)
          InkWell(
            onTap: cityEnabled ? _pickCity : null,
            borderRadius: BorderRadius.circular(12),
            child: InputDecorator(
              decoration: _fieldDec.copyWith(
                suffixIcon: Icon(
                  Icons.arrow_drop_down_rounded,
                  color: cityEnabled ? AppColors.textMuted : AppColors.border,
                ),
              ),
              child: Text(
                cityLabel,
                style: TextStyle(
                  color: _city.isNotEmpty
                      ? AppColors.text
                      : AppColors.textMuted,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          if (cityEnabled && cities.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              '${cities.length} cities — same as website',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ],
          const SizedBox(height: 14),
          PrimaryButton(
            label: 'Search Matches',
            icon: Icons.search_rounded,
            expanded: true,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}

class _CityPickerSheet extends StatefulWidget {
  const _CityPickerSheet({
    required this.title,
    required this.cities,
    required this.selected,
  });

  final String title;
  final List<String> cities;
  final String selected;

  @override
  State<_CityPickerSheet> createState() => _CityPickerSheetState();
}

class _CityPickerSheetState extends State<_CityPickerSheet> {
  final _query = TextEditingController();

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = _query.text.trim().toLowerCase();
    final filtered = q.isEmpty
        ? widget.cities
        : widget.cities.where((c) => c.toLowerCase().contains(q)).toList();
    final height = MediaQuery.sizeOf(context).height * 0.72;

    return SizedBox(
      height: height,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
            child: Text(
              widget.title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _query,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'Search city…',
                prefixIcon: Icon(Icons.search_rounded),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, _) => const Divider(height: 1, indent: 16),
              itemBuilder: (context, index) {
                final city = filtered[index];
                final selected = city == widget.selected;
                return ListTile(
                  title: Text(city),
                  trailing: selected
                      ? const Icon(Icons.check_circle_rounded, color: AppColors.primary)
                      : null,
                  selected: selected,
                  selectedTileColor: AppColors.blush,
                  onTap: () => Navigator.pop(context, city),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileGateCard extends StatelessWidget {
  const _ProfileGateCard({required this.onCompleteProfile});

  final VoidCallback onCompleteProfile;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.blush,
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'Almost there — 4 easy steps',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            '💍 Start your match journey',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
          const SizedBox(height: 6),
          const Text(
            'Complete your profile — then matching profiles will unlock.',
            style: TextStyle(color: AppColors.textMuted, height: 1.45),
          ),
          const SizedBox(height: 14),
          const Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _StepChip(num: '1', label: 'Personal'),
              _StepChip(num: '2', label: 'Background'),
              _StepChip(num: '3', label: 'Contact'),
              _StepChip(num: '4', label: 'Partner'),
            ],
          ),
          const SizedBox(height: 16),
          PrimaryButton(
            label: 'Continue Profile Setup →',
            style: PrimaryButtonStyle.gold,
            expanded: true,
            onPressed: onCompleteProfile,
          ),
          const SizedBox(height: 8),
          const Text(
            'Just a few minutes — verified families will be able to see you',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _StepChip extends StatelessWidget {
  const _StepChip({required this.num, required this.label});

  final String num;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.ivory,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 10,
            backgroundColor: AppColors.primary,
            child: Text(num, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
        ],
      ),
    );
  }
}

class _HowItWorksSection extends StatelessWidget {
  const _HowItWorksSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FadeSlide(
            delay: 520.ms,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How does a match work?',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 40,
                  height: 3,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(99),
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.gold],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const UrduText('رشتہ کیسے ملتا ہے؟', style: TextStyle(color: AppColors.primary, fontSize: 18)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          for (var i = 0; i < howItWorksSteps.length; i++)
            FadeSlide(
              delay: (560 + i * 80).ms,
              child: _StepTile(step: howItWorksSteps[i], stepNumber: i + 1, isLast: i == howItWorksSteps.length - 1),
            ),
        ],
      ),
    );
  }
}

class _StepTile extends StatelessWidget {
  const _StepTile({
    required this.step,
    required this.stepNumber,
    required this.isLast,
  });

  final HowItWorksStep step;
  final int stepNumber;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: AppColors.goldGradient,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gold.withValues(alpha: 0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  '$stepNumber',
                  style: const TextStyle(
                    color: AppColors.primaryDark,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    color: AppColors.border,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(step.icon, style: const TextStyle(fontSize: 22)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          step.title,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  UrduText(step.urdu, style: const TextStyle(color: AppColors.primary, fontSize: 16)),
                  const SizedBox(height: 6),
                  Text(step.description, style: const TextStyle(color: AppColors.textMuted, height: 1.45)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TestimonialsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 28),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: Stack(
          children: [
            Positioned.fill(
              child: Image.asset(
                'assets/images/testimonials-bg.png',
                fit: BoxFit.cover,
              ),
            ),
            Container(
              color: AppColors.primaryDark.withValues(alpha: 0.82),
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
              child: Column(
                children: [
                  FadeSlide(
                    delay: 620.ms,
                    child: Column(
                      children: [
                        const Text('✦ 💑 ✦', style: TextStyle(color: AppColors.goldLight, fontSize: 18)),
                        const SizedBox(height: 8),
                        Text(
                          'Happy Matches',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        const UrduText(
                          'خوشگوار رشتے',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.goldLight, fontSize: 20),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    height: 220,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: testimonials.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final item = testimonials[index];
                        return FadeSlide(
                          delay: (660 + index * 90).ms,
                          child: _TestimonialCard(testimonial: item),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TestimonialCard extends StatelessWidget {
  const _TestimonialCard({required this.testimonial});

  final Testimonial testimonial;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.97),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('"', style: TextStyle(fontSize: 42, color: AppColors.primary, height: 0.9)),
          Expanded(
            child: Text(
              testimonial.text,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontStyle: FontStyle.italic,
                height: 1.6,
                fontSize: 14,
              ),
            ),
          ),
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.primary,
                child: Text(
                  testimonial.name[0],
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(testimonial.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(
                      '${testimonial.city} • ${testimonial.year}',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WhyCard extends StatelessWidget {
  const _WhyCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  final String icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 230,
      height: double.infinity,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.07),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.blush,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(icon, style: const TextStyle(fontSize: 20)),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.playfairDisplay(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: AppColors.text,
              ),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Text(
                description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.textMuted, height: 1.35, fontSize: 12.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
