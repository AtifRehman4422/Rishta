import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Complaint } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-complaints',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <h1>Complaints</h1>
      <p class="page-hint">Review user complaints — reporter aur reported dono ki profile aur email dekhein.</p>

      <div class="toolbar">
        <input
          class="form-input"
          [(ngModel)]="search"
          (keyup.enter)="load()"
          placeholder="Search by email or name..."
        />
        <button type="button" class="btn btn-primary btn-sm" (click)="load()">Search</button>
        <select class="form-select" [(ngModel)]="statusFilter" (change)="load()">
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="">All</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (!complaints().length) {
        <div class="empty card">No complaints found.</div>
      } @else {
        <div class="complaint-list">
          @for (c of complaints(); track c.id) {
            <div class="complaint-card card">
              <div class="complaint-header">
                <span class="badge" [class]="'badge-' + c.status">{{ c.status }}</span>
                <span class="category">{{ formatCategory(c.category) }}</span>
                <span class="date">{{ formatDate(c.created_at) }}</span>
              </div>
              <div class="parties">
                <div class="party-row">
                  <span class="party-label">Reporter (complaint ki):</span>
                  <a [routerLink]="['/profile', c.reporter_profile_id]" target="_blank" class="party-name">
                    {{ c.reporter_first_name }} {{ c.reporter_last_name }}
                  </a>
                  <span class="party-meta">({{ c.reporter_city }})</span>
                  @if (c.reporter_email) {
                    <a [routerLink]="['/admin/profiles']" [queryParams]="{ search: c.reporter_email }" class="party-email">
                      {{ c.reporter_email }}
                    </a>
                  }
                </div>
                <div class="party-row">
                  <span class="party-label">Reported profile:</span>
                  <a [routerLink]="['/profile', c.reported_profile_id]" target="_blank" class="party-name">
                    {{ c.reported_first_name }} {{ c.reported_last_name }}
                  </a>
                  <span class="party-meta">({{ c.reported_city }})</span>
                  @if (c.reported_email) {
                    <a [routerLink]="['/admin/profiles']" [queryParams]="{ search: c.reported_email }" class="party-email">
                      {{ c.reported_email }}
                    </a>
                  }
                </div>
              </div>

              <div class="message-thread">
                <h4 class="thread-title">Messages</h4>
                @for (msg of c.messages || []; track msg.id) {
                  <div class="message-bubble" [class]="'msg-' + msg.sender_role">
                    <span class="msg-role">{{ roleLabel(msg.sender_role) }}</span>
                    <p>{{ msg.message }}</p>
                    <span class="msg-time">{{ formatDate(msg.created_at) }}</span>
                  </div>
                } @empty {
                  <p class="no-messages">No messages yet.</p>
                }
              </div>

              @if (c.status !== 'dismissed') {
                <div class="message-actions">
                  <textarea
                    class="form-textarea"
                    [(ngModel)]="adminMessages[c.id]"
                    rows="2"
                    placeholder="Message to reporter and reported user..."
                  ></textarea>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    (click)="sendMessage(c.id)"
                    [disabled]="sending() || !adminMessages[c.id]?.trim()"
                  >
                    Send Message
                  </button>
                </div>
              }

              @if (c.status === 'pending') {
                <div class="review-actions">
                  <textarea class="form-textarea" [(ngModel)]="adminNotes[c.id]" rows="2"
                    placeholder="Resolve/dismiss notes (optional — also sent as message)"></textarea>
                  <div class="btn-row">
                    <button class="btn btn-primary btn-sm" (click)="review(c.id, 'resolved')" [disabled]="reviewing()">
                      Mark Resolved
                    </button>
                    <button class="btn btn-outline btn-sm" (click)="review(c.id, 'dismissed')" [disabled]="reviewing()">
                      Dismiss
                    </button>
                  </div>
                </div>
              }
              @if (c.admin_notes) {
                <p class="admin-notes">Admin notes: {{ c.admin_notes }}</p>
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
    .admin-page h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .page-hint { color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.9rem; }
    .toolbar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
    .toolbar .form-input { flex: 1; min-width: 220px; max-width: 360px; }
    .toolbar .form-select { max-width: 200px; }
    .complaint-list { display: flex; flex-direction: column; gap: 1rem; }
    .complaint-card { padding: 1.25rem; }
    .complaint-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .category { font-weight: 600; font-size: 0.9rem; }
    .date { font-size: 0.82rem; color: var(--text-muted); margin-left: auto; }
    .parties { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
    .party-row { display: flex; flex-wrap: wrap; gap: 0.35rem 0.75rem; align-items: center; font-size: 0.85rem; }
    .party-label { color: var(--text-muted); font-weight: 500; }
    .party-name { color: var(--primary); font-weight: 600; text-decoration: none; }
    .party-name:hover { text-decoration: underline; }
    .party-meta { color: var(--text-muted); }
    .party-email { font-size: 0.82rem; color: var(--primary); text-decoration: underline; }
    .thread-title { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted); }
    .message-thread { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 8px; }
    .message-bubble {
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      font-size: 0.88rem;
    }
    .msg-admin { background: #ede9fe; border-left: 3px solid #7c3aed; }
    .msg-reporter { background: #fef3c7; border-left: 3px solid #d97706; }
    .msg-reported { background: #dbeafe; border-left: 3px solid #2563eb; }
    .msg-role { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.2rem; }
    .msg-time { font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 0.25rem; }
    .no-messages { font-size: 0.85rem; color: var(--text-muted); font-style: italic; }
    .message-actions { margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .review-actions { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .btn-row { display: flex; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; }
    .admin-notes { font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-top: 0.5rem; }
    .empty { padding: 2rem; text-align: center; color: var(--text-muted); }
    .alert { margin-top: 1rem; }
  `],
})
export class AdminComplaintsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  complaints = signal<Complaint[]>([]);
  loading = signal(true);
  reviewing = signal(false);
  sending = signal(false);
  statusFilter = 'pending';
  search = '';
  adminNotes: Record<string, string> = {};
  adminMessages: Record<string, string> = {};
  message = signal('');
  error = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getComplaints(this.statusFilter, 1, this.search.trim()).subscribe({
      next: (res) => {
        this.complaints.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  sendMessage(id: string): void {
    const text = this.adminMessages[id]?.trim();
    if (!text) return;

    this.sending.set(true);
    this.adminService.sendComplaintMessage(id, text).subscribe({
      next: () => {
        this.sending.set(false);
        this.adminMessages[id] = '';
        this.message.set('Message sent to both parties');
        this.error.set(false);
        this.load();
      },
      error: (err) => {
        this.sending.set(false);
        this.message.set(err.error?.message || 'Failed to send message');
        this.error.set(true);
      },
    });
  }

  review(id: string, status: 'resolved' | 'dismissed'): void {
    this.reviewing.set(true);
    this.adminService.reviewComplaint(id, status, this.adminNotes[id]).subscribe({
      next: () => {
        this.reviewing.set(false);
        this.message.set('Complaint updated');
        this.error.set(false);
        this.load();
      },
      error: (err) => {
        this.reviewing.set(false);
        this.message.set(err.error?.message || 'Failed to update');
        this.error.set(true);
      },
    });
  }

  roleLabel(role: string): string {
    if (role === 'admin') return 'Admin';
    if (role === 'reporter') return 'Reporter';
    if (role === 'reported') return 'Reported User';
    return role;
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
