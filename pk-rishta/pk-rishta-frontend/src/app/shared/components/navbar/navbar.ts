import { Component, HostListener, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, ProfileAvatarComponent],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="nav-accent"></div>
      <div class="nav-inner">
        <a routerLink="/" class="logo" (click)="closeMenu()">
          <img src="/images/logo.png" alt="Hum Rishta" class="logo-img" />
        </a>
        <span class="logo-divider" aria-hidden="true"></span>

        <div class="nav-body">
          <div class="nav-links" [class.open]="menuOpen">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a>
            <a
              routerLink="/search"
              [queryParams]="{}"
              queryParamsHandling=""
              [class.active]="isSearchNavActive()"
              (click)="closeMenu()"
            >Search</a>
            @if (auth.isLoggedIn() && !auth.isAdmin()) {
              @if (auth.currentUser()?.is_profile_complete) {
                <a
                  routerLink="/search"
                  [queryParams]="{ matching: 'true' }"
                  [class.active]="isMatchingNavActive()"
                  (click)="closeMenu()"
                >AI Matching Profiles</a>
              }
              <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMenu()">My Activity</a>
              <a routerLink="/favorites" routerLinkActive="active" (click)="closeMenu()">Favorites</a>
              @if (!auth.currentUser()?.is_profile_complete) {
                <a routerLink="/my-profile" class="complete-profile-link" (click)="closeMenu()">Complete Your Profile</a>
              }
            }
            <a routerLink="/blog" routerLinkActive="active" (click)="closeMenu()">Blog</a>
            <a routerLink="/about" routerLinkActive="active" (click)="closeMenu()">About</a>
            <a routerLink="/contact" routerLinkActive="active" (click)="closeMenu()">Contact</a>
            @if (auth.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Admin</a>
            }
          </div>

          <div class="nav-actions">
            @if (auth.isLoggedIn() && auth.isAdmin()) {
              <span class="admin-site-badge" title="Admin mode — full data visible on profiles">Admin View</span>
            }
            @if (auth.isLoggedIn()) {
              <div class="bell-wrap">
                <button
                  type="button"
                  class="bell-btn"
                  (click)="toggleBell($event)"
                  [attr.aria-label]="'Notifications' + (notifications.unreadCount() ? ', ' + notifications.unreadCount() + ' unread' : '')"
                >
                  <span class="bell-icon" aria-hidden="true">🔔</span>
                  @if (notifications.unreadCount() > 0) {
                    <span class="bell-badge">{{ notifications.unreadCount() > 9 ? '9+' : notifications.unreadCount() }}</span>
                  }
                </button>
                @if (bellOpen) {
                  <div class="bell-dropdown" (click)="$event.stopPropagation()">
                    <div class="bell-head">
                      <strong>Notifications</strong>
                      @if (notifications.unreadCount() > 0) {
                        <button type="button" class="bell-mark-all" (click)="markAllRead()">Mark all read</button>
                      }
                    </div>
                    @if (!notifications.items().length) {
                      <p class="bell-empty">No notifications yet</p>
                    } @else {
                      <ul class="bell-list">
                        @for (n of notifications.items(); track n.id) {
                          <li [class.unread]="!n.is_read">
                            <button type="button" class="bell-item" (click)="openNotification(n)">
                              <span class="bell-item-title">{{ n.title }}</span>
                              @if (n.body) {
                                <span class="bell-item-body">{{ n.body }}</span>
                              }
                              <span class="bell-item-time">{{ formatTime(n.created_at) }}</span>
                            </button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              </div>
            }
            @if (!auth.isLoggedIn()) {
              <a routerLink="/login" class="nav-btn nav-btn-login" (click)="closeMenu()">Login</a>
              <a routerLink="/register" class="nav-btn nav-btn-register" (click)="closeMenu()">Register Free</a>
            } @else {
              @if (auth.isAdmin()) {
                <div class="user-chip user-chip-static">
                  <app-profile-avatar
                    [photo]="auth.currentUser()?.profile_photo"
                    [gender]="auth.currentUser()?.gender"
                    [firstName]="auth.currentUser()?.first_name"
                    [lastName]="auth.currentUser()?.last_name"
                    size="xs"
                  />
                  <span class="user-name">{{ auth.currentUser()?.email }}</span>
                </div>
              } @else {
                <a
                  routerLink="/my-profile"
                  class="user-chip"
                  title="My Profile"
                  (click)="closeMenu()"
                >
                  <app-profile-avatar
                    [photo]="auth.currentUser()?.profile_photo"
                    [gender]="auth.currentUser()?.gender"
                    [firstName]="auth.currentUser()?.first_name"
                    [lastName]="auth.currentUser()?.last_name"
                    size="xs"
                  />
                  <span class="user-name">
                    {{ auth.currentUser()?.first_name || (auth.currentUser()?.email ?? '').split('@')[0] }}
                  </span>
                </a>
              }
              <button class="nav-btn nav-btn-logout" (click)="auth.logout()">Logout</button>
            }
            <button class="menu-toggle" [class.open]="menuOpen" (click)="menuOpen = !menuOpen" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </div>
      <div class="nav-accent nav-accent-bottom"></div>
    </nav>
    @if (menuOpen) {
      <div class="nav-backdrop" (click)="closeMenu()"></div>
    }
  `,
  styles: [`
    .navbar {
      flex-shrink: 0;
      position: relative;
      z-index: 1000;
      background: linear-gradient(
        125deg,
        #2E0610 0%,
        #5A0E1A 28%,
        #7A1528 52%,
        #5C1020 78%,
        #3A0812 100%
      );
      border-bottom: none;
      box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      transition: box-shadow 0.35s ease;
    }
    .navbar::before {
      content: '';
      position: absolute;
      inset: 3px 0;
      background:
        radial-gradient(ellipse 50% 160% at 5% 50%, rgba(212, 175, 55, 0.14) 0%, transparent 55%),
        radial-gradient(ellipse 40% 140% at 95% 50%, rgba(232, 160, 191, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse 80% 100% at 50% 120%, rgba(0, 0, 0, 0.25) 0%, transparent 60%);
      pointer-events: none;
      z-index: 0;
    }
    .nav-inner,
    .nav-accent {
      position: relative;
      z-index: 1;
    }
    .navbar.scrolled {
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .nav-accent {
      height: 3px;
      background: linear-gradient(90deg, #8B6914 0%, #F5E6B8 25%, #D4AF37 50%, #F5E6B8 75%, #8B6914 100%);
      background-size: 200% 100%;
      animation: accent-shimmer 6s ease-in-out infinite;
    }
    .nav-accent-bottom {
      animation-direction: reverse;
    }
    @keyframes accent-shimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .nav-inner {
      display: flex;
      align-items: center;
      width: 100%;
      height: 84px;
      padding: 0;
    }

    .logo {
      display: flex;
      align-items: center;
      text-decoration: none;
      flex-shrink: 0;
      padding: 0;
      margin: 0;
      line-height: 0;
    }
    .logo-img {
      height: 92px;
      width: auto;
      max-width: 280px;
      object-fit: contain;
      object-position: left center;
      display: block;
      margin: 0;
      background: transparent;
      border: none;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .logo:hover .logo-img { transform: scale(1.03); }

    .logo-divider {
      width: 1px;
      height: 40px;
      margin: 0 0.25rem 0 0.75rem;
      flex-shrink: 0;
      background: linear-gradient(180deg, transparent, rgba(212, 175, 55, 0.65), transparent);
    }

    .nav-body {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      width: 100%;
      gap: 1.5rem;
      padding: 0 1.75rem 0 1rem;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
    }
    .nav-links a {
      position: relative;
      color: rgba(255, 245, 240, 0.88);
      font-weight: 500;
      font-size: 0.92rem;
      letter-spacing: 0.02em;
      padding: 0.55rem 1rem;
      text-decoration: none;
      border-radius: 6px;
      transition: color 0.25s ease, background 0.25s ease;
      white-space: nowrap;
    }
    .nav-links a::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 6px;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #F5E6B8, #D4AF37);
      border-radius: 2px;
      transform: translateX(-50%);
      transition: width 0.25s ease;
    }
    .nav-links a:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .nav-links a.active {
      color: #F5E6B8;
      font-weight: 600;
      background: rgba(212, 175, 55, 0.12);
    }
    .nav-links a.active::after { width: 55%; }
    .nav-links a.complete-profile-link {
      color: #3A0812;
      background: linear-gradient(135deg, #C9A227, #F5E6B8, #D4AF37);
      font-weight: 700;
    }
    .nav-links a.complete-profile-link:hover {
      color: #3A0812;
      background: linear-gradient(135deg, #D4AF37, #fff2c7, #F0D78C);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-shrink: 0;
      margin-left: auto;
    }
    .admin-site-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.35rem 0.65rem;
      border-radius: 50px;
      background: rgba(212, 175, 55, 0.2);
      color: #F5E6B8;
      border: 1px solid rgba(212, 175, 55, 0.45);
      white-space: nowrap;
    }
    .bell-wrap { position: relative; }
    .bell-btn {
      position: relative;
      width: 42px;
      height: 42px;
      border-radius: 8px;
      border: 1px solid rgba(212, 175, 55, 0.4);
      background: rgba(255, 255, 255, 0.08);
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .bell-btn:hover {
      background: rgba(212, 175, 55, 0.15);
      border-color: #D4AF37;
    }
    .bell-icon { font-size: 1.15rem; line-height: 1; }
    .bell-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 99px;
      background: #e11d48;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      display: grid;
      place-items: center;
      border: 2px solid #5A0E1A;
    }
    .bell-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: min(340px, calc(100vw - 1.5rem));
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
      border: 1px solid rgba(155, 27, 48, 0.12);
      overflow: hidden;
      z-index: 1100;
    }
    .bell-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      background: #fff8f3;
    }
    .bell-head strong { color: var(--primary-dark, #5A0E1A); font-size: 0.92rem; }
    .bell-mark-all {
      border: none;
      background: none;
      color: var(--primary, #9B1B30);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
    }
    .bell-empty {
      margin: 0;
      padding: 1.5rem 1rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.88rem;
    }
    .bell-list {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 360px;
      overflow-y: auto;
    }
    .bell-list li { border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
    .bell-list li.unread { background: rgba(155, 27, 48, 0.05); }
    .bell-item {
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      padding: 0.85rem 1rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .bell-item:hover { background: rgba(0, 0, 0, 0.03); }
    .bell-item-title { font-weight: 700; font-size: 0.86rem; color: #1f2937; }
    .bell-item-body {
      font-size: 0.8rem;
      color: #6b7280;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .bell-item-time { font-size: 0.72rem; color: #9ca3af; margin-top: 0.15rem; }
    .nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.35rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      font-family: var(--font);
      letter-spacing: 0.02em;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
    }
    .nav-btn-login {
      color: #F5E6B8;
      background: rgba(255, 255, 255, 0.06);
      border: 1.5px solid rgba(212, 175, 55, 0.45);
    }
    .nav-btn-login:hover {
      background: rgba(212, 175, 55, 0.15);
      border-color: #D4AF37;
      color: #fff;
      transform: translateY(-1px);
    }
    .nav-btn-register {
      color: #3A0812;
      background: linear-gradient(135deg, #C9A227 0%, #F5E6B8 50%, #D4AF37 100%);
      box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .nav-btn-register:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 26px rgba(212, 175, 55, 0.45);
      background: linear-gradient(135deg, #D4AF37 0%, #F5E6B8 60%, #F0D78C 100%);
    }
    .nav-btn-logout {
      color: rgba(255, 245, 240, 0.9);
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .nav-btn-logout:hover {
      color: #fff;
      border-color: rgba(212, 175, 55, 0.5);
      background: rgba(212, 175, 55, 0.12);
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.3rem 0.85rem 0.3rem 0.3rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    a.user-chip:hover {
      background: rgba(212, 175, 55, 0.18);
      border-color: #D4AF37;
      transform: translateY(-1px);
    }
    .user-chip-static { cursor: default; }
    .user-chip .avatar { box-shadow: none; }
    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #F5E6B8;
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-toggle {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 42px;
      height: 42px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 8px;
      cursor: pointer;
      padding: 10px;
      transition: all 0.25s ease;
    }
    .menu-toggle:hover {
      border-color: #D4AF37;
      background: rgba(212, 175, 55, 0.15);
    }
    .menu-toggle span {
      display: block;
      width: 100%;
      height: 2px;
      background: #F5E6B8;
      border-radius: 2px;
      transition: all 0.3s ease;
    }
    .menu-toggle.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .menu-toggle.open span:nth-child(2) { opacity: 0; }
    .menu-toggle.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .nav-backdrop { display: none; }

    @media (max-width: 900px) {
      .logo-divider { display: none; }
      .nav-inner { height: 72px; }
      .nav-body { gap: 0.75rem; padding: 0 1rem 0 0.5rem; }
      .nav-links {
        position: fixed;
        top: var(--navbar-height);
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        background: linear-gradient(180deg, #3A0812 0%, #5A0E1A 50%, #3A0812 100%);
        padding: 0.75rem 1.25rem 1.25rem;
        border-bottom: 2px solid rgba(212, 175, 55, 0.35);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        gap: 0.15rem;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 999;
        flex: unset;
      }
      .nav-links.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      .nav-links a {
        padding: 0.9rem 0.75rem;
        font-size: 1rem;
        border-radius: 8px;
        color: rgba(255, 245, 240, 0.9);
      }
      .nav-links a::after { display: none; }
      .nav-links a:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
      }
      .nav-links a.active {
        color: #F5E6B8;
        background: rgba(212, 175, 55, 0.15);
        font-weight: 600;
      }
      .nav-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(45, 27, 27, 0.35);
        z-index: 998;
        backdrop-filter: blur(3px);
      }
      .menu-toggle { display: flex; }
      .user-chip .user-name { display: none; }
      .nav-btn-login { display: none; }
    }

    @media (max-width: 480px) {
      .logo-img { height: 72px; width: auto; max-width: 200px; }
      .nav-btn-register { padding: 0.55rem 1rem; font-size: 0.8rem; }
    }
  `],
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  scrolled = false;
  menuOpen = false;
  bellOpen = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      if (loggedIn) {
        queueMicrotask(() => {
          this.refreshNotifications();
          this.startPolling();
        });
      } else {
        queueMicrotask(() => {
          this.stopPolling();
          this.notifications.unreadCount.set(0);
          this.notifications.items.set([]);
          this.bellOpen = false;
        });
      }
    });
  }

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    const scrollEl = document.querySelector('.app-scroll');
    scrollEl?.addEventListener('scroll', () => {
      this.scrolled = scrollEl.scrollTop > 20;
    });

    if (this.auth.isLoggedIn()) {
      this.auth.getMe().subscribe();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.bellOpen = false;
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    if (this.auth.isLoggedIn()) {
      this.refreshNotifications();
    }
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.bellOpen = false;
  }

  /** Search tab — /search without matching=true */
  isSearchNavActive(): boolean {
    return this.isOnSearchRoute() && !this.isMatchingQuery();
  }

  /** Matching Profiles tab — /search?matching=true */
  isMatchingNavActive(): boolean {
    return this.isOnSearchRoute() && this.isMatchingQuery();
  }

  private isOnSearchRoute(): boolean {
    const path = this.router.url.split('?')[0];
    return path === '/search' || path.endsWith('/search');
  }

  private isMatchingQuery(): boolean {
    const tree = this.router.parseUrl(this.router.url);
    return tree.queryParams['matching'] === 'true';
  }

  toggleBell(event: Event): void {
    event.stopPropagation();
    this.bellOpen = !this.bellOpen;
    if (this.bellOpen) {
      this.refreshNotifications();
    }
  }

  startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.refreshNotifications(true), 15000);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  refreshNotifications(countOnly = false): void {
    if (!this.auth.isLoggedIn()) return;
    this.notifications.refreshUnreadCount().subscribe({ error: () => undefined });
    if (!countOnly || this.bellOpen) {
      this.notifications.getNotifications().subscribe({ error: () => undefined });
    }
  }

  markAllRead(): void {
    this.notifications.markAllRead().subscribe({ error: () => undefined });
  }

  openNotification(n: AppNotification): void {
    if (!n.is_read) {
      this.notifications.markRead(n.id).subscribe({ error: () => undefined });
    }
    this.bellOpen = false;
    const link = n.link || (this.auth.isAdmin() ? '/admin/contact-requests' : '/dashboard');
    void this.router.navigateByUrl(link);
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  }
}
