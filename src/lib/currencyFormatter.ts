// src/lib/currencyFormatter.ts

/**
 * Calcula a quantidade ideal de casas decimais para exibir um valor
 * Se os 2 primeiros decimais são zero (0,00), expande até encontrar dígito diferente de zero
 * @param value - Valor numérico
 * @returns Número de casas decimais (entre 2 e 6)
 */
export const getOptimalDecimalPlaces = (value: number): number => {
  if (isNaN(value) || value === 0) return 2;

  const absValue = Math.abs(value);

  if (absValue >= 0.01) {
    return 2;
  }

  for (let decimals = 3; decimals <= 6; decimals++) {
    const threshold = Math.pow(10, -decimals);
    if (absValue >= threshold) {
      return decimals;
    }
  }

  return 6;
};

/**
 * Formata um valor numérico para o formato de moeda brasileira com decimais dinâmicos
 * Para valores >= R$ 0,01: exibe 2 casas decimais (R$ 1.234,56)
 * Para valores < R$ 0,01: expande decimais até mostrar valor significativo (R$ 0,0002)
 * @param value - Valor decimal
 * @returns String formatada no padrão brasileiro
 */
export const formatSmartCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'R$ 0,00';

  const decimalPlaces = getOptimalDecimalPlaces(numValue);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numValue);
};

/**
 * Formata valores grandes com unidades de medida apropriadas
 * Para valores até R$ 999.999: exibe valor completo (R$ 850.500,00)
 * Para valores de R$ 1 milhão a R$ 999 milhões: exibe em milhões (R$ 1,5 mi)
 * Para valores de R$ 1 bilhão em diante: exibe em bilhões (R$ 10 bi)
 * @param value - Valor numérico
 * @param options - Opções de formatação (showFullOnHover, decimals)
 * @returns String formatada com unidade de medida apropriada
 */
export const formatCurrencyWithUnit = (
  value: number | string,
  options?: { decimals?: number }
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'R$ 0,00';

  const absValue = Math.abs(numValue);
  const isNegative = numValue < 0;
  const sign = isNegative ? '-' : '';

  if (absValue < 1000) {
    return formatCurrency(numValue);
  }

  if (absValue < 1_000_000) {
    return formatCurrency(numValue);
  }

  if (absValue < 1_000_000_000) {
    const millions = absValue / 1_000_000;
    const decimals = options?.decimals ?? (millions < 10 ? 2 : 1);
    return `${sign}R$ ${millions.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })} mi`;
  }

  const billions = absValue / 1_000_000_000;
  const decimals = options?.decimals ?? (billions < 10 ? 2 : 1);
  return `${sign}R$ ${billions.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} bi`;
};

/**
 * Formata um valor numérico para o formato de moeda brasileira (R$ 1.000,00)
 * @param value - Valor decimal (ex: 1234.56)
 * @returns String formatada no padrão brasileiro (ex: "R$ 1.234,56")
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Remove formatação de moeda e retorna apenas os dígitos
 * @param value - String formatada (ex: "R$ 1.234,56")
 * @returns String com apenas números (ex: "123456")
 */
export const unformatCurrency = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Converte string de centavos para valor decimal
 * @param cents - String com centavos (ex: "123456" representa R$ 1.234,56)
 * @returns Número decimal (ex: 1234.56)
 */
export const centsToDecimal = (cents: string): number => {
  const numCents = parseInt(cents || '0', 10);
  return numCents / 100;
};

/**
 * Converte valor decimal para centavos
 * @param value - Valor decimal (ex: 1234.56)
 * @returns Número inteiro em centavos (ex: 123456)
 */
export const decimalToCents = (value: number): number => {
  return Math.round(value * 100);
};

/**
 * Formata o input enquanto o usuário digita
 * Implementação otimizada para BRL: usuário digita números e vê formatação automática
 * Exemplo: digita "12345" e vê "R$ 123,45"
 *
 * @param value - Valor atual do input (pode conter formatação ou não)
 * @returns Objeto com valor formatado para exibição e valor numérico correto
 */
export const formatCurrencyInput = (value: string): {
  formatted: string;
  numeric: number;
  rawCents: string;
} => {
  // Remove tudo que não for número
  const onlyNumbers = unformatCurrency(value);

  // Se vazio, retorna 0
  if (!onlyNumbers || onlyNumbers === '0') {
    return {
      formatted: 'R$ 0,00',
      numeric: 0,
      rawCents: '0'
    };
  }

  // Remove zeros à esquerda, mas mantém pelo menos um dígito
  const cleanedNumbers = onlyNumbers.replace(/^0+/, '') || '0';

  // Converte para centavos e depois para valor decimal correto
  // Exemplo: "12345" -> 123.45
  const numericValue = centsToDecimal(cleanedNumbers);

  // Formata para exibição usando a função padrão de formatação
  const formatted = formatCurrency(numericValue);

  return {
    formatted,
    numeric: numericValue,
    rawCents: cleanedNumbers
  };
};

/**
 * Formata input de valor total permitindo entrada decimal natural
 * Usuário pode digitar "450" ou "450,00" e será interpretado como R$ 450,00
 * Aceita vírgula ou ponto como separador decimal
 *
 * @param value - Valor digitado pelo usuário (ex: "450", "450,00", "450.50")
 * @returns Objeto com valor formatado e numérico
 */
export const formatDecimalCurrencyInput = (value: string): {
  formatted: string;
  numeric: number;
} => {
  // Remove espaços e R$
  let cleanValue = value.replace(/R\$/g, '').replace(/\s/g, '');

  // Se vazio, retorna 0
  if (!cleanValue || cleanValue === '') {
    return {
      formatted: 'R$ 0,00',
      numeric: 0
    };
  }

  // Substitui vírgula por ponto para parseFloat
  cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');

  // Remove caracteres não numéricos exceto ponto decimal
  cleanValue = cleanValue.replace(/[^\d.]/g, '');

  // Garante apenas um ponto decimal
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }

  // Converte para número
  const numericValue = parseFloat(cleanValue);

  // Se não for um número válido, retorna 0
  if (isNaN(numericValue)) {
    return {
      formatted: 'R$ 0,00',
      numeric: 0
    };
  }

  // Formata para exibição
  const formatted = formatCurrency(numericValue);

  return {
    formatted,
    numeric: numericValue
  };
};

/**
 * Converte um valor salvo no banco de dados para formato de exibição no input
 * @param dbValue - Valor do banco (pode ser number ou string)
 * @returns Objeto com valores formatados para uso no input
 */
export const initializeCurrencyInput = (dbValue: string | number | null | undefined): {
  formatted: string;
  numeric: number;
  rawCents: string;
} => {
  if (dbValue === null || dbValue === undefined || dbValue === '') {
    return {
      formatted: 'R$ 0,00',
      numeric: 0,
      rawCents: '0'
    };
  }

  const numValue = typeof dbValue === 'string' ? parseFloat(dbValue) : dbValue;

  if (isNaN(numValue) || numValue === 0) {
    return {
      formatted: 'R$ 0,00',
      numeric: 0,
      rawCents: '0'
    };
  }

  // Converte o valor decimal para centavos para manter consistência
  const cents = decimalToCents(numValue);

  return {
    formatted: formatCurrency(numValue),
    numeric: numValue,
    rawCents: cents.toString()
  };
};

/**
 * Hook de React para gerenciar input de moeda com comportamento otimizado
 * @param initialValue - Valor inicial (number ou string do banco de dados)
 * @returns Objeto com valores e funções para gerenciar o input
 */
export const useCurrencyInput = (initialValue: string | number = 0) => {
  const getInitialState = () => {
    if (typeof initialValue === 'number') {
      return initializeCurrencyInput(initialValue);
    }
    if (initialValue === '' || initialValue === '0') {
      return {
        formatted: 'R$ 0,00',
        numeric: 0,
        rawCents: '0'
      };
    }
    return initializeCurrencyInput(initialValue);
  };

  const initialState = getInitialState();
  const [displayValue, setDisplayValue] = React.useState<string>(initialState.formatted);
  const [numericValue, setNumericValue] = React.useState<number>(initialState.numeric);

  const handleChange = (inputValue: string) => {
    const result = formatCurrencyInput(inputValue);
    setDisplayValue(result.formatted);
    setNumericValue(result.numeric);
    return result;
  };

  const setValue = (value: number) => {
    const result = initializeCurrencyInput(value);
    setDisplayValue(result.formatted);
    setNumericValue(result.numeric);
  };

  return {
    displayValue,
    numericValue,
    handleChange,
    setValue,
    reset: () => {
      setDisplayValue('R$ 0,00');
      setNumericValue(0);
    }
  };
};

// Adiciona React ao escopo para o hook
import React from 'react';
