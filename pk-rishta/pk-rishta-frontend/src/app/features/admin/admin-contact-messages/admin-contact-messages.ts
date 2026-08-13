import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ContactFormMessage } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-contact-messages',
  imports: [FormsModule],
  template: `
    <div class="admin-page">
      <h1>Contact Messages</h1>
      <p class="page-hint">Messages from the public Contact page — reply by email and update status here.</p>

      <div class="toolbar">
        <input
          class="form-input"
          [(ngModel)]="search"
          (keyup.enter)="load()"
          placeholder="Search name, email, message..."
        />
        <button type="button" class="btn btn-primary btn-sm" (click)="load()">Search</button>
        <select class="form-select" [(ngModel)]="statusFilter" (change)="load()">
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
          <option value="">All</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (!messages().length) {
        <div class="empty card">No contact messages found.</div>
      } @else {
        <div class="message-list">
          @for (m of messages(); track m.id) {
            <div class="message-card card">
              <div class="message-header">
                <span class="badge" [class]="'badge-' + m.status">{{ formatStatus(m.status) }}</span>
                <span class="subject">{{ formatSubject(m.subject) }}</span>
                <span class="date">{{ formatDate(m.created_at) }}</span>
              </div>
              <div class="sender-row">
                <strong>{{ m.name }}</strong>
                <a [href]="'mailto:' + m.email" class="email-link">{{ m.email }}</a>
              </div>
              <p class="message-body">{{ m.message }}</p>

              <div class="notes-row">
                <label class="form-label">Admin notes (internal)</label>
                <textarea
                  class="form-textarea"
                  [(ngModel)]="adminNotes[m.id]"
                  rows="2"
                  placeholder="e.g. Replied via email on..."
                ></textarea>
              </div>

              <div class="btn-row">
                @if (m.status === 'new') {
                  <button class="btn btn-outline btn-sm" (click)="updateStatus(m.id, 'read')" [disabled]="updating()">
                    Mark Read
                  </button>
                }
                @if (m.status !== 'replied') {
                  <button class="btn btn-primary btn-sm" (click)="updateStatus(m.id, 'replied')" [disabled]="updating()">
                    Mark Replied
                  </button>
                }
                @if (m.status !== 'archived') {
                  <button class="btn btn-ghost btn-sm" (click)="updateStatus(m.id, 'archived')" [disabled]="updating()">
                    Archive
                  </button>
                }
                <a [href]="'mailto:' + m.email + '?subject=Re: ' + formatSubject(m.subject)" class="btn btn-secondary btn-sm">
                  Reply by Email
                </a>
              </div>
              @if (m.admin_notes) {
                <p class="saved-notes">Saved notes: {{ m.admin_notes }}</p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-hint { color: var(--text-muted); margin-bottom: 1.5rem; }
    .toolbar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .toolbar .form-input { flex: 1; min-width: 200px; }
    .toolbar .form-select { width: 160px; }
    .empty { text-align: center; padding: 3rem; color: var(--text-muted); }
    .message-list { display: flex; flex-direction: column; gap: 1rem; }
    .message-card { padding: 1.25rem 1.5rem; }
    .message-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .badge {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.2rem 0.55rem;
      border-radius: 50px;
    }
    .badge-new { background: #dbeafe; color: #1d4ed8; }
    .badge-read { background: #fef3c7; color: #b45309; }
    .badge-replied { background: #dcfce7; color: #15803d; }
    .badge-archived { background: #f3f4f6; color: #6b7280; }
    .subject { font-weight: 600; color: var(--primary); }
    .date { margin-left: auto; font-size: 0.82rem; color: var(--text-muted); }
    .sender-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .email-link { color: var(--primary); font-size: 0.9rem; }
    .message-body {
      white-space: pre-wrap;
      line-height: 1.7;
      color: var(--text);
      margin-bottom: 1rem;
      padding: 0.85rem 1rem;
      background: var(--blush, #fff8f3);
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .notes-row { margin-bottom: 0.75rem; }
    .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .saved-notes {
      margin-top: 0.75rem;
      font-size: 0.82rem;
      color: var(--text-muted);
      font-style: italic;
    }
  `],
})
export class AdminContactMessagesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  messages = signal<ContactFormMessage[]>([]);
  loading = signal(true);
  updating = signal(false);
  search = '';
  statusFilter = 'new';
  adminNotes: Record<string, string> = {};

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getContactMessages(this.statusFilter, 1, this.search).subscribe({
      next: (res) => {
        this.messages.set(res.data);
        for (const m of res.data) {
          this.adminNotes[m.id] = m.admin_notes || '';
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(id: string, status: string): void {
    this.updating.set(true);
    this.adminService.updateContactMessage(id, {
      status,
      admin_notes: this.adminNotes[id]?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.updating.set(false);
        this.load();
      },
      error: () => this.updating.set(false),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-PK', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      new: 'New',
      read: 'Read',
      replied: 'Replied',
      archived: 'Archived',
    };
    return map[status] || status;
  }

  formatSubject(subject: string): string {
    const map: Record<string, string> = {
      general: 'General Inquiry',
      registration: 'Registration Help',
      'contact-request': 'Contact Request Issue',
      complaint: 'Complaint / Report',
      partnership: 'Business / Partnership',
      'option-request': 'Dropdown Option Request',
    };
    return map[subject] || subject;
  }
}
