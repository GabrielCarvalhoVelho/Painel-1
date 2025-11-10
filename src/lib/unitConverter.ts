export type MassUnit = 'ton' | 'saca' | 'kg' | 'g' | 'mg';
export type VolumeUnit = 'L' | 'mL';
export type OtherUnit = 'cx' | 'un' | 'galão';
export type Unit = MassUnit | VolumeUnit | OtherUnit;

const MASS_TO_MG: Record<MassUnit, number> = {
  'ton': 1_000_000_000,
  'saca': 60_000_000,
  'kg': 1_000_000,
  'g': 1_000,
  'mg': 1,
};

const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  'L': 1_000,
  'mL': 1,
};

export function isMassUnit(unit: string): unit is MassUnit {
  return ['ton', 'saca', 'kg', 'g', 'mg'].includes(unit);
}

export function isVolumeUnit(unit: string): unit is VolumeUnit {
  return ['L', 'mL'].includes(unit);
}

export function isOtherUnit(unit: string): unit is OtherUnit {
  return ['cx', 'un', 'galão'].includes(unit);
}

export function convertToStandardUnit(quantidade: number, unidade: string): { quantidade: number; unidade: string } {
  if (isMassUnit(unidade)) {
    if (unidade === 'mg') {
      return { quantidade, unidade: 'mg' };
    }
    const fator = MASS_TO_MG[unidade];
    return {
      quantidade: quantidade * fator,
      unidade: 'mg'
    };
  }

  if (isVolumeUnit(unidade)) {
    if (unidade === 'mL') {
      return { quantidade, unidade: 'mL' };
    }
    const fator = VOLUME_TO_ML[unidade];
    return {
      quantidade: quantidade * fator,
      unidade: 'mL'
    };
  }

  return { quantidade, unidade };
}

export function convertFromStandardUnit(
  quantidadePadrao: number,
  unidadePadrao: string,
  unidadeDesejada: string
): number {
  if (unidadePadrao === 'mg' && isMassUnit(unidadeDesejada)) {
    const fator = MASS_TO_MG[unidadeDesejada];
    return quantidadePadrao / fator;
  }

  if (unidadePadrao === 'mL' && isVolumeUnit(unidadeDesejada)) {
    const fator = VOLUME_TO_ML[unidadeDesejada];
    return quantidadePadrao / fator;
  }

  return quantidadePadrao;
}

export function getBestDisplayUnit(quantidadeMgOrMl: number, unidadePadrao: 'mg' | 'mL'): { quantidade: number; unidade: string } {
  if (unidadePadrao === 'mg') {
    if (quantidadeMgOrMl >= 1_000_000_000) {
      return { quantidade: quantidadeMgOrMl / 1_000_000_000, unidade: 'ton' };
    }
    if (quantidadeMgOrMl >= 60_000_000) {
      const sacas = quantidadeMgOrMl / 60_000_000;
      if (Math.abs(sacas - Math.round(sacas)) < 0.01) {
        return { quantidade: Math.round(sacas), unidade: 'saca' };
      }
    }
    if (quantidadeMgOrMl >= 1_000_000) {
      return { quantidade: quantidadeMgOrMl / 1_000_000, unidade: 'kg' };
    }
    if (quantidadeMgOrMl >= 1_000) {
      return { quantidade: quantidadeMgOrMl / 1_000, unidade: 'g' };
    }
    return { quantidade: quantidadeMgOrMl, unidade: 'mg' };
  }

  if (unidadePadrao === 'mL') {
    if (quantidadeMgOrMl >= 1_000) {
      return { quantidade: quantidadeMgOrMl / 1_000, unidade: 'L' };
    }
    return { quantidade: quantidadeMgOrMl, unidade: 'mL' };
  }

  return { quantidade: quantidadeMgOrMl, unidade: unidadePadrao };
}

export function formatQuantityWithUnit(quantidade: number, unidade: string): string {
  const formatted = quantidade % 1 === 0 ? quantidade.toString() : quantidade.toFixed(2);
  return `${formatted} ${unidade}`;
}
