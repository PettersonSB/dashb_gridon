-- Tabela de Prospects (Leads/Clientes Futuros)
CREATE TABLE prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT,
    state TEXT,
    neighborhood TEXT,
    status TEXT NOT NULL DEFAULT 'novo', -- 'novo', 'em contato', 'negociando', 'ganho', 'perdido'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) para prospects
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública temporária para prospects"
    ON prospects FOR SELECT
    USING (true);

CREATE POLICY "Permitir inserção pública temporária para prospects"
    ON prospects FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir atualização pública temporária para prospects"
    ON prospects FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- (Opcional) Adicionar chave de ligação na tabela de orçamentos se ela já existir
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE  schemaname = 'public'
        AND    tablename  = 'solar_budgets'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name='solar_budgets' AND column_name='prospect_id'
        ) THEN
            ALTER TABLE solar_budgets ADD COLUMN prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL;
        END IF;
    END IF;
END
$$;
