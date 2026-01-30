export interface ProdutoItem {
  id: string;
  nome: string;
  quantidade: string;
  unidade: string;
}

export interface MaquinaItem {
  id: string;
  nome: string;
  horas: string; // horas inteiras como string para input
}

export interface ActivityPayload {
  id?: string;
  data_atividade?: string;
  nome_talhao?: string;
  produtos?: ProdutoItem[];
  maquinas?: MaquinaItem[];
  imagem?: File;
  arquivo?: File;
  observacoes?: string;
  descricao?: string;
}

export type ActivityWithMeta = ActivityPayload & { is_completed?: boolean };
