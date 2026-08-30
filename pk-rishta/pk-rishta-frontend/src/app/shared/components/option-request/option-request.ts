import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DropdownService } from '../../../core/services/dropdown.service';

@Component({
  selector: 'app-option-request',
  imports: [FormsModule],
  template: `
    <div class="option-request">
      <button type="button" class="option-request-toggle" (click)="expanded = !expanded">
        {{ expanded ? '▾' : '▸' }} Option not listed? Request admin to add
      </button>
      @if (expanded) {
        <div class="option-request-body">
          @if (category) {
            <p class="option-request-hint">{{ fieldLabel }} — {{ category }}</p>
          } @else {
            <p class="option-request-hint">{{ fieldLabel }}</p>
          }
          <input
            class="form-input"
            [(ngModel)]="text"
            [ngModelOptions]="{standalone: true}"
            [name]="controlName"
            placeholder="Type the option you need (e.g. profession, caste, city)"
            (keyup.enter)="send()"
          />
          <button
            type="button"
            class="btn-send-request"
            (click)="send()"
            [disabled]="sending || text.trim().length < 3 || !userEmail.trim()"
          >
            {{ sending ? 'Sending...' : 'Send to admin' }}
          </button>
          <p class="option-request-note">This only asks admin to add a new option. You still must select a listed value before saving.</p>
          @if (feedback) {
            <p class="option-request-feedback" [class.is-error]="feedbackError">{{ feedback }}</p>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .option-request { margin-top: 0.45rem; }
    .option-request-toggle {
      border: none;
      background: none;
      padding: 0;
      color: var(--primary);
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
    }
    .option-request-toggle:hover { text-decoration: underline; }
    .option-request-body {
      margin-top: 0.55rem;
      padding: 0.75rem;
      border: 1px dashed var(--border);
      border-radius: 8px;
      background: rgba(155, 27, 48, 0.03);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .option-request-hint {
      margin: 0;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .btn-send-request {
      align-self: flex-start;
      padding: 0.45rem 0.85rem;
      border: 1.5px solid var(--primary);
      border-radius: 8px;
      background: var(--primary);
      color: #fff;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-send-request:disabled { opacity: 0.5; cursor: not-allowed; }
    .option-request-note {
      margin: 0;
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .option-request-feedback {
      margin: 0;
      font-size: 0.82rem;
      color: #15803d;
      font-weight: 600;
    }
    .option-request-feedback.is-error { color: #b91c1c; }
  `,
})
export class OptionRequestComponent {
  private readonly dropdownService = inject(DropdownService);

  @Input({ required: true }) fieldLabel = 'Field';
  @Input() fieldKey = '';
  @Input() category = '';
  @Input() userName = '';
  @Input() userEmail = '';

  expanded = false;
  text = '';
  sending = false;
  feedback = '';
  feedbackError = false;

  get controlName(): string {
    const key = `${this.fieldKey}-${this.fieldLabel}-${this.category}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `opt_req_${key}`;
  }

  send(): void {
    const requested = this.text.trim();
    const name = this.userName.trim() || 'Profile User';
    const email = this.userEmail.trim().toLowerCase();
    if (requested.length < 3) {
      this.feedback = 'Please enter at least 3 characters';
      this.feedbackError = true;
      return;
    }
    if (!email) {
      this.feedback = 'Please add your email in Contact section first';
      this.feedbackError = true;
      return;
    }

    this.sending = true;
    this.feedback = '';
    this.feedbackError = false;
    this.dropdownService.requestOption({
      field_key: this.fieldKey || undefined,
      field_label: this.fieldLabel,
      category: this.category || undefined,
      requested_label: requested,
      name,
      email,
    }).subscribe({
      next: (res) => {
        this.sending = false;
        this.text = '';
        this.feedback = res.message || 'Your request sent to admin successfully';
        this.feedbackError = false;
      },
      error: (err) => {
        this.sending = false;
        this.feedback = err.error?.message || 'Failed to send request';
        this.feedbackError = true;
      },
    });
  }
}
