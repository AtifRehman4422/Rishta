import { Component } from '@angular/core';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.humrishta.app';

@Component({
  selector: 'app-app-promo-banner',
  templateUrl: './app-promo-banner.html',
  styleUrl: './app-promo-banner.css',
})
export class AppPromoBannerComponent {
  readonly playStoreUrl = PLAY_STORE_URL;
  readonly qrSrc =
    'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=' +
    encodeURIComponent(PLAY_STORE_URL);
}
