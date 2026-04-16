-- Script para migrar clientes antigos da tabela solar_budgets para a nova tabela prospects

DO $$
DECLARE
    -- Variável para guardar o registro do loop
    r RECORD;
    -- Variável para guardar o ID do prospect encontrado ou recém-criado
    v_prospect_id UUID;
BEGIN
    -- Vamos percorrer todos os orçamentos que ainda não estão amarrados a um prospect
    FOR r IN 
        SELECT id, customer_name, customer_phone, customer_email, customer_city, customer_state, customer_neighborhood
        FROM solar_budgets 
        WHERE prospect_id IS NULL AND customer_name IS NOT NULL AND customer_phone IS NOT NULL
    LOOP
        -- Vamos verificar se esse telefone já foi cadastrado na tabela de prospects
        SELECT id INTO v_prospect_id
        FROM prospects
        WHERE phone = r.customer_phone
        LIMIT 1;

        -- Se não tiver prospect com esse número, a gente cria agora mesmo
        IF v_prospect_id IS NULL THEN
            INSERT INTO prospects (name, phone, email, city, state, neighborhood, status)
            VALUES (
                r.customer_name, 
                r.customer_phone, 
                r.customer_email, 
                r.customer_city, 
                r.customer_state, 
                r.customer_neighborhood, 
                'em contato' -- Como já tem orçamento, o status não é tão 'novo' assim
            )
            RETURNING id INTO v_prospect_id;
        END IF;

        -- Por fim, atualizamos o orçamento antigo colocando o prospect_id nele
        UPDATE solar_budgets 
        SET prospect_id = v_prospect_id
        WHERE id = r.id;

    END LOOP;
END
$$;
