import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TransacaoFinanceira } from '../../lib/supabase';
import { FinanceService } from '../../services/financeService';
import { HistoricoTransacoesService } from '../../services/historicoTransacoesService';
import { AuthService } from '../../services/authService';
import { TalhaoService } from '../../services/talhaoService';
import { formatCurrencyInput, initializeCurrencyInput, formatCurrency } from '../../lib/currencyFormatter';
import { parseDateFromDB } from '../../lib/dateUtils';

/**
 * Extrai data no formato YYYY-MM-DD preservando o dia correto (evita bug timezone)
 */
function extrairDataParaInput(valor: string | Date | undefined | null): string {
  if (!valor) return '';
  
  // Se já é string no formato YYYY-MM-DD, retorna direto
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor;
  }
  
  // Se é string ISO completa, extrair só a parte da data
  if (typeof valor === 'string' && valor.includes('T')) {
    return valor.split('T')[0];
  }
  
  // Usa parseDateFromDB para evitar bug de timezone
  const d = parseDateFromDB(valor as string);
  if (!d) return '';
  
  // Formata como YYYY-MM-DD
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

interface TransacaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transacao: TransacaoFinanceira;
}

// Tipo local para o formulário
type LocalTransaction = {
  tipo_transacao: string;
  descricao: string;
  valor: number;
  categoria: string;
  pagador_recebedor: string;
  forma_pagamento: string;
  status: string;
  condicao_pagamento: string;
  numero_parcelas: number | undefined;
  data_primeira_parcela: string;
  data_agendamento_pagamento: string;
  talhao_id: string;
  nome_talhao: string;
};

export default function TransacaoFormModal({
  isOpen,
  onClose,
  onSave,
  transacao,
}: TransacaoFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [talhoes, setTalhoes] = useState<Array<any>>([]);
  const [valorDisplay, setValorDisplay] = useState<string>('R$ 0,00');
  const [local, setLocal] = useState<LocalTransaction>({
    tipo_transacao: '',
    descricao: '',
    valor: 0,
    categoria: '',
    pagador_recebedor: '',
    forma_pagamento: '',
    status: '',
    condicao_pagamento: '',
    numero_parcelas: undefined,
    data_primeira_parcela: '',
    data_agendamento_pagamento: '',
    talhao_id: '',
    nome_talhao: '',
  });

  // Carregar dados da transação no mount ou quando transacao mudar
  useEffect(() => {
    if (transacao) {
      const tx = transacao as any;
      
      // Derivar condição de pagamento (coluna real é tipo_pagamento)
      const derivedCond = tx.tipo_pagamento || tx.condicao_pagamento || tx.condicao || 
        ((tx.parcela || tx.numero_parcelas) ? 
          (((tx.parcela && String(tx.parcela).toLowerCase().includes('parcel')) || Number(tx.numero_parcelas) > 1) ? 'Parcelado' : 'À Vista') 
          : '');
      
      // Se for parcelado, preferir data_primeira_parcela
      const derivedDataPrimeira = extrairDataParaInput(tx.data_primeira_parcela) || 
                                   extrairDataParaInput(tx.data_agendamento_pagamento) || '';
      
      // Status derivado
      const derivedStatus = derivedCond === 'Parcelado' ? 'Agendado' : (tx.status || tx.situacao || 'Pago');
      
      // Tipo de transação
      const tipoRaw = tx.tipo_transacao ? String(tx.tipo_transacao).toLowerCase() : '';
      const tipoFormatted = tipoRaw === 'gasto' ? 'Gasto' : tipoRaw === 'receita' ? 'Receita' : '';
      
      // Talhão ID
      const talhaoId = tx.talhao_id || 
        (tx.talhao_ids && tx.talhao_ids.length > 0 ? tx.talhao_ids[0] : '') ||
        (tx.transacoes_talhoes && tx.transacoes_talhoes.length > 0 ? tx.transacoes_talhoes[0].id_talhao : '');
      
      setLocal({
        tipo_transacao: tipoFormatted,
        descricao: tx.descricao || '',
        valor: Math.abs(Number(tx.valor) || 0),
        categoria: tx.categoria || '',
        pagador_recebedor: tx.pagador_recebedor || '',
        forma_pagamento: tx.forma_pagamento || tx.forma_pagamento_recebimento || '',
        status: derivedStatus,
        condicao_pagamento: derivedCond,
        numero_parcelas: tx.numero_parcelas || undefined,
        data_primeira_parcela: derivedDataPrimeira,
        data_agendamento_pagamento: derivedCond === 'Parcelado' 
          ? derivedDataPrimeira 
          : (extrairDataParaInput(tx.data_agendamento_pagamento) || extrairDataParaInput(tx.data_transacao) || ''),
        talhao_id: talhaoId,
        nome_talhao: tx.nome_talhao || '',
      });
      
      // Inicializar display de valor
      const init = initializeCurrencyInput(tx.valor);
      const numericInit = init.numeric || 0;
      setValorDisplay(formatCurrency(Math.abs(numericInit)));
    }
  }, [transacao]);

  // Carregar talhões disponíveis
  useEffect(() => {
    async function loadTalhoes() {
      const userId = AuthService.getInstance().getCurrentUser()?.user_id;
      if (!userId) return setTalhoes([]);
      try {
        const all = await TalhaoService.getTalhoesByUserId(userId);
        const normalized = (all || []).filter((x: any) => {
          if (typeof x.talhao_default === 'boolean') return x.talhao_default === false;
          if (typeof x.talhao_default === 'string') return x.talhao_default.toLowerCase() === 'false' || x.talhao_default === 'f' || x.talhao_default === '0';
          if (typeof x.talhao_default === 'number') return x.talhao_default === 0;
          return true;
        });
        setTalhoes(normalized || []);
      } catch (err) {
        console.error('Erro ao carregar talhões:', err);
        setTalhoes([]);
      }
    }
    if (isOpen) loadTalhoes();
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const currentUser = AuthService.getInstance().getCurrentUser();
      if (!currentUser?.user_id) {
        console.error('Usuário não autenticado');
        alert('Erro: Usuário não autenticado');
        setSaving(false);
        return;
      }

      // Capturar dados ANTERIORES para o histórico
      const tx = transacao as any;
      
      // Derivar condição de pagamento anterior usando a mesma lógica do useEffect (coluna real é tipo_pagamento)
      const condicaoAnterior = tx.tipo_pagamento || tx.condicao_pagamento || tx.condicao || 
        ((tx.parcela || tx.numero_parcelas) ? 
          (((tx.parcela && String(tx.parcela).toLowerCase().includes('parcel')) || Number(tx.numero_parcelas) > 1) ? 'Parcelado' : 'À Vista') 
          : '');
      
      // Normalizar tipo_transacao para capitalizado (consistência com o front)
      const tipoAnterior = tx.tipo_transacao 
        ? (String(tx.tipo_transacao).toLowerCase() === 'gasto' ? 'Gasto' : 
           String(tx.tipo_transacao).toLowerCase() === 'receita' ? 'Receita' : tx.tipo_transacao)
        : '';
      
      const dadosAnteriores = {
        tipo_transacao: tipoAnterior,
        descricao: tx.descricao || '',
        valor: tx.valor,
        categoria: tx.categoria || '',
        pagador_recebedor: tx.pagador_recebedor || '',
        forma_pagamento: tx.forma_pagamento || tx.forma_pagamento_recebimento || '',
        status: tx.status || '',
        tipo_pagamento: condicaoAnterior,
        numero_parcelas: tx.numero_parcelas || '',
        data_agendamento_pagamento: extrairDataParaInput(tx.data_agendamento_pagamento),
        talhao_id: tx.talhao_id || '',
        nome_talhao: tx.nome_talhao || '',
      };

      // Normalizar valor com sinal baseado no tipo
      let valorFinal = local.valor;
      if (local.tipo_transacao === 'Gasto') {
        valorFinal = -Math.abs(valorFinal);
      } else {
        valorFinal = Math.abs(valorFinal);
      }

      // Encontrar o nome do talhão selecionado
      const talhaoSelecionado = talhoes.find(t => t.id_talhao === local.talhao_id);
      const nomeTalhaoNovo = talhaoSelecionado?.nome || '';

      // Dados para o histórico (usar strings para comparação consistente)
      const dadosNovosParaHistorico = {
        tipo_transacao: local.tipo_transacao,
        descricao: local.descricao,
        valor: valorFinal,
        categoria: local.categoria,
        pagador_recebedor: local.pagador_recebedor,
        forma_pagamento: local.forma_pagamento,
        status: local.status,
        tipo_pagamento: local.condicao_pagamento,
        numero_parcelas: local.numero_parcelas || '',
        data_agendamento_pagamento: local.data_agendamento_pagamento || '',
        talhao_id: local.talhao_id || '',
        nome_talhao: nomeTalhaoNovo,
      };

      // Dados para atualizar no banco
      const toDate = (v: string): Date | undefined => {
        if (!v) return undefined;
        const d = new Date(v + 'T00:00:00');
        return Number.isNaN(d.getTime()) ? undefined : d;
      };

      const dadosNovos: Partial<TransacaoFinanceira> & { talhao_id?: string } = {
        tipo_transacao: local.tipo_transacao ? String(local.tipo_transacao).toUpperCase() : undefined,
        descricao: local.descricao || undefined,
        valor: valorFinal,
        categoria: local.categoria || undefined,
        pagador_recebedor: local.pagador_recebedor || undefined,
        forma_pagamento_recebimento: local.forma_pagamento || undefined,
        status: local.status || undefined,
        // tipo_pagamento é coluna GENERATED, não pode ser atualizada diretamente
        // É calculada automaticamente: numero_parcelas > 1 ? 'Parcelado' : 'À Vista'
        parcela: local.condicao_pagamento === 'Parcelado' ? (local.condicao_pagamento || undefined) : undefined,
        numero_parcelas: local.condicao_pagamento === 'Parcelado' ? (local.numero_parcelas ?? undefined) : 1,
        data_agendamento_pagamento: toDate(local.condicao_pagamento === 'Parcelado' ? local.data_primeira_parcela : local.data_agendamento_pagamento),
      };

      // Verificar se está mudando para Parcelado (conversão de transação simples para parcelada)
      const eraParcelado = Boolean(
        (tx.tipo_pagamento && tx.tipo_pagamento === 'Parcelado') ||
        (tx.condicao_pagamento && tx.condicao_pagamento === 'Parcelado') ||
        (tx.parcela && String(tx.parcela).toLowerCase().includes('parcel')) ||
        (tx.numero_parcelas && Number(tx.numero_parcelas) > 1) ||
        tx.eh_transacao_pai === true
      );
      const virarParcelado = local.condicao_pagamento === 'Parcelado' && !eraParcelado;

      console.log('🔍 DEBUG Parcelamento:', {
        eraParcelado,
        virarParcelado,
        'local.condicao_pagamento': local.condicao_pagamento,
        'local.numero_parcelas': local.numero_parcelas,
        'tx.tipo_pagamento': tx.tipo_pagamento,
        'tx.parcela': tx.parcela,
        'tx.numero_parcelas': tx.numero_parcelas,
        'tx.eh_transacao_pai': tx.eh_transacao_pai,
      });

      // Se está convertendo para parcelado, definir campos necessários
      if (local.condicao_pagamento === 'Parcelado') {
        (dadosNovos as any).data_primeira_parcela = toDate(local.data_primeira_parcela);
        (dadosNovos as any).eh_transacao_pai = true;
      }

      // Atualizar transação no banco
      const updateSuccess = await FinanceService.updateTransaction(
        transacao.id_transacao,
        dadosNovos,
        local.talhao_id || undefined
      );

      if (!updateSuccess) {
        alert('Erro ao atualizar transação. Tente novamente.');
        setSaving(false);
        return;
      }

      // Se está convertendo para parcelado, criar as parcelas filhas
      console.log('🔍 DEBUG antes de criar parcelas:', {
        virarParcelado,
        'local.numero_parcelas': local.numero_parcelas,
        'numero_parcelas > 1': local.numero_parcelas && local.numero_parcelas > 1,
        transacaoId: transacao.id_transacao,
      });
      
      if (virarParcelado && local.numero_parcelas && local.numero_parcelas > 1) {
        console.log('🔄 Convertendo transação para parcelada, criando parcelas filhas...');
        try {
          const parcelas = await FinanceService.createParcelasFromParent(transacao.id_transacao);
          console.log('📦 Resultado createParcelasFromParent:', parcelas);
          if (parcelas && parcelas.length > 0) {
            console.log(`✅ ${parcelas.length} parcelas criadas com sucesso`);
          } else {
            console.warn('⚠️ Não foi possível criar parcelas filhas automaticamente - resultado vazio ou null');
          }
        } catch (rpcError) {
          console.error('❌ Erro ao chamar createParcelasFromParent:', rpcError);
        }
      } else {
        console.log('⏭️ Não criando parcelas:', {
          motivo: !virarParcelado ? 'virarParcelado é false' : 
                  !local.numero_parcelas ? 'numero_parcelas não definido' : 
                  'numero_parcelas <= 1'
        });
      }

      // Registrar no histórico de edições
      await HistoricoTransacoesService.registrarEdicao(
        transacao.id_transacao,
        currentUser.user_id,
        currentUser.nome || 'Usuário',
        dadosAnteriores,
        dadosNovosParaHistorico
      );

      console.log('✅ Transação atualizada e histórico registrado com sucesso');
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Erro ao salvar transação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#004417]">
              Editar Transação
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={saving}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">Tipo</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.tipo_transacao}
                  onChange={(e) => {
                    const tipo = e.target.value;
                    let valor = local.valor;
                    if (tipo === 'Gasto') valor = Math.abs(valor);
                    if (tipo === 'Receita') valor = Math.abs(valor);
                    setLocal({ ...local, tipo_transacao: tipo, valor });
                    setValorDisplay(formatCurrency(valor));
                  }}
                >
                  <option value="">Selecione</option>
                  <option value="Gasto">Gasto</option>
                  <option value="Receita">Receita</option>
                </select>
              </label>

              {/* Descrição */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">Descrição</span>
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.descricao}
                  maxLength={40}
                  onChange={(e) => setLocal({ ...local, descricao: e.target.value.slice(0, 40) })}
                />
                {local.descricao.length >= 40 && (
                  <p className="mt-1 text-xs text-[#F7941F]">Limite de 40 caracteres atingido</p>
                )}
              </label>

              {/* Valor */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">Valor (R$)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={valorDisplay}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = formatCurrencyInput(raw);
                    const numeric = Math.abs(parsed.numeric);
                    setLocal({ ...local, valor: numeric });
                    setValorDisplay(formatCurrency(numeric));
                  }}
                />
              </label>

              {/* Categoria */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">Categoria</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.categoria}
                  onChange={(e) => setLocal({ ...local, categoria: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="Máquinas e Equipamentos">Máquinas e Equipamentos</option>
                  <option value="Irrigação">Irrigação</option>
                  <option value="Aluguel de Máquinas">Aluguel de Máquinas</option>
                  <option value="Mão de obra">Mão de obra</option>
                  <option value="Insumos">Insumos</option>
                  <option value="Venda">Venda</option>
                  <option value="Embalagens">Embalagens</option>
                  <option value="Análise de Solo">Análise de Solo</option>
                  <option value="Despesas Gerais">Despesas Gerais</option>
                  <option value="Serviços Diversos">Serviços Diversos</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Despesas Administrativas">Despesas Administrativas</option>
                  <option value="Despesas de armazenagem">Despesas de armazenagem</option>
                  <option value="Beneficiamento">Beneficiamento</option>
                  <option value="Seguro">Seguro</option>
                  <option value="Assistência Técnica">Assistência Técnica</option>
                  <option value="Classificação">Classificação</option>
                  <option value="Outros">Outros</option>
                  <option value="Manutenção e Instalações">Manutenção e Instalações</option>
                  <option value="Encargos Sociais">Encargos Sociais</option>
                  <option value="Arrendamento">Arrendamento</option>
                </select>
              </label>

              {/* Talhão */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">Talhão</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.talhao_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = talhoes.find(t => t.id_talhao === selectedId);
                    if (found) {
                      setLocal({ ...local, talhao_id: selectedId, nome_talhao: found.nome || '' });
                    } else {
                      setLocal({ ...local, talhao_id: '', nome_talhao: '' });
                    }
                  }}
                >
                  <option value="">Sem talhão vinculado</option>
                  {talhoes.map((t) => (
                    <option key={t.id_talhao} value={t.id_talhao}>{t.nome || t.id_talhao}</option>
                  ))}
                </select>
              </label>

              {/* Pagador/Recebedor */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">
                  {local.tipo_transacao === 'Gasto' ? 'Recebedor' : local.tipo_transacao === 'Receita' ? 'Pagador' : 'Pagador / Recebedor'}
                </span>
                <input
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.pagador_recebedor}
                  onChange={(e) => setLocal({ ...local, pagador_recebedor: e.target.value })}
                  placeholder={local.tipo_transacao === 'Gasto' ? 'Ex.: Fornecedor XYZ' : local.tipo_transacao === 'Receita' ? 'Ex.: Cliente ABC' : 'Ex.: Fornecedor ou Cliente'}
                />
              </label>

              {/* Forma de Pagamento/Recebimento */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">
                  {local.tipo_transacao === 'Gasto' ? 'Forma de pagamento' : local.tipo_transacao === 'Receita' ? 'Forma de recebimento' : 'Forma de pagamento / recebimento'}
                </span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.forma_pagamento}
                  onChange={(e) => setLocal({ ...local, forma_pagamento: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão Crédito">Cartão Crédito</option>
                  <option value="Cartão Débito">Cartão Débito</option>
                  <option value="Transf. Bancária">Transf. Bancária</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </label>

              {/* Condição */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">Condição</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.condicao_pagamento}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Parcelado') {
                      setLocal({ 
                        ...local, 
                        condicao_pagamento: val, 
                        numero_parcelas: local.numero_parcelas || 2, 
                        status: 'Agendado',
                        data_agendamento_pagamento: local.data_primeira_parcela || local.data_agendamento_pagamento
                      });
                    } else {
                      setLocal({ ...local, condicao_pagamento: val, numero_parcelas: undefined });
                    }
                  }}
                >
                  <option value="">Selecione</option>
                  <option value="À Vista">À Vista</option>
                  <option value="Parcelado">Parcelado</option>
                </select>
              </label>

              {/* Número de parcelas (se Parcelado) */}
              {local.condicao_pagamento === 'Parcelado' && (
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-[#092f20] mb-1">Número de parcelas</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                    value={String(local.numero_parcelas ?? '')}
                    onChange={(e) => setLocal({ ...local, numero_parcelas: Number(e.target.value) })}
                  >
                    <option value="">Selecione</option>
                    {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </label>
              )}

              {/* Data da primeira parcela (se Parcelado) */}
              {local.condicao_pagamento === 'Parcelado' && (
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-[#092f20] mb-1">Data da primeira parcela</span>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                    value={local.data_primeira_parcela}
                    onChange={(e) => setLocal({ 
                      ...local, 
                      data_primeira_parcela: e.target.value, 
                      data_agendamento_pagamento: e.target.value 
                    })}
                  />
                </label>
              )}

              {/* Status */}
              <label className="flex flex-col">
                <span className="text-sm font-medium text-[#092f20] mb-1">Status</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                  value={local.status}
                  onChange={(e) => setLocal({ ...local, status: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="Pago">Pago</option>
                  <option value="Agendado">Agendado</option>
                </select>
              </label>

              {/* Data de pagamento/agendamento (se não Parcelado) */}
              {(local.status === 'Agendado' || local.status === 'Pago') && local.condicao_pagamento !== 'Parcelado' && (
                <label className="flex flex-col">
                  <span className="text-sm font-medium text-[#092f20] mb-1">
                    {local.status === 'Agendado' 
                      ? (local.tipo_transacao === 'Receita' ? 'Data de recebimento prevista' : 'Data de pagamento prevista')
                      : (local.tipo_transacao === 'Receita' ? 'Data de recebimento' : 'Data de pagamento')
                    }
                  </span>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none"
                    value={local.data_agendamento_pagamento}
                    onChange={(e) => setLocal({ ...local, data_agendamento_pagamento: e.target.value })}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-white bg-[#00A651] rounded-lg hover:bg-[#00A651]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
