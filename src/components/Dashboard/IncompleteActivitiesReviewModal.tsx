import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ActivityPayload } from '../../types/activity';
import ActivityEditModal from './ActivityEditModal';
import { formatDateBR } from '../../lib/dateUtils';
import NfDeleteConfirmModal from '../Estoque/NfDeleteConfirmModal';

interface Props {
  isOpen: boolean;
  activities: ActivityPayload[];
  onClose: () => void;
  onEdit: (id: string, payload: ActivityPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConfirmItem: (id: string) => Promise<void>;
  onConfirmAll: () => Promise<void>;
}

export default function IncompleteActivitiesReviewModal({ isOpen, activities, onClose, onEdit, onDelete, onConfirmItem, onConfirmAll }: Props) {
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityPayload | null>(null);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-start justify-center pt-6 sm:pt-10 bg-black/40 h-screen min-h-screen overflow-auto">
      <div className="w-[95vw] sm:w-[1400px] sm:max-w-[95vw] max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-auto bg-white sm:rounded-lg rounded-t-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#004417]">Revisar atividades incompletas</h3>
            <div className="text-sm text-[#092f20] mt-1">Revise e confirme cada atividade agrícola ou exclua se não for necessária.</div>
          </div>
          <div>
            <button onClick={onClose} aria-label="Fechar" className="p-2 rounded hover:bg-gray-100">Fechar</button>
          </div>
        </div>

        <div className="mt-6">
          {/* Mobile: cards stacked vertically */}
          <div className="sm:hidden flex flex-col gap-4">
            {activities.map((act) => (
              <div key={act.id || act.descricao} className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.04)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#004417] truncate">{act.descricao}</div>
                    <div className="mt-1 text-xs text-[#092f20]">Talhão: {act.nome_talhao || '-'}</div>
                    <div className="mt-1 text-xs text-[#092f20]">Data: {act.data_atividade ? formatDateBR(act.data_atividade) : '-'}</div>
                    {(act.produtos && act.produtos.length > 0) && (
                      <div className="mt-2 text-xs text-[#092f20]">
                        <div className="font-semibold text-[13px] text-[#004417]">Produtos:</div>
                        <ul className="list-disc ml-4">
                          {act.produtos.map((p) => (
                            <li key={p.id} className="text-xs text-[#092f20]">{p.nome || '-'} — {p.quantidade || '-'} {p.unidade || ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(act.observacoes) && (
                      <div className="mt-2 text-xs text-[#092f20]"><span className="font-semibold text-[13px] text-[#004417]">Observações:</span> {act.observacoes}</div>
                    )}
                    {(act.maquinas && act.maquinas.length > 0) && (
                      <div className="mt-2 text-xs text-[#092f20]">
                        <div className="font-semibold text-[13px] text-[#004417]">Máquinas:</div>
                        <ul className="list-disc ml-4">
                          {act.maquinas.map((m) => (
                            <li key={m.id} className="text-xs text-[#092f20]">{m.nome || '-'} — {m.horas ? `${m.horas}h` : '-'}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setEditingActivity(act)} className="flex-1 text-sm px-3 py-2 bg-[#86b646] bg-opacity-10 hover:bg-[#86b646] hover:bg-opacity-20 text-[#004417] rounded transition-colors">Editar</button>
                  <button onClick={() => onConfirmItem(act.id || '')} className="flex-1 text-sm px-3 py-2 bg-[#397738] hover:bg-[#004417] text-white rounded">Confirmar</button>
                  <button onClick={() => setDeleteTarget({ id: act.id || '', name: act.descricao })} className="flex-1 text-sm px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#F7941F] rounded font-medium">Excluir</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: grid de cards (3 colunas) */}
          <div className="hidden sm:block overflow-auto bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activities.map((act) => (
                <div key={act.id || act.descricao} className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.04)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#004417] truncate">{act.descricao}</div>
                      <div className="mt-1 text-xs text-[#092f20]">{''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#092f20] whitespace-nowrap">{act.nome_talhao || '-'}</div>
                      <div className="text-xs text-[#092f20] mt-1 whitespace-nowrap">{act.data_atividade ? formatDateBR(act.data_atividade) : '-'}</div>
                    </div>
                  </div>

                  {(act.produtos && act.produtos.length > 0) && (
                    <div className="mt-3 text-xs text-[#092f20]">
                      <div className="font-semibold text-[13px] text-[#004417]">Produtos:</div>
                      <ul className="list-disc ml-4">
                        {act.produtos.map((p) => (
                          <li key={p.id} className="text-xs text-[#092f20]">{p.nome || '-'} — {p.quantidade || '-'} {p.unidade || ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(act.maquinas && act.maquinas.length > 0) && (
                    <div className="mt-2 text-xs text-[#092f20]">
                      <div className="font-semibold text-[13px] text-[#004417]">Máquinas:</div>
                      <ul className="list-disc ml-4">
                        {act.maquinas.map((m) => (
                          <li key={m.id} className="text-xs text-[#092f20]">{m.nome || '-'} — {m.horas ? `${m.horas}h` : '-'}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => setEditingActivity(act)} className="flex-1 text-sm px-3 py-2 bg-[#86b646] bg-opacity-10 hover:bg-[#86b646] hover:bg-opacity-20 text-[#004417] rounded transition-colors">Editar</button>
                    <button onClick={() => onConfirmItem(act.id || '')} className="flex-1 text-sm px-3 py-2 bg-[#397738] hover:bg-[#004417] text-white rounded">Confirmar</button>
                    <button onClick={() => setDeleteTarget({ id: act.id || '', name: act.descricao })} className="flex-1 text-sm px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#F7941F] rounded font-medium">Excluir</button>
                  </div>
                </div>
              ))}
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

        <ActivityEditModal
          isOpen={!!editingActivity}
          transaction={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={async (id, payload) => {
            await onEdit(id, payload);
          }}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
