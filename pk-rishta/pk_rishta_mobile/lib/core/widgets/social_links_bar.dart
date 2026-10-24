import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_colors.dart';

class SocialLink {
  const SocialLink({
    required this.label,
    required this.url,
    required this.icon,
    required this.colors,
  });

  final String label;
  final String url;
  final IconData icon;
  final List<Color> colors;
}

const kSocialLinks = <SocialLink>[
  SocialLink(
    label: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61594200343415',
    icon: Icons.facebook_rounded,
    colors: [Color(0xFF1877F2), Color(0xFF0D65D9)],
  ),
  SocialLink(
    label: 'Instagram',
    url: 'https://www.instagram.com/humrishta/',
    icon: Icons.camera_alt_rounded,
    colors: [Color(0xFFF58529), Color(0xFFDD2A7B), Color(0xFF8134AF)],
  ),
  SocialLink(
    label: 'YouTube',
    url: 'https://www.youtube.com/channel/UCd-U5ZomvR-wVfONVux_sMg',
    icon: Icons.play_arrow_rounded,
    colors: [Color(0xFFFF0000), Color(0xFFCC0000)],
  ),
  SocialLink(
    label: 'WhatsApp Chat',
    url: 'https://wa.me/923435020077',
    icon: Icons.chat_rounded,
    colors: [Color(0xFF25D366), Color(0xFF128C7E)],
  ),
  SocialLink(
    label: 'WhatsApp Channel',
    url: 'https://whatsapp.com/channel/0029VbELMHi4SpkEkfsXeZ3g',
    icon: Icons.campaign_rounded,
    colors: [Color(0xFF00A884), Color(0xFF075E54)],
  ),
];

/// Animated brand social icons — tap opens the link externally.
class SocialLinksBar extends StatelessWidget {
  const SocialLinksBar({
    super.key,
    this.title = 'Follow Hum Rishta',
    this.subtitle = 'Facebook · Instagram · YouTube · WhatsApp',
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final bool compact;

  Future<void> _open(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open $url')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = compact ? 46.0 : 54.0;
    final iconSize = compact ? 22.0 : 26.0;

    return Column(
      children: [
        if (!compact) ...[
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.text,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
        ],
        Wrap(
          alignment: WrapAlignment.center,
          spacing: compact ? 12 : 14,
          runSpacing: compact ? 12 : 14,
          children: [
            for (var i = 0; i < kSocialLinks.length; i++)
              _SocialIconButton(
                link: kSocialLinks[i],
                size: size,
                iconSize: iconSize,
                onTap: () => _open(context, kSocialLinks[i].url),
              )
                  .animate(delay: (80 * i).ms)
                  .fadeIn(duration: 400.ms)
                  .scale(
                    begin: const Offset(0.6, 0.6),
                    end: const Offset(1, 1),
                    duration: 500.ms,
                    curve: Curves.elasticOut,
                  )
                  .then()
                  .shimmer(
                    delay: (1200 + i * 200).ms,
                    duration: 1400.ms,
                    color: Colors.white.withValues(alpha: 0.35),
                  ),
          ],
        ),
      ],
    );
  }
}

class _SocialIconButton extends StatefulWidget {
  const _SocialIconButton({
    required this.link,
    required this.size,
    required this.iconSize,
    required this.onTap,
  });

  final SocialLink link;
  final double size;
  final double iconSize;
  final VoidCallback onTap;

  @override
  State<_SocialIconButton> createState() => _SocialIconButtonState();
}

class _SocialIconButtonState extends State<_SocialIconButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: widget.link.label,
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _pressed ? 0.88 : 1,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: widget.link.colors,
              ),
              boxShadow: [
                BoxShadow(
                  color: widget.link.colors.first.withValues(alpha: 0.4),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Icon(
              widget.link.icon,
              color: Colors.white,
              size: widget.iconSize,
            ),
          ),
        ),
      ),
    );
  }
}
