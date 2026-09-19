import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class BlogPost {
  const BlogPost({
    required this.title,
    required this.excerpt,
    required this.category,
    required this.author,
    required this.readMinutes,
    required this.publishedAt,
    required this.icon,
    required this.gradient,
    required this.content,
  });

  final String title;
  final String excerpt;
  final String category;
  final String author;
  final int readMinutes;
  final String publishedAt;
  final String icon;
  final LinearGradient gradient;
  final List<String> content;
}

const blogPosts = [
  BlogPost(
    title: 'How to Find the Right Match in Pakistan — A Complete Guide',
    excerpt:
        'Practical steps for families searching for a halal, compatible marriage partner across Pakistan and overseas.',
    category: 'Match Guide',
    author: 'Hum Rishta Team',
    readMinutes: 8,
    publishedAt: '2026-06-15',
    icon: '💍',
    gradient: AppColors.weddingGradient,
    content: [
      'Finding the right match is one of the most important decisions in life. In Pakistan, this journey is deeply connected to family values, faith, and cultural traditions.',
      'Start by discussing expectations openly with your family. Age range, education, city, sect, and lifestyle preferences should be clear before you begin searching.',
      'A complete matrimonial profile makes a strong first impression. Share accurate details about education, profession, family background, and what you are looking for.',
      'Use filters wisely on Hum Rishta: search by province, city, religion, marital status, and education. Review profiles carefully for values compatibility.',
      'When you find a promising profile, request contact through the platform. Admin verification helps protect both parties.',
      'Remember: patience and prayer are part of the journey. May Allah make your search easy and blessed.',
    ],
  ),
  BlogPost(
    title: '10 Important Questions to Ask Before Marriage',
    excerpt:
        'Essential questions about faith, family, finances, and lifestyle that every couple should discuss before nikah.',
    category: 'Marriage Tips',
    author: 'Hum Rishta Team',
    readMinutes: 7,
    publishedAt: '2026-06-08',
    icon: '💬',
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF4A1942), AppColors.primary, Color(0xFFD4567A)],
    ),
    content: [
      'Before nikah, meaningful conversation prevents misunderstandings later.',
      '1. Religious practice — How do you practice Islam daily?',
      '2. Family involvement — What role will parents and in-laws play?',
      '3. Finances — Who manages expenses, debts, and savings goals?',
      '4. Living arrangements — Independent or joint family?',
      '5. Career and education — Support for work or study after marriage?',
      '6. Children — Timing, parenting values, and expectations.',
      '7. Health and lifestyle — Medical history, diet, travel, social life.',
      '8. Conflict resolution — How do you handle disagreements?',
      '9. Boundaries — Privacy, social media, and friendships.',
      '10. Long-term vision — Where do you see yourselves in 5–10 years?',
    ],
  ),
  BlogPost(
    title: 'Online Matrimonial Safety Tips',
    excerpt:
        'Stay safe while searching for marriage online: verify profiles, protect personal data, and recognize red flags.',
    category: 'Safety',
    author: 'Hum Rishta Team',
    readMinutes: 6,
    publishedAt: '2026-05-28',
    icon: '🛡️',
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF1E3A5F), AppColors.primary, AppColors.primaryLight],
    ),
    content: [
      'Online matchmaking platforms make it easier to connect, but safety must come first.',
      'Never share bank details, CNIC copies, or passwords with strangers.',
      'Keep early conversations on the platform. Meet families in public or with elders present.',
      'Watch for red flags: pressure to move off-platform quickly, money requests, or inconsistent stories.',
      'On Hum Rishta, contact numbers are shared only after verification — use that process.',
    ],
  ),
];
