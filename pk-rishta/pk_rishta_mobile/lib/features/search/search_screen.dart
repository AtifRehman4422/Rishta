import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/gradient_header.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_access_gate.dart';
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
  final _repo = ProfileRepository();
  final _filters = SearchFilters();

  bool _loading = true;
  String? _error;
  List<Profile> _profiles = [];
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _search();
  }

  /// Apply filters from Home "Search Rishta" (web queryParams parity).
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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await _repo.search(query: _filters.toQuery(limit: 30));
      if (!mounted) return;
      setState(() {
        _profiles = result.profiles;
        _total = result.total;
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

  void _clearFilters() {
    setState(_filters.reset);
    _search();
  }

  @override
  Widget build(BuildContext context) {
    final chips = _filters.summaryChips;
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
                    subtitle: 'پروفائلز تلاش کریں — filters jaise website',
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
                      height: 34,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          for (final chip in chips)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: Chip(
                                label: Text(chip, style: const TextStyle(fontSize: 12)),
                                backgroundColor: Colors.white.withValues(alpha: 0.18),
                                side: BorderSide(color: Colors.white.withValues(alpha: 0.35)),
                                labelStyle: const TextStyle(color: Colors.white),
                                visualDensity: VisualDensity.compact,
                                padding: EdgeInsets.zero,
                              ),
                            ),
                          ActionChip(
                            label: const Text('Reset', style: TextStyle(fontSize: 12, color: Colors.white)),
                            backgroundColor: Colors.white.withValues(alpha: 0.12),
                            side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                            onPressed: _clearFilters,
                            visualDensity: VisualDensity.compact,
                            avatar: const Icon(Icons.close, size: 14, color: Colors.white),
                          ),
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
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        itemCount: _profiles.length + 1,
        separatorBuilder: (_, index) => index == 0 ? const SizedBox.shrink() : const SizedBox(height: 14),
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                '$_total profiles found',
                style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600),
              ),
            );
          }
          final profile = _profiles[index - 1];
          return FadeSlide(
            delay: (index * 40).ms,
            child: _SearchListTile(
              profile: profile,
              onTap: () => _openProfile(profile),
            ),
          );
        },
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
        cities: cities,
        selected: _draft.city,
      ),
    );
    if (selected == null || !mounted) return;
    setState(() {
      _draft.city = selected;
      _cityText.text = selected;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    final cities = _cityOptions;
    final isOverseas = _draft.province == 'Overseas';
    final cityEnabled = _draft.province.isNotEmpty && !isOverseas;
    final cityLabel = _draft.province.isEmpty
        ? 'Select province first'
        : isOverseas
            ? (_draft.city.isNotEmpty ? _draft.city : 'Any city (optional)')
            : (_draft.city.isNotEmpty
                ? _draft.city
                : 'Select city (${cities.length})');
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
                    initialValue: _draft.gender.isEmpty ? null : _draft.gender,
                    decoration: const InputDecoration(hintText: 'Any'),
                    items: const [
                      DropdownMenuItem(value: 'male', child: Text('Male')),
                      DropdownMenuItem(value: 'female', child: Text('Female')),
                    ],
                    onChanged: (v) => setState(() => _draft.gender = v ?? ''),
                  ),
                  const SizedBox(height: 14),
                  _label('Province'),
                  DropdownButtonFormField<String>(
                    key: ValueKey('f-prov-${_draft.province}'),
                    initialValue: _draft.province.isEmpty ? null : _draft.province,
                    isExpanded: true,
                    decoration: const InputDecoration(hintText: 'Any'),
                    items: [
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
                        if (_draft.country.isEmpty) _draft.country = 'Pakistan';
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
                        hintText: 'Any city (optional)',
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
                              decoration: const InputDecoration(hintText: '18'),
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
                              decoration: const InputDecoration(hintText: '45'),
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
                    initialValue: _draft.maritalStatus.isEmpty ? null : _draft.maritalStatus,
                    decoration: const InputDecoration(hintText: 'Any'),
                    items: [
                      for (final item in maritalStatusOptions)
                        DropdownMenuItem(value: item.$1, child: Text(item.$2)),
                    ],
                    onChanged: (v) => setState(() => _draft.maritalStatus = v ?? ''),
                  ),
                  const SizedBox(height: 14),
                  _label('Religion'),
                  Autocomplete<String>(
                    initialValue: TextEditingValue(text: _draft.religion),
                    optionsBuilder: (text) {
                      final q = text.text.toLowerCase();
                      if (q.isEmpty) return religionOptions;
                      return religionOptions.where((r) => r.toLowerCase().contains(q));
                    },
                    fieldViewBuilder: (context, controller, focusNode, onSubmit) {
                      return TextField(
                        controller: controller,
                        focusNode: focusNode,
                        onChanged: (v) {
                          _religion.text = v;
                          _draft.religion = v.trim();
                        },
                        decoration: const InputDecoration(
                          hintText: 'Any — or type',
                          prefixIcon: Icon(Icons.mosque_outlined),
                        ),
                      );
                    },
                    onSelected: (value) {
                      setState(() {
                        _draft.religion = value;
                        _religion.text = value;
                      });
                    },
                  ),
                  const SizedBox(height: 14),
                  _label('Education'),
                  DropdownButtonFormField<String>(
                    key: ValueKey('f-edu-${_draft.education}'),
                    initialValue: _draft.education.isEmpty ? null : _draft.education,
                    isExpanded: true,
                    decoration: const InputDecoration(hintText: 'Any'),
                    items: [
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
              separatorBuilder: (_, __) => const Divider(height: 1, indent: 16),
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

class _SearchListTile extends StatelessWidget {
  const _SearchListTile({required this.profile, required this.onTap});

  final Profile profile;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.asset(
                      profile.gender == 'female'
                          ? 'assets/images/avatar-female.png'
                          : 'assets/images/avatar-male.png',
                      width: 76,
                      height: 76,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Container(
                      height: 3,
                      decoration: const BoxDecoration(
                        borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                        gradient: LinearGradient(
                          colors: [AppColors.primary, AppColors.gold],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            profile.fullName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                          ),
                        ),
                        if (profile.isVerified) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.verified, size: 16, color: Color(0xFF15803D)),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (profile.age != null) '${profile.age} yrs',
                        if (profile.location.isNotEmpty) profile.location,
                      ].join(' • '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppColors.textMuted),
                    ),
                    if (profile.education != null && profile.education!.isNotEmpty)
                      Text(
                        profile.education!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                      ),
                    if (profile.maritalStatus != null && profile.maritalStatus!.isNotEmpty)
                      Text(
                        maritalStatusLabels[profile.maritalStatus!] ?? profile.maritalStatus!,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                  ],
                ),
              ),
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.blush,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.chevron_right_rounded, color: AppColors.primary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
