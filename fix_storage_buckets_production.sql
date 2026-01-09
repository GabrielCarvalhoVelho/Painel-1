-- SQL para corrigir configuração dos buckets em PRODUÇÃO
-- Execute este SQL no Supabase SQL Editor

-- Atualiza os buckets pragas_e_doencas e dividas_financiamentos
-- com as mesmas configurações do notas_fiscais (que funciona)
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800,  -- 50MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
WHERE id IN ('pragas_e_doencas', 'dividas_financiamentos');

-- Verifica se a atualização foi feita
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('pragas_e_doencas', 'dividas_financiamentos', 'notas_fiscais', 'atividades_agricolas');
