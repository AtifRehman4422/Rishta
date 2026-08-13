import { signal } from '@angular/core';

import { FieldErrors } from './validation';

export class FormErrorState {
  readonly errors = signal<FieldErrors>({});
  readonly submitted = signal(false);
  private readonly touched = signal<Set<string>>(new Set());

  reset(): void {
    this.errors.set({});
    this.submitted.set(false);
    this.touched.set(new Set());
  }

  setAll(errors: FieldErrors): void {
    this.errors.set(errors);
  }

  clear(field: string): void {
    const next = { ...this.errors() };
    delete next[field];
    this.errors.set(next);
  }

  touch(field: string): void {
    const next = new Set(this.touched());
    next.add(field);
    this.touched.set(next);
  }

  markSubmitted(): void {
    this.submitted.set(true);
  }

  message(field: string): string | undefined {
    if (!this.submitted() && !this.touched().has(field)) return undefined;
    return this.errors()[field];
  }

  show(field: string): boolean {
    return !!this.message(field);
  }
}
