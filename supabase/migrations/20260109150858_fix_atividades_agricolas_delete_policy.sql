/*
  # Fix atividades_agricolas Storage Delete Policy

  1. Description
    - Simplifies RLS policies for atividades_agricolas bucket
    - Changes from activity-based ownership to simple authenticated access
    - Allows any authenticated user to delete files in the bucket

  2. Changes
    - Drops restrictive activity-based policies
    - Creates simple authenticated-only policies
    - Ensures delete operations work correctly

  3. Security
    - All policies require authentication
    - Similar to Documento_Maquina and produtos buckets
*/

-- Drop existing policies for atividades_agricolas
DROP POLICY IF EXISTS "atividades_agricolas: activity owner insert" ON storage.objects;
DROP POLICY IF EXISTS "atividades_agricolas: activity owner update" ON storage.objects;
DROP POLICY IF EXISTS "atividades_agricolas: activity owner delete" ON storage.objects;
DROP POLICY IF EXISTS "atividades_agricolas: activity owner select" ON storage.objects;

-- Create simple authenticated policies
CREATE POLICY "atividades_agricolas: authenticated insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'atividades_agricolas');

CREATE POLICY "atividades_agricolas: authenticated update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'atividades_agricolas')
WITH CHECK (bucket_id = 'atividades_agricolas');

CREATE POLICY "atividades_agricolas: authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'atividades_agricolas');

CREATE POLICY "atividades_agricolas: authenticated select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'atividades_agricolas');