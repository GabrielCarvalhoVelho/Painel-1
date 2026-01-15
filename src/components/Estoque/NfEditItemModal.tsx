import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface PendingNfItem {
  id: string;
  nome_produto: string;
  marca?: string | null;
  categoria?: string | null;
  unidade: string;
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

  useEffect(() => {
    if (item) setLocal({ ...item });
  }, [item]);

  if (!isOpen || !local) return null;

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
            <input className="mt-1 border rounded px-3 py-2 focus:border-[#397738]" value={local.categoria ?? ''} onChange={(e) => setLocal({ ...local, categoria: e.target.value })} />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Unidade</span>
            <input className="mt-1 border rounded px-3 py-2 focus:border-[#397738]" value={local.unidade} onChange={(e) => setLocal({ ...local, unidade: e.target.value })} />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Quantidade</span>
            <input type="number" className="mt-1 border rounded px-3 py-2 focus:border-[#397738]" value={local.quantidade} onChange={(e) => setLocal({ ...local, quantidade: Number(e.target.value) })} />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Valor unitário (R$)</span>
            <input type="number" step="0.01" className="mt-1 border rounded px-3 py-2 focus:border-[#397738]" value={local.valor_unitario ?? ''} onChange={(e) => setLocal({ ...local, valor_unitario: e.target.value ? Number(e.target.value) : null })} />
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
          <button onClick={() => { onSave(local); }} className="w-full px-4 py-3 rounded bg-[#397738] hover:bg-[#004417] text-white font-semibold">Salvar</button>
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
            <input className="mt-1 border rounded px-2 py-1 focus:border-[#397738]" value={local.categoria ?? ''} onChange={(e) => setLocal({ ...local, categoria: e.target.value })} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Unidade</span>
            <input className="mt-1 border rounded px-2 py-1 focus:border-[#397738]" value={local.unidade} onChange={(e) => setLocal({ ...local, unidade: e.target.value })} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Quantidade</span>
            <input type="number" className="mt-1 border rounded px-2 py-1 focus:border-[#397738]" value={local.quantidade} onChange={(e) => setLocal({ ...local, quantidade: Number(e.target.value) })} />
          </label>
          <label className="flex flex-col col-span-2">
            <span className="text-sm font-medium text-[#092f20]">Valor unitário (R$)</span>
            <input type="number" step="0.01" className="mt-1 border rounded px-2 py-1 focus:border-[#397738]" value={local.valor_unitario ?? ''} onChange={(e) => setLocal({ ...local, valor_unitario: e.target.value ? Number(e.target.value) : null })} />
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
          <button onClick={() => { onSave(local); }} className="px-4 py-2 rounded bg-[#397738] hover:bg-[#004417] text-white">Salvar</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
