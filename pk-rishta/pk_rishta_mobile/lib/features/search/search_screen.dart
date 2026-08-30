import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/gradient_header.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_access_gate.dart';
import '../../core/widgets/profile_card.dart';
import '../../data/constants/profile_options.dart';
import '../../data/models/profile_model.dart';
import '../../data/models/search_filters.dart';
import '../../data/repositories/profile_repository.dart';
import '../auth/register_screen.dart';
import '../profile/profile_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({
    super.key,
    required this.onLogin,
    required this.onCompleteProfile,
  });

  final VoidCallback onLogin;
  final VoidCallback onCompleteProfile;

  @override
  State<SearchScreen> createState() => SearchScreenState();
}

class SearchScreenState extends State<SearchScreen> {
  static const _pageSize = 12;

  final _repo = ProfileRepository();
  final _filters = SearchFilters();
  final _scrollController = ScrollController();

  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = false;
  String? _error;
  List<Profile> _profiles = [];
  int _total = 0;
  int _page = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _search();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.extentAfter < 400) {
      _loadMore();
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

  /// Apply filters from Home "Search Matches" (web queryParams parity).
  void applyFilters(SearchFilters filters) {
    setState(() {
      _filters.gender = filters.gender;
      _filters.city = filters.city;
      _filters.province = filters.province;
      _filters.country = filters.country;
      _filters.maritalStatus = filters.maritalStatus;
      _filters.religion = filters.religion;
      _filters.education = filters.education;
      _filters.minAge = filters.minAge;
      _filters.maxAge = filters.maxAge;
    });
    _search();
  }

  Future<void> _search() async {
    if (!AuthController.instance.canViewProfiles) {
      if (!mounted) return;
      setState(() {
        _profiles = [];
        _loading = false;
        _error = null;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await _repo.search(
        query: _filters.toQuery(limit: _pageSize, page: 1),
      );
      if (!mounted) return;
      setState(() {
        _profiles = result.profiles;
        _total = result.total;
        _page = 1;
        _totalPages = result.totalPages;
        _hasMore = result.totalPages > 1;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loading || _loadingMore || !_hasMore) return;
    if (_page >= _totalPages) {
      setState(() => _hasMore = false);
      return;
    }
    setState(() => _loadingMore = true);
    try {
      final result = await _repo.search(
        query: _filters.toQuery(limit: _pageSize, page: _page + 1),
      );
      if (!mounted) return;
      setState(() {
        _profiles = [..._profiles, ...result.profiles];
        _page = result.page;
        _totalPages = result.totalPages;
        _hasMore = result.page < result.totalPages;
        _loadingMore = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingMore = false;
        _error = e.message;
      });
    }
  }

  Future<void> _openFilters() async {
    final draft = _filters.copy();
    final applied = await showModalBottomSheet<SearchFilters>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.ivory,
      builder: (context) => _FilterSheet(initial: draft),
    );
    if (applied == null) return;
    setState(() {
      _filters.gender = applied.gender;
      _filters.city = applied.city;
      _filters.province = applied.province;
      _filters.country = applied.country;
      _filters.maritalStatus = applied.maritalStatus;
      _filters.religion = applied.religion;
      _filters.education = applied.education;
      _filters.minAge = applied.minAge;
      _filters.maxAge = applied.maxAge;
    });
    await _search();
  }

  void clearFilters() {
    setState(_filters.reset);
    _search();
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }
  }

  void _removeFilter(String field) {
    setState(() => _filters.clearField(field));
    _search();
  }

  @override
  Widget build(BuildContext context) {
    final chips = _filters.chipFields;
    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          GradientHeader(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AtelierHeaderTitle(
                    title: 'Search Profiles',
                    subtitle: 'Search profiles with the same filters as the website',
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Material(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          elevation: 0,
                          child: InkWell(
                            onTap: _openFilters,
                            borderRadius: BorderRadius.circular(18),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 34,
                                    height: 34,
                                    decoration: BoxDecoration(
                                      color: AppColors.blush,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.tune_rounded, color: AppColors.primary, size: 18),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      _filters.activeCount == 0
                                          ? 'All filters'
                                          : '${_filters.activeCount} filter${_filters.activeCount == 1 ? '' : 's'} active',
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                  const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Material(
                        color: AppColors.gold,
                        borderRadius: BorderRadius.circular(18),
                        child: InkWell(
                          onTap: _search,
                          borderRadius: BorderRadius.circular(18),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                            child: Text(
                              'Apply',
                              style: TextStyle(
                                color: AppColors.primaryDark,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (chips.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 40,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          for (final (label, field) in chips)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: _FilterChipPill(
                                label: label,
                                onDeleted: () => _removeFilter(field),
                              ),
                            ),
                          _ResetPill(onTap: clearFilters),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded, size: 44, color: AppColors.primary),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _search, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    if (_profiles.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🔍', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 10),
              const Text(
                'No profiles found',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              const SizedBox(height: 6),
              const Text(
                'Try adjusting your filters',
                style: TextStyle(color: AppColors.textMuted),
              ),
              const SizedBox(height: 16),
              TextButton(onPressed: _openFilters, child: const Text('Edit filters')),
            ],
          ),
        ),
      );
    }

    final list = RefreshIndicator(
      onRefresh: _search,
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              child: Text(
                '$_total profiles found',
                style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
                mainAxisExtent: 248,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final profile = _profiles[index];
                  return ProfileCard(
                    profile: profile,
                    width: double.infinity,
                    onTap: () => _openProfile(profile),
                  );
                },
                childCount: _profiles.length,
              ),
            ),
          ),
          if (_hasMore || _loadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(
                  child: SizedBox(
                    width: 26,
                    height: 26,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );

    return ListenableBuilder(
      listenable: AuthController.instance,
      builder: (context, _) {
        return ProfileAccessGate(
          onLogin: widget.onLogin,
          onCompleteProfile: widget.onCompleteProfile,
          onRegister: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const RegisterScreen()),
            );
          },
          blurSigma: 16,
          child: list,
        );
      },
    );
  }

  void _openProfile(Profile profile) {
    // Always open detail — gate shows blurred content if guest / incomplete.
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProfileDetailScreen(profileId: profile.id, preview: profile),
      ),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.initial});

  final SearchFilters initial;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late final SearchFilters _draft = widget.initial;
  late final TextEditingController _minAge = TextEditingController(text: widget.initial.minAge);
  late final TextEditingController _maxAge = TextEditingController(text: widget.initial.maxAge);
  late final TextEditingController _religion = TextEditingController(text: widget.initial.religion);
  late final TextEditingController _cityText = TextEditingController(text: widget.initial.city);

  List<String> get _cityOptions {
    if (_draft.province.isEmpty || _draft.province == 'Overseas') return const [];
    return List<String>.from(citiesForProvince(_draft.province));
  }

  @override
  void dispose() {
    _minAge.dispose();
    _maxAge.dispose();
    _religion.dispose();
    _cityText.dispose();
    super.dispose();
  }

  void _syncText() {
    _draft.minAge = _minAge.text.trim();
    _draft.maxAge = _maxAge.text.trim();
    _draft.religion = _religion.text.trim();
    if (_draft.province == 'Overseas') {
      _draft.city = _cityText.text.trim();
    }
  }

  Future<void> _pickCountry() async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.ivory,
      builder: (context) => _SearchCityPickerSheet(
        title: 'Select country',
        cities: const ['Any', ...countrySuggestions],
        selected: _draft.country.isEmpty ? 'Any' : _draft.country,
      ),
    );
    if (selected == null || !mounted) return;
    setState(() => _draft.country = selected == 'Any' ? '' : selected);
  }

  Future<void> _pickCity() async {
    if (_draft.province.isEmpty || _draft.province == 'Overseas') return;
    final cities = _cityOptions;
    if (cities.isEmpty) return;

    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.ivory,
      builder: (context) => _SearchCityPickerSheet(
        title: 'Cities in ${provinceLabel(_draft.province)}',
        cities: ['Any', ...cities],
        selected: _draft.city.isEmpty ? 'Any' : _draft.city,
      ),
    );
    if (selected == null || !mounted) return;
    setState(() {
      _draft.city = selected == 'Any' ? '' : selected;
      _cityText.text = _draft.city;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    final cities = _cityOptions;
    final isOverseas = _draft.province == 'Overseas';
    final cityEnabled = _draft.province.isNotEmpty && !isOverseas;
    final cityLabel = _draft.province.isEmpty
        ? 'Any'
        : isOverseas
            ? (_draft.city.isNotEmpty ? _draft.city : 'Any')
            : (_draft.city.isNotEmpty
                ? _draft.city
                : 'Any');
    final countryLabel =
        _draft.country.isNotEmpty ? _draft.country : 'Any country';

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.88,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
              child: Row(
                children: [
                  Text('Filters', style: Theme.of(context).textTheme.titleLarge),
                  const Spacer(),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _draft.reset();
                        _minAge.clear();
                        _maxAge.clear();
                        _religion.clear();
                        _cityText.clear();
                      });
                    },
                    child: const Text('Reset'),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                children: [
                  _label('Gender'),
                  DropdownButtonFormField<String>(
                    key: ValueKey('f-gender-${_draft.gender}'),
                    initialValue: _draft.gender,
                    decoration: const InputDecoration(),
                    items: const [
                      DropdownMenuItem(value: '', child: Text('Any')),
                      DropdownMenuItem(value: 'male', child: Text('Male')),
                      DropdownMenuItem(value: 'female', child: Text('Female')),
                    ],
                    onChanged: (v) => setState(() => _draft.gender = v ?? ''),
                  ),
                  const SizedBox(height: 14),
                  _label('Province'),
                  DropdownButtonFormField<String>(
                    key: ValueKey('f-prov-${_draft.province}'),
                    initialValue: _draft.province,
                    isExpanded: true,
                    decoration: const InputDecoration(),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Any')),
                      for (final p in pakistanProvinces)
                        DropdownMenuItem(value: p, child: Text(provinceLabel(p))),
                    ],
                    onChanged: (v) => setState(() {
                      _draft.province = v ?? '';
                      if (_draft.province.isEmpty) {
                        _draft.city = '';
                        _cityText.clear();
                      } else if (_draft.province == 'Overseas') {
                        if (_draft.country == 'Pakistan') _draft.country = '';
                        _cityText.text = _draft.city;
                      } else {
                        _draft.country = '';
                        final allowed = _cityOptions;
                        if (_draft.city.isNotEmpty && !allowed.contains(_draft.city)) {
                          _draft.city = '';
                          _cityText.clear();
                        }
                      }
                    }),
                  ),
                  const SizedBox(height: 14),
                  _label('Country'),
                  InkWell(
                    onTap: _pickCountry,
                    borderRadius: BorderRadius.circular(16),
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        hintText: 'Any country',
                        prefixIcon: Icon(Icons.public_outlined),
                        suffixIcon: Icon(Icons.arrow_drop_down_rounded),
                      ),
                      child: Text(
                        countryLabel,
                        style: TextStyle(
                          color: _draft.country.isNotEmpty ? AppColors.text : AppColors.textMuted,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _label('City'),
                  if (isOverseas)
                    TextField(
                      controller: _cityText,
                      onChanged: (v) => _draft.city = v.trim(),
                      decoration: const InputDecoration(
                        hintText: 'Any',
                        prefixIcon: Icon(Icons.location_city_outlined),
                      ),
                    )
                  else
                    InkWell(
                      onTap: cityEnabled ? _pickCity : null,
                      borderRadius: BorderRadius.circular(16),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          hintText: cityLabel,
                          prefixIcon: const Icon(Icons.location_city_outlined),
                          suffixIcon: Icon(
                            Icons.arrow_drop_down_rounded,
                            color: cityEnabled ? AppColors.textMuted : AppColors.border,
                          ),
                        ),
                        child: Text(
                          cityLabel,
                          style: TextStyle(
                            color: _draft.city.isNotEmpty ? AppColors.text : AppColors.textMuted,
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
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _label('Min Age'),
                            TextField(
                              controller: _minAge,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: 'Any'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _label('Max Age'),
                            TextField(
                              controller: _maxAge,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: 'Any'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _label('Marital Status'),
                  DropdownButtonFormField<String>(
                    key: ValueKey('f-ms-${_draft.maritalStatus}'),
                    initialValue: _draft.maritalStatus,
                    decoration: const InputDecoration(),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Any')),
                      for (final item in maritalStatusOptions)
                        DropdownMenuItem(value: item.$1, child: Text(item.$2)),
                    ],
                    onChanged: (v) => setState(() => _draft.maritalStatus = v ?? ''),
                  ),
                  const SizedBox(height: 14),
                  _label('Religion'),
                  DropdownButtonFormField<String>(
                    key: ValueKey('f-rel-${_draft.religion}'),
                    initialValue: _draft.religion,
                    isExpanded: true,
                    decoration: const InputDecoration(),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Any')),
                      for (final r in religionOptions)
                        DropdownMenuItem(value: r, child: Text(r)),
                    ],
                    onChanged: (v) => setState(() {
                      _draft.religion = v ?? '';
                      _religion.text = _draft.religion;
                    }),
                  ),
                  const SizedBox(height: 14),
                  _label('Education'),
                  DropdownButtonFormField<String>(
                    key: ValueKey('f-edu-${_draft.education}'),
                    initialValue: _draft.education,
                    isExpanded: true,
                    decoration: const InputDecoration(),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Any')),
                      for (final e in educationOptions)
                        DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis)),
                    ],
                    onChanged: (v) => setState(() => _draft.education = v ?? ''),
                  ),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: PrimaryButton(
                        label: 'Reset',
                        style: PrimaryButtonStyle.outline,
                        expanded: true,
                        onPressed: () {
                          setState(() {
                            _draft.reset();
                            _minAge.clear();
                            _maxAge.clear();
                            _religion.clear();
                            _cityText.clear();
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: PrimaryButton(
                        label: 'Apply Filters',
                        icon: Icons.search_rounded,
                        expanded: true,
                        onPressed: () {
                          _syncText();
                          Navigator.pop(context, _draft.copy());
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.text),
      ),
    );
  }
}

class _SearchCityPickerSheet extends StatefulWidget {
  const _SearchCityPickerSheet({
    required this.title,
    required this.cities,
    required this.selected,
  });

  final String title;
  final List<String> cities;
  final String selected;

  @override
  State<_SearchCityPickerSheet> createState() => _SearchCityPickerSheetState();
}

class _SearchCityPickerSheetState extends State<_SearchCityPickerSheet> {
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
            child: Text(widget.title, style: Theme.of(context).textTheme.titleMedium),
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

class _FilterChipPill extends StatelessWidget {
  const _FilterChipPill({required this.label, required this.onDeleted});

  final String label;
  final VoidCallback onDeleted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 6, 6, 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 6),
          Material(
            color: Colors.white.withValues(alpha: 0.25),
            shape: const CircleBorder(),
            child: InkWell(
              onTap: onDeleted,
              customBorder: const CircleBorder(),
              child: const SizedBox(
                width: 18,
                height: 18,
                child: Icon(Icons.close, size: 12, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResetPill extends StatelessWidget {
  const _ResetPill({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.close, size: 14, color: Colors.white),
              SizedBox(width: 4),
              Text(
                'Reset',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
