export const PROFESSION_CATEGORIES = [
  'Government Job',
  'Private Job',
  'Business / Self-Employed',
] as const;

export type ProfessionCategory = (typeof PROFESSION_CATEGORIES)[number];

export const PROFESSION_OTHER = 'Other';

export const GOVERNMENT_PROFESSIONS = [
  'Government Teacher',
  'Government Doctor',
  'Police',
  'Army',
  'Navy',
  'Air Force',
  'Civil Servant',
  'Government Clerk',
  'Government Engineer',
  'Government Employee',
  'Government Office',
  'Railway Employee',
  'Post Office Employee',
  'Judge',
  'Government Lawyer',
  'Tax',
  'Customs',
  'Rescue',
  'Firefighter',
  PROFESSION_OTHER,
] as const;

export const PRIVATE_PROFESSIONS = [
  'Private Teacher',
  'Private Doctor',
  'Software Engineer',
  'Accountant',
  'Bank Employee',
  'Office Assistant',
  'Private Employee',
  'Private Office',
  'Salesman',
  'Manager',
  'Driver',
  'Security Guard',
  'Factory Worker',
  'Electrician',
  'Mechanic',
  'Nurse',
  'Pharmacist',
  'Graphic Designer',
  'Customer Service Representative',
  PROFESSION_OTHER,
] as const;

export const BUSINESS_PROFESSIONS = [
  'Shopkeeper',
  'Trader',
  'Farmer',
  'Contractor',
  'Property Dealer',
  'Freelancer',
  'Online Seller',
  'Restaurant Owner',
  'Transport Business Owner',
  'Manufacturer',
  'Tailor',
  'Barber',
  'Mechanic',
  'Electrician',
  'Plumber',
  'Consultant',
  'Importer',
  'Exporter',
  PROFESSION_OTHER,
] as const;

const CATEGORY_OPTIONS: Record<ProfessionCategory, readonly string[]> = {
  'Government Job': GOVERNMENT_PROFESSIONS,
  'Private Job': PRIVATE_PROFESSIONS,
  'Business / Self-Employed': BUSINESS_PROFESSIONS,
};

export function professionsForCategory(category?: string | null): string[] {
  if (!category) return [];
  return [...(CATEGORY_OPTIONS[category as ProfessionCategory] ?? [])];
}

export function allProfessionOptions(): string[] {
  return [
    ...GOVERNMENT_PROFESSIONS,
    ...PRIVATE_PROFESSIONS,
    ...BUSINESS_PROFESSIONS,
  ];
}

export function formatProfession(
  category: string,
  choice: string,
  otherText?: string | null,
): string {
  if (!category || !choice) return '';
  if (choice === PROFESSION_OTHER) {
    const custom = (otherText || '').trim();
    return custom ? `${category} — ${custom}` : '';
  }
  return `${category} — ${choice}`;
}

export interface ParsedProfession {
  category: string;
  choice: string;
  otherText: string;
  stored: string;
}

export function parseStoredProfession(value?: string | null): ParsedProfession {
  const stored = (value || '').trim();
  if (!stored) {
    return { category: '', choice: '', otherText: '', stored: '' };
  }

  for (const category of PROFESSION_CATEGORIES) {
    const prefix = `${category} — `;
    if (!stored.startsWith(prefix)) continue;

    const rest = stored.slice(prefix.length).trim();
    const options = professionsForCategory(category);
    if (options.includes(rest)) {
      return { category, choice: rest, otherText: '', stored };
    }
    return { category, choice: PROFESSION_OTHER, otherText: rest, stored };
  }

  // Legacy free-text profession
  return { category: '', choice: stored, otherText: '', stored };
}

export function professionOptionsWithValue(
  category: string | null | undefined,
  current?: string | null,
): string[] {
  const options = professionsForCategory(category);
  const parsed = parseStoredProfession(current);
  if (parsed.choice && !options.includes(parsed.choice)) {
    return [parsed.choice, ...options];
  }
  return options;
}
