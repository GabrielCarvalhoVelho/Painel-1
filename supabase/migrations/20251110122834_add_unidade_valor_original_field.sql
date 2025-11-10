/*
  # Add Original Value Unit Field to Products Table

  1. Changes
    - Add `unidade_valor_original` column to `estoque_de_produtos` table
      - Stores the unit that the value/price was originally entered for (e.g., 'L', 'kg', 'ton')
      - This allows proper price conversion when displaying products in different units
    
  2. Data Migration
    - Set `unidade_valor_original` to current `unidade_de_medida` for all existing products
    - This assumes existing prices were entered for their current storage unit
  
  3. Notes
    - This field is essential for correctly displaying per-unit prices when quantities are auto-scaled
    - For example: If a product was purchased at R$ 100 per liter (L), but the system displays in milliliters (mL),
      the price should be converted proportionally to R$ 0.10 per mL
*/

-- Add the new column to store the original unit that the value was entered for
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estoque_de_produtos' AND column_name = 'unidade_valor_original'
  ) THEN
    ALTER TABLE estoque_de_produtos 
    ADD COLUMN unidade_valor_original text;
  END IF;
END $$;

-- Migrate existing data: set unidade_valor_original to the current unidade_de_medida
-- This assumes that existing values were entered for their current unit
UPDATE estoque_de_produtos
SET unidade_valor_original = unidade_de_medida
WHERE unidade_valor_original IS NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN estoque_de_produtos.unidade_valor_original IS 
  'Original unit that the valor_unitario (unit price) was entered for. Used for proper price conversion when displaying in different units.';
