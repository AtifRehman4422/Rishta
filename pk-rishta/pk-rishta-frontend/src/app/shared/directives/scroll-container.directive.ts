import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';

import { ScrollService } from '../../core/services/scroll.service';

@Directive({
  selector: '[appScrollContainer]',
})
export class ScrollContainerDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly scroll = inject(ScrollService);

  ngOnInit(): void {
    this.scroll.register(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.scroll.unregister(this.el.nativeElement);
  }
}
