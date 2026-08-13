/** Overseas location support — users living outside Pakistan */

export const OVERSEAS_PROVINCE = 'Overseas';

export const OVERSEAS_COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahrain',
  'Bangladesh',
  'Belgium',
  'Brazil',
  'Brunei',
  'Canada',
  'China',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Greece',
  'Hungary',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Italy',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kuwait',
  'Kyrgyzstan',
  'Lebanon',
  'Libya',
  'Malaysia',
  'Maldives',
  'Morocco',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Oman',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sweden',
  'Switzerland',
  'Syria',
  'Thailand',
  'Turkey',
  'Turkmenistan',
  'UAE',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uzbekistan',
  'Vietnam',
  'Yemen',
  'Other',
] as const;

export type OverseasCountry = (typeof OVERSEAS_COUNTRIES)[number];

export function isOverseasProvince(province?: string | null): boolean {
  return province === OVERSEAS_PROVINCE;
}

export function formatProfileLocation(profile: {
  city?: string;
  province?: string;
  country?: string;
}): string {
  if (!profile.city && !profile.province) return '';
  if (isOverseasProvince(profile.province)) {
    const country = profile.country && profile.country !== 'Pakistan' ? profile.country : 'Abroad';
    return profile.city ? `${profile.city}, ${country}` : country;
  }
  if (profile.city && profile.province) return `${profile.city}, ${profile.province}`;
  return profile.city || profile.province || '';
}
