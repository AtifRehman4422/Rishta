import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly router = inject(Router);
  private readonly containers = new Set<HTMLElement>();
  private readonly threshold = 280;

  readonly showScrollTop = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.scrollAllToTop());
  }

  register(container: HTMLElement): void {
    this.containers.add(container);
    container.addEventListener('scroll', this.onScroll, { passive: true });
    this.updateVisibility(container);
  }

  unregister(container: HTMLElement): void {
    this.containers.delete(container);
    container.removeEventListener('scroll', this.onScroll);
    if (!this.containers.size) {
      this.showScrollTop.set(false);
    }
  }

  scrollToTop(): void {
    for (const container of this.containers) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private readonly onScroll = (event: Event): void => {
    this.updateVisibility(event.target as HTMLElement);
  };

  private updateVisibility(container: HTMLElement): void {
    this.showScrollTop.set(container.scrollTop > this.threshold);
  }

  private scrollAllToTop(): void {
    requestAnimationFrame(() => {
      for (const container of this.containers) {
        container.scrollTop = 0;
      }
      this.showScrollTop.set(false);
    });
  }
}
