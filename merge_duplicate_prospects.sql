-- Script para unificar prospects duplicados na tabela prospects
-- E normalizar todos os números de telefone para conter apenas dígitos

DO $$
DECLARE
    r_dup RECORD;
    r_sub RECORD;
    v_master_id UUID;
    v_count INT;
BEGIN
    RAISE NOTICE 'Iniciando verificação e deduplicação de prospects...';

    -- 1. Identificar prospects que possuem números de telefone repetidos (desconsiderando formatação)
    FOR r_dup IN 
        SELECT regexp_replace(phone, '\D', '', 'g') as normalized_phone, COUNT(*) as qty
        FROM prospects
        GROUP BY regexp_replace(phone, '\D', '', 'g')
        HAVING COUNT(*) > 1 AND regexp_replace(phone, '\D', '', 'g') != ''
    LOOP
        -- Encontrar o prospect "master" (o mais antigo criado nesse grupo)
        SELECT id INTO v_master_id
        FROM prospects
        WHERE regexp_replace(phone, '\D', '', 'g') = r_dup.normalized_phone
        ORDER BY created_at ASC
        LIMIT 1;

        RAISE NOTICE 'Grupo duplicado encontrado para o telefone %. Master ID: %', r_dup.normalized_phone, v_master_id;

        -- Associar todos os orçamentos (solar_budgets) dos prospects duplicados ao prospect "master"
        FOR r_sub IN
            SELECT id, name FROM prospects
            WHERE regexp_replace(phone, '\D', '', 'g') = r_dup.normalized_phone
              AND id != v_master_id
        LOOP
            RAISE NOTICE '  -> Removendo duplicado: % (ID: %). Mesclando orçamentos...', r_sub.name, r_sub.id;
            
            UPDATE solar_budgets
            SET prospect_id = v_master_id
            WHERE prospect_id = r_sub.id;

            -- Deletar o prospect duplicado
            DELETE FROM prospects
            WHERE id = r_sub.id;
        END LOOP;
    END LOOP;

    -- 2. Normalizar todos os telefones restantes na tabela de prospects para conter apenas dígitos
    UPDATE prospects
    SET phone = regexp_replace(phone, '\D', '', 'g')
    WHERE phone ~ '\D'; -- Se contiver algum caracter que não seja dígito

    -- 3. Normalizar também os telefones de clientes nos orçamentos se necessário para manter consistência
    UPDATE solar_budgets
    SET customer_phone = regexp_replace(customer_phone, '\D', '', 'g')
    WHERE customer_phone ~ '\D';

    RAISE NOTICE 'Deduplicação e normalização concluídas com sucesso!';
END
$$;
