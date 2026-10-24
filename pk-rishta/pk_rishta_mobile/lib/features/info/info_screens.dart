import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validation.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/social_links_bar.dart';
import '../../core/widgets/urdu_text.dart';
import '../../data/content/blog_posts.dart';
import '../../data/content/info_content.dart';

export 'notifications_screen.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _InfoScaffold(
      title: 'About Hum Rishta',
      urdu: 'ہمارے بارے میں',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Our Mission', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                const Text(
                  'Hum Rishta was created to make the search for a life partner simple, safe, and aligned with Islamic values. We connect Pakistani families — at home and overseas — through verified profiles and respectful community standards.',
                  style: TextStyle(height: 1.6, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          for (final v in aboutValues) ...[
            _Card(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.$1, style: const TextStyle(fontSize: 28)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(v.$2, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text(v.$3, style: const TextStyle(color: AppColors.textMuted, height: 1.45)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('How Hum Rishta Works', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                for (var i = 0; i < aboutSteps.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: AppColors.primary,
                          child: Text('${i + 1}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Text(aboutSteps[i], style: const TextStyle(height: 1.45))),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          const _Card(child: SocialLinksBar()),
        ],
      ),
    );
  }
}

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _InfoScaffold(
      title: 'Privacy Policy',
      urdu: 'رازداری کی پالیسی',
      child: Column(
        children: [
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Hum Rishta is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.',
                  style: TextStyle(height: 1.6, color: AppColors.textMuted),
                ),
                const SizedBox(height: 8),
                const Text('Last updated: June 1, 2026', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                for (final section in privacySections) ...[
                  const SizedBox(height: 18),
                  Text(section.title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  for (final p in section.paragraphs)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(p, style: const TextStyle(height: 1.6, color: AppColors.textMuted)),
                    ),
                  if (section.bullets != null)
                    for (final b in section.bullets!)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6, left: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('•  ', style: TextStyle(color: AppColors.primary)),
                            Expanded(child: Text(b, style: const TextStyle(height: 1.5))),
                          ],
                        ),
                      ),
                ],
                const SizedBox(height: 16),
                const Text('Questions? Email humrishta@gmail.com', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _InfoScaffold(
      title: 'Terms of Service',
      urdu: 'شرائط و ضوابط',
      child: _Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final section in termsSections) ...[
              Text(section.title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final p in section.paragraphs)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(p, style: const TextStyle(height: 1.6, color: AppColors.textMuted)),
                ),
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }
}

class BlogScreen extends StatelessWidget {
  const BlogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _InfoScaffold(
      title: 'Blog & Tips',
      urdu: 'بلاگ اور مشورے',
      child: Column(
        children: [
          for (final post in blogPosts) ...[
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => BlogDetailScreen(post: post)),
                  );
                },
                child: Ink(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: post.gradient,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(post.icon, style: const TextStyle(fontSize: 36)),
                      ),
                      const SizedBox(height: 12),
                      Text(post.category, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(post.title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17, height: 1.3)),
                      const SizedBox(height: 6),
                      Text(post.excerpt, style: const TextStyle(color: AppColors.textMuted, height: 1.45)),
                      const SizedBox(height: 8),
                      Text('${post.readMinutes} min read • ${post.publishedAt}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class BlogDetailScreen extends StatelessWidget {
  const BlogDetailScreen({super.key, required this.post});

  final BlogPost post;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(post.category)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(post.title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('${post.author} • ${post.readMinutes} min • ${post.publishedAt}', style: const TextStyle(color: AppColors.textMuted)),
          const SizedBox(height: 18),
          for (final para in post.content) ...[
            Text(para, style: const TextStyle(height: 1.7, fontSize: 15)),
            const SizedBox(height: 14),
          ],
        ],
      ),
    );
  }
}

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _message = TextEditingController();
  String _subject = 'general';
  bool _submitting = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ApiClient.instance.post('/contact', body: {
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        'subject': _subject,
        'message': _message.text.trim(),
      });
      if (!mounted) return;
      setState(() {
        _sent = true;
        _submitting = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _submitting = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Could not send message. Please try again.';
        _submitting = false;
      });
    }
  }

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open $url')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return _InfoScaffold(
      title: 'Contact Support',
      urdu: 'ہم سے رابطہ کریں',
      child: Column(
        children: [
          _ContactInfoTile(
            icon: Icons.mail_rounded,
            iconGradient: AppColors.weddingGradient,
            title: 'Email',
            value: 'humrishta@gmail.com',
            hint: 'We reply within 24 hours',
            onTap: () => _launch('mailto:humrishta@gmail.com'),
            delay: Duration.zero,
          ),
          const SizedBox(height: 12),
          _ContactInfoTile(
            icon: Icons.chat_rounded,
            iconGradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF25D366), Color(0xFF128C7E)],
            ),
            title: 'WhatsApp Chat',
            value: 'Chat with support',
            hint: '+92 343 5020077',
            onTap: () => _launch('https://wa.me/923435020077'),
            delay: 90.ms,
          ),
          const SizedBox(height: 12),
          _ContactInfoTile(
            icon: Icons.campaign_rounded,
            iconGradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF00A884), Color(0xFF075E54)],
            ),
            title: 'WhatsApp Channel',
            value: 'Follow HumRishta',
            hint: 'Updates · rishtay · announcements',
            onTap: () => _launch('https://whatsapp.com/channel/0029VbELMHi4SpkEkfsXeZ3g'),
            delay: 140.ms,
          ),
          const SizedBox(height: 12),
          _ContactInfoTile(
            icon: Icons.language_rounded,
            iconGradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.primaryLight, AppColors.gold],
            ),
            title: 'Website',
            value: 'humrishta.com',
            hint: 'Visit our website',
            onTap: () => _launch('https://humrishta.com'),
            delay: 180.ms,
          ),
          const SizedBox(height: 18),
          const _Card(child: SocialLinksBar())
              .animate()
              .fadeIn(delay: 220.ms, duration: 450.ms)
              .slideY(begin: 0.08, end: 0, delay: 220.ms, duration: 450.ms),
          const SizedBox(height: 22),
          AnimatedSection(
            index: 0,
            child: _Card(
              child: _sent ? _buildSentView(context) : _buildForm(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSentView(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(
            color: const Color(0xFF15803D).withValues(alpha: 0.08),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF15803D), width: 2),
          ),
          child: const Icon(
            Icons.check_rounded,
            color: Color(0xFF15803D),
            size: 46,
          ),
        ).animate().scale(
          begin: const Offset(0.4, 0.4),
          end: const Offset(1, 1),
          duration: 550.ms,
          curve: Curves.elasticOut,
        ),
        const SizedBox(height: 16),
        Text('Message Sent!', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 6),
        const Text(
          'شکریہ! We received your message and will respond within 24 hours.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textMuted, height: 1.5),
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          label: 'Send Another',
          icon: Icons.edit_outlined,
          style: PrimaryButtonStyle.outline,
          onPressed: () => setState(() {
            _sent = false;
            _message.clear();
          }),
        ),
      ],
    );
  }

  Widget _buildForm(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Send Us a Message', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          const Text(
            'Our team usually replies within 24 hours.',
            style: TextStyle(color: AppColors.textMuted),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFB91C1C).withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFB91C1C).withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: Color(0xFFB91C1C), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Color(0xFFB91C1C)),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          TextFormField(
            controller: _name,
            decoration: const InputDecoration(
              labelText: 'Your Name',
              prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.primary),
            ),
            validator: (v) => validateName(v, 'Name'),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.mail_outline_rounded, color: AppColors.primary),
            ),
            validator: (v) => validateEmail(v),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Phone (optional)',
              prefixIcon: Icon(Icons.phone_outlined, color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _subject,
            decoration: const InputDecoration(
              labelText: 'Subject',
              prefixIcon: Icon(Icons.subject_rounded, color: AppColors.primary),
            ),
            items: const [
              DropdownMenuItem(value: 'general', child: Text('General Inquiry')),
              DropdownMenuItem(value: 'registration', child: Text('Registration Help')),
              DropdownMenuItem(value: 'contact-request', child: Text('Contact Request')),
              DropdownMenuItem(value: 'complaint', child: Text('Complaint')),
              DropdownMenuItem(value: 'partnership', child: Text('Partnership')),
            ],
            onChanged: (v) => setState(() => _subject = v ?? _subject),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _message,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Message',
              alignLabelWithHint: true,
              prefixIcon: Padding(
                padding: EdgeInsets.only(bottom: 60),
                child: Icon(Icons.chat_bubble_outline_rounded, color: AppColors.primary),
              ),
            ),
            validator: (v) => validateMinLength(v, 10, 'Message'),
          ),
          const SizedBox(height: 18),
          _submitting
              ? const Center(child: CircularProgressIndicator())
              : PrimaryButton(
                  label: 'Send Message',
                  icon: Icons.send_rounded,
                  expanded: true,
                  onPressed: _submit,
                ),
        ],
      ),
    );
  }
}

class _ContactInfoTile extends StatelessWidget {
  const _ContactInfoTile({
    required this.icon,
    required this.iconGradient,
    required this.title,
    required this.value,
    required this.onTap,
    this.hint,
    this.delay = Duration.zero,
  });

  final IconData icon;
  final Gradient iconGradient;
  final String title;
  final String value;
  final String? hint;
  final VoidCallback onTap;
  final Duration delay;

  @override
  Widget build(BuildContext context) {
    return FadeSlide(
      delay: delay,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Ink(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.05),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: iconGradient,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.22),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        value,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (hint != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          hint!,
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  width: 34,
                  height: 34,
                  decoration: const BoxDecoration(
                    color: AppColors.blush,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_forward_rounded,
                    color: AppColors.primary,
                    size: 18,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoScaffold extends StatelessWidget {
  const _InfoScaffold({
    required this.title,
    required this.urdu,
    required this.child,
  });

  final String title;
  final String urdu;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            systemOverlayStyle: SystemUiOverlayStyle.light,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(title, style: const TextStyle(fontSize: 16)),
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.weddingGradient),
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 48),
                alignment: Alignment.bottomLeft,
                child: UrduText(urdu, style: const TextStyle(color: AppColors.goldLight, fontSize: 20)),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverToBoxAdapter(child: child),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

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
      ),
      child: child,
    );
  }
}
