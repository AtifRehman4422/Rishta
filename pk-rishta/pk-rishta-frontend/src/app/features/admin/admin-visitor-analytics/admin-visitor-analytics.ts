import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AdminService,
  AdminVisitorDetail,
  AdminVisitorRow,
} from '../../../core/services/admin.service';

type GapKey = 'new' | 'daily' | 'skip_1' | 'skip_2' | 'skip_3' | 'skip_4_plus';

const GAP_META: { key: GapKey; label: string; hint: string; color: string }[] = [
  { key: 'new', label: 'New visitors', hint: 'First seen in range', color: '#2563eb' },
  { key: 'daily', label: 'Came next day', hint: 'Returned next calendar day', color: '#15803d' },
  { key: 'skip_1', label: 'Skipped 1 day', hint: 'Returned after 1 day gap', color: '#ca8a04' },
  { key: 'skip_2', label: 'Skipped 2 days', hint: 'Returned after 2 days', color: '#ea580c' },
  { key: 'skip_3', label: 'Skipped 3 days', hint: 'Returned after 3 days', color: '#be185d' },
  { key: 'skip_4_plus', label: 'Skipped 4+ days', hint: 'Longer gap returns', color: '#7c3aed' },
];

@Component({
  selector: 'app-admin-visitor-analytics',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <section class="va-panel animate-fade-in-up">
      <div class="va-head">
        <div>
          <h2>Visitor Analytics</h2>
          <p>Daily traffic, return gaps, searches &amp; profile views</p>
        </div>
        <div class="va-filters">
          <label>
            <span>From</span>
            <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="reload()" />
          </label>
          <label>
            <span>To</span>
            <input type="date" class="form-input" [(ngModel)]="toDate" (change)="reload()" />
          </label>
          <button type="button" class="btn btn-outline btn-sm" (click)="setPreset(7)">7 days</button>
          <button type="button" class="btn btn-outline btn-sm" (click)="setPreset(14)">14 days</button>
          <button type="button" class="btn btn-outline btn-sm" (click)="setPreset(30)">30 days</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else {
        <div class="va-summary">
          <div class="va-kpi">
            <span class="va-kpi-label">Unique visits</span>
            <strong class="va-kpi-value">{{ totalVisitors() }}</strong>
          </div>
          <div class="va-kpi">
            <span class="va-kpi-label">Page views</span>
            <strong class="va-kpi-value">{{ totalPageViews() }}</strong>
          </div>
          <div class="va-kpi">
            <span class="va-kpi-label">Peak day</span>
            <strong class="va-kpi-value">{{ peakDayLabel() }}</strong>
          </div>
        </div>

        <div class="va-charts">
          <div class="va-card">
            <div class="va-card-head">
              <h3>Daily visitors</h3>
              <span>Click a bar for that day's users</span>
            </div>
            <div class="va-bars" role="img" aria-label="Daily visitors bar chart">
              @for (day of daily(); track day.date; let i = $index) {
                <button
                  type="button"
                  class="va-bar-col"
                  [class.active]="selectedDay() === day.date"
                  [title]="day.date + ': ' + day.visitors + ' visitors'"
                  (click)="openDay(day.date)"
                  [style.animation-delay]="(i * 30) + 'ms'"
                >
                  <span class="va-bar-value">{{ day.visitors || '' }}</span>
                  <span
                    class="va-bar"
                    [style.height.%]="barHeight(day.visitors, maxDailyVisitors())"
                    [style.--bar-color]="'#9B1B30'"
                  ></span>
                  <span class="va-bar-label">{{ shortDate(day.date) }}</span>
                </button>
              }
            </div>
          </div>

          <div class="va-card">
            <div class="va-card-head">
              <h3>Return pattern</h3>
              <span>Who came daily vs after skipping days</span>
            </div>
            <div class="va-gap-bars">
              @for (g of gapBars(); track g.key; let i = $index) {
                <button
                  type="button"
                  class="va-gap-row"
                  [class.active]="selectedGap() === g.key"
                  (click)="openGap(g.key)"
                  [style.animation-delay]="(i * 50) + 'ms'"
                >
                  <div class="va-gap-meta">
                    <strong>{{ g.label }}</strong>
                    <small>{{ g.hint }}</small>
                  </div>
                  <div class="va-gap-track">
                    <span
                      class="va-gap-fill"
                      [style.width.%]="barHeight(g.value, maxGap())"
                      [style.background]="g.color"
                    ></span>
                  </div>
                  <span class="va-gap-count">{{ g.value }}</span>
                </button>
              }
            </div>
          </div>
        </div>

        @if (listTitle()) {
          <div class="va-list-card animate-fade-in-up">
            <div class="va-list-head">
              <div>
                <h3>{{ listTitle() }}</h3>
                <p>
                  {{ filteredVisitors().length }} visitor{{ filteredVisitors().length === 1 ? '' : 's' }}
                  @if (filteredVisitors().length) {
                    · showing {{ pageStart() }}–{{ pageEnd() }}
                  }
                </p>
              </div>
              <input
                class="form-input va-search"
                placeholder="Filter by name or email..."
                [ngModel]="listQuery()"
                (ngModelChange)="onListQueryChange($event)"
              />
            </div>

            @if (listLoading()) {
              <div class="loading-center compact"><div class="spinner"></div></div>
            } @else if (!filteredVisitors().length) {
              <p class="va-empty">No visitors in this selection.</p>
            } @else {
              <div class="va-table-wrap">
                <table class="va-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Page views</th>
                      <th>Searches</th>
                      <th>Profiles viewed</th>
                      <th>Last path</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (v of pagedVisitors(); track v.visitor_key) {
                      <tr>
                        <td>
                          <div class="va-user">
                            <strong>{{ v.display_name }}</strong>
                            @if (v.email) {
                              <small>{{ v.email }}</small>
                            }
                          </div>
                        </td>
                        <td>{{ v.page_views }}</td>
                        <td>{{ v.searches_count }}</td>
                        <td>{{ v.profile_views_count }}</td>
                        <td><code>{{ v.last_path || '—' }}</code></td>
                        <td>
                          <button type="button" class="btn btn-primary btn-sm" (click)="openDetail(v)">
                            History
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (totalPages() > 1) {
                <div class="va-pagination">
                  <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    [disabled]="page() <= 1"
                    (click)="goToPage(page() - 1)"
                  >← Prev</button>
                  @for (p of pageNumbers(); track $index) {
                    @if (p === '...') {
                      <span class="va-page-ellipsis">…</span>
                    } @else {
                      <button
                        type="button"
                        class="btn btn-sm va-page-btn"
                        [class.btn-primary]="p === page()"
                        [class.btn-outline]="p !== page()"
                        (click)="goToPage(+p)"
                      >{{ p }}</button>
                    }
                  }
                  <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    [disabled]="page() >= totalPages()"
                    (click)="goToPage(page() + 1)"
                  >Next →</button>
                </div>
              }
            }
          </div>
        }
      }
    </section>

    @if (detailOpen()) {
      <div class="va-drawer-overlay" (click)="closeDetail()">
        <aside class="va-drawer" (click)="$event.stopPropagation()">
          <div class="va-drawer-head">
            <div>
              <h3>{{ detailTitle() }}</h3>
              <p>{{ fromDate }} → {{ toDate }}</p>
            </div>
            <button type="button" class="va-close" (click)="closeDetail()" aria-label="Close">✕</button>
          </div>

          @if (detailLoading()) {
            <div class="loading-center"><div class="spinner"></div></div>
          } @else if (detail()) {
            <div class="va-drawer-body">
              <div class="va-detail-kpis">
                <div><span>Visit days</span><strong>{{ detail()!.meta?.visit_days || detail()!.visit_days.length }}</strong></div>
                <div><span>Page views</span><strong>{{ detail()!.meta?.page_views || 0 }}</strong></div>
                <div><span>Searches</span><strong>{{ detail()!.searches.length }}</strong></div>
                <div><span>Profiles</span><strong>{{ detail()!.profile_views.length }}</strong></div>
              </div>

              <h4>Search history</h4>
              @if (!detail()!.searches.length) {
                <p class="va-empty">No searches recorded in this range.</p>
              } @else {
                <ul class="va-timeline">
                  @for (s of detail()!.searches; track s.id) {
                    <li>
                      <time>{{ s.created_at | date: 'medium' }}</time>
                      <p>{{ s.summary }}</p>
                    </li>
                  }
                </ul>
              }

              <h4>Profiles viewed</h4>
              @if (!detail()!.profile_views.length) {
                <p class="va-empty">No profile views recorded in this range.</p>
              } @else {
                <ul class="va-timeline">
                  @for (p of detail()!.profile_views; track p.id) {
                    <li>
                      <time>{{ p.created_at | date: 'medium' }}</time>
                      <p>
                        <a [routerLink]="['/profile', p.profile_id]" (click)="closeDetail()">
                          {{ p.first_name }} {{ p.last_name }}
                        </a>
                        @if (p.city) {
                          <span class="va-muted"> · {{ p.city }}</span>
                        }
                      </p>
                    </li>
                  }
                </ul>
              }

              <h4>Visit days</h4>
              <ul class="va-timeline">
                @for (d of detail()!.visit_days; track d.visit_date) {
                  <li>
                    <time>{{ d.visit_date }}</time>
                    <p>{{ d.page_views }} page views · {{ d.last_path || '—' }}</p>
                  </li>
                }
              </ul>
            </div>
          }
        </aside>
      </div>
    }
  `,
  styles: [`
    .va-panel {
      margin-top: 0.5rem;
      margin-bottom: 2.5rem;
      padding: 1.35rem 1.4rem 1.5rem;
      border-radius: 18px;
      background:
        radial-gradient(ellipse 70% 80% at 100% 0%, rgba(212, 175, 55, 0.12), transparent 55%),
        linear-gradient(165deg, #fffefb, #fff8f4 60%, #fff);
      border: 1px solid rgba(155, 27, 48, 0.1);
      box-shadow: 0 12px 36px rgba(58, 8, 18, 0.06);
    }
    .va-head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .va-head h2 {
      margin: 0 0 0.2rem;
      font-size: 1.35rem;
      color: var(--primary, #9B1B30);
    }
    .va-head p { margin: 0; color: var(--text-muted); font-size: 0.9rem; }
    .va-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      align-items: flex-end;
    }
    .va-filters label {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .va-filters .form-input {
      min-width: 145px;
      padding: 0.45rem 0.65rem;
      border-radius: 10px;
    }

    .va-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.15rem;
    }
    .va-kpi {
      padding: 0.9rem 1rem;
      border-radius: 14px;
      background: rgba(155, 27, 48, 0.04);
      border: 1px solid rgba(155, 27, 48, 0.08);
      animation: va-rise 0.45s ease both;
    }
    .va-kpi-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .va-kpi-value {
      font-size: 1.35rem;
      color: #5A0E1A;
      font-variant-numeric: tabular-nums;
    }

    .va-charts {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: 1rem;
    }
    .va-card {
      padding: 1rem;
      border-radius: 14px;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }
    .va-card-head {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: baseline;
      margin-bottom: 0.85rem;
      flex-wrap: wrap;
    }
    .va-card-head h3 { margin: 0; font-size: 1rem; color: #5A0E1A; }
    .va-card-head span { font-size: 0.78rem; color: var(--text-muted); }

    .va-bars {
      display: flex;
      align-items: flex-end;
      gap: 0.35rem;
      min-height: 200px;
      padding: 0.5rem 0.15rem 0;
      overflow-x: auto;
    }
    .va-bar-col {
      flex: 1 1 28px;
      min-width: 28px;
      max-width: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      animation: va-rise 0.5s ease both;
    }
    .va-bar {
      width: 100%;
      min-height: 4px;
      border-radius: 8px 8px 4px 4px;
      background: linear-gradient(180deg, #D4AF37, var(--bar-color, #9B1B30));
      transition: height 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s ease, filter 0.2s ease;
      box-shadow: 0 6px 14px rgba(155, 27, 48, 0.18);
    }
    .va-bar-col:hover .va-bar,
    .va-bar-col.active .va-bar {
      transform: scaleX(1.08);
      filter: brightness(1.08);
    }
    .va-bar-col.active .va-bar {
      outline: 2px solid rgba(212, 175, 55, 0.7);
      outline-offset: 2px;
    }
    .va-bar-value {
      font-size: 0.68rem;
      font-weight: 700;
      color: #5A0E1A;
      min-height: 0.9rem;
    }
    .va-bar-label {
      font-size: 0.62rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .va-gap-bars { display: flex; flex-direction: column; gap: 0.55rem; }
    .va-gap-row {
      display: grid;
      grid-template-columns: 1.2fr 1.6fr auto;
      gap: 0.65rem;
      align-items: center;
      padding: 0.55rem 0.65rem;
      border-radius: 12px;
      border: 1px solid transparent;
      background: rgba(155, 27, 48, 0.03);
      cursor: pointer;
      text-align: left;
      animation: va-rise 0.45s ease both;
      transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
    }
    .va-gap-row:hover,
    .va-gap-row.active {
      border-color: rgba(212, 175, 55, 0.45);
      background: #fffaf3;
      transform: translateX(2px);
    }
    .va-gap-meta strong { display: block; font-size: 0.84rem; color: #3f1a22; }
    .va-gap-meta small { color: var(--text-muted); font-size: 0.72rem; }
    .va-gap-track {
      height: 10px;
      border-radius: 99px;
      background: rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .va-gap-fill {
      display: block;
      height: 100%;
      border-radius: 99px;
      min-width: 4px;
      transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .va-gap-count {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      color: #5A0E1A;
      min-width: 2rem;
      text-align: right;
    }

    .va-list-card {
      margin-top: 1.15rem;
      padding: 1rem;
      border-radius: 14px;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
    .va-list-head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 0.85rem;
    }
    .va-list-head h3 { margin: 0 0 0.15rem; font-size: 1.05rem; color: #5A0E1A; }
    .va-list-head p { margin: 0; color: var(--text-muted); font-size: 0.85rem; }
    .va-search { max-width: 260px; border-radius: 10px; }
    .va-table-wrap { overflow-x: auto; }
    .va-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .va-table th {
      text-align: left;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      padding: 0.55rem 0.4rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    .va-table td {
      padding: 0.7rem 0.4rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      vertical-align: middle;
    }
    .va-user { display: flex; flex-direction: column; gap: 0.1rem; }
    .va-user small { color: var(--text-muted); }
    .va-table code {
      font-size: 0.75rem;
      background: rgba(155, 27, 48, 0.06);
      padding: 0.15rem 0.4rem;
      border-radius: 6px;
    }
    .va-empty { color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0; }
    .loading-center.compact { padding: 1.5rem; }
    .va-pagination {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
    }
    .va-page-btn { min-width: 2.25rem; }
    .va-page-ellipsis { padding: 0 0.3rem; color: var(--text-muted); }

    .va-drawer-overlay {
      position: fixed;
      inset: 0;
      z-index: 2200;
      background: rgba(45, 8, 16, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: flex-end;
      animation: va-fade 0.25s ease;
    }
    .va-drawer {
      width: min(460px, 100%);
      height: 100%;
      background: linear-gradient(180deg, #fffefb, #fff8f3);
      box-shadow: -12px 0 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      animation: va-slide 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .va-drawer-head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.15rem 1.25rem;
      border-bottom: 1px solid rgba(155, 27, 48, 0.1);
    }
    .va-drawer-head h3 { margin: 0 0 0.2rem; color: #5A0E1A; }
    .va-drawer-head p { margin: 0; color: var(--text-muted); font-size: 0.82rem; }
    .va-close {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid rgba(155, 27, 48, 0.15);
      background: #fff;
      cursor: pointer;
      font-size: 1rem;
    }
    .va-drawer-body {
      padding: 1.1rem 1.25rem 2rem;
      overflow-y: auto;
    }
    .va-detail-kpis {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.55rem;
      margin-bottom: 1.15rem;
    }
    .va-detail-kpis div {
      padding: 0.7rem 0.8rem;
      border-radius: 12px;
      background: rgba(155, 27, 48, 0.05);
      border: 1px solid rgba(155, 27, 48, 0.08);
    }
    .va-detail-kpis span {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.15rem;
    }
    .va-detail-kpis strong { font-size: 1.15rem; color: #5A0E1A; }
    .va-drawer-body h4 {
      margin: 1rem 0 0.55rem;
      font-size: 0.92rem;
      color: #5A0E1A;
    }
    .va-timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .va-timeline li {
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      animation: va-rise 0.35s ease both;
    }
    .va-timeline time {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 0.2rem;
    }
    .va-timeline p { margin: 0; font-size: 0.88rem; line-height: 1.45; }
    .va-timeline a { color: var(--primary, #9B1B30); font-weight: 700; text-decoration: none; }
    .va-muted { color: var(--text-muted); font-weight: 500; }

    @keyframes va-rise {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes va-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes va-slide {
      from { transform: translateX(24px); opacity: 0.6; }
      to { transform: translateX(0); opacity: 1; }
    }

    @media (max-width: 980px) {
      .va-charts { grid-template-columns: 1fr; }
      .va-summary { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .va-gap-row { grid-template-columns: 1fr; }
      .va-gap-count { text-align: left; }
    }
  `],
})
export class AdminVisitorAnalyticsComponent implements OnInit {
  private readonly admin = inject(AdminService);

  fromDate = '';
  toDate = '';
  readonly pageSize = 10;

  loading = signal(true);
  listLoading = signal(false);
  detailLoading = signal(false);
  detailOpen = signal(false);
  listQuery = signal('');
  page = signal(1);

  daily = signal<{ date: string; visitors: number; page_views: number }[]>([]);
  gaps = signal<Record<GapKey, number>>({
    new: 0,
    daily: 0,
    skip_1: 0,
    skip_2: 0,
    skip_3: 0,
    skip_4_plus: 0,
  });
  totalVisitors = signal(0);
  totalPageViews = signal(0);

  selectedDay = signal<string | null>(null);
  selectedGap = signal<GapKey | null>(null);
  visitors = signal<AdminVisitorRow[]>([]);
  detail = signal<AdminVisitorDetail | null>(null);
  detailVisitor = signal<AdminVisitorRow | null>(null);

  maxDailyVisitors = computed(() => Math.max(1, ...this.daily().map((d) => d.visitors)));
  gapBars = computed(() =>
    GAP_META.map((g) => ({ ...g, value: this.gaps()[g.key] || 0 }))
  );
  maxGap = computed(() => Math.max(1, ...this.gapBars().map((g) => g.value)));
  peakDayLabel = computed(() => {
    const days = this.daily();
    if (!days.length) return '—';
    const peak = days.reduce((a, b) => (b.visitors > a.visitors ? b : a), days[0]);
    return peak.visitors ? `${this.shortDate(peak.date)} (${peak.visitors})` : '—';
  });
  listTitle = computed(() => {
    if (this.selectedDay()) return `Visitors on ${this.selectedDay()}`;
    if (this.selectedGap()) {
      const meta = GAP_META.find((g) => g.key === this.selectedGap());
      return meta ? meta.label : 'Visitors';
    }
    return '';
  });
  filteredVisitors = computed(() => {
    const q = this.listQuery().trim().toLowerCase();
    const list = this.visitors();
    if (!q) return list;
    return list.filter((v) =>
      `${v.display_name} ${v.email || ''}`.toLowerCase().includes(q)
    );
  });
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredVisitors().length / this.pageSize))
  );
  pageStart = computed(() => {
    if (!this.filteredVisitors().length) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  });
  pageEnd = computed(() =>
    Math.min(this.page() * this.pageSize, this.filteredVisitors().length)
  );
  pagedVisitors = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredVisitors().slice(start, start + this.pageSize);
  });
  pageNumbers = computed(() => this.buildPageNumbers(this.page(), this.totalPages()));
  detailTitle = computed(() => {
    const v = this.detailVisitor();
    const d = this.detail();
    if (d?.user?.first_name) {
      return `${d.user.first_name}${d.user.last_name ? ` ${d.user.last_name}` : ''}`;
    }
    return v?.display_name || d?.user?.email || 'Visitor history';
  });

  ngOnInit(): void {
    this.setPreset(14);
  }

  setPreset(days: number): void {
    const to = this.todayIso();
    const from = this.addDays(to, -(days - 1));
    this.fromDate = from;
    this.toDate = to;
    this.reload();
  }

  onListQueryChange(value: string): void {
    this.listQuery.set(value);
    this.page.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
  }

  reload(): void {
    if (!this.fromDate || !this.toDate || this.fromDate > this.toDate) return;
    this.loading.set(true);
    this.selectedDay.set(null);
    this.selectedGap.set(null);
    this.visitors.set([]);
    this.listQuery.set('');
    this.page.set(1);
    this.admin.getVisitorAnalytics(this.fromDate, this.toDate).subscribe({
      next: (res) => {
        const data = res.data;
        this.daily.set(data.daily || []);
        this.gaps.set({
          new: data.return_gaps?.new || 0,
          daily: data.return_gaps?.daily || 0,
          skip_1: data.return_gaps?.skip_1 || 0,
          skip_2: data.return_gaps?.skip_2 || 0,
          skip_3: data.return_gaps?.skip_3 || 0,
          skip_4_plus: data.return_gaps?.skip_4_plus || 0,
        });
        this.totalVisitors.set(data.total_visitors || 0);
        this.totalPageViews.set(data.total_page_views || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openDay(date: string): void {
    this.selectedDay.set(date);
    this.selectedGap.set(null);
    this.listQuery.set('');
    this.page.set(1);
    this.listLoading.set(true);
    this.admin.getDayVisitors(date).subscribe({
      next: (res) => {
        this.visitors.set(res.data.visitors || []);
        this.listLoading.set(false);
      },
      error: () => {
        this.visitors.set([]);
        this.listLoading.set(false);
      },
    });
  }

  openGap(gap: GapKey): void {
    this.selectedGap.set(gap);
    this.selectedDay.set(null);
    this.listQuery.set('');
    this.page.set(1);
    this.listLoading.set(true);
    this.admin.getGapVisitors(gap, this.fromDate, this.toDate).subscribe({
      next: (res) => {
        this.visitors.set(res.data.visitors || []);
        this.listLoading.set(false);
      },
      error: () => {
        this.visitors.set([]);
        this.listLoading.set(false);
      },
    });
  }

  openDetail(visitor: AdminVisitorRow): void {
    this.detailVisitor.set(visitor);
    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.detail.set(null);
    this.admin.getVisitorDetail(visitor.visitor_key, this.fromDate, this.toDate).subscribe({
      next: (res) => {
        this.detail.set(res.data);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.detail.set(null);
    this.detailVisitor.set(null);
  }

  barHeight(value: number, max: number): number {
    if (!value) return 4;
    return Math.max(8, Math.round((value / max) * 100));
  }

  shortDate(iso: string): string {
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}`;
  }

  private todayIso(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
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
