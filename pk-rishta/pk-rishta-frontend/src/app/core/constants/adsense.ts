import { environment } from '../../../environments/environment';

/** Replace with your AdSense publisher ID after approval (format: ca-pub-XXXXXXXXXXXXXXXX) */
export const ADSENSE_CLIENT = environment.adsenseClient;

/** Slot IDs from AdSense → Ads → By ad unit. Replace after creating units. */
export const ADSENSE_SLOTS = {
  searchLeft: environment.adsenseSlots.searchLeft,
  searchRight: environment.adsenseSlots.searchRight,
  homeBelowProfiles: environment.adsenseSlots.homeBelowProfiles,
  blogInArticle: environment.adsenseSlots.blogInArticle,
  blogSidebar: environment.adsenseSlots.blogSidebar,
  profileDetailTop: environment.adsenseSlots.profileDetailTop,
  profileDetailSide: environment.adsenseSlots.profileDetailSide,
  profileDetailBottom: environment.adsenseSlots.profileDetailBottom,
} as const;

export function isAdSenseReady(): boolean {
  return (
    !!ADSENSE_CLIENT &&
    !ADSENSE_CLIENT.includes('XXXXXXXX') &&
    ADSENSE_CLIENT.startsWith('ca-pub-')
  );
}
