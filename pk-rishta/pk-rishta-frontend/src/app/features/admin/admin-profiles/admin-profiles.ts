import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Profile } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-profiles',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <h1>Manage Profiles</h1>
      <div class="toolbar">
        <a routerLink="/profile/new" class="btn btn-primary btn-sm">+ Add Profile</a>
        <input
          class="form-input"
          [(ngModel)]="search"
          (keyup.enter)="searchProfiles()"
          placeholder="Search by email, name or city..."
        />
        <button type="button" class="btn btn-outline btn-sm" (click)="searchProfiles()">Search</button>
        <select class="form-select" [(ngModel)]="verifiedFilter" (change)="searchProfiles()">
          <option value="">All Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else {
        <p class="result-meta">
          Showing {{ pageStart }}–{{ pageEnd }} of {{ total() }} profiles
        </p>
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Age</th>
                <th>City</th>
                <th>Education</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of profiles(); track p.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/profile', p.id]" target="_blank" class="profile-link">
                      <strong>{{ p.first_name }} {{ p.last_name }}</strong>
                    </a>
                  </td>
                  <td class="email-cell">{{ p.email || '—' }}</td>
                  <td>{{ p.age }}</td>
                  <td>{{ p.city }}</td>
                  <td>{{ p.education || '—' }}</td>
                  <td>
                    @if (p.is_verified) {
                      <span class="badge badge-verified">✓</span>
                    } @else {
                      <button class="btn btn-primary btn-sm" (click)="verify(p)">Verify</button>
                    }
                  </td>
                  <td class="actions">
                    <a [routerLink]="['/profile', p.id, 'edit']" class="btn btn-outline btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm" (click)="deleteProfile(p)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-row">No profiles found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
              ← Prev
            </button>
            @for (p of pageNumbers(); track p) {
              @if (p === '...') {
                <span class="page-ellipsis">…</span>
              } @else {
                <button
                  type="button"
                  class="btn btn-sm page-btn"
                  [class.btn-primary]="p === page()"
                  [class.btn-outline]="p !== page()"
                  (click)="goToPage(+p)"
                >
                  {{ p }}
                </button>
              }
            }
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">
              Next →
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .admin-page h1 { font-size: 1.75rem; margin-bottom: 1.5rem; }
    .toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .toolbar .form-input { flex: 1; min-width: 220px; max-width: 360px; }
    .toolbar .form-select { max-width: 200px; }
    .result-meta { font-size: 0.88rem; color: var(--text-muted); margin: 0 0 0.75rem; }
    .table-card { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    th { font-weight: 600; color: var(--text-muted); background: var(--bg); }
    .actions { display: flex; gap: 0.5rem; }
    .email-cell { font-size: 0.85rem; color: var(--text-muted); }
    .profile-link { color: var(--primary); text-decoration: none; }
    .profile-link:hover { text-decoration: underline; }
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
export class AdminProfilesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);

  readonly pageSize = 20;

  profiles = signal<Profile[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);
  verifiedFilter = '';
  search = '';

  pageNumbers = computed(() => this.buildPageNumbers(this.page(), this.totalPages()));

  get pageStart(): number {
    if (!this.total()) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page() * this.pageSize, this.total());
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('search');
    if (q) this.search = q;
    this.load();
  }

  searchProfiles(): void {
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getProfiles(this.page(), this.verifiedFilter, this.search.trim(), this.pageSize).subscribe({
      next: (res) => {
        this.profiles.set(res.data);
        const total = res.pagination?.total ?? res.data.length;
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

  verify(p: Profile): void {
    this.adminService.verifyProfile(p.id).subscribe({
      next: () => this.profiles.update((list) => list.map((x) => x.id === p.id ? { ...x, is_verified: true } : x)),
    });
  }

  deleteProfile(p: Profile): void {
    if (!confirm(`Delete profile of ${p.first_name} ${p.last_name}?`)) return;
    this.adminService.deleteProfile(p.id).subscribe({
      next: () => {
        this.profiles.update((list) => list.filter((x) => x.id !== p.id));
        this.total.update((t) => Math.max(0, t - 1));
        if (!this.profiles().length && this.page() > 1) {
          this.goToPage(this.page() - 1);
        } else {
          this.totalPages.set(Math.max(1, Math.ceil(this.total() / this.pageSize)));
        }
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
