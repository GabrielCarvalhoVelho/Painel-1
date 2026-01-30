import { TransacaoFinanceira } from '../lib/supabase';
// Mock simples para fluxo front-end. Substituir por chamadas reais ao conectar ao DB.
let MOCK_DATA: TransacaoFinanceira[] = [
  {
    id_transacao: 'mock-1',
    user_id: 'mock-user',
    tipo_transacao: 'GASTO',
    valor: -300,
    descricao: 'Gastei 300 reais em adubo',
    categoria: null,
    pagador_recebedor: null,
    forma_pagamento_recebimento: null,
    status: 'Pendente',
    data_agendamento_pagamento: null,
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: null,
    alocacoes: [],
    esperando_por_anexo: false,
    is_completed: false as any
  } as unknown as TransacaoFinanceira,
  {
    id_transacao: 'mock-2',
    user_id: 'mock-user',
    tipo_transacao: 'GASTO',
    valor: -1540.5,
    descricao: 'Pagamento do serviço de trator',
    categoria: 'Manutenção',
    pagador_recebedor: 'João',
    forma_pagamento_recebimento: 'Dinheiro',
    status: 'Pendente',
    data_agendamento_pagamento: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: 'Talhão A',
    alocacoes: [],
    esperando_por_anexo: true,
    is_completed: false as any
  } as unknown as TransacaoFinanceira
  ,
  {
    id_transacao: 'mock-3',
    user_id: 'mock-user',
    tipo_transacao: 'RECEITA',
    valor: 2500,
    descricao: 'Venda de café - lote 1',
    categoria: 'Venda',
    pagador_recebedor: 'Cooperativa X',
    forma_pagamento_recebimento: 'Transf. Bancária',
    status: 'Pendente',
    data_agendamento_pagamento: null,
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: 'Propriedade Central',
    alocacoes: [],
    esperando_por_anexo: false,
    is_completed: false as any
  } as unknown as TransacaoFinanceira,
  {
    id_transacao: 'mock-4',
    user_id: 'mock-user',
    tipo_transacao: 'GASTO',
    valor: -120,
    descricao: 'Compra de sementes',
    categoria: 'Insumos',
    pagador_recebedor: 'Loja Agro',
    forma_pagamento_recebimento: 'Pix',
    status: 'Pendente',
    data_agendamento_pagamento: null,
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: 'Talhão C',
    alocacoes: [],
    esperando_por_anexo: false,
    is_completed: false as any
  } as unknown as TransacaoFinanceira,
  {
    id_transacao: 'mock-5',
    user_id: 'mock-user',
    tipo_transacao: 'GASTO',
    valor: -75.5,
    descricao: 'Combustível para gerador',
    categoria: 'Transporte',
    pagador_recebedor: 'Posto Y',
    forma_pagamento_recebimento: 'Cartão Débito',
    status: 'Pendente',
    data_agendamento_pagamento: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: null,
    alocacoes: [],
    esperando_por_anexo: false,
    is_completed: false as any
  } as unknown as TransacaoFinanceira,
  {
    id_transacao: 'mock-6',
    user_id: 'mock-user',
    tipo_transacao: 'RECEITA',
    valor: 4800,
    descricao: 'Venda de café - contrato',
    categoria: 'Venda',
    pagador_recebedor: 'Exportadora Z',
    forma_pagamento_recebimento: 'Boleto',
    status: 'Agendado',
    data_agendamento_pagamento: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: 'Talhão D',
    alocacoes: [],
    esperando_por_anexo: false,
    is_completed: false as any
  } as unknown as TransacaoFinanceira,
  {
    id_transacao: 'mock-7',
    user_id: 'mock-user',
    tipo_transacao: 'GASTO',
    valor: -420,
    descricao: 'Serviço de poda',
    categoria: 'Serviços Diversos',
    pagador_recebedor: 'Carlos',
    forma_pagamento_recebimento: 'Dinheiro',
    status: 'Pendente',
    data_agendamento_pagamento: null,
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: 'Talhão B',
    alocacoes: [],
    esperando_por_anexo: true,
    is_completed: false as any
  } as unknown as TransacaoFinanceira,
  {
    id_transacao: 'mock-8',
    user_id: 'mock-user',
    tipo_transacao: 'GASTO',
    valor: -60,
    descricao: 'Análise de solo',
    categoria: 'Análise de Solo',
    pagador_recebedor: 'Lab Agro',
    forma_pagamento_recebimento: 'Pix',
    status: 'Pago',
    data_agendamento_pagamento: null,
    data_transacao: new Date().toISOString(),
    data_registro: new Date().toISOString(),
    nome_talhao: 'Talhão E',
    alocacoes: [],
    esperando_por_anexo: false,
    is_completed: false as any
  } as unknown as TransacaoFinanceira,
  {
    id_transacao: 'mock-9',
    user_id: 'mock-user',
    tipo_transacao: 'RECEITA',
    valor: 1200,
    descricao: 'Pagamento por arrendamento',
    categoria: 'Arrendamento',
    pagador_recebedor: 'Cooperativa',
    forma_pagamento_recebimento: 'Transf. Bancária',
    status: 'Pendente',
    data_agendamento_pagamento: null,
    data_transacao: null,
    data_registro: new Date().toISOString(),
    nome_talhao: null,
    alocacoes: [],
    esperando_por_anexo: false,
    is_completed: false as any
  } as unknown as TransacaoFinanceira
];

const mockFinanceService = {
  async getIncompleteTransactions(_userId: string, limit = 10): Promise<TransacaoFinanceira[]> {
    // Simula atraso
    await new Promise(r => setTimeout(r, 120));
    return MOCK_DATA.filter(t => (t as any).is_completed === false).slice(0, limit);
  },

  async markAsCompleted(id_transacao: string): Promise<boolean> {
    const idx = MOCK_DATA.findIndex(m => m.id_transacao === id_transacao);
    if (idx === -1) return false;
    (MOCK_DATA[idx] as any).is_completed = true;
    return true;
  }

  ,

  async updateTransaction(id_transacao: string, payload: Partial<TransacaoFinanceira>): Promise<boolean> {
    const idx = MOCK_DATA.findIndex(m => m.id_transacao === id_transacao);
    if (idx === -1) return false;
    MOCK_DATA[idx] = { ...MOCK_DATA[idx], ...(payload as any) } as TransacaoFinanceira;
    return true;
  }

  ,

  async deleteTransaction(id_transacao: string): Promise<boolean> {
    const idx = MOCK_DATA.findIndex(m => m.id_transacao === id_transacao);
    if (idx === -1) return false;
    MOCK_DATA.splice(idx, 1);
    return true;
  }
};
  export default mockFinanceService;
