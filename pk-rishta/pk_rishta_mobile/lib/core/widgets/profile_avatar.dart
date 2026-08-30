import 'package:flutter/material.dart';

import '../config/api_config.dart';
import '../theme/app_colors.dart';

class ProfileAvatar extends StatelessWidget {
  const ProfileAvatar({
    super.key,
    this.photoUrl,
    this.gender = '',
    this.firstName = '',
    this.lastName = '',
    this.size = 96,
    this.borderWidth = 3,
    this.showVerified = false,
    this.verified = false,
  });

  /// Full URL or server-relative path (e.g. `/uploads/profiles/x.jpg`).
  final String? photoUrl;
  final String gender;
  final String firstName;
  final String lastName;
  final double size;
  final double borderWidth;
  final bool showVerified;
  final bool verified;

  String get _initials {
    final f = firstName.trim();
    final l = lastName.trim();
    if (f.isEmpty && l.isEmpty) return '';
    if (l.isEmpty || l == '-') return f.substring(0, 1).toUpperCase();
    return (f.isNotEmpty ? f.substring(0, 1) : '').toUpperCase();
  }

  Color get _borderColor {
    if (verified) return const Color(0xFF15803D);
    if (gender == 'male') return const Color(0xFF8EB4E0);
    if (gender == 'female') return const Color(0xFFE8A0BF);
    return AppColors.goldShine;
  }

  Widget _placeholder() {
    final initials = _initials;
    if (initials.isEmpty) {
      return const Icon(Icons.person_rounded, color: Colors.white);
    }
    return Text(
      initials,
      style: TextStyle(
        color: Colors.white,
        fontSize: size * 0.4,
        fontWeight: FontWeight.w800,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final url = photoUrl == null || photoUrl!.isEmpty ? '' : photoUrl!.trim();
    final resolved = url.isEmpty ? '' : ApiConfig.resolveUrl(url);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.weddingGradient,
            border: Border.all(color: _borderColor, width: borderWidth),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: resolved.isEmpty
              ? _placeholder()
              : Image.network(
                  resolved,
                  fit: BoxFit.cover,
                  width: size,
                  height: size,
                  errorBuilder: (context, error, stack) => _placeholder(),
                ),
        ),
        if (showVerified)
          Positioned(
            right: -2,
            bottom: -2,
            child: Container(
              width: size * 0.3,
              height: size * 0.3,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: verified ? const Color(0xFF15803D) : AppColors.gold,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: Icon(
                verified ? Icons.verified_rounded : Icons.star_rounded,
                size: size * 0.18,
                color: Colors.white,
              ),
            ),
          ),
      ],
    );
  }
}
