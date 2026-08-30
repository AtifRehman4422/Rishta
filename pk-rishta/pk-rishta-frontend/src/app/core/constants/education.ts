export const EDUCATION_OPTIONS = [
  'Preschool / Nursery',
  'Kindergarten',
  'Primary / Elementary School',
  'Middle School',
  'Secondary / High School',
  'Higher Secondary / Intermediate / College',
  'Certificate Course',
  'Diploma',
  'Hafiz-e-Quran',
  'Associate Degree',
  "Bachelor's Degree",
  'Postgraduate Diploma',
  "Master's Degree",
  'MPhil',
  'Doctorate / PhD',
  'Postdoctoral Study',
] as const;

export type EducationLevel = (typeof EDUCATION_OPTIONS)[number];

/** Include a saved value in dropdown when it is not in the standard list */
export function educationOptionsWithValue(current?: string | null): string[] {
  const value = current?.trim();
  if (!value || EDUCATION_OPTIONS.includes(value as EducationLevel)) {
    return [...EDUCATION_OPTIONS];
  }
  return [value, ...EDUCATION_OPTIONS];
}
