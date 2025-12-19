-- create_policies_all_buckets.sql
-- Políticas sugeridas para buckets listados pelo usuário.
-- Rode este script no SQL Editor do Supabase (projeto -> SQL).
-- IMPORTANTE: reveja e adapte as policies restritivas para o padrão de nomes que você usa (prefixos por user/id_grupo_anex o).

-- dividas_financiamentos (sensível)
-- TEMPLATE BÁSICO (aplicar a buckets não sensíveis)
-- Substitua BUCKET_NAME pelo nome do bucket.
-- Permite escrita apenas a usuários autenticados; leitura fica controlada por bucket_id.

-- EXEMPLO:
-- CREATE POLICY "Allow authenticated insert into BUCKET_NAME" ON storage.objects
-- FOR INSERT
-- WITH CHECK (
--   auth.role() = 'authenticated' AND
--   bucket_id = 'BUCKET_NAME'
-- );

-- ==================================================================
-- 1) Policies para buckets menos sensíveis (usar template básico)

-- pragas_e_doencas
-- Removendo policies para bucket `pragas_e_doencas` (limpeza solicitada)
DROP POLICY IF EXISTS "Allow authenticated insert into pragas_e_doencas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update pragas_e_doencas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete pragas_e_doencas" ON storage.objects;
DROP POLICY IF EXISTS "Allow select pragas_e_doencas" ON storage.objects;

-- Policy para permitir leitura de objetos do bucket pragas_e_doencas
-- Aceita: service_role, arquivos prefixados por userId, e arquivos na raiz cujo nome (sem extensão)
-- corresponde ao id de uma ocorrência pertencente a auth.uid().
-- Evita erro caso a policy já exista
DROP POLICY IF EXISTS "Pragas: select owner-or-service-or-occurrence-id" ON storage.objects;
CREATE POLICY "Pragas: select owner-or-service-or-occurrence-id" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pragas_e_doencas' AND (
      auth.role() = 'service_role'
      OR split_part(name, '/', 1) = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.pragas_e_doencas p
        WHERE p.id = (substring(split_part(name, '/', 1) FROM '^(\\d+)(?:\\.|_|$)'))::int
          AND p.user_id::text = auth.uid()::text
      )
    )
  );

-- atividades_agricolas
CREATE POLICY "Allow authenticated insert into atividades_agricolas" ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'atividades_agricolas'
);

CREATE POLICY "Allow authenticated update atividades_agricolas" ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'atividades_agricolas'
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'atividades_agricolas'
);

CREATE POLICY "Allow authenticated delete atividades_agricolas" ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'atividades_agricolas'
);

CREATE POLICY "Allow select atividades_agricolas" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'atividades_agricolas'
);

-- produtos
CREATE POLICY "Allow authenticated insert into produtos" ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'produtos'
);

CREATE POLICY "Allow authenticated update produtos" ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'produtos'
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'produtos'
);

CREATE POLICY "Allow authenticated delete produtos" ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'produtos'
);

CREATE POLICY "Allow select produtos" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'produtos'
);

-- Documento_Maquina (sugestão: permite escrita apenas a authenticaed)
CREATE POLICY "Allow authenticated insert into Documento_Maquina" ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'Documento_Maquina'
);

CREATE POLICY "Allow authenticated update Documento_Maquina" ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'Documento_Maquina'
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'Documento_Maquina'
);

CREATE POLICY "Allow authenticated delete Documento_Maquina" ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'Documento_Maquina'
);

CREATE POLICY "Allow select Documento_Maquina" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'Documento_Maquina'
);

-- ==================================================================
-- 2) Buckets sensíveis: aplicar policies mais restritivas (ownership by prefix)
-- Recomendo aplicar estas em vez das policies genéricas para os buckets sensíveis.

-- notas_fiscais (exige que o nome do arquivo comece com o user_id ou id_grupo_anexo)
-- Este exemplo assume que você grava arquivos como "<user_id>/..." ou "<id_grupo_anexo>/...".
CREATE POLICY "Notas_fiscais: user owns object (insert)" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'notas_fiscais' AND
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Notas_fiscais: user owns object (update)" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'notas_fiscais' AND
  split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'notas_fiscais' AND
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Notas_fiscais: user owns object (delete)" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'notas_fiscais' AND
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Notas_fiscais: select public" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'notas_fiscais'
);

-- dividas_financiamentos (sensível)
CREATE POLICY "Dividas: user owns object (insert)" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'dividas_financiamentos' AND
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Dividas: user owns object (update)" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'dividas_financiamentos' AND
  split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'dividas_financiamentos' AND
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Dividas: user owns object (delete)" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'dividas_financiamentos' AND
  split_part(name, '/', 1) = auth.uid()::text
);

-- SELECT policy para dividas_financiamentos: apenas o owner ou service_role
DROP POLICY IF EXISTS "Dividas: select owner-only" ON storage.objects;
CREATE POLICY "Dividas: select owner-only" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'dividas_financiamentos' AND
  (
    auth.role() = 'service_role' OR
    split_part(name, '/', 1) = auth.uid()::text
  )
);

-- ==================================================================
-- Bloco de limpeza: remover todas as policies da tabela storage.objects
-- Use este bloco com cuidado; ele DROPA policies existentes automaticamente.
-- Execute no SQL Editor do Supabase para aplicar.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT pol.polname
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'storage' AND c.relname = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', r.polname);
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- ==================================================================
-- NOTAS FINAIS / INSTRUÇÕES
-- 1) Se você NÃO usa prefixo <user_id>/ no nome dos arquivos, adapte as policies
--    para usar outro critério (ex.: split_part(name, '_', 1) = auth.uid() ou
--    verificar id_grupo_anexo presente no nome).
-- 2) Para aplicar: copie este arquivo e execute no SQL Editor do Supabase.
-- 3) Teste com um usuário autenticado (garanta que o JWT esteja sendo setado no cliente).
-- 4) Se ocorrer erro "new row violates row-level security policy" cole o log aqui
--    que eu ajusto a policy específica.
-- 5) Depois de testar, ajuste as policies para serem o mais restritivas possíveis.
