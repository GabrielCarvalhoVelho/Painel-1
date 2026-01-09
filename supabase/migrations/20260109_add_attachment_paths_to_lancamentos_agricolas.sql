-- ============================================================================
-- Migration: Adicionar colunas para paths de anexos em lancamentos_agricolas
-- ============================================================================
-- Data: 2026-01-09
-- Descrição: Adiciona colunas url_imagem e url_arquivo para armazenar os 
-- paths completos dos arquivos no storage, seguindo o mesmo padrão usado 
-- em maquinas_equipamentos (url_primeiro_envio, url_segundo_envio).
--
-- Motivação: Atualmente lancamentos_agricolas usa apenas a flag 
-- esperando_por_anexo e depende de convenções de nome de arquivo 
-- (activityId.jpg, activityId.pdf). Isso dificulta:
-- - Exclusão precisa de arquivos (precisa "adivinhar" o path)
-- - Substituição de arquivos
-- - Suporte a múltiplos formatos
-- - Rastreamento de quais anexos existem
--
-- Com as novas colunas, seguimos o padrão de maquinas_equipamentos:
-- - url_imagem: path completo da imagem (ex: user_id/imagens/timestamp.jpg)
-- - url_arquivo: path completo do arquivo (ex: user_id/arquivos/timestamp.pdf)
-- ============================================================================

-- Adicionar colunas para armazenar paths dos anexos
ALTER TABLE public.lancamentos_agricolas
  ADD COLUMN IF NOT EXISTS url_imagem TEXT,
  ADD COLUMN IF NOT EXISTS url_arquivo TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.lancamentos_agricolas.url_imagem IS 
  'Path completo da imagem no storage (ex: user_id/imagens/jpg/123_abc.jpg). Armazena apenas o path, não a URL completa.';

COMMENT ON COLUMN public.lancamentos_agricolas.url_arquivo IS 
  'Path completo do arquivo no storage (ex: user_id/arquivos/pdf/123_abc.pdf). Armazena apenas o path, não a URL completa.';

-- Adicionar índices para melhorar performance de queries que filtram por anexos
CREATE INDEX IF NOT EXISTS idx_lancamentos_agricolas_url_imagem 
  ON public.lancamentos_agricolas(url_imagem) 
  WHERE url_imagem IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lancamentos_agricolas_url_arquivo 
  ON public.lancamentos_agricolas(url_arquivo) 
  WHERE url_arquivo IS NOT NULL;

-- RLS: As policies existentes já cobrem estas colunas (user_id matching)
-- Não é necessário criar policies adicionais

-- ============================================================================
-- Nota: A coluna esperando_por_anexo pode ser mantida para compatibilidade
-- retroativa, mas não é mais necessária para o funcionamento dos anexos.
-- Em uma migração futura, podemos considerar removê-la ou torná-la computed.
-- ============================================================================
