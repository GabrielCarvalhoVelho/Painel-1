/*
  # Criar bucket de storage para documentos

  1. Novo Bucket
    - `documentos` - Bucket público para armazenar documentos dos usuários
  
  2. Segurança
    - Habilitar RLS no bucket
    - Políticas para permitir usuários autenticados fazerem upload apenas nas suas pastas
    - Políticas para permitir usuários autenticados acessarem apenas seus próprios arquivos
  
  3. Organização
    - Arquivos organizados por user_id: `{user_id}/{timestamp}_{filename}`
*/

-- Criar bucket de documentos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Usuários autenticados podem fazer upload apenas nas suas próprias pastas
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários autenticados podem visualizar apenas seus próprios arquivos
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários autenticados podem atualizar apenas seus próprios arquivos
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários autenticados podem deletar apenas seus próprios arquivos
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
