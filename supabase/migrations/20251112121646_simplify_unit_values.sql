/*
  # Simplify Unit Values - Remove Descriptors

  1. Changes
    - Update `unidade_de_medida` values to remove Portuguese descriptors
    - Change "ton (tonelada)" to "ton"
    - Change "un (unidade)" to "un"
    - Update `unidade_valor_original` to maintain consistency for price calculations
    - Apply changes across all related tables that store unit information
  
  2. Tables Updated
    - estoque_de_produtos: Main product inventory table
    - movimentacao_estoque: Product movement history (if unit field exists)
    - lancamento_produtos: Activity product entries (if unit field exists)
  
  3. Notes
    - This migration ensures backward compatibility by normalizing all unit values
    - Existing records with old format will be converted to simplified format
    - Display logic already handles both formats via formatUnit.ts
    - No data is lost, only format is simplified
*/

-- Update estoque_de_produtos table: unidade_de_medida field
UPDATE estoque_de_produtos
SET unidade_de_medida = 'ton'
WHERE unidade_de_medida = 'ton (tonelada)';

UPDATE estoque_de_produtos
SET unidade_de_medida = 'un'
WHERE unidade_de_medida = 'un (unidade)';

-- Update estoque_de_produtos table: unidade_valor_original field
UPDATE estoque_de_produtos
SET unidade_valor_original = 'ton'
WHERE unidade_valor_original = 'ton (tonelada)';

UPDATE estoque_de_produtos
SET unidade_valor_original = 'un'
WHERE unidade_valor_original = 'un (unidade)';

-- Update lancamento_produtos table: quantidade_un field (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lancamento_produtos' AND column_name = 'quantidade_un'
  ) THEN
    UPDATE lancamento_produtos
    SET quantidade_un = 'ton'
    WHERE quantidade_un = 'ton (tonelada)';
    
    UPDATE lancamento_produtos
    SET quantidade_un = 'un'
    WHERE quantidade_un = 'un (unidade)';
  END IF;
END $$;

-- Log the changes for verification
DO $$
DECLARE
  ton_count INT;
  un_count INT;
BEGIN
  SELECT COUNT(*) INTO ton_count FROM estoque_de_produtos WHERE unidade_de_medida = 'ton';
  SELECT COUNT(*) INTO un_count FROM estoque_de_produtos WHERE unidade_de_medida = 'un';
  
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Products with unit "ton": %', ton_count;
  RAISE NOTICE 'Products with unit "un": %', un_count;
END $$;
