import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Profile } from '../../core/models';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { VisitService } from '../../core/services/visit.service';
import { SeoService } from '../../core/services/seo.service';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot';
import { ADSENSE_SLOTS, isAdSenseReady } from '../../core/constants/adsense';
import {
  ALL_LOCATION_PROVINCES,
  OVERSEAS_COUNTRIES,
  citiesForProvince,
  isOverseasProvince,
  provinceLabel,
} from '../../core/constants/pakistan-locations';
import { EDUCATION_OPTIONS } from '../../core/constants/education';
import { RELIGION_OPTIONS } from '../../core/constants/religion-sects';

interface SearchFilters {
  gender: string;
  city: string;
  province: string;
  country: string;
  marital_status: string;
  religion: string;
  education: string;
  min_age: string;
  max_age: string;
}

@Component({
  selector: 'app-search',
  imports: [FormsModule, RouterLink, ProfileCardComponent, AdSlotComponent],
  template: `
    <div class="bg-page-header">
      <div class="container">
        <h1 class="animate-fade-in-up">{{ matchingMode() ? 'AI Matching Profiles' : 'Search Rishta Profiles' }}</h1>
        <p class="text-urdu animate-fade-in-up delay-1">{{ matchingMode() ? 'آپ کے لیے موزوں رشتے' : 'پاکستان میں رشتہ تلاش کریں' }}</p>
      </div>
    </div>

    <div class="container page-section" style="padding-top: 0">
      @if (!matchingMode()) {
        <!-- Filters on top (Search only — Matching Profiles has no filters) -->
        <div class="filters card animate-fade-in-up">
          <div class="filters-head">
            <h3>Filters</h3>
          </div>
          <div class="filters-grid">
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-select" [(ngModel)]="filters.gender">
                <option value="">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Province</label>
              <select
                class="form-select"
                [(ngModel)]="filters.province"
                (ngModelChange)="onProvinceChange($event)"
              >
                <option value="">Any</option>
                @for (p of provinces; track p) {
                  <option [value]="p">{{ provinceLabel(p) }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Country</label>
              <select class="form-select" [(ngModel)]="filters.country">
                <option value="">Any</option>
                <option value="Pakistan">Pakistan</option>
                @for (c of overseasCountries; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">City</label>
              @if (isOverseasProvince(filters.province)) {
                <input
                  class="form-input"
                  type="text"
                  [(ngModel)]="filters.city"
                  placeholder="Any"
                />
              } @else if (filters.province) {
                <select class="form-select" [(ngModel)]="filters.city">
                  <option value="">Any</option>
                  @for (c of cityOptions; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              } @else {
                <select class="form-select" [(ngModel)]="filters.city">
                  <option value="">Any</option>
                </select>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Min Age</label>
              <input class="form-input" type="number" [(ngModel)]="filters.min_age" placeholder="Any" />
            </div>
            <div class="form-group">
              <label class="form-label">Max Age</label>
              <input class="form-input" type="number" [(ngModel)]="filters.max_age" placeholder="Any" />
            </div>
            <div class="form-group">
              <label class="form-label">Marital Status</label>
              <select class="form-select" [(ngModel)]="filters.marital_status">
                <option value="">Any</option>
                <option value="never_married">Single</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="separated">Separated</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Religion</label>
              <select class="form-select" [(ngModel)]="filters.religion">
                <option value="">Any</option>
                @for (r of religionOptions; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Education</label>
              <select class="form-select" [(ngModel)]="filters.education">
                <option value="">Any</option>
                @for (e of educationOptions; track e) {
                  <option [value]="e">{{ e }}</option>
                }
              </select>
            </div>
          </div>
          <div class="filters-actions">
            <button type="button" class="btn btn-ghost btn-sm" (click)="resetFilters()">Reset</button>
            <button type="button" class="btn btn-primary btn-sm" (click)="search()">Apply</button>
          </div>
        </div>
      }

      <!-- Left ad | Results | Right ad (ads only when AdSense is ready) -->
      <div
        class="search-layout"
        [class.matching-layout]="matchingMode()"
        [class.has-ads]="adsReady"
      >
        @if (adsReady) {
          <aside class="ad-rail ad-left">
            <div class="ad-sticky">
              <app-ad-slot [slot]="slots.searchLeft" format="vertical" />
            </div>
          </aside>
        }

        <div class="results">
          @if (!canViewProfiles) {
            <div class="access-overlay card">
              <span class="lock-icon">🔒</span>
              @if (!auth.isLoggedIn()) {
                <h3>Login to view profiles</h3>
                <p>Search is only available to registered members with a complete profile.</p>
                <div class="access-actions">
                  <a routerLink="/login" class="btn btn-primary">Login</a>
                  <a routerLink="/register" class="btn btn-outline">Register Free</a>
                </div>
              } @else {
                <h3>Complete your profile first</h3>
                <p>Fill all required fields to unlock search and matching profiles.</p>
                <a routerLink="/my-profile" class="btn btn-primary">Complete Your Profile</a>
              }
            </div>
          } @else if (searchError()) {
            <div class="alert alert-error" style="margin-bottom: 1rem;">{{ searchError() }}</div>
          }
          @if (canViewProfiles && loading()) {
            <div class="loading-center"><div class="spinner"></div></div>
          } @else if (canViewProfiles && !profiles().length && !searchError()) {
            <div class="empty-state card">
              <span style="font-size: 3rem">🔍</span>
              <h3>No profiles found</h3>
              <p>{{ matchingMode() ? 'No matching profiles right now — check back later' : 'Try adjusting your filters' }}</p>
            </div>
          } @else if (canViewProfiles && profiles().length) {
            <div class="grid-3 profiles-grid">
              @for (profile of profiles(); track profile.id; let i = $index) {
                <app-profile-card [profile]="profile" [delay]="(i * 0.05) + 's'" />
              }
            </div>
            @if (totalPages() > 1) {
              <div class="pagination">
                <button class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="goPage(page() - 1)">← Prev</button>
                <span>Page {{ page() }} of {{ totalPages() }}</span>
                <button class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="goPage(page() + 1)">Next →</button>
              </div>
            }
            @if (adsReady) {
              <div class="ad-mobile-bottom">
                <app-ad-slot [slot]="slots.searchLeft" format="horizontal" />
              </div>
            }
          }
        </div>

        @if (adsReady) {
          <aside class="ad-rail ad-right">
            <div class="ad-sticky">
              <app-ad-slot [slot]="slots.searchRight" format="vertical" />
            </div>
          </aside>
        }
      </div>
    </div>
  `,
  styles: [`
    .filters {
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }
    .filters-head {
      margin-bottom: 1rem;
    }
    .filters-head h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.85rem 1rem;
    }
    .filters-grid .form-group { margin-bottom: 0; }
    .filters-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.15rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .search-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
      align-items: start;
      width: 100%;
    }
    .search-layout.has-ads {
      grid-template-columns: 160px minmax(0, 1fr) 160px;
    }
    .search-layout.matching-layout {
      margin-top: 0.5rem;
    }
    .ad-rail {
      min-width: 0;
    }
    .ad-sticky {
      position: sticky;
      top: 90px;
    }
    .profiles-grid {
      width: 100%;
      align-items: stretch;
    }
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-state h3 { margin: 1rem 0 0.5rem; }
    .results { position: relative; min-height: 240px; width: 100%; min-width: 0; }
    .access-overlay {
      position: relative;
      z-index: 5;
      margin: 2rem auto 0;
      width: min(440px, calc(100% - 2rem));
      padding: 1.75rem;
      text-align: center;
      box-shadow: 0 18px 50px rgba(46, 6, 16, 0.2);
    }
    .access-overlay h3 { margin: 0.6rem 0 0.4rem; }
    .access-overlay p { color: var(--text-muted); margin-bottom: 1rem; }
    .lock-icon { font-size: 2rem; }
    .access-actions { display: flex; justify-content: center; gap: 0.65rem; flex-wrap: wrap; }
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 1rem; margin-top: 2rem;
    }
    .ad-mobile-bottom {
      display: none;
      margin-top: 1.5rem;
    }

    @media (max-width: 1100px) {
      .filters-grid { grid-template-columns: repeat(3, 1fr); }
      .search-layout.has-ads { grid-template-columns: 140px minmax(0, 1fr) 140px; }
    }
    @media (max-width: 900px) {
      .search-layout,
      .search-layout.has-ads { grid-template-columns: 1fr; }
      .ad-rail { display: none; }
      .ad-mobile-bottom { display: block; }
    }
    @media (max-width: 640px) {
      .filters-grid { grid-template-columns: 1fr 1fr; }
      .filters-head { flex-wrap: wrap; }
    }
  `],
})
export class SearchComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly visitService = inject(VisitService);
  private readonly seo = inject(SeoService);
  readonly auth = inject(AuthService);

  readonly slots = ADSENSE_SLOTS;
  readonly adsReady = isAdSenseReady();
  profiles = signal<Profile[]>([]);
  loading = signal(false);
  page = signal(1);
  totalPages = signal(1);
  matchingMode = signal(false);
  searchError = signal('');

  get canViewProfiles(): boolean {
    return this.auth.isAdmin()
      || (this.auth.isLoggedIn() && !!this.auth.currentUser()?.is_profile_complete);
  }

  provinces = [...ALL_LOCATION_PROVINCES];
  overseasCountries = [...OVERSEAS_COUNTRIES];
  readonly provinceLabel = provinceLabel;
  readonly isOverseasProvince = isOverseasProvince;
  readonly educationOptions = [...EDUCATION_OPTIONS];
  readonly religionOptions = [...RELIGION_OPTIONS];
  filters: SearchFilters = {
    gender: '', city: '', province: '', country: '', marital_status: '', religion: '', education: '',
    min_age: '', max_age: '',
  };

  get cityOptions(): string[] {
    return citiesForProvince(this.filters.province);
  }

  onProvinceChange(province: string): void {
    this.filters.province = province;

    if (!province) {
      this.filters.city = '';
      return;
    }

    if (isOverseasProvince(province)) {
      if (this.filters.country === 'Pakistan') {
        this.filters.country = '';
      }
    } else {
      this.filters.country = '';
      const allowed = citiesForProvince(province);
      if (this.filters.city && !allowed.includes(this.filters.city)) {
        this.filters.city = '';
      }
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.matchingMode.set(params['matching'] === 'true');
      if (params['gender']) this.filters.gender = params['gender'];
      if (params['city']) this.filters.city = params['city'];
      if (params['province']) this.filters.province = params['province'];
      if (params['country']) this.filters.country = params['country'];
      this.page.set(1);
      this.applySearchSeo();

      if (this.auth.isLoggedIn() && !this.auth.isAdmin()) {
        this.auth.getMe().subscribe({
          next: () => {
            this.applyMatchingDefaults();
            this.search();
          },
          error: () => this.search(),
        });
      } else {
        this.search();
      }
    });
  }

  private applyMatchingDefaults(): void {
    if (!this.matchingMode()) return;
    const gender = this.auth.currentUser()?.gender;
    if (gender === 'male') this.filters.gender = 'female';
    if (gender === 'female') this.filters.gender = 'male';
  }

  private applySearchSeo(): void {
    if (this.matchingMode()) {
      this.seo.apply({
        title: 'AI Matching Profiles — Find Compatible Rishta Matches',
        description:
          'View AI matching profiles on Hum Rishta based on your preferences. Discover compatible rishta matches on Pakistan\'s trusted matrimonial website.',
        path: '/search?matching=true',
      });
      return;
    }
    this.seo.apply({
      title: 'Search Rishta Profiles — Online Matrimonial Website Pakistan',
      description:
        'Search rishta profiles by city, education, and preferences on Hum Rishta — Pakistan\'s trusted online matrimonial and rishta website.',
      path: '/search',
      keywords:
        'search rishta, rishta profiles Pakistan, matrimonial search, online rishta, Hum Rishta',
    });
  }

  search(): void {
    if (!this.canViewProfiles) {
      this.profiles.set([]);
      this.loading.set(false);
      this.searchError.set('');
      return;
    }
    this.loading.set(true);
    this.searchError.set('');
    const request = this.matchingMode()
      ? this.profileService.getMatches({ ...this.filters, page: this.page() })
      : this.profileService.search({ ...this.filters, page: this.page() });
    request.subscribe({
      next: (res) => {
        this.profiles.set(res.data);
        this.totalPages.set(res.pagination?.totalPages ?? 1);
        this.loading.set(false);
        this.visitService.trackSearch(
          {
            ...this.filters,
            matching: this.matchingMode(),
            page: this.page(),
          },
          res.data?.length ?? 0,
          this.matchingMode() ? '/search?matching=true' : '/search'
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.profiles.set([]);
        this.searchError.set(err.error?.message || 'Search failed. Please try again.');
      },
    });
  }

  resetFilters(): void {
    this.filters = { gender: '', city: '', province: '', country: '', marital_status: '', religion: '', education: '', min_age: '', max_age: '' };
    this.page.set(1);
    this.search();
  }

  goPage(p: number): void {
    this.page.set(p);
    this.search();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
