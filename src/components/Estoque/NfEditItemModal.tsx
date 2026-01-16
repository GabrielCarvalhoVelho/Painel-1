import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { normalizeUnit, convertToStandardUnit, convertFromStandardUnit } from '../../lib/unitConverter';
import { useCurrencyInput } from '../../lib/currencyFormatter';
import { EstoqueService } from '../../services/estoqueService';

export interface PendingNfItem {
  id: string;
  nome_produto: string;
  marca?: string | null;
  categoria?: string | null;
  unidade: string;
  unidade_valor_original?: string | null;
  quantidade: number;
  valor_unitario?: number | null;
  lote?: string | null;
  validade?: string | null;
}

interface Props {
  isOpen: boolean;
  item?: PendingNfItem | null;
  onClose: () => void;
  onSave: (item: PendingNfItem) => void;
}

export default function NfEditItemModal({ isOpen, item, onClose, onSave }: Props) {
  const [local, setLocal] = useState<PendingNfItem | null>(null);
  const currency = useCurrencyInput(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) setLocal({ ...item });
  }, [item]);

  // Sincroniza o hook de currency quando o item carregar
  useEffect(() => {
    if (local) {
      currency.setValue(local.valor_unitario ?? 0);
    }
  }, [local]);

  if (!isOpen || !local) return null;
  const handleSave = async () => {
    if (!local) return;
    setSaving(true);
    try {
      const idNum = Number(local.id);
      await EstoqueService.editarProduto(
        idNum,
        local.nome_produto,
        local.marca ?? '',
        local.categoria ?? '',
        local.unidade,
        local.valor_unitario ?? 0,
        local.unidade_valor_original ?? null,
        local.lote ?? undefined,
        local.validade ?? undefined,
        undefined,
        undefined
      );

      await EstoqueService.atualizarQuantidade(
        idNum,
        Number(local.quantidade || 0),
        local.valor_unitario ?? null,
        local.unidade_valor_original ?? local.unidade
      );

      onSave(local);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      onSave(local);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/40">
      {/* Mobile bottom sheet */}
      <div className="w-[95vw] mx-auto sm:hidden max-h-[calc(100vh-4rem)] overflow-auto bg-white rounded-t-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#004417]">Editar item</h3>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Nome do produto</span>
            <input className="mt-1 border rounded px-3 py-2 focus:border-[#397738]" value={local.nome_produto} onChange={(e) => setLocal({ ...local, nome_produto: e.target.value })} />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Categoria</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.categoria ?? ''}
              onChange={(e) => setLocal({ ...local, categoria: e.target.value })}
            >
              <option value="">Selecione</option>
              <option>Máquinas e Equipamentos</option>
              <option>Irrigação</option>
              <option>Aluguel de Máquinas</option>
              <option>Mão de obra</option>
              <option>Gestão/Administração</option>
              <option>Sementes e mudas</option>
              <option>Fertilizantes</option>
              <option>Defensivos Agrícolas</option>
              <option>Venda</option>
              <option>Embalagens</option>
              <option>Análise de Solo</option>
              <option>Despesas Gerais</option>
              <option>Serviços Diversos</option>
              <option>Transporte</option>
              <option>Despesas Administrativas</option>
              <option>Despesas de armazenagem</option>
              <option>Beneficiamento</option>
              <option>Seguro</option>
              <option>Assistência Técnica</option>
              <option>Classificação</option>
              <option>Outros</option>
              <option>Manutenção e Instalações</option>
              <option>Encargos Sociais</option>
              <option>Arrendamento</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Unidade</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={normalizeUnit(local.unidade_valor_original ?? local.unidade) || ''}
              onChange={(e) => setLocal({ ...local, unidade_valor_original: e.target.value })}
            >
              <option value="mg">mg</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ton">t (tonelada)</option>
              <option value="mL">mL</option>
              <option value="L">L</option>
              <option value="un">unidade</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Quantidade</span>
            <input
              type="number"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={(() => {
                try {
                  const display = convertFromStandardUnit(Number(local.quantidade || 0), local.unidade, local.unidade_valor_original ?? local.unidade);
                  return Number.isFinite(display) ? String(display) : String(local.quantidade);
                } catch (e) {
                  return String(local.quantidade);
                }
              })()}
              onChange={(e) => {
                const entered = Number(e.target.value || 0);
                const unidadeOriginal = local.unidade_valor_original ?? local.unidade;
                const converted = convertToStandardUnit(entered, unidadeOriginal);
                setLocal({ ...local, quantidade: converted.quantidade, unidade: converted.unidade, unidade_valor_original: unidadeOriginal });
              }}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Valor unitário (R$)</span>
            <input
              type="text"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={currency.displayValue}
              onChange={(e) => {
                const res = currency.handleChange(e.target.value);
                setLocal({ ...local, valor_unitario: res.numeric });
              }}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Lote</span>
            <input className="mt-1 border rounded px-3 py-2 focus:border-[#397738]" value={local.lote ?? ''} onChange={(e) => setLocal({ ...local, lote: e.target.value })} />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Validade</span>
            <input type="date" className="mt-1 border rounded px-3 py-2 focus:border-[#397738]" value={local.validade ?? ''} onChange={(e) => setLocal({ ...local, validade: e.target.value })} />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button disabled={saving} onClick={handleSave} className="w-full px-4 py-3 rounded bg-[#397738] hover:bg-[#004417] text-white font-semibold">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose} className="w-full px-4 py-3 rounded bg-orange-50 hover:bg-orange-100 text-[#F7941F] font-medium">Cancelar</button>
        </div>
      </div>

      {/* Desktop/centered modal */}
      <div className="hidden sm:block w-[720px] bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#004417]">Editar item</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Nome do produto</span>
            <input className="mt-1 border rounded px-2 py-1 focus:border-[#397738]" value={local.nome_produto} onChange={(e) => setLocal({ ...local, nome_produto: e.target.value })} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Categoria</span>
            <select
              className="mt-1 border rounded px-2 py-1 focus:border-[#397738]"
              value={local.categoria ?? ''}
              onChange={(e) => setLocal({ ...local, categoria: e.target.value })}
            >
              <option value="">Selecione</option>
              <option>Máquinas e Equipamentos</option>
              <option>Irrigação</option>
              <option>Aluguel de Máquinas</option>
              <option>Mão de obra</option>
              <option>Gestão/Administração</option>
              <option>Sementes e mudas</option>
              <option>Fertilizantes</option>
              <option>Defensivos Agrícolas</option>
              <option>Venda</option>
              <option>Embalagens</option>
              <option>Análise de Solo</option>
              <option>Despesas Gerais</option>
              <option>Serviços Diversos</option>
              <option>Transporte</option>
              <option>Despesas Administrativas</option>
              <option>Despesas de armazenagem</option>
              <option>Beneficiamento</option>
              <option>Seguro</option>
              <option>Assistência Técnica</option>
              <option>Classificação</option>
              <option>Outros</option>
              <option>Manutenção e Instalações</option>
              <option>Encargos Sociais</option>
              <option>Arrendamento</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Unidade</span>
            <select
              className="mt-1 border rounded px-2 py-1 focus:border-[#397738]"
              value={normalizeUnit(local.unidade_valor_original ?? local.unidade) || ''}
              onChange={(e) => setLocal({ ...local, unidade_valor_original: e.target.value })}
            >
              <option value="mg">mg</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ton">t (tonelada)</option>
              <option value="mL">mL</option>
              <option value="L">L</option>
              <option value="un">unidade</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Quantidade</span>
            <input
              type="number"
              className="mt-1 border rounded px-2 py-1 focus:border-[#397738]"
              value={(() => {
                try {
                  const display = convertFromStandardUnit(Number(local.quantidade || 0), local.unidade, local.unidade_valor_original ?? local.unidade);
                  return Number.isFinite(display) ? String(display) : String(local.quantidade);
                } catch (e) {
                  return String(local.quantidade);
                }
              })()}
              onChange={(e) => {
                const entered = Number(e.target.value || 0);
                const unidadeOriginal = local.unidade_valor_original ?? local.unidade;
                const converted = convertToStandardUnit(entered, unidadeOriginal);
                setLocal({ ...local, quantidade: converted.quantidade, unidade: converted.unidade, unidade_valor_original: unidadeOriginal });
              }}
            />
          </label>
          <label className="flex flex-col col-span-2">
            <span className="text-sm font-medium text-[#092f20]">Valor unitário (R$)</span>
            <input
              type="text"
              className="mt-1 border rounded px-2 py-1 focus:border-[#397738]"
              value={currency.displayValue}
              onChange={(e) => {
                const res = currency.handleChange(e.target.value);
                setLocal({ ...local, valor_unitario: res.numeric });
              }}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Lote</span>
            <input className="mt-1 border rounded px-2 py-1 focus:border-[#397738]" value={local.lote ?? ''} onChange={(e) => setLocal({ ...local, lote: e.target.value })} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Validade</span>
            <input type="date" className="mt-1 border rounded px-2 py-1 focus:border-[#397738]" value={local.validade ?? ''} onChange={(e) => setLocal({ ...local, validade: e.target.value })} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-orange-50 hover:bg-orange-100 text-[#F7941F]">Cancelar</button>
          <button disabled={saving} onClick={handleSave} className="px-4 py-2 rounded bg-[#397738] hover:bg-[#004417] text-white">{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
