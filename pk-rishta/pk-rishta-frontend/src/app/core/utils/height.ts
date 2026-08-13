export const HEIGHT_FEET_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const;
export const HEIGHT_INCHES_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function formatHeightCm(cm?: number | null): string {
  if (cm === undefined || cm === null || cm <= 0) return 'N/A';
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
}

export function formatFeetInches(feet?: number | null, inches?: number | null): string {
  if (feet === undefined || feet === null || inches === undefined || inches === null) return '';
  return `${feet}'${inches}"`;
}

export function parseFeetInchesFromCm(cm?: number | null): { feet: number | null; inches: number | null } {
  if (cm === undefined || cm === null || cm <= 0) {
    return { feet: null, inches: null };
  }
  const { feet, inches } = cmToFeetInches(cm);
  return { feet, inches };
}
