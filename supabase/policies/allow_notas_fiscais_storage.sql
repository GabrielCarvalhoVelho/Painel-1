-- Políticas para permitir que usuários autenticados façam upload/atualização/exclusão no bucket 'notas_fiscais'
-- Rode este script no SQL Editor do Supabase (projeto -> SQL)

-- INSERT (upload)
CREATE POLICY "Allow authenticated insert into notas_fiscais" ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'notas_fiscais'
);

-- UPDATE (substituição)
CREATE POLICY "Allow authenticated update notas_fiscais" ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'notas_fiscais'
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'notas_fiscais'
);

-- DELETE (remoção)
CREATE POLICY "Allow authenticated delete notas_fiscais" ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'notas_fiscais'
);

-- SELECT (leitura) — opcional, útil se quiser controlar leitura via RLS
CREATE POLICY "Allow select notas_fiscais" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'notas_fiscais'
);

-- OBS: Revise estas políticas após testar; não deixe regras excessivamente permissivas em produção.
