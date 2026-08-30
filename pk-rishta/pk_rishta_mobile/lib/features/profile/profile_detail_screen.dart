import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/state/favorites_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_access_gate.dart';
import '../../data/models/family_details.dart';
import '../../data/models/profile_model.dart';
import '../../data/repositories/admin_repository.dart';
import '../../data/repositories/profile_repository.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';
import 'my_profile_screen.dart';

class ProfileDetailScreen extends StatefulWidget {
  const ProfileDetailScreen({super.key, required this.profileId, this.preview});

  final String profileId;
  final Profile? preview;

  @override
  State<ProfileDetailScreen> createState() => _ProfileDetailScreenState();
}

class _ProfileDetailScreenState extends State<ProfileDetailScreen> {
  final _repo = ProfileRepository();
  final _adminRepo = AdminRepository();
  static const _requestSlotOptions = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];
  Profile? _profile;
  bool _loading = true;
  String? _error;
  bool _sending = false;
  int _requestLimit = 3;
  bool _savingLimit = false;

  String _complaintCategory = 'fake_profile';
  final _complaintDescCtrl = TextEditingController();
  bool _complaintSubmitting = false;
  String? _complaintFeedback;
  bool _complaintFeedbackError = true;

  @override
  void initState() {
    super.initState();
    _profile = widget.preview;
    _load();
  }

  @override
  void dispose() {
    _complaintDescCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = AuthController.instance;
    final own = auth.user?.profileId == widget.profileId;
    if (!auth.canViewProfiles && !own) {
      if (!mounted) return;
      setState(() => _loading = false);
      return;
    }
    try {
      final profile = await _repo.getById(widget.profileId);
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _requestLimit = profile.contactRequestLimit ?? 3;
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

  Future<void> _saveRequestLimit() async {
    if (_savingLimit) return;
    setState(() => _savingLimit = true);
    try {
      final msg = await _adminRepo.setRequestLimit(
        profileId: widget.profileId,
        limit: _requestLimit,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: const Color(0xFF15803D),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message),
          backgroundColor: const Color(0xFFB91C1C),
        ),
      );
    } finally {
      if (mounted) setState(() => _savingLimit = false);
    }
  }

  Future<void> _sendInterest() async {
    final auth = AuthController.instance;
    if (!auth.isLoggedIn) {
      final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (ok != true) return;
    }
    if (AuthController.instance.needsProfileCompletion) {
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const MyProfileScreen()),
      );
      return;
    }
    setState(() => _sending = true);
    try {
      await _repo.requestContact(widget.profileId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Contact request sent!'),
          backgroundColor: Color(0xFF15803D),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      final msg = e.statusCode == 401
          ? 'Please login again to request a contact number.'
          : e.message;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: const Color(0xFFB91C1C)),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _onHeartPressed(String profileId) async {
    final auth = AuthController.instance;
    if (!auth.isLoggedIn) {
      final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (ok != true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Login to save profiles to favorites'),
              backgroundColor: Color(0xFF8A4B4B),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
        return;
      }
      if (!mounted) return;
    }
    final result = await FavoritesController.instance.toggle(profileId);
    if (!mounted) return;
    showFavoriteSnackBar(context, result);
  }

  void _showComplaintSheet() {
    _complaintFeedback = null;
    final categories = [
      ('fake_profile', 'Fake Profile'),
      ('inappropriate', 'Inappropriate Content'),
      ('harassment', 'Harassment'),
      ('misleading_info', 'Misleading Information'),
      ('other', 'Other'),
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.flag_rounded,
                        color: Color(0xFFB45309),
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Report This Profile',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 17,
                            ),
                          ),
                          Text(
                            'Admin will review your complaint confidentially.',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 12.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Text(
                  'Category',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _complaintCategory,
                      isExpanded: true,
                      items: categories
                          .map((c) => DropdownMenuItem(
                                value: c.$1,
                                child: Text(c.$2, style: const TextStyle(fontSize: 14)),
                              ))
                          .toList(),
                      onChanged: (v) => setModalState(() {
                        if (v != null) _complaintCategory = v;
                      }),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Description *',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _complaintDescCtrl,
                  maxLines: 4,
                  maxLength: 500,
                  decoration: InputDecoration(
                    hintText: 'Describe your complaint in detail (min 20 characters)...',
                    hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                    ),
                  ),
                ),
                if (_complaintFeedback != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _complaintFeedback!,
                    style: TextStyle(
                      color: _complaintFeedbackError
                          ? const Color(0xFFB91C1C)
                          : const Color(0xFF15803D),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 13),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          side: const BorderSide(color: AppColors.border),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _complaintSubmitting
                            ? null
                            : () => _submitComplaint(ctx, setModalState),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFB91C1C),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 13),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _complaintSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Submit Report'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submitComplaint(
    BuildContext modalContext,
    void Function(VoidCallback) setModalState,
  ) async {
    final desc = _complaintDescCtrl.text.trim();
    if (desc.length < 20) {
      setModalState(() {
        _complaintFeedback = 'Description must be at least 20 characters';
        _complaintFeedbackError = true;
      });
      return;
    }

    final profile = _profile;
    if (profile == null) return;

    setModalState(() {
      _complaintSubmitting = true;
      _complaintFeedback = null;
    });
    try {
      await _repo.submitComplaint(profile.id, _complaintCategory, desc);
      if (!mounted) return;
      setModalState(() {
        _complaintSubmitting = false;
        _complaintFeedbackError = false;
        _complaintFeedback = 'Report submitted successfully. Admin will review it.';
        _complaintDescCtrl.clear();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Report submitted successfully. Admin will review it.'),
          backgroundColor: Color(0xFF15803D),
        ),
      );
      await Future<void>.delayed(const Duration(milliseconds: 900));
      if (modalContext.mounted) Navigator.pop(modalContext);
    } on ApiException catch (e) {
      if (!mounted) return;
      final msg = e.statusCode == 401
          ? 'Please login again to submit a report.'
          : e.message;
      setModalState(() {
        _complaintSubmitting = false;
        _complaintFeedbackError = true;
        _complaintFeedback = msg;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: const Color(0xFFB91C1C)),
      );
    }
  }

  Widget _lockedView(Profile? profile) {
    final preview = profile ?? widget.preview;
    return SafeArea(
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_rounded),
            ),
          ),
          Expanded(
            child: ProfileAccessGate(
              onLogin: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              onRegister: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                );
              },
              onCompleteProfile: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const MyProfileScreen()),
                );
              },
              minHeight: 420,
              blurSigma: 18,
              child: preview != null
                  ? _detailView(preview)
                  : _BlurPlaceholder(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailView(Profile profile) {
    final auth = AuthController.instance;
    final interestLabel = !auth.isLoggedIn
        ? 'Login to Request Contact'
        : auth.needsProfileCompletion
            ? 'Complete Profile to Continue'
            : 'Request Contact';
    final prefs = profile.partnerPreferences;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 240,
          pinned: true,
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          actions: [
            if (auth.isLoggedIn && !auth.isAdmin && auth.user?.profileId != profile.id)
              IconButton(
                tooltip: 'Report this profile',
                icon: const Icon(
                  Icons.flag_rounded,
                  color: AppColors.goldLight,
                ),
                onPressed: _showComplaintSheet,
              ),
            ListenableBuilder(
              listenable: FavoritesController.instance,
              builder: (context, _) {
                final favorite = FavoritesController.instance.isFavorite(profile.id);
                return IconButton(
                  tooltip: favorite ? 'Remove from favorites' : 'Save to favorites',
                  icon: Icon(
                    favorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                    color: favorite ? const Color(0xFFFFC1CB) : Colors.white,
                  ),
                  onPressed: () => _onHeartPressed(profile.id),
                );
              },
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            title: Text(profile.fullName),
            background: DecoratedBox(
              decoration: const BoxDecoration(gradient: AppColors.weddingGradient),
              child: Image.asset(
                profile.gender == 'female'
                    ? 'assets/images/avatar-female.png'
                    : 'assets/images/avatar-male.png',
                fit: BoxFit.cover,
                color: Colors.black26,
                colorBlendMode: BlendMode.darken,
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (profile.age != null)
                      _Pill(icon: Icons.cake_outlined, label: '${profile.age} yrs'),
                    if (profile.isVerified)
                      const _Pill(icon: Icons.verified, label: 'Verified'),
                    if (auth.isAdmin && profile.adminRating != null && profile.adminRating! > 0)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: List.generate(
                            profile.adminRating!.clamp(1, 5),
                            (_) => const Icon(
                              Icons.star_rounded,
                              size: 22,
                              color: Color(0xFFFFD700),
                            ),
                          ),
                        ),
                      ),
                    if (profile.matchScore != null)
                      _MatchPill(score: profile.matchScore!),
                  ],
                ),
                if (auth.isAdmin) ...[
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Admin — request slots',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'How many unanswered contact requests this member can send at once. Default is 3.',
                          style: TextStyle(color: AppColors.textMuted, height: 1.4),
                        ),
                        const SizedBox(height: 12),
                        DropdownButton<int>(
                          isExpanded: true,
                          value: _requestSlotOptions.contains(_requestLimit)
                              ? _requestLimit
                              : 3,
                          items: [
                            for (final n in _requestSlotOptions)
                              DropdownMenuItem(
                                value: n,
                                child: Text(n == 3 ? '$n (default)' : '$n'),
                              ),
                          ],
                          onChanged: _savingLimit
                              ? null
                              : (v) {
                                  if (v != null) setState(() => _requestLimit = v);
                                },
                        ),
                        const SizedBox(height: 12),
                        PrimaryButton(
                          label: _savingLimit ? 'Saving...' : 'Save slots',
                          icon: Icons.save_outlined,
                          expanded: true,
                          onPressed: _saveRequestLimit,
                        ),
                      ],
                    ),
                  ),
                ],
                if (profile.matchReasons != null && profile.matchReasons!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.blush,
                          AppColors.primaryLight.withValues(alpha: 0.06),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                gradient: AppColors.weddingGradient,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.auto_awesome, size: 16, color: Colors.white),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Why this match',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                color: AppColors.text,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ...profile.matchReasons!.map((reason) => Padding(
                              padding: const EdgeInsets.only(bottom: 3),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('•  ', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                                  Expanded(
                                    child: Text(
                                      reason,
                                      style: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.85), fontSize: 13, height: 1.35),
                                    ),
                                  ),
                                ],
                              ),
                            )),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                _SectionCard(
                  title: 'Personal Info',
                  child: _InfoList(
                    rows: [
                      _InfoRow('Age', profile.age != null ? '${profile.age} years' : null),
                      _InfoRow('Height', _formatHeightCm(profile.heightCm)),
                      _InfoRow('Weight', profile.weightKg != null ? '${profile.weightKg} kg' : null),
                      _InfoRow('Marital Status', _maritalLabel(profile.maritalStatus)),
                      _InfoRow('Color', profile.color),
                      _InfoRow('Disability', profile.disability),
                      _InfoRow('Caste', profile.caste),
                      _InfoRow('Religion', profile.religion),
                      _InfoRow('Sect', profile.sect),
                      _InfoRow('Languages', profile.languages),
                      _InfoRow(
                        profile.guardianType ?? 'Guardian',
                        profile.guardianName,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _SectionCard(
                  title: 'Education & Career',
                  child: _InfoList(
                    rows: [
                      _InfoRow('Education', profile.education),
                      _InfoRow('Hafiz-e-Quran', profile.hafizQuran),
                      _InfoRow('Profession', profile.profession),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _SectionCard(
                  title: 'Location',
                  child: _InfoList(
                    rows: [
                      _InfoRow('City', profile.city),
                      _InfoRow(
                        profile.province == 'Overseas' ? 'Country' : 'Province',
                        profile.province == 'Overseas'
                            ? profile.country
                            : profile.province,
                      ),
                      _InfoRow('Own House (Pakistan)', profile.houseOwnLocation),
                      _InfoRow('Rented House (Pakistan)', profile.houseRentLocation),
                      if (_isNotEmpty(profile.abroadCountry)) ...[
                        _InfoRow('Abroad Country', profile.abroadCountry),
                        _InfoRow('Own House (Abroad)', profile.abroadHouseOwnLocation),
                        _InfoRow('Rented House (Abroad)', profile.abroadHouseRentLocation),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (_isNotEmpty(profile.aboutMe)) ...[
                  _SectionCard(
                    title: 'About Us',
                    child: Text(
                      profile.aboutMe!,
                      style: const TextStyle(height: 1.6, color: AppColors.textMuted),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                if (prefs != null && prefs.hasAny) ...[
                  _SectionCard(
                    title: 'Partner Requirements',
                    child: _InfoList(rows: _prefsRows(prefs)),
                  ),
                  const SizedBox(height: 16),
                ],
                if (familyDetailsDisplay(profile.familyDetails).isNotEmpty) ...[
                  _SectionCard(
                    title: 'Family Details',
                    child: _FamilyDetailsView(raw: profile.familyDetails),
                  ),
                  const SizedBox(height: 16),
                ],
                const SizedBox(height: 24),
                if (!auth.isAdmin) ...[
                  if (!auth.isLoggedIn)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.blush,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Text(
                        'Login or register to request this profile\'s contact / interest.',
                        style: TextStyle(color: AppColors.textMuted, height: 1.4),
                      ),
                    ),
                  _sending
                      ? const Center(child: CircularProgressIndicator())
                      : PrimaryButton(
                          label: interestLabel,
                          icon: Icons.phone_in_talk_rounded,
                          expanded: true,
                          onPressed: _sendInterest,
                        ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  bool _isNotEmpty(String? value) => value != null && value.trim().isNotEmpty;

  List<_InfoRow> _prefsRows(PartnerPreferences prefs) {
    return [
      if (prefs.minAge != null || prefs.maxAge != null)
        _InfoRow(
          'Age Range',
          '${prefs.minAge ?? '?'} – ${prefs.maxAge ?? '?'} years',
        ),
      if (prefs.minHeightCm != null || prefs.maxHeightCm != null)
        _InfoRow(
          'Height',
          prefs.minHeightCm != null && prefs.maxHeightCm != null
              ? '${_formatHeightCm(prefs.minHeightCm)} – ${_formatHeightCm(prefs.maxHeightCm)}'
              : prefs.minHeightCm != null
                  ? 'Min ${_formatHeightCm(prefs.minHeightCm)}'
                  : 'Max ${_formatHeightCm(prefs.maxHeightCm)}',
        ),
      _InfoRow('Religion', prefs.religion),
      _InfoRow('Sect', prefs.sect),
      _InfoRow('Caste', _formatMulti(prefs.caste)),
      _InfoRow('State', _formatMulti(prefs.province)),
      _InfoRow('Country', _formatMulti(prefs.country)),
      _InfoRow('City', _formatMulti(prefs.city)),
      _InfoRow('Education', _formatMulti(prefs.education)),
      _InfoRow('Profession', _formatMulti(prefs.profession)),
      _InfoRow('Marital Status', _maritalLabel(prefs.maritalStatus)),
      if (_isNotEmpty(prefs.requirementsNotes))
        _InfoRow('Notes', prefs.requirementsNotes),
    ];
  }

  String _maritalLabel(String? value) {
    if (value == null || value.isEmpty) return '';
    switch (value) {
      case 'never_married':
        return 'Single';
      case 'divorced':
        return 'Divorced';
      case 'widowed':
        return 'Widowed';
      case 'separated':
        return 'Separated';
      default:
        return value;
    }
  }

  String _formatHeightCm(int? cm) {
    if (cm == null || cm <= 0) return '';
    final totalInches = (cm / 2.54).round();
    final feet = totalInches ~/ 12;
    final inches = totalInches % 12;
    return '$feet\'$inches"';
  }

  String _formatMulti(String? value) {
    if (value == null || value.trim().isEmpty) return '';
    return value
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final profile = _profile;
    return Scaffold(
      body: ListenableBuilder(
        listenable: AuthController.instance,
        builder: (context, _) {
          if (_loading && profile == null) {
            return const Center(child: CircularProgressIndicator());
          }
          if (_error != null && profile == null) {
            return _ErrorView(message: _error!, onRetry: _load);
          }
          if (!AuthController.instance.canViewProfiles) {
            return _lockedView(profile);
          }
          return _detailView(profile!);
        },
      ),
    );
  }
}

class _BlurPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        for (var i = 0; i < 4; i++)
          Container(
            height: 88,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const SizedBox(width: 12),
                CircleAvatar(radius: 28, backgroundColor: AppColors.blush),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(height: 12, width: 140, color: AppColors.border),
                      const SizedBox(height: 8),
                      Container(height: 10, width: 100, color: AppColors.border),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.blush,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}

class _MatchPill extends StatelessWidget {
  const _MatchPill({required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: AppColors.weddingGradient,
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.favorite_rounded, size: 16, color: AppColors.goldLight),
          const SizedBox(width: 6),
          Text(
            '$score% match',
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 16,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 36,
            height: 3,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(99),
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.gold],
              ),
            ),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _InfoList extends StatelessWidget {
  const _InfoList({required this.rows});

  final List<_InfoRow> rows;

  @override
  Widget build(BuildContext context) {
    final visible = rows.where((r) => r.hasValue).toList();
    if (visible.isEmpty) {
      return const Text(
        'No information provided.',
        style: TextStyle(color: AppColors.textMuted),
      );
    }
    return Column(
      children: [
        for (var i = 0; i < visible.length; i++) ...[
          visible[i],
          if (i != visible.length - 1) const Divider(height: 18),
        ],
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String? value;

  bool get hasValue => value != null && value!.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 130,
          child: Text(
            label,
            style: const TextStyle(color: AppColors.textMuted, height: 1.4),
          ),
        ),
        Expanded(
          child: Text(
            value!,
            style: const TextStyle(fontWeight: FontWeight.w600, height: 1.4),
          ),
        ),
      ],
    );
  }
}

class _FamilyDetailsView extends StatelessWidget {
  const _FamilyDetailsView({required this.raw});

  final String? raw;

  @override
  Widget build(BuildContext context) {
    final display = familyDetailsDisplay(raw);
    if (display.isEmpty) return const SizedBox.shrink();
    if (!isStructuredFamilyDetails(raw)) {
      return Text(display, style: const TextStyle(height: 1.6, color: AppColors.textMuted));
    }

    final data = parseFamilyDetails(raw);
    final brothers = data.counts(data.brothers);
    final sisters = data.counts(data.sisters);

    Widget parentCard(String title, FamilyParent parent) {
      final detail = [
        if (aliveLabel(parent.alive).isNotEmpty) aliveLabel(parent.alive),
        if (parent.profession.trim().isNotEmpty) parent.profession.trim(),
      ].join(' · ');
      return Expanded(
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.ivory, Colors.white],
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primary)),
              const SizedBox(height: 4),
              Text(
                parent.name.trim().isEmpty ? 'Name not added' : parent.name.trim(),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 2),
              Text(
                detail.isEmpty ? 'Details not added' : detail,
                style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      );
    }

    Widget sibLine(String kind, FamilySibling row, int index) {
      final parts = [
        siblingOrderLabel(row.order),
        marriedLabel(row.married),
        row.profession.trim(),
      ].where((e) => e.isNotEmpty).join(' · ');
      return Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 88,
              child: Text('$kind ${index + 1}', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
            ),
            Expanded(
              child: Text(
                parts.isEmpty ? 'Details not added' : parts,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            parentCard('Father', data.father),
            const SizedBox(width: 8),
            parentCard('Mother', data.mother),
          ],
        ),
        if (brothers.total > 0) ...[
          const SizedBox(height: 12),
          _familyChip('Brothers: ${brothers.total} total · ${brothers.married} married'),
          for (var i = 0; i < data.brothers.length; i++) sibLine('Brother', data.brothers[i], i),
        ],
        if (sisters.total > 0) ...[
          const SizedBox(height: 12),
          _familyChip('Sisters: ${sisters.total} total · ${sisters.married} married'),
          for (var i = 0; i < data.sisters.length; i++) sibLine('Sister', data.sisters[i], i),
        ],
      ],
    );
  }

  Widget _familyChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.blush,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

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
            const Icon(Icons.error_outline, size: 48, color: AppColors.primary),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            PrimaryButton(label: 'Retry', onPressed: onRetry),
          ],
        ),
      ),
    );
  }
}
