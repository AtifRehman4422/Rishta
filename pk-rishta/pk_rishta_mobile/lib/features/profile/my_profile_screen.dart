import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/primary_button.dart';
import '../../data/constants/profile_options.dart';
import '../../data/models/my_profile_model.dart';
import '../../data/models/search_filters.dart';
import '../../data/repositories/profile_repository.dart';

class MyProfileScreen extends StatefulWidget {
  const MyProfileScreen({super.key});

  @override
  State<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends State<MyProfileScreen> {
  final _repo = ProfileRepository();
  final _scroll = ScrollController();

  MyProfileData? _data;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _success;

  final _fullName = TextEditingController();
  final _guardianName = TextEditingController();
  final _weight = TextEditingController();
  final _disabilityDetail = TextEditingController();
  final _houseLocation = TextEditingController();
  final _abroadLocation = TextEditingController();
  final _about = TextEditingController();
  final _family = TextEditingController();
  final _partnerMinAge = TextEditingController();
  final _partnerMaxAge = TextEditingController();
  final _partnerCity = TextEditingController();
  final _phone = TextEditingController();
  final _whatsapp = TextEditingController();
  final _cityCustom = TextEditingController();

  int? _heightFeet;
  int? _heightInches;
  String _disabilityChoice = '';
  String _pkHouseType = '';
  String _abroadHouseType = '';
  Set<String> _selectedLanguages = {};
  Map<String, List<String>> _options = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _scroll.dispose();
    for (final c in [
      _fullName, _guardianName, _weight, _disabilityDetail, _houseLocation,
      _abroadLocation, _about, _family, _partnerMinAge, _partnerMaxAge,
      _partnerCity, _phone, _whatsapp, _cityCustom,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final profile = await _repo.getMyProfile();
      final fields = [
        'marital_status', 'color', 'guardian_type', 'disability',
        'religion', 'sect', 'caste', 'education', 'profession', 'language',
      ];
      final opts = <String, List<String>>{};
      await Future.wait(fields.map((f) async {
        try {
          opts[f] = await _repo.dropdownOptions(f);
        } catch (_) {
          opts[f] = [];
        }
      }));
      if (!mounted) return;
      _fillFrom(profile);
      setState(() {
        _data = profile;
        _options = opts;
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

  void _fillFrom(MyProfileData p) {
    _fullName.text = p.fullName;
    _guardianName.text = p.guardianName;
    _weight.text = p.weightKg?.toString() ?? '';
    _about.text = p.aboutMe;
    _family.text = p.familyDetails;
    _partnerMinAge.text = p.partnerMinAge?.toString() ?? '';
    _partnerMaxAge.text = p.partnerMaxAge?.toString() ?? '';
    _partnerCity.text = p.partnerCity;
    _cityCustom.text = p.city;

    final h = parseFeetInchesFromCm(p.heightCm);
    _heightFeet = h.feet;
    _heightInches = h.inches;

    final d = p.disability.trim();
    if (d.isEmpty) {
      _disabilityChoice = '';
      _disabilityDetail.clear();
    } else if (d.toLowerCase() == 'no' || d.toLowerCase() == 'none') {
      _disabilityChoice = 'No';
      _disabilityDetail.clear();
    } else if (d.toLowerCase() == 'yes') {
      _disabilityChoice = 'Yes';
      _disabilityDetail.clear();
    } else {
      _disabilityChoice = 'Yes';
      _disabilityDetail.text = d;
    }

    if (p.houseOwnLocation.isNotEmpty) {
      _pkHouseType = 'own';
      _houseLocation.text = p.houseOwnLocation;
    } else if (p.houseRentLocation.isNotEmpty) {
      _pkHouseType = 'rent';
      _houseLocation.text = p.houseRentLocation;
    } else {
      _pkHouseType = '';
      _houseLocation.clear();
    }

    if (p.abroadHouseOwnLocation.isNotEmpty) {
      _abroadHouseType = 'own';
      _abroadLocation.text = p.abroadHouseOwnLocation;
    } else if (p.abroadHouseRentLocation.isNotEmpty) {
      _abroadHouseType = 'rent';
      _abroadLocation.text = p.abroadHouseRentLocation;
    } else {
      _abroadHouseType = '';
      _abroadLocation.clear();
    }

    _selectedLanguages = p.languages
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toSet();

    final phones = p.contacts.where((c) => c.type == 'phone').map((c) => c.number).toList();
    final whatsapps = p.contacts.where((c) => c.type == 'whatsapp').map((c) => c.number).toList();
    _phone.text = phones.isEmpty ? '' : phones.first;
    _whatsapp.text = whatsapps.isEmpty ? '' : whatsapps.first;
  }

  void _syncToModel() {
    final p = _data!;
    p.fullName = _fullName.text;
    p.guardianName = _guardianName.text.trim();
    p.weightKg = int.tryParse(_weight.text.trim());
    if (_heightFeet != null && _heightInches != null) {
      p.heightCm = feetInchesToCm(_heightFeet!, _heightInches!);
    }
    p.aboutMe = _about.text.trim();
    p.familyDetails = _family.text.trim();
    p.partnerMinAge = int.tryParse(_partnerMinAge.text.trim());
    p.partnerMaxAge = int.tryParse(_partnerMaxAge.text.trim());
    p.partnerCity = _partnerCity.text.trim();
    p.city = _cityCustom.text.trim().isNotEmpty ? _cityCustom.text.trim() : p.city;
    p.languages = _selectedLanguages.join(', ');

    if (_disabilityChoice == 'No') {
      p.disability = 'No';
    } else if (_disabilityChoice == 'Yes') {
      final detail = _disabilityDetail.text.trim();
      p.disability = detail.isEmpty ? 'Yes' : detail;
    }

    final overseas = p.province == 'Overseas';
    if (!overseas) {
      p.houseOwnLocation = _pkHouseType == 'own' ? _houseLocation.text.trim() : '';
      p.houseRentLocation = _pkHouseType == 'rent' ? _houseLocation.text.trim() : '';
      p.abroadCountry = '';
      p.abroadHouseOwnLocation = '';
      p.abroadHouseRentLocation = '';
      p.country = 'Pakistan';
    } else {
      p.houseOwnLocation = '';
      p.houseRentLocation = '';
      p.abroadHouseOwnLocation = _abroadHouseType == 'own' ? _abroadLocation.text.trim() : '';
      p.abroadHouseRentLocation = _abroadHouseType == 'rent' ? _abroadLocation.text.trim() : '';
      p.country = p.abroadCountry.isEmpty ? p.country : p.abroadCountry;
    }

    p.contacts = [
      if (_phone.text.trim().isNotEmpty) ProfileContact(type: 'phone', number: _phone.text.trim()),
      if (_whatsapp.text.trim().isNotEmpty) ProfileContact(type: 'whatsapp', number: _whatsapp.text.trim()),
    ];
  }

  int get _completionPercent {
    final p = _data;
    if (p == null) return 0;
    final checks = <bool>[
      _fullName.text.trim().isNotEmpty,
      p.gender.isNotEmpty,
      p.dateOfBirth.isNotEmpty,
      _heightFeet != null && _heightInches != null,
      _weight.text.trim().isNotEmpty,
      p.maritalStatus.isNotEmpty,
      p.color.isNotEmpty,
      p.guardianType.isNotEmpty,
      _guardianName.text.trim().isNotEmpty,
      _disabilityChoice.isNotEmpty,
      p.religion.isNotEmpty,
      p.sect.isNotEmpty || p.religion == 'Sikhism',
      p.caste.isNotEmpty,
      _selectedLanguages.isNotEmpty,
      _phone.text.trim().isNotEmpty,
      p.province.isNotEmpty,
      p.city.isNotEmpty || _cityCustom.text.trim().isNotEmpty,
      p.education.isNotEmpty,
      p.profession.isNotEmpty,
      _about.text.trim().length >= 20,
      _family.text.trim().length >= 10,
      _partnerMinAge.text.trim().isNotEmpty,
      _partnerMaxAge.text.trim().isNotEmpty,
      p.province == 'Overseas'
          ? (p.abroadCountry.isNotEmpty && _abroadHouseType.isNotEmpty && _abroadLocation.text.trim().isNotEmpty)
          : (_pkHouseType.isNotEmpty && _houseLocation.text.trim().isNotEmpty),
    ];
    final done = checks.where((e) => e).length;
    return ((done / checks.length) * 100).round().clamp(0, 100);
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    var initial = DateTime(now.year - 25);
    final raw = _data?.dateOfBirth ?? '';
    if (raw.isNotEmpty) initial = DateTime.tryParse(raw) ?? initial;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 80),
      lastDate: DateTime(now.year - 18),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _data!.dateOfBirth =
            '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _save() async {
    if (_data == null) return;
    _syncToModel();
    if (_fullName.text.trim().isEmpty) {
      setState(() => _error = 'Full name is required');
      return;
    }
    if (_phone.text.trim().isEmpty) {
      setState(() => _error = 'Phone number is required');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
      _success = null;
    });
    try {
      final updated = await _repo.updateMyProfile(_data!.toUpdateBody());
      await AuthController.instance.refreshMe();
      if (!mounted) return;
      _fillFrom(updated);
      setState(() {
        _data = updated;
        _saving = false;
        _success = updated.isProfileComplete
            ? 'Profile complete — search unlocked!'
            : 'Saved. Fill remaining required fields (*) to unlock search.';
      });
    } on ApiException catch (e) {
      setState(() {
        _saving = false;
        _error = e.message;
      });
    }
  }

  bool get _incomplete =>
      AuthController.instance.needsProfileCompletion || !(_data?.isProfileComplete ?? false);

  List<String> _mergedOptions(String field, {List<String> fallback = const []}) {
    final api = _options[field] ?? const <String>[];
    return <String>{...api, ...fallback}.toList()..sort();
  }

  @override
  Widget build(BuildContext context) {
    final title = _incomplete ? 'Complete Profile' : 'My Profile';
    final subtitle = _incomplete
        ? 'Fill details to unlock matching'
        : 'Update your rishta details anytime';

    return Scaffold(
      backgroundColor: AppColors.ivory,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _data == null
              ? _ErrorState(message: _error ?? 'Could not load profile', onRetry: _load)
              : Column(
                  children: [
                    _ProfileHero(
                      title: title,
                      subtitle: subtitle,
                      percent: _completionPercent,
                      incomplete: _incomplete,
                      onBack: () => Navigator.pop(context),
                    ),
                    if (_error != null) _Banner(text: _error!, success: false),
                    if (_success != null) _Banner(text: _success!, success: true),
                    Expanded(
                      child: ListView(
                        controller: _scroll,
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                        children: [
                          AnimatedSection(index: 0, child: _section(
                            icon: Icons.person_rounded,
                            title: 'Basic Information',
                            subtitle: 'Personal details',
                            child: _basicFields(),
                          )),
                          AnimatedSection(index: 1, child: _section(
                            icon: Icons.mosque_rounded,
                            title: 'Religious & Cultural',
                            subtitle: 'Faith and background',
                            child: _religiousFields(),
                          )),
                          AnimatedSection(index: 2, child: _section(
                            icon: Icons.translate_rounded,
                            title: 'Languages',
                            subtitle: 'Select all you speak',
                            child: _languageFields(),
                          )),
                          AnimatedSection(index: 3, child: _section(
                            icon: Icons.call_rounded,
                            title: 'Contact',
                            subtitle: 'How families reach you',
                            child: _contactFields(),
                          )),
                          AnimatedSection(index: 4, child: _section(
                            icon: Icons.location_on_rounded,
                            title: 'Location',
                            subtitle: 'Where you live',
                            child: _locationFields(),
                          )),
                          AnimatedSection(index: 5, child: _section(
                            icon: Icons.school_rounded,
                            title: 'Education & Career',
                            subtitle: 'Qualifications and work',
                            child: _careerFields(),
                          )),
                          AnimatedSection(index: 6, child: _section(
                            icon: Icons.favorite_rounded,
                            title: 'Partner Requirements',
                            subtitle: 'What you are looking for',
                            child: _partnerFields(),
                          )),
                          AnimatedSection(index: 7, child: _section(
                            icon: Icons.menu_book_rounded,
                            title: 'About You',
                            subtitle: 'Tell families your story',
                            child: _aboutFields(),
                          )),
                        ],
                      ),
                    ),
                    SafeArea(
                      top: false,
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.08),
                              blurRadius: 16,
                              offset: const Offset(0, -4),
                            ),
                          ],
                        ),
                        child: _saving
                            ? const Center(child: Padding(
                                padding: EdgeInsets.all(8),
                                child: CircularProgressIndicator(),
                              ))
                            : PrimaryButton(
                                label: _incomplete ? 'Save & Continue' : 'Save Profile',
                                icon: Icons.check_circle_outline_rounded,
                                expanded: true,
                                onPressed: _save,
                              ),
                      )
                          .animate()
                          .fadeIn(duration: 400.ms)
                          .slideY(begin: 0.2, end: 0),
                    ),
                  ],
                ),
    );
  }

  Widget _section({
    required IconData icon,
    required String title,
    required String subtitle,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  gradient: AppColors.weddingGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _basicFields() {
    final p = _data!;
    return Column(
      children: [
        _labelField('Full name *', TextField(
          controller: _fullName,
          textCapitalization: TextCapitalization.words,
          decoration: _dec('e.g. Ahmed Khan'),
          onChanged: (_) => setState(() {}),
        )),
        _dropdownField(
          label: 'Guardian *',
          value: p.guardianType,
          items: _pairList(_mergedOptions('guardian_type', fallback: guardianTypeOptions)),
          onChanged: (v) => setState(() => p.guardianType = v ?? ''),
        ),
        _labelField('${p.guardianType.isEmpty ? 'Guardian' : p.guardianType} name *', TextField(
          controller: _guardianName,
          decoration: _dec('Full name'),
          onChanged: (_) => setState(() {}),
        )),
        _dropdownField(
          label: 'Gender *',
          value: p.gender,
          items: const [('male', 'Man'), ('female', 'Woman')],
          onChanged: (v) => setState(() => p.gender = v ?? ''),
        ),
        _labelField(
          'Date of birth *',
          InkWell(
            onTap: _pickDob,
            borderRadius: BorderRadius.circular(16),
            child: InputDecorator(
              decoration: _dec('Select date'),
              child: Text(
                p.dateOfBirth.isEmpty ? 'Select date' : p.dateOfBirth,
                style: TextStyle(
                  color: p.dateOfBirth.isEmpty ? AppColors.textMuted : AppColors.text,
                ),
              ),
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: _dropdownField(
                label: 'Height (ft) *',
                value: _heightFeet?.toString() ?? '',
                items: [for (final f in heightFeetOptions) ('$f', "$f'")],
                onChanged: (v) => setState(() => _heightFeet = int.tryParse(v ?? '')),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _dropdownField(
                label: 'Height (in) *',
                value: _heightInches?.toString() ?? '',
                items: [for (final i in heightInchesOptions) ('$i', '$i"')],
                onChanged: (v) => setState(() => _heightInches = int.tryParse(v ?? '')),
              ),
            ),
          ],
        ),
        _labelField('Weight (kg) *', TextField(
          controller: _weight,
          keyboardType: TextInputType.number,
          decoration: _dec('e.g. 65'),
          onChanged: (_) => setState(() {}),
        )),
        _dropdownField(
          label: 'Marital status *',
          value: p.maritalStatus,
          items: [
            for (final o in maritalStatusOptions) (o.$1, o.$2),
            ..._mergedOptions('marital_status').where((e) => !maritalStatusLabels.containsKey(e)).map((e) => (e, e)),
          ],
          onChanged: (v) => setState(() => p.maritalStatus = v ?? ''),
        ),
        _dropdownField(
          label: 'Color *',
          value: p.color,
          items: _pairList(_mergedOptions('color', fallback: colorOptions)),
          onChanged: (v) => setState(() => p.color = v ?? ''),
        ),
        _dropdownField(
          label: 'Disability *',
          value: _disabilityChoice,
          items: [for (final c in disabilityChoices) (c, c)],
          onChanged: (v) => setState(() => _disabilityChoice = v ?? ''),
        ),
        if (_disabilityChoice == 'Yes')
          _labelField('Disability details', TextField(
            controller: _disabilityDetail,
            decoration: _dec('Optional details'),
          )),
      ],
    );
  }

  Widget _religiousFields() {
    final p = _data!;
    final sects = <String>{
      ...sectsForReligion(p.religion),
      ..._mergedOptions('sect'),
    }.toList();
    final castes = _mergedOptions('caste', fallback: const [
      'Arain', 'Awan', 'Baloch', 'Gujjar', 'Jatt', 'Kashmiri', 'Pathan', 'Rajput', 'Syed', 'Other',
    ]);
    return Column(
      children: [
        _dropdownField(
          label: 'Religion *',
          value: p.religion,
          items: _pairList(_mergedOptions('religion', fallback: religionOptionsFull)),
          onChanged: (v) => setState(() {
            p.religion = v ?? '';
            if (!sectsForReligion(p.religion).contains(p.sect)) p.sect = '';
          }),
        ),
        if (p.religion != 'Sikhism')
          _dropdownField(
            label: 'Sect / Denomination *',
            value: p.sect,
            items: _pairList(sects),
            onChanged: (v) => setState(() => p.sect = v ?? ''),
          ),
        _dropdownField(
          label: 'Caste *',
          value: p.caste,
          items: _pairList(castes),
          onChanged: (v) => setState(() => p.caste = v ?? ''),
        ),
      ],
    );
  }

  Widget _languageFields() {
    final langs = <String>{
      ...pakistanLanguages,
      ..._mergedOptions('language'),
      ..._selectedLanguages,
    }.toList()
      ..sort();
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final lang in langs)
          FilterChip(
            label: Text(lang),
            selected: _selectedLanguages.contains(lang),
            selectedColor: AppColors.blush,
            checkmarkColor: AppColors.primary,
            onSelected: (sel) {
              setState(() {
                if (sel) {
                  _selectedLanguages.add(lang);
                } else {
                  _selectedLanguages.remove(lang);
                }
              });
            },
          ),
      ],
    );
  }

  Widget _contactFields() {
    final email = _data?.email ?? AuthController.instance.user?.email ?? '';
    return Column(
      children: [
        _labelField(
          'Email',
          InputDecorator(
            decoration: _dec('Account email'),
            child: Text(email.isEmpty ? '—' : email),
          ),
        ),
        _labelField('Phone *', TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          decoration: _dec('+92 300 1234567'),
          onChanged: (_) => setState(() {}),
        )),
        _labelField('WhatsApp', TextField(
          controller: _whatsapp,
          keyboardType: TextInputType.phone,
          decoration: _dec('Optional'),
        )),
      ],
    );
  }

  Widget _locationFields() {
    final p = _data!;
    final overseas = p.province == 'Overseas';
    final cityItems = citiesForProvince(p.province);
    return Column(
      children: [
        _dropdownField(
          label: 'Province / Location *',
          value: p.province,
          items: [for (final prov in pakistanProvinces) (prov, provinceLabel(prov))],
          onChanged: (v) => setState(() {
            p.province = v ?? '';
            if (p.province != 'Overseas') {
              p.abroadCountry = '';
              final cities = citiesForProvince(p.province);
              if (!cities.contains(p.city)) {
                p.city = '';
                _cityCustom.clear();
              }
            }
          }),
        ),
        if (overseas) ...[
          _dropdownField(
            label: 'Abroad country *',
            value: p.abroadCountry,
            items: _pairList(overseasCountries),
            onChanged: (v) => setState(() {
              p.abroadCountry = v ?? '';
              p.city = p.abroadCountry;
              _cityCustom.text = p.city;
            }),
          ),
          _dropdownField(
            label: 'House type *',
            value: _abroadHouseType,
            items: const [('own', 'Own'), ('rent', 'Rent')],
            onChanged: (v) => setState(() => _abroadHouseType = v ?? ''),
          ),
          _labelField('House address *', TextField(
            controller: _abroadLocation,
            decoration: _dec('Full address abroad'),
            onChanged: (_) => setState(() {}),
          )),
        ] else ...[
          _dropdownField(
            label: 'City *',
            value: cityItems.contains(p.city) ? p.city : '',
            items: cityItems.isEmpty
                ? const [('', 'Select province first')]
                : [for (final c in cityItems) (c, c)],
            onChanged: cityItems.isEmpty
                ? (_) {}
                : (v) => setState(() {
                      p.city = v ?? '';
                      _cityCustom.text = p.city;
                    }),
          ),
          _dropdownField(
            label: 'House type *',
            value: _pkHouseType,
            items: const [('own', 'Own'), ('rent', 'Rent')],
            onChanged: (v) => setState(() => _pkHouseType = v ?? ''),
          ),
          _labelField('House address *', TextField(
            controller: _houseLocation,
            decoration: _dec('Area / full address'),
            onChanged: (_) => setState(() {}),
          )),
        ],
      ],
    );
  }

  Widget _careerFields() {
    final p = _data!;
    return Column(
      children: [
        _dropdownField(
          label: 'Education *',
          value: p.education,
          items: _pairList(_mergedOptions('education', fallback: educationOptions)),
          onChanged: (v) => setState(() => p.education = v ?? ''),
        ),
        _dropdownField(
          label: 'Profession *',
          value: p.profession,
          items: _pairList(_mergedOptions('profession', fallback: const [
            'Doctor', 'Engineer', 'Teacher', 'Business', 'Government Job',
            'IT / Software', 'Lawyer', 'Student', 'Homemaker', 'Other',
          ])),
          onChanged: (v) => setState(() => p.profession = v ?? ''),
        ),
      ],
    );
  }

  Widget _partnerFields() {
    final p = _data!;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _labelField('Min age *', TextField(
                controller: _partnerMinAge,
                keyboardType: TextInputType.number,
                decoration: _dec('22'),
                onChanged: (_) => setState(() {}),
              )),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _labelField('Max age *', TextField(
                controller: _partnerMaxAge,
                keyboardType: TextInputType.number,
                decoration: _dec('32'),
                onChanged: (_) => setState(() {}),
              )),
            ),
          ],
        ),
        _dropdownField(
          label: 'Preferred province',
          value: p.partnerProvince,
          items: [
            ('', 'Any'),
            for (final prov in pakistanProvinces) (prov, provinceLabel(prov)),
          ],
          onChanged: (v) => setState(() {
            p.partnerProvince = v ?? '';
            final cities = citiesForProvince(p.partnerProvince);
            if (p.partnerCity.isNotEmpty && !cities.contains(p.partnerCity)) {
              p.partnerCity = '';
              _partnerCity.clear();
            }
          }),
        ),
        if (p.partnerProvince.isEmpty || p.partnerProvince == 'Overseas')
          _labelField(
            p.partnerProvince == 'Overseas' ? 'Preferred country' : 'Preferred city',
            TextField(
              controller: _partnerCity,
              decoration: _dec(p.partnerProvince == 'Overseas' ? 'Optional country' : 'Select province first'),
              onChanged: (v) => p.partnerCity = v.trim(),
            ),
          )
        else
          _dropdownField(
            label: 'Preferred city',
            value: citiesForProvince(p.partnerProvince).contains(p.partnerCity) ? p.partnerCity : '',
            items: [
              ('', 'Any'),
              for (final c in citiesForProvince(p.partnerProvince)) (c, c),
            ],
            onChanged: (v) => setState(() {
              p.partnerCity = v ?? '';
              _partnerCity.text = p.partnerCity;
            }),
          ),
        _dropdownField(
          label: 'Preferred education',
          value: p.partnerEducation,
          items: [
            ('', 'Any'),
            ..._pairList(educationOptions),
          ],
          onChanged: (v) => setState(() => p.partnerEducation = v ?? ''),
        ),
        _dropdownField(
          label: 'Preferred marital status',
          value: p.partnerMaritalStatus,
          items: [
            ('', 'Any'),
            for (final o in maritalStatusOptions) (o.$1, o.$2),
          ],
          onChanged: (v) => setState(() => p.partnerMaritalStatus = v ?? ''),
        ),
      ],
    );
  }

  Widget _aboutFields() {
    return Column(
      children: [
        _labelField('About me * (min 20 chars)', TextField(
          controller: _about,
          maxLines: 4,
          decoration: _dec('Tell families about yourself'),
          onChanged: (_) => setState(() {}),
        )),
        _labelField('Family details * (min 10 chars)', TextField(
          controller: _family,
          maxLines: 4,
          decoration: _dec('Family background'),
          onChanged: (_) => setState(() {}),
        )),
      ],
    );
  }

  InputDecoration _dec(String hint) => InputDecoration(hintText: hint);

  List<(String, String)> _pairList(List<String> values) =>
      [for (final v in values.where((e) => e.isNotEmpty)) (v, v)];

  Widget _labelField(String label, Widget child) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }

  Widget _dropdownField({
    required String label,
    required String value,
    required List<(String, String)> items,
    required ValueChanged<String?> onChanged,
  }) {
    final unique = <String>{};
    final clean = <(String, String)>[];
    for (final item in items) {
      if (unique.add(item.$1)) clean.add(item);
    }
    if (value.isNotEmpty && !unique.contains(value)) {
      clean.insert(0, (value, maritalStatusLabels[value] ?? value));
    }
    final exists = clean.any((e) => e.$1 == value);
    return _labelField(
      label,
      DropdownButtonFormField<String>(
        key: ValueKey('$label-$value-${clean.length}'),
        initialValue: exists ? value : null,
        isExpanded: true,
        hint: const Text('Select'),
        decoration: const InputDecoration(),
        items: [
          for (final item in clean)
            DropdownMenuItem(
              value: item.$1,
              child: Text(item.$2, overflow: TextOverflow.ellipsis),
            ),
        ],
        onChanged: onChanged,
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({
    required this.title,
    required this.subtitle,
    required this.percent,
    required this.incomplete,
    required this.onBack,
  });

  final String title;
  final String subtitle;
  final int percent;
  final bool incomplete;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return AnimatedTopBar(
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.only(
          top: MediaQuery.paddingOf(context).top + 8,
          left: 8,
          right: 16,
          bottom: 20,
        ),
        decoration: const BoxDecoration(
          gradient: AppColors.weddingGradient,
          borderRadius: BorderRadius.only(
            bottomLeft: Radius.circular(28),
            bottomRight: Radius.circular(28),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: onBack,
                  icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                ),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    incomplete ? 'Incomplete' : 'Complete',
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 4, 0),
              child: Text(subtitle, style: const TextStyle(color: Colors.white70)),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text('Profile completion', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      Text('$percent%', style: const TextStyle(color: AppColors.goldLight, fontWeight: FontWeight.w800)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: percent / 100),
                      duration: const Duration(milliseconds: 700),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, _) {
                        return LinearProgressIndicator(
                          value: value,
                          minHeight: 10,
                          backgroundColor: Colors.white.withValues(alpha: 0.2),
                          color: AppColors.gold,
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

class _Banner extends StatelessWidget {
  const _Banner({required this.text, required this.success});

  final String text;
  final bool success;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: success ? const Color(0xFFDCFCE7) : const Color(0xFFFEF2F2),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Text(
          text,
          style: TextStyle(
            color: success ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    ).animate().fadeIn().slideY(begin: -0.2, end: 0);
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
