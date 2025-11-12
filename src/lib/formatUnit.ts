const unitMap: Record<string, string> = {
  'kg': 'kg',
  'g': 'g',
  'mg': 'mg',
  'L': 'L',
  'mL': 'mL',
  'ton': 'ton',
  'ton (tonelada)': 'ton',
  'un': 'un',
  'un (unidade)': 'un',
};

export function formatUnitFull(unit: string | null | undefined): string {
  if (!unit) return '';
  return unitMap[unit] || unit;
}

export function formatUnitAbbreviated(unit: string | null | undefined): string {
  if (!unit) return '';
  return unitMap[unit] || unit;
}
