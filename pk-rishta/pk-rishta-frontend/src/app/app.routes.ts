import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent) },
    ],
  },
  {
    path: 'register',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterComponent) },
    ],
  },
  {
    path: 'forgot-password',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
      },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent) },
      { path: 'search', loadComponent: () => import('./features/search/search').then((m) => m.SearchComponent) },
      { path: 'blog', loadComponent: () => import('./features/blog/blog').then((m) => m.BlogComponent) },
      { path: 'blog/:slug', loadComponent: () => import('./features/blog/blog-detail').then((m) => m.BlogDetailComponent) },
      { path: 'about', loadComponent: () => import('./features/about/about').then((m) => m.AboutComponent) },
      { path: 'privacy', loadComponent: () => import('./features/privacy/privacy').then((m) => m.PrivacyComponent) },
      { path: 'terms', loadComponent: () => import('./features/terms/terms').then((m) => m.TermsComponent) },
      { path: 'contact', loadComponent: () => import('./features/contact/contact').then((m) => m.ContactComponent) },
      { path: 'profile/new', canActivate: [adminGuard], loadComponent: () => import('./features/my-profile/my-profile').then((m) => m.MyProfileComponent) },
      { path: 'profile/:id', loadComponent: () => import('./features/profile-detail/profile-detail').then((m) => m.ProfileDetailComponent) },
      { path: 'profile/:id/edit', canActivate: [adminGuard], loadComponent: () => import('./features/my-profile/my-profile').then((m) => m.MyProfileComponent) },
      { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent) },
      { path: 'favorites', canActivate: [authGuard], loadComponent: () => import('./features/favorites/favorites').then((m) => m.FavoritesComponent) },
      { path: 'my-profile', canActivate: [authGuard], loadComponent: () => import('./features/my-profile/my-profile').then((m) => m.MyProfileComponent) },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/admin-users/admin-users').then((m) => m.AdminUsersComponent) },
      { path: 'profiles', loadComponent: () => import('./features/admin/admin-profiles/admin-profiles').then((m) => m.AdminProfilesComponent) },
      { path: 'contact-requests', loadComponent: () => import('./features/admin/admin-contact-requests/admin-contact-requests').then((m) => m.AdminContactRequestsComponent) },
      { path: 'contact-messages', loadComponent: () => import('./features/admin/admin-contact-messages/admin-contact-messages').then((m) => m.AdminContactMessagesComponent) },
      { path: 'dropdowns', loadComponent: () => import('./features/admin/admin-dropdowns/admin-dropdowns').then((m) => m.AdminDropdownsComponent) },
      { path: 'complaints', loadComponent: () => import('./features/admin/admin-complaints/admin-complaints').then((m) => m.AdminComplaintsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
