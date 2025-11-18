-- ============================================================================
-- Migration: Fix valor_medio trigger to update on quantidade_em_estoque changes
-- Data: 2025-11-18
-- Descrição: Ajusta o trigger de valor_medio para recalcular quando quantidade_em_estoque mudar
-- ============================================================================

-- Remove o trigger antigo
DROP TRIGGER IF EXISTS trigger_atualizar_valor_medio ON estoque_de_produtos;

-- Recria o trigger para disparar também quando quantidade_em_estoque mudar
CREATE TRIGGER trigger_atualizar_valor_medio
  BEFORE INSERT OR UPDATE OF valor_total, quantidade_inicial, quantidade_em_estoque, unidade_valor_original
  ON estoque_de_produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_valor_medio();

-- ============================================================================
-- Comentário explicativo
-- ============================================================================
COMMENT ON TRIGGER trigger_atualizar_valor_medio ON estoque_de_produtos IS 
'Recalcula valor_medio automaticamente quando valor_total, quantidade_inicial, quantidade_em_estoque ou unidade_valor_original mudam. Isso garante que saídas de estoque (que alteram quantidade_em_estoque) também recalculem o valor médio.';
