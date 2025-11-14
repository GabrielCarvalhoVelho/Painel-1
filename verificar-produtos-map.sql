-- Query para verificar TODOS os produtos MAP
SELECT 
  id,
  created_at::timestamp,
  nome_do_produto,
  quantidade_inicial,
  unidade_de_medida,
  valor_total,
  valor_medio,
  fornecedor,
  user_id
FROM estoque_de_produtos
WHERE nome_do_produto LIKE '%NPK%25-05-20%'
  OR nome_do_produto LIKE '%MAP%'
ORDER BY created_at;

-- Query para contar
SELECT 
  COUNT(*) as total_registros,
  SUM(quantidade_inicial) as soma_quantidade,
  SUM(valor_total) as soma_valor_total,
  CASE 
    WHEN SUM(quantidade_inicial) > 0 
    THEN SUM(valor_total) / SUM(quantidade_inicial)
    ELSE 0
  END as media_ponderada
FROM estoque_de_produtos
WHERE nome_do_produto LIKE '%NPK%25-05-20%'
  OR nome_do_produto LIKE '%MAP%';
