import { Component, input } from '@angular/core';

@Component({
  selector: 'app-field-error',
  template: `
    @if (message()) {
      <p class="field-error" role="alert">{{ message() }}</p>
    }
  `,
  styles: [`
    .field-error {
      margin: 0.35rem 0 0;
      font-size: 0.8rem;
      color: #b91c1c;
      line-height: 1.4;
      animation: fadeIn 0.2s ease;
    }
  `],
})
export class FieldErrorComponent {
  readonly message = input<string | undefined>('');
}
