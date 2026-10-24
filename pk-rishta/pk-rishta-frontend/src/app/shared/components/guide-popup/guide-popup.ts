import { Component, EventEmitter, Input, Output } from '@angular/core';

export type GuidePopupVariant = 'register-phone' | 'contact-request';

@Component({
  selector: 'app-guide-popup',
  template: `
    @if (open) {
      <div class="gp-overlay" (click)="onBackdrop()" role="presentation">
        <div
          class="gp-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (click)="$event.stopPropagation()"
        >
          <button type="button" class="gp-close" (click)="dismiss()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="gp-accent"></div>

          <div class="gp-icon-wrap" aria-hidden="true">
            <span class="gp-icon">{{ variant === 'register-phone' ? '📱' : '🤝' }}</span>
          </div>

          <h2 [id]="titleId" class="gp-title">{{ content.titleEn }}</h2>
          <p class="gp-title-ur" dir="rtl" lang="ur">{{ content.titleUr }}</p>

          <div class="gp-body">
            <div class="gp-lang-block">
              <span class="gp-lang-tag">English</span>
              @for (para of content.bodyEn; track $index) {
                <p [class.gp-para-strong]="para.strong">{{ para.text }}</p>
              }
            </div>
            <div class="gp-divider" aria-hidden="true"></div>
            <div class="gp-lang-block" dir="rtl" lang="ur">
              <span class="gp-lang-tag">اردو</span>
              @for (para of content.bodyUr; track $index) {
                <p [class.gp-para-strong]="para.strong">{{ para.text }}</p>
              }
            </div>
          </div>

          <div class="gp-actions">
            @if (confirmLabel) {
              <button type="button" class="gp-btn gp-btn-ghost" (click)="dismiss()">
                {{ cancelLabel || 'Close' }}
              </button>
              <button type="button" class="gp-btn gp-btn-primary" (click)="confirm()">
                {{ confirmLabel }}
              </button>
            } @else {
              <button type="button" class="gp-btn gp-btn-primary gp-btn-wide" (click)="dismiss()">
                {{ dismissLabel || 'Got it' }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .gp-overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      background: rgba(45, 8, 16, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: gp-fade 0.28s ease;
    }

    .gp-dialog {
      position: relative;
      width: min(520px, 100%);
      max-height: min(92vh, 720px);
      overflow-y: auto;
      padding: 1.75rem 1.5rem 1.35rem;
      border-radius: 20px;
      background:
        radial-gradient(ellipse 80% 60% at 100% 0%, rgba(212, 175, 55, 0.14) 0%, transparent 55%),
        radial-gradient(ellipse 70% 50% at 0% 100%, rgba(155, 27, 48, 0.08) 0%, transparent 50%),
        linear-gradient(165deg, #fffefb 0%, #fff8f3 48%, #fff5f0 100%);
      box-shadow:
        0 24px 64px rgba(58, 8, 18, 0.35),
        0 0 0 1px rgba(212, 175, 55, 0.28);
      animation: gp-rise 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .gp-accent {
      position: absolute;
      top: 0;
      left: 1.25rem;
      right: 1.25rem;
      height: 3px;
      border-radius: 0 0 4px 4px;
      background: linear-gradient(90deg, #8B6914, #F5E6B8, #D4AF37, #F5E6B8, #8B6914);
      background-size: 200% 100%;
      animation: gp-shimmer 5s ease-in-out infinite;
    }

    .gp-close {
      position: absolute;
      top: 0.85rem;
      right: 0.85rem;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(155, 27, 48, 0.15);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.75);
      color: #5A0E1A;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
    }
    .gp-close svg { width: 16px; height: 16px; }
    .gp-close:hover {
      background: #fff;
      border-color: rgba(155, 27, 48, 0.35);
      transform: rotate(90deg);
    }

    .gp-icon-wrap {
      width: 64px;
      height: 64px;
      margin: 0.25rem auto 1rem;
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(155, 27, 48, 0.12), rgba(212, 175, 55, 0.18));
      border: 1px solid rgba(212, 175, 55, 0.35);
      box-shadow: 0 8px 24px rgba(155, 27, 48, 0.12);
      animation: gp-pulse 2.4s ease-in-out infinite;
    }
    .gp-icon { font-size: 1.75rem; line-height: 1; }

    .gp-title {
      margin: 0;
      text-align: center;
      font-family: var(--font-display, Georgia, serif);
      font-size: 1.35rem;
      font-weight: 700;
      color: #5A0E1A;
      line-height: 1.3;
      padding: 0 1.5rem;
    }
    .gp-title-ur {
      margin: 0.35rem 0 1.15rem;
      text-align: center;
      font-size: 1.05rem;
      font-weight: 600;
      color: #9B1B30;
      line-height: 1.5;
      padding: 0 1rem;
    }

    .gp-body {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1rem 1rem;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(155, 27, 48, 0.1);
    }
    .gp-lang-tag {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #8B6914;
      margin-bottom: 0.35rem;
    }
    .gp-lang-block p {
      margin: 0 0 0.65rem;
      font-size: 0.88rem;
      line-height: 1.65;
      color: #3f3a3a;
    }
    .gp-lang-block p:last-child { margin-bottom: 0; }
    .gp-lang-block p.gp-para-strong {
      font-weight: 600;
      color: #5A0E1A;
    }
    .gp-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.55), transparent);
    }

    .gp-actions {
      display: flex;
      gap: 0.65rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 1.25rem;
    }
    .gp-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0.7rem 1.35rem;
      border-radius: 12px;
      font-family: var(--font, inherit);
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .gp-btn:hover { transform: translateY(-1px); }
    .gp-btn:active { transform: translateY(0); }
    .gp-btn-primary {
      color: #3A0812;
      background: linear-gradient(135deg, #C9A227 0%, #F5E6B8 48%, #D4AF37 100%);
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
    }
    .gp-btn-primary:hover {
      box-shadow: 0 10px 26px rgba(212, 175, 55, 0.45);
    }
    .gp-btn-ghost {
      color: #5A0E1A;
      background: rgba(155, 27, 48, 0.06);
      border: 1px solid rgba(155, 27, 48, 0.18);
    }
    .gp-btn-wide { min-width: 160px; }

    @keyframes gp-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes gp-rise {
      from { opacity: 0; transform: translateY(18px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes gp-shimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes gp-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }

    @media (max-width: 480px) {
      .gp-dialog { padding: 1.5rem 1.15rem 1.2rem; border-radius: 16px; }
      .gp-title { font-size: 1.2rem; }
      .gp-actions { flex-direction: column-reverse; }
      .gp-btn { width: 100%; }
    }
  `],
})
export class GuidePopupComponent {
  @Input({ required: true }) open = false;
  @Input({ required: true }) variant: GuidePopupVariant = 'register-phone';
  /** When set, shows Cancel + Confirm; otherwise a single dismiss button. */
  @Input() confirmLabel = '';
  @Input() cancelLabel = 'Close';
  @Input() dismissLabel = 'Got it';
  @Input() closeOnBackdrop = true;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly confirmed = new EventEmitter<void>();

  readonly titleId = `gp-title-${Math.random().toString(36).slice(2, 9)}`;

  get content(): {
    titleEn: string;
    titleUr: string;
    bodyEn: { text: string; strong?: boolean }[];
    bodyUr: { text: string; strong?: boolean }[];
  } {
    if (this.variant === 'contact-request') {
      return {
        titleEn: 'Important Notice — Rishta Verification & Responsibility',
        titleUr: 'اہم نوٹ — رشتے کی تصدیق اور ذمہ داری',
        bodyEn: [
          {
            text:
              'Before finalizing any matrimonial proposal, families are strongly advised to independently verify the identity, family background, personal details, and accuracy of all information provided by the other party. Parents and guardians should carefully evaluate the proposal and make an informed decision.',
          },
          {
            text:
              'Hum Rishta serves as a platform to help individuals and families discover suitable matrimonial matches based on their preferences. However, the platform does not guarantee the authenticity of every profile or the accuracy of all information provided. The final decision to proceed with or accept a proposal rests entirely with the individuals and their families.',
            strong: true,
          },
        ],
        bodyUr: [
          {
            text:
              'کسی بھی رشتے کو حتمی شکل دینے سے پہلے خاندانوں کو چاہیے کہ وہ دوسرے فریق کی شناخت، خاندانی پس منظر، ذاتی کوائف اور فراہم کردہ تمام معلومات کی آزادانہ طور پر مکمل تصدیق کریں۔ والدین اور سرپرستوں کو چاہیے کہ وہ رشتے کا بغور جائزہ لیں اور تمام ضروری پہلوؤں کو مدِنظر رکھتے ہوئے فیصلہ کریں۔',
          },
          {
            text:
              'Hum Rishta ایک ایسا پلیٹ فارم ہے جو افراد اور خاندانوں کو ان کی ترجیحات کے مطابق مناسب رشتے تلاش کرنے میں مدد فراہم کرتا ہے۔ تاہم، پلیٹ فارم ہر پروفائل کی صداقت یا فراہم کردہ تمام معلومات کی درستگی کی ضمانت نہیں دیتا۔ کسی بھی رشتے کو آگے بڑھانے یا قبول کرنے کا حتمی فیصلہ مکمل طور پر متعلقہ افراد اور ان کے خاندانوں کی اپنی ذمہ داری ہے۔',
            strong: true,
          },
        ],
      };
    }
    return {
      titleEn: 'Important Notice — Family Contact Information',
      titleUr: 'اہم نوٹ — خاندانی رابطہ کی معلومات',
      bodyEn: [
        {
          text:
            'For registration, please provide a reliable family contact number, preferably belonging to the father or mother. Kindly avoid using the personal phone number of the boy or girl whose matrimonial profile is being created. For girls’ profiles in particular, providing a parent’s or guardian’s contact number is strongly recommended to ensure secure and family-oriented communication.',
        },
      ],
      bodyUr: [
        {
          text:
            'رجسٹریشن کے لیے خاندان کا مستند رابطہ نمبر درج کریں، ترجیحاً والد یا والدہ کا۔ جس لڑکے یا لڑکی کا رشتہ مطلوب ہو، اُن کا ذاتی موبائل نمبر درج کرنے سے گریز کریں۔ خصوصاً لڑکیوں کے پروفائل کے لیے والدین یا سرپرست کا رابطہ نمبر فراہم کرنے کی تاکید کی جاتی ہے، تاکہ رابطے کا عمل محفوظ اور خاندانی اقدار کے مطابق رہے۔',
        },
      ],
    };
  }

  onBackdrop(): void {
    if (this.closeOnBackdrop) this.dismiss();
  }

  dismiss(): void {
    this.closed.emit();
  }

  confirm(): void {
    this.confirmed.emit();
  }
}
