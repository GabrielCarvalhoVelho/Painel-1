import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, Paperclip } from 'lucide-react';
import { TransacaoFinanceira } from '../../lib/supabase';
import { AttachmentService } from '../../services/attachmentService';
import { AuthService } from '../../services/authService';
import { TalhaoService } from '../../services/talhaoService';
import { formatCurrencyInput, initializeCurrencyInput, formatCurrency } from '../../lib/currencyFormatter';

interface Props {
  isOpen: boolean;
  transaction?: TransacaoFinanceira | null;
  onClose: () => void;
  // allow talhao_id to be passed alongside Partial<TransacaoFinanceira>
  onSave: (id: string, payload: Partial<TransacaoFinanceira> & { talhao_id?: string | undefined }) => Promise<void>;
}

type LocalTransaction = Omit<Partial<TransacaoFinanceira>, 'data_transacao' | 'data_agendamento_pagamento' | 'data_registro' | 'data_primeira_parcela'> & {
  forma_pagamento?: string;
  condicao_pagamento?: string;
  condicao?: string;
  data_primeira_parcela?: string | null;
  numero_parcelas?: number;
  imagem?: File | null;
  arquivo?: File | null;
  tipo_transacao?: string;
  valor?: any;
  data_agendamento_pagamento?: string | null;
  data_transacao?: string | null;
  data_registro?: string | null;
  talhao_id?: string | null;
};

export default function TransactionEditModal({ isOpen, transaction, onClose, onSave }: Props) {
  const [local, setLocal] = useState<LocalTransaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [valorDisplay, setValorDisplay] = useState<string>('R$ 0,00');
  const [talhoes, setTalhoes] = useState<Array<any>>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [existingFile, setExistingFile] = useState<boolean>(false);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<boolean>(false);

  useEffect(() => {
    if (transaction) {
        const tx = transaction as Partial<TransacaoFinanceira>;
        const coerceDate = (d?: Date | string | null) => (d ? (typeof d === 'string' ? d : d.toISOString()) : null);
        // Derivar condição de pagamento primeiro
        const derivedCond = (tx as any).condicao_pagamento || (tx as any).condicao || ((tx as any).parcela || (tx as any).numero_parcelas ? (((tx as any).parcela && String((tx as any).parcela).toLowerCase().includes('parcel')) || Number((tx as any).numero_parcelas) > 1 ? 'Parcelado' : 'À vista') : '');
        // Se for parcelado, preferir data_primeira_parcela para agendamento e forçar status Agendado
        const derivedDataPrimeira = (tx as any).data_primeira_parcela || coerceDate(tx.data_agendamento_pagamento) || null;
        const derivedStatus = derivedCond === 'Parcelado' ? 'Agendado' : ((tx as any).status || (tx as any).situacao || 'Pago');

        setLocal({
          tipo_transacao: tx.tipo_transacao ? (String(tx.tipo_transacao).toLowerCase() === 'gasto' ? 'Gasto' : String(tx.tipo_transacao).toLowerCase() === 'receita' ? 'Receita' : String(tx.tipo_transacao)) : '',
          descricao: tx.descricao || '',
          valor: tx.valor as any,
          categoria: tx.categoria || '',
          pagador_recebedor: tx.pagador_recebedor || '',
          data_agendamento_pagamento: derivedCond === 'Parcelado' ? derivedDataPrimeira : (coerceDate(tx.data_agendamento_pagamento) || coerceDate(tx.data_transacao) || coerceDate(tx.data_registro) || null),
          data_transacao: coerceDate(tx.data_transacao) || null,
          data_registro: coerceDate(tx.data_registro) || null,
          forma_pagamento: (tx as any).forma_pagamento || tx.forma_pagamento_recebimento || '',
          status: derivedStatus,
          // Preencher condição: usar campo existente ou derivar de `parcela` / `numero_parcelas`
          condicao_pagamento: derivedCond,
          numero_parcelas: (tx as any).numero_parcelas || undefined,
          data_primeira_parcela: derivedDataPrimeira,
          // Preencher talhao_id se a transação já tiver vínculo (talhao_ids ou transacoes_talhoes)
          talhao_id: (tx as any).talhao_ids && (tx as any).talhao_ids.length > 0 ? (tx as any).talhao_ids[0] : ((tx as any).transacoes_talhoes && (tx as any).transacoes_talhoes.length > 0 ? (tx as any).transacoes_talhoes[0].id_talhao : null),
          nome_talhao: tx.nome_talhao || ''
        });
      const init = initializeCurrencyInput((transaction as Partial<TransacaoFinanceira>).valor as any);
      // apply tipo sign to display if needed
      const tipo = (transaction as Partial<TransacaoFinanceira>).tipo_transacao;
      const numericInit = init.numeric || 0;
      const signedInit = tipo === 'Gasto' ? -Math.abs(numericInit) : numericInit;
      setValorDisplay(formatCurrency(signedInit));
    } else {
      setLocal(null);
    }
  }, [transaction]);

  useEffect(() => {
    // carregar preview da imagem já vinculada, se houver
    async function loadExistingImage() {
      if (!transaction?.id_transacao) {
        setExistingImageUrl(null);
        return;
      }
      try {
        const url = await AttachmentService.getAttachmentUrl(transaction.id_transacao);
        setExistingImageUrl(url || null);
      } catch (err) {
        console.warn('Não foi possível obter preview do anexo (imagem):', err);
        setExistingImageUrl(null);
      }
    }
    if (isOpen) loadExistingImage();
    return () => {
      // limpar qualquer preview local object URL
      if (previewImageUrl) {
        try { URL.revokeObjectURL(previewImageUrl); } catch {}
      }
    };
  }, [isOpen, transaction?.id_transacao]);

  useEffect(() => {
    // carregar informação de arquivo vinculado separadamente
    async function loadExistingFile() {
      if (!transaction?.id_transacao) {
        setExistingFile(false);
        setExistingFileUrl(null);
        return;
      }
      try {
        const hasFile = await AttachmentService.hasFileAttachment(transaction.id_transacao);
        setExistingFile(Boolean(hasFile));
        if (hasFile) {
          // tentar obter URL para download/preview do arquivo (não obrigatório)
          try {
            const fileUrl = await AttachmentService.getFileAttachmentUrl(transaction.id_transacao);
            setExistingFileUrl(fileUrl || null);
          } catch (err) {
            setExistingFileUrl(null);
          }
        } else {
          setExistingFileUrl(null);
        }
      } catch (err) {
        console.warn('Não foi possível checar arquivo vinculado:', err);
        setExistingFile(false);
        setExistingFileUrl(null);
      }
    }
    if (isOpen) loadExistingFile();
  }, [isOpen, transaction?.id_transacao]);

  useEffect(() => {
    async function loadTalhoes() {
      const userId = AuthService.getInstance().getCurrentUser()?.user_id;
      if (!userId) return setTalhoes([]);
      try {
        const all = await TalhaoService.getTalhoesByUserId(userId);
        // Simpler: prefer explicit boolean check, but tolerate string/number forms
        const normalized = (all || []).filter((x: any) => {
          if (typeof x.talhao_default === 'boolean') return x.talhao_default === false;
          if (typeof x.talhao_default === 'string') return x.talhao_default.toLowerCase() === 'false' || x.talhao_default === 'f' || x.talhao_default === '0';
          if (typeof x.talhao_default === 'number') return x.talhao_default === 0;
          // If property missing, include (defensive)
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

  if (!isOpen || !local || !transaction) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Construir payload limpo para enviar ao banco (remover arquivos/objetos locais)
      const raw: any = { ...local };
      const toDate = (v: any): Date | undefined => {
        if (!v && v !== 0) return undefined;
        const s = typeof v === 'string' ? v : String(v);
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? undefined : d;
      };

      // Determinar qual data usar para `data_transacao` no banco:
      // - se o status for 'Pago' e houver data de agendamento/pagamento, priorizar essa data;
      // - caso contrário, usar `data_transacao` informado localmente (se houver).
      const dataTransacaoForSave = raw.status === 'Pago' && raw.data_agendamento_pagamento ? raw.data_agendamento_pagamento : (raw.data_transacao || undefined);

      // Normalize numeric value and enforce sign based on transaction type
      const toNumber = (v: any): number | undefined => {
        if (v === undefined || v === null || v === '') return undefined;
        if (typeof v === 'number') return Number(v);
        // accept strings like "1.234,56" or "1234.56"
        const s = String(v).replace(/\./g, '').replace(',', '.');
        const n = Number(s);
        return Number.isNaN(n) ? undefined : n;
      };

      let valorNumber = toNumber(raw.valor);
      if (valorNumber !== undefined) {
        const tipo = String(raw.tipo_transacao || raw.tipo_transacao || '').toLowerCase();
        if (tipo === 'gasto') {
          valorNumber = -Math.abs(valorNumber);
        } else {
          valorNumber = Math.abs(valorNumber);
        }
      }

      const payloadTransacao: Partial<TransacaoFinanceira> = {
        descricao: raw.descricao || undefined,
        valor: valorNumber,
        categoria: raw.categoria || undefined,
        pagador_recebedor: raw.pagador_recebedor || undefined,
        forma_pagamento_recebimento: raw.forma_pagamento || raw.forma_pagamento_recebimento || undefined,
        status: raw.status || undefined,
        // mapear condição -> parcela (campo existente no schema)
        // se for 'Parcelado' envia o texto específico de parcela (campo `parcela`),
        // caso contrário envia null para limpar a coluna
        parcela: raw.condicao_pagamento === 'Parcelado' ? (raw.parcela || raw.condicao || undefined) : null,
        // Garantir que transações à vista tenham 1 parcela (evita enviar 0)
        numero_parcelas: raw.condicao_pagamento === 'Parcelado' ? (raw.numero_parcelas ?? undefined) : 1,
        data_agendamento_pagamento: toDate(raw.data_agendamento_pagamento),
        data_transacao: toDate(dataTransacaoForSave),
        tipo_transacao: raw.tipo_transacao ? String(raw.tipo_transacao).toUpperCase() : undefined,
        nome_talhao: raw.nome_talhao || undefined,
      };

      // campo extra que existe no banco mas não no tipo TS
      (payloadTransacao as any).data_primeira_parcela = toDate(raw.data_primeira_parcela);

      // Marcar transação como pai quando a condição for parcelado
      (payloadTransacao as any).eh_transacao_pai = raw.condicao_pagamento === 'Parcelado' ? true : undefined;

      const talhaoId = raw.talhao_id || undefined;

      // enviar payload que inclui talhao_id (nota: talhao_id não é parte de TransacaoFinanceira,
      // mas aceitamos esse campo extra no handler `onSave`)
      const payloadWithTalhao = Object.assign({}, payloadTransacao, { talhao_id: talhaoId });

      await onSave(transaction?.id_transacao || '', payloadWithTalhao as Partial<TransacaoFinanceira> & { talhao_id?: string | undefined });

      // Se houver anexos locais, fazer upload para storage sob transacoes_financeiras/{user_id}/{transacao_id}
      try {
        if (raw.imagem) {
          await AttachmentService.uploadAttachment(transaction?.id_transacao || '', raw.imagem as File);
        }
      } catch (err) {
        console.error('Erro ao enviar imagem da transação:', err);
      }

      try {
        if (raw.arquivo) {
          await AttachmentService.uploadFileAttachment(transaction?.id_transacao || '', raw.arquivo as File);
        }
      } catch (err) {
        console.error('Erro ao enviar arquivo da transação:', err);
      }

      onClose();
    } catch (e) {
      console.error('Erro ao salvar transação:', e);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-[90vw] sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-[#004417]">Editar lançamento</h3>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-[#F7941F]" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Tipo</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local!.tipo_transacao ?? '')}
              onChange={(e) => {
                const tipo = e.target.value;
                let valor: any = local!.valor;
                if (valor !== undefined && valor !== null && valor !== '') {
                  const mag = Number(valor);
                  if (!Number.isNaN(mag)) {
                    if (tipo === 'Gasto') valor = -Math.abs(mag);
                    else if (tipo === 'Receita') valor = Math.abs(mag);
                  }
                }
                setLocal({ ...local, tipo_transacao: tipo, valor });
                try {
                  setValorDisplay(formatCurrency(Number(valor) || 0));
                } catch {
                  // fallback: keep existing display
                }
              }}
            >
              <option value="">Selecione</option>
              <option value="Gasto">Gasto</option>
              <option value="Receita">Receita</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Descrição</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={(local!.descricao as string) || ''}
              maxLength={40}
              onChange={(e) => setLocal({ ...local, descricao: e.target.value.slice(0, 40) })}
            />
            {(String(local!.descricao || '').length >= 40) && (
              <p className="mt-1 text-sm text-[#F7941F]">Você atingiu o limite de 40 caracteres. Use uma descrição curta.</p>
            )}
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Valor (R$)</span>
            <input
              type="text"
              inputMode="numeric"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={valorDisplay}
              onChange={(e) => {
                const raw = e.target.value;
                const parsed = formatCurrencyInput(raw);
                let numeric = parsed.numeric;
                const tipo = local!.tipo_transacao;
                if (tipo === 'Gasto') numeric = -Math.abs(numeric);
                if (tipo === 'Receita') numeric = Math.abs(numeric);
                setLocal({ ...local, valor: numeric });
                setValorDisplay(formatCurrency(numeric));
              }}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Categoria</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local!.categoria ?? '')}
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

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Talhão</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local!.talhao_id ?? local!.nome_talhao ?? '')}
              onChange={(e) => {
                const selectedId = e.target.value;
                const found = talhoes.find(t => t.id_talhao === selectedId);
                if (found) {
                  setLocal({ ...local, talhao_id: selectedId, nome_talhao: found.nome || '' });
                } else {
                  setLocal({ ...local, talhao_id: null, nome_talhao: '' });
                }
              }}
            >
              <option value="">Sem talhão vinculado</option>
              {talhoes.map((t) => (
                <option key={t.id_talhao} value={t.id_talhao}>{t.nome || t.id_talhao}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">
              {local!.tipo_transacao === 'Gasto' ? 'Recebedor' : local!.tipo_transacao === 'Receita' ? 'Pagador' : 'Pagador / Recebedor'}
            </span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={(local!.pagador_recebedor as string) || ''}
              onChange={(e) => setLocal({ ...local, pagador_recebedor: e.target.value })}
              placeholder={local!.tipo_transacao === 'Gasto' ? 'Ex.: João da Silva (recebedor)' : local!.tipo_transacao === 'Receita' ? 'Ex.: Posto Shell (pagador)' : 'Ex.: Posto Shell, Exportadora XYZ'}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">
              {(local as any).tipo_transacao === 'Gasto' ? 'Forma de pagamento' : (local as any).tipo_transacao === 'Receita' ? 'Forma de recebimento' : 'Forma de pagamento / recebimento'}
            </span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local!.forma_pagamento ?? '')}
              onChange={(e) => setLocal({ ...local, forma_pagamento: e.target.value })}
            >
              <option value="">{(local as any).tipo_transacao === 'Gasto' ? 'Selecione' : (local as any).tipo_transacao === 'Receita' ? 'Selecione' : 'Selecione'}</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Boleto">Boleto</option>
              <option value="Cartão Crédito">Cartão Crédito</option>
              <option value="Cartão Débito">Cartão Débito</option>
              <option value="Transf. Bancária">Transf. Bancária</option>
              <option value="Cheque">Cheque</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Condição</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local!.condicao_pagamento ?? '')}
              onChange={(e) => {
                const val = e.target.value;
                // se mudar para Parcelado, preencher número de parcelas padrão e agendar automaticamente
                if (val === 'Parcelado') {
                  setLocal({ ...local, condicao_pagamento: val, numero_parcelas: local!.numero_parcelas || 2, status: 'Agendado', data_agendamento_pagamento: local!.data_primeira_parcela || local!.data_agendamento_pagamento || null });
                } else {
                  setLocal({ ...local, condicao_pagamento: val, numero_parcelas: undefined });
                }
              }}
            >
              <option value="">Selecione</option>
              <option value="À vista">À vista</option>
              <option value="Parcelado">Parcelado</option>
            </select>
          </label>

          {local!.condicao_pagamento === 'Parcelado' && (
            <label className="flex flex-col">
              <span className="text-sm font-medium text-[#092f20]">Número de parcelas</span>
              <select
                className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
                value={String(local!.numero_parcelas ?? '')}
                onChange={(e) => setLocal({ ...local, numero_parcelas: Number(e.target.value) })}
              >
                <option value="">Selecione</option>
                {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}x</option>
                ))}
              </select>
            </label>
          )}
          {local!.condicao_pagamento === 'Parcelado' && (
            <label className="flex flex-col">
              <span className="text-sm font-medium text-[#092f20]">Data da primeira parcela</span>
              <input
                type="date"
                className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
                value={local!.data_primeira_parcela ? String(local!.data_primeira_parcela).slice(0, 10) : ''}
                onChange={(e) => setLocal({ ...local, data_primeira_parcela: e.target.value, data_agendamento_pagamento: e.target.value })}
              />
            </label>
          )}
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Status</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local!.status ?? '')}
              onChange={(e) => setLocal({ ...local, status: e.target.value })}
            >
              <option value="">Selecione</option>
              <option value="Pago">Pago</option>
              <option value="Agendado">Agendado</option>
            </select>
          </label>

          {(local!.status === 'Agendado' || local!.status === 'Pago') && local!.condicao_pagamento !== 'Parcelado' && (
            <label className="flex flex-col">
              <span className="text-sm font-medium text-[#092f20]">{local!.status === 'Agendado' ? 'Data de agendamento' : 'Data de pagamento'}</span>
              <input
                type="date"
                className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
                value={local!.data_agendamento_pagamento ? String(local!.data_agendamento_pagamento).slice(0,10) : ''}
                onChange={(e) => setLocal({ ...local, data_agendamento_pagamento: e.target.value })}
              />
            </label>
          )}

          {/* Anexos: layout igual a FormProdutoModal.tsx — imagem e arquivo */}
          <div className="col-span-1 sm:col-span-2">
            <div>
              <label className="block text-sm font-medium text-[#004417] mb-1">Imagem (opcional)</label>
              <div className="border-2 border-dashed border-[rgba(0,68,23,0.12)] rounded-[12px] p-4 text-center hover:border-[rgba(0,166,81,0.18)] transition-colors">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    // liberar preview anterior
                    if (previewImageUrl) {
                      try { URL.revokeObjectURL(previewImageUrl); } catch {}
                    }
                    if (file) {
                      const obj = URL.createObjectURL(file);
                      setPreviewImageUrl(obj);
                    } else {
                      setPreviewImageUrl(null);
                    }
                    setLocal({ ...local, imagem: file });
                  }}
                  className="hidden"
                  id="file-upload-transaction-imagem"
                />
                <div className="flex flex-col items-center gap-2">
                  {(previewImageUrl || existingImageUrl) && (
                    <div className="w-full flex justify-center">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          aria-label="Remover imagem"
                          onClick={() => {
                            (async () => {
                              try {
                                if (previewImageUrl) {
                                  // apenas descartar preview local
                                  URL.revokeObjectURL(previewImageUrl);
                                  setPreviewImageUrl(null);
                                  setLocal({ ...local, imagem: null });
                                } else if (existingImageUrl && transaction?.id_transacao) {
                                  // remover do storage + atualizar banco via AttachmentService
                                  try {
                                    await AttachmentService.deleteAttachment(transaction.id_transacao);
                                  } catch (delErr) {
                                    console.error('Erro ao excluir anexo do storage:', delErr);
                                    // mesmo em erro, prosseguimos para remover preview local
                                  }
                                  setExistingImageUrl(null);
                                  // também limpar indicador de arquivo vinculado (caso fosse a mesma referência)
                                  setExistingFile(false);
                                }
                              } catch (err) {
                                console.warn('Erro ao descartar preview:', err);
                              }
                            })();
                          }}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-[#F7941F]" />
                        </button>
                        <img
                          src={previewImageUrl || existingImageUrl || undefined}
                          alt="Preview"
                          onError={() => {
                            try {
                              if (previewImageUrl) {
                                try { URL.revokeObjectURL(previewImageUrl); } catch {}
                                setPreviewImageUrl(null);
                                setLocal({ ...local, imagem: null });
                              } else {
                                setExistingImageUrl(null);
                              }
                            } catch (err) {
                              console.warn('Erro no onError do preview de imagem:', err);
                            }
                          }}
                          className="max-h-36 rounded-md object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <label htmlFor="file-upload-transaction-imagem" className="cursor-pointer">
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${ (local as any).imagem ? 'text-[#00A651]' : 'text-[rgba(0,68,23,0.35)]' }`} />
                    <p className={`text-sm ${ (local as any).imagem ? 'font-bold text-[#004417]' : 'text-[rgba(0,68,23,0.6)]' }`}>{(local as any).imagem ? (local as any).imagem.name : (existingImageUrl ? 'Imagem vinculada (clique para substituir)' : 'Clique para selecionar uma imagem')}</p>
                    <p className="text-xs text-[rgba(0,68,23,0.6)] mt-1">JPG, PNG, WEBP (máx. 10MB)</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[#004417] mb-1">Arquivo (opcional)</label>
              <div className="border-2 border-dashed border-[rgba(0,68,23,0.12)] rounded-[12px] p-4 text-center hover:border-[rgba(0,166,81,0.18)] transition-colors">
                <input
                  type="file"
                  accept=".xml,.csv,.pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setLocal({ ...local, arquivo: e.target.files?.[0] || null })}
                  className="hidden"
                  id="file-upload-transaction-arquivo"
                />
                <div className="flex flex-col items-center gap-2">
                  {existingFile && !(local as any).arquivo && (
                    <div className="flex items-center gap-2 bg-[#EEF9F0] border border-[#DFF3E3] text-[#004417] rounded-full px-3 py-1 text-xs">
                      <Paperclip className="w-4 h-4" />
                      <span>Arquivo vinculado</span>
                      <button
                        type="button"
                        aria-label="Remover arquivo"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!transaction?.id_transacao) return;
                          try {
                            setDeletingFile(true);
                            await AttachmentService.deleteFileAttachment(transaction.id_transacao);
                            setExistingFile(false);
                            // limpar seleção local caso exista
                            setLocal({ ...local, arquivo: null });
                          } catch (err) {
                            console.error('Erro ao excluir arquivo:', err);
                          } finally {
                            setDeletingFile(false);
                          }
                        }}
                        className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-white rounded-full shadow"
                      >
                        <X className="w-3 h-3 text-[#F7941F]" />
                      </button>
                    </div>
                  )}
                  <label htmlFor="file-upload-transaction-arquivo" className="cursor-pointer">
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${ (local as any).arquivo ? 'text-[#00A651]' : 'text-[rgba(0,68,23,0.35)]' }`} />
                  <p className={`text-sm ${ (local as any).arquivo ? 'font-bold text-[#004417]' : 'text-[rgba(0,68,23,0.6)]' }`}>
                    {(local as any).arquivo ? (local as any).arquivo.name : (existingFile ? 'Arquivo vinculado (clique para substituir)' : 'Clique para selecionar um arquivo')}
                  </p>
                  <p className="text-xs text-[rgba(0,68,23,0.6)] mt-1">XML, CSV, PDF, DOCX, XLSX, JPG, PNG, WEBP (máx. 10MB)</p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-white border">Cancelar</button>
          <button disabled={saving} onClick={handleSave} className="px-4 py-2 rounded bg-[#397738] text-white">{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
