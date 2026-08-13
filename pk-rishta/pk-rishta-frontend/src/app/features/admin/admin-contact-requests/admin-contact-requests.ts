import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AdminContactRequest } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-contact-requests',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <h1>Contact Requests</h1>
      <p class="page-hint">Review user requests before sharing contact numbers (2-day access on approval).</p>

      <div class="toolbar">
        <select class="form-select" [(ngModel)]="statusFilter" (change)="load()">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (!requests().length) {
        <div class="empty card">No requests found.</div>
      } @else {
        <div class="request-list">
          @for (req of requests(); track req.id) {
            <div class="request-card card">
              <div class="profiles-row">
                <div class="profile-block">
                  <span class="label">Requester</span>
                  <a [routerLink]="['/profile', req.requester_profile_id]" target="_blank">
                    {{ req.requester_first_name }} {{ req.requester_last_name }}
                  </a>
                  <small>{{ req.requester_age }} yrs · {{ req.requester_city }}</small>
                  <div class="contact-list">
                    @for (c of contactsOf(req.requester_contacts); track c.number) {
                      <span class="contact-chip">{{ c.type }}: {{ c.number }}</span>
                    } @empty {
                      <small class="no-contact">No contacts</small>
                    }
                  </div>
                </div>
                <span class="arrow">→</span>
                <div class="profile-block target-block">
                  <span class="label">Requested Profile</span>
                  <a [routerLink]="['/profile', req.target_profile_id]" target="_blank">
                    {{ req.target_first_name }} {{ req.target_last_name }}
                  </a>
                  <small>{{ req.target_age }} yrs · {{ req.target_city }}</small>
                  <div class="contact-list">
                    @for (c of contactsOf(req.target_contacts); track c.number) {
                      <span class="contact-chip highlight">{{ c.type }}: {{ c.number }}</span>
                    } @empty {
                      <small class="no-contact">No contacts on file</small>
                    }
                  </div>
                </div>
              </div>
              <div class="request-meta">
                <span class="badge" [class]="'badge-' + req.status">{{ req.status }}</span>
                <span class="date">{{ formatDate(req.created_at) }}</span>
              </div>
              @if (req.user_message) {
                <p class="user-msg">User note: "{{ req.user_message }}"</p>
              }
              @if (req.status === 'pending') {
                <div class="review-actions">
                  <textarea class="form-textarea" [(ngModel)]="reviewMessages[req.id]" rows="2"
                    placeholder="Message for user (required for rejection)"></textarea>
                  <div class="btn-row">
                    <button class="btn btn-primary btn-sm" (click)="review(req.id, 'approve')" [disabled]="reviewing()">
                      ✓ Approve (2 days)
                    </button>
                    <button class="btn btn-danger btn-sm" (click)="review(req.id, 'reject')" [disabled]="reviewing()">
                      ✗ Reject
                    </button>
                  </div>
                </div>
              }
              @if (req.admin_message) {
                <p class="admin-msg">Admin message: {{ req.admin_message }}</p>
              }
            </div>
          }
        </div>
      }

      @if (message()) {
        <div class="alert" [class.alert-success]="!error()" [class.alert-error]="error()">{{ message() }}</div>
      }
    </div>
  `,
  styles: [`
    .admin-page h1 { font-size: clamp(1.35rem, 3vw, 1.75rem); margin-bottom: 0.25rem; }
    .page-hint { color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.9rem; }
    .toolbar { margin-bottom: 1.5rem; }
    .toolbar .form-select { max-width: 200px; width: 100%; }
    .request-list { display: flex; flex-direction: column; gap: 1rem; }
    .request-card { padding: clamp(1rem, 2vw, 1.25rem); }
    .profiles-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1rem;
      align-items: start;
      margin-bottom: 0.75rem;
    }
    .profile-block { min-width: 0; }
    .profile-block .label { display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem; }
    .profile-block a { font-weight: 600; color: var(--primary); text-decoration: none; word-break: break-word; }
    .profile-block a:hover { text-decoration: underline; }
    .profile-block small { display: block; color: var(--text-muted); font-size: 0.82rem; margin: 0.2rem 0 0.5rem; }
    .arrow { font-size: 1.25rem; color: var(--text-muted); padding-top: 1.5rem; text-align: center; }
    .contact-list { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.35rem; }
    .contact-chip {
      background: #f0fdf4; color: #15803d;
      padding: 0.25rem 0.65rem; border-radius: 6px;
      font-size: 0.8rem; font-weight: 600; word-break: break-all;
    }
    .contact-chip.highlight { background: #ede9fe; color: #5b21b6; }
    .no-contact { color: var(--text-light); font-size: 0.78rem; }
    .request-meta { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .date { font-size: 0.82rem; color: var(--text-muted); }
    .user-msg, .admin-msg { font-size: 0.85rem; color: var(--text-muted); font-style: italic; word-break: break-word; }
    .review-actions { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .btn-row { display: flex; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; }
    .empty { padding: 2rem; text-align: center; color: var(--text-muted); }
    .alert { margin-top: 1rem; }
    @media (max-width: 768px) {
      .profiles-row { grid-template-columns: 1fr; }
      .arrow { display: none; }
      .target-block { padding-top: 0.5rem; border-top: 1px dashed var(--border); }
    }
  `],
})
export class AdminContactRequestsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  requests = signal<AdminContactRequest[]>([]);
  loading = signal(true);
  reviewing = signal(false);
  statusFilter = 'pending';
  reviewMessages: Record<string, string> = {};
  message = signal('');
  error = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getContactRequests(this.statusFilter).subscribe({
      next: (res) => {
        this.requests.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  contactsOf(raw: unknown): { type: string; number: string }[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  }

  review(id: string, action: 'approve' | 'reject'): void {
    const msg = this.reviewMessages[id]?.trim();
    if (action === 'reject' && !msg) {
      this.message.set('Please enter a rejection reason for the user');
      this.error.set(true);
      return;
    }

    this.reviewing.set(true);
    this.adminService.reviewContactRequest(id, action, msg).subscribe({
      next: (res) => {
        this.reviewing.set(false);
        this.message.set(res.message || 'Request updated');
        this.error.set(false);
        this.load();
      },
      error: (err) => {
        this.reviewing.set(false);
        this.message.set(err.error?.message || 'Failed to update request');
        this.error.set(true);
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
