import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { ADSENSE_CLIENT, isAdSenseReady } from '../../../core/constants/adsense';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

@Component({
  selector: 'app-ad-slot',
  template: `
    <div class="ad-wrap" [class.ad-ready]="ready" [attr.data-format]="format">
      <span class="ad-label">Advertisement</span>
      @if (ready) {
        <ins
          class="adsbygoogle"
          [style.display]="'block'"
          [attr.data-ad-client]="client"
          [attr.data-ad-slot]="slot"
          [attr.data-ad-format]="format === 'vertical' ? 'auto' : 'auto'"
          data-full-width-responsive="true"
        ></ins>
      } @else {
        <div class="ad-placeholder" [class.vertical]="format === 'vertical'">
          <span>Ad space</span>
          <small>AdSense approve hone ke baad yahan ad aayega</small>
        </div>
      }
    </div>
  `,
  styles: [`
    .ad-wrap {
      width: 100%;
      text-align: center;
    }
    .ad-label {
      display: block;
      font-size: 0.65rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted, #888);
      margin-bottom: 0.35rem;
    }
    .ad-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      min-height: 100px;
      padding: 1rem;
      border: 1px dashed rgba(155, 27, 48, 0.25);
      border-radius: 12px;
      background: rgba(155, 27, 48, 0.03);
      color: var(--text-muted, #888);
      font-size: 0.85rem;
    }
    .ad-placeholder.vertical {
      min-height: 280px;
    }
    .ad-placeholder small {
      font-size: 0.72rem;
      opacity: 0.85;
    }
    :host { display: block; width: 100%; }
  `],
})
export class AdSlotComponent implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);

  @Input({ required: true }) slot!: string;
  @Input() format: 'horizontal' | 'vertical' | 'rectangle' = 'rectangle';

  readonly client = ADSENSE_CLIENT;
  readonly ready = isAdSenseReady();
  private pushed = false;

  ngAfterViewInit(): void {
    if (!this.ready || this.pushed) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      this.pushed = true;
    } catch {
      // Ad blocker or script not loaded
    }
  }

  ngOnDestroy(): void {
    // no-op — AdSense manages its own DOM nodes
  }
}
