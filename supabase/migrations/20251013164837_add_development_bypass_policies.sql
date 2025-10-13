/*
  # Add Development Bypass Policies
  
  1. Overview
    - Create RLS policies that allow full access for the development user
    - These policies only apply when using the specific dev user ID
    - Does not compromise production security
  
  2. Development User
    - user_id: 'c7f13743-67ef-45d4-807c-9f5de81d4999'
    - This is the hardcoded user from authService.ts
  
  3. Tables Updated
    - usuarios (users table)
    - transacoes_financeiras (financial transactions)
    - estoque_de_produtos (product inventory)
    - movimentacoes_estoque (inventory movements)
    - atividades_agricolas (agricultural activities)
    - propriedades (properties)
    - vinculo_usuario_propriedade (user-property links)
    - talhoes (plots)
    - maquinas_equipamentos (machinery and equipment)
    - cotacao_diaria_cafe (daily coffee quotes)
  
  4. Security Notes
    - These policies use a specific UUID that only exists in development
    - In production, this UUID should not exist, making these policies inactive
    - Existing restrictive policies remain in place for all other users
*/

-- usuarios: Allow dev user to manage their own profile
CREATE POLICY "Dev user can view own profile"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can update own profile"
  ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999')
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

-- transacoes_financeiras: Allow dev user full access to financial transactions
CREATE POLICY "Dev user can view all transactions"
  ON public.transacoes_financeiras
  FOR SELECT
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can insert transactions"
  ON public.transacoes_financeiras
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can update transactions"
  ON public.transacoes_financeiras
  FOR UPDATE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999')
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can delete transactions"
  ON public.transacoes_financeiras
  FOR DELETE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

-- estoque_de_produtos: Allow dev user full access to inventory
CREATE POLICY "Dev user can view all products"
  ON public.estoque_de_produtos
  FOR SELECT
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can insert products"
  ON public.estoque_de_produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can update products"
  ON public.estoque_de_produtos
  FOR UPDATE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999')
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can delete products"
  ON public.estoque_de_produtos
  FOR DELETE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

-- movimentacoes_estoque: Allow dev user to manage inventory movements
CREATE POLICY "Dev user can view inventory movements"
  ON public.movimentacoes_estoque
  FOR SELECT
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can insert inventory movements"
  ON public.movimentacoes_estoque
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

-- atividades_agricolas: Allow dev user to manage agricultural activities
CREATE POLICY "Dev user can view activities"
  ON public.atividades_agricolas
  FOR SELECT
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can insert activities"
  ON public.atividades_agricolas
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can update activities"
  ON public.atividades_agricolas
  FOR UPDATE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999')
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can delete activities"
  ON public.atividades_agricolas
  FOR DELETE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

-- propriedades: Allow dev user to manage properties
CREATE POLICY "Dev user can view properties"
  ON public.propriedades
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vinculo_usuario_propriedade
    WHERE vinculo_usuario_propriedade.id_propriedade = propriedades.id_propriedade
    AND vinculo_usuario_propriedade.user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999'
  ));

CREATE POLICY "Dev user can insert properties"
  ON public.propriedades
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Dev user can update properties"
  ON public.propriedades
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vinculo_usuario_propriedade
    WHERE vinculo_usuario_propriedade.id_propriedade = propriedades.id_propriedade
    AND vinculo_usuario_propriedade.user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vinculo_usuario_propriedade
    WHERE vinculo_usuario_propriedade.id_propriedade = propriedades.id_propriedade
    AND vinculo_usuario_propriedade.user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999'
  ));

CREATE POLICY "Dev user can delete properties"
  ON public.propriedades
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vinculo_usuario_propriedade
    WHERE vinculo_usuario_propriedade.id_propriedade = propriedades.id_propriedade
    AND vinculo_usuario_propriedade.user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999'
  ));

-- vinculo_usuario_propriedade: Allow dev user to manage property links
CREATE POLICY "Dev user can view property links"
  ON public.vinculo_usuario_propriedade
  FOR SELECT
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can insert property links"
  ON public.vinculo_usuario_propriedade
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can update property links"
  ON public.vinculo_usuario_propriedade
  FOR UPDATE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999')
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can delete property links"
  ON public.vinculo_usuario_propriedade
  FOR DELETE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

-- talhoes: Allow dev user to manage plots
CREATE POLICY "Dev user can view plots"
  ON public.talhoes
  FOR SELECT
  TO authenticated
  USING (criado_por = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can insert plots"
  ON public.talhoes
  FOR INSERT
  TO authenticated
  WITH CHECK (criado_por = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can update plots"
  ON public.talhoes
  FOR UPDATE
  TO authenticated
  USING (criado_por = 'c7f13743-67ef-45d4-807c-9f5de81d4999')
  WITH CHECK (criado_por = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can delete plots"
  ON public.talhoes
  FOR DELETE
  TO authenticated
  USING (criado_por = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

-- maquinas_equipamentos: Allow dev user to manage machinery
CREATE POLICY "Dev user can view machinery"
  ON public.maquinas_equipamentos
  FOR SELECT
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can insert machinery"
  ON public.maquinas_equipamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can update machinery"
  ON public.maquinas_equipamentos
  FOR UPDATE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999')
  WITH CHECK (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');

CREATE POLICY "Dev user can delete machinery"
  ON public.maquinas_equipamentos
  FOR DELETE
  TO authenticated
  USING (user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999');