import { supabase } from '../lib/supabase';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PragaDoenca {
  id: number;
  user_id: string;
  talhoes?: string;
  data_da_ocorrencia: string;
  fase_da_lavoura?: string;
  tipo_de_ocorrencia?: string;
  nivel_da_gravidade?: string;
  area_afetada?: string;
  sintomas_observados?: string;
  acao_tomada?: string;
  origem?: string;
  nome_praga?: string;
  diagnostico?: string;
  descricao_detalhada?: string;
  clima_recente?: string;
  produtos_aplicados?: string[];
  data_aplicacao?: string;
  recomendacoes?: string;
  status?: string;
  anexos?: string[];
  foto_principal?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PragaDoencaComTalhoes extends PragaDoenca {
  talhoes_vinculados?: Array<{
    id: number;
    talhao_id: string;
    nome_talhao?: string;
  }>;
}

export class PragasDoencasService {
  static async getOcorrencias(userId?: string, limit: number = 100): Promise<PragaDoencaComTalhoes[]> {
    try {
      const query = supabase
        .from('pragas_e_doencas')
        .select('*')
        .order('data_da_ocorrencia', { ascending: false })
        .limit(limit);

      if (userId) {
        query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar ocorrências:', error);
        return [];
      }

      const ocorrenciasComTalhoes = await Promise.all(
        (data || []).map(async (ocorrencia) => {
          const { data: talhoesData } = await supabase
            .from('pragas_e_doencas_talhoes')
            .select('id, talhao_id')
            .eq('praga_doenca_id', ocorrencia.id);

          const talhoesComNomes = await Promise.all(
            (talhoesData || []).map(async (vinculo) => {
              const { data: talhaoData } = await supabase
                .from('talhoes')
                .select('nome')
                .eq('id_talhao', vinculo.talhao_id)
                .maybeSingle();

              return {
                ...vinculo,
                nome_talhao: talhaoData?.nome || 'Talhão não encontrado',
              };
            })
          );

          return {
            ...ocorrencia,
            talhoes_vinculados: talhoesComNomes,
          };
        })
      );

      return ocorrenciasComTalhoes;
    } catch (err) {
      console.error('Erro no PragasDoencasService.getOcorrencias:', err);
      return [];
    }
  }

  static async getOcorrenciaById(id: number): Promise<PragaDoencaComTalhoes | null> {
    try {
      const { data, error } = await supabase
        .from('pragas_e_doencas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        console.error('Erro ao buscar ocorrência por id:', error);
        return null;
      }

      const { data: talhoesData } = await supabase
        .from('pragas_e_doencas_talhoes')
        .select('id, talhao_id')
        .eq('praga_doenca_id', data.id);

      const talhoesComNomes = await Promise.all(
        (talhoesData || []).map(async (vinculo) => {
          const { data: talhaoData } = await supabase
            .from('talhoes')
            .select('nome')
            .eq('id_talhao', vinculo.talhao_id)
            .maybeSingle();

          return {
            ...vinculo,
            nome_talhao: talhaoData?.nome || 'Talhão não encontrado',
          };
        })
      );

      return {
        ...data,
        talhoes_vinculados: talhoesComNomes,
      };
    } catch (err) {
      console.error('Erro no PragasDoencasService.getOcorrenciaById:', err);
      return null;
    }
  }

  static async uploadImage(file: File, ocorrenciaId: number): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${ocorrenciaId}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('pragas_e_doencas')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Erro ao fazer upload da imagem:', uploadError);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('pragas_e_doencas')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Erro no upload da imagem:', err);
      return null;
    }
  }

  static async createOcorrencia(
    payload: Partial<PragaDoenca>,
    talhaoIds: string[] = [],
    imageFile?: File
  ) {
    try {
      const { data, error } = await supabase
        .from('pragas_e_doencas')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar ocorrência:', error);
        return { error };
      }

      const ocorrenciaId = (data as any).id;

      if (imageFile) {
        const imageUrl = await this.uploadImage(imageFile, ocorrenciaId);
        if (imageUrl) {
          await supabase
            .from('pragas_e_doencas')
            .update({ foto_principal: imageUrl })
            .eq('id', ocorrenciaId);
        }
      }

      if (talhaoIds.length > 0) {
        const vinculos = talhaoIds.map((talhao_id) => ({
          praga_doenca_id: ocorrenciaId,
          talhao_id,
          user_id: payload.user_id,
        }));

        const { error: vinculoError } = await supabase
          .from('pragas_e_doencas_talhoes')
          .insert(vinculos);

        if (vinculoError) {
          console.error('Erro ao vincular talhões:', vinculoError);
        }
      }

      return { data };
    } catch (err) {
      console.error('Erro no PragasDoencasService.createOcorrencia:', err);
      return { error: err };
    }
  }

  static async updateOcorrencia(
    id: number,
    changes: Partial<PragaDoenca>,
    talhaoIds?: string[]
  ) {
    try {
      changes.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('pragas_e_doencas')
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar ocorrência:', error);
        return { error };
      }

      if (talhaoIds !== undefined) {
        await supabase
          .from('pragas_e_doencas_talhoes')
          .delete()
          .eq('praga_doenca_id', id);

        if (talhaoIds.length > 0) {
          const vinculos = talhaoIds.map((talhao_id) => ({
            praga_doenca_id: id,
            talhao_id,
            user_id: changes.user_id,
          }));

          const { error: vinculoError } = await supabase
            .from('pragas_e_doencas_talhoes')
            .insert(vinculos);

          if (vinculoError) {
            console.error('Erro ao atualizar vínculos de talhões:', vinculoError);
          }
        }
      }

      return { data };
    } catch (err) {
      console.error('Erro no PragasDoencasService.updateOcorrencia:', err);
      return { error: err };
    }
  }

  static async deleteOcorrencia(id: number) {
    try {
      await supabase
        .from('pragas_e_doencas_talhoes')
        .delete()
        .eq('praga_doenca_id', id);

      const { data, error } = await supabase
        .from('pragas_e_doencas')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao deletar ocorrência:', error);
        return { error };
      }

      return { data };
    } catch (err) {
      console.error('Erro no PragasDoencasService.deleteOcorrencia:', err);
      return { error: err };
    }
  }

  static async updateStatus(id: number, status: string, userId: string) {
    return this.updateOcorrencia(id, { status, user_id: userId });
  }

  static formatDate(dateString?: string): string {
    try {
      if (!dateString) return 'Data não informada';

      let date: Date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        const [dia, mes, ano] = dateString.split('/');
        if (ano.length === 4) {
          date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        } else {
          date = new Date(parseInt(ano) + 2000, parseInt(mes) - 1, parseInt(dia));
        }
      } else if (dateString.includes('-')) {
        date = parseISO(dateString);
      } else {
        return dateString;
      }

      if (!isValid(date)) return dateString;
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString);
      return dateString || 'Data não informada';
    }
  }

  static getOcorrenciaIcon(tipoOcorrencia?: string): string {
    const icons: { [key: string]: string } = {
      'Praga': '🐛',
      'Doença': '🍂',
      'Deficiência': '🌱',
      'Planta daninha': '🌾',
    };

    if (!tipoOcorrencia) return '📋';

    for (const [key, icon] of Object.entries(icons)) {
      if (tipoOcorrencia.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }

    return '📋';
  }
}
