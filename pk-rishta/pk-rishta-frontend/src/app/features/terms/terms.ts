import { Component, OnInit, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  template: `
    <section class="page-hero bg-page-header">
      <div class="container hero-inner animate-fade-in-up">
        <h1>Terms of Service</h1>
        <p class="text-urdu">شرائط و ضوابط</p>
        <p class="hero-sub">Last updated: June 1, 2026</p>
      </div>
    </section>

    <div class="container page-body">
      <div class="legal-content card animate-fade-in-up delay-1">
        <p class="intro">
          By accessing or using Hum Rishta (humrishta.com), you agree to these Terms of Service.
          Please read them carefully. If you do not agree, do not use our platform.
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
          <h2>Contact</h2>
          <p>Questions about these terms? Email humrishta@gmail.com or visit our <a routerLink="/contact">Contact page</a>.</p>
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
    .legal-section ul { padding-left: 1.25rem; line-height: 1.8; color: var(--text); }
    .legal-section li { margin-bottom: 0.5rem; }
    .contact-section { padding-top: 1rem; border-top: 1px solid var(--border); }
    @media (max-width: 576px) { .legal-content { padding: 1.5rem; } }
  `],
})
export class TermsComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly sections = [
    {
      title: '1. Acceptance of Terms',
      paragraphs: [
        'These Terms govern your use of Hum Rishta, a matrimonial platform for individuals seeking halal marriage in accordance with Islamic values and Pakistani cultural norms.',
      ],
    },
    {
      title: '2. Eligibility',
      paragraphs: ['To use Hum Rishta, you must:'],
      list: [
        'Be at least 18 years of age',
        'Be legally eligible for marriage in your jurisdiction',
        'Provide accurate and truthful information',
        'Not be previously banned from the platform',
      ],
    },
    {
      title: '3. User Accounts',
      paragraphs: [
        'You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately of any unauthorized use of your account. One person may maintain only one active account.',
      ],
    },
    {
      title: '4. Profile Content',
      paragraphs: ['You agree that all profile information is accurate and that you will not:'],
      list: [
        'Upload false, misleading, or impersonating profiles',
        'Post inappropriate, offensive, or non-halal content or photos',
        'Share contact information publicly to bypass admin verification',
        'Use the platform for dating, friendship, or non-matrimonial purposes',
        'Harass, threaten, or abuse other users',
      ],
    },
    {
      title: '5. Contact Requests',
      paragraphs: [
        'Contact requests are subject to admin review. Approved contact sharing is temporary and for matrimonial purposes only. Misuse of shared contact information may result in account suspension.',
        'Daily contact request limits apply to prevent spam and protect user privacy.',
      ],
    },
    {
      title: '6. Prohibited Conduct',
      paragraphs: ['Users must not:'],
      list: [
        'Solicit money or financial information from other users',
        'Use automated tools to scrape profiles or data',
        'Attempt to hack, disrupt, or compromise platform security',
        'Post spam, advertisements, or unrelated promotional content',
        'Discriminate based on race, ethnicity, or disability in harmful ways',
      ],
    },
    {
      title: '7. Intellectual Property',
      paragraphs: [
        'All content on Hum Rishta — including logos, design, text, and software — is owned by Hum Rishta or its licensors. You may not copy, reproduce, or distribute platform content without written permission.',
      ],
    },
    {
      title: '8. Disclaimer',
      paragraphs: [
        'Hum Rishta is a platform that facilitates introductions. We do not guarantee marriage, compatibility, or the accuracy of user-provided information. Users and families are responsible for their own due diligence before any commitment.',
        'The platform is provided "as is" without warranties of any kind.',
      ],
    },
    {
      title: '9. Limitation of Liability',
      paragraphs: [
        'Hum Rishta shall not be liable for any indirect, incidental, or consequential damages arising from use of the platform, interactions with other users, or reliance on profile information.',
      ],
    },
    {
      title: '10. Account Termination',
      paragraphs: [
        'We reserve the right to suspend or terminate accounts that violate these Terms, receive valid complaints, or engage in harmful behavior — with or without notice.',
      ],
    },
    {
      title: '11. Changes to Terms',
      paragraphs: [
        'We may modify these Terms at any time. Updated terms will be posted on this page. Continued use after changes constitutes acceptance.',
      ],
    },
    {
      title: '12. Governing Law',
      paragraphs: [
        'These Terms are governed by the laws of Pakistan. Disputes shall be subject to the jurisdiction of courts in Lahore, Pakistan.',
      ],
    },
  ];

  ngOnInit(): void {
    this.title.setTitle('Terms of Service | Hum Rishta');
    this.meta.updateTag({
      name: 'description',
      content: 'Hum Rishta Terms of Service — rules and guidelines for using our halal matrimonial platform.',
    });
  }
}
