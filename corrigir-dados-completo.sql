-- ============================================
-- CORREÇÃO COMPLETA DOS DADOS
-- ============================================

-- 1️⃣ Criar a função de trigger (se não existir)
CREATE OR REPLACE FUNCTION calcular_valor_medio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calcula valor_medio = valor_total / quantidade_inicial
  IF NEW.quantidade_inicial IS NULL OR NEW.quantidade_inicial = 0 THEN
    NEW.valor_medio := 0;
  ELSIF NEW.valor_total IS NULL THEN
    NEW.valor_medio := 0;
  ELSE
    NEW.valor_medio := NEW.valor_total / NEW.quantidade_inicial;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2️⃣ Criar o trigger (se não existir)
DROP TRIGGER IF EXISTS trigger_calcular_valor_medio ON estoque_de_produtos;

CREATE TRIGGER trigger_calcular_valor_medio
  BEFORE INSERT OR UPDATE ON estoque_de_produtos
  FOR EACH ROW
  EXECUTE FUNCTION calcular_valor_medio();

-- 3️⃣ CORRIGIR produtos com unidade_de_medida = 'mg' mas que deveriam ser outra unidade
-- Baseado na unidade_valor_original

-- Caso 1: Quelato de boro (id 175) - está em mg mas deveria estar em g
UPDATE estoque_de_produtos
SET 
  unidade_de_medida = unidade_valor_original,
  quantidade_inicial = quantidade_inicial,  -- Trigger recalcula valor_medio
  quantidade_em_estoque = quantidade_em_estoque
WHERE id = 175;

-- 4️⃣ RECALCULAR todos os valores médios para garantir consistência
UPDATE estoque_de_produtos
SET valor_medio = CASE 
  WHEN quantidade_inicial > 0 AND valor_total IS NOT NULL 
  THEN valor_total / quantidade_inicial
  ELSE 0
END;

-- 5️⃣ VERIFICAÇÃO FINAL - Ver todos os produtos NPK
SELECT 
  id,
  nome_do_produto,
  quantidade_inicial,
  unidade_de_medida,
  unidade_valor_original,
  valor_total,
  valor_medio,
  CASE 
    WHEN quantidade_inicial > 0 AND valor_total IS NOT NULL 
    THEN valor_total / quantidade_inicial
    ELSE 0
  END as valor_medio_esperado
FROM estoque_de_produtos
WHERE nome_do_produto LIKE '%NPK%25-05-20%'
ORDER BY created_at;

-- 6️⃣ VERIFICAR média ponderada do grupo NPK 25-05-20
SELECT 
  nome_do_produto,
  COUNT(*) as total_produtos,
  SUM(quantidade_inicial) as soma_quantidade,
  SUM(valor_total) as soma_valor_total,
  CASE 
    WHEN SUM(quantidade_inicial) > 0 
    THEN SUM(valor_total) / SUM(quantidade_inicial)
    ELSE 0
  END as media_ponderada_grupo
FROM estoque_de_produtos
WHERE nome_do_produto LIKE '%NPK%25-05-20%'
GROUP BY nome_do_produto;

-- 7️⃣ VER TODOS OS PRODUTOS DO USUÁRIO
SELECT 
  id,
  nome_do_produto,
  marca_ou_fabricante,
  quantidade_inicial,
  unidade_de_medida,
  unidade_valor_original,
  valor_total,
  valor_medio
FROM estoque_de_produtos
WHERE user_id = 'c7f13743-67ef-45d4-807c-9f5de81d4999'
ORDER BY created_at DESC;
