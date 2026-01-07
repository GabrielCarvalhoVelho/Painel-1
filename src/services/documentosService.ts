import { supabase } from '../lib/supabase';

export interface Documento {
  id: number;
  user_id: string;
  propriedade_id?: string;
  arquivo_url?: string;
  status?: string;
  tipo?: string;
  titulo?: string;
  safra?: string;
  tema?: string;
  observacao?: string;
  created_at?: string;
}

export interface DocumentoFormData {
  user_id: string;
  propriedade_id?: string;
  arquivo_url?: string;
  status?: string;
  tipo?: string;
  titulo?: string;
  safra?: string;
  tema?: string;
  observacao?: string;
}

const BUCKET_NAME = 'documentos';

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export class DocumentosService {
  static async getAll(userId: string, propriedadeId?: string): Promise<Documento[]> {
    try {
      console.log('[Documentos][Load] Carregando documentos do usuário:', userId);

      let query = supabase
        .from('documentos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (propriedadeId) {
        query = query.eq('propriedade_id', propriedadeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Documentos][Error] Erro ao buscar documentos:', error);
        return [];
      }

      console.log(`[Documentos][Load] ✓ ${data?.length || 0} documentos carregados`);
      return data || [];
    } catch (err) {
      console.error('[Documentos][Error] Erro inesperado ao buscar documentos:', err);
      return [];
    }
  }

  static async getById(id: number): Promise<Documento | null> {
    try {
      console.log('[Documentos][Load] Buscando documento ID:', id);

      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[Documentos][Error] Erro ao buscar documento:', error);
        return null;
      }

      console.log('[Documentos][Load] ✓ Documento encontrado');
      return data;
    } catch (err) {
      console.error('[Documentos][Error] Erro inesperado ao buscar documento:', err);
      return null;
    }
  }

  static async create(documento: DocumentoFormData): Promise<Documento | null> {
    try {
      console.log('[Documentos][Create] Criando registro no banco...', documento);

      const { data, error } = await supabase
        .from('documentos')
        .insert([documento])
        .select()
        .single();

      if (error) {
        console.error('[Documentos][Error] Erro ao criar documento:', error);
        throw new Error(error.message);
      }

      console.log('[Documentos][Create] ✓ Documento criado com sucesso:', data);
      return data;
    } catch (err) {
      console.error('[Documentos][Error] Erro ao criar documento:', err);
      throw err;
    }
  }

  static async update(id: number, dados: Partial<DocumentoFormData>): Promise<Documento | null> {
    try {
      console.log('[Documentos][Update] Atualizando documento ID:', id, dados);

      const { data, error } = await supabase
        .from('documentos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Documentos][Error] Erro ao atualizar documento:', error);
        throw new Error(error.message);
      }

      console.log('[Documentos][Update] ✓ Documento atualizado com sucesso');
      return data;
    } catch (err) {
      console.error('[Documentos][Error] Erro ao atualizar documento:', err);
      throw err;
    }
  }

  static async delete(id: number, fileUrl?: string): Promise<boolean> {
    try {
      console.log('[Documentos][Delete] Excluindo documento ID:', id);

      if (fileUrl) {
        await this.deleteFile(fileUrl);
      }

      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Documentos][Error] Erro ao excluir documento:', error);
        return false;
      }

      console.log('[Documentos][Delete] ✓ Documento excluído com sucesso');
      return true;
    } catch (err) {
      console.error('[Documentos][Error] Erro ao excluir documento:', err);
      return false;
    }
  }

  static async uploadFile(file: File, userId: string): Promise<string> {
    try {
      console.log('[Documentos][Upload] Iniciando upload:', file.name);

      const timestamp = Date.now();
      const sanitizedFileName = sanitizeFileName(file.name);
      const fileName = `${userId}/${timestamp}_${sanitizedFileName}`;

      console.log('[Documentos][Upload] Nome sanitizado:', fileName);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[Documentos][Error] Erro ao fazer upload:', error);
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      console.log('[Documentos][Upload] ✓ Arquivo enviado para storage:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('[Documentos][Error] Erro no upload:', err);
      throw err;
    }
  }

  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      console.log('[Documentos][Delete] Removendo arquivo do storage:', fileUrl);

      const filePath = fileUrl.split(`${BUCKET_NAME}/`)[1];
      if (!filePath) {
        console.warn('[Documentos][Warning] URL inválida, não foi possível extrair path');
        return false;
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('[Documentos][Error] Erro ao remover arquivo:', error);
        return false;
      }

      console.log('[Documentos][Delete] ✓ Arquivo removido do storage');
      return true;
    } catch (err) {
      console.error('[Documentos][Error] Erro ao remover arquivo:', err);
      return false;
    }
  }

  static async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const filePath = fileUrl.split(`${BUCKET_NAME}/`)[1];
      if (!filePath) {
        console.error('[Documentos][Error] URL inválida');
        return null;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('[Documentos][Error] Erro ao gerar URL assinada:', error);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error('[Documentos][Error] Erro ao gerar URL assinada:', err);
      return null;
    }
  }

  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  }

  static getFileSizeFormatted(sizeInBytes: number): string {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Envia documento para o WhatsApp do usuário via webhook n8n
   * @param documentoId - ID do documento no banco
   * @param telefone - Telefone do usuário em formato E.164 (ex: 5511999999999)
   * @returns Objeto com success, message e error
   */
  static async sendToWhatsApp(
    documentoId: number,
    telefone: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('[Documentos][WhatsApp] Iniciando envio do documento:', documentoId);

      const documento = await this.getById(documentoId);
      if (!documento?.arquivo_url) {
        return { success: false, error: 'Documento sem arquivo anexado' };
      }

      // Gera URL assinada válida por 1 hora
      const signedUrl = await this.getSignedUrl(documento.arquivo_url, 3600);
      if (!signedUrl) {
        return { success: false, error: 'Falha ao gerar URL do arquivo' };
      }

      // Em desenvolvimento, usa proxy do Vite para contornar CORS
      // Em produção, usa URL direta do webhook
      const isDev = import.meta.env.MODE === 'development' || 
                    (typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
      
      let webhookUrl: string;
      if (isDev) {
        // Proxy configurado no vite.config.ts: /api/whatsapp → https://zedasafra.app.n8n.cloud/webhook
        webhookUrl = '/api/whatsapp/enviar-documento-whatsapp';
      } else {
        webhookUrl = import.meta.env.VITE_WHATSAPP_WEBHOOK_URL;
        if (!webhookUrl) {
          console.error('[Documentos][WhatsApp] VITE_WHATSAPP_WEBHOOK_URL não configurada');
          return { success: false, error: 'Serviço de WhatsApp não configurado' };
        }
      }

      // Extrai informações do arquivo
      const fileName = documento.arquivo_url.split('/').pop() || 'documento';
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);

      const payload = {
        telefone: telefone.replace(/\D/g, ''),
        arquivo_url: signedUrl,
        titulo: documento.titulo || 'Documento',
        tipo_arquivo: isImage ? 'image' : 'document',
        mime_type: isImage ? `image/${extension === 'jpg' ? 'jpeg' : extension}` : 'application/octet-stream',
        nome_arquivo: fileName
      };

      console.log('[Documentos][WhatsApp] Chamando webhook:', webhookUrl);
      console.log('[Documentos][WhatsApp] Payload:', JSON.stringify(payload, null, 2));

      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('[Documentos][WhatsApp] Response status:', resp.status, resp.statusText);
      
      const responseText = await resp.text();
      console.log('[Documentos][WhatsApp] Response body (raw):', responseText);
      
      let json: any = {};
      try {
        json = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        console.error('[Documentos][WhatsApp] Erro ao parsear JSON:', parseErr);
        console.log('[Documentos][WhatsApp] Response não é JSON válido');
      }

      if (resp.ok && json?.success) {
        console.log('[Documentos][WhatsApp] ✓ Documento enviado com sucesso');
        return { success: true, message: 'Documento enviado para seu WhatsApp!' };
      }

      console.error('[Documentos][WhatsApp] Falha no webhook:');
      console.error('  - Status:', resp.status, resp.statusText);
      console.error('  - Response:', json);
      console.error('  - resp.ok:', resp.ok);
      console.error('  - json.success:', json?.success);
      
      // Se o status for 2xx mas não tiver success:true, pode ser que o n8n retornou algo diferente
      if (resp.ok) {
        console.warn('[Documentos][WhatsApp] Webhook retornou 2xx mas sem success:true. Verificar formato de resposta do n8n.');
      }
      
      return { success: false, error: json?.error || json?.message || `Erro ${resp.status}: ${resp.statusText}` };
    } catch (err) {
      console.error('[Documentos][WhatsApp] Erro:', err);
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  }
}
