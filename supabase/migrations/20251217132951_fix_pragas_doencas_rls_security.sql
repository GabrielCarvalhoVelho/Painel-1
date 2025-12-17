/*
  # Corrigir Políticas RLS para Pragas e Doenças (SEGURANÇA)

  ## Problema Identificado
  As políticas atuais usam `USING (true)` permitindo que todos os usuários vejam dados de todos.
  
  ## Solução
  1. Remover políticas permissivas de desenvolvimento
  2. Restaurar políticas seguras baseadas em user_id
  3. Garantir que usuários só acessem seus próprios dados
  
  ## Mudanças
  - Políticas agora verificam `auth.uid() = user_id` (ambos UUID)
  - Suporte para JWT customizado do n8n (sub claim)
  - Removido acesso permissivo que causava vazamento de dados
*/

-- Remover todas as políticas permissivas existentes
DROP POLICY IF EXISTS "Dev allow select pragas_e_doencas" ON pragas_e_doencas;
DROP POLICY IF EXISTS "Dev allow insert pragas_e_doencas" ON pragas_e_doencas;
DROP POLICY IF EXISTS "Dev allow update pragas_e_doencas" ON pragas_e_doencas;
DROP POLICY IF EXISTS "Dev allow delete pragas_e_doencas" ON pragas_e_doencas;

DROP POLICY IF EXISTS "Dev allow select pragas_e_doencas_talhoes" ON pragas_e_doencas_talhoes;
DROP POLICY IF EXISTS "Dev allow insert pragas_e_doencas_talhoes" ON pragas_e_doencas_talhoes;
DROP POLICY IF EXISTS "Dev allow delete pragas_e_doencas_talhoes" ON pragas_e_doencas_talhoes;

DROP POLICY IF EXISTS "Users can view own pragas_e_doencas" ON pragas_e_doencas;
DROP POLICY IF EXISTS "Users can insert own pragas_e_doencas" ON pragas_e_doencas;
DROP POLICY IF EXISTS "Users can update own pragas_e_doencas" ON pragas_e_doencas;
DROP POLICY IF EXISTS "Users can delete own pragas_e_doencas" ON pragas_e_doencas;

DROP POLICY IF EXISTS "Users can view own pragas_e_doencas_talhoes" ON pragas_e_doencas_talhoes;
DROP POLICY IF EXISTS "Users can insert own pragas_e_doencas_talhoes" ON pragas_e_doencas_talhoes;
DROP POLICY IF EXISTS "Users can delete own pragas_e_doencas_talhoes" ON pragas_e_doencas_talhoes;

-- Garantir que RLS está habilitado
ALTER TABLE pragas_e_doencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pragas_e_doencas_talhoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas SEGURAS para pragas_e_doencas
CREATE POLICY "Users can view only own pragas_e_doencas"
  ON pragas_e_doencas
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only own pragas_e_doencas"
  ON pragas_e_doencas
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only own pragas_e_doencas"
  ON pragas_e_doencas
  FOR UPDATE
  TO authenticated, anon
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only own pragas_e_doencas"
  ON pragas_e_doencas
  FOR DELETE
  TO authenticated, anon
  USING (auth.uid() = user_id);

-- Criar políticas SEGURAS para pragas_e_doencas_talhoes
CREATE POLICY "Users can view only own pragas_e_doencas_talhoes"
  ON pragas_e_doencas_talhoes
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only own pragas_e_doencas_talhoes"
  ON pragas_e_doencas_talhoes
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only own pragas_e_doencas_talhoes"
  ON pragas_e_doencas_talhoes
  FOR DELETE
  TO authenticated, anon
  USING (auth.uid() = user_id);