import { supabase } from '../lib/supabase';
import { TalhaoService } from './talhaoService';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Busca o valor total de movimentações de estoque do tipo saída
 * para calcular insumos por talhão (distribuição proporcional por área)
 */
async function getTotalMovimentacoesEstoque(
  userId: string,
  dataInicio: Date | null,
  dataFim: Date | null
): Promise<number> {
  try {
    let query = supabase
      .from('movimentacoes_estoque')
      .select('valor_total_movimentacao, tipo, created_at')
      .eq('user_id', userId)
      .eq('tipo', 'saida');

    if (dataInicio) {
      query = query.gte('created_at', format(dataInicio, 'yyyy-MM-dd'));
    }
    if (dataFim) {
      query = query.lte('created_at', format(dataFim, 'yyyy-MM-dd') + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar movimentações de estoque:', error);
      return 0;
    }

    // Somar todos os valores de movimentações de saída
    const total = (data || []).reduce((acc, mov) => {
      const valor = typeof mov.valor_total_movimentacao === 'string' 
        ? parseFloat(mov.valor_total_movimentacao) 
        : (mov.valor_total_movimentacao || 0);
      return acc + Math.abs(valor);
    }, 0);

    console.log('📦 Total movimentações estoque (saídas):', total, 'de', data?.length || 0, 'registros');
    return total;
  } catch (err) {
    console.error('❌ Erro ao buscar movimentações de estoque:', err);
    return 0;
  }
}

export interface CustoTalhao {
  id: string;
  talhao: string;
  area: number;
  insumos: number;
  operacional: number;
  servicosLogistica: number;
  administrativos: number;
  outros: number;
  total: number;
  custoHa: number;
}

export interface DetalheCusto {
  data: string;
  categoria: string;
  descricao: string;
  origem: 'Financeiro' | 'Atividade Agrícola';
  valor: number;
  macrogrupo: string;
}

export interface Pendencia {
  tipo: string;
  referencia: string;
  descricao: string;
  status: string;
}

export interface FiltrosCustoPorTalhao {
  safra?: string;
  fazenda?: string;
  talhoes?: string[];
  macrogrupo?: string;
  mesAno?: string; // formato 'YYYY-MM'
}

// Mapeamento de categorias para macrogrupos
// Baseado nas categorias reais do banco de dados
const MACRO_CATEGORIAS = {
  insumos: [
    // Coluna 'insumos' será zerada - não busca de transacoes_financeiras
  ],
  operacional: [
    'Máquinas e Equipamentos',
    'Irrigação',
    'Aluguel de Máquinas',
    'Mão de obra',
    'Manutenção e Instalações'
  ],
  servicosLogistica: [
    'Transporte',
    'Beneficiamento',
    'Despesas de armazenagem',
    'Classificação',
    'Assistência Técnica',
    'Serviços Diversos',
    'Análise de Solo'
  ],
  administrativos: [
    'Despesas Administrativas',
    'Despesas Gerais',
    'Encargos Sociais',
    'Arrendamento',
    'Seguro',
    'Gestão/Administração'
  ],
  outros: [
    'Outros',
    'Venda'
  ]
} as const;

// Keywords para identificação por descrição (fallback quando categoria não bate)
const KEYWORDS_MACROGRUPOS = {
  insumos: [], // Coluna 'insumos' será zerada - não busca de transacoes_financeiras
  operacional: ['diesel', 'gasolina', 'combustivel', 'combustível', 'manutenc', 'manutenção', 'repar', 'mao de obra', 'mão de obra', 'salario', 'salário', 'trator', 'colheita', 'irrigação', 'mourão', 'mourao', 'cerca', 'instalação', 'instalacao'],
  servicosLogistica: ['transporte', 'frete', 'beneficiament', 'armazen', 'classifica', 'assistência', 'assistencia', 'analise de solo', 'análise de solo'],
  administrativos: ['administrativ', 'encargo', 'arrend', 'seguro', 'imposto', 'taxa', 'gestao', 'gestão', 'administracao', 'administração'],
  outros: ['outro', 'venda']
} as const;

export class CustoPorTalhaoService {
  /**
   * Helper para normalizar strings (remover acentos e caracteres especiais)
   */
  private static normalize(input: string): string {
    if (!input) return '';
    try {
      return input
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    } catch {
      return input.toString().trim().toLowerCase();
    }
  }

  /**
   * Identifica o macrogrupo de uma transação baseado na categoria ou descrição
   */
  private static identificarMacrogrupo(categoria: string, descricao: string): keyof typeof MACRO_CATEGORIAS | null {
    const catLower = (categoria || '').toLowerCase();
    const descNorm = this.normalize(descricao);

    // Primeiro tenta por categoria exata
    for (const [grupo, categorias] of Object.entries(MACRO_CATEGORIAS)) {
      if (categorias.some(c => c.toLowerCase() === catLower)) {
        return grupo as keyof typeof MACRO_CATEGORIAS;
      }
    }

    // Se não encontrou, tenta por keywords na descrição
    for (const [grupo, keywords] of Object.entries(KEYWORDS_MACROGRUPOS)) {
      if (keywords.some(kw => descNorm.includes(kw))) {
        return grupo as keyof typeof MACRO_CATEGORIAS;
      }
    }

    return null;
  }

  /**
   * Calcula as datas de início e fim da safra
   * Safra agrícola brasileira: Maio do ano X até Abril do ano X+1
   * Exemplo: safra "2024/2025" = 01/05/2024 a 30/04/2025
   */
  private static calcularPeriodoSafra(safra: string): { inicio: Date; fim: Date } {
    // Extrai o primeiro ano da safra (ex: "2024/2025" -> 2024)
    const match = safra.match(/(\d{4})/);
    const anoInicio = match ? parseInt(match[1]) : new Date().getFullYear();
    
    return {
      inicio: new Date(anoInicio, 4, 1), // 1º de Maio
      fim: new Date(anoInicio + 1, 3, 30, 23, 59, 59) // 30 de Abril do próximo ano
    };
  }

  /**
   * Busca custos consolidados por talhão com filtros completos
   */
  static async getCustosPorTalhao(
    userId: string,
    filtros: FiltrosCustoPorTalhao = {}
  ): Promise<CustoTalhao[]> {
    try {
      console.log('📊 [CustoPorTalhaoService] getCustosPorTalhao - Iniciando', { userId, filtros });

      // 1. Buscar talhões do usuário (non-default e ativos)
      const talhoes = await TalhaoService.getTalhoesNonDefault(userId, { onlyActive: true });
      const eligibleTalhoes = (talhoes || []).filter(t => t && !t.talhao_default && (t.area || 0) > 0);

      if (eligibleTalhoes.length === 0) {
        console.log('⚠️ Nenhum talhão elegível encontrado');
        return [];
      }

      // Filtrar talhões se especificado nos filtros
      let talhoesParaProcessar = eligibleTalhoes;
      if (filtros.talhoes && filtros.talhoes.length > 0) {
        talhoesParaProcessar = eligibleTalhoes.filter(t => 
          filtros.talhoes!.includes(t.id_talhao) || filtros.talhoes!.includes(t.nome)
        );
      }

      // Filtrar por fazenda se especificado
      if (filtros.fazenda) {
        talhoesParaProcessar = talhoesParaProcessar.filter(t => 
          t.id_propriedade === filtros.fazenda
        );
      }

      // Criar mapa de talhões para lookup rápido
      const nameMap = new Map<string, typeof eligibleTalhoes[0]>();
      const talhaoNames: string[] = []; // Lista de nomes normalizados para busca flexível
      let totalArea = 0;
      for (const t of talhoesParaProcessar) {
        const nameKey = this.normalize(t.nome || '');
        nameMap.set(nameKey, t);
        talhaoNames.push(nameKey);
        totalArea += (t.area || 0);
      }

      /**
       * Busca o talhão correspondente ao area_vinculada
       * Tenta match exato primeiro, depois busca se contém o nome do talhão
       */
      const findTalhaoByAreaVinculada = (areaVinculada: string): typeof eligibleTalhoes[0] | null => {
        if (!areaVinculada) return null;
        
        const areaKey = this.normalize(areaVinculada);
        
        // 1. Match exato
        if (nameMap.has(areaKey)) {
          return nameMap.get(areaKey)!;
        }
        
        // 2. Busca se area_vinculada contém algum nome de talhão
        for (const talhaoName of talhaoNames) {
          if (areaKey.includes(talhaoName) || talhaoName.includes(areaKey)) {
            return nameMap.get(talhaoName)!;
          }
        }
        
        return null;
      };

      // 2. Calcular período de filtro
      let dataInicio: Date | null = null;
      let dataFim: Date | null = null;

      // Filtro por mês específico
      if (filtros.mesAno) {
        const [ano, mes] = filtros.mesAno.split('-').map(Number);
        const dataRef = new Date(ano, mes - 1, 1);
        dataInicio = startOfMonth(dataRef);
        dataFim = endOfMonth(dataRef);
      }
      // Filtro por safra
      else if (filtros.safra) {
        const periodo = this.calcularPeriodoSafra(filtros.safra);
        dataInicio = periodo.inicio;
        dataFim = periodo.fim;
      }
      // Default: safra atual
      else {
        const hoje = new Date();
        const anoAtual = hoje.getMonth() >= 4 ? hoje.getFullYear() : hoje.getFullYear() - 1;
        const safraAtual = `${anoAtual}/${anoAtual + 1}`;
        const periodo = this.calcularPeriodoSafra(safraAtual);
        dataInicio = periodo.inicio;
        dataFim = periodo.fim;
      }

      console.log('📅 Período de filtro:', {
        inicio: dataInicio ? format(dataInicio, 'dd/MM/yyyy') : 'N/A',
        fim: dataFim ? format(dataFim, 'dd/MM/yyyy') : 'N/A'
      });

      // 3. Buscar total de insumos das movimentações de estoque (saídas)
      // O valor será distribuído proporcionalmente pela área dos talhões
      const totalInsumosEstoque = await getTotalMovimentacoesEstoque(userId, dataInicio, dataFim);
      console.log('📦 Total insumos de estoque para distribuir:', totalInsumosEstoque);

      // 4. Buscar transações financeiras do período
      let query = supabase
        .from('transacoes_financeiras')
        .select('id_transacao, valor, categoria, descricao, area_vinculada, data_agendamento_pagamento, tipo_transacao, status')
        .eq('user_id', userId)
        .eq('tipo_transacao', 'GASTO')
        .eq('status', 'Pago');

      if (dataInicio) {
        query = query.gte('data_agendamento_pagamento', format(dataInicio, 'yyyy-MM-dd'));
      }
      if (dataFim) {
        query = query.lte('data_agendamento_pagamento', format(dataFim, 'yyyy-MM-dd') + 'T23:59:59');
      }

      const { data: transacoes, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        throw error;
      }

      console.log('💰 Transações encontradas:', transacoes?.length || 0);

      // 5. Inicializar resultado com todos os talhões
      const resultado: Record<string, CustoTalhao> = {};
      for (const t of talhoesParaProcessar) {
        resultado[t.id_talhao] = {
          id: t.id_talhao,
          talhao: t.nome,
          area: t.area || 0,
          insumos: 0,
          operacional: 0,
          servicosLogistica: 0,
          administrativos: 0,
          outros: 0,
          total: 0,
          custoHa: 0
        };
      }

      // 6. Distribuir insumos de estoque proporcionalmente pela área
      if (totalInsumosEstoque > 0 && totalArea > 0) {
        for (const id of Object.keys(resultado)) {
          const talhao = resultado[id];
          const proporcao = talhao.area / totalArea;
          talhao.insumos = totalInsumosEstoque * proporcao;
        }
        console.log('✅ Insumos de estoque distribuídos proporcionalmente entre', Object.keys(resultado).length, 'talhões');
      }

      // Acumuladores para custos sem vínculo específico (exceto insumos que vem do estoque)
      const semVinculo: Record<keyof typeof MACRO_CATEGORIAS, number> = {
        insumos: 0,
        operacional: 0,
        servicosLogistica: 0,
        administrativos: 0,
        outros: 0
      };

      // 7. Processar cada transação financeira (exceto insumos que já vem do estoque)
      for (const tr of (transacoes || [])) {
        const valor = typeof tr.valor === 'string' ? parseFloat(tr.valor) : (tr.valor || 0);
        const valorAbs = Math.abs(valor);

        // Identificar macrogrupo
        const macrogrupo = this.identificarMacrogrupo(tr.categoria || '', tr.descricao || '');
        
        if (!macrogrupo) {
          console.log('⚠️ Transação sem macrogrupo identificado:', { id: tr.id_transacao, categoria: tr.categoria, descricao: tr.descricao });
          continue;
        }

        // Pular insumos - eles são calculados a partir das movimentações de estoque
        if (macrogrupo === 'insumos') {
          continue;
        }

        // Filtrar por macrogrupo se especificado
        if (filtros.macrogrupo && filtros.macrogrupo !== 'Todos' && filtros.macrogrupo !== macrogrupo) {
          continue;
        }

        // Verificar vínculo com talhão
        const areaVinc = (tr.area_vinculada || '').toString().trim();
        const talhaoVinculado = findTalhaoByAreaVinculada(areaVinc);

        if (talhaoVinculado && resultado[talhaoVinculado.id_talhao]) {
          // Atribuir ao talhão específico
          resultado[talhaoVinculado.id_talhao][macrogrupo] += valorAbs;
        } else {
          // Acumular para distribuição proporcional
          semVinculo[macrogrupo] += valorAbs;
        }
      }

      // 8. Distribuir custos sem vínculo proporcionalmente pela área (exceto insumos)
      if (totalArea > 0) {
        for (const grupo of Object.keys(semVinculo) as Array<keyof typeof semVinculo>) {
          // Pular insumos - já foram distribuídos a partir do estoque
          if (grupo === 'insumos') continue;
          
          const totalGrupo = semVinculo[grupo];
          if (totalGrupo <= 0) continue;

          for (const id of Object.keys(resultado)) {
            const talhao = resultado[id];
            const proporcao = talhao.area / totalArea;
            talhao[grupo] += totalGrupo * proporcao;
          }
        }
      }

      // 9. Calcular totais e custo/ha
      const resultadoFinal = Object.values(resultado).map(t => {
        const total = t.insumos + t.operacional + t.servicosLogistica + t.administrativos + t.outros;
        return {
          ...t,
          total,
          custoHa: t.area > 0 ? total / t.area : 0
        };
      });

      console.log('✅ Custos calculados para', resultadoFinal.length, 'talhões');
      
      return resultadoFinal;

    } catch (error) {
      console.error('❌ Erro ao buscar custos por talhão:', error);
      throw error;
    }
  }

  /**
   * Busca detalhes de custos de um talhão específico
   */
  static async getDetalhesCustoTalhao(
    _userId: string,
    _talhaoId: string,
    _filtros: FiltrosCustoPorTalhao
  ): Promise<DetalheCusto[]> {
    try {
      // TODO: Implementar lógica de busca de detalhes
      // Combinar dados de transações financeiras e atividades agrícolas
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar detalhes de custo:', error);
      throw error;
    }
  }

  /**
   * Busca pendências relacionadas a custos
   */
  static async getPendencias(_userId: string): Promise<Pendencia[]> {
    try {
      // TODO: Implementar lógica de busca de pendências
      // Verificar notas fiscais sem detalhes, consumos sem estoque, etc.
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar pendências:', error);
      throw error;
    }
  }

  /**
   * Calcula indicadores agregados
   */
  static async getIndicadores(
    _userId: string,
    _filtros: FiltrosCustoPorTalhao
  ): Promise<{
    totalCustos: number;
    custoMedioHa: number;
    totalPendencias: number;
    distribuicaoMacrogrupos: Record<string, number>;
  }> {
    try {
      // TODO: Implementar cálculo de indicadores
      
      return {
        totalCustos: 0,
        custoMedioHa: 0,
        totalPendencias: 0,
        distribuicaoMacrogrupos: {}
      };
    } catch (error) {
      console.error('Erro ao calcular indicadores:', error);
      throw error;
    }
  }

  /**
   * Lista safras disponíveis para o usuário
   */
  static async getSafras(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('talhoes')
        .select('safra')
        .eq('usuario_id', userId)
        .order('safra', { ascending: false });

      if (error) throw error;

      // Remover duplicatas
      const safras = [...new Set(data?.map(t => t.safra).filter(Boolean) || [])];
      return safras;
    } catch (error) {
      console.error('Erro ao buscar safras:', error);
      return [];
    }
  }

  /**
   * Lista fazendas disponíveis para o usuário
   */
  static async getFazendas(userId: string): Promise<Array<{ id: string; nome: string }>> {
    try {
      const { data, error } = await supabase
        .from('propriedades')
        .select('id_propriedade, nome')
        .eq('usuario_id', userId);

      if (error) throw error;

      return data?.map(p => ({
        id: p.id_propriedade,
        nome: p.nome
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar fazendas:', error);
      return [];
    }
  }

  /**
   * Lista talhões disponíveis para o usuário
   */
  static async getTalhoes(
    userId: string,
    fazendaId?: string
  ): Promise<Array<{ id: string; nome: string }>> {
    try {
      let query = supabase
        .from('talhoes')
        .select('id_talhao, nome')
        .eq('usuario_id', userId);

      if (fazendaId) {
        query = query.eq('id_propriedade', fazendaId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(t => ({
        id: t.id_talhao,
        nome: t.nome
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar talhões:', error);
      return [];
    }
  }

  /**
   * Agrupa e retorna valores de insumos por talhão para um dia específico.
   * - Filtra transações do tipo GASTO e status Pago com data_agendamento_pagamento = data
   * - Identifica insumos por categoria OU por keywords na descrição
   * - Quando `area_vinculada` contém o nome do talhão, atribui ao talhão
   * - Quando sem vínculo, distribui proporcionalmente pela área dos talhões non-default
   */
  static async getInsumosPorTalhao(
    userId: string,
    dataAgendamento: string
  ): Promise<Record<string, { id: string; nome: string; area: number; insumos: number; operacional: number; servicosLogistica: number; administrativos: number; outros: number; receita: number }>> {
    try {
      // Carrega talhões non-default e ativos do usuário, filtrando area>0 e talhao_default=false
      const talhoes = await TalhaoService.getTalhoesNonDefault(userId, { onlyActive: true });
      const eligibleTalhoes = (talhoes || []).filter(t => t && !t.talhao_default && (t.area || 0) > 0);

      // helper: normaliza strings removendo acentos, caracteres extras e espaços
      const normalize = (input: string) => {
        if (!input) return '';
        try {
          return input
            .toString()
            .normalize('NFD')
            .replace(/[ -\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        } catch (e) {
          return input.toString().trim().toLowerCase();
        }
      };

      // mapa nome normalizado -> talhão
      const nameMap = new Map<string, typeof eligibleTalhoes[0]>();
      const talhaoNames: string[] = []; // Lista de nomes normalizados para busca flexível
      let totalArea = 0;
      for (const t of eligibleTalhoes) {
        const nameKey = normalize(t.nome || '');
        nameMap.set(nameKey, t);
        talhaoNames.push(nameKey);
        totalArea += (t.area || 0);
      }

      /**
       * Busca o talhão correspondente ao area_vinculada
       * Tenta match exato primeiro, depois busca se contém o nome do talhão
       */
      const findTalhaoByAreaVinculada = (areaVinculada: string): typeof eligibleTalhoes[0] | null => {
        if (!areaVinculada) return null;
        
        const areaKey = normalize(areaVinculada);
        
        // 1. Match exato
        if (nameMap.has(areaKey)) {
          return nameMap.get(areaKey)!;
        }
        
        // 2. Busca se area_vinculada contém algum nome de talhão
        for (const talhaoName of talhaoNames) {
          if (areaKey.includes(talhaoName) || talhaoName.includes(areaKey)) {
            return nameMap.get(talhaoName)!;
          }
        }
        
        return null;
      };

      // Macrogrupos: categorias do banco de dados e keywords
      const macroCategorias = {
        insumos: [
          // Coluna 'insumos' será zerada - não busca de transacoes_financeiras
        ],
        operacional: [
          'Máquinas e Equipamentos',
          'Irrigação',
          'Aluguel de Máquinas',
          'Mão de obra',
          'Manutenção e Instalações'
        ],
        servicosLogistica: [
          'Transporte',
          'Beneficiamento',
          'Despesas de armazenagem',
          'Classificação',
          'Assistência Técnica',
          'Serviços Diversos',
          'Análise de Solo'
        ],
        administrativos: [
          'Despesas Administrativas',
          'Despesas Gerais',
          'Encargos Sociais',
          'Arrendamento',
          'Seguro',
          'Gestão/Administração'
        ],
        outros: [
          'Outros',
          'Venda'
        ],
        receita: [
          'Receita'
        ]
      } as const;

      const keywords = {
        insumos: [], // Coluna 'insumos' será zerada - não busca de transacoes_financeiras
        operacional: ['diesel', 'gasolina', 'combustivel', 'combustível', 'manutenc', 'manutenção', 'repar', 'mao de obra', 'mão de obra', 'salario', 'salário', 'trator', 'colheita', 'irrigação', 'mourão', 'mourao', 'cerca', 'instalação', 'instalacao'],
        servicosLogistica: ['transporte', 'frete', 'beneficiament', 'armazen', 'classifica', 'assistência', 'assistencia', 'analise de solo', 'análise de solo'],
        administrativos: ['administrativ', 'encargo', 'arrend', 'seguro', 'imposto', 'taxa', 'gestao', 'gestão', 'administracao', 'administração'],
        outros: ['outro', 'venda'],
        receita: ['receita']
      } as const;

      // Consulta transações até o final do dia (inclusive)
      // dataAgendamento é esperado no formato 'YYYY-MM-DD'
      const endOfDay = `${dataAgendamento}T23:59:59`;
      const { data: transacoes, error } = await supabase
        .from('transacoes_financeiras')
        .select('id_transacao, valor, categoria, descricao, area_vinculada, data_agendamento_pagamento, tipo_transacao, status')
        .eq('user_id', userId)
        .eq('tipo_transacao', 'GASTO')
        .eq('status', 'Pago')
        .lte('data_agendamento_pagamento', endOfDay);

      if (error) {
        console.error('Erro ao buscar transações:', error);
        throw error;
      }

      try { console.log('transacoes retornadas count:', (transacoes || []).length); } catch(e) {}
      try {
        console.log('query filters:', { user_id: userId, tipo_transacao: 'GASTO', status: 'Pago', data_agendamento_pagamento_lte: endOfDay });
        console.log('transacoes amostra:', (transacoes || []).map(t => ({ id: t.id_transacao, user_id: (t as any).user_id || (t as any).usuario_id, categoria: t.categoria, descricao: t.descricao, area_vinculada: t.area_vinculada, data_agendamento_pagamento: t.data_agendamento_pagamento, tipo_transacao: t.tipo_transacao, status: t.status })));
      } catch (e) {}

      // inicializa resultado com talhões elegíveis e todos os macrogrupos
      const result: Record<string, { id: string; nome: string; area: number; insumos: number; operacional: number; servicosLogistica: number; administrativos: number; outros: number; receita: number }> = {};
      for (const t of eligibleTalhoes) {
        result[t.id_talhao] = {
          id: t.id_talhao,
          nome: t.nome,
          area: t.area || 0,
          insumos: 0,
          operacional: 0,
          servicosLogistica: 0,
          administrativos: 0,
          outros: 0,
          receita: 0
        };
      }

      // acumuladores para itens sem vínculo por macrogrupo
      const semVinculo: Record<string, number> = {
        insumos: 0,
        operacional: 0,
        servicosLogistica: 0,
        administrativos: 0,
        outros: 0,
        receita: 0
      };

      // Logs agrupados para diagnóstico
      try {
        console.groupCollapsed && console.groupCollapsed('CustoPorTalhaoService.getInsumosPorTalhao');
        console.log('dataAgendamento:', dataAgendamento);
        console.log('talhoes elegiveis count:', eligibleTalhoes.length);
        console.log('totalArea:', totalArea);
        console.log('talhoes elegiveis:', eligibleTalhoes.map(t => ({ id: t.id_talhao, nome: t.nome, area: t.area })));
      } catch (e) {
        /* ignore logging errors */
      }

      for (const tr of (transacoes || [])) {
        const valor = typeof tr.valor === 'string' ? parseFloat(tr.valor) : (tr.valor || 0);
        const valorAbs = Math.abs(valor || 0);

        // identificar macrogrupo por categoria ou descricao
        const categoria = (tr.categoria || '') as string;
        const descricaoRaw = (tr.descricao || '').toString();
        const descricao = normalize(descricaoRaw);

        // detect by exact category (case-insensitive) first
        const catLower = (categoria || '').toString().toLowerCase();
        let matchedGroup: keyof typeof semVinculo | null = null;
        for (const g of Object.keys(macroCategorias) as Array<keyof typeof macroCategorias>) {
          const cats = (macroCategorias as any)[g] as string[];
          if (cats.some(c => c.toLowerCase() === catLower)) {
            matchedGroup = g as keyof typeof semVinculo;
            break;
          }
        }

        // if not matched by category, try keywords in description
        if (!matchedGroup) {
          for (const g of Object.keys(keywords) as Array<keyof typeof keywords>) {
            const kws = (keywords as any)[g] as string[];
            if (kws.some(k => descricao.includes(k))) {
              matchedGroup = g as keyof typeof semVinculo;
              break;
            }
          }
        }

        if (!matchedGroup) {
          try { console.log('transacao ignorada (não categorizada):', { id: tr.id_transacao, categoria, descricao: descricaoRaw, valor: valorAbs }); } catch(e){}
          continue;
        }

        const areaVinc = (tr.area_vinculada || '').toString().trim();
        const talhaoVinculado = findTalhaoByAreaVinculada(areaVinc);

        if (talhaoVinculado) {
          // atribui todo o valor ao talhão vinculado
          if (!result[talhaoVinculado.id_talhao]) {
            result[talhaoVinculado.id_talhao] = {
              id: talhaoVinculado.id_talhao,
              nome: talhaoVinculado.nome,
              area: talhaoVinculado.area || 0,
              insumos: 0,
              operacional: 0,
              servicosLogistica: 0,
              administrativos: 0,
              outros: 0,
              receita: 0
            };
          }
          // acumula no grupo identificado
          (result[talhaoVinculado.id_talhao] as any)[matchedGroup] += valorAbs;
          try { console.log('alocado por vinculo:', { id: tr.id_transacao, valor: valorAbs, area_vinculada: areaVinc, talhao: talhaoVinculado.nome, grupo: matchedGroup }); } catch(e){}
        } else {
          // sem vínculo detectável — acumula para distribuir depois por grupo
          semVinculo[matchedGroup] += valorAbs;
          try { console.log('sem vinculo (acumulado):', { id: tr.id_transacao, valor: valorAbs, area_vinculada: areaVinc, grupo: matchedGroup }); } catch(e){}
        }
      }

      try { console.log('semVinculo antes distribuicao por grupo:', semVinculo); } catch(e){}

      // distribuir semVinculo proporcionalmente pela area por grupo
      if (totalArea > 0) {
        for (const groupKey of Object.keys(semVinculo)) {
          const totalForGroup = semVinculo[groupKey] || 0;
          if (totalForGroup <= 0) continue;
          for (const id of Object.keys(result)) {
            const tal = result[id];
            const share = (tal.area / totalArea) * totalForGroup;
            (tal as any)[groupKey] += share;
            try { console.log('distribuido para talhao:', { grupo: groupKey, id: tal.id, nome: tal.nome, area: tal.area, share }); } catch(e){}
          }
        }
      }

      try {
        console.log('resultado final custos por talhao:', Object.keys(result).map(k => ({ id: k, insumos: result[k].insumos, operacional: result[k].operacional, servicosLogistica: result[k].servicosLogistica, administrativos: result[k].administrativos, outros: result[k].outros, receita: result[k].receita })));
        console.groupEnd && console.groupEnd();
      } catch (e) {
        /* ignore logging errors */
      }

      return result;
    } catch (error) {
      console.error('Erro em getInsumosPorTalhao:', error);
      throw error;
    }
  }
}
