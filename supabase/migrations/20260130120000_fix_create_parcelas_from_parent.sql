-- Migration: Corrige ambiguidade de coluna na função create_parcelas_from_parent
-- Data: 2026-01-30

CREATE OR REPLACE FUNCTION public.create_parcelas_from_parent(p_parent_id uuid)
RETURNS TABLE(id_transacao uuid) AS $$
DECLARE
  parent RECORD;
  n integer;
  total_cents bigint;
  per_cent bigint;
  remainder_cents bigint;
  i integer;
  amount numeric;
  base_date date;
  new_id uuid;
BEGIN
  -- Buscar o registro pai com alias para evitar ambiguidade com o OUT param id_transacao
  SELECT tf.* INTO parent
  FROM public.transacoes_financeiras tf
  WHERE tf.id_transacao = p_parent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transação pai não encontrada: %', p_parent_id;
  END IF;

  n := COALESCE(parent.numero_parcelas, 0);
  IF n <= 1 THEN
    UPDATE public.transacoes_financeiras t
    SET is_completed = true
    WHERE t.id_transacao = p_parent_id;
    RETURN;
  END IF;

  -- Calcular em centavos para evitar problemas de ponto flutuante
  total_cents := ROUND(COALESCE(parent.valor, 0) * 100);
  per_cent := total_cents / n;
  remainder_cents := total_cents - (per_cent * n);

  base_date := COALESCE(parent.data_agendamento_pagamento, parent.data_transacao, current_date);

  FOR i IN 1..n LOOP
    amount := (per_cent::numeric) / 100;
    IF i = 1 THEN
      amount := amount + (remainder_cents::numeric / 100);
    END IF;

    new_id := gen_random_uuid();

    INSERT INTO public.transacoes_financeiras (
      id_transacao,
      user_id,
      tipo_transacao,
      valor,
      data_transacao,
      descricao,
      pagador_recebedor,
      categoria,
      forma_pagamento_recebimento,
      status,
      data_agendamento_pagamento,
      numero_parcelas,
      id_transacao_pai,
      parcela,
      eh_transacao_pai,
      propriedade_id,
      data_registro
    ) VALUES (
      new_id,
      parent.user_id,
      parent.tipo_transacao,
      amount,
      (base_date + (i - 1) * INTERVAL '1 month')::date,
      parent.descricao,
      parent.pagador_recebedor,
      parent.categoria,
      parent.forma_pagamento_recebimento,
      'Agendado',
      (base_date + (i - 1) * INTERVAL '1 month')::date,
      n,
      p_parent_id,
      concat(i, '/', n),
      false,
      parent.propriedade_id,
      now()
    );

    -- atribui valor do OUT param e retorna a linha
    id_transacao := new_id;
    RETURN NEXT;
  END LOOP;

  UPDATE public.transacoes_financeiras t
  SET eh_transacao_pai = true,
      is_completed = true
  WHERE t.id_transacao = p_parent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
