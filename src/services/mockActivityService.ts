import type { ActivityPayload, ActivityWithMeta } from '../types/activity';

let MOCK_ACTIVITIES: ActivityWithMeta[] = [
  {
    id: 'act-mock-1',
    descricao: 'Pulverização - área norte',
    nome_talhao: 'Talhão Norte',
    data_atividade: undefined,
    produtos: [],
    maquinas: [],
    is_completed: false
  },
  {
    id: 'act-mock-2',
    descricao: 'Adubação - talhão B',
    nome_talhao: 'Talhão B',
    data_atividade: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    produtos: [],
    maquinas: [],
    is_completed: false
  }
  ,
  {
    id: 'act-mock-3',
    descricao: 'Aplicação de fertilizante foliar',
    nome_talhao: 'Talhão C',
    data_atividade: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    produtos: [
      { id: 'p-31', nome: 'Fertilizante NPK 20-20-20', quantidade: '5', unidade: 'kg' },
      { id: 'p-32', nome: 'Quelato de ferro', quantidade: '0.5', unidade: 'kg' }
    ],
    maquinas: [
      { id: 'm-31', nome: 'Pulverizador Costal', horas: '2' }
    ],
    is_completed: false
  },
  {
    id: 'act-mock-4',
    descricao: 'Irrigação localizada',
    nome_talhao: 'Talhão D',
    data_atividade: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    produtos: [],
    maquinas: [
      { id: 'm-41', nome: 'Bomba Submersa', horas: '3' }
    ],
    is_completed: false
  },
  {
    id: 'act-mock-5',
    descricao: 'Colheita manual - lote 1',
    nome_talhao: 'Talhão A',
    data_atividade: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    produtos: [],
    maquinas: [
      { id: 'm-51', nome: 'Caminhão de transporte', horas: '0' }
    ],
    is_completed: false
  },
  {
    id: 'act-mock-6',
    descricao: 'Plantio de cobertura',
    nome_talhao: 'Talhão E',
    data_atividade: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    produtos: [
      { id: 'p-61', nome: 'Semente de aveia', quantidade: '10', unidade: 'kg' }
    ],
    maquinas: [],
    is_completed: false
  },
  {
    id: 'act-mock-7',
    descricao: 'Poda de formação',
    nome_talhao: 'Talhão B',
    data_atividade: undefined,
    produtos: [],
    maquinas: [
      { id: 'm-71', nome: 'Tesoura mecânica', horas: '4' }
    ],
    is_completed: false
  },
  {
    id: 'act-mock-8',
    descricao: 'Aplicação de defensivo - controle de pragas',
    nome_talhao: 'Talhão Norte',
    data_atividade: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    produtos: [
      { id: 'p-81', nome: 'Inseticida X', quantidade: '2', unidade: 'L' }
    ],
    maquinas: [
      { id: 'm-81', nome: 'Pulverizador de barra', horas: '1' }
    ],
    is_completed: false
  },
  {
    id: 'act-mock-9',
    descricao: 'Controle de plantas daninhas',
    nome_talhao: 'Talhão F',
    data_atividade: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    produtos: [
      { id: 'p-91', nome: 'Herbicida Y', quantidade: '1', unidade: 'L' }
    ],
    maquinas: [],
    is_completed: false
  }
];

const mockActivityService = {
  async getIncompleteActivities(_userId: string, limit = 10): Promise<ActivityPayload[]> {
    await new Promise(r => setTimeout(r, 120));
    return MOCK_ACTIVITIES.filter(a => a.is_completed !== true).slice(0, limit).map(({ is_completed, ...rest }) => rest);
  },

  async markAsCompleted(id: string): Promise<boolean> {
    const idx = MOCK_ACTIVITIES.findIndex(m => m.id === id);
    if (idx === -1) return false;
    MOCK_ACTIVITIES[idx].is_completed = true;
    return true;
  },

  async updateActivity(id: string, payload: ActivityPayload): Promise<boolean> {
    const idx = MOCK_ACTIVITIES.findIndex(m => m.id === id);
    if (idx === -1) return false;
    MOCK_ACTIVITIES[idx] = { ...MOCK_ACTIVITIES[idx], ...payload };
    return true;
  },

  async deleteActivity(id: string): Promise<boolean> {
    const idx = MOCK_ACTIVITIES.findIndex(m => m.id === id);
    if (idx === -1) return false;
    MOCK_ACTIVITIES.splice(idx, 1);
    return true;
  }
};

export default mockActivityService;
