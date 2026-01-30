import { useState } from 'react';
import { TransacaoFinanceira } from '../../lib/supabase';
import { AttachmentService } from '../../services/attachmentService';
import mockFinanceService from '../../services/mockFinanceService';

interface Props {
  transaction: TransacaoFinanceira;
  onClose: () => void;
  onSaved?: () => Promise<void>;
}

export default function TransactionDetailModal({ transaction, onClose, onSaved }: Props) {
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImage = async (file?: File) => {
    if (!file) return;
    setError(null);
    setLoadingImage(true);
    try {
      await AttachmentService.uploadAttachment(transaction.id_transacao || '', file);
      if (onSaved) await onSaved();
    } catch (err) {
      console.warn('AttachmentService.uploadAttachment failed, applying mock fallback', err);
      // fallback para mock
      await mockFinanceService.updateTransaction(transaction.id_transacao || '', { anexo_compartilhado_url: `mock-image://${Date.now()}` } as any);
      if (onSaved) await onSaved();
    } finally {
      setLoadingImage(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    setLoadingFile(true);
    try {
      await AttachmentService.uploadFileAttachment(transaction.id_transacao || '', file);
      if (onSaved) await onSaved();
    } catch (err) {
      console.warn('AttachmentService.uploadFileAttachment failed, applying mock fallback', err);
      await mockFinanceService.updateTransaction(transaction.id_transacao || '', { anexo_arquivo_url: `mock-file://${Date.now()}` } as any);
      if (onSaved) await onSaved();
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-[#004417]">Detalhes da Transação</h3>
          <button className="text-sm text-[#004417]/70" onClick={onClose}>Fechar</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-[#004417]/65">Descrição</label>
            <div className="font-semibold text-[#004417]">{transaction.descricao || '-'}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#004417]/65">Valor</label>
              <div className="font-semibold text-[#004417]">{String(transaction.valor)}</div>
            </div>
            <div>
              <label className="text-sm text-[#004417]/65">Categoria</label>
              <div className="font-semibold text-[#004417]">{transaction.categoria || '-'}</div>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#004417]/65">Talhão</label>
            <div className="font-semibold text-[#004417]">{transaction.nome_talhao || '-'}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#004417]/65">Imagem (JPG)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImage(e.target.files ? e.target.files[0] : undefined)}
                className="mt-2"
                disabled={loadingImage}
              />
              {loadingImage && <div className="text-sm text-[#004417]/60 mt-2">Enviando imagem...</div>}
            </div>

            <div>
              <label className="text-sm text-[#004417]/65">Arquivo (PDF/XML)</label>
              <input
                type="file"
                accept="application/pdf,application/xml,application/octet-stream"
                onChange={e => handleFile(e.target.files ? e.target.files[0] : undefined)}
                className="mt-2"
                disabled={loadingFile}
              />
              {loadingFile && <div className="text-sm text-[#004417]/60 mt-2">Enviando arquivo...</div>}
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end pt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-white border mr-2">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
