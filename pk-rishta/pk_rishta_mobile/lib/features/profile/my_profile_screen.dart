import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validation.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_avatar.dart';
import '../../data/constants/profile_options.dart';
import '../../data/models/family_details.dart';
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
  bool _uploadingPhoto = false;
  String? _error;
  String? _success;
  String? _errorField;

  String _profilePhoto = '';

  final _fullName = TextEditingController();
  final _nameFieldKey = GlobalKey();
  final _email = TextEditingController();
  final _guardianName = TextEditingController();
  final _weight = TextEditingController();
  final _disabilityDetail = TextEditingController();
  final _houseLocation = TextEditingController();
  final _abroadLocation = TextEditingController();
  final _about = TextEditingController();
  final _fatherName = TextEditingController();
  final _motherName = TextEditingController();
  FamilyDetailsData _family = FamilyDetailsData();
  final _partnerMinAge = TextEditingController();
  final _partnerMaxAge = TextEditingController();
  final _cityCustom = TextEditingController();
  final _professionOther = TextEditingController();
  final _partnerNotes = TextEditingController();

  int? _heightFeet;
  int? _heightInches;
  String _disabilityChoice = '';
  String _pkHouseType = '';
  String _abroadHouseType = '';
  String _abroadCountry = '';
  bool _showPkResidence = true;
  bool _showAbroadResidence = false;
  Set<String> _selectedLanguages = {};
  bool _showPkLanguages = false;
  bool _showIntlLanguages = false;
  bool _optionRequestOpen = false;
  final _optionRequestText = TextEditingController();
  bool _optionRequestSending = false;
  String? _optionRequestFeedback;
  bool _optionRequestError = false;
  String _professionCategory = '';
  String _professionChoice = '';
  String _hafizQuran = '';

  List<ProfileContact> _contacts = [ProfileContact(type: 'phone')];
  final List<TextEditingController> _contactControllers = [];

  int? _partnerMinFeet;
  int? _partnerMinInches;
  int? _partnerMaxFeet;
  int? _partnerMaxInches;
  String _partnerReligion = '';
  String _partnerSect = '';
  Set<String> _partnerCastes = {};
  Set<String> _partnerStates = {};
  Set<String> _partnerCountries = {};
  Set<String> _partnerCities = {};
  Set<String> _partnerEducations = {};
  Set<String> _partnerProfessions = {};
  String _partnerMaritalStatus = '';
  String _pendingReqCaste = '';
  String _pendingReqState = '';
  String _pendingReqCity = '';
  String _pendingReqCountry = '';
  String _pendingReqEducation = '';
  String _pendingReqProfessionCategory = '';
  String _pendingReqProfessionChoice = '';

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
      _fullName, _email, _guardianName, _weight, _disabilityDetail, _houseLocation,
      _abroadLocation, _about, _fatherName, _motherName, _partnerMinAge, _partnerMaxAge,
      _cityCustom, _professionOther, _partnerNotes, _optionRequestText,
    ]) {
      c.dispose();
    }
    for (final c in _contactControllers) {
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
        'state', 'country', 'city',
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
    _email.text = p.email;
    _guardianName.text = p.guardianName;
    _weight.text = _formatWeight(p.weightKg);
    _about.text = p.aboutMe;
    _loadFamily(p.familyDetails);
    _partnerMinAge.text = p.partnerMinAge?.toString() ?? '';
    _partnerMaxAge.text = p.partnerMaxAge?.toString() ?? '';
    _cityCustom.text = p.city;
    _profilePhoto = p.profilePhoto;

    final h = parseFeetInchesFromCm(p.heightCm);
    _heightFeet = h.feet;
    _heightInches = h.inches;

    final minH = parseFeetInchesFromCm(p.partnerMinHeightCm);
    _partnerMinFeet = minH.feet;
    _partnerMinInches = minH.inches;
    final maxH = parseFeetInchesFromCm(p.partnerMaxHeightCm);
    _partnerMaxFeet = maxH.feet;
    _partnerMaxInches = maxH.inches;

    _partnerReligion = p.partnerReligion;
    _partnerSect = p.partnerSect;
    _partnerCastes = p.partnerCastes.toSet();
    _partnerStates = p.partnerStates.toSet();
    _partnerCountries = p.partnerCountries.toSet();
    _partnerCities = p.partnerCities.toSet();
    _partnerEducations = p.partnerEducations.toSet();
    _partnerProfessions = p.partnerProfessions.toSet();
    _partnerMaritalStatus = p.partnerMaritalStatus;
    _partnerNotes.text = p.partnerRequirementsNotes;
    if (_partnerReligion.isNotEmpty &&
        _partnerSect.isNotEmpty &&
        !sectsForReligion(_partnerReligion).contains(_partnerSect)) {
      _partnerSect = '';
    }

    if (p.religion.isEmpty) {
      p.religion = 'Islam';
    }

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

    _abroadCountry = p.abroadCountry;
    if (_abroadCountry.isEmpty && p.province == 'Overseas' && p.country != 'Pakistan') {
      _abroadCountry = p.country;
    }
    final hasPk = p.province.isNotEmpty && p.province != 'Overseas';
    final hasAbroad = _abroadCountry.isNotEmpty;
    _showPkResidence = hasPk || (!hasPk && !hasAbroad);
    _showAbroadResidence = hasAbroad;

    _selectedLanguages = p.languages
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toSet();
    _syncLanguageCategories();

    final parsed = parseStoredProfession(p.profession);
    _professionCategory = parsed.category;
    _professionChoice = parsed.choice;
    _professionOther.text = parsed.otherText;
    _hafizQuran = p.hafizQuran;
    if (_hafizQuran.isEmpty && parsed.choice == 'Hafiz-e-Quran') {
      _hafizQuran = 'Yes';
    }

    if (p.contacts.isNotEmpty) {
      _contacts = p.contacts.map((c) => ProfileContact(type: c.type, number: c.number)).toList();
    } else {
      _contacts = [ProfileContact(type: 'phone')];
    }
    _rebuildContactControllers();
  }

  void _rebuildContactControllers() {
    for (final c in _contactControllers) {
      c.dispose();
    }
    _contactControllers.clear();
    for (final c in _contacts) {
      _contactControllers.add(TextEditingController(text: c.number));
    }
  }

  void _syncLanguageCategories() {
    final pk = pakistanLanguages.toSet();
    final intl = internationalLanguages.toSet();
    _showPkLanguages = _selectedLanguages.any(pk.contains);
    _showIntlLanguages = _selectedLanguages.any(intl.contains);
  }

  void _syncToModel() {
    final p = _data!;
    p.profilePhoto = _profilePhoto;
    p.email = _email.text.trim();
    p.fullName = _fullName.text;
    p.guardianName = _guardianName.text.trim();
    p.weightKg = num.tryParse(_weight.text.trim());
    if (_heightFeet != null && _heightInches != null) {
      p.heightCm = feetInchesToCm(_heightFeet!, _heightInches!);
    }
    p.aboutMe = _about.text.trim();
    _syncFamilyJobs();
    p.familyDetails = _family.isEmpty ? '' : serializeFamilyDetails(_family);
    p.partnerMinAge = int.tryParse(_partnerMinAge.text.trim());
    p.partnerMaxAge = int.tryParse(_partnerMaxAge.text.trim());
    p.city = _cityCustom.text.trim().isNotEmpty ? _cityCustom.text.trim() : p.city;
    p.languages = _selectedLanguages.join(', ');

    p.partnerMinHeightCm = _partnerMinFeet != null && _partnerMinInches != null
        ? feetInchesToCm(_partnerMinFeet!, _partnerMinInches!)
        : null;
    p.partnerMaxHeightCm = _partnerMaxFeet != null && _partnerMaxInches != null
        ? feetInchesToCm(_partnerMaxFeet!, _partnerMaxInches!)
        : null;
    p.partnerReligion = _partnerReligion;
    p.partnerSect = _partnerSect;
    p.partnerCastes = _partnerCastes.toList();
    p.partnerStates = _partnerStates.toList();
    p.partnerCountries = _partnerCountries.toList();
    p.partnerCities = _partnerCities.toList();
    p.partnerEducations = _partnerEducations.toList();
    p.partnerProfessions = _partnerProfessions.toList();
    p.partnerMaritalStatus = _partnerMaritalStatus;
    p.partnerRequirementsNotes = _partnerNotes.text.trim();

    if (_disabilityChoice == 'No') {
      p.disability = 'No';
    } else if (_disabilityChoice == 'Yes') {
      final detail = _disabilityDetail.text.trim();
      p.disability = detail.isEmpty ? 'Yes' : detail;
    }

    p.profession = formatProfession(
      _professionCategory,
      _professionChoice,
      otherText: _professionOther.text,
    );
    p.hafizQuran = _hafizQuran;

    if (_showPkResidence) {
      p.country = 'Pakistan';
      p.houseOwnLocation = _pkHouseType == 'own' ? _houseLocation.text.trim() : '';
      p.houseRentLocation = _pkHouseType == 'rent' ? _houseLocation.text.trim() : '';
    } else {
      p.province = 'Overseas';
      p.city = _abroadCountry.isEmpty ? p.city : _abroadCountry;
      p.country = _abroadCountry.isEmpty ? p.country : _abroadCountry;
      p.houseOwnLocation = '';
      p.houseRentLocation = '';
    }
    if (_showAbroadResidence) {
      p.abroadCountry = _abroadCountry;
      p.abroadHouseOwnLocation = _abroadHouseType == 'own' ? _abroadLocation.text.trim() : '';
      p.abroadHouseRentLocation = _abroadHouseType == 'rent' ? _abroadLocation.text.trim() : '';
    } else {
      p.abroadCountry = '';
      p.abroadHouseOwnLocation = '';
      p.abroadHouseRentLocation = '';
    }

    p.contacts = _contacts
        .where((c) => c.number.trim().isNotEmpty)
        .map((c) => ProfileContact(type: c.type, number: c.number.trim()))
        .toList();
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
      p.province.isNotEmpty,
      p.city.isNotEmpty || _cityCustom.text.trim().isNotEmpty,
      p.education.isNotEmpty,
      _hafizQuran.isNotEmpty,
      _professionChoice.isNotEmpty,
      _family.isComplete,
    ];
    final hasPhone = _contacts.any((c) => c.type == 'phone' && c.number.trim().isNotEmpty);
    final hasPartnerAge =
        _partnerMinAge.text.trim().isNotEmpty && _partnerMaxAge.text.trim().isNotEmpty;
    final hasResidence = _showPkResidence
        ? (_pkHouseType.isNotEmpty && _houseLocation.text.trim().length >= 5)
        : (_showAbroadResidence &&
            _abroadCountry.isNotEmpty &&
            _abroadHouseType.isNotEmpty &&
            _abroadLocation.text.trim().length >= 5);
    final total = checks.length + 3;
    final done = checks.where((e) => e).length +
        (hasPhone ? 1 : 0) +
        (hasPartnerAge ? 1 : 0) +
        (hasResidence ? 1 : 0);
    return ((done / total) * 100).round().clamp(0, 100);
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

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1400,
      maxHeight: 1400,
      imageQuality: 85,
    );
    if (picked == null || !mounted) return;
    try {
      final length = await picked.length();
      if (length > 3 * 1024 * 1024) {
        setState(() => _error = 'Image must be under 3 MB');
        return;
      }
      final bytes = await picked.readAsBytes();
      final ext = picked.name.contains('.')
          ? picked.name.split('.').last.toLowerCase()
          : 'jpg';
      final contentType = switch (ext) {
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        _ => 'image/jpeg',
      };
      setState(() {
        _uploadingPhoto = true;
        _error = null;
        _success = null;
      });
      final url = await _repo.uploadProfilePhoto(
        filename: picked.name,
        bytes: bytes,
        contentType: contentType,
      );
      if (!mounted) return;
      setState(() {
        _profilePhoto = url;
        _uploadingPhoto = false;
        _success = 'Photo uploaded — save profile to keep it';
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _uploadingPhoto = false;
        _error = e.message;
      });
    }
  }

  String? _validate() {
    _errorField = null;
    final nameError = validateName(_fullName.text, 'Full name');
    if (nameError != null) {
      _errorField = 'full_name';
      return nameError;
    }

    final emailError = validateEmail(_email.text);
    if (emailError != null) return emailError;

    final p = _data!;
    if (p.gender.isEmpty) return 'Please select Man or Woman';
    final dobError = validateDobAge(p.dateOfBirth);
    if (dobError != null) return dobError;
    if (_heightFeet == null || _heightInches == null) return 'Please select your height';
    final weightError = validateWeightKg(_weight.text);
    if (weightError != null) return weightError;
    if (p.maritalStatus.isEmpty) return 'Marital status is required';
    if (p.color.isEmpty) return 'Color is required';
    if (p.guardianType.isEmpty) return 'Guardian is required';
    if (p.guardianType.isNotEmpty) {
      final guardianError = validateName(_guardianName.text, 'Guardian name');
      if (guardianError != null) return guardianError;
    }
    if (_disabilityChoice.isEmpty) return 'Disability is required';
    if (p.religion.isEmpty) return 'Religion is required';
    if (p.religion != 'Sikhism' && p.sect.isEmpty) return 'Please select sect / denomination';
    if (p.caste.isEmpty) return 'Caste is required';
    if (_selectedLanguages.isEmpty) return 'Please select at least one language';

    if (!_showPkResidence && !_showAbroadResidence) {
      return 'Select at least one residence (Pakistan or Abroad)';
    }
    if (_showPkResidence) {
      if (p.province.isEmpty) return 'Province is required';
      if (p.city.isEmpty && _cityCustom.text.trim().isEmpty) return 'City is required';
      if (_pkHouseType.isEmpty) return 'House type is required';
      if (_houseLocation.text.trim().length < 5) return 'Complete address must be at least 5 characters';
    }
    if (_showAbroadResidence) {
      if (_abroadCountry.isEmpty) return 'Country is required';
      if (_abroadHouseType.isEmpty) return 'Abroad house type is required';
      if (_abroadLocation.text.trim().length < 5) return 'Abroad complete address must be at least 5 characters';
    }

    if (p.education.isEmpty) return 'Education is required';
    if (_hafizQuran.isEmpty) return 'Please select Hafiz-e-Quran Yes or No';
    if (_professionChoice.isEmpty) return 'Profession is required';
    final about = _about.text.trim();
    if (about.isNotEmpty && about.length < 20) return 'About me must be at least 20 characters';
    _syncFamilyJobs();
    if (!_family.isComplete) return 'Please add father and mother details';

    final filledContacts = _contacts.where((c) => c.number.trim().isNotEmpty).toList();
    if (filledContacts.isEmpty) return 'At least one phone number is required';
    if (!filledContacts.any((c) => c.type == 'phone')) {
      return 'At least one phone number is required (WhatsApp is optional)';
    }
    for (final c in filledContacts) {
      final normalized = c.number.trim().replaceAll(RegExp(r'[\s()-]'), '');
      final pkRe = RegExp(r'^(\+92|0)?3\d{2}\d{7}$');
      final intlRe = RegExp(r'^\+[1-9]\d{7,14}$');
      if (!pkRe.hasMatch(normalized) && !intlRe.hasMatch(normalized)) {
        return 'Enter a valid number (e.g. +92 300 1234567, +1 416 555 0100)';
      }
    }

    final minAge = int.tryParse(_partnerMinAge.text.trim());
    final maxAge = int.tryParse(_partnerMaxAge.text.trim());
    if (minAge == null || maxAge == null) return 'Preferred minimum and maximum age are required';
    if (minAge < 18 || minAge > 80) return 'Minimum age must be between 18 and 80';
    if (maxAge < 18 || maxAge > 80) return 'Maximum age must be between 18 and 80';
    if (minAge > maxAge) return 'Minimum age cannot exceed maximum age';
    final minH = _partnerMinFeet != null && _partnerMinInches != null
        ? feetInchesToCm(_partnerMinFeet!, _partnerMinInches!)
        : null;
    final maxH = _partnerMaxFeet != null && _partnerMaxInches != null
        ? feetInchesToCm(_partnerMaxFeet!, _partnerMaxInches!)
        : null;
    if (minH != null && (minH < 120 || minH > 230)) return 'Minimum height is out of range';
    if (maxH != null && (maxH < 120 || maxH > 230)) return 'Maximum height is out of range';
    if (minH != null && maxH != null && minH > maxH) {
      return 'Minimum height cannot exceed maximum height';
    }
    if (_partnerNotes.text.trim().isNotEmpty && _partnerNotes.text.trim().length < 10) {
      return 'Additional requirements must be at least 10 characters';
    }
    return null;
  }

  Future<void> _save() async {
    if (_data == null) return;
    _syncToModel();
    final error = _validate();
    if (error != null) {
      setState(() {
        _error = error;
        _success = null;
      });
      _showSaveMessage(error, success: false);
      _focusErrorField();
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
      final message = 'Profile saved successfully!';
      setState(() {
        _data = updated;
        _saving = false;
        _success = message;
      });
      _showSaveMessage(message, success: true);
    } on ApiException catch (e) {
      if (!mounted) return;
      final message = e.message.isNotEmpty ? e.message : 'Could not save profile. Please try again.';
      setState(() {
        _saving = false;
        _error = message;
      });
      _showSaveMessage(message, success: false);
    } catch (_) {
      const message = 'Could not save profile. Please try again.';
      setState(() {
        _saving = false;
        _error = message;
      });
      _showSaveMessage(message, success: false);
    }
  }

  void _showSaveMessage(String text, {required bool success}) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          text,
          style: TextStyle(
            color: success ? const Color(0xFF15803D) : const Color(0xFF991B1B),
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: success ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 96),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _focusErrorField() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final ctx = _errorField == 'full_name' ? _nameFieldKey.currentContext : null;
      if (ctx != null) {
        Scrollable.ensureVisible(
          ctx,
          duration: const Duration(milliseconds: 350),
          alignment: 0.12,
          curve: Curves.easeOut,
        );
        return;
      }
      if (_scroll.hasClients) {
        _scroll.animateTo(0, duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
      }
    });
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
        : 'Update your match details anytime';

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
                      photoUrl: _profilePhoto,
                      gender: _data!.gender,
                      firstName: _data!.firstName,
                      lastName: _data!.lastName,
                      displayName: _fullName.text.trim(),
                      city: _data!.city,
                      province: _data!.province,
                      uploadingPhoto: _uploadingPhoto,
                      showRemove: _profilePhoto.isNotEmpty,
                      onAddPhoto: _pickPhoto,
                      onRemovePhoto: () => setState(() => _profilePhoto = ''),
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
                            subtitle: 'Email · Phone required · WhatsApp optional',
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
                            subtitle: 'Optional intro, then family details',
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
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (_error != null)
                              Container(
                                width: double.infinity,
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEE2E2),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFFECACA)),
                                ),
                                child: Text(
                                  _error!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF991B1B),
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13.5,
                                    height: 1.35,
                                  ),
                                ),
                              ),
                            if (_success != null)
                              Container(
                                width: double.infinity,
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFF86EFAC)),
                                ),
                                child: Text(
                                  _success!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF15803D),
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13.5,
                                    height: 1.35,
                                  ),
                                ),
                              ),
                            _saving
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
                          ],
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
        KeyedSubtree(
          key: _nameFieldKey,
          child: _labelField('Full name *', TextField(
            controller: _fullName,
            textCapitalization: TextCapitalization.words,
            decoration: _dec(
              'Enter full name',
              errorText: _errorField == 'full_name' ? _error : null,
            ),
            onChanged: (_) => setState(() {
              if (_errorField == 'full_name') {
                _errorField = null;
                _error = null;
              }
            }),
          )),
        ),
        _dropdownField(
          label: 'Guardian *',
          value: p.guardianType,
          items: _pairList(_mergedOptions('guardian_type', fallback: guardianTypeOptions)),
          onChanged: (v) => setState(() {
            p.guardianType = v ?? '';
            if (p.guardianType.isEmpty) _guardianName.clear();
          }),
        ),
        if (p.guardianType.isNotEmpty)
          _labelField('${p.guardianType} name *', TextField(
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
                onChanged: (v) => setState(() {
                  _heightFeet = int.tryParse(v ?? '');
                  if (_heightFeet != null && _heightInches == null) {
                    _heightInches = 0;
                  }
                }),
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
        if (_heightFeet != null && _heightInches != null) ...[
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.blush,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                "Height preview: $_heightFeet'$_heightInches\" (${feetInchesToCm(_heightFeet!, _heightInches!)} cm)",
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ],
        _labelField('Weight (kg) *', TextField(
          controller: _weight,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
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
    final castes = _mergedOptions('caste', fallback: casteOptionsFull);
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

  Widget _categoryToggle({
    required String label,
    required bool active,
    required VoidCallback onToggle,
  }) {
    return InkWell(
      onTap: onToggle,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.blush : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: active ? AppColors.primary : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              active ? Icons.check_circle_rounded : Icons.circle_outlined,
              size: 16,
              color: active ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: active ? AppColors.primary : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _languageFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select a category first — you can choose both',
          style: TextStyle(color: AppColors.textMuted, fontSize: 12.5),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _categoryToggle(
              label: 'Pakistan languages',
              active: _showPkLanguages,
              onToggle: () => setState(() {
                _showPkLanguages = !_showPkLanguages;
                if (!_showPkLanguages) {
                  final pk = pakistanLanguages.toSet();
                  _selectedLanguages.removeWhere(pk.contains);
                }
              }),
            ),
            _categoryToggle(
              label: 'International languages',
              active: _showIntlLanguages,
              onToggle: () => setState(() {
                _showIntlLanguages = !_showIntlLanguages;
                if (!_showIntlLanguages) {
                  final intl = internationalLanguages.toSet();
                  _selectedLanguages.removeWhere(intl.contains);
                }
              }),
            ),
          ],
        ),
        if (_showPkLanguages) ...[
          const SizedBox(height: 12),
          const Text(
            'Pakistan languages',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          _langChips(pakistanLanguages),
        ],
        if (_showIntlLanguages) ...[
          const SizedBox(height: 12),
          const Text(
            'International languages',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          _langChips(internationalLanguages),
        ],
        if (_selectedLanguages.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.blush,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              'Selected: ${_selectedLanguages.toList()..sort()}',
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
          ),
        ],
        const SizedBox(height: 8),
        _optionRequestBlock(
          fieldKey: 'language',
          fieldLabel: 'Language',
        ),
      ],
    );
  }

  Widget _optionRequestBlock({
    required String fieldKey,
    required String fieldLabel,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextButton(
          onPressed: () => setState(() => _optionRequestOpen = !_optionRequestOpen),
          style: TextButton.styleFrom(
            padding: EdgeInsets.zero,
            foregroundColor: AppColors.primary,
          ),
          child: Text(
            _optionRequestOpen
                ? '▾ Option not listed? Request admin to add'
                : '▸ Option not listed? Request admin to add',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          ),
        ),
        if (_optionRequestOpen) ...[
          TextField(
            controller: _optionRequestText,
            decoration: const InputDecoration(
              hintText: 'Type the option you need (e.g. language, caste, city)',
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: ElevatedButton(
              onPressed: _optionRequestSending ? null : () => _sendOptionRequest(fieldKey, fieldLabel),
              child: Text(_optionRequestSending ? 'Sending...' : 'Send to admin'),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'This only asks admin to add a new option. You still must select a listed value before saving.',
            style: TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.35),
          ),
          if (_optionRequestFeedback != null) ...[
            const SizedBox(height: 6),
            Text(
              _optionRequestFeedback!,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: _optionRequestError
                    ? const Color(0xFFB91C1C)
                    : const Color(0xFF15803D),
              ),
            ),
          ],
        ],
      ],
    );
  }

  Future<void> _sendOptionRequest(String fieldKey, String fieldLabel) async {
    final requested = _optionRequestText.text.trim();
    final email = _email.text.trim().toLowerCase();
    final name = _fullName.text.trim().isEmpty ? 'Profile User' : _fullName.text.trim();
    if (requested.length < 3) {
      setState(() {
        _optionRequestError = true;
        _optionRequestFeedback = 'Please enter at least 3 characters';
      });
      return;
    }
    if (email.isEmpty) {
      setState(() {
        _optionRequestError = true;
        _optionRequestFeedback = 'Please add your email in Contact section first';
      });
      return;
    }
    setState(() {
      _optionRequestSending = true;
      _optionRequestFeedback = null;
    });
    try {
      await _repo.requestDropdownOption(
        requestedLabel: requested,
        name: name,
        email: email,
        fieldKey: fieldKey,
        fieldLabel: fieldLabel,
      );
      if (!mounted) return;
      setState(() {
        _optionRequestSending = false;
        _optionRequestError = false;
        _optionRequestFeedback =
            'Your request sent to admin successfully. You still need to select a listed $fieldLabel before saving.';
        _optionRequestText.clear();
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _optionRequestSending = false;
        _optionRequestError = true;
        _optionRequestFeedback = e.message;
      });
    }
  }

  Widget _langChips(List<String> langs) {
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _labelField('Email *', TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          decoration: _dec('you@example.com'),
          onChanged: (_) => setState(() {}),
        )),
        for (var i = 0; i < _contacts.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                SizedBox(
                  width: 112,
                  child: _labelField('Type', DropdownButtonFormField<String>(
                    key: ValueKey('ctype-$i-${_contacts[i].type}'),
                    initialValue: _contacts[i].type,
                    isExpanded: true,
                    decoration: const InputDecoration(),
                    items: const [
                      DropdownMenuItem(value: 'phone', child: Text('Phone')),
                      DropdownMenuItem(value: 'whatsapp', child: Text('WhatsApp')),
                    ],
                    onChanged: (v) => setState(() => _contacts[i].type = v ?? 'phone'),
                  )),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _labelField(
                    _contacts[i].type == 'whatsapp' ? 'WhatsApp Number' : 'Phone Number${_contacts[i].type == 'phone' ? ' *' : ''}',
                    TextField(
                      controller: _contactControllers[i],
                      keyboardType: TextInputType.phone,
                      decoration: _dec('+92 300 1234567'),
                      onChanged: (v) => _contacts[i].number = v,
                    ),
                  ),
                ),
                if (_contacts.length > 1)
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _contactControllers.removeAt(i).dispose();
                        _contacts.removeAt(i);
                      });
                    },
                    icon: const Icon(Icons.close_rounded, color: Color(0xFFB91C1C)),
                    tooltip: 'Remove number',
                  ),
              ],
            ),
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: OutlinedButton.icon(
            onPressed: () {
              setState(() {
                _contacts.add(ProfileContact(type: 'phone'));
                _contactControllers.add(TextEditingController());
              });
            },
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Add Number'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: BorderSide(
                color: AppColors.primary.withValues(alpha: 0.4),
                width: 1.2,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _locationFields() {
    final p = _data!;
    final cityItems = citiesForProvince(p.province);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select residence — at least one required (Pakistan selected by default)',
          style: TextStyle(color: AppColors.textMuted, fontSize: 12.5),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _categoryToggle(
              label: 'Pakistan',
              active: _showPkResidence,
              onToggle: () => setState(() {
                _showPkResidence = !_showPkResidence;
                if (!_showPkResidence) {
                  p.province = '';
                  p.city = '';
                  _cityCustom.clear();
                  _pkHouseType = '';
                  _houseLocation.clear();
                }
              }),
            ),
            _categoryToggle(
              label: 'Abroad',
              active: _showAbroadResidence,
              onToggle: () => setState(() {
                _showAbroadResidence = !_showAbroadResidence;
                if (!_showAbroadResidence) {
                  _abroadCountry = '';
                  _abroadHouseType = '';
                  _abroadLocation.clear();
                }
              }),
            ),
          ],
        ),
        if (_showPkResidence) ...[
          const SizedBox(height: 16),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 14),
          const Text(
            'Pakistan Residence',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 10),
          _dropdownField(
            label: 'State / Province *',
            value: p.province,
            items: [for (final prov in pakistanProvinces.where((e) => e != 'Overseas')) (prov, provinceLabel(prov))],
            onChanged: (v) => setState(() {
              p.province = v ?? '';
              final cities = citiesForProvince(p.province);
              if (!cities.contains(p.city)) {
                p.city = '';
                _cityCustom.clear();
              }
            }),
          ),
          _dropdownField(
            label: 'City *',
            value: cityItems.isEmpty ? '' : p.city,
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
          _labelField('Complete address *', TextField(
            controller: _houseLocation,
            decoration: _dec('Area / full address'),
            onChanged: (_) => setState(() {}),
          )),
        ],
        if (_showAbroadResidence) ...[
          const SizedBox(height: 16),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 14),
          const Text(
            'Abroad Residence',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 10),
          _dropdownField(
            label: 'Country *',
            value: _abroadCountry,
            items: _pairList(_mergedOptions('country', fallback: overseasCountries)),
            onChanged: (v) => setState(() => _abroadCountry = v ?? ''),
          ),
          _dropdownField(
            label: 'House type *',
            value: _abroadHouseType,
            items: const [('own', 'Own'), ('rent', 'Rent')],
            onChanged: (v) => setState(() => _abroadHouseType = v ?? ''),
          ),
          _labelField('Complete address *', TextField(
            controller: _abroadLocation,
            decoration: _dec('Full address abroad'),
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
        _labelField('Hafiz-e-Quran *', Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final choice in const ['Yes', 'No'])
              _categoryToggle(
                label: choice,
                active: _hafizQuran == choice,
                onToggle: () => setState(() => _hafizQuran = choice),
              ),
          ],
        )),
        _labelField('Profession *', Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final cat in professionCategories)
                  _categoryToggle(
                    label: cat,
                    active: _professionCategory == cat,
                    onToggle: () => setState(() {
                      _professionCategory = cat;
                      if (_professionChoice.isNotEmpty &&
                          !professionsForCategory(cat).contains(_professionChoice)) {
                        _professionChoice = '';
                        _professionOther.clear();
                      }
                    }),
                  ),
              ],
            ),
            if (_professionCategory.isNotEmpty) ...[
              const SizedBox(height: 10),
              _dropdownField(
                label: 'Role',
                value: _professionChoice,
                items: _pairList(
                  professionsForCategory(
                    _professionCategory,
                    current: _professionChoice,
                  ).where(
                    (e) => e != professionOther || _professionChoice == professionOther,
                  ).toList(),
                ),
                onChanged: (v) => setState(() {
                  _professionChoice = v ?? '';
                  if (_professionChoice != professionOther) _professionOther.clear();
                }),
              ),
              if (_professionChoice == professionOther)
                _labelField('Profession (custom)', TextField(
                  controller: _professionOther,
                  decoration: _dec('Enter your profession'),
                  onChanged: (_) => setState(() {}),
                )),
            ],
          ],
        )),
      ],
    );
  }

  Widget _partnerFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: _labelField('Min age *', TextField(
                controller: _partnerMinAge,
                keyboardType: TextInputType.number,
                decoration: _dec('Any'),
                onChanged: (_) => setState(() {}),
              )),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _labelField('Max age *', TextField(
                controller: _partnerMaxAge,
                keyboardType: TextInputType.number,
                decoration: _dec('Any'),
                onChanged: (_) => setState(() {}),
              )),
            ),
          ],
        ),
        Row(
          children: [
            Expanded(child: _heightRangeField('Min height', _partnerMinFeet, _partnerMinInches,
                (f, i) => setState(() {
                  _partnerMinFeet = f;
                  _partnerMinInches = i;
                }))),
            const SizedBox(width: 10),
            Expanded(child: _heightRangeField('Max height', _partnerMaxFeet, _partnerMaxInches,
                (f, i) => setState(() {
                  _partnerMaxFeet = f;
                  _partnerMaxInches = i;
                }))),
          ],
        ),
        _dropdownField(
          label: 'Preferred religion',
          value: _partnerReligion,
          items: [
            ('', 'Any'),
            ..._pairList(religionOptionsFull),
          ],
          onChanged: (v) => setState(() {
            _partnerReligion = v ?? '';
            if (!sectsForReligion(_partnerReligion).contains(_partnerSect)) {
              _partnerSect = '';
            }
          }),
        ),
        if (_partnerReligion.isNotEmpty && _partnerReligion != 'Sikhism')
          _dropdownField(
            label: 'Preferred sect',
            value: _partnerSect,
            items: [
              ('', 'Any'),
              ..._pairList(_mergedOptions('sect', fallback: sectsForReligion(_partnerReligion))),
            ],
            onChanged: (v) => setState(() => _partnerSect = v ?? ''),
          ),
        _MultiPickField(
          label: 'Preferred caste',
          options: _mergedOptions('caste', fallback: casteOptionsFull),
          selected: _partnerCastes,
          pending: _pendingReqCaste,
          onPendingChanged: (v) => setState(() => _pendingReqCaste = v),
          onAdd: () {
            setState(() {
              _partnerCastes.add(_pendingReqCaste);
              _pendingReqCaste = '';
            });
          },
          onRemove: (v) => setState(() => _partnerCastes.remove(v)),
        ),
        _MultiPickField(
          label: 'Preferred state',
          options: _mergedOptions('state', fallback: [...pakistanProvinces]),
          selected: _partnerStates,
          pending: _pendingReqState,
          onPendingChanged: (v) => setState(() => _pendingReqState = v),
          onAdd: () {
            setState(() {
              _partnerStates.add(_pendingReqState);
              _pendingReqState = '';
            });
          },
          onRemove: _removePartnerState,
        ),
        if (_partnerStates.contains('Overseas'))
          _MultiPickField(
            label: 'Preferred country (Abroad)',
            options: _mergedOptions('country', fallback: overseasCountries),
            selected: _partnerCountries,
            pending: _pendingReqCountry,
            onPendingChanged: (v) => setState(() => _pendingReqCountry = v),
            onAdd: () {
              setState(() {
                _partnerCountries.add(_pendingReqCountry);
                _pendingReqCountry = '';
              });
            },
            onRemove: (v) => setState(() => _partnerCountries.remove(v)),
          ),
        _MultiPickField(
          label: 'Preferred city',
          options: _partnerCityOptions,
          selected: _partnerCities,
          pending: _pendingReqCity,
          enabled: _partnerStates.isNotEmpty,
          hint: _partnerStates.isEmpty ? 'Select preferred state first' : 'Any',
          onPendingChanged: (v) => setState(() => _pendingReqCity = v),
          onAdd: () {
            setState(() {
              _partnerCities.add(_pendingReqCity);
              _pendingReqCity = '';
            });
          },
          onRemove: (v) => setState(() => _partnerCities.remove(v)),
        ),
        _MultiPickField(
          label: 'Preferred education',
          options: _mergedOptions('education', fallback: educationOptions),
          selected: _partnerEducations,
          pending: _pendingReqEducation,
          onPendingChanged: (v) => setState(() => _pendingReqEducation = v),
          onAdd: () {
            setState(() {
              _partnerEducations.add(_pendingReqEducation);
              _pendingReqEducation = '';
            });
          },
          onRemove: (v) => setState(() => _partnerEducations.remove(v)),
        ),
        _labelField('Preferred profession', Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _categoryToggle(
                  label: 'Any',
                  active: _pendingReqProfessionCategory.isEmpty &&
                      _partnerProfessions.isEmpty,
                  onToggle: () => setState(() {
                    _pendingReqProfessionCategory = '';
                    _pendingReqProfessionChoice = '';
                    _partnerProfessions.clear();
                  }),
                ),
                for (final cat in professionCategories)
                  _categoryToggle(
                    label: cat,
                    active: _pendingReqProfessionCategory == cat,
                    onToggle: () => setState(() {
                      _pendingReqProfessionCategory = cat;
                      _pendingReqProfessionChoice = '';
                    }),
                  ),
              ],
            ),
            if (_pendingReqProfessionCategory.isNotEmpty) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _dropdownField(
                      label: 'Role',
                      value: _pendingReqProfessionChoice,
                      items: [
                        ('', 'Any'),
                        ..._pairList(
                          professionsForCategory(
                            _pendingReqProfessionCategory,
                          ).where((e) => e != professionOther).toList(),
                        ),
                      ],
                      onChanged: (v) => setState(() => _pendingReqProfessionChoice = v ?? ''),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: OutlinedButton(
                      onPressed: _pendingReqProfessionChoice.isEmpty
                          ? null
                          : () => setState(() {
                                _partnerProfessions.add(_pendingReqProfessionChoice);
                                _pendingReqProfessionChoice = '';
                                _pendingReqProfessionCategory = '';
                              }),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.4),
                        ),
                      ),
                      child: const Text('Add'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        )),
        if (_partnerProfessions.isNotEmpty)
          _chipWrap(_partnerProfessions, (v) => setState(() => _partnerProfessions.remove(v))),
        _dropdownField(
          label: 'Preferred marital status',
          value: _partnerMaritalStatus,
          items: [
            ('', 'Any'),
            for (final o in maritalStatusOptions) (o.$1, o.$2),
          ],
          onChanged: (v) => setState(() => _partnerMaritalStatus = v ?? ''),
        ),
        _labelField('Additional requirements', TextField(
          controller: _partnerNotes,
          maxLines: 4,
          decoration: _dec('Family values, lifestyle, location flexibility, etc.'),
          onChanged: (_) => setState(() {}),
        )),
      ],
    );
  }

  List<String> get _partnerCityOptions {
    final opts = <String>{};
    for (final s in _partnerStates) {
      if (s == 'Overseas') continue;
      opts.addAll(citiesForProvince(s));
    }
    opts.addAll(_partnerCities);
    return opts.toList()..sort();
  }

  void _removePartnerState(String state) {
    setState(() {
      _partnerStates.remove(state);
      if (state == 'Overseas') {
        _partnerCountries = {};
        _pendingReqCountry = '';
      }
      final allowed = <String>{};
      for (final s in _partnerStates) {
        if (s == 'Overseas') continue;
        allowed.addAll(citiesForProvince(s));
      }
      _partnerCities.removeWhere((c) => !allowed.contains(c));
    });
  }

  Widget _heightRangeField(
    String label,
    int? feet,
    int? inches,
    void Function(int?, int?) onChanged,
  ) {
    return _labelField(label, Row(
      children: [
        Expanded(
          child: DropdownButtonFormField<String>(
            key: ValueKey('$label-ft-$feet'),
            initialValue: feet?.toString(),
            isExpanded: true,
            decoration: const InputDecoration(),
            hint: const Text('Any'),
            items: [
              const DropdownMenuItem(value: '', child: Text('Any')),
              for (final f in heightFeetOptions) DropdownMenuItem(value: '$f', child: Text("$f'")),
            ],
            onChanged: (v) {
              final f = v == null || v.isEmpty ? null : int.tryParse(v);
              onChanged(f, f == null ? null : (inches ?? 0));
            },
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: DropdownButtonFormField<String>(
            key: ValueKey('$label-in-$inches'),
            initialValue: inches?.toString(),
            isExpanded: true,
            decoration: const InputDecoration(),
            hint: const Text('Any'),
            items: [
              const DropdownMenuItem(value: '', child: Text('Any')),
              for (final i in heightInchesOptions) DropdownMenuItem(value: '$i', child: Text('$i"')),
            ],
            onChanged: feet == null
                ? null
                : (v) => onChanged(feet, v == null || v.isEmpty ? 0 : int.tryParse(v)),
          ),
        ),
      ],
    ));
  }

  Widget _chipWrap(Set<String> values, ValueChanged<String> onRemove) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final v in values)
            Chip(
              label: Text(v, style: const TextStyle(fontSize: 12.5)),
              labelPadding: const EdgeInsets.only(left: 8),
              backgroundColor: AppColors.blush,
              side: BorderSide(color: AppColors.primary.withValues(alpha: 0.2)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              deleteIcon: const Icon(Icons.close_rounded, size: 16, color: AppColors.textMuted),
              onDeleted: () => onRemove(v),
            ),
        ],
      ),
    );
  }

  Widget _aboutFields() {
    final brothers = _family.counts(_family.brothers);
    final sisters = _family.counts(_family.sisters);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _labelField('About me (optional)', TextField(
          controller: _about,
          maxLines: 4,
          decoration: _dec('Tell about yourself if you like'),
          onChanged: (_) => setState(() {}),
        )),
        const SizedBox(height: 8),
        const Text('Family Details *', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.primary)),
        const SizedBox(height: 4),
        const Text('Father, mother, brothers and sisters', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        const SizedBox(height: 12),
        _parentCard(
          title: 'Father',
          name: _fatherName,
          alive: _family.father.alive,
          onAlive: (v) => setState(() => _family.father.alive = v ?? ''),
          profession: _family.father.profession,
          professionItems: familyProfessionOptionsFor('father', current: _family.father.profession),
          onProfession: (v) => setState(() => _family.father.profession = v ?? ''),
        ),
        const SizedBox(height: 10),
        _parentCard(
          title: 'Mother',
          name: _motherName,
          alive: _family.mother.alive,
          onAlive: (v) => setState(() => _family.mother.alive = v ?? ''),
          profession: _family.mother.profession,
          professionItems: familyProfessionOptionsFor('mother', current: _family.mother.profession),
          onProfession: (v) => setState(() => _family.mother.profession = v ?? ''),
        ),
        const SizedBox(height: 14),
        _siblingBlock(
          title: 'Brothers',
          summary: '${brothers.total} total · ${brothers.married} married',
          addLabel: '+ Add brother',
          onAdd: () => setState(() {
            _family.brothers.add(emptySibling());
          }),
          children: [
            for (final entry in _family.brothers.asMap().entries)
              _siblingRow(entry.value, entry.key, isBrother: true, onRemove: () => _removeSibling(isBrother: true, id: entry.value.id)),
          ],
        ),
        const SizedBox(height: 12),
        _siblingBlock(
          title: 'Sisters',
          summary: '${sisters.total} total · ${sisters.married} married',
          addLabel: '+ Add sister',
          onAdd: () => setState(() {
            _family.sisters.add(emptySibling());
          }),
          children: [
            for (final entry in _family.sisters.asMap().entries)
              _siblingRow(entry.value, entry.key, isBrother: false, onRemove: () => _removeSibling(isBrother: false, id: entry.value.id)),
          ],
        ),
      ],
    );
  }

  Widget _parentCard({
    required String title,
    required TextEditingController name,
    required String alive,
    required ValueChanged<String?> onAlive,
    required String profession,
    required List<String> professionItems,
    required ValueChanged<String?> onProfession,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.ivory, Colors.white],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary)),
          const SizedBox(height: 8),
          _labelField('$title name', TextField(
            controller: name,
            textCapitalization: TextCapitalization.words,
            decoration: _dec('Enter $title name'),
            onChanged: (_) => setState(() {}),
          )),
          _dropdownField(
            label: 'Alive *',
            fieldKey: '$title-alive',
            value: alive,
            items: const [('alive', 'Alive'), ('late', 'Late')],
            onChanged: onAlive,
          ),
          _dropdownField(
            label: 'Profession',
            fieldKey: '$title-job',
            value: profession,
            items: [for (final job in professionItems) (job, job)],
            onChanged: onProfession,
          ),
        ],
      ),
    );
  }

  Widget _siblingBlock({
    required String title,
    required String summary,
    required String addLabel,
    required VoidCallback onAdd,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.ivory,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary)),
                    Text(summary, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFB45309))),
                  ],
                ),
              ),
              TextButton(onPressed: onAdd, child: Text(addLabel)),
            ],
          ),
          if (children.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 4, bottom: 4),
              child: Text('None added', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
            )
          else
            ...children,
        ],
      ),
    );
  }

  Widget _siblingRow(FamilySibling row, int index, {required bool isBrother, required VoidCallback onRemove}) {
    final jobs = familyProfessionOptionsFor(isBrother ? 'brother' : 'sister', current: row.profession);
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.fromLTRB(10, 10, 6, 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 11,
                backgroundColor: AppColors.primary,
                child: Text('${index + 1}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
              const Spacer(),
              IconButton(
                onPressed: onRemove,
                icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFFDC2626)),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          _dropdownField(
            label: 'Elder / Younger',
            fieldKey: '${row.id}-order',
            value: row.order,
            items: const [('elder', 'Elder'), ('younger', 'Younger')],
            onChanged: (v) => setState(() => row.order = v ?? ''),
          ),
          _dropdownField(
            label: 'Married?',
            fieldKey: '${row.id}-married',
            value: row.married,
            items: const [('married', 'Married'), ('unmarried', 'Unmarried')],
            onChanged: (v) => setState(() => row.married = v ?? ''),
          ),
          _dropdownField(
            label: 'Profession',
            fieldKey: '${row.id}-job',
            value: row.profession,
            items: [for (final job in jobs) (job, job)],
            onChanged: (v) => setState(() => row.profession = v ?? ''),
          ),
        ],
      ),
    );
  }

  void _loadFamily(String? raw) {
    _family = parseFamilyDetails(raw);
    _fatherName.text = _family.father.name;
    _motherName.text = _family.mother.name;
  }

  void _syncFamilyJobs() {
    _family.father.name = _fatherName.text.trim();
    _family.mother.name = _motherName.text.trim();
  }

  void _removeSibling({required bool isBrother, required String id}) {
    setState(() {
      final list = isBrother ? _family.brothers : _family.sisters;
      list.removeWhere((row) => row.id == id);
    });
  }

  InputDecoration _dec(String hint, {String? errorText}) => InputDecoration(
        hintText: hint,
        errorText: errorText,
      );

  String _formatWeight(num? value) {
    if (value == null) return '';
    if (value == value.roundToDouble()) return value.toInt().toString();
    return value.toString();
  }

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
    String? fieldKey,
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
        key: ValueKey('${fieldKey ?? label}-$value-${clean.length}'),
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

class _MultiPickField extends StatelessWidget {
  const _MultiPickField({
    required this.label,
    required this.options,
    required this.selected,
    required this.pending,
    required this.onPendingChanged,
    required this.onAdd,
    required this.onRemove,
    this.enabled = true,
    this.hint = 'Any',
  });

  final String label;
  final List<String> options;
  final Set<String> selected;
  final String pending;
  final ValueChanged<String> onPendingChanged;
  final VoidCallback onAdd;
  final ValueChanged<String> onRemove;
  final bool enabled;
  final String hint;

  @override
  Widget build(BuildContext context) {
    final available = options.where((o) => !selected.contains(o)).toList();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  key: ValueKey('$label-${pending.isEmpty ? '' : pending}-${available.length}'),
                  initialValue: pending.isEmpty ? (enabled ? '' : null) : pending,
                  isExpanded: true,
                  hint: Text(hint),
                  decoration: const InputDecoration(),
                  items: [
                    if (enabled) const DropdownMenuItem(value: '', child: Text('Any')),
                    for (final o in available)
                      DropdownMenuItem(value: o, child: Text(o, overflow: TextOverflow.ellipsis)),
                  ],
                  onChanged: enabled ? (v) => onPendingChanged(v ?? '') : null,
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: !enabled || pending.isEmpty ? null : onAdd,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: BorderSide(color: AppColors.primary.withValues(alpha: 0.4)),
                ),
                child: const Text('Add'),
              ),
            ],
          ),
          if (selected.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final v in selected)
                    Chip(
                      label: Text(v, style: const TextStyle(fontSize: 12.5)),
                      labelPadding: const EdgeInsets.only(left: 8),
                      backgroundColor: AppColors.blush,
                      side: BorderSide(color: AppColors.primary.withValues(alpha: 0.2)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                      deleteIcon: const Icon(Icons.close_rounded, size: 16, color: AppColors.textMuted),
                      onDeleted: () => onRemove(v),
                    ),
                ],
              ),
            ),
        ],
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
    required this.photoUrl,
    required this.gender,
    required this.firstName,
    required this.lastName,
    required this.displayName,
    required this.city,
    required this.province,
    required this.uploadingPhoto,
    required this.showRemove,
    required this.onAddPhoto,
    required this.onRemovePhoto,
  });

  final String title;
  final String subtitle;
  final int percent;
  final bool incomplete;
  final VoidCallback onBack;
  final String photoUrl;
  final String gender;
  final String firstName;
  final String lastName;
  final String displayName;
  final String city;
  final String province;
  final bool uploadingPhoto;
  final bool showRemove;
  final VoidCallback onAddPhoto;
  final VoidCallback onRemovePhoto;

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
            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: [
                  ProfileAvatar(
                    photoUrl: photoUrl.isEmpty ? null : photoUrl,
                    gender: gender,
                    firstName: firstName,
                    lastName: lastName,
                    size: 104,
                    borderWidth: 3,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName.isEmpty ? 'Your Profile' : displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          city.isNotEmpty && province.isNotEmpty
                              ? '$city, ${province == 'Overseas' ? 'Overseas' : province}'
                              : 'Complete your profile to get better matches',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white70, fontSize: 12.5),
                        ),
                        const SizedBox(height: 8),
                        if (uploadingPhoto)
                          const Row(
                            children: [
                              SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              ),
                              SizedBox(width: 8),
                              Text('Uploading...', style: TextStyle(color: Colors.white70)),
                            ],
                          )
                        else
                          _HeroPill(
                            icon: Icons.add_a_photo_rounded,
                            label: 'Add Photo',
                            onTap: onAddPhoto,
                          ),
                        if (showRemove)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: GestureDetector(
                              onTap: onRemovePhoto,
                              child: const Text(
                                'Remove',
                                style: TextStyle(
                                  color: Colors.white,
                                  decoration: TextDecoration.underline,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 8),
                        const Text(
                          'Optional — default avatar if empty',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
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

class _HeroPill extends StatelessWidget {
  const _HeroPill({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.18),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: Colors.white),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ],
          ),
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
    final isOk = success;
    return Material(
      color: Colors.transparent,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isOk ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
          border: Border(
            bottom: BorderSide(
              color: isOk ? const Color(0xFF86EFAC) : const Color(0xFFFECACA),
            ),
          ),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isOk ? const Color(0xFF15803D) : const Color(0xFF991B1B),
            fontWeight: FontWeight.w700,
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
