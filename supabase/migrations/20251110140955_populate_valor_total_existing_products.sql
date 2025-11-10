/*
  # Populate valor_total for existing products

  1. Updates
    - Calculate and set `valor_total` for all existing products where it's NULL
    - Formula: valor_total = quantidade_em_estoque * valor_unitario

  2. Notes
    - Only updates products where valor_total is NULL
    - Handles NULL values in quantidade_em_estoque and valor_unitario safely
*/

-- Update existing products to populate valor_total
UPDATE estoque_de_produtos
SET valor_total = COALESCE(quantidade_em_estoque, 0) * COALESCE(valor_unitario, 0)
WHERE valor_total IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN estoque_de_produtos.valor_total IS 
  'Valor total do produto quando cadastrado (quantidade * valor_unitario). O valor atual em estoque é calculado subtraindo as saídas registradas em movimentacoes_estoque';
