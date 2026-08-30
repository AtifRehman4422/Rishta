export type AliveStatus = '' | 'alive' | 'late';
export type SiblingOrder = '' | 'elder' | 'younger';
export type MarriedStatus = '' | 'married' | 'unmarried';

export interface FamilyParent {
  name: string;
  alive: AliveStatus;
  profession: string;
}

export interface FamilySibling {
  id: string;
  order: SiblingOrder;
  married: MarriedStatus;
  profession: string;
}

export interface FamilyDetails {
  version: 1;
  father: FamilyParent;
  mother: FamilyParent;
  brothers: FamilySibling[];
  sisters: FamilySibling[];
}

export const FAMILY_PROFESSION_BASE = [
  'No Job',
  'Freelancer',
  'Private Job',
  'Retired',
  'Government Employee',
  'Teacher',
  'Doctor',
  'Shopkeeper',
  'Farmer',
  'Businessman',
  'Engineer',
  'Lawyer',
  'Driver',
  'Army',
  'Police',
] as const;

export const FATHER_PROFESSION_OPTIONS: string[] = [...FAMILY_PROFESSION_BASE];

export const MOTHER_PROFESSION_OPTIONS: string[] = [
  'Housewife',
  ...FAMILY_PROFESSION_BASE,
];

export const BROTHER_PROFESSION_OPTIONS: string[] = [
  'Student',
  ...FAMILY_PROFESSION_BASE,
];

export const SISTER_PROFESSION_OPTIONS: string[] = [
  'Housewife',
  'Student',
  ...FAMILY_PROFESSION_BASE,
];

export function familyProfessionOptions(role: 'father' | 'mother' | 'brother' | 'sister', current?: string): string[] {
  const base =
    role === 'father' ? FATHER_PROFESSION_OPTIONS
    : role === 'mother' ? MOTHER_PROFESSION_OPTIONS
    : role === 'brother' ? BROTHER_PROFESSION_OPTIONS
    : SISTER_PROFESSION_OPTIONS;
  const value = (current || '').trim();
  if (!value || base.includes(value)) return [...base];
  return [value, ...base];
}

function newId(): string {
  return `fam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyParent(): FamilyParent {
  return { name: '', alive: '', profession: '' };
}

export function emptySibling(): FamilySibling {
  return { id: newId(), order: '', married: '', profession: '' };
}

export function emptyFamilyDetails(): FamilyDetails {
  return {
    version: 1,
    father: emptyParent(),
    mother: emptyParent(),
    brothers: [],
    sisters: [],
  };
}

export function parseFamilyDetails(raw?: string | null): FamilyDetails {
  const text = (raw || '').trim();
  if (!text) return emptyFamilyDetails();
  try {
    const parsed = JSON.parse(text) as Partial<FamilyDetails>;
    if (parsed && parsed.version === 1 && parsed.father && parsed.mother) {
      return {
        version: 1,
        father: {
          name: String(parsed.father.name || ''),
          alive: parsed.father.alive === 'alive' || parsed.father.alive === 'late' ? parsed.father.alive : '',
          profession: String(parsed.father.profession || ''),
        },
        mother: {
          name: String(parsed.mother.name || ''),
          alive: parsed.mother.alive === 'alive' || parsed.mother.alive === 'late' ? parsed.mother.alive : '',
          profession: String(parsed.mother.profession || ''),
        },
        brothers: Array.isArray(parsed.brothers) ? parsed.brothers.map(normalizeSibling) : [],
        sisters: Array.isArray(parsed.sisters) ? parsed.sisters.map(normalizeSibling) : [],
      };
    }
  } catch {
    // Legacy free-text stays as a note on mother profession so it is not lost.
  }
  const fallback = emptyFamilyDetails();
  fallback.mother.profession = text;
  return fallback;
}

function normalizeSibling(row: Partial<FamilySibling> | null | undefined): FamilySibling {
  return {
    id: row?.id || newId(),
    order: row?.order === 'elder' || row?.order === 'younger' ? row.order : '',
    married: row?.married === 'married' || row?.married === 'unmarried' ? row.married : '',
    profession: String(row?.profession || ''),
  };
}

export function serializeFamilyDetails(data: FamilyDetails): string {
  return JSON.stringify({
    version: 1,
    father: {
      name: data.father.name.trim(),
      alive: data.father.alive,
      profession: data.father.profession.trim(),
    },
    mother: {
      name: data.mother.name.trim(),
      alive: data.mother.alive,
      profession: data.mother.profession.trim(),
    },
    brothers: data.brothers.map((b) => ({
      id: b.id,
      order: b.order,
      married: b.married,
      profession: b.profession.trim(),
    })),
    sisters: data.sisters.map((s) => ({
      id: s.id,
      order: s.order,
      married: s.married,
      profession: s.profession.trim(),
    })),
  });
}

export function isFamilyDetailsComplete(data: FamilyDetails): boolean {
  return data.father.alive !== '' && data.mother.alive !== '';
}

export function isFamilyDetailsEmpty(data: FamilyDetails): boolean {
  return (
    !data.father.alive &&
    !data.father.name.trim() &&
    !data.father.profession.trim() &&
    !data.mother.alive &&
    !data.mother.name.trim() &&
    !data.mother.profession.trim() &&
    data.brothers.length === 0 &&
    data.sisters.length === 0
  );
}

export function isStructuredFamilyDetails(raw?: string | null): boolean {
  const text = (raw || '').trim();
  if (!text.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(text) as Partial<FamilyDetails>;
    return parsed?.version === 1 && !!parsed.father && !!parsed.mother;
  } catch {
    return false;
  }
}

export function aliveLabel(status: AliveStatus): string {
  if (status === 'alive') return 'Alive';
  if (status === 'late') return 'Late';
  return '';
}

export function siblingOrderLabel(order: SiblingOrder): string {
  if (order === 'elder') return 'Elder';
  if (order === 'younger') return 'Younger';
  return '';
}

export function marriedLabel(status: MarriedStatus): string {
  if (status === 'married') return 'Married';
  if (status === 'unmarried') return 'Unmarried';
  return '';
}

export function familyCounts(list: FamilySibling[]): { total: number; married: number; unmarried: number } {
  const married = list.filter((s) => s.married === 'married').length;
  const unmarried = list.filter((s) => s.married === 'unmarried').length;
  return { total: list.length, married, unmarried };
}

function parentLine(label: string, parent: FamilyParent): string {
  if (!parent.alive && !parent.name.trim() && !parent.profession.trim()) return '';
  const status = parent.alive === 'late' ? 'late' : parent.alive === 'alive' ? 'alive' : '';
  const parts = [label, parent.name.trim(), status, parent.profession.trim()].filter(Boolean);
  return parts.join(' — ');
}

function siblingLine(kind: string, sibling: FamilySibling, index: number): string {
  const order = sibling.order === 'elder' ? 'elder' : sibling.order === 'younger' ? 'younger' : '';
  const married = sibling.married === 'married' ? 'married' : sibling.married === 'unmarried' ? 'unmarried' : '';
  const job = sibling.profession.trim();
  return [`${kind} ${index + 1}`, order, married, job].filter(Boolean).join(' — ');
}

export function formatFamilyDetails(data: FamilyDetails): string {
  const lines: string[] = [];
  const father = parentLine('Father', data.father);
  const mother = parentLine('Mother', data.mother);
  if (father) lines.push(father);
  if (mother) lines.push(mother);

  const brothers = familyCounts(data.brothers);
  if (brothers.total) {
    lines.push(`Brothers: ${brothers.total} total, ${brothers.married} married`);
    data.brothers.forEach((b, i) => lines.push(siblingLine('Brother', b, i)));
  }
  const sisters = familyCounts(data.sisters);
  if (sisters.total) {
    lines.push(`Sisters: ${sisters.total} total, ${sisters.married} married`);
    data.sisters.forEach((s, i) => lines.push(siblingLine('Sister', s, i)));
  }
  return lines.join('\n');
}

export function familyDetailsDisplay(raw?: string | null): string {
  const text = (raw || '').trim();
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    if (parsed?.version === 1) return formatFamilyDetails(parseFamilyDetails(text));
  } catch {
    return text;
  }
  return text;
}
