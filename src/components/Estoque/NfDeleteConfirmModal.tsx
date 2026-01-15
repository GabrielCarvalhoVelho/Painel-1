import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  itemName?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function NfDeleteConfirmModal({ isOpen, itemName, onClose, onConfirm }: Props) {
  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/40">
      {/* Mobile bottom sheet */}
      <div className="w-[95vw] sm:hidden bg-white rounded-t-lg p-4">
        <div>
          <div className="text-sm font-semibold text-[#004417]">Excluir item</div>
          <div className="text-xs text-[#092f20] mt-1">Tem certeza que deseja excluir {itemName ? `"${itemName}"` : 'este item'}? Essa ação não pode ser desfeita.</div>
        </div>

        <div className="mt-4 space-y-2">
          <button onClick={() => { onConfirm(); }} className="w-full px-4 py-3 rounded bg-[#F7941F] hover:bg-[#e07b19] text-white font-semibold">Excluir</button>
          <button onClick={onClose} className="w-full px-4 py-3 rounded bg-white border border-gray-100 hover:bg-gray-50 text-[#004417]">Cancelar</button>
        </div>
      </div>

      {/* Desktop centered modal */}
      <div className="hidden sm:block bg-white rounded-lg w-[520px] p-6 shadow-lg">
        <div>
          <h3 className="text-lg font-semibold text-[#004417]">Excluir item</h3>
          <p className="text-sm text-[#092f20] mt-2">Tem certeza que deseja excluir {itemName ? `"${itemName}"` : 'este item'}? Esta ação removerá o item pendente e não poderá ser desfeita.</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-white border border-gray-100 hover:bg-gray-50 text-[#004417]">Cancelar</button>
          <button onClick={() => { onConfirm(); }} className="px-4 py-2 rounded bg-[#F7941F] hover:bg-[#e07b19] text-white font-semibold">Excluir</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
