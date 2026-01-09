// src/services/attachmentProductService.ts
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthService } from './authService';

// Cliente com service role para operações de storage (contorna RLS)
// Em produção, usa o cliente principal com sessão do usuário
const url = import.meta.env.VITE_SUPABASE_URL;
const serviceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Criar cliente service role apenas se a chave existir
let supabaseServiceRole: ReturnType<typeof createClient> | null = null;
if (serviceRole && url) {
  supabaseServiceRole = createClient(url, serviceRole);
}

/**
 * Retorna o cliente de storage apropriado:
 * - Se houver service role key (dev), usa cliente com bypass de RLS
 * - Caso contrário (prod), usa cliente principal com sessão JWT do usuário
 */
function getStorageClient() {
  return supabaseServiceRole || supabase;
}

export type AttachmentFile = {
  url: string; // URL para exibição (pode ser blob URL)
  storageUrl?: string; // URL real do Supabase Storage (para envio externo)
  type: 'image' | 'pdf';
  name: string;
};

export class AttachmentProductService {
  private static readonly BUCKET_NAME = 'produtos';
  private static readonly IMAGE_FOLDER = 'imagens';
  private static readonly PDF_FOLDER = 'pdfs';

  /**
   * Obtém o user_id do usuário atual
   */
  private static getUserId(): string | null {
    return AuthService.getInstance().getCurrentUser()?.user_id || null;
  }

  /**
   * Gera o path do arquivo no formato: {user_id}/{folder}/{productId}.{ext}
   * Isso é necessário para as políticas RLS funcionarem corretamente
   */
  private static getFilePath(productId: string, ext: string = 'jpg', userId?: string): string {
    const folder = ext === 'pdf' ? this.PDF_FOLDER : this.IMAGE_FOLDER;
    const uid = userId || this.getUserId();
    if (!uid) {
      console.error('[AttachmentProductService] Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }
    return `${uid}/${folder}/${productId}.${ext}`;
  }

  /**
   * Gera o path legado (sem user_id) para buscar arquivos antigos
   */
  private static getLegacyFilePath(productId: string, ext: string = 'jpg'): string {
    const folder = ext === 'pdf' ? this.PDF_FOLDER : this.IMAGE_FOLDER;
    return `${folder}/${productId}.${ext}`;
  }

  /**
   * Valida tipo e tamanho do arquivo
   */
  static validateFile(file: File): string | null {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/svg+xml',
      'image/avif',
      'application/pdf',
      'application/xml',
      'text/xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Formato inválido. Suportados: imagens (JPG, PNG, WebP, GIF, BMP, SVG, AVIF), documentos (PDF, XML, DOC, DOCX, XLS, XLSX, CSV, TXT).';
    }
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 10MB.';
    }
    return null;
  }

  /**
   * Lista anexos (imagens e PDFs) de um produto
   */
  static async listAttachments(productId: string): Promise<AttachmentFile[]> {
    const results: AttachmentFile[] = [];

    // helper to obtain URLs for a path (returns { displayUrl, storageUrl })
    const resolveUrls = async (path: string): Promise<{ displayUrl: string | null; storageUrl: string | null }> => {
      try {
        let displayUrl: string | null = null;
        let storageUrl: string | null = null;

        console.log('[AttachmentProductService] Resolvendo URLs para:', path);

        // SEMPRE usa signed URL (não tenta URL pública)
        // Isso garante que funcione com serviços externos como n8n
        const server = import.meta.env.VITE_SIGNED_URL_SERVER_URL || import.meta.env.VITE_API_URL || '';
        console.log('[AttachmentProductService] Servidor de signed URL:', server);

        if (server) {
          try {
            const payload = { bucket: this.BUCKET_NAME, path, expires: 3600 };
            console.log('[AttachmentProductService] Requisitando signed URL com payload:', payload);

            const resp = await fetch(`${server.replace(/\/$/, '')}/signed-url`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            console.log('[AttachmentProductService] Resposta signed URL:', { status: resp.status, ok: resp.ok });

            if (resp.ok) {
              const data = await resp.json();
              console.log('[AttachmentProductService] Signed URL obtida:', data.signedUrl);

              if (data?.signedUrl) {
                displayUrl = data.signedUrl;
                storageUrl = data.signedUrl;
                return { displayUrl, storageUrl };
              }
            } else {
              const errorText = await resp.text();
              console.error('[AttachmentProductService] Erro na resposta signed URL:', errorText);
            }
          } catch (err) {
            console.error('[AttachmentProductService] Erro ao obter signed URL:', err);
          }
        } else {
          console.warn('[AttachmentProductService] VITE_SIGNED_URL_SERVER_URL ou VITE_API_URL não configurado');
        }

        // Fallback: usa createSignedUrl do Supabase diretamente
        console.log('[AttachmentProductService] Tentando createSignedUrl do Supabase...');
        try {
          const { data: signedData, error: signedError } = await getStorageClient().storage
            .from(this.BUCKET_NAME)
            .createSignedUrl(path, 3600);

          if (!signedError && signedData?.signedUrl) {
            console.log('[AttachmentProductService] Signed URL do Supabase obtida:', signedData.signedUrl);
            displayUrl = signedData.signedUrl;
            storageUrl = signedData.signedUrl;
            return { displayUrl, storageUrl };
          } else {
            console.error('[AttachmentProductService] Erro ao criar signed URL do Supabase:', signedError);
          }
        } catch (err) {
          console.error('[AttachmentProductService] Exceção ao criar signed URL:', err);
        }

        // Download fallback (blob URL para display apenas)
        console.log('[AttachmentProductService] Fallback: baixando arquivo para criar blob URL...');
        try {
          const { data: blobData, error: dlErr } = await getStorageClient().storage.from(this.BUCKET_NAME).download(path);
          if (!dlErr && blobData) {
            displayUrl = URL.createObjectURL(blobData);
            console.log('[AttachmentProductService] Blob URL criada para display:', displayUrl);
            // Tenta ainda obter storageUrl (pode não ter)
            storageUrl = await this.getStorageUrlOnly(path);
            console.log('[AttachmentProductService] storageUrl obtida:', storageUrl);
            return { displayUrl, storageUrl };
          } else {
            console.error('[AttachmentProductService] Erro no download:', dlErr);
          }
        } catch (err) {
          console.error('[AttachmentProductService] Erro no download fallback:', err);
        }

        console.warn('[AttachmentProductService] Nenhuma URL disponível para:', path);
        return { displayUrl: null, storageUrl: null };
      } catch (err) {
        console.error('[AttachmentProductService] Erro ao resolver URLs do attachment:', err);
        return { displayUrl: null, storageUrl: null };
      }
    };

    // Helper para tentar path novo e depois legado
    const tryResolveWithFallback = async (ext: 'jpg' | 'pdf'): Promise<{ urls: { displayUrl: string | null; storageUrl: string | null }; usedPath: string | null }> => {
      const userId = this.getUserId();
      
      // Tenta path novo primeiro (com user_id)
      if (userId) {
        try {
          const newPath = this.getFilePath(productId, ext, userId);
          console.log('[AttachmentProductService] Tentando path novo:', newPath);
          const urls = await resolveUrls(newPath);
          if (urls.displayUrl) {
            return { urls, usedPath: newPath };
          }
        } catch (e) {
          // Ignora erro e tenta legado
        }
      }
      
      // Fallback para path legado (sem user_id)
      const legacyPath = this.getLegacyFilePath(productId, ext);
      console.log('[AttachmentProductService] Tentando path legado:', legacyPath);
      const urls = await resolveUrls(legacyPath);
      if (urls.displayUrl) {
        return { urls, usedPath: legacyPath };
      }
      
      return { urls: { displayUrl: null, storageUrl: null }, usedPath: null };
    };

    // Imagem
    const imageResult = await tryResolveWithFallback('jpg');
    if (imageResult.urls.displayUrl) {
      results.push({
        url: imageResult.urls.displayUrl,
        storageUrl: imageResult.urls.storageUrl || undefined,
        type: 'image',
        name: `${productId}.jpg`
      });
    }

    // PDF
    const pdfResult = await tryResolveWithFallback('pdf');
    if (pdfResult.urls.displayUrl) {
      results.push({
        url: pdfResult.urls.displayUrl,
        storageUrl: pdfResult.urls.storageUrl || undefined,
        type: 'pdf',
        name: `${productId}.pdf`
      });
    }

    return results;
  }

  /**
   * Obtém apenas a URL de storage (não blob) para compartilhamento externo
   */
  private static async getStorageUrlOnly(path: string): Promise<string | null> {
    try {
      // Tenta signed URL do servidor edge function primeiro
      const server = import.meta.env.VITE_SIGNED_URL_SERVER_URL || import.meta.env.VITE_API_URL || '';
      if (server) {
        try {
          const resp = await fetch(`${server.replace(/\/$/, '')}/signed-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: this.BUCKET_NAME, path, expires: 3600 })
          });
          if (resp.ok) {
            const payload = await resp.json();
            if (payload?.signedUrl) {
              return payload.signedUrl;
            }
          }
        } catch (err) {
          console.error('[getStorageUrlOnly] Erro ao obter signed URL do servidor:', err);
        }
      }

      // Fallback: usa createSignedUrl do Supabase diretamente
      try {
        const { data: signedData, error: signedError } = await getStorageClient().storage
          .from(this.BUCKET_NAME)
          .createSignedUrl(path, 3600);

        if (!signedError && signedData?.signedUrl) {
          return signedData.signedUrl;
        }
      } catch (err) {
        console.error('[getStorageUrlOnly] Erro ao criar signed URL do Supabase:', err);
      }

      return null;
    } catch (err) {
      console.error('[getStorageUrlOnly] Erro ao obter storage URL:', err);
      return null;
    }
  }

  /**
   * Upload (imagem ou PDF)
   */
  static async uploadAttachment(productId: string, file: File): Promise<string | null> {
    try {
      console.log('⬆️ Upload de anexo para produto:', productId);

      const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
      const filePath = this.getFilePath(productId, ext);

      let processedFile = file;
      if (ext !== 'pdf') {
        processedFile = await this.processImageFile(file, `${productId}.jpg`);
      }

      const { error } = await getStorageClient().storage
        .from(this.BUCKET_NAME)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: ext === 'pdf' ? 'application/pdf' : 'image/jpeg',
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }

      console.log('✅ Upload concluído');
      return await this.getAttachmentUrl(productId, ext);
    } catch (error) {
      console.error('💥 Erro no upload:', error);
      throw error;
    }
  }

  /**
   * Substitui anexo existente
   */
  static async replaceAttachment(productId: string, file: File): Promise<string> {
    console.log('♻️ Substituindo anexo para produto:', productId);
    return this.uploadAttachment(productId, file);
  }

  /**
   * Download - tenta path novo primeiro, depois legado
   */
  static async downloadAttachment(productId: string, ext: 'jpg' | 'pdf' = 'jpg'): Promise<void> {
    try {
      console.log('⬇️ Download do anexo do produto:', productId);
      
      // Tenta path novo primeiro
      const userId = this.getUserId();
      let filePath = userId ? `${userId}/${ext === 'pdf' ? this.PDF_FOLDER : this.IMAGE_FOLDER}/${productId}.${ext}` : null;
      let data: Blob | null = null;
      let error: Error | null = null;

      if (filePath) {
        console.log('[Download] Tentando path novo:', filePath);
        const result = await getStorageClient()
          .storage
          .from(this.BUCKET_NAME)
          .download(filePath);
        
        if (!result.error && result.data) {
          data = result.data;
        } else {
          console.log('[Download] Path novo falhou, tentando legado...');
        }
      }

      // Fallback para path legado
      if (!data) {
        filePath = this.getLegacyFilePath(productId, ext);
        console.log('[Download] Tentando path legado:', filePath);
        const result = await getStorageClient()
          .storage
          .from(this.BUCKET_NAME)
          .download(filePath);
        
        if (result.error || !result.data) {
          throw result.error || new Error('Nenhum dado recebido no download');
        }
        data = result.data;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `produto_${productId}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Download concluído');
    } catch (error) {
      console.error('💥 Erro no download:', error);
      throw error;
    }
  }

  /**
   * Obtém URL pública
   */
  static async getAttachmentUrl(productId: string, ext: 'jpg' | 'pdf' = 'jpg'): Promise<string | null> {
    const path = this.getFilePath(productId, ext);
    try {
      const { data } = getStorageClient().storage.from(this.BUCKET_NAME).getPublicUrl(path);
      if (data?.publicUrl) {
        try {
          const head = await fetch(data.publicUrl, { method: 'HEAD', cache: 'no-cache' });
          if (head.ok) return `${data.publicUrl}`;
        } catch (err) {
          // continue
        }
      }

      // signed-url server
      const server = import.meta.env.VITE_SIGNED_URL_SERVER_URL || import.meta.env.VITE_API_URL || '';
      if (server) {
        try {
          const resp = await fetch(`${server.replace(/\/$/, '')}/signed-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: this.BUCKET_NAME, path, expires: 60 })
          });
          if (resp.ok) {
            const payload = await resp.json();
            if (payload?.signedUrl) return payload.signedUrl;
          }
        } catch (err) {
          // continue to download fallback
        }
      }

      // download fallback
      try {
        const { data: blobData, error: dlErr } = await getStorageClient().storage.from(this.BUCKET_NAME).download(path);
        if (!dlErr && blobData) {
          return URL.createObjectURL(blobData);
        }
      } catch (err) {
        // ignore
      }

      return null;
    } catch (error) {
      console.error('💥 Erro ao obter URL:', error);
      return null;
    }
  }

  /**
   * Exclui anexos (imagem e/ou pdf) - tenta paths novos e legados
   */
  static async deleteAttachment(productId: string): Promise<boolean> {
    try {
      console.log('🗑️ Excluindo anexos do produto:', productId);
      
      const userId = this.getUserId();
      const paths: string[] = [];
      
      // Adiciona paths novos se tiver userId
      if (userId) {
        paths.push(`${userId}/${this.IMAGE_FOLDER}/${productId}.jpg`);
        paths.push(`${userId}/${this.PDF_FOLDER}/${productId}.pdf`);
      }
      // Adiciona paths legados
      paths.push(this.getLegacyFilePath(productId, 'jpg'));
      paths.push(this.getLegacyFilePath(productId, 'pdf'));
      
      console.log('[DeleteAll] Tentando excluir paths:', paths);

      const { data, error } = await getStorageClient()
        .storage
        .from(this.BUCKET_NAME)
        .remove(paths);

      if (error) {
        console.error('❌ Erro na exclusão:', error);
        throw error;
      }

      console.log('[DeleteAll] Resultado do remove:', data);
      
      // Verifica se pelo menos um arquivo foi excluído
      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum arquivo foi excluído - verificando se arquivos ainda existem...');
        let filesStillExist = false;
        
        for (const path of paths) {
          try {
            const { data: checkData, error: checkError } = await getStorageClient()
              .storage
              .from(this.BUCKET_NAME)
              .download(path);
              
            // Se conseguiu baixar, o arquivo existe e a exclusão falhou
            if (checkData && !checkError) {
              console.error('❌ Arquivo ainda existe após tentativa de exclusão:', path);
              filesStillExist = true;
              break;
            }
          } catch (checkErr) {
            // Se deu erro, pode ser que o arquivo não existe (ok) ou erro de RLS
            const errMsg = checkErr instanceof Error ? checkErr.message : String(checkErr);
            console.log('[DeleteAll] Erro ao verificar arquivo:', path, errMsg);
          }
        }
        
        if (filesStillExist) {
          throw new Error('Falha na exclusão: alguns arquivos ainda existem. Verifique as permissões de RLS.');
        }
      }

      console.log('✅ Exclusão concluída com sucesso');
      return true;
    } catch (error) {
      console.error('💥 Erro na exclusão de anexo:', error);
      throw error;
    }
  }

  /**
   * Processa arquivo para JPG otimizado
   */
  private static async processImageFile(file: File, fileName: string): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const processedFile = new File([blob], fileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(processedFile);
            } else {
              reject(new Error('Erro ao processar imagem'));
            }
          }, 'image/jpeg', 0.9);
        } else {
          reject(new Error('Erro ao criar contexto do canvas'));
        }
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Exclui apenas um anexo (imagem ou pdf) - tenta path novo e legado
   */
  static async deleteSingleAttachment(productId: string, ext: 'jpg' | 'pdf'): Promise<boolean> {
    try {
      const userId = this.getUserId();
      const folder = ext === 'pdf' ? this.PDF_FOLDER : this.IMAGE_FOLDER;
      const pathsToTry: string[] = [];
      
      // Adiciona path novo se tiver userId
      if (userId) {
        pathsToTry.push(`${userId}/${folder}/${productId}.${ext}`);
      }
      // Adiciona path legado
      pathsToTry.push(this.getLegacyFilePath(productId, ext));
      
      console.log('[Delete] Tentando excluir paths:', pathsToTry);
      
      // Tenta excluir todos os paths possíveis
      const { data, error } = await getStorageClient()
        .storage
        .from(this.BUCKET_NAME)
        .remove(pathsToTry);
        
      if (error) {
        console.error('❌ Erro na exclusão:', error);
        throw error;
      }
      
      console.log('[Delete] Resultado do remove:', data);
      
      // Verifica se pelo menos um arquivo foi excluído
      // O Supabase retorna um array com os arquivos que foram excluídos
      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum arquivo foi excluído - pode ser problema de RLS ou arquivo não existe');
        
        // Tenta verificar se algum arquivo ainda existe
        let fileStillExists = false;
        for (const path of pathsToTry) {
          try {
            const { data: checkData, error: checkError } = await getStorageClient()
              .storage
              .from(this.BUCKET_NAME)
              .download(path);
            
            // Se conseguiu baixar, o arquivo existe e a exclusão falhou
            if (checkData && !checkError) {
              console.error('❌ Arquivo ainda existe após tentativa de exclusão:', path);
              fileStillExists = true;
              break;
            }
          } catch (checkErr) {
            // Se deu erro no download, pode ser que o arquivo não existe (ok) ou erro de RLS
            const errMsg = checkErr instanceof Error ? checkErr.message : String(checkErr);
            console.log('[Delete] Erro ao verificar arquivo:', path, errMsg);
            // Se o erro for "Object not found", o arquivo não existe (ok)
            if (!errMsg.includes('not found') && !errMsg.includes('404')) {
              // Pode ser erro de RLS ou outro problema
              console.warn('[Delete] Possível erro de permissão ao verificar:', path);
            }
          }
        }
        
        if (fileStillExists) {
          throw new Error('Falha na exclusão: arquivo ainda existe. Verifique as permissões de RLS no bucket produtos.');
        }
      }
      
      console.log('✅ Exclusão concluída com sucesso');
      return true;
    } catch (error) {
      console.error('💥 Erro na exclusão de anexo:', error);
      throw error;
    }
  }
}
