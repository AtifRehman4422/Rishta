import { Component, inject } from '@angular/core';

import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-scroll-to-top',
  template: `
    @if (scroll.showScrollTop()) {
      <button
        type="button"
        class="scroll-top-btn"
        (click)="scrollToTop()"
        aria-label="Scroll to top"
        title="Back to top"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 4l-7 7h4v9h6v-9h4l-7-7z"
          />
        </svg>
      </button>
    }
  `,
  styles: [`
    .scroll-top-btn {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 900;
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      background: var(--gradient-wedding);
      box-shadow: var(--shadow-lg);
      transition: var(--transition);
      animation: scroll-top-in 0.25s ease;
    }
    .scroll-top-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 32px rgba(155, 27, 48, 0.28);
    }
    .scroll-top-btn:active {
      transform: translateY(0);
    }
    @keyframes scroll-top-in {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 640px) {
      .scroll-top-btn {
        right: 1rem;
        bottom: 1rem;
        width: 44px;
        height: 44px;
      }
    }
  `],
})
export class ScrollToTopComponent {
  readonly scroll = inject(ScrollService);

  scrollToTop(): void {
    this.scroll.scrollToTop();
  }
}
