import React, { useState } from 'react';
import { Paperclip, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { TransacaoFinanceira } from '../../lib/supabase';
import { FinanceService } from '../../services/financeService';
import TransactionDetailModal from './TransactionDetailModal';

interface Props {
  transactions: TransacaoFinanceira[];
  onResolve: (id: string) => Promise<void>;
  onUpdate?: (id: string, payload: Partial<TransacaoFinanceira>) => Promise<void>;
}

export default function IncompleteFinancialTransactions({ transactions, onResolve, onUpdate }: Props) {
  const [resolving, setResolving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<TransacaoFinanceira>>({});
  const [selected, setSelected] = useState<TransacaoFinanceira | null>(null);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await onResolve(id);
    } finally {
      setResolving(null);
    }
  };

  const startEdit = (tx: TransacaoFinanceira) => {
    setEditingId(tx.id_transacao || null);
    setForm({
      descricao: tx.descricao || '',
      valor: tx.valor as any,
      categoria: tx.categoria || '',
      pagador_recebedor: tx.pagador_recebedor || '',
      data_agendamento_pagamento: tx.data_agendamento_pagamento || tx.data_transacao || tx.data_registro || null,
      nome_talhao: tx.nome_talhao || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveEdit = async (id: string) => {
    if (!onUpdate) return;
    await onUpdate(id, form);
    setEditingId(null);
    setForm({});
  };

  const openDetail = (tx: TransacaoFinanceira) => setSelected(tx);
  const closeDetail = () => setSelected(null);

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#004417]">Transações Incompletas</h3>
        <div className="text-sm text-[#004417]/65">Itens: {transactions.length}</div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-[#004417]/70">Nenhuma transação incompleta</div>
        ) : (
          transactions.map(tx => {
            const isIncome = Number(tx.valor) > 0;
            const editing = editingId === tx.id_transacao;
            return (
              <div key={tx.id_transacao} className="relative p-4 rounded-xl bg-white transition-all duration-200 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 pr-8">
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-[#00A651]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#F7941F]" />
                    )}
                    <div>
                      {!editing ? (
                        <>
                          <h4 className="font-semibold text-[#004417]">{tx.descricao || 'Sem descrição'}</h4>
                          {tx.pagador_recebedor && (
                            <p className="text-sm text-[#004417]/65">{tx.pagador_recebedor}</p>
                          )}
                        </>
                      ) : (
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={(form.descricao as string) || ''}
                          onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!editing ? (
                      <>
                        <button
                          onClick={() => handleResolve(tx.id_transacao || '')}
                          disabled={resolving === tx.id_transacao}
                          className="px-3 py-1 rounded-md bg-[#00A651] text-white text-sm hover:opacity-95"
                        >
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>{resolving === tx.id_transacao ? 'Processando' : 'Marcar resolvido'}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => startEdit(tx)}
                          className="px-3 py-1 rounded-md bg-[#397738] text-white text-sm hover:opacity-95"
                        >
                          Editar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openDetail(tx); }} className="px-3 py-1 rounded-md bg-white border text-[#004417] text-sm">
                          Ver
                        </button>
                        <button className="p-2 rounded-lg text-[#004417]/65 hover:text-[#00A651]" title="Anexos">
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => saveEdit(tx.id_transacao || '')}
                          className="px-3 py-1 rounded-md bg-[#00A651] text-white text-sm hover:opacity-95"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 rounded-md bg-white border text-[#004417] text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#004417]/65">Valor:</span>
                    {!editing ? (
                      <p className={`font-bold ${isIncome ? 'text-[#00A651]' : 'text-[#F7941F]'}`}>
                        {FinanceService.formatCurrency(Math.abs(Number(tx.valor) || 0))}
                      </p>
                    ) : (
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-full"
                        value={(form.valor as any) ?? ''}
                        onChange={e => setForm(f => ({ ...f, valor: Number(e.target.value) }))}
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-[#004417]/65">Categoria:</span>
                    {!editing ? (
                      <p className="text-[#004417] font-semibold">{tx.categoria || 'Sem categoria'}</p>
                    ) : (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={(form.categoria as string) || ''}
                        onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-[#004417]/65">Data:</span>
                    {!editing ? (
                      <p className="text-[#004417] font-semibold">{FinanceService.formatDataPagamento(String(tx.data_agendamento_pagamento || tx.data_transacao || ''))}</p>
                    ) : (
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-full"
                        value={form.data_agendamento_pagamento ? String(form.data_agendamento_pagamento).slice(0,10) : ''}
                        onChange={e => setForm(f => ({ ...f, data_agendamento_pagamento: e.target.value }))}
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-[#004417]/65">Talhão:</span>
                    {!editing ? (
                      <p className="text-[#004417] font-semibold">{tx.nome_talhao || 'Sem talhão'}</p>
                    ) : (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={(form.nome_talhao as string) || ''}
                        onChange={e => setForm(f => ({ ...f, nome_talhao: e.target.value }))}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selected && (
        <TransactionDetailModal
          transaction={selected}
          onClose={closeDetail}
          onSaved={async () => {
            if (onUpdate && selected) {
              await onUpdate(selected.id_transacao || '', {} as any);
            }
          }}
        />
      )}
    </div>
  );
}
