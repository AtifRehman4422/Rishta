import { Component, Input } from '@angular/core';

const AVATAR_MALE = '/images/avatar-male.png';
const AVATAR_FEMALE = '/images/avatar-female.png';

@Component({
  selector: 'app-profile-avatar',
  template: `
    <div
      class="avatar"
      [class]="'avatar-' + size"
      [class.male]="gender === 'male'"
      [class.female]="gender === 'female'"
      [class.neutral]="gender !== 'male' && gender !== 'female'"
    >
      @if (photo) {
        <img [src]="resolvePhoto(photo)" [alt]="altText" class="avatar-img" />
      } @else if (gender === 'male') {
        <img [src]="avatarMale" [alt]="altText + ' — Male'" class="avatar-img" />
      } @else if (gender === 'female') {
        <img [src]="avatarFemale" [alt]="altText + ' — Female'" class="avatar-img" />
      } @else if (initials) {
        <span class="avatar-initials">{{ initials }}</span>
      } @else {
        <img [src]="avatarMale" alt="Profile" class="avatar-img" />
      }
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      color: #fff;
      border: 3px solid var(--gold-shine, #F0D78C);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      background: #f5f5f5;
    }
    .avatar.male { border-color: #8EB4E0; }
    .avatar.female { border-color: #E8A0BF; }
    .avatar.neutral {
      background: var(--gradient-wedding, linear-gradient(135deg, #6B0F1A, #9B1B30));
    }

    .avatar-xs { width: 32px; height: 32px; border-width: 2px; }
    .avatar-sm { width: 50px; height: 50px; border-width: 2px; }
    .avatar-md { width: 90px; height: 90px; }
    .avatar-lg { width: 120px; height: 120px; border-width: 4px; }

    .avatar-initials { font-weight: 700; line-height: 1; }
    .avatar-xs .avatar-initials { font-size: 0.72rem; }
    .avatar-sm .avatar-initials { font-size: 1rem; }
    .avatar-md .avatar-initials { font-size: 1.8rem; }
    .avatar-lg .avatar-initials { font-size: 2.5rem; }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `],
})
export class ProfileAvatarComponent {
  readonly avatarMale = AVATAR_MALE;
  readonly avatarFemale = AVATAR_FEMALE;

  @Input() photo?: string | null;
  @Input() gender?: 'male' | 'female' | string | null;
  @Input() firstName?: string | null;
  @Input() lastName?: string | null;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';

  get initials(): string {
    const f = this.firstName?.charAt(0) ?? '';
    const l = this.lastName?.charAt(0) ?? '';
    return (f + l).toUpperCase();
  }

  get altText(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || 'Profile';
  }

  resolvePhoto(url: string): string {
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `/uploads/${url}`;
  }
}
