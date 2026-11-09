import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminUser } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  template: `
    <div class="admin-page">
      <h1>Manage Users</h1>
      <div class="toolbar">
        <input class="form-input" [(ngModel)]="search" (keyup.enter)="applyFilters()" placeholder="Search by name or email..." />
        <button type="button" class="btn btn-outline btn-sm" (click)="applyFilters()">Search</button>
        <select class="form-select" [(ngModel)]="statusFilter" (change)="applyFilters()">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else {
        <p class="result-meta">Showing {{ pageStart }}–{{ pageEnd }} of {{ total() }} users</p>
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>City</th>
                <th>Profile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>{{ user.first_name }} {{ user.last_name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.city || '—' }}</td>
                  <td>
                    @if (user.is_profile_complete) {
                      <span class="badge badge-verified">Complete</span>
                    } @else {
                      <span class="badge badge-pending">Incomplete</span>
                    }
                  </td>
                  <td>
                    <span class="badge" [class.badge-active]="user.is_active" [class.badge-inactive]="!user.is_active">
                      {{ user.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm" [class.btn-danger]="user.is_active" [class.btn-primary]="!user.is_active"
                      (click)="toggleStatus(user)">
                      {{ user.is_active ? 'Deactivate' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-row">No users found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">← Prev</button>
            @for (p of pageNumbers(); track $index) {
              @if (p === '...') {
                <span class="page-ellipsis">…</span>
              } @else {
                <button
                  type="button"
                  class="btn btn-sm page-btn"
                  [class.btn-primary]="p === page()"
                  [class.btn-outline]="p !== page()"
                  (click)="goToPage(+p)"
                >{{ p }}</button>
              }
            }
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .admin-page h1 { font-size: 1.75rem; margin-bottom: 1.5rem; }
    .toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .toolbar .form-input { flex: 1; min-width: 220px; max-width: 360px; }
    .toolbar .form-select { max-width: 180px; }
    .result-meta { font-size: 0.88rem; color: var(--text-muted); margin: 0 0 0.75rem; }
    .table-card { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    th { font-weight: 600; color: var(--text-muted); background: var(--bg); }
    tr:hover td { background: rgba(11,110,79,0.02); }
    .empty-row { text-align: center; color: var(--text-muted); padding: 2rem !important; }
    .pagination {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      margin-top: 1.25rem;
    }
    .page-btn { min-width: 2.25rem; }
    .page-ellipsis { padding: 0 0.35rem; color: var(--text-muted); }
  `],
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly pageSize = 20;

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);
  search = '';
  statusFilter = '';

  pageNumbers = computed(() => this.buildPageNumbers(this.page(), this.totalPages()));

  get pageStart(): number {
    if (!this.total()) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page() * this.pageSize, this.total());
  }

  ngOnInit(): void { this.load(); }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  goToPage(next: number): void {
    if (next < 1 || next > this.totalPages() || next === this.page()) return;
    this.page.set(next);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getUsers(this.page(), this.search.trim(), this.statusFilter, this.pageSize).subscribe({
      next: (res) => {
        this.users.set(res.data || []);
        const total = res.pagination?.total ?? res.data?.length ?? 0;
        const limit = res.pagination?.limit ?? this.pageSize;
        const pages = res.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));
        this.total.set(total);
        this.totalPages.set(pages);
        if (this.page() > pages) this.page.set(pages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleStatus(user: AdminUser): void {
    this.adminService.toggleUserStatus(user.id).subscribe({
      next: (res) => {
        this.users.update((list) =>
          list.map((u) => u.id === user.id ? { ...u, is_active: res.data.is_active } : u)
        );
      },
    });
  }

  private buildPageNumbers(current: number, total: number): (number | string)[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('...');
    pages.push(total);
    return pages;
  }
}
