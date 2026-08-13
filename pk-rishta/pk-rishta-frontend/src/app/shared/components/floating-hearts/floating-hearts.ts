import { Component, input } from '@angular/core';

@Component({
  selector: 'app-floating-hearts',
  imports: [],
  template: `
    <div class="floating-hearts" [class.on-light]="light()" aria-hidden="true">
      @for (h of hearts; track h) {
        <span
          class="heart"
          [class.heart-solid]="h.solid"
          [style.--h-left]="h.left + '%'"
          [style.--h-size]="h.size + 'px'"
          [style.--h-duration]="h.duration + 's'"
          [style.--h-delay]="h.delay + 's'"
          [style.--h-opacity]="h.opacity"
          [style.--h-drift]="h.drift + 'px'"
          [style.--h-rot]="h.rot + 'deg'"
        >
          <span class="heart-shape"></span>
        </span>
      }
    </div>
  `,
  styles: [`
    .floating-hearts {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }
    .floating-hearts.on-light .heart-shape {
      box-shadow: 0 6px 18px rgba(212, 86, 122, 0.28);
    }
    .floating-hearts.on-light .heart-solid .heart-shape {
      background: linear-gradient(145deg, var(--accent-rose), var(--primary));
      box-shadow: 0 6px 18px rgba(155, 27, 48, 0.3);
    }
    .heart {
      position: absolute;
      left: var(--h-left);
      bottom: -80px;
      width: var(--h-size);
      height: var(--h-size);
      opacity: var(--h-opacity);
      animation:
        heart-rise var(--h-duration) linear var(--h-delay) infinite;
    }
    .heart-shape {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 30%, var(--accent-light), var(--accent));
      transform: rotate(-8deg) scale(1);
      animation: heart-beat 3.2s ease-in-out infinite;
      -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21s-6.7-4.35-9.33-8.11C.9 10.22 1.24 6.6 3.9 4.9a5.2 5.2 0 0 1 7.44.82L12 6.6l.66-.88a5.2 5.2 0 0 1 7.44-.82c2.66 1.7 3 5.32 1.23 7.99C18.7 16.65 12 21 12 21z"/></svg>') center / contain no-repeat;
      -webkit-mask-repeat: no-repeat;
      mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21s-6.7-4.35-9.33-8.11C.9 10.22 1.24 6.6 3.9 4.9a5.2 5.2 0 0 1 7.44.82L12 6.6l.66-.88a5.2 5.2 0 0 1 7.44-.82c2.66 1.7 3 5.32 1.23 7.99C18.7 16.65 12 21 12 21z"/></svg>') center / contain no-repeat;
    }
    .heart-solid .heart-shape {
      background: linear-gradient(145deg, var(--accent-rose), var(--primary));
      box-shadow: 0 4px 14px rgba(155, 27, 48, 0.35);
    }
    @keyframes heart-rise {
      0% {
        transform: translate(0, 0) scale(0.4) rotate(var(--h-rot));
        opacity: 0;
      }
      12% { opacity: var(--h-opacity); }
      50% {
        transform: translate(var(--h-drift), -45vh) scale(1) rotate(var(--h-rot));
      }
      88% { opacity: calc(var(--h-opacity) * 0.85); }
      100% {
        transform: translate(calc(var(--h-drift) * -0.6), -105vh) scale(0.5) rotate(calc(var(--h-rot) * -1));
        opacity: 0;
      }
    }
    @keyframes heart-beat {
      0%, 100% { transform: rotate(-8deg) scale(1); }
      45% { transform: rotate(-8deg) scale(1.12); }
      60% { transform: rotate(-8deg) scale(0.96); }
      75% { transform: rotate(-8deg) scale(1.06); }
    }
    @media (prefers-reduced-motion: reduce) {
      .heart, .heart-shape { animation: none; }
    }
  `],
})
export class FloatingHeartsComponent {
  readonly light = input(false);

  readonly hearts = Array.from({ length: 18 }, (_, i) => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    return {
      left: rand(0, 100),
      size: rand(12, 42),
      duration: rand(8, 18),
      delay: rand(0, 12),
      opacity: rand(0.25, 0.6),
      drift: rand(20, 90),
      rot: rand(-40, 40),
      solid: Math.random() > 0.6,
    };
  });
}
