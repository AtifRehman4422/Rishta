import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/urdu_text.dart';
import '../../data/content/blog_posts.dart';
import '../../data/content/info_content.dart';

export 'notifications_screen.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _InfoScaffold(
      title: 'About PK Rishta',
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
                  'PK Rishta was created to make the search for a life partner simple, safe, and aligned with Islamic values. We connect Pakistani families — at home and overseas — through verified profiles and respectful community standards.',
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
                Text('How PK Rishta Works', style: Theme.of(context).textTheme.titleLarge),
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
                  'PK Rishta is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.',
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
                const Text('Questions? Email info@pkrishta.com', style: TextStyle(fontWeight: FontWeight.w600)),
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
            icon: '📧',
            title: 'Email',
            value: 'info@pkrishta.com',
            onTap: () => _launch('mailto:info@pkrishta.com'),
          ),
          const SizedBox(height: 10),
          _ContactInfoTile(
            icon: '💬',
            title: 'WhatsApp',
            value: 'Chat with support',
            onTap: () => _launch('https://wa.me/923001234567'),
          ),
          const SizedBox(height: 10),
          _ContactInfoTile(
            icon: '🌐',
            title: 'Website',
            value: 'pkrishta.com',
            onTap: () => _launch('https://pkrishta.com'),
          ),
          const SizedBox(height: 18),
          _Card(
            child: _sent
                ? Column(
                    children: [
                      const Text('✓', style: TextStyle(fontSize: 40, color: Color(0xFF15803D))),
                      const SizedBox(height: 8),
                      Text('Message Sent!', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 6),
                      const Text(
                        'شکریہ! We received your message and will respond within 24 hours.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textMuted, height: 1.5),
                      ),
                      const SizedBox(height: 14),
                      PrimaryButton(
                        label: 'Send Another',
                        style: PrimaryButtonStyle.outline,
                        onPressed: () => setState(() {
                          _sent = false;
                          _message.clear();
                        }),
                      ),
                    ],
                  )
                : Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Send Us a Message', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 6),
                        const Text('Our team usually replies within 24 hours.', style: TextStyle(color: AppColors.textMuted)),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C))),
                        ],
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _name,
                          decoration: const InputDecoration(labelText: 'Your Name'),
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'Email'),
                          validator: (v) => v == null || !v.contains('@') ? 'Enter valid email' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(labelText: 'Phone (optional)'),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: _subject,
                          decoration: const InputDecoration(labelText: 'Subject'),
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
                          decoration: const InputDecoration(labelText: 'Message', alignLabelWithHint: true),
                          validator: (v) => v == null || v.trim().length < 10 ? 'Write at least 10 characters' : null,
                        ),
                        const SizedBox(height: 16),
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
                  ),
          ),
        ],
      ),
    );
  }
}

class _ContactInfoTile extends StatelessWidget {
  const _ContactInfoTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.onTap,
  });

  final String icon;
  final String title;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 26)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(value, style: const TextStyle(color: AppColors.textMuted)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
            ],
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
