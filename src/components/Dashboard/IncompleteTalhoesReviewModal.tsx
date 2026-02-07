import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDateTimeBR, parseDateFromDB } from '../../lib/dateUtils';
import NfDeleteConfirmModal from '../Estoque/NfDeleteConfirmModal';
import type { Talhao as TalhaoType } from '../../lib/supabase';
import TalhaoEditModal from './TalhaoEditModal';

interface Props {
  isOpen: boolean;
  talhoes: TalhaoType[];
  onClose: () => void;
  onEdit: (id: string, payload: Partial<TalhaoType>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConfirmItem: (id: string) => Promise<void>;
  onConfirmAll: () => Promise<void>;
}

export default function IncompleteTalhoesReviewModal({ isOpen, talhoes, onClose, onEdit, onDelete, onConfirmItem, onConfirmAll }: Props) {
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [editingTalhao, setEditingTalhao] = useState<TalhaoType | null>(null);

  if (!isOpen) return null;

  const renderCard = (t: TalhaoType) => (
    <div key={t.id_talhao || t.nome} className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.04)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#004417] truncate">{t.nome || 'Talhão sem nome'}</div>
          <div className="mt-1 text-xs text-[#092f20]">Área: {t.area ?? '-'} ha</div>
          <div className="mt-1 text-xs text-[#092f20]">Produtividade (sacas): {t.produtividade_saca != null ? String(t.produtividade_saca) : '-'}</div>
          <div className="mt-1 text-xs text-[#092f20]">Quantidade de pés: {t.quantidade_de_pes != null ? String(t.quantidade_de_pes) : '-'}</div>
          <div className="mt-1 text-xs text-[#092f20]">Variedade: {t.variedade_plantada || '-'}</div>
          <div className="mt-1 text-xs text-[#092f20]">Ano de plantio: {t.ano_de_plantio ? (() => { const d = parseDateFromDB(t.ano_de_plantio); return d && !isNaN(d.getTime()) ? String(d.getFullYear()) : String(t.ano_de_plantio).slice(0,4); })() : '-'}</div>
          <div className="mt-1 text-xs text-[#004417]/65">{t.data_criacao ? `Lançado em ${formatDateTimeBR(t.data_criacao)}` : '-'}</div>
        </div>
        <div className="text-right" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => setEditingTalhao(t)} className="flex-1 text-sm px-3 py-2 bg-[#86b646] bg-opacity-10 hover:bg-[#86b646] hover:bg-opacity-20 text-[#004417] rounded transition-colors">Editar</button>
        <button onClick={() => onConfirmItem(t.id_talhao || '')} className="flex-1 text-sm px-3 py-2 bg-[#397738] hover:bg-[#004417] text-white rounded">Confirmar</button>
        <button onClick={() => setDeleteTarget({ id: t.id_talhao || '', name: t.nome })} className="flex-1 text-sm px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#F7941F] rounded font-medium">Excluir</button>
      </div>

    </div>
  );

  // Ordena talhões por `data_criacao` — mais recentes primeiro
  const sortedTalhoes = (talhoes || []).slice().sort((a, b) => {
    const ta = a?.data_criacao ? new Date(a.data_criacao).getTime() : 0;
    const tb = b?.data_criacao ? new Date(b.data_criacao).getTime() : 0;
    return tb - ta;
  });

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-start justify-center pt-6 sm:pt-10 bg-black/40 h-screen min-h-screen overflow-auto">
      <div className="w-[95vw] sm:w-[1400px] sm:max-w-[95vw] max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-auto bg-white sm:rounded-lg rounded-t-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#004417]">Revisar talhões</h3>
            <div className="text-sm text-[#092f20] mt-1">Revise e confirme cada talhão ou exclua se não for necessário.</div>
          </div>
          <div>
            <button onClick={onClose} aria-label="Fechar" className="p-2 rounded hover:bg-gray-100">Fechar</button>
          </div>
        </div>

        <div className="mt-6">
            <div className="sm:hidden flex flex-col gap-4">
            {sortedTalhoes.map(renderCard)}
          </div>

          <div className="hidden sm:block overflow-auto bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedTalhoes.map(renderCard)}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button disabled={processing} onClick={async () => { setProcessing(true); try { await onConfirmAll(); } finally { setProcessing(false); } }} className="px-4 py-2 bg-[#397738] hover:bg-[#004417] text-white rounded font-semibold transition-colors">{processing ? 'Processando...' : 'Confirmar todos'}</button>
        </div>

        <NfDeleteConfirmModal
          isOpen={!!deleteTarget}
          itemName={deleteTarget?.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (deleteTarget) {
              await onDelete(deleteTarget.id);
              setDeleteTarget(null);
            }
          }}
        />

        {/* Modal de edição específico para talhões */}
        <TalhaoEditModal
          isOpen={!!editingTalhao}
          talhao={editingTalhao}
          onClose={() => setEditingTalhao(null)}
          onSave={async (id: string, payload: Partial<TalhaoType>) => { await onEdit(id, payload); }}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
