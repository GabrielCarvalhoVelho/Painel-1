import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Utilitários para manipulação de datas
 *
 * IMPORTANTE: Este arquivo contém funções para lidar com o problema de timezone
 * ao converter datas do banco de dados para exibição no navegador.
 *
 * PROBLEMA: Quando o banco retorna uma data como "2025-10-06" (sem hora/timezone),
 * o JavaScript interpreta como "2025-10-06T00:00:00.000Z" (meia-noite UTC).
 * No Brasil (UTC-3), isso é convertido para "2025-10-05T21:00:00-03:00",
 * resultando em exibição de 05/10/2025 ao invés de 06/10/2025.
 *
 * SOLUÇÃO: Usar parseISO que trata a string como data local, não UTC.
 */

/**
 * Faz parse de uma string de data do banco de dados (formato YYYY-MM-DD)
 * e retorna um objeto Date tratando como data local (sem conversão de timezone).
 *
 * @param dateString - String de data no formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
 * @returns Date object ou null se inválido
 */
export function parseDateFromDB(dateString?: string | Date): Date | null {
  if (!dateString) return null;

  // Se já é um Date, retorna
  if (dateString instanceof Date) return dateString;

  try {
    // Para strings no formato YYYY-MM-DD (sem hora), adiciona hora local
    // para evitar conversão de timezone
    if (dateString.length === 10 && dateString.includes('-')) {
      // Cria data interpretando como local, não UTC
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Para strings com hora (ISO completo), usa parseISO do date-fns
    return parseISO(dateString);
  } catch {
    return null;
  }
}

/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy)
 * garantindo que a data exibida corresponde exatamente à data no banco.
 *
 * @param dateString - String de data do banco de dados
 * @returns String formatada no padrão brasileiro ou mensagem de erro
 */
export function formatDateBR(dateString?: string | Date): string {
  if (!dateString) return 'Data não informada';

  try {
    const date = parseDateFromDB(dateString);
    if (!date || isNaN(date.getTime())) {
      return typeof dateString === 'string' ? dateString : 'Data inválida';
    }

    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return typeof dateString === 'string' ? dateString : 'Data inválida';
  }
}

/**
 * Formata uma data com hora para o formato brasileiro (dd/MM/yyyy HH:mm)
 *
 * @param dateString - String de data do banco de dados com hora
 * @returns String formatada com data e hora
 */
export function formatDateTimeBR(dateString?: string | Date): string {
  if (!dateString) return 'Data não informada';

  try {
    const date = parseDateFromDB(dateString);
    if (!date || isNaN(date.getTime())) {
      return typeof dateString === 'string' ? dateString : 'Data inválida';
    }

    // incluir segundos conforme requisito: dd/MM/yyyy HH:mm:ss
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return typeof dateString === 'string' ? dateString : 'Data inválida';
  }
}

/**
 * Formata data para exibição curta (apenas dia/mês)
 *
 * @param dateString - String de data do banco de dados
 * @returns String formatada no padrão dd/MM
 */
export function formatDateShortBR(dateString?: string | Date): string {
  if (!dateString) return '';

  try {
    const date = parseDateFromDB(dateString);
    if (!date || isNaN(date.getTime())) {
      return '';
    }

    return format(date, 'dd/MM', { locale: ptBR });
  } catch {
    return '';
  }
}
