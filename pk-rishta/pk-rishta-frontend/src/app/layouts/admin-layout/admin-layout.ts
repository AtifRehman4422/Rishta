import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ScrollToTopComponent } from '../../shared/components/scroll-to-top/scroll-to-top';
import { ScrollContainerDirective } from '../../shared/directives/scroll-container.directive';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ScrollToTopComponent, ScrollContainerDirective],  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="/images/logo.png" alt="PK Rishta" class="sidebar-logo" />
          <div>
            <span class="admin-badge">Admin Panel</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <span class="nav-icon">📊</span> Dashboard
          </a>
          <a routerLink="/admin/users" routerLinkActive="active">
            <span class="nav-icon">👥</span> Users
          </a>
          <a routerLink="/admin/profiles" routerLinkActive="active">
            <span class="nav-icon">💑</span> Profiles
          </a>
          <a routerLink="/admin/contact-requests" routerLinkActive="active">
            <span class="nav-icon">📞</span> Contact Requests
          </a>
          <a routerLink="/admin/contact-messages" routerLinkActive="active">
            <span class="nav-icon">✉️</span> Contact Messages
          </a>
          <a routerLink="/admin/dropdowns" routerLinkActive="active">
            <span class="nav-icon">📋</span> Dropdown Options
          </a>
          <a routerLink="/admin/complaints" routerLinkActive="active">
            <span class="nav-icon">⚠️</span> Complaints
          </a>
          <a routerLink="/" class="back-link">
            <span class="nav-icon">🏠</span> Back to Site
          </a>
        </nav>
        <div class="sidebar-footer">
          <p class="admin-email-label">Logged in as</p>
          <p class="admin-email">{{ auth.currentUser()?.email }}</p>
          <button class="btn btn-ghost btn-sm" (click)="auth.logout()">Logout</button>
        </div>
      </aside>
      <div class="admin-content">
        <header class="admin-topbar">
          <span class="topbar-label">Admin</span>
          <span class="topbar-email">{{ auth.currentUser()?.email }}</span>
        </header>
        <main class="admin-main" appScrollContainer>
          <router-outlet />
        </main>
      </div>
      <app-scroll-to-top />
    </div>  `,
  styles: [`
    .admin-layout { display: flex; height: 100vh; overflow: hidden; }
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #6B0F1A, #9B1B30);
      color: white; display: flex; flex-direction: column; position: fixed;
      top: 0; left: 0; bottom: 0; z-index: 100;
    }
    .sidebar-header {
      padding: 1.5rem; display: flex; align-items: center; gap: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-logo {
      height: 48px;
      width: auto;
      max-width: 140px;
      object-fit: contain;
      object-position: left center;
      background: transparent;
    }
    .sidebar-header h2 { display: none; }
    .admin-badge {
      font-size: 0.7rem; background: rgba(255,255,255,0.15);
      padding: 0.15rem 0.5rem; border-radius: 50px;
    }
    .sidebar-nav { flex: 1; padding: 1rem 0; }
    .sidebar-nav a {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.85rem 1.5rem; color: rgba(255,255,255,0.75);
      text-decoration: none; transition: all 0.2s ease; font-size: 0.95rem;
    }
    .sidebar-nav a:hover, .sidebar-nav a.active {
      background: rgba(255,255,255,0.1); color: white;
      border-right: 3px solid var(--secondary);
    }
    .nav-icon { font-size: 1.1rem; }
    .back-link { margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem !important; }
    .sidebar-footer {
      padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 0.8rem;
    }
    .admin-email-label { opacity: 0.65; font-size: 0.72rem; margin-bottom: 0.15rem; }
    .admin-email { font-weight: 600; word-break: break-all; margin-bottom: 0.75rem; }
    .admin-content { flex: 1; margin-left: 260px; display: flex; flex-direction: column; min-width: 0; }
    .admin-topbar {
      flex-shrink: 0;
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 2rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
    }
    .topbar-label {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      color: var(--primary); letter-spacing: 0.04em;
    }
    .topbar-email { font-size: 0.9rem; color: var(--text-muted); word-break: break-all; }
    .admin-main {
      flex: 1; padding: 2rem;
      background: var(--bg);
      overflow-y: auto; overflow-x: hidden;
      min-height: 0;
    }
    @media (max-width: 768px) {
      .sidebar { width: 70px; }
      .sidebar-header div, .sidebar-nav a span:not(.nav-icon), .sidebar-footer { display: none; }
      .admin-content { margin-left: 70px; }
      .admin-topbar { padding: 0.75rem 1rem; }
      .admin-main { padding: 1rem; }
    }
  `],
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
}
