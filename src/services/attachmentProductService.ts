// src/services/attachmentProductService.ts
import { createClient } from '@supabase/supabase-js';

// Cliente com service role (contorna RLS para Storage)
// Em produção, usa anon key (requer políticas RLS corretas no Storage)
const url = import.meta.env.VITE_SUPABASE_URL;
const serviceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storageKey = serviceRole || anonKey;

if (!url || !storageKey) {
  throw new Error('Supabase configuration missing for attachmentProductService');
}

const supabaseServiceRole = createClient(url, storageKey);

export type AttachmentFile = {
  url: string;
  type: 'image' | 'pdf';
  name: string;
};

export class AttachmentProductService {
  private static readonly BUCKET_NAME = 'produtos';
  private static readonly IMAGE_FOLDER = 'imagens';
  private static readonly PDF_FOLDER = 'pdfs';

  private static getFilePath(productId: string, ext: string = 'jpg'): string {
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

    // helper to obtain a usable URL for a path (public, signed or blob)
    const resolveUrl = async (path: string) => {
      try {
        // try public url
        const { data } = supabaseServiceRole.storage.from(this.BUCKET_NAME).getPublicUrl(path);
        if (data?.publicUrl) {
          try {
            const head = await fetch(data.publicUrl, { method: 'HEAD', cache: 'no-cache' });
            if (head.ok) return `${data.publicUrl}`;
          } catch (err) {
            // fallthrough to signed URL
          }
        }

        // try signed URL from server
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
          const { data: blobData, error: dlErr } = await supabaseServiceRole.storage.from(this.BUCKET_NAME).download(path);
          if (!dlErr && blobData) {
            return URL.createObjectURL(blobData);
          }
        } catch (err) {
          // nothing
        }

        return null;
      } catch (err) {
        console.error('Erro ao resolver URL do attachment:', err);
        return null;
      }
    };

    // Imagem
    const imagePath = this.getFilePath(productId, 'jpg');
    const imageUrl = await resolveUrl(imagePath);
    if (imageUrl) {
      results.push({ url: imageUrl, type: 'image', name: `${productId}.jpg` });
    }

    // PDF
    const pdfPath = this.getFilePath(productId, 'pdf');
    const pdfUrl = await resolveUrl(pdfPath);
    if (pdfUrl) {
      results.push({ url: pdfUrl, type: 'pdf', name: `${productId}.pdf` });
    }

    return results;
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

      const { error } = await supabaseServiceRole.storage
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
   * Download
   */
  static async downloadAttachment(productId: string, ext: 'jpg' | 'pdf' = 'jpg'): Promise<void> {
    try {
      console.log('⬇️ Download do anexo do produto:', productId);
      const filePath = this.getFilePath(productId, ext);

      const { data, error } = await supabaseServiceRole
        .storage
        .from(this.BUCKET_NAME)
        .download(filePath);

      if (error || !data) {
        throw error || new Error('Nenhum dado recebido no download');
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
      const { data } = supabaseServiceRole.storage.from(this.BUCKET_NAME).getPublicUrl(path);
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
        const { data: blobData, error: dlErr } = await supabaseServiceRole.storage.from(this.BUCKET_NAME).download(path);
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
   * Exclui anexos (imagem e/ou pdf)
   */
  static async deleteAttachment(productId: string): Promise<boolean> {
    try {
      console.log('🗑️ Excluindo anexos do produto:', productId);
      const paths = [
        this.getFilePath(productId, 'jpg'),
        this.getFilePath(productId, 'pdf'),
      ];

      const { error } = await supabaseServiceRole
        .storage
        .from(this.BUCKET_NAME)
        .remove(paths);

      if (error) {
        console.error('❌ Erro na exclusão:', error);
        throw error;
      }

      console.log('✅ Exclusão concluída');
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
   * Exclui apenas um anexo (imagem ou pdf)
   */
  static async deleteSingleAttachment(productId: string, ext: 'jpg' | 'pdf'): Promise<boolean> {
    try {
      const filePath = this.getFilePath(productId, ext);
      const { error } = await supabaseServiceRole
        .storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);
      if (error) {
        console.error('❌ Erro na exclusão:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('💥 Erro na exclusão de anexo:', error);
      throw error;
    }
  }
}
