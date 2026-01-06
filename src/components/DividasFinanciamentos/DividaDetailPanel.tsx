import { DividaFinanciamento } from '../../services/dividasFinanciamentosService';
import { X, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { formatDateBR } from '../../lib/dateUtils';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface DividaDetailPanelProps {
  divida: DividaFinanciamento | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onLiquidar: (id: string) => void;
  onDelete: (id: string) => void;
}

const getSituacaoBadgeColor = (situacao: string) => {
  switch (situacao) {
    case 'Ativa':
      return 'bg-[rgba(0,68,23,0.08)] text-[#004417] font-semibold';
    case 'Liquidada':
      return 'bg-[#00A651] bg-opacity-20 text-[#004417] font-semibold';
    case 'Renegociada':
      return 'bg-[rgba(0,68,23,0.08)] text-[#004417] font-semibold';
    default:
      return 'bg-[rgba(0,68,23,0.08)] text-[#004417] font-semibold';
  }
};

const DetailField = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (!value) return null;
  return (
    <div className="mb-4">
      <p className="text-[13px] text-[rgba(0,68,23,0.75)] font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[13px] font-semibold text-[#004417]">{value}</p>
    </div>
  );
};

export default function DividaDetailPanel({
  divida,
  isOpen,
  onClose,
  onEdit,
  onLiquidar,
  onDelete,
}: DividaDetailPanelProps) {
  const [signedAnexos, setSignedAnexos] = useState<string[]>([]);
  useEffect(() => {
    let mounted = true;
    const bucket = 'dividas_financiamentos';
    const loadSigned = async () => {
      if (!divida?.anexos || divida.anexos.length === 0) {
        if (mounted) setSignedAnexos([]);
        return;
      }

      const results: string[] = [];
      for (const anexo of divida.anexos) {
        try {
          const path = anexo.startsWith('http')
            ? (anexo.match(/dividas_financiamentos\/(.*)$/) || [])[1]
            : anexo;
          if (!path) continue;
          const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
          if (error) {
            console.error('Erro criando signedUrl:', error);
            continue;
          }
          if (data?.signedUrl) results.push(data.signedUrl);
        } catch (err) {
          console.error('Erro ao gerar signed url anexo:', err);
        }
      }
      if (mounted) setSignedAnexos(results);
    };

    loadSigned();
    return () => {
      mounted = false;
    };
  }, [divida]);
  if (!isOpen || !divida) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-96">
        {/* Header */}
        <div className="border-b border-[rgba(0,68,23,0.08)] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#004417] mb-4">{divida.nome}</h2>
            <p className="text-[13px] text-[rgba(0,68,23,0.75)] font-medium mt-1">{divida.credor}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(0,68,23,0.08)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#004417]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getSituacaoBadgeColor(divida.situacao)}`}>
              {divida.situacao}
            </span>
          </div>

          {/* Informações Básicas */}
          <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Informações Básicas</h3>
            <DetailField label="Tipo" value={divida.tipo} />
            <DetailField label="Credor" value={divida.credor} />
            <DetailField label="Data da Contratação" value={formatDateBR(divida.data_contratacao)} />
            <DetailField label="Responsável" value={divida.responsavel} />
          </div>

          {/* Valores e Taxas */}
          <div>
            <h3 className="text-[16px] font-bold text-[#004417] mb-3">Valores e Taxas</h3>
            {divida.valor_contratado && divida.valor_contratado > 0 && (
              <DetailField
                label="Valor Contratado"
                value={`R$ ${divida.valor_contratado.toLocaleString('pt-BR')}`}
              />
            )}
            <DetailField label="Taxa" value={divida.taxa} />
            <DetailField label="Carência" value={divida.carencia} />
          </div>

          {/* Garantias e Pagamento */}
          <div>
            <h3 className="text-[16px] font-bold text-[#004417] mb-3">Garantias e Pagamento</h3>
            <DetailField label="Garantia" value={divida.garantia} />
            <DetailField label="Forma de Pagamento" value={divida.forma_pagamento} />
          </div>

          {/* Observações */}
          {divida.observacoes && (
            <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Observações</h3>
              <p className="text-[13px] font-medium text-[#004417] bg-[rgba(0,68,23,0.02)] p-3 rounded-lg border border-[rgba(0,68,23,0.08)]">
                {divida.observacoes}
              </p>
            </div>
          )}

          {/* Cronograma de Pagamento */}
          {(((divida.pagamento_parcelado?.numParcelas ?? 0) > 0 && (divida.pagamento_parcelado?.valorParcela ?? 0) > 0) ||
            ((divida.pagamento_parcela?.valor ?? 0) > 0) ||
            ((divida.pagamento_producao?.quantidadeSacas ?? 0) > 0)) && (
            <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Cronograma de Pagamento</h3>
              {((divida.pagamento_parcelado?.numParcelas ?? 0) > 0) && ((divida.pagamento_parcelado?.valorParcela ?? 0) > 0) && (
                <div className="bg-[rgba(0,68,23,0.02)] p-3 rounded-lg space-y-2 mb-3 border border-[rgba(0,68,23,0.08)]">
                  <p className="text-[13px] font-semibold text-[#004417]">
                    <strong>Parcelado:</strong> {divida.pagamento_parcelado.numParcelas} parcelas de R${' '}
                    {divida.pagamento_parcelado.valorParcela.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {divida.pagamento_parcelado.primeiradata && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Primeira parcela: {formatDateBR(divida.pagamento_parcelado.primeiradata)}
                    </p>
                  )}
                </div>
              )}
              {((divida.pagamento_parcela?.valor ?? 0) > 0) && (
                <div className="bg-[rgba(0,68,23,0.02)] p-3 rounded-lg space-y-2 mb-3 border border-[rgba(0,68,23,0.08)]">
                  <p className="text-[13px] font-semibold text-[#004417]">
                    <strong>Parcela Única:</strong> R${' '}
                    {divida.pagamento_parcela.valor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {divida.pagamento_parcela.data && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Data: {formatDateBR(divida.pagamento_parcela.data)}
                    </p>
                  )}
                </div>
              )}
              {((divida.pagamento_producao?.quantidadeSacas ?? 0) > 0) && (
                <div className="bg-[rgba(0,68,23,0.02)] p-3 rounded-lg space-y-2 border border-[rgba(0,68,23,0.08)]">
                  <p className="text-[13px] font-semibold text-[#004417]">
                    <strong>Com Produção:</strong> {divida.pagamento_producao.quantidadeSacas} sacas de{' '}
                    {divida.pagamento_producao.produto}
                  </p>
                  {((divida.pagamento_producao?.precoPorSaca ?? 0) > 0) && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Preço: R$ {divida.pagamento_producao.precoPorSaca.toLocaleString('pt-BR')} / saca
                    </p>
                  )}
                  {divida.pagamento_producao.dataPeriodo && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Período: {formatDateBR(divida.pagamento_producao.dataPeriodo)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Anexos */}
          {((signedAnexos && signedAnexos.length > 0) || (divida.anexos && divida.anexos.length > 0)) && (
            <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Anexos</h3>
              <div className="grid grid-cols-3 gap-3">
                {(signedAnexos.length > 0 ? signedAnexos : divida.anexos).map((anexo, idx) => {
                  const name = anexo.split('/').pop()?.split('?')[0] || `anexo-${idx}`;
                  const ext = (name.split('.').pop() || '').toLowerCase();
                  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
                  return (
                    <a
                      key={idx}
                      href={anexo}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      {isImage ? (
                        <div className="w-20 h-14 overflow-hidden rounded border border-[rgba(0,68,23,0.08)]">
                          <img src={anexo} alt={name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-14 flex items-center justify-center bg-[rgba(0,68,23,0.02)] rounded border border-[rgba(0,68,23,0.08)] text-xs text-[#004417] px-2 text-center font-medium">
                          {name.length > 18 ? name.slice(0, 15) + '...' : name}
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="border-t border-[rgba(0,68,23,0.08)] p-4 space-y-2">
          <button
            onClick={() => {
              onEdit(divida.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#00A651] hover:bg-[#008c44] text-white rounded-lg font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => {
              onLiquidar(divida.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#F7941F] bg-orange-50 hover:bg-orange-100 text-[#F7941F] rounded-lg font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Liquidar
          </button>
          <button
            onClick={() => {
              onDelete(divida.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[rgba(0,68,23,0.08)] bg-[rgba(0,68,23,0.02)] hover:bg-[rgba(0,68,23,0.08)] text-[#004417] rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>
    </>
  );
}
