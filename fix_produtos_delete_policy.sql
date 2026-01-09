-- SQL para corrigir política de DELETE no bucket 'produtos'
-- Execute este SQL no Supabase SQL Editor

-- 1. DIAGNÓSTICO: Verificar políticas atuais do bucket produtos
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE 'produtos%';

-- 2. DIAGNÓSTICO: Verificar se existem arquivos no bucket produtos
SELECT name, bucket_id, created_at, owner
FROM storage.objects
WHERE bucket_id = 'produtos'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Remover política de DELETE antiga (se existir)
DROP POLICY IF EXISTS "produtos_delete_policy" ON storage.objects;

-- 4. Criar política de DELETE mais permissiva
-- Esta política permite excluir arquivos onde:
-- - O bucket é 'produtos' E
-- - O primeiro segmento do path é o user_id OU
-- - O arquivo está em path legado (imagens/ ou pdfs/) sem user_id
CREATE POLICY "produtos_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'produtos' 
  AND (
    -- Path novo: {user_id}/imagens/... ou {user_id}/pdfs/...
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Path legado: imagens/... ou pdfs/... (sem user_id prefix)
    (storage.foldername(name))[1] IN ('imagens', 'pdfs')
  )
);

-- 5. Verificar que a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' AND policyname = 'produtos_delete_policy';

-- 6. OPCIONAL: Se o problema persistir, esta é uma política de emergência
-- que permite qualquer usuário autenticado deletar no bucket produtos.
-- DESCOMENTE APENAS SE NECESSÁRIO (menos seguro):

-- DROP POLICY IF EXISTS "produtos_delete_policy" ON storage.objects;
-- CREATE POLICY "produtos_delete_policy" ON storage.objects
-- FOR DELETE TO authenticated
-- USING (bucket_id = 'produtos');

-- 7. Verificar qual user_id está no JWT (para debug)
-- Execute isso em uma query separada enquanto estiver logado:
-- SELECT auth.uid() as current_user_id;

