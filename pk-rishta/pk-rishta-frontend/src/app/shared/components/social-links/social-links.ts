import { Component, Input } from '@angular/core';

export interface SocialLinkItem {
  label: string;
  href: string;
  brand: 'facebook' | 'instagram' | 'youtube' | 'whatsapp' | 'wa-channel';
}

@Component({
  selector: 'app-social-links',
  template: `
    <div class="social-wrap" [class.compact]="compact">
      @if (!compact) {
        <p class="social-title">{{ title }}</p>
        <p class="social-sub">Facebook · Instagram · YouTube · WhatsApp Chat · Channel</p>
      }
      <div class="social-row" role="list">
        @for (link of links; track link.label; let i = $index) {
          <a
            class="social-btn"
            role="listitem"
            [class]="link.brand"
            [href]="link.href"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="link.label"
            [attr.title]="link.label"
            [style.animation-delay]="i * 80 + 'ms'"
          >
            <span class="social-glow" aria-hidden="true"></span>
            @switch (link.brand) {
              @case ('facebook') {
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M14 13.5h2.5l.5-3H14V8.5c0-.8.2-1.3 1.4-1.3H17V4.1C16.6 4.1 15.6 4 14.5 4 11.9 4 10 5.6 10 8.3V10.5H7.5v3H10V20h4v-6.5z"
                  />
                </svg>
              }
              @case ('instagram') {
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                  />
                </svg>
              }
              @case ('youtube') {
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M23 12.2s0-3.4-.4-5c-.2-1.1-1.1-1.9-2.1-2.1C18.7 4.6 12 4.6 12 4.6s-6.7 0-8.5.5c-1 .2-1.9 1-2.1 2.1C1 8.8 1 12.2 1 12.2s0 3.4.4 5c.2 1.1 1.1 1.9 2.1 2.1 1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5c1-.2 1.9-1 2.1-2.1.4-1.6.4-5 .4-5zM9.8 15.5v-6.6l5.7 3.3-5.7 3.3z"
                  />
                </svg>
              }
              @case ('whatsapp') {
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.96.57 3.78 1.56 5.32L2 22l5.02-1.64a9.86 9.86 0 0 0 5.02 1.37h.01c5.46 0 9.89-4.4 9.89-9.84C21.93 6.4 17.5 2 12.04 2zm5.75 14.02c-.24.68-1.4 1.25-1.93 1.33-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.61-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35h.55c.17 0 .41-.07.64.49.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.28.29-.12.57.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.19-.28.37-.23.62-.14.26.1 1.63.77 1.91.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z"
                  />
                </svg>
              }
              @case ('wa-channel') {
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 3c-1.1 0-2 .9-2 2v.3C7.7 6 6 8.1 6 10.5V14l-1.6 1.6c-.3.3-.4.7-.3 1.1.1.4.5.7.9.7h13.9c.4 0 .8-.3.9-.7.1-.4 0-.8-.3-1.1L18 14v-3.5C18 8.1 16.3 6 14 5.3V5c0-1.1-.9-2-2-2zm0 18c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zM8.2 8.4c.5-.4 1.1-.7 1.8-.9l.3 1.1c-.5.1-.9.4-1.2.6L8.2 8.4zm7.6 0-.9.8c-.3-.2-.7-.5-1.2-.6l.3-1.1c.7.2 1.3.5 1.8.9z"
                  />
                </svg>
              }
            }
          </a>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .social-wrap {
        text-align: center;
      }
      .social-title {
        margin: 0 0 0.25rem;
        font-weight: 700;
        font-size: 1.05rem;
        color: inherit;
      }
      .social-sub {
        margin: 0 0 1rem;
        font-size: 0.85rem;
        opacity: 0.75;
      }
      .social-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.85rem;
        justify-content: center;
        align-items: center;
      }
      .social-btn {
        position: relative;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        text-decoration: none;
        overflow: hidden;
        transform: translateY(8px) scale(0.85);
        opacity: 0;
        animation: social-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        transition: transform 0.2s ease, box-shadow 0.25s ease;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }
      .compact .social-btn {
        width: 44px;
        height: 44px;
      }
      .social-btn svg {
        width: 24px;
        height: 24px;
        position: relative;
        z-index: 1;
      }
      .compact .social-btn svg {
        width: 20px;
        height: 20px;
      }
      .social-glow {
        position: absolute;
        inset: -40%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.45), transparent 55%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .social-btn:hover {
        transform: translateY(-4px) scale(1.08);
      }
      .social-btn:hover .social-glow {
        opacity: 1;
        animation: social-shine 1.2s ease infinite;
      }
      .social-btn:active {
        transform: scale(0.92);
      }
      .social-btn.facebook {
        background: linear-gradient(135deg, #1877f2, #0d65d9);
      }
      .social-btn.instagram {
        background: linear-gradient(135deg, #f58529, #dd2a7b 50%, #8134af);
      }
      .social-btn.youtube {
        background: linear-gradient(135deg, #ff0000, #cc0000);
      }
      .social-btn.whatsapp {
        background: linear-gradient(135deg, #25d366, #128c7e);
      }
      .social-btn.wa-channel {
        background: linear-gradient(135deg, #00a884, #075e54);
      }
      @keyframes social-pop {
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes social-shine {
        0% {
          transform: translate(-30%, -30%);
        }
        100% {
          transform: translate(30%, 30%);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .social-btn {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class SocialLinksComponent {
  @Input() title = 'Follow Hum Rishta';
  @Input() compact = false;

  readonly links: SocialLinkItem[] = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61594200343415',
      brand: 'facebook',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/humrishta/',
      brand: 'instagram',
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/channel/UCd-U5ZomvR-wVfONVux_sMg',
      brand: 'youtube',
    },
    {
      label: 'WhatsApp Chat',
      href: 'https://wa.me/923435020077',
      brand: 'whatsapp',
    },
    {
      label: 'WhatsApp Channel',
      href: 'https://whatsapp.com/channel/0029VbELMHi4SpkEkfsXeZ3g',
      brand: 'wa-channel',
    },
  ];
}
