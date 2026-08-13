import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/profile_access_gate.dart';
import '../../data/models/profile_model.dart';
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
  Profile? _profile;
  bool _loading = true;
  String? _error;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _profile = widget.preview;
    _load();
  }

  Future<void> _load() async {
    try {
      final profile = await _repo.getById(widget.profileId);
      if (!mounted) return;
      setState(() {
        _profile = profile;
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
        const SnackBar(content: Text('Contact request sent!')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _sending = false);
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

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 240,
          pinned: true,
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
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
                  ],
                ),
                const SizedBox(height: 16),
                _DetailRow(label: 'Location', value: profile.location),
                _DetailRow(label: 'Education', value: profile.education),
                _DetailRow(label: 'Profession', value: profile.profession),
                _DetailRow(label: 'Marital status', value: profile.maritalStatus),
                _DetailRow(label: 'Religion', value: profile.religion),
                _DetailRow(label: 'Sect', value: profile.sect),
                if (profile.heightCm != null)
                  _DetailRow(label: 'Height', value: '${profile.heightCm} cm'),
                if (profile.aboutMe != null && profile.aboutMe!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text('About', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(
                    profile.aboutMe!,
                    style: const TextStyle(height: 1.5, color: AppColors.textMuted),
                  ),
                ],
                const SizedBox(height: 24),
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
            ),
          ),
        ),
      ],
    );
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

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    if (value == null || value!.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: AppColors.textMuted)),
          ),
          Expanded(
            child: Text(value!, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
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
