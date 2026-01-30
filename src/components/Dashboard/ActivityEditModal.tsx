import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X } from 'lucide-react';
import type { ActivityPayload, ProdutoItem, MaquinaItem } from '../../types/activity';

interface Props {
  isOpen: boolean;
  transaction?: ActivityPayload | null;
  onClose: () => void;
  onSave: (id: string, payload: ActivityPayload) => Promise<void>;
}

export default function ActivityEditModal({ isOpen, transaction, onClose, onSave }: Props) {
  const [local, setLocal] = useState<ActivityPayload | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      // Preencher apenas campos relevantes para atividade agrícola
      const tx = transaction as ActivityPayload;
      setLocal({
        descricao: tx.descricao ?? undefined,
        data_atividade: tx.data_atividade ?? undefined,
        nome_talhao: tx.nome_talhao ?? '',
        produtos: tx.produtos ?? [],
        maquinas: tx.maquinas ?? [],
        imagem: tx.imagem ?? undefined,
        arquivo: tx.arquivo ?? undefined,
        observacoes: tx.observacoes ?? undefined,
      });
    } else {
      setLocal(null);
    }
  }, [transaction]);

  if (!isOpen || !local || !transaction) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(transaction?.id || '', local!);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar atividade:', e);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-[90vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-[#004417]">Editar atividade</h3>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-[#F7941F]" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Descrição</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.descricao || '')}
              maxLength={30}
              onChange={(e) => setLocal({ ...local, descricao: e.target.value.slice(0, 30) })}
            />
            {(String(local.descricao || '').length >= 30) && (
              <p className="mt-1 text-sm text-[#F7941F]">Você atingiu o limite de 30 caracteres. Use uma descrição curta.</p>
            )}
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Data da atividade</span>
            <input
              type="date"
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={local.data_atividade ? String(local.data_atividade).slice(0,10) : ''}
              onChange={(e) => setLocal({ ...local, data_atividade: e.target.value })}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-[#092f20]">Talhão</span>
            <select
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.nome_talhao ?? '')}
              onChange={(e) => setLocal({ ...local, nome_talhao: e.target.value || '' })}
            >
              <option value="">Sem talhão vinculado</option>
              <option value="Talhao 1">Talhão 1</option>
              <option value="Talhao 2">Talhão 2</option>
              <option value="Talhao 3">Talhão 3</option>
            </select>
          </label>

          {/* Produtos utilizados: múltiplos */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#092f20]">Produtos utilizados</span>
                <div className="text-xs text-[#092f20]">Adicione produtos usados na atividade (quantidade + unidade).</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const produtos = local?.produtos || [];
                  const novo: ProdutoItem = { id: Date.now().toString(), nome: '', quantidade: '', unidade: 'kg' };
                  setLocal({ ...local, produtos: [...produtos, novo] });
                }}
                className="px-3 py-1 bg-[#86b646] text-white rounded-md text-sm"
              >
                + Adicionar produto
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {(local?.produtos || []).map((p, idx) => (
                <div key={p.id || idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                  <input
                    className="col-span-1 sm:col-span-2 border rounded px-2 py-2"
                    placeholder="Nome do produto"
                    value={p.nome || ''}
                    onChange={(e) => {
                      const produtos = local?.produtos ? [...local.produtos] : [];
                      produtos[idx] = { ...produtos[idx], nome: e.target.value };
                      setLocal({ ...local, produtos });
                    }}
                  />
                  <input
                    className="col-span-1 sm:col-span-1 border rounded px-2 py-2"
                    placeholder="Quantidade"
                    value={p.quantidade || ''}
                    onChange={(e) => {
                      const produtos = local?.produtos ? [...local.produtos] : [];
                      produtos[idx] = { ...produtos[idx], quantidade: e.target.value };
                      setLocal({ ...local, produtos });
                    }}
                  />
                  <select
                    className="col-span-1 sm:col-span-1 border rounded px-2 py-2"
                    value={p.unidade || 'kg'}
                    onChange={(e) => {
                      const produtos = local?.produtos ? [...local.produtos] : [];
                      produtos[idx] = { ...produtos[idx], unidade: e.target.value };
                      setLocal({ ...local, produtos });
                    }}
                  >
                    <option value="mg">mg</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="un">un</option>
                  </select>

                  <div className="col-span-1 sm:col-span-6 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const produtos = local?.produtos ? [...local.produtos] : [];
                        produtos.splice(idx, 1);
                        setLocal({ ...local, produtos: produtos.slice() });
                      }}
                      className="text-sm text-[#F7941F]"
                    >Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Máquinas utilizadas: múltiplas */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between mt-4">
              <div>
                <span className="text-sm font-medium text-[#092f20]">Máquinas utilizadas</span>
                <div className="text-xs text-[#092f20]">Digite o nome da máquina e informe horas inteiras (ex.: 1, 2).</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const maquinas = local?.maquinas || [];
                  const novo: MaquinaItem = { id: Date.now().toString(), nome: '', horas: '' };
                  setLocal({ ...local, maquinas: [...maquinas, novo] });
                }}
                className="px-3 py-1 bg-[#86b646] text-white rounded-md text-sm"
              >
                + Adicionar máquina
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {(local?.maquinas || []).map((m, idx) => (
                <div key={m.id || idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                  <input
                    className="col-span-1 sm:col-span-2 border rounded px-2 py-2"
                    placeholder="Nome da máquina"
                    value={m.nome || ''}
                    onChange={(e) => {
                      const maquinas = local?.maquinas ? [...local.maquinas] : [];
                      maquinas[idx] = { ...maquinas[idx], nome: e.target.value };
                      setLocal({ ...local, maquinas });
                    }}
                  />

                  <input
                    className="col-span-1 sm:col-span-1 border rounded px-2 py-2"
                    placeholder="Horas inteiras"
                    value={m.horas || ''}
                    inputMode="numeric"
                    pattern="\d*"
                    onChange={(e) => {
                      const digits = (e.target.value || '').replace(/\D/g, '');
                      const maquinas = local?.maquinas ? [...local.maquinas] : [];
                      maquinas[idx] = { ...maquinas[idx], horas: digits };
                      setLocal({ ...local, maquinas });
                    }}
                  />

                  <div className="col-span-1 sm:col-span-6 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const maquinas = local?.maquinas ? [...local.maquinas] : [];
                        maquinas.splice(idx, 1);
                        setLocal({ ...local, maquinas: maquinas.slice() });
                      }}
                      className="text-sm text-[#F7941F]"
                    >Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campos de transação removidos neste modal de atividade */}

          <label className="flex flex-col col-span-1 sm:col-span-2">
            <span className="text-sm font-medium text-[#092f20]">Observações</span>
            <input
              className="mt-1 border rounded px-3 py-2 focus:border-[#397738]"
              value={String(local.observacoes || '')}
              maxLength={100}
              onChange={(e) => setLocal({ ...local, observacoes: e.target.value.slice(0, 100) })}
            />
            {(String(local.observacoes || '').length >= 100) && (
              <p className="mt-1 text-sm text-[#F7941F]">Você atingiu o limite de 100 caracteres.</p>
            )}
          </label>

          

          {/* Campos de transação removidos (pagador/recebedor, forma, condição, status) */}

          {/* Anexos: layout igual a FormProdutoModal.tsx — imagem e arquivo */}
          <div className="col-span-1 sm:col-span-2">
            <div>
              <label className="block text-sm font-medium text-[#004417] mb-1">Imagem (opcional)</label>
              <div className="border-2 border-dashed border-[rgba(0,68,23,0.12)] rounded-[12px] p-4 text-center hover:border-[rgba(0,166,81,0.18)] transition-colors">
                <input
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setLocal({ ...local, imagem: e.target.files?.[0] || undefined })}
                  className="hidden"
                  id="file-upload-activity-imagem"
                />
                <label htmlFor="file-upload-activity-imagem" className="cursor-pointer">
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${ local?.imagem ? 'text-[#00A651]' : 'text-[rgba(0,68,23,0.35)]' }`} />
                    <p className={`text-sm ${ local?.imagem ? 'font-bold text-[#004417]' : 'text-[rgba(0,68,23,0.6)]' }`}>{local?.imagem ? local.imagem.name : 'Clique para selecionar uma imagem'}</p>
                  <p className="text-xs text-[rgba(0,68,23,0.6)] mt-1">JPG, PNG, WEBP (máx. 10MB)</p>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[#004417] mb-1">Arquivo (opcional)</label>
              <div className="border-2 border-dashed border-[rgba(0,68,23,0.12)] rounded-[12px] p-4 text-center hover:border-[rgba(0,166,81,0.18)] transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setLocal({ ...local, arquivo: e.target.files?.[0] || undefined })}
                  className="hidden"
                  id="file-upload-activity-arquivo"
                />
                <label htmlFor="file-upload-activity-arquivo" className="cursor-pointer">
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${ local?.arquivo ? 'text-[#00A651]' : 'text-[rgba(0,68,23,0.35)]' }`} />
                  <p className={`text-sm ${ local?.arquivo ? 'font-bold text-[#004417]' : 'text-[rgba(0,68,23,0.6)]' }`}>{local?.arquivo ? local.arquivo.name : 'Clique para selecionar um arquivo'}</p>
                  <p className="text-xs text-[rgba(0,68,23,0.6)] mt-1">PDF, JPG, PNG, WEBP (máx. 10MB)</p>
                </label>
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
