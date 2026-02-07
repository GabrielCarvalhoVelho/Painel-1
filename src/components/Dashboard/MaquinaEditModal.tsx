import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatCurrencyInput, formatCurrency } from '../../lib/currencyFormatter';

interface MaquinaData {
  id_maquina: string;
  nome?: string | null;
  categoria?: string | null;
  marca_modelo?: string | null;
  horimetro_atual?: number | null;
  valor_compra?: number | null;
  data_compra?: string | null;
  fornecedor?: string | null;
  numero_serie?: string | null;
}

interface Props {
  isOpen: boolean;
  maquina?: MaquinaData | null;
  onClose: () => void;
  onSave: (id: string, payload: Partial<MaquinaData>) => Promise<void>;
}

export default function MaquinaEditModal({ isOpen, maquina, onClose, onSave }: Props) {
  const [local, setLocal] = useState<Partial<MaquinaData> | null>(null);
  const [saving, setSaving] = useState(false);
  const [valorDisplay, setValorDisplay] = useState<string>('R$ 0,00');

  useEffect(() => {
    if (maquina) {
      setLocal({
        nome: maquina.nome ?? undefined,
        categoria: maquina.categoria ?? undefined,
        marca_modelo: maquina.marca_modelo ?? undefined,
        horimetro_atual: maquina.horimetro_atual ?? undefined,
        valor_compra: maquina.valor_compra ?? undefined,
        data_compra: maquina.data_compra ? String(maquina.data_compra).slice(0, 10) : undefined,
        fornecedor: maquina.fornecedor ?? undefined,
        numero_serie: maquina.numero_serie ?? undefined,
      });
      setValorDisplay(formatCurrency(maquina.valor_compra || 0));
    } else {
      setLocal(null);
      setValorDisplay('R$ 0,00');
    }
  }, [maquina]);

  if (!isOpen || !maquina || !local) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(maquina.id_maquina || '', local);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar máquina:', e);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const categorias = [
    'Adubadeira',
    'Carreta',
    'Colheitadeira',
    'Equipamentos manuais',
    'Esqueletadeira',
    'Grade/Subsolador',
    'Pulverizador/Bomba',
    'Roçadeira/Trincha',
    'Trator',
    'Varredoura',
    'Outra',
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-[90vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-[#004417]">Editar máquina</h3>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-[#F7941F]" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Nome da máquina</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.nome ?? '')}
              onChange={(e) => setLocal({ ...local, nome: e.target.value })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Categoria</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.categoria ?? '')}
              onChange={(e) => setLocal({ ...local, categoria: e.target.value })}
            >
              <option value="">Selecione...</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Marca / Modelo</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.marca_modelo ?? '')}
              onChange={(e) => setLocal({ ...local, marca_modelo: e.target.value })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Horímetro atual</span>
            <input
              type="number"
              step="0.1"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.horimetro_atual != null ? String(local.horimetro_atual) : ''}
              onChange={(e) => setLocal({ ...local, horimetro_atual: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </label>

          <div className="flex items-end gap-2">
            <label className="flex-1 flex flex-col">
              <span className="text-sm font-medium text-[#092f20]">Valor de compra</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="R$ 0,00"
                className="mt-1 border rounded px-3 py-2 focus:border-[#397738] text-left"
                value={valorDisplay}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = formatCurrencyInput(raw);
                  setLocal({ ...local, valor_compra: parsed.numeric });
                  setValorDisplay(formatCurrency(parsed.numeric));
                }}
              />
            </label>
          </div>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Data de compra</span>
            <input
              type="date"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.data_compra ? String(local.data_compra).slice(0, 10) : ''}
              onChange={(e) => setLocal({ ...local, data_compra: e.target.value || undefined })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Fornecedor</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.fornecedor ?? '')}
              onChange={(e) => setLocal({ ...local, fornecedor: e.target.value })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Número de série</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.numero_serie ?? '')}
              onChange={(e) => setLocal({ ...local, numero_serie: e.target.value })}
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
