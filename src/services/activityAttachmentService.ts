import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from './authService';

// Cliente com service role para operações de storage (contorna RLS)
// Em produção, usa anon key (requer políticas RLS corretas no Storage)
const url = import.meta.env.VITE_SUPABASE_URL;
const serviceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storageKey = serviceRole || anonKey;

if (!url || !storageKey) {
  throw new Error('Supabase configuration missing for activityAttachmentService');
}

const supabaseServiceRole = createClient(url, storageKey);

/**
 * Service de anexos agora trabalha somente com Supabase Storage.
 * Não armazenamos mais URLs no banco. Os arquivos usam o mesmo id da atividade
 * como nome do arquivo (ex: <atividade_id>.jpg, <atividade_id>.pdf).
 */
export class ActivityAttachmentService {
  private static readonly BUCKET_NAME = 'atividades_agricolas';
  private static readonly IMAGE_FOLDER = 'imagens';
  private static readonly FILE_FOLDER = 'arquivos';

  static async hasAttachment(activityId: string): Promise<boolean> {
    try {
      console.log('🔍 Verificando anexo de imagem para atividade:', activityId);

      const fileName = `${activityId}.jpg`;

      let { data, error } = await supabaseServiceRole.storage
        .from(this.BUCKET_NAME)
        .list(this.IMAGE_FOLDER, {
          limit: 1000,
          search: activityId
        });

      if (error) {
        console.log('⚠️ Erro com service role, tentando cliente normal...');
        const result = await supabase.storage
          .from(this.BUCKET_NAME)
          .list(this.IMAGE_FOLDER, {
            limit: 1000,
            search: activityId
          });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Erro ao listar arquivos:', error);
        return await this.checkFileExistsByUrl(activityId, false);
      }

      const hasFile = data && data.some(file => file.name === fileName);
      console.log('📁 Resultado da busca:', { encontrado: hasFile, nomeProcurado: fileName, pasta: this.IMAGE_FOLDER });

      return hasFile || await this.checkFileExistsByUrl(activityId, false);
    } catch (error) {
      console.error('💥 Erro ao verificar anexo:', error);
      return false;
    }
  }

  static async hasFileAttachment(activityId: string): Promise<boolean> {
    try {
      console.log('🔍 Verificando arquivo para atividade:', activityId);

      let { data, error } = await supabaseServiceRole.storage
        .from(this.BUCKET_NAME)
        .list(this.FILE_FOLDER, {
          limit: 1000,
          search: activityId
        });

      if (error) {
        console.log('⚠️ Erro com service role, tentando cliente normal...');
        const result = await supabase.storage
          .from(this.BUCKET_NAME)
          .list(this.FILE_FOLDER, {
            limit: 1000,
            search: activityId
          });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Erro ao listar arquivos:', error);
        return await this.checkFileExistsByUrl(activityId, true);
      }

      const extensions = ['pdf','xml','xls','xlsx','doc','docx','csv','txt'];
      const hasFile = data && data.some(file =>
        extensions.some(ext => file.name === `${activityId}.${ext}`)
      );

      return hasFile || await this.checkFileExistsByUrl(activityId, true);
    } catch (error) {
      console.error('💥 Erro ao verificar arquivo:', error);
      return false;
    }
  }

  private static async checkFileExistsByUrl(activityId: string, isFile: boolean = false): Promise<boolean> {
    try {
  const extensions = isFile ? ['pdf','xml','xls','xlsx','doc','docx','csv','txt'] : ['jpg'];

      for (const ext of extensions) {
        const folder = isFile ? this.FILE_FOLDER : this.IMAGE_FOLDER;
        const fileName = `${folder}/${activityId}.${ext}`;

        const { data } = supabaseServiceRole.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(fileName);

        if (!data?.publicUrl) continue;

        const response = await fetch(data.publicUrl, { method: 'HEAD', cache: 'no-cache' });

        if (response.ok) {
          console.log(`✅ ${isFile ? 'Arquivo' : 'Imagem'} encontrado: ${fileName}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('💥 Erro na verificação por URL:', error);
      return false;
    }
  }

  static async getAttachmentUrl(activityId: string, forceRefresh = false): Promise<{ displayUrl: string; storageUrl: string | null } | null> {
    try {
      console.log('🔗 Obtendo URL da imagem:', activityId, forceRefresh ? '(refresh forçado)' : '');

      const fileName = `${this.IMAGE_FOLDER}/${activityId}.jpg`;

      let { data } = supabaseServiceRole.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

      if (!data?.publicUrl) {
        console.log('⚠️ Tentando URL pública com cliente normal...');
        const result = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);
        data = result.data;
      }

      // Se houver URL pública, confirma com HEAD e retorna
      if (data?.publicUrl) {
        const cleanUrl = data.publicUrl.split('?')[0];
        try {
          const headResp = await fetch(cleanUrl, { method: 'HEAD', cache: 'no-cache' });
          if (!headResp.ok) {
            console.log('⚠️ HEAD retornou não-ok para imagem:', headResp.status, cleanUrl);
            // cairá para tentativa de signed URL abaixo
          } else {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const urlWithTimestamp = `${cleanUrl}?v=${timestamp}&r=${random}`;
            console.log('📎 URL gerada do storage (verificada):', urlWithTimestamp);
            return { displayUrl: urlWithTimestamp, storageUrl: cleanUrl };
          }
        } catch (err) {
          console.log('⚠️ Erro ao checar existência da imagem via HEAD:', err);
          // tentar signed URL abaixo
        }
      }

      // Se não há public URL ou HEAD falhou, pedir signed URL ao backend
      try {
        const server = import.meta.env.VITE_SIGNED_URL_SERVER_URL || import.meta.env.VITE_API_URL || '';
        if (server) {
          const resp = await fetch(`${server.replace(/\/$/, '')}/signed-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: this.BUCKET_NAME, path: fileName, expires: 60 })
          });
          if (resp.ok) {
            const payload = await resp.json();
            if (payload?.signedUrl) {
              console.log('🔐 Obtido signedUrl do servidor para imagem');
              return { displayUrl: payload.signedUrl, storageUrl: payload.signedUrl };
            }
          } else {
            console.log('⚠️ Signed-url server retornou erro', resp.status);
          }
        } else {
          console.log('⚠️ VITE_SIGNED_URL_SERVER_URL não configurado, não foi possível solicitar signed URL');
        }
      } catch (err) {
        console.error('💥 Erro ao solicitar signed URL ao servidor:', err);
      }

      console.log('❌ Não foi possível obter URL pública nem signed URL para a imagem');
      // Fallback: tentar baixar o blob diretamente com o cliente (se a policy permitir)
      try {
        const { data: blobData, error: dlErr } = await supabase.storage
          .from(this.BUCKET_NAME)
          .download(fileName);

        if (!dlErr && blobData) {
          const url = URL.createObjectURL(blobData);
          console.log('📦 Obtido blob URL via download fallback para imagem');
          // Tenta obter a public URL mesmo que não esteja acessível, para uso futuro
          const { data: publicData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);
          const storageUrl = publicData?.publicUrl?.split('?')[0] || null;
          return { displayUrl: url, storageUrl };
        }
      } catch (err) {
        console.log('⚠️ Falha no download fallback da imagem:', err);
      }

      return null;
    } catch (error) {
      console.error('💥 Erro ao obter URL da imagem:', error);
      return null;
    }
  }

  static async getFileAttachmentUrl(activityId: string, forceRefresh = false): Promise<string | null> {
    try {
      console.log('🔗 Obtendo URL do arquivo:', activityId, forceRefresh ? '(refresh forçado)' : '');

  const extensions = ['pdf','xml','xls','xlsx','doc','docx','csv','txt'];

      for (const ext of extensions) {
        const fileName = `${this.FILE_FOLDER}/${activityId}.${ext}`;

        let { data } = supabaseServiceRole.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

        if (!data?.publicUrl) {
          console.log('⚠️ Tentando URL pública com cliente normal...');
          const result = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);
          data = result.data;
        }

        if (data?.publicUrl) {
          try {
            const response = await fetch(data.publicUrl, { method: 'HEAD', cache: 'no-cache' });
            if (response.ok) {
              const cleanUrl = data.publicUrl.split('?')[0];
              const timestamp = Date.now();
              const random = Math.random().toString(36).substring(7);
              const urlWithTimestamp = `${cleanUrl}?v=${timestamp}&r=${random}`;
              console.log('📎 URL gerada do storage:', urlWithTimestamp);
              return urlWithTimestamp;
            }
            // se HEAD falhar, tentar signed URL abaixo
          } catch (err) {
            // continuar para tentativa de signed URL
          }
        }

        // tentar signed URL pelo servidor
        try {
          const server = import.meta.env.VITE_SIGNED_URL_SERVER_URL || import.meta.env.VITE_API_URL || '';
          if (server) {
            const resp = await fetch(`${server.replace(/\/$/, '')}/signed-url`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bucket: this.BUCKET_NAME, path: fileName, expires: 60 })
            });
            if (resp.ok) {
              const payload = await resp.json();
              if (payload?.signedUrl) {
                console.log('🔐 Obtido signedUrl do servidor para arquivo');
                return payload.signedUrl;
              }
            } else {
              console.log('⚠️ Signed-url server retornou erro', resp.status);
            }
          } else {
            console.log('⚠️ VITE_SIGNED_URL_SERVER_URL não configurado, não foi possível solicitar signed URL');
          }
        } catch (err) {
          console.error('💥 Erro ao solicitar signed URL ao servidor:', err);
        }

        // Fallback: tentar baixar o blob diretamente com o cliente (se a policy permitir)
        try {
          const { data: blobData, error: dlErr } = await supabase.storage
            .from(this.BUCKET_NAME)
            .download(fileName);

          if (!dlErr && blobData) {
            const url = URL.createObjectURL(blobData);
            console.log('📦 Obtido blob URL via download fallback para arquivo');
            return url;
          }
        } catch (err) {
          console.log('⚠️ Falha no download fallback do arquivo:', err);
        }
      }

      console.log('❌ Não foi possível obter URL pública do arquivo');
      return null;
    } catch (error) {
      console.error('💥 Erro ao obter URL do arquivo:', error);
      return null;
    }
  }

  /**
   * Upload de imagem (nova lógica seguindo padrão de Máquinas)
   * Gera path único com user_id, salva no banco e usa upsert
   */
  static async uploadAttachment(activityId: string, file: File): Promise<boolean> {
    try {
      console.log('⬆️ [Manejo] Fazendo upload da imagem:', activityId);
      console.log('📁 [Manejo] Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');

      // Validações
      const maxFileSize = 10 * 1024 * 1024;
      if (file.size > maxFileSize) {
        throw new Error('Arquivo muito grande. Limite de 10MB.');
      }

      // Obter user_id para estrutura de pastas
      const user = AuthService.getInstance().getCurrentUser();
      if (!user?.user_id) {
        throw new Error('Usuário não autenticado.');
      }

      // Processar imagem
      const processedFile = await this.processImageFile(file, `temp.jpg`);
      console.log('🖼️ [Manejo] Imagem processada:', processedFile.size, 'bytes');

      // Gerar path único (igual Máquinas): user_id/imagens/jpg/timestamp_random.jpg
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}_${randomSuffix}.jpg`;
      const filePath = `${user.user_id}/imagens/jpg/${fileName}`;

      console.log('👤 [Manejo] User ID:', user.user_id);
      console.log('📁 [Manejo] File path:', filePath);

      // Se já existe imagem, deletar primeiro
      const { data: existing } = await supabase
        .from('lancamentos_agricolas')
        .select('url_imagem')
        .eq('atividade_id', activityId)
        .maybeSingle();

      if (existing?.url_imagem) {
        console.log('🔄 [Manejo] Imagem existente encontrada, deletando:', existing.url_imagem);
        try {
          await supabaseServiceRole.storage.from(this.BUCKET_NAME).remove([existing.url_imagem]);
        } catch (err) {
          console.warn('⚠️ [Manejo] Falha ao deletar imagem antiga:', err);
        }
      }

      // Upload com upsert
      let { data, error } = await supabaseServiceRole.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (error) {
        console.log('⚠️ [Manejo] Tentativa com service role falhou, tentando com cliente normal...');
        const result = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ [Manejo] Erro no upload para storage:', error);
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      console.log('✅ [Manejo] Upload para storage concluído');

      // Salvar path no banco
      const { error: dbError } = await supabase
        .from('lancamentos_agricolas')
        .update({ 
          url_imagem: filePath,
          esperando_por_anexo: false // Compatibilidade
        })
        .eq('atividade_id', activityId);

      if (dbError) {
        console.error('❌ [Manejo] Erro ao atualizar banco:', dbError);
        // Rollback: deletar arquivo
        await supabaseServiceRole.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw new Error(`Erro na base de dados: ${dbError.message}`);
      }

      console.log('✅ [Manejo] Banco atualizado com path:', filePath);
      return true;
    } catch (error) {
      console.error('💥 [Manejo] Erro no upload:', error);
      throw error;
    }
  }

  /**
   * Substitui imagem (agora usa uploadAttachment que já faz upsert)
   * Mantido para compatibilidade, mas redireciona para uploadAttachment
   */
  static async replaceAttachment(activityId: string, file: File): Promise<boolean> {
    console.log('🔄 [Manejo] replaceAttachment chamado - redirecionando para uploadAttachment');
    return this.uploadAttachment(activityId, file);
  }

  /**
   * Exclui uma imagem anexada a uma atividade agrícola  
   * Nova lógica: busca path do banco (url_imagem)
   */
  static async deleteAttachment(activityId: string, storageUrl?: string): Promise<boolean> {
    try {
      console.log('🗑️ [Manejo] Excluindo imagem:', activityId);

      // Buscar path salvo no banco
      const { data: activity, error: fetchError } = await supabase
        .from('lancamentos_agricolas')
        .select('url_imagem')
        .eq('atividade_id', activityId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ [Manejo] Erro ao buscar atividade:', fetchError);
      }

      const storedPath = activity?.url_imagem;
      console.log('📊 [Manejo] Path salvo no banco:', storedPath || 'N/A');

      const pathsToTry: string[] = [];

      // PRIORIDADE #1: Path do banco
      if (storedPath) {
        pathsToTry.push(storedPath);
      }

      // PRIORIDADE #2: storageUrl fornecida (de attachments antigos)
      if (storageUrl) {
        const normalizedPath = this.normalizeStoragePath(storageUrl);
        if (!pathsToTry.includes(normalizedPath)) {
          pathsToTry.push(normalizedPath);
        }
      }

      // Fallbacks para arquivos antigos (formato antigo)
      const user = AuthService.getInstance().getCurrentUser();
      pathsToTry.push(`${this.IMAGE_FOLDER}/${activityId}.jpg`);
      if (user?.user_id) {
        pathsToTry.push(`${user.user_id}/${this.IMAGE_FOLDER}/${activityId}.jpg`);
      }

      console.log('🔍 [Manejo] Tentando excluir paths:', pathsToTry);

      // Tentar excluir cada path
      for (const path of pathsToTry) {
        console.log(`🗑️ [Manejo] Tentando excluir: ${path}`);

        let { data, error } = await supabaseServiceRole.storage
          .from(this.BUCKET_NAME)
          .remove([path]);

        if (error) {
          const result = await supabase.storage.from(this.BUCKET_NAME).remove([path]);
          data = result.data;
          error = result.error;
        }

        if (!error && data && data.length > 0) {
          console.log('✅ [Manejo] Exclusão concluída:', path);

          // Limpar campo no banco
          const { error: updateError } = await supabase
            .from('lancamentos_agricolas')
            .update({ 
              url_imagem: null,
              esperando_por_anexo: false 
            })
            .eq('atividade_id', activityId);

          if (updateError) {
            console.warn('⚠️ [Manejo] Erro ao limpar campo no banco:', updateError);
          } else {
            console.log('✅ [Manejo] Campo url_imagem limpo no banco');
          }

          return true;
        } else {
          console.log(`⚠️ [Manejo] Falha ao excluir ${path}:`, error?.message || 'Nenhum arquivo removido');
        }
      }

      throw new Error('Imagem não encontrada em nenhum dos caminhos tentados');
    } catch (error) {
      console.error('💥 [Manejo] Erro ao excluir imagem:', error);
      throw error;
    }
  }

  /**
   * Upload de arquivo (nova lógica seguindo padrão de Máquinas)
          .remove([path]);

        if (error) {
          console.log('⚠️ [Manejo] Tentando com cliente normal...');
          const result = await supabase.storage.from(this.BUCKET_NAME).remove([path]);
          data = result.data;
          error = result.error;
        }

        if (!error && data && data.length > 0) {
          console.log('✅ [Manejo] Exclusão do storage concluída:', path);
          console.log('📦 [Diagnóstico] Dados retornados pelo storage.remove():', data);
          
          // ⭐ Atualizar flag no banco de dados
          const { data: updateData, error: updateError } = await supabase
            .from('lancamentos_agricolas')
            .update({ esperando_por_anexo: false })
            .eq('atividade_id', activityId)
            .select();
          
          if (updateError) {
            console.error('❌ [Manejo] Erro ao atualizar banco:', updateError);
          } else {
            console.log('✅ [Manejo] Flag esperando_por_anexo resetada no banco:', updateData);
          }
          
          // 🔍 DIAGNÓSTICO: Verificar se arquivo ainda existe
          const stillExists = await this.hasAttachment(activityId);
          console.log('🔍 [Diagnóstico] Arquivo ainda existe após exclusão?', stillExists);
          
          return true;
        } else {
          console.log(`⚠️ [Manejo] Falha ao excluir ${path}:`, error?.message || 'Nenhum arquivo removido');
          console.log('📦 [Diagnóstico] Dados retornados (falha):', { data, error });
        }
      }

      throw new Error('Imagem não encontrada em nenhum dos caminhos tentados');
    } catch (error) {
      console.error('💥 [Manejo] Erro ao excluir imagem:', error);
      throw error;
    }
  }

  /**
   * Upload de arquivo (nova lógica seguindo padrão de Máquinas)
   * Gera path único com user_id, salva no banco e usa upsert
   */
  static async uploadFileAttachment(activityId: string, file: File): Promise<boolean> {
    try {
      console.log('⬆️ [Manejo] Fazendo upload do arquivo:', activityId);
      console.log('📁 [Manejo] Arquivo:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size, 'bytes');

      // Validações
      const maxFileSize = 10 * 1024 * 1024;
      if (file.size > maxFileSize) {
        throw new Error('Arquivo muito grande. Limite de 10MB.');
      }

      this.validateFile(file);

      // Obter user_id para estrutura de pastas
      const user = AuthService.getInstance().getCurrentUser();
      if (!user?.user_id) {
        throw new Error('Usuário não autenticado.');
      }

      // Obter extensão
      const ext = this.getFileExtension(file);
      console.log('📂 [Manejo] Extensão do arquivo:', ext);

      // Gerar path único: user_id/arquivos/ext/timestamp_random.ext
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}_${randomSuffix}.${ext}`;
      const filePath = `${user.user_id}/arquivos/${ext}/${fileName}`;

      console.log('👤 [Manejo] User ID:', user.user_id);
      console.log('📁 [Manejo] File path:', filePath);

      // Se já existe arquivo, deletar primeiro
      const { data: existing } = await supabase
        .from('lancamentos_agricolas')
        .select('url_arquivo')
        .eq('atividade_id', activityId)
        .maybeSingle();

      if (existing?.url_arquivo) {
        console.log('🔄 [Manejo] Arquivo existente encontrado, deletando:', existing.url_arquivo);
        try {
          await supabaseServiceRole.storage.from(this.BUCKET_NAME).remove([existing.url_arquivo]);
        } catch (err) {
          console.warn('⚠️ [Manejo] Falha ao deletar arquivo antigo:', err);
        }
      }

      // Upload com upsert
      let { data, error } = await supabaseServiceRole.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (error) {
        console.log('⚠️ [Manejo] Tentativa com service role falhou, tentando com cliente normal...');
        const result = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ [Manejo] Erro no upload para storage:', error);
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      console.log('✅ [Manejo] Upload para storage concluído');

      // Salvar path no banco
      const { error: dbError } = await supabase
        .from('lancamentos_agricolas')
        .update({ 
          url_arquivo: filePath,
          esperando_por_anexo: false // Compatibilidade
        })
        .eq('atividade_id', activityId);

      if (dbError) {
        console.error('❌ [Manejo] Erro ao atualizar banco:', dbError);
        // Rollback: deletar arquivo
        await supabaseServiceRole.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw new Error(`Erro na base de dados: ${dbError.message}`);
      }

      console.log('✅ [Manejo] Banco atualizado com path:', filePath);
      return true;
    } catch (error) {
      console.error('💥 Erro no upload de arquivo:', error);
      throw error;
    }
  }

  /**
   * Substitui arquivo (agora usa uploadFileAttachment que já faz upsert)
   * Mantido para compatibilidade, mas redireciona para uploadFileAttachment
   */
  static async replaceFileAttachment(activityId: string, file: File): Promise<boolean> {
    console.log('🔄 [Manejo] replaceFileAttachment chamado - redirecionando para uploadFileAttachment');
    return this.uploadFileAttachment(activityId, file);
  }

  /**
   * Exclui um arquivo anexado a uma atividade agrícola
      }

      if (error) {
        console.error('❌ Erro na substituição do storage:', error);
        throw new Error(`Erro ao substituir arquivo: ${error.message}`);
      }

      console.log('✅ Substituição no storage concluída:', data);
      return true;
    } catch (error) {
      console.error('💥 Erro ao substituir arquivo:', error);
      throw error;
    }
  }

  /**
   * Exclui um arquivo anexado a uma atividade agrícola
   * @param activityId - ID da atividade
   * @param storageUrl - URL completa do storage (opcional, mas recomendado para precisão)
   */
  /**
   * Exclui um arquivo anexado a uma atividade agrícola
   * Nova lógica: busca path do banco (url_arquivo)
   */
  static async deleteFileAttachment(activityId: string, storageUrl?: string): Promise<boolean> {
    try {
      console.log('🗑️ [Manejo] Excluindo arquivo:', activityId);

      // Buscar path salvo no banco
      const { data: activity, error: fetchError } = await supabase
        .from('lancamentos_agricolas')
        .select('url_arquivo')
        .eq('atividade_id', activityId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ [Manejo] Erro ao buscar atividade:', fetchError);
      }

      const storedPath = activity?.url_arquivo;
      console.log('📊 [Manejo] Path salvo no banco:', storedPath || 'N/A');

      const pathsToTry: string[] = [];

      // PRIORIDADE #1: Path do banco
      if (storedPath) {
        pathsToTry.push(storedPath);
      }

      // PRIORIDADE #2: storageUrl fornecida (de attachments antigos)
      if (storageUrl) {
        const normalizedPath = this.normalizeStoragePath(storageUrl);
        if (!pathsToTry.includes(normalizedPath)) {
          pathsToTry.push(normalizedPath);
        }
      }

      // Fallbacks para arquivos antigos (formato antigo)
      const user = AuthService.getInstance().getCurrentUser();
      const extensions = ['pdf','xml','xls','xlsx','doc','docx','csv','txt'];
      
      for (const ext of extensions) {
        pathsToTry.push(`${this.FILE_FOLDER}/${activityId}.${ext}`);
      }

      if (user?.user_id) {
        for (const ext of extensions) {
          pathsToTry.push(`${user.user_id}/${this.FILE_FOLDER}/${activityId}.${ext}`);
        }
      }

      console.log('🔍 [Manejo] Tentando excluir paths:', pathsToTry.slice(0, 5), '...(total:', pathsToTry.length, ')');

      // Tentar excluir cada path
      for (const path of pathsToTry) {
        let { data, error } = await supabaseServiceRole.storage
          .from(this.BUCKET_NAME)
          .remove([path]);

        if (error) {
          const result = await supabase.storage.from(this.BUCKET_NAME).remove([path]);
          data = result.data;
          error = result.error;
        }

        if (!error && data && data.length > 0) {
          console.log('✅ [Manejo] Exclusão concluída:', path);

          // Limpar campo no banco
          const { error: updateError } = await supabase
            .from('lancamentos_agricolas')
            .update({ 
              url_arquivo: null,
              esperando_por_anexo: false 
            })
            .eq('atividade_id', activityId);

          if (updateError) {
            console.warn('⚠️ [Manejo] Erro ao limpar campo no banco:', updateError);
          } else {
            console.log('✅ [Manejo] Campo url_arquivo limpo no banco');
          }

          return true;
        }
      }

      throw new Error('Arquivo não encontrado em nenhum dos caminhos tentados');
    } catch (error) {
      console.error('💥 [Manejo] Erro ao excluir arquivo:', error);
      throw error;
    }
  }

  static async downloadAttachment(activityId: string): Promise<void> {
    try {
      console.log('⬇️ Fazendo download da imagem:', activityId);

      const fileName = `${this.IMAGE_FOLDER}/${activityId}.jpg`;

      let { data, error } = await supabaseServiceRole.storage
        .from(this.BUCKET_NAME)
        .download(fileName);

      if (error) {
        console.log('⚠️ Tentando download com cliente normal...');
        const result = await supabase.storage
          .from(this.BUCKET_NAME)
          .download(fileName);
        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        console.error('❌ Erro no download:', error);
        throw new Error('Erro ao fazer download da imagem');
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atividade_${activityId}.jpg`;
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

  static async downloadFileAttachment(activityId: string): Promise<void> {
    try {
      console.log('⬇️ Fazendo download do arquivo:', activityId);

  const extensions = ['pdf','xml','xls','xlsx','doc','docx','csv','txt'];
      let downloaded = false;

      for (const ext of extensions) {
        const fileName = `${this.FILE_FOLDER}/${activityId}.${ext}`;

        let { data, error } = await supabaseServiceRole.storage
          .from(this.BUCKET_NAME)
          .download(fileName);

        if (error) {
          console.log(`⚠️ Tentando download de ${ext} com cliente normal...`);
          const result = await supabase.storage
            .from(this.BUCKET_NAME)
            .download(fileName);
          data = result.data;
          error = result.error;
        }

        if (!error && data) {
          const url = URL.createObjectURL(data);
          const link = document.createElement('a');
          link.href = url;
          link.download = `atividade_${activityId}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          console.log('✅ Download concluído');
          downloaded = true;
          break;
        }
      }

      if (!downloaded) {
        throw new Error('Arquivo não encontrado');
      }
    } catch (error) {
      console.error('💥 Erro no download:', error);
      throw error;
    }
  }

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
                lastModified: Date.now()
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

  static validateImageFile(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml',
      'image/avif',
      'image/heic',
      'image/heif'
    ];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, GIF, WebP, BMP, SVG, AVIF ou HEIC.');
    }

    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB.');
    }

    return true;
  }

  static validateFile(file: File): boolean {
    const validTypes = [
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
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use PDF, XML, DOC, DOCX, XLS, XLSX, CSV ou TXT.');
    }

    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB.');
    }

    return true;
  }

  /**
   * Normaliza path do storage, extraindo o path real de uma URL completa
   * Exemplo: https://...supabase.co/storage/v1/object/public/atividades_agricolas/imagens/abc.jpg
   * Retorna: imagens/abc.jpg
   */
  private static normalizeStoragePath(urlOrPath: string): string {
    if (!urlOrPath) return urlOrPath;
    const s = urlOrPath.split('?')[0]; // Remove query params
    
    try {
      if (s.startsWith('http://') || s.startsWith('https://')) {
        // Extrair tudo após /storage/v1/object/public/{bucket}/
        const markerPublic = `/storage/v1/object/public/${this.BUCKET_NAME}/`;
        const markerPrivate = `/storage/v1/object/${this.BUCKET_NAME}/`;
        
        let idx = s.indexOf(markerPublic);
        if (idx >= 0) return s.substring(idx + markerPublic.length);
        
        idx = s.indexOf(markerPrivate);
        if (idx >= 0) return s.substring(idx + markerPrivate.length);
        
        // Fallback: encontrar o bucket name e retornar o resto
        const parts = s.split('/');
        const bucketIndex = parts.findIndex(p => p === this.BUCKET_NAME);
        if (bucketIndex >= 0 && parts.length > bucketIndex + 1) {
          return parts.slice(bucketIndex + 1).join('/');
        }
      }
      
      // Se começar com nome do bucket, remover prefixo
      if (s.startsWith(`${this.BUCKET_NAME}/`)) {
        return s.substring(this.BUCKET_NAME.length + 1);
      }
      
      return s.replace(/^\/+/, '');
    } catch (err) {
      console.warn('⚠️ normalizeStoragePath falhou para:', urlOrPath, err);
      return urlOrPath;
    }
  }

  private static getFileExtension(file: File): string {
    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/xml': 'xml',
      'text/xml': 'xml',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/csv': 'csv',
      'text/plain': 'txt'
    };

    if (mimeToExt[file.type]) {
      return mimeToExt[file.type];
    }

    const nameParts = file.name.split('.');
    if (nameParts.length > 1) {
      const ext = nameParts[nameParts.length - 1].toLowerCase();
      if (['pdf', 'xml', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'].includes(ext)) return ext;
    }

    return 'pdf';
  }

  /**
   * Gera signed URL para imagem de atividade (válida por 1 hora)
   * @param activityId - ID da atividade
   * @param expiresIn - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
   * @returns URL assinada ou null se falhar
   */
  static async getSignedImageUrl(activityId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const filePath = `${this.IMAGE_FOLDER}/${activityId}.jpg`;
      console.log('🔐 Gerando signed URL para imagem:', filePath);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('❌ Erro ao gerar signed URL:', error);
        return null;
      }

      console.log('✅ Signed URL gerada com sucesso');
      return data.signedUrl;
    } catch (err) {
      console.error('💥 Erro ao gerar signed URL:', err);
      return null;
    }
  }

  /**
   * Gera signed URL para arquivo de atividade (válida por 1 hora)
   * @param activityId - ID da atividade
   * @param expiresIn - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
   * @returns URL assinada ou null se falhar
   */
  static async getSignedFileUrl(activityId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const extensions = ['pdf','xml','xls','xlsx','doc','docx','csv','txt'];

      for (const ext of extensions) {
        const filePath = `${this.FILE_FOLDER}/${activityId}.${ext}`;

        const { data, error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .createSignedUrl(filePath, expiresIn);

        if (!error && data?.signedUrl) {
          console.log('✅ Signed URL gerada para arquivo:', filePath);
          return data.signedUrl;
        }
      }

      console.error('❌ Não foi possível gerar signed URL para nenhuma extensão');
      return null;
    } catch (err) {
      console.error('💥 Erro ao gerar signed URL:', err);
      return null;
    }
  }
}
