/*
  # Fix Documento_Maquina bucket RLS policies with user_id structure
  
  1. Changes
    - Drop existing RLS policies for Documento_Maquina bucket
    - Create new RLS policies matching notas_fiscais structure
    - Policies check that first part of path (split_part) matches auth.uid()
    - This ensures users can only access their own files
  
  2. Security
    - SELECT: Users can only view their own files
    - INSERT: Users can only upload to their own folder
    - UPDATE: Users can only update their own files  
    - DELETE: Users can only delete their own files
    
  3. Path Structure
    - Files must be stored as: {user_id}/{uploadType}/{fileExt}/{filename}
    - Example: abc123/primeiro_envio/pdf/1234567890_xyz.pdf
*/

-- Drop existing policies for Documento_Maquina bucket
DROP POLICY IF EXISTS "Documento_Maquina: Authenticated users can read" ON storage.objects;
DROP POLICY IF EXISTS "Documento_Maquina: Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Documento_Maquina: Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Documento_Maquina: Authenticated users can delete" ON storage.objects;

-- Create new policies matching notas_fiscais structure
-- Users can only access files in their own folder (first part of path = user_id)

CREATE POLICY "Documento_Maquina: owner select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'Documento_Maquina'
    AND split_part(name, '/', 1) = (auth.uid())::text
  );

CREATE POLICY "Documento_Maquina: owner insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'Documento_Maquina'
    AND split_part(name, '/', 1) = (auth.uid())::text
  );

CREATE POLICY "Documento_Maquina: owner update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'Documento_Maquina'
    AND split_part(name, '/', 1) = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'Documento_Maquina'
    AND split_part(name, '/', 1) = (auth.uid())::text
  );

CREATE POLICY "Documento_Maquina: owner delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'Documento_Maquina'
    AND split_part(name, '/', 1) = (auth.uid())::text
  );
