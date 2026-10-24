import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import 'urdu_text.dart';

enum GuidePopupVariant { registerPhone, contactRequest }

class GuideParagraph {
  const GuideParagraph(this.text, {this.strong = false});
  final String text;
  final bool strong;
}

class GuidePopupContent {
  const GuidePopupContent({
    required this.titleEn,
    required this.titleUr,
    required this.bodyEn,
    required this.bodyUr,
    required this.emoji,
  });

  final String titleEn;
  final String titleUr;
  final List<GuideParagraph> bodyEn;
  final List<GuideParagraph> bodyUr;
  final String emoji;

  static GuidePopupContent forVariant(GuidePopupVariant variant) {
    switch (variant) {
      case GuidePopupVariant.contactRequest:
        return const GuidePopupContent(
          emoji: '📌',
          titleEn: 'Important Notice — Rishta Verification & Responsibility',
          titleUr: 'اہم نوٹ — رشتے کی تصدیق اور ذمہ داری',
          bodyEn: [
            GuideParagraph(
              'Before finalizing any matrimonial proposal, families are strongly advised to independently verify the identity, family background, personal details, and accuracy of all information provided by the other party. Parents and guardians should carefully evaluate the proposal and make an informed decision.',
            ),
            GuideParagraph(
              'Hum Rishta serves as a platform to help individuals and families discover suitable matrimonial matches based on their preferences. However, the platform does not guarantee the authenticity of every profile or the accuracy of all information provided. The final decision to proceed with or accept a proposal rests entirely with the individuals and their families.',
              strong: true,
            ),
          ],
          bodyUr: [
            GuideParagraph(
              'کسی بھی رشتے کو حتمی شکل دینے سے پہلے خاندانوں کو چاہیے کہ وہ دوسرے فریق کی شناخت، خاندانی پس منظر، ذاتی کوائف اور فراہم کردہ تمام معلومات کی آزادانہ طور پر مکمل تصدیق کریں۔ والدین اور سرپرستوں کو چاہیے کہ وہ رشتے کا بغور جائزہ لیں اور تمام ضروری پہلوؤں کو مدِنظر رکھتے ہوئے فیصلہ کریں۔',
            ),
            GuideParagraph(
              'Hum Rishta ایک ایسا پلیٹ فارم ہے جو افراد اور خاندانوں کو ان کی ترجیحات کے مطابق مناسب رشتے تلاش کرنے میں مدد فراہم کرتا ہے۔ تاہم، پلیٹ فارم ہر پروفائل کی صداقت یا فراہم کردہ تمام معلومات کی درستگی کی ضمانت نہیں دیتا۔ کسی بھی رشتے کو آگے بڑھانے یا قبول کرنے کا حتمی فیصلہ مکمل طور پر متعلقہ افراد اور ان کے خاندانوں کی اپنی ذمہ داری ہے۔',
              strong: true,
            ),
          ],
        );
      case GuidePopupVariant.registerPhone:
        return const GuidePopupContent(
          emoji: '📱',
          titleEn: 'Important Notice — Family Contact Information',
          titleUr: 'اہم نوٹ — خاندانی رابطہ کی معلومات',
          bodyEn: [
            GuideParagraph(
              'For registration, please provide a reliable family contact number, preferably belonging to the father or mother. Kindly avoid using the personal phone number of the boy or girl whose matrimonial profile is being created. For girls’ profiles in particular, providing a parent’s or guardian’s contact number is strongly recommended to ensure secure and family-oriented communication.',
            ),
          ],
          bodyUr: [
            GuideParagraph(
              'رجسٹریشن کے لیے خاندان کا مستند رابطہ نمبر درج کریں، ترجیحاً والد یا والدہ کا۔ جس لڑکے یا لڑکی کا رشتہ مطلوب ہو، اُن کا ذاتی موبائل نمبر درج کرنے سے گریز کریں۔ خصوصاً لڑکیوں کے پروفائل کے لیے والدین یا سرپرست کا رابطہ نمبر فراہم کرنے کی تاکید کی جاتی ہے، تاکہ رابطے کا عمل محفوظ اور خاندانی اقدار کے مطابق رہے۔',
            ),
          ],
        );
    }
  }
}

/// Shows the bilingual guide dialog. Returns `true` when confirmed,
/// `false`/`null` when dismissed or cancelled.
Future<bool?> showGuidePopup(
  BuildContext context, {
  required GuidePopupVariant variant,
  String? confirmLabel,
  String cancelLabel = 'Close',
  String dismissLabel = 'Got it — سمجھ گیا',
}) {
  return showGeneralDialog<bool>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Close',
    barrierColor: const Color(0x8C2D0810),
    transitionDuration: const Duration(milliseconds: 320),
    pageBuilder: (ctx, anim, secondary) {
      return _GuidePopupDialog(
        content: GuidePopupContent.forVariant(variant),
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        dismissLabel: dismissLabel,
      );
    },
    transitionBuilder: (ctx, anim, secondary, child) {
      final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.94, end: 1).animate(curved),
          child: child,
        ),
      );
    },
  );
}

class _GuidePopupDialog extends StatelessWidget {
  const _GuidePopupDialog({
    required this.content,
    required this.confirmLabel,
    required this.cancelLabel,
    required this.dismissLabel,
  });

  final GuidePopupContent content;
  final String? confirmLabel;
  final String cancelLabel;
  final String dismissLabel;

  @override
  Widget build(BuildContext context) {
    final hasConfirm = confirmLabel != null && confirmLabel!.isNotEmpty;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: MediaQuery.sizeOf(context).width - 36,
          constraints: const BoxConstraints(maxWidth: 440, maxHeight: 640),
          margin: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFFFEFB), Color(0xFFFFF8F3), Color(0xFFFFF5F0)],
            ),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
            boxShadow: [
              BoxShadow(
                color: AppColors.primaryDark.withValues(alpha: 0.28),
                blurRadius: 32,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  height: 3,
                  margin: const EdgeInsets.fromLTRB(18, 0, 18, 0),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Color(0xFF8B6914),
                        Color(0xFFF5E6B8),
                        Color(0xFFD4AF37),
                        Color(0xFFF5E6B8),
                        Color(0xFF8B6914),
                      ],
                    ),
                  ),
                ),
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
                    child: Column(
                      children: [
                        Align(
                          alignment: Alignment.topRight,
                          child: IconButton(
                            tooltip: 'Close',
                            onPressed: () => Navigator.of(context).pop(false),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.white.withValues(alpha: 0.8),
                              side: BorderSide(
                                color: AppColors.primary.withValues(alpha: 0.15),
                              ),
                            ),
                            icon: const Icon(Icons.close_rounded, size: 20, color: AppColors.primaryDark),
                          ),
                        ),
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primary.withValues(alpha: 0.12),
                                AppColors.gold.withValues(alpha: 0.18),
                              ],
                            ),
                            border: Border.all(
                              color: AppColors.gold.withValues(alpha: 0.35),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(content.emoji, style: const TextStyle(fontSize: 28)),
                        )
                            .animate(onPlay: (c) => c.repeat(reverse: true))
                            .scale(
                              begin: const Offset(1, 1),
                              end: const Offset(1.05, 1.05),
                              duration: 1200.ms,
                            ),
                        const SizedBox(height: 14),
                        Text(
                          content.titleEn,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primaryDark,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        UrduText(
                          content.titleUr,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.72),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.1),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _langTag('English'),
                              ...content.bodyEn.map(
                                (p) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Text(
                                    p.text,
                                    style: TextStyle(
                                      fontSize: 13.5,
                                      height: 1.55,
                                      color: p.strong
                                          ? AppColors.primaryDark
                                          : const Color(0xFF3F3A3A),
                                      fontWeight:
                                          p.strong ? FontWeight.w600 : FontWeight.w400,
                                    ),
                                  ),
                                ),
                              ),
                              Divider(
                                height: 20,
                                color: AppColors.gold.withValues(alpha: 0.45),
                              ),
                              _langTag('اردو'),
                              ...content.bodyUr.map(
                                (p) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: UrduText(
                                    p.text,
                                    style: TextStyle(
                                      fontSize: 14,
                                      height: 1.7,
                                      color: p.strong
                                          ? AppColors.primaryDark
                                          : const Color(0xFF3F3A3A),
                                      fontWeight:
                                          p.strong ? FontWeight.w600 : FontWeight.w400,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 4, 18, 18),
                  child: hasConfirm
                      ? Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => Navigator.of(context).pop(false),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.primaryDark,
                                  side: BorderSide(
                                    color: AppColors.primary.withValues(alpha: 0.2),
                                  ),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Text(
                                  cancelLabel,
                                  style: const TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: AppColors.goldGradient,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.gold.withValues(alpha: 0.35),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(12),
                                    onTap: () => Navigator.of(context).pop(true),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                        horizontal: 8,
                                      ),
                                      child: Text(
                                        confirmLabel!,
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primaryDark,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        )
                      : SizedBox(
                          width: double.infinity,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: AppColors.goldGradient,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.gold.withValues(alpha: 0.35),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () => Navigator.of(context).pop(true),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  child: Text(
                                    dismissLabel,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primaryDark,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _langTag(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
          color: Color(0xFF8B6914),
        ),
      ),
    );
  }
}
