-- Script para corrigir produtos armazenados com unidades não-padrão
-- Produtos devem estar em mg (massa) ou mL (volume) no banco de dados

-- 1. Corrigir produtos em toneladas (ton → mg)
UPDATE estoque_de_produtos
SET 
  quantidade_em_estoque = quantidade_em_estoque * 1000000000,
  quantidade_inicial = quantidade_inicial * 1000000000,
  unidade_de_medida = 'mg'
WHERE unidade_de_medida = 'ton';

-- 2. Corrigir produtos em quilogramas (kg → mg)
UPDATE estoque_de_produtos
SET 
  quantidade_em_estoque = quantidade_em_estoque * 1000000,
  quantidade_inicial = quantidade_inicial * 1000000,
  unidade_de_medida = 'mg'
WHERE unidade_de_medida = 'kg';

-- 3. Corrigir produtos em gramas (g → mg)
UPDATE estoque_de_produtos
SET 
  quantidade_em_estoque = quantidade_em_estoque * 1000,
  quantidade_inicial = quantidade_inicial * 1000,
  unidade_de_medida = 'mg'
WHERE unidade_de_medida = 'g';

-- 4. Corrigir produtos em litros (L → mL)
UPDATE estoque_de_produtos
SET 
  quantidade_em_estoque = quantidade_em_estoque * 1000,
  quantidade_inicial = quantidade_inicial * 1000,
  unidade_de_medida = 'mL'
WHERE unidade_de_medida = 'L';

-- 5. Atualizar movimentações_estoque com unidades não-padrão
-- Corrigir movimentações em toneladas
UPDATE movimentacoes_estoque
SET 
  quantidade = quantidade * 1000000000,
  unidade_momento = 'mg'
WHERE unidade_momento = 'ton';

-- Corrigir movimentações em quilogramas
UPDATE movimentacoes_estoque
SET 
  quantidade = quantidade * 1000000,
  unidade_momento = 'mg'
WHERE unidade_momento = 'kg';

-- Corrigir movimentações em gramas
UPDATE movimentacoes_estoque
SET 
  quantidade = quantidade * 1000,
  unidade_momento = 'mg'
WHERE unidade_momento = 'g';

-- Corrigir movimentações em litros
UPDATE movimentacoes_estoque
SET 
  quantidade = quantidade * 1000,
  unidade_momento = 'mL'
WHERE unidade_momento = 'L';

-- Verificar resultados
SELECT 
  'estoque_de_produtos' as tabela,
  unidade_de_medida,
  COUNT(*) as total
FROM estoque_de_produtos
GROUP BY unidade_de_medida
UNION ALL
SELECT 
  'movimentacoes_estoque' as tabela,
  unidade_momento as unidade_de_medida,
  COUNT(*) as total
FROM movimentacoes_estoque
WHERE unidade_momento IS NOT NULL
GROUP BY unidade_momento
ORDER BY tabela, unidade_de_medida;
