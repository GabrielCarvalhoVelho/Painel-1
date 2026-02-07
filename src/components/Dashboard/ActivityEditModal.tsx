import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X } from 'lucide-react';
import type { ActivityPayload, ProdutoItem, MaquinaItem } from '../../types/activity';
import { TalhaoService } from '../../services/talhaoService';
import { AuthService } from '../../services/authService';
import { EstoqueService, ProdutoEstoque } from '../../services/estoqueService';
import { MaquinaService } from '../../services/maquinaService';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  transaction?: ActivityPayload | null;
  onClose: () => void;
  onSave: (id: string, payload: ActivityPayload) => Promise<void>;
}

export default function ActivityEditModal({ isOpen, transaction, onClose, onSave }: Props) {
  const [local, setLocal] = useState<ActivityPayload | null>(null);
  const [availableTalhoes, setAvailableTalhoes] = useState<Array<{ id_talhao: string; nome: string; talhao_default?: boolean }>>([]);
  const [availableProdutos, setAvailableProdutos] = useState<ProdutoEstoque[]>([]);
  const [availableMaquinas, setAvailableMaquinas] = useState<Array<{ id_maquina: string; nome: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadActivityData() {
      if (!transaction?.id) return;
      
      try {
        // Buscar talhões vinculados na tabela lancamento_talhoes
        const { data: vinculados, error: errorTalhoes } = await supabase
          .from('lancamento_talhoes')
          .select('talhao_id')
          .eq('atividade_id', transaction.id);

        if (errorTalhoes) {
          console.error('Erro ao carregar talhões vinculados:', errorTalhoes);
        }

        const talhaoIdsVinculados = (vinculados || []).map(v => v.talhao_id);

        // Buscar responsáveis vinculados na tabela lancamento_responsaveis
        const { data: responsaveisVinculados, error: errorResp } = await supabase
          .from('lancamento_responsaveis')
          .select('id, nome')
          .eq('atividade_id', transaction.id);

        if (errorResp) {
          console.error('Erro ao carregar responsáveis vinculados:', errorResp);
        }

        const responsaveis = (responsaveisVinculados || []).map(r => ({
          id: String(r.id),
          nome: r.nome
        }));

        // Buscar produtos vinculados na tabela lancamento_produtos
        const { data: produtosVinculados, error: errorProd } = await supabase
          .from('lancamento_produtos')
          .select('id, nome_produto, quantidade_val, quantidade_un, unidade_medida')
          .eq('atividade_id', transaction.id);

        if (errorProd) {
          console.error('Erro ao carregar produtos vinculados:', errorProd);
        }

        const produtos = (produtosVinculados || []).map(p => ({
          id: String(p.id),
          nome: p.nome_produto || '',
          quantidade: p.quantidade_val ? String(p.quantidade_val) : '',
          unidade: p.quantidade_un || p.unidade_medida || 'kg'
        }));

        // Preencher campos relevantes para atividade agrícola
        const tx = transaction as ActivityPayload;
        setLocal({
          descricao: tx.descricao ?? undefined,
          data_atividade: tx.data_atividade ?? undefined,
          nome_talhao: tx.nome_talhao ?? '',
          talhao_ids: talhaoIdsVinculados.length > 0 ? talhaoIdsVinculados : (tx.talhao_ids ?? []),
          produtos: produtos.length > 0 ? produtos : (tx.produtos ?? []),
          maquinas: tx.maquinas ?? [],
          imagem: tx.imagem ?? undefined,
          arquivo: tx.arquivo ?? undefined,
          observacoes: tx.observacoes ?? undefined,
          responsaveis: responsaveis.length > 0 ? responsaveis : (tx.responsaveis ?? []),
        });
      } catch (e) {
        console.error('Erro ao carregar dados da atividade:', e);
        // Fallback para dados locais
        const tx = transaction as ActivityPayload;
        setLocal({
          descricao: tx.descricao ?? undefined,
          data_atividade: tx.data_atividade ?? undefined,
          nome_talhao: tx.nome_talhao ?? '',
          talhao_ids: tx.talhao_ids ?? [],
          produtos: tx.produtos ?? [],
          maquinas: tx.maquinas ?? [],
          imagem: tx.imagem ?? undefined,
          arquivo: tx.arquivo ?? undefined,
          observacoes: tx.observacoes ?? undefined,
          responsaveis: tx.responsaveis ?? [],
        });
      }
    }

    if (transaction) {
      loadActivityData();
    } else {
      setLocal(null);
    }
  }, [transaction]);

  useEffect(() => {
    // Load user's talhões for multiselect
    async function loadTalhoes() {
      try {
        const userId = AuthService.getInstance().getCurrentUser()?.user_id;
        if (!userId) return;
        const list = await TalhaoService.getTalhoesByUserId(userId);
        // Mostrar apenas talhões não-default (talhao_default = false)
        setAvailableTalhoes((list || []).filter((t) => t.talhao_default !== true));
      } catch (e) {
        console.error('Erro ao carregar talhões:', e);
      }
    }

    if (isOpen) loadTalhoes();
  }, [isOpen]);

  useEffect(() => {
    // Load produtos do estoque para preencher select
    async function loadProdutos() {
      try {
        const list = await EstoqueService.getProdutos();
        setAvailableProdutos(list || []);
      } catch (e) {
        console.error('Erro ao carregar produtos do estoque:', e);
      }
    }

    if (isOpen) loadProdutos();
  }, [isOpen]);

  useEffect(() => {
    // Load máquinas do usuário para preencher select
    async function loadMaquinas() {
      try {
        const userId = AuthService.getInstance().getCurrentUser()?.user_id;
        if (!userId) return;
        const svc = new MaquinaService();
        const list = await svc.getMaquinasByUserId(userId);
        setAvailableMaquinas((list || []).map(m => ({ id_maquina: (m as any).id_maquina, nome: (m as any).nome })));
      } catch (e) {
        console.error('Erro ao carregar máquinas:', e);
      }
    }

    if (isOpen) loadMaquinas();
  }, [isOpen]);

  if (!isOpen || !local || !transaction) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ActivityPayload = { ...(local as ActivityPayload) };
      if (local?.talhao_ids) {
        payload.talhoes = local.talhao_ids.map(id => ({ talhao_id: id } as any));
      }
      await onSave(transaction?.id || '', payload);
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

          <div className="col-span-1 sm:col-span-2">
            <span className="text-sm font-medium text-[#092f20]">Talhões vinculados</span>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {availableTalhoes.length === 0 && (
                <div className="text-sm text-[rgba(0,68,23,0.6)]">Nenhum talhão encontrado</div>
              )}
              {availableTalhoes.map((t) => (
                <label key={t.id_talhao} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(local?.talhao_ids?.includes(t.id_talhao))}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const current = (local?.talhao_ids ? [...local.talhao_ids] : []) as string[];
                      const setIds = new Set(current);
                      if (checked) setIds.add(t.id_talhao);
                      else setIds.delete(t.id_talhao);
                      setLocal({ ...local, talhao_ids: Array.from(setIds) });
                    }}
                  />
                  <span className="text-sm text-[#092f20]">{t.nome}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#092f20]">Responsáveis</span>
              <button
                type="button"
                onClick={() => {
                  const cur = local?.responsaveis ? [...local.responsaveis] : [];
                  cur.push({ id: Date.now().toString(), nome: '' });
                  setLocal({ ...local, responsaveis: cur });
                }}
                className="px-3 py-1 bg-[#86b646] text-white rounded-md text-sm"
              >
                + Adicionar
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {(local?.responsaveis || []).map((r, idx) => (
                <div key={r.id || idx} className="flex gap-2 items-center">
                  <input
                    className="flex-1 border rounded px-2 py-2"
                    placeholder="Nome do responsável"
                    value={r.nome || ''}
                    onChange={(e) => {
                      const arr = local?.responsaveis ? [...local.responsaveis] : [];
                      arr[idx] = { ...arr[idx], nome: e.target.value };
                      setLocal({ ...local, responsaveis: arr });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const arr = local?.responsaveis ? [...local.responsaveis] : [];
                      arr.splice(idx, 1);
                      setLocal({ ...local, responsaveis: arr });
                    }}
                    className="text-sm text-[#F7941F]"
                  >Remover</button>
                </div>
              ))}
            </div>
          </div>

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
                  const defaultName = availableProdutos[0]?.nome_produto || '';
                  const novo: ProdutoItem = { id: Date.now().toString(), nome: defaultName, quantidade: '', unidade: 'kg' };
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
                  <div className="col-span-1 sm:col-span-2">
                    {availableProdutos.length > 0 ? (
                      (() => {
                        const isKnown = availableProdutos.some(ap => ap.nome_produto === p.nome);
                        return (
                          <>
                            <select
                              className="w-full border rounded px-2 py-2"
                              value={isKnown ? p.nome : ''}
                              onChange={(e) => {
                                const produtos = local?.produtos ? [...local.produtos] : [];
                                const val = e.target.value;
                                if (val === '') {
                                  // marcar como custom (vai mostrar input)
                                  produtos[idx] = { ...produtos[idx], nome: '' };
                                } else {
                                  produtos[idx] = { ...produtos[idx], nome: val };
                                }
                                setLocal({ ...local, produtos });
                              }}
                            >
                              <option value="">Outro...</option>
                              {availableProdutos.map(ap => (
                                <option key={ap.id} value={ap.nome_produto}>{ap.nome_produto}</option>
                              ))}
                            </select>
                            {!isKnown && (
                              <input
                                className="mt-2 w-full border rounded px-2 py-2"
                                placeholder="Nome do produto"
                                value={p.nome || ''}
                                onChange={(e) => {
                                  const produtos = local?.produtos ? [...local.produtos] : [];
                                  produtos[idx] = { ...produtos[idx], nome: e.target.value };
                                  setLocal({ ...local, produtos });
                                }}
                              />
                            )}
                          </>
                        );
                      })()
                    ) : (
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
                    )}
                  </div>
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
                  const defaultName = availableMaquinas[0]?.nome || '';
                  const novo: MaquinaItem = { id: Date.now().toString(), nome: defaultName, horas: '' };
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
                  <div className="col-span-1 sm:col-span-2">
                    {availableMaquinas.length > 0 ? (
                      (() => {
                        const isKnown = availableMaquinas.some(am => am.nome === m.nome);
                        return (
                          <>
                            <select
                              className="w-full border rounded px-2 py-2"
                              value={isKnown ? m.nome : ''}
                              onChange={(e) => {
                                const maquinas = local?.maquinas ? [...local.maquinas] : [];
                                const val = e.target.value;
                                if (val === '') {
                                  maquinas[idx] = { ...maquinas[idx], nome: '' };
                                } else {
                                  maquinas[idx] = { ...maquinas[idx], nome: val };
                                }
                                setLocal({ ...local, maquinas });
                              }}
                            >
                              <option value="">Outro...</option>
                              {availableMaquinas.map(am => (
                                <option key={am.id_maquina} value={am.nome}>{am.nome}</option>
                              ))}
                            </select>
                            {!isKnown && (
                              <input
                                className="mt-2 w-full border rounded px-2 py-2"
                                placeholder="Nome da máquina"
                                value={m.nome || ''}
                                onChange={(e) => {
                                  const maquinas = local?.maquinas ? [...local.maquinas] : [];
                                  maquinas[idx] = { ...maquinas[idx], nome: e.target.value };
                                  setLocal({ ...local, maquinas });
                                }}
                              />
                            )}
                          </>
                        );
                      })()
                    ) : (
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
                    )}
                  </div>

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
