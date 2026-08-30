class HowItWorksStep {
  const HowItWorksStep({
    required this.icon,
    required this.title,
    required this.urdu,
    required this.description,
  });

  final String icon;
  final String title;
  final String urdu;
  final String description;
}

class Testimonial {
  const Testimonial({
    required this.name,
    required this.city,
    required this.year,
    required this.text,
  });

  final String name;
  final String city;
  final String year;
  final String text;
}

const trustBadges = [
  '✓ 100% Halal',
  '🔒 Privacy Protected',
  '✅ Verified Profiles',
  '🆓 Free Registration',
];

const whyUsItems = [
  ('🕌', 'Islamic Values', 'Every match follows a halal process — faith and family values come first'),
  ('🔒', 'Privacy First', 'Your photos and details are visible only to registered members'),
  ('✅', 'Verified Families', 'Our admin team verifies every profile — no fake accounts'),
  ('🏙️', 'All Pakistan', 'From Karachi to Gilgit — matches from every city and province'),
  ('👨‍👩‍👧', 'Family Friendly', 'Parents can view profiles too — the whole family is included'),
  ('💍', 'Serious Intentions', 'For marriage only — no casual dating'),
];

const howItWorksSteps = [
  HowItWorksStep(
    icon: '📝',
    title: 'Create Profile',
    urdu: 'پروفائل بنائیں',
    description: 'Register for free and fill in your details',
  ),
  HowItWorksStep(
    icon: '🔍',
    title: 'Find a Match',
    urdu: 'رشتہ تلاش کریں',
    description: 'Filter by city, education, and profession',
  ),
  HowItWorksStep(
    icon: '💌',
    title: 'Send Request',
    urdu: 'درخواست بھیجیں',
    description: 'Send a contact request on a profile you like',
  ),
  HowItWorksStep(
    icon: '💍',
    title: 'Until Nikah',
    urdu: 'نکاح تک',
    description: 'Connect with the family and begin your journey',
  ),
];

const testimonials = [
  Testimonial(
    name: 'Sara & Ali',
    city: 'Lahore',
    year: '2025',
    text:
        'We found our match on PK Rishta. The platform is very professional and treats families with respect. Thank you!',
  ),
  Testimonial(
    name: 'Hina Malik',
    city: 'Karachi',
    year: '2025',
    text:
        'My daughter found her perfect match here. Verified profiles and strong privacy — I recommend it from the heart.',
  ),
  Testimonial(
    name: 'Usman Sheikh',
    city: 'Islamabad',
    year: '2024',
    text:
        'I found my match in 2 months. The filters are very helpful and the process was easy.',
  ),
];
