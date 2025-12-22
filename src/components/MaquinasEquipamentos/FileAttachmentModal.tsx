import { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  Trash2,
  Paperclip,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  FileCode,
  Table,
  File
} from 'lucide-react';
import { AttachmentService } from '../../services/attachmentService';

const attachmentService = new AttachmentService();

interface FileAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  maquinaId: string;
  maquinaDescription: string;
}

interface FileSlot {
  id: 'primeiro_envio' | 'segundo_envio';
  label: string;
  hasFile: boolean;
  url: string | null;
  fileType: string | null;
  fileName?: string | null;
}

interface ConfirmState {
  type: 'delete' | 'replace' | null;
  slotId?: 'primeiro_envio' | 'segundo_envio';
  onConfirm?: () => void;
}

export default function FileAttachmentModal({
  isOpen,
  onClose,
  maquinaId,
  maquinaDescription
}: FileAttachmentModalProps) {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    type: null
  });
  const [fileSlots, setFileSlots] = useState<FileSlot[]>([
    { id: 'primeiro_envio', label: 'Primeiro Anexo', hasFile: false, url: null, fileType: null, fileName: null },
    { id: 'segundo_envio', label: 'Segundo Anexo', hasFile: false, url: null, fileType: null, fileName: null }
  ]);
  const [loading, setLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMap, setPreviewMap] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      checkAttachments();
    }
  }, [isOpen, maquinaId]);

  const checkAttachments = async () => {
    try {
      setLoading(true);
      const attachmentInfo = await attachmentService.getAttachmentInfo(maquinaId);
      
      if (attachmentInfo) {
        // resolver URLs armazenadas (path) para URLs utilizáveis
        const primeiro = attachmentInfo.hasPrimeiroEnvio
          ? await attachmentService.getFileUrl(maquinaId, 'primeiro_envio')
          : null;
        const segundo = attachmentInfo.hasSegundoEnvio
          ? await attachmentService.getFileUrl(maquinaId, 'segundo_envio')
          : null;

        setFileSlots([
          {
            id: 'primeiro_envio',
            label: 'Primeiro Anexo',
            hasFile: attachmentInfo.hasPrimeiroEnvio || false,
            url: primeiro,
            fileType: attachmentInfo.primeiroEnvioType || null,
            fileName: getFileNameFromUrl(primeiro || attachmentInfo.url_primeiro_envio || null)
          },
          {
            id: 'segundo_envio',
            label: 'Segundo Anexo',
            hasFile: attachmentInfo.hasSegundoEnvio || false,
            url: segundo,
            fileType: attachmentInfo.segundoEnvioType || null,
            fileName: getFileNameFromUrl(segundo || attachmentInfo.url_segundo_envio || null)
          }
        ]);

        // gerar previews (miniaturas) para PDFs e imagens não públicas
        try {
          const map: Record<string, string | null> = {};
          const slots = [
            { id: 'primeiro_envio', url: primeiro, fileType: attachmentInfo.primeiroEnvioType },
            { id: 'segundo_envio', url: segundo, fileType: attachmentInfo.segundoEnvioType }
          ];

          for (const s of slots) {
            if (!s.url) { map[s.id] = null; continue; }
            const isPdf = (s.fileType === 'pdf') || (s.url.toLowerCase().endsWith('.pdf'));
            const isImage = s.fileType ? s.fileType.startsWith('image/') : /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/.test(s.url.toLowerCase());

            if (isImage) {
              // imagens já são exibidas diretamente via URL; não precisamos baixar
              map[s.id] = null;
            } else if (isPdf) {
              try {
                const res = await attachmentService.downloadFile(s.url);
                if (!res.error && res.data) {
                  const blobUrl = URL.createObjectURL(res.data as unknown as Blob);
                  map[s.id] = blobUrl;
                } else {
                  map[s.id] = null;
                }
              } catch (err) {
                map[s.id] = null;
              }
            } else {
              map[s.id] = null;
            }
          }

          setPreviewMap(prev => {
            // revogar antigos URLs que serão substituídos
            for (const k of Object.keys(prev)) {
              if (prev[k] && map[k] && prev[k] !== map[k]) URL.revokeObjectURL(prev[k]!);
              if (prev[k] && !map[k]) URL.revokeObjectURL(prev[k]!);
            }
            return map;
          });
        } catch (err) {
          console.warn('Erro ao gerar previews:', err);
        }
      } else {
        setFileSlots([
          { id: 'primeiro_envio', label: 'Primeiro Anexo', hasFile: false, url: null, fileType: null, fileName: null },
          { id: 'segundo_envio', label: 'Segundo Anexo', hasFile: false, url: null, fileType: null, fileName: null }
        ]);
      }
    } catch (error) {
      console.error('Erro ao verificar anexos:', error);
      setMessage({ type: 'error', text: 'Erro ao verificar anexos' });
    } finally {
      setLoading(false);
    }
  };

  // limpar object URLs quando o componente desmontar
  useEffect(() => {
    return () => {
      for (const k of Object.keys(previewMap)) {
        const v = previewMap[k];
        if (v) URL.revokeObjectURL(v);
      }
    };
  }, [previewMap]);

  const getFileNameFromUrl = (url: string | null): string | null => {
    if (!url) return null;
    try {
      const urlWithoutParams = url.split('?')[0];
      const parts = urlWithoutParams.split('/');
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  };

  const buildImageSrc = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('blob:')) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${Date.now()}`;
  };

  const isImageFile = (fileType: string | null) => {
    if (!fileType) return false;
    return fileType.startsWith('image/') ||
           ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(fileType.toLowerCase());
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    const type = fileType.toLowerCase();

    if (['pdf'].includes(type)) return FileText;
    if (['xml'].includes(type)) return FileCode;
    if (['xls', 'xlsx', 'csv'].includes(type)) return Table;
    if (['doc', 'docx', 'txt'].includes(type)) return FileText;

    return File;
  };

  const getFileTypeLabel = (fileType: string | null) => {
    if (!fileType) return 'Arquivo anexado';
    const type = fileType.toLowerCase();

    if (type === 'pdf') return 'PDF anexado';
    if (type === 'xml') return 'XML anexado';
    if (['xls', 'xlsx'].includes(type)) return 'Planilha Excel anexada';
    if (type === 'csv') return 'CSV anexado';
    if (['doc', 'docx'].includes(type)) return 'Documento Word anexado';
    if (type === 'txt') return 'Arquivo de texto anexado';

    return 'Arquivo anexado';
  };

  const getFileIconColor = (fileType: string | null) => {
    if (!fileType) return 'text-[#00A651]';
    const type = fileType.toLowerCase();

    if (type === 'pdf') return 'text-red-600';
    if (type === 'xml') return 'text-purple-600';
    if (['xls', 'xlsx', 'csv'].includes(type)) return 'text-green-600';
    if (['doc', 'docx'].includes(type)) return 'text-blue-600';
    if (type === 'txt') return 'text-[#00A651]';

    return 'text-[#00A651]';
  };

  const handleDownload = async (slot: FileSlot) => {
    try {
      setLoading(true);
      setMessage(null);

      if (!slot.url) {
        throw new Error('URL do arquivo não encontrada');
      }

      const result = await attachmentService.downloadFile(slot.url);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('Nenhum dado recebido do servidor');
      }

      if (result.data && result.fileType) {
        const tempUrl = URL.createObjectURL(result.data);

        let extension = 'bin';
        if (result.fileType === 'xml') extension = 'xml';
        else if (result.fileType === 'jpg' || result.fileType === 'jpeg') extension = 'jpg';
        else if (result.fileType === 'pdf') extension = 'pdf';
        else if (result.fileType === 'png') extension = 'png';
        else if (result.fileType === 'webp') extension = 'webp';

        const safeLabel = (slot.id || 'arquivo').toLowerCase().replace(/[^a-z0-9]/g, '_');
        const link = document.createElement('a');
        link.href = tempUrl;
        link.download = `${safeLabel}_${maquinaId}_${Date.now()}.${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(tempUrl);
        setMessage({ type: 'success', text: 'Download iniciado com sucesso!' });
      } else {
        throw new Error('Dados inválidos retornados do servidor');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao fazer download'
      });
    } finally {
      setLoading(false);
    }
  };

  const openFileExplorer = (slotId: 'primeiro_envio' | 'segundo_envio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml,.jpg,.jpeg,.pdf,.png,.webp,.gif,.bmp,.svg,.avif,.doc,.docx,.xls,.xlsx,.csv,.txt,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,application/xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain';
    input.onchange = (e) => handleFileChange(e as any, slotId);
    input.click();
  };

  const handleFileSelect = (slotId: 'primeiro_envio' | 'segundo_envio', isReplace = false) => {
    const currentSlot = fileSlots.find(slot => slot.id === slotId);

    if (isReplace && currentSlot?.hasFile) {
      setConfirmState({
        type: 'replace',
        slotId,
        onConfirm: () => {
          setConfirmState({ type: null });
          openFileExplorer(slotId);
        }
      });
    } else {
      openFileExplorer(slotId);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, slotId: 'primeiro_envio' | 'segundo_envio') => {
    const file = event.target.files?.[0];
    if (!file || !slotId) return;

    try {
      setUploadingSlot(slotId);
      setMessage(null);

      const currentSlot = fileSlots.find(slot => slot.id === slotId);
      const isReplacement = currentSlot?.hasFile || false;

      const result = await attachmentService.uploadFile(
        maquinaId,
        file,
        slotId,
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Arquivo ${isReplacement ? 'substituído' : 'enviado'} com sucesso!`
        });
        await checkAttachments();
      } else {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao processar arquivo'
      });
    } finally {
      setUploadingSlot(null);
      event.target.value = '';
    }
  };

  const handleDelete = (slot: FileSlot) => {
    if (!slot.url) {
      setMessage({ type: 'error', text: 'URL do arquivo não encontrada para exclusão.' });
      return;
    }

    setConfirmState({
      type: 'delete',
      slotId: slot.id,
      onConfirm: async () => {
        setConfirmState({ type: null });
        try {
          setLoading(true);
          setMessage(null);
          
          const result = await attachmentService.deleteFile(slot.url!, maquinaId, slot.id);

          if (result.success) {
            setMessage({ type: 'success', text: 'Arquivo excluído com sucesso!' });
            await checkAttachments();
          } else {
            throw new Error(result.error || 'Erro ao excluir arquivo');
          }
        } catch (error) {
          setMessage({
            type: 'error',
            text: error instanceof Error ? error.message : 'Erro ao excluir arquivo'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      {/* Modal de confirmação customizado */}
      {confirmState.type && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/50">
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,68,23,0.16)] max-w-md w-full p-6 flex flex-col items-center mx-4">
            <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-[#DC2626]" />
            </div>
            <p className="text-[15px] text-center mb-6 text-[#004417] font-medium leading-relaxed">
              Atenção: ao confirmar, o arquivo{confirmState.type === 'replace' ? ' atual' : ''} será excluído de forma definitiva do Painel da Fazenda e do nosso banco de dados. Deseja continuar?
            </p>
            <div className="flex gap-3 w-full">
              <button
                className="flex-1 h-[48px] px-4 rounded-xl bg-[rgba(0,68,23,0.05)] text-[#004417] font-semibold hover:bg-[rgba(0,68,23,0.1)] active:scale-[0.98] transition-all"
                onClick={() => setConfirmState({ type: null })}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="flex-1 h-[48px] px-4 rounded-xl bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] active:scale-[0.98] transition-all"
                onClick={confirmState.onConfirm}
                disabled={loading}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,68,23,0.08)] max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F5FDF8] rounded-xl flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-[#00A651]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#004417]">Gerenciar Anexos</h3>
              <p className="text-[13px] text-[#00441799] truncate max-w-64">{maquinaDescription}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#00441766] hover:text-[#004417] hover:bg-[rgba(0,166,81,0.04)] rounded-lg transition-all"
            disabled={loading || uploadingSlot !== null}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-[#F0FDF4] border border-[#86EFAC]'
              : 'bg-[#FEF2F2] border border-[#FCA5A5]'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />
            )}
            <span className={`text-[14px] font-medium ${
              message.type === 'success' ? 'text-[#16A34A]' : 'text-[#DC2626]'
            }`}>
              {message.text}
            </span>
          </div>
        )}

        {/* Área de anexos */}
        <div className="space-y-4">
          {fileSlots.map((slot) => (
            <div key={slot.id} className="p-4 rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,68,23,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[15px] text-[#004417]">{slot.label}</h4>
                <div className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                  slot.hasFile
                    ? 'bg-[rgba(205,219,42,0.12)] text-[#004417]'
                    : 'bg-[#F5FDF8] text-[#00441799]'
                }`}>
                  {slot.hasFile ? 'Arquivo anexado' : 'Nenhum arquivo'}
                </div>
              </div>

              {/* Botões de ação quando NÃO tem arquivo */}
              {!slot.hasFile && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F5FDF8] rounded-[10px] flex items-center justify-center">
                        <Upload className="w-5 h-5 text-[#00A651]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#004417]">Nenhum arquivo</p>
                        <p className="text-[13px] text-[#00441799]">Clique em anexar para enviar um arquivo</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFileSelect(slot.id)}
                      className="h-[40px] bg-[#00A651] text-white rounded-[10px] font-bold px-4 hover:bg-[#004417] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={uploadingSlot !== null}
                    >
                      {uploadingSlot === slot.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span>Anexar</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview e controles quando TEM arquivo */}
              {slot.hasFile && slot.url && (
                <div className="flex flex-col items-center gap-3">
                  {/* Preview do arquivo */}
                  <div className="mb-2 w-full">
                    {(() => {
                      const isImage = isImageFile(slot.fileType);
                      if (isImage) {
                        return (
                          <img
                            src={buildImageSrc(slot.url)}
                            alt={slot.label}
                            className="max-h-40 mx-auto rounded-xl shadow-[0_1px_3px_rgba(0,68,23,0.04)]"
                          />
                        );
                      }

                      // Mostrar miniatura para PDF se disponível
                      if (slot.fileType === 'pdf' || (slot.url && slot.url.toLowerCase().endsWith('.pdf'))) {
                        const preview = previewMap[slot.id];
                        if (preview) {
                          return (
                            <object
                              data={preview}
                              type="application/pdf"
                              className="max-h-40 mx-auto w-full rounded-xl border"
                            >
                              <div className="p-4 text-center">Visualização em PDF indisponível</div>
                            </object>
                          );
                        }
                        // sem preview, cair para ícone
                      }

                      const FileIcon = getFileIcon(slot.fileType);
                      const iconColor = getFileIconColor(slot.fileType);
                      const fileLabel = getFileTypeLabel(slot.fileType);

                      return (
                        <div className="flex flex-col items-center justify-center gap-3 py-6 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,68,23,0.04)]">
                          <div className={iconColor}>
                            <FileIcon className="w-14 h-14 text-[#00A651]" />
                          </div>
                          <div className="text-center">
                            <p className="text-[14px] font-bold text-[#004417]">
                              {fileLabel}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Botão Download */}
                  <div className="flex gap-2 mb-1 w-full">
                    <button
                      className="flex-1 h-[44px] bg-white text-[#004417] px-4 rounded-[10px] font-semibold border border-[#00A65133] hover:bg-[rgba(0,166,81,0.04)] active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
                      onClick={() => handleDownload(slot)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5 text-[#00A651]" />
                      )}
                      Download
                    </button>
                  </div>

                  {/* Botões Substituir e Excluir */}
                  <div className="flex gap-2 w-full">
                    <button
                      className="flex-1 h-[44px] bg-white text-[#004417] px-4 rounded-[10px] font-semibold border border-[#00A65133] hover:bg-[rgba(0,166,81,0.04)] active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
                      onClick={() => handleFileSelect(slot.id, true)}
                      disabled={uploadingSlot !== null}
                    >
                      {uploadingSlot === slot.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-[#00A651]" />
                      )}
                      Substituir
                    </button>
                    <button
                      className="flex-1 h-[44px] bg-white text-[#DC2626] px-4 rounded-[10px] font-semibold border border-[#FCA5A5] hover:bg-[#FEF2F2] active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
                      onClick={() => handleDelete(slot)}
                      disabled={loading}
                    >
                      <Trash2 className="w-5 h-5" /> Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
