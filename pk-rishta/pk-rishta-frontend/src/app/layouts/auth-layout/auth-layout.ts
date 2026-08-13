import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="app-shell">
      <app-navbar />
      <div class="app-scroll auth-scroll">
        <main class="main-content auth-page">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .auth-scroll {
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
    .main-content.auth-page {
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }
  `],
})
export class AuthLayoutComponent {}
