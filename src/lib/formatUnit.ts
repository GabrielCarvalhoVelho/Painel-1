const unitMap: Record<string, string> = {
  'kg': 'kg',
  'g': 'g',
  'mg': 'mg',
  'L': 'L',
  'mL': 'mL',
  'ton': 'ton (tonelada)',
  'ton (tonelada)': 'ton (tonelada)',
  'saca': 'saca (60kg)',
  'saca (60kg)': 'saca (60kg)',
  'saca_(60kg)': 'saca (60kg)',
  'galão': 'galão',
  'cx': 'cx (caixa)',
  'cx (caixa)': 'cx (caixa)',
  'un': 'un (unidade)',
  'un (unidade)': 'un (unidade)',
};

export function formatUnitFull(unit: string | null | undefined): string {
  if (!unit) return '';
  return unitMap[unit] || unit;
}

export function formatUnitAbbreviated(unit: string | null | undefined): string {
  if (!unit) return '';

  const abbreviated: Record<string, string> = {
    'ton (tonelada)': 'ton',
    'saca (60kg)': 'saca',
    'saca_(60kg)': 'saca',
    'cx (caixa)': 'cx',
    'un (unidade)': 'un',
    'mg': 'mg',
    'mL': 'mL',
  };

  return abbreviated[unit] || unit;
}
