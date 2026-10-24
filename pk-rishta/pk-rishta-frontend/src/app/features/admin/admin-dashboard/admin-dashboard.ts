import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminStats } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { AdminVisitorAnalyticsComponent } from '../admin-visitor-analytics/admin-visitor-analytics';

interface StatCard {
  icon: string;
  value: number;
  displayValue: number;
  label: string;
  route?: string;
  accent: string;
  group: string;
  pulse?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, NgTemplateOutlet, AdminVisitorAnalyticsComponent],
  template: `
    <div class="admin-page">
      <header class="dash-header animate-fade-in-up">
        <div>
          <h1>Admin Dashboard</h1>
          <p class="page-desc">Overview of Hum Rishta platform</p>
        </div>
        <div class="header-badge">
          <span class="live-dot"></span>
          Live Stats
        </div>
      </header>

      <app-admin-visitor-analytics />

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (statCards().length) {
        @for (group of groups; track group) {
          <section class="stat-section animate-fade-in-up" [class]="'delay-' + ($index + 1)">
            <h2 class="section-label">{{ group }}</h2>
            <div class="stats-grid">
              @for (card of cardsInGroup(group); track card.label) {
                @if (card.route) {
                  <a
                    class="stat-card card"
                    [routerLink]="card.route"
                    [style.--accent]="card.accent"
                    [class.stat-pulse]="card.pulse"
                  >
                    <ng-container *ngTemplateOutlet="cardInner; context: { $implicit: card }" />
                    <span class="stat-go">Open →</span>
                  </a>
                } @else {
                  <div class="stat-card card stat-static" [style.--accent]="card.accent">
                    <ng-container *ngTemplateOutlet="cardInner; context: { $implicit: card }" />
                  </div>
                }
              }
            </div>
          </section>
        }
      }

      <ng-template #cardInner let-card>
        <div class="stat-top">
          <span class="stat-icon">{{ card.icon }}</span>
          <span class="stat-accent-bar"></span>
        </div>
        <h2 class="stat-value">{{ card.displayValue }}</h2>
        <p class="stat-label">{{ card.label }}</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .admin-page { padding-bottom: 2rem; }

    .dash-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .dash-header h1 { font-size: 1.85rem; margin-bottom: 0.25rem; color: var(--primary); }
    .page-desc { color: var(--text-muted); margin: 0; font-size: 0.95rem; }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 1rem;
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border: 1px solid #86efac;
      border-radius: 50px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #15803d;
    }
    .live-dot {
      width: 8px; height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: live-pulse 2s ease infinite;
    }
    @keyframes live-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
      50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
    }

    .stat-section { margin-bottom: 2rem; }
    .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.85rem;
      padding-left: 0.25rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.15rem;
    }

    .stat-card {
      position: relative;
      padding: 1.35rem 1.25rem 1.15rem;
      text-decoration: none;
      color: inherit;
      overflow: hidden;
      border: 1px solid var(--border);
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease, border-color 0.3s ease;
      animation: card-rise 0.55s ease backwards;
    }
    .stat-card:nth-child(1) { animation-delay: 0.05s; }
    .stat-card:nth-child(2) { animation-delay: 0.1s; }
    .stat-card:nth-child(3) { animation-delay: 0.15s; }
    @keyframes card-rise {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--accent, var(--primary));
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.35s ease;
    }
    .stat-card:not(.stat-static):hover {
      transform: translateY(-5px);
      box-shadow: 0 14px 36px rgba(155, 27, 48, 0.12);
      border-color: rgba(155, 27, 48, 0.2);
    }
    .stat-card:not(.stat-static):hover::before { transform: scaleX(1); }
    .stat-card:not(.stat-static):hover .stat-go { opacity: 1; transform: translateX(0); }

    .stat-pulse {
      animation: card-rise 0.55s ease backwards, urgent-pulse 2.5s ease-in-out infinite 0.6s;
    }
    @keyframes urgent-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
      50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15); }
    }

    .stat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .stat-icon {
      font-size: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px; height: 44px;
      background: color-mix(in srgb, var(--accent, var(--primary)) 12%, white);
      border-radius: 12px;
      transition: transform 0.3s ease;
    }
    .stat-card:hover .stat-icon { transform: scale(1.08) rotate(-3deg); }
    .stat-accent-bar {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--accent, var(--primary));
      opacity: 0.6;
    }

    .stat-value {
      font-size: 2.1rem;
      font-weight: 800;
      color: var(--primary);
      line-height: 1.1;
      margin-bottom: 0.2rem;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 500;
      margin: 0;
    }

    .stat-go {
      position: absolute;
      bottom: 0.85rem;
      right: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--accent, var(--primary));
      opacity: 0;
      transform: translateX(-6px);
      transition: all 0.3s ease;
    }

    .stat-static { cursor: default; }

    @media (max-width: 992px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 520px) { .stats-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  statCards = signal<StatCard[]>([]);
  loading = signal(true);
  groups = ['Users', 'Profiles', 'Engagement', 'Traffic', 'Actions'];

  ngOnInit(): void {
    this.adminService.getDashboard().subscribe({
      next: (res) => {
        const s = res.data;
        const cards: StatCard[] = [
          { icon: '👥', value: +s.total_users, displayValue: 0, label: 'Total Users', route: '/admin/users', accent: '#9B1B30', group: 'Users' },
          { icon: '✅', value: +s.active_users, displayValue: 0, label: 'Active Users', route: '/admin/users', accent: '#15803d', group: 'Users' },
          { icon: '🚫', value: +s.inactive_users, displayValue: 0, label: 'Inactive Users', route: '/admin/users', accent: '#b91c1c', group: 'Users' },
          { icon: '💑', value: +s.total_profiles, displayValue: 0, label: 'Total Profiles', route: '/admin/profiles', accent: '#7A1528', group: 'Profiles' },
          { icon: '✓', value: +s.verified_profiles, displayValue: 0, label: 'Verified Profiles', route: '/admin/profiles', accent: '#0d9488', group: 'Profiles' },
          { icon: '⏳', value: +s.unverified_profiles, displayValue: 0, label: 'Pending Verification', route: '/admin/profiles', accent: '#d97706', group: 'Profiles' },
          { icon: '💌', value: +(s.total_contact_requests || 0), displayValue: 0, label: 'Contact Requests', route: '/admin/contact-requests', accent: '#be185d', group: 'Engagement' },
          { icon: '⏳', value: +s.pending_contact_requests, displayValue: 0, label: 'Pending Requests', route: '/admin/contact-requests', accent: '#ca8a04', group: 'Engagement' },
          { icon: '🆕', value: +s.new_users_week, displayValue: 0, label: 'New This Week', route: '/admin/users', accent: '#2563eb', group: 'Engagement' },
          {
            icon: '👁️',
            value: +(s.visitors_today || 0),
            displayValue: 0,
            label: 'Visitors Today',
            accent: '#0f766e',
            group: 'Traffic',
            pulse: +(s.visitors_today || 0) > 0,
          },
          {
            icon: '📄',
            value: +(s.page_views_today || 0),
            displayValue: 0,
            label: 'Page Views Today',
            accent: '#0369a1',
            group: 'Traffic',
          },
          {
            icon: '📆',
            value: +(s.visitors_yesterday || 0),
            displayValue: 0,
            label: 'Visitors Yesterday',
            accent: '#64748b',
            group: 'Traffic',
          },
          {
            icon: '📞',
            value: +(s.pending_contact_requests || 0),
            displayValue: 0,
            label: 'Pending Contact Requests',
            route: '/admin/contact-requests',
            accent: '#9B1B30',
            group: 'Actions',
            pulse: +(s.pending_contact_requests || 0) > 0,
          },
          {
            icon: '✉️',
            value: +(s.new_contact_messages || 0),
            displayValue: 0,
            label: 'New Contact Messages',
            route: '/admin/contact-messages',
            accent: '#2563eb',
            group: 'Actions',
            pulse: +(s.new_contact_messages || 0) > 0,
          },
          {
            icon: '⚠️',
            value: +(s.pending_complaints || 0),
            displayValue: 0,
            label: 'Pending Complaints',
            route: '/admin/complaints',
            accent: '#ea580c',
            group: 'Actions',
            pulse: +(s.pending_complaints || 0) > 0,
          },
        ];
        this.statCards.set(cards);
        this.loading.set(false);
        this.animateCounters(cards);
      },
      error: () => this.loading.set(false),
    });
  }

  cardsInGroup(group: string): StatCard[] {
    return this.statCards().filter((c) => c.group === group);
  }

  private animateCounters(cards: StatCard[]): void {
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const updated = cards.map((card) => ({
        ...card,
        displayValue: Math.round(card.value * eased),
      }));
      this.statCards.set(updated);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }
}
