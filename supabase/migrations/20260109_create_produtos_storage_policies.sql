-- SQL para criar políticas RLS no bucket 'produtos'
-- Execute este SQL no Supabase SQL Editor

-- 1. Primeiro, verificar se o bucket existe e criar se necessário
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produtos',
  'produtos',
  false,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
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
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Usuarios autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem ver seus arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem deletar seus arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus arquivos" ON storage.objects;

-- Remover políticas específicas do bucket produtos
DROP POLICY IF EXISTS "produtos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "produtos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "produtos_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "produtos_update_policy" ON storage.objects;

-- 3. Criar políticas RLS para o bucket 'produtos'
-- Política de INSERT: usuário pode fazer upload em sua própria pasta
CREATE POLICY "produtos_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'produtos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política de SELECT: usuário pode ver seus próprios arquivos
CREATE POLICY "produtos_select_policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'produtos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política de DELETE: usuário pode deletar seus próprios arquivos
CREATE POLICY "produtos_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'produtos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política de UPDATE: usuário pode atualizar seus próprios arquivos
CREATE POLICY "produtos_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'produtos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'produtos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE 'produtos%';

-- 5. Verificar configuração do bucket
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'produtos';
