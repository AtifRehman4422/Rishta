import { Component, OnInit, inject, signal } from '@angular/core';
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
        <input class="form-input" [(ngModel)]="search" (keyup.enter)="load()" placeholder="Search by name or email..." />
        <select class="form-select" [(ngModel)]="statusFilter" (change)="load()">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else {
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
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page h1 { font-size: 1.75rem; margin-bottom: 1.5rem; }
    .toolbar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .toolbar .form-input { max-width: 300px; }
    .toolbar .form-select { max-width: 180px; }
    .table-card { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    th { font-weight: 600; color: var(--text-muted); background: var(--bg); }
    tr:hover td { background: rgba(11,110,79,0.02); }
  `],
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  search = '';
  statusFilter = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminService.getUsers(1, this.search, this.statusFilter).subscribe({
      next: (res) => { this.users.set(res.data); this.loading.set(false); },
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
}
