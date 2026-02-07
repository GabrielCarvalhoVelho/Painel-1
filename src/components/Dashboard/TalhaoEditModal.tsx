import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Talhao } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  talhao?: Talhao | null;
  onClose: () => void;
  onSave: (id: string, payload: Partial<Talhao>) => Promise<void>;
}

export default function TalhaoEditModal({ isOpen, talhao, onClose, onSave }: Props) {
  const [local, setLocal] = useState<Partial<Talhao> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (talhao) {
      setLocal({
        nome: talhao.nome ?? undefined,
        area: talhao.area ?? undefined,
        variedade_plantada: talhao.variedade_plantada ?? undefined,
        ano_de_plantio: talhao.ano_de_plantio ? String(talhao.ano_de_plantio).slice(0, 10) : undefined,
        produtividade_saca: talhao.produtividade_saca ?? undefined,
        quantidade_de_pes: talhao.quantidade_de_pes ?? undefined,
      });
    } else {
      setLocal(null);
    }
  }, [talhao]);

  if (!isOpen || !talhao || !local) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(talhao.id_talhao || '', local);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar talhão:', e);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-[90vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-[#004417]">Editar talhão</h3>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-[#F7941F]" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Nome do talhão</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.nome ?? '')}
              onChange={(e) => setLocal({ ...local, nome: e.target.value })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Área (ha)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.area != null ? String(local.area) : ''}
              onChange={(e) => setLocal({ ...local, area: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Variedade</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.variedade_plantada ?? '')}
              onChange={(e) => setLocal({ ...local, variedade_plantada: e.target.value })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Produtividade (sacas)</span>
            <input
              type="number"
              step="0.1"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.produtividade_saca != null ? String(local.produtividade_saca) : ''}
              onChange={(e) => setLocal({ ...local, produtividade_saca: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Quantidade de pés</span>
            <input
              type="number"
              step="1"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.quantidade_de_pes != null ? String(local.quantidade_de_pes) : ''}
              onChange={(e) => setLocal({ ...local, quantidade_de_pes: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Ano de plantio</span>
            <input
              type="date"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.ano_de_plantio ? String(local.ano_de_plantio).slice(0, 10) : ''}
              onChange={(e) => setLocal({ ...local, ano_de_plantio: e.target.value || undefined })}
            />
          </label>

          
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-white border">Cancelar</button>
          <button disabled={saving} onClick={handleSave} className="px-4 py-2 rounded bg-[#397738] text-white">{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
