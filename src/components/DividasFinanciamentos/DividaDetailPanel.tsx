import { DividaFinanciamento } from '../../services/dividasFinanciamentosService';
import { X, Edit2, Trash2, CheckCircle, Download, Upload, Loader2, FileText } from 'lucide-react';
import { formatDateBR } from '../../lib/dateUtils';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../../services/authService';
import { UserService } from '../../services/userService';

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface DividaDetailPanelProps {
  divida: DividaFinanciamento | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onLiquidar: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => Promise<void>;
}

const getSituacaoBadgeColor = (situacao: string) => {
  switch (situacao) {
    case 'Ativa':
      return 'bg-[rgba(0,68,23,0.08)] text-[#004417] font-semibold';
    case 'Liquidada':
      return 'bg-[#00A651] bg-opacity-20 text-[#004417] font-semibold';
    case 'Renegociada':
      return 'bg-[rgba(0,68,23,0.08)] text-[#004417] font-semibold';
    default:
      return 'bg-[rgba(0,68,23,0.08)] text-[#004417] font-semibold';
  }
};

const DetailField = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (!value) return null;
  return (
    <div className="mb-4">
      <p className="text-[13px] text-[rgba(0,68,23,0.75)] font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[13px] font-semibold text-[#004417]">{value}</p>
    </div>
  );
};

export default function DividaDetailPanel({
  divida,
  isOpen,
  onClose,
  onEdit,
  onLiquidar,
  onDelete,
  onRefresh,
}: DividaDetailPanelProps) {
  const [signedAnexos, setSignedAnexos] = useState<string[]>([]);
  const [originalPaths, setOriginalPaths] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ url: string; path: string; index: number } | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BUCKET_NAME = 'dividas_financiamentos';

  const loadSignedUrls = async () => {
    if (!divida?.anexos || divida.anexos.length === 0) {
      setSignedAnexos([]);
      setOriginalPaths([]);
      return;
    }

    const results: string[] = [];
    const paths: string[] = [];
    for (const anexo of divida.anexos) {
      try {
        const path = anexo.startsWith('http')
          ? (anexo.match(/dividas_financiamentos\/(.*)$/) || [])[1]
          : anexo;
        if (!path) continue;
        paths.push(path);
        const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, 3600);
        if (error) {
          console.error('Erro criando signedUrl:', error);
          continue;
        }
        if (data?.signedUrl) results.push(data.signedUrl);
      } catch (err) {
        console.error('Erro ao gerar signed url anexo:', err);
      }
    }
    setSignedAnexos(results);
    setOriginalPaths(paths);
  };

  useEffect(() => {
    let mounted = true;
    const loadSigned = async () => {
      if (mounted) {
        await loadSignedUrls();
      }
    };

    loadSigned();
    return () => {
      mounted = false;
      setSelectedImage(null);
    };
  }, [divida]);

  if (!isOpen || !divida) return null;

  const handleDownloadImage = async () => {
    if (!selectedImage) return;
    setIsDownloading(true);
    try {
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = selectedImage.path.split('/').pop() || 'anexo.jpg';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
      console.error('Erro ao baixar:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    if (!selectedImage) return;
    setIsSendingWhatsApp(true);
    try {
      const userId = AuthService.getInstance().getCurrentUser()?.user_id;
      if (!userId) {
        setIsSendingWhatsApp(false);
        return;
      }
      const usuario = await UserService.getUserById(userId);
      if (!usuario?.telefone) {
        setIsSendingWhatsApp(false);
        return;
      }
      const fileName = selectedImage.path.split('/').pop() || 'anexo';
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
      const payload = {
        telefone: usuario.telefone.replace(/\D/g, ''),
        arquivo_url: selectedImage.url,
        titulo: divida.nome || 'Anexo de Divida',
        tipo_arquivo: isImage ? 'image' : 'document',
        mime_type: isImage ? `image/${extension === 'jpg' ? 'jpeg' : extension}` : 'application/octet-stream',
        nome_arquivo: fileName
      };
      const isDev = import.meta.env.MODE === 'development' ||
        (typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
      const webhookUrl = isDev
        ? '/api/whatsapp/enviar-documento-whatsapp'
        : import.meta.env.VITE_WHATSAPP_WEBHOOK_URL;
      if (!webhookUrl) {
        console.error('[Dividas][WhatsApp] Webhook URL não configurada');
        return;
      }
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedImage || !divida) return;
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([selectedImage.path]);
      if (error) {
        console.error('Erro ao excluir:', error);
        return;
      }
      const newAnexos = divida.anexos.filter((_, i) => i !== selectedImage.index);
      await supabase.from('dividas_financiamentos').update({ anexos: newAnexos }).eq('id', divida.id);
      setSelectedImage(null);

      // Atualizar dados sem recarregar a página
      await onRefresh();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedImage || !divida) return;
    try {
      await supabase.storage.from(BUCKET_NAME).remove([selectedImage.path]);
      const userId = AuthService.getInstance().getCurrentUser()?.user_id;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const newPath = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(newPath, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return;
      }
      const newAnexos = [...divida.anexos];
      newAnexos[selectedImage.index] = newPath;
      await supabase.from('dividas_financiamentos').update({ anexos: newAnexos }).eq('id', divida.id);
      setSelectedImage(null);

      // Atualizar dados sem recarregar a página
      await onRefresh();
    } catch (error) {
      console.error('Erro ao substituir:', error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-96">
        {/* Header */}
        <div className="border-b border-[rgba(0,68,23,0.08)] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#004417] mb-4">{divida.nome}</h2>
            <p className="text-[13px] text-[rgba(0,68,23,0.75)] font-medium mt-1">{divida.credor}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(0,68,23,0.08)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#004417]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getSituacaoBadgeColor(divida.situacao)}`}>
              {divida.situacao}
            </span>
          </div>

          {/* Informações Básicas */}
          <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Informações Básicas</h3>
            <DetailField label="Tipo" value={divida.tipo} />
            <DetailField label="Credor" value={divida.credor} />
            <DetailField label="Data da Contratação" value={formatDateBR(divida.data_contratacao)} />
            <DetailField label="Responsável" value={divida.responsavel} />
          </div>

          {/* Valores e Taxas */}
          <div>
            <h3 className="text-[16px] font-bold text-[#004417] mb-3">Valores e Taxas</h3>
            {divida.valor_contratado && divida.valor_contratado > 0 && (
              <DetailField
                label="Valor Contratado"
                value={`R$ ${divida.valor_contratado.toLocaleString('pt-BR')}`}
              />
            )}
            <DetailField label="Taxa" value={divida.taxa} />
            <DetailField label="Carência" value={divida.carencia} />
          </div>

          {/* Garantias e Pagamento */}
          <div>
            <h3 className="text-[16px] font-bold text-[#004417] mb-3">Garantias e Pagamento</h3>
            <DetailField label="Garantia" value={divida.garantia} />
            <DetailField label="Forma de Pagamento" value={divida.forma_pagamento} />
          </div>

          {/* Observações */}
          {divida.observacoes && (
            <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Observações</h3>
              <p className="text-[13px] font-medium text-[#004417] bg-[rgba(0,68,23,0.02)] p-3 rounded-lg">
                {divida.observacoes}
              </p>
            </div>
          )}

          {/* Cronograma de Pagamento */}
          {(((divida.pagamento_parcelado?.numParcelas ?? 0) > 0 && (divida.pagamento_parcelado?.valorParcela ?? 0) > 0) ||
            ((divida.pagamento_parcela?.valor ?? 0) > 0) ||
            ((divida.pagamento_producao?.quantidadeSacas ?? 0) > 0)) && (
            <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Cronograma de Pagamento</h3>
              {((divida.pagamento_parcelado?.numParcelas ?? 0) > 0) && ((divida.pagamento_parcelado?.valorParcela ?? 0) > 0) && (
                <div className="bg-[rgba(0,68,23,0.02)] p-3 rounded-lg space-y-2 mb-3">
                  <p className="text-[13px] font-semibold text-[#004417]">
                    <strong>Parcelado:</strong> {divida.pagamento_parcelado.numParcelas} parcelas de R${' '}
                    {divida.pagamento_parcelado.valorParcela.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {divida.pagamento_parcelado.primeiradata && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Primeira parcela: {formatDateBR(divida.pagamento_parcelado.primeiradata)}
                    </p>
                  )}
                </div>
              )}
              {((divida.pagamento_parcela?.valor ?? 0) > 0) && (
                <div className="bg-[rgba(0,68,23,0.02)] p-3 rounded-lg space-y-2 mb-3">
                  <p className="text-[13px] font-semibold text-[#004417]">
                    <strong>Parcela Única:</strong> R${' '}
                    {divida.pagamento_parcela.valor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {divida.pagamento_parcela.data && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Data: {formatDateBR(divida.pagamento_parcela.data)}
                    </p>
                  )}
                </div>
              )}
              {((divida.pagamento_producao?.quantidadeSacas ?? 0) > 0) && (
                <div className="bg-[rgba(0,68,23,0.02)] p-3 rounded-lg space-y-2">
                  <p className="text-[13px] font-semibold text-[#004417]">
                    <strong>Com Produção:</strong> {divida.pagamento_producao.quantidadeSacas} sacas de{' '}
                    {divida.pagamento_producao.produto}
                  </p>
                  {((divida.pagamento_producao?.precoPorSaca ?? 0) > 0) && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Preço: R$ {divida.pagamento_producao.precoPorSaca.toLocaleString('pt-BR')} / saca
                    </p>
                  )}
                  {divida.pagamento_producao.dataPeriodo && (
                    <p className="text-[13px] text-[rgba(0,68,23,0.75)]">
                      Período: {formatDateBR(divida.pagamento_producao.dataPeriodo)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Anexos */}
          {signedAnexos.length > 0 && (
            <div>
              <h3 className="text-[16px] font-bold text-[#004417] mb-3">Anexos</h3>
              <div className="grid grid-cols-3 gap-3">
                {signedAnexos.map((anexo, idx) => {
                  const path = originalPaths[idx] || '';
                  const name = path.split('/').pop()?.split('?')[0] || `anexo-${idx}`;
                  const ext = (name.split('.').pop() || '').toLowerCase();
                  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage({ url: anexo, path, index: idx })}
                      className="block cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {isImage ? (
                        <div className="w-20 h-14 overflow-hidden rounded">
                          <img src={anexo} alt={name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-14 flex items-center justify-center bg-[rgba(0,68,23,0.02)] rounded text-xs text-[#004417] px-2 text-center font-medium">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="border-t border-[rgba(0,68,23,0.08)] p-4 space-y-2">
          <button
            onClick={() => {
              onEdit(divida.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#00A651] hover:bg-[#008c44] text-white rounded-lg font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => {
              onLiquidar(divida.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-[#F7941F] rounded-lg font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Liquidar
          </button>
          <button
            onClick={() => {
              onDelete(divida.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[rgba(0,68,23,0.02)] hover:bg-[rgba(0,68,23,0.08)] text-[#004417] rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>

      {/* Modal de visualização de imagem/arquivo */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center max-w-4xl max-h-[70vh] w-full">
            {['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(
              (selectedImage.path.split('.').pop() || '').toLowerCase()
            ) ? (
              <img
                src={selectedImage.url}
                alt="Anexo"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <FileText className="w-16 h-16 text-[#004417] mx-auto mb-4" />
                <p className="text-[#004417] font-medium">
                  {selectedImage.path.split('/').pop()}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* Mobile: WhatsApp */}
            <button
              onClick={handleEnviarWhatsApp}
              disabled={isSendingWhatsApp}
              className="flex md:hidden items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <WhatsAppIcon />
                  Enviar WhatsApp
                </>
              )}
            </button>

            {/* Desktop: Download */}
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-[#004417] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </button>

            {/* Substituir */}
            <button
              onClick={handleReplaceImage}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Substituir
            </button>

            {/* Excluir */}
            <button
              onClick={handleDeleteImage}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </>
  );
}
