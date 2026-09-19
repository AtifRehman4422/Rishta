class InfoSection {
  const InfoSection({
    required this.title,
    required this.paragraphs,
    this.bullets,
  });

  final String title;
  final List<String> paragraphs;
  final List<String>? bullets;
}

const aboutValues = [
  ('🕌', 'Halal & Respectful', 'Every feature is designed for Islamic matrimonial search with family involvement.'),
  ('🛡️', 'Safe & Verified', 'Admin-reviewed contact requests protect your privacy and prevent misuse.'),
  ('💍', 'Family Focused', 'We connect families, not just individuals — honoring Pakistani traditions.'),
];

const aboutSteps = [
  'Register free — Create your account and complete your matrimonial profile.',
  'Search profiles — Filter by city, province, religion, age, and more.',
  'Request contact — Submit a contact request for admin review.',
  'Admin verification — Our team verifies both parties before sharing numbers.',
  'Family meetings — Connect respectfully and move toward nikah with Allah\'s guidance.',
];

const privacySections = [
  InfoSection(
    title: '1. Information We Collect',
    paragraphs: [
      'We collect information you provide when registering, creating a profile, submitting contact requests, filing complaints, or contacting us.',
    ],
    bullets: [
      'Account information: email, password (encrypted), phone number',
      'Profile information: name, gender, DOB, city, education, profession, photos, family details',
      'Contact details shared only after admin approval',
      'Communications and technical data (IP, device, cookies)',
    ],
  ),
  InfoSection(
    title: '2. How We Use Your Information',
    paragraphs: ['We use collected information to operate and improve Hum Rishta:'],
    bullets: [
      'Create and manage your matrimonial profile',
      'Process contact requests and admin verification',
      'Respond to complaints and keep the platform safe',
      'Send service-related notifications',
    ],
  ),
  InfoSection(
    title: '3. Information Sharing',
    paragraphs: [
      'We do not sell your personal information. We share data only with other users after approved contact requests, with admins for safety, or when required by law.',
    ],
  ),
  InfoSection(
    title: '4. Data Security & Your Rights',
    paragraphs: [
      'We use encrypted passwords, HTTPS in production, and access controls. You can update your profile, request account deletion, and contact us at humrishta@gmail.com.',
    ],
  ),
];

const termsSections = [
  InfoSection(
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By using Hum Rishta you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform.',
    ],
  ),
  InfoSection(
    title: '2. Eligibility',
    paragraphs: [
      'You must be at least 18 years old and seeking marriage in good faith. Fake profiles, scams, and misuse are prohibited.',
    ],
  ),
  InfoSection(
    title: '3. User Conduct',
    paragraphs: [
      'Provide accurate information, respect other members and families, and do not harass, spam, or share contact details without approval.',
    ],
  ),
  InfoSection(
    title: '4. Contact Requests',
    paragraphs: [
      'Contact numbers are shared only after request approval. Pending requests may expire. Abuse of the request system can lead to account suspension.',
    ],
  ),
];
