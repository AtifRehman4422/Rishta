import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  template: `
    <section class="page-hero bg-page-header">
      <div class="container hero-inner animate-fade-in-up">
        <h1>Privacy Policy</h1>
        <p class="text-urdu">رازداری کی پالیسی</p>
        <p class="hero-sub">Last updated: June 1, 2026</p>
      </div>
    </section>

    <div class="container page-body">
      <div class="legal-content card animate-fade-in-up delay-1">
        <p class="intro">
          Hum Rishta ("we", "our", "us") operates the website humrishta.com and is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our matrimonial platform.
        </p>

        @for (section of sections; track section.title) {
          <section class="legal-section">
            <h2>{{ section.title }}</h2>
            @for (para of section.paragraphs; track $index) {
              <p>{{ para }}</p>
            }
            @if (section.list) {
              <ul>
                @for (item of section.list; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            }
          </section>
        }

        <section class="legal-section contact-section">
          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy, contact us at:</p>
          <p><strong>Email:</strong> humrishta@gmail.com</p>
          <p><strong>Website:</strong> <a routerLink="/contact">Contact Page</a></p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page-hero { padding: 3rem 0; text-align: center; }
    .page-hero h1 { font-family: var(--font-display); font-size: clamp(1.75rem, 4vw, 2.5rem); color: white; }
    .hero-sub { color: rgba(255,255,255,0.8); margin-top: 0.75rem; font-size: 0.9rem; }
    .page-body { padding: 2.5rem 0 4rem; max-width: 800px; margin: 0 auto; }
    .legal-content { padding: 2rem 2.25rem; }
    .intro { font-size: 1.05rem; line-height: 1.8; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .legal-section { margin-bottom: 2rem; }
    .legal-section h2 { font-family: var(--font-display); font-size: 1.2rem; color: var(--primary-dark); margin-bottom: 0.75rem; }
    .legal-section p { line-height: 1.8; color: var(--text); margin-bottom: 0.75rem; }
    .legal-section ul { padding-left: 1.25rem; line-height: 1.8; color: var(--text); margin-bottom: 0.75rem; }
    .legal-section li { margin-bottom: 0.5rem; }
    .contact-section { padding-top: 1rem; border-top: 1px solid var(--border); }
    @media (max-width: 576px) { .legal-content { padding: 1.5rem; } }
  `],
})
export class PrivacyComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly sections = [
    {
      title: '1. Information We Collect',
      paragraphs: [
        'We collect information you provide when registering, creating a profile, submitting contact requests, filing complaints, or contacting us.',
      ],
      list: [
        'Account information: email address, password (stored encrypted), phone number',
        'Profile information: name, gender, date of birth, city, education, profession, photos, family details, partner preferences',
        'Contact details: phone and WhatsApp numbers (shared only after admin approval)',
        'Communications: messages sent through contact requests and complaint system',
        'Technical data: IP address, browser type, device information, and cookies',
      ],
    },
    {
      title: '2. How We Use Your Information',
      paragraphs: ['We use collected information to operate and improve Hum Rishta:'],
      list: [
        'Create and manage your matrimonial profile',
        'Process contact requests and admin verification',
        'Facilitate communication between verified users',
        'Respond to complaints and maintain platform safety',
        'Send service-related notifications',
        'Analyze usage to improve our services',
        'Display relevant advertisements (see Advertising section)',
        'Comply with legal obligations',
      ],
    },
    {
      title: '3. Information Sharing',
      paragraphs: [
        'We do not sell your personal information. We share information only in these circumstances:',
      ],
      list: [
        'With other users when you request contact and admin approves the request',
        'With administrators for verification, safety, and complaint resolution',
        'With service providers who assist in hosting and operating the platform (under confidentiality agreements)',
        'When required by law or to protect rights and safety',
      ],
    },
    {
      title: '4. Cookies and Tracking',
      paragraphs: [
        'We use cookies and similar technologies to remember your login session, preferences, and analyze site traffic. Third-party services including Google AdSense may use cookies to serve personalized advertisements.',
        'You can control cookies through your browser settings. Disabling cookies may affect some platform features.',
      ],
    },
    {
      title: '5. Advertising (Google AdSense)',
      paragraphs: [
        'We may display advertisements through Google AdSense. Google and its partners may use cookies to serve ads based on your visits to this and other websites. You may opt out of personalized advertising by visiting Google Ads Settings.',
        'For more information, see Google\'s Privacy Policy at policies.google.com/privacy.',
      ],
    },
    {
      title: '6. Data Security',
      paragraphs: [
        'We implement industry-standard security measures including encrypted passwords, HTTPS in production, rate limiting, and admin-only access to sensitive data. However, no method of transmission over the internet is 100% secure.',
      ],
    },
    {
      title: '7. Data Retention',
      paragraphs: [
        'We retain your account and profile data while your account is active. You may request account deletion by contacting us. Some data may be retained for legal compliance or dispute resolution.',
      ],
    },
    {
      title: '8. Your Rights',
      paragraphs: ['You have the right to:'],
      list: [
        'Access and update your profile information',
        'Request deletion of your account',
        'Withdraw consent for optional data processing',
        'File a complaint with relevant data protection authorities',
      ],
    },
    {
      title: '9. Children',
      paragraphs: [
        'Hum Rishta is intended for adults seeking marriage (18 years and older). We do not knowingly collect information from children under 18.',
      ],
    },
    {
      title: '10. Changes to This Policy',
      paragraphs: [
        'We may update this Privacy Policy periodically. Changes will be posted on this page with an updated date. Continued use of the platform after changes constitutes acceptance.',
      ],
    },
  ];

  ngOnInit(): void {
    this.seo.apply({
      title: 'Privacy Policy',
      description:
        'Hum Rishta Privacy Policy — how we collect, use, and protect your personal information on our rishta and matrimonial website.',
      path: '/privacy',
    });
  }
}
