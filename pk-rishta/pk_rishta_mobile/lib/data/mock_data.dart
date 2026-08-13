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
  ('🕌', 'Islamic Values', 'Har rishta halal tareeqay se — deen aur family values pe focus'),
  ('🔒', 'Privacy First', 'Aapki photos aur details sirf registered members ko dikhti hain'),
  ('✅', 'Verified Families', 'Admin team har profile ko verify karti hai — fake accounts nahi'),
  ('🏙️', 'All Pakistan', 'Karachi se Gilgit tak — har shehar aur province se rishtay'),
  ('👨‍👩‍👧', 'Family Friendly', 'Waldain bhi profile dekh sakte hain — pura khandan shamil ho'),
  ('💍', 'Serious Intentions', 'Sirf shadi ke liye — casual dating bilkul nahi'),
];

const howItWorksSteps = [
  HowItWorksStep(
    icon: '📝',
    title: 'Profile Banayein',
    urdu: 'پروفائل بنائیں',
    description: 'Free register karein aur apni details bharein',
  ),
  HowItWorksStep(
    icon: '🔍',
    title: 'Rishta Dhundhein',
    urdu: 'رشتہ تلاش کریں',
    description: 'City, education, profession se filter karein',
  ),
  HowItWorksStep(
    icon: '💌',
    title: 'Interest Bhejein',
    urdu: 'دلچسپی بھیجیں',
    description: 'Pasand ki profile par interest bhejein',
  ),
  HowItWorksStep(
    icon: '💍',
    title: 'Nikah Tak',
    urdu: 'نکاح تک',
    description: 'Family se rabta karein aur apna safar shuru karein',
  ),
];

const testimonials = [
  Testimonial(
    name: 'Sara & Ali',
    city: 'Lahore',
    year: '2025',
    text:
        'PK Rishta se humara rishta mila. Platform bohat professional hai aur families ko respect deta hai. Shukriya!',
  ),
  Testimonial(
    name: 'Hina Malik',
    city: 'Karachi',
    year: '2025',
    text:
        'Meri beti ka perfect match yahan mila. Verified profiles aur achi privacy — dil se recommend karti hoon.',
  ),
  Testimonial(
    name: 'Usman Sheikh',
    city: 'Islamabad',
    year: '2024',
    text:
        'Maine 2 mahine mein apna rishta dhund liya. Filters bohat helpful hain aur process bohat aasaan tha.',
  ),
];
