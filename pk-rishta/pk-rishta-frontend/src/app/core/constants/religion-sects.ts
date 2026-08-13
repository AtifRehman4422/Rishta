export const SECTS_BY_RELIGION: Record<string, string[]> = {
  Islam: ['Sunni', 'Shia', 'Deobandi', 'Barelvi', 'Ahle Hadees', 'Ismaili', 'Other'],
  Christianity: ['Catholic', 'Protestant', 'Orthodox', 'Anglican', 'Pentecostal', 'Seventh-day Adventist', 'Other'],
  Hinduism: ['Shaivism', 'Vaishnavism', 'Shaktism', 'Smartism', 'Other'],
  Other: ['Other'],
};

export const RELIGION_OPTIONS = ['Islam', 'Christianity', 'Hinduism', 'Sikhism', 'Other'];

export const ALL_SECT_OPTIONS = [
  ...new Set(Object.values(SECTS_BY_RELIGION).flat()),
];

export function sectsForReligion(religion?: string | null): string[] {
  if (!religion?.trim()) return [];
  return SECTS_BY_RELIGION[religion] ?? ALL_SECT_OPTIONS;
}
