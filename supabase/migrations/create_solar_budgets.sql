-- Criação da tabela de orçamentos de clientes (solar_budgets)
CREATE TABLE IF NOT EXISTS solar_budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Dados do Cliente
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    customer_state TEXT NOT NULL,
    customer_email TEXT,
    
    -- Informações da Instalação
    installation_location TEXT NOT NULL CHECK (installation_location IN ('telhado fibrocimento', 'telhado colonial', 'telhado de concreto', 'telhado zinco', 'laje', 'solo')),
    construction_type TEXT NOT NULL CHECK (construction_type IN ('residencial', 'comercial', 'industrial', 'predio residencial', 'predio comercial', 'rural')),
    supply_type TEXT NOT NULL CHECK (supply_type IN ('monofasico', 'bifasico', 'trifasico')),
    installation_warranty INTEGER NOT NULL,
    
    -- Proposta Comercial
    kit_id UUID NOT NULL REFERENCES solar_kits(id) ON DELETE RESTRICT,
    proposal_validity_days INTEGER NOT NULL,
    installation_notes TEXT, -- Editor de texto rico

    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Políticas de Segurança (Row Level Security)

ALTER TABLE solar_budgets ENABLE ROW LEVEL SECURITY;

-- Permitir leitura de orçamentos por usuários autenticados
DROP POLICY IF EXISTS "Orçamentos são visíveis para todos os usuários autenticados" ON solar_budgets;
CREATE POLICY "Orçamentos são visíveis para todos os usuários autenticados" 
ON solar_budgets FOR SELECT 
TO authenticated 
USING (true);

-- Apenas usuários logados podem criar orçamentos (e atribuir o criador)
DROP POLICY IF EXISTS "Usuários logados podem criar orçamentos" ON solar_budgets;
CREATE POLICY "Usuários logados podem criar orçamentos" 
ON solar_budgets FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Atualização e Deleção por autenticados
DROP POLICY IF EXISTS "Usuários logados podem atualizar orçamentos" ON solar_budgets;
CREATE POLICY "Usuários logados podem atualizar orçamentos" 
ON solar_budgets FOR UPDATE
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Usuários logados podem deletar orçamentos" ON solar_budgets;
CREATE POLICY "Usuários logados podem deletar orçamentos" 
ON solar_budgets FOR DELETE
TO authenticated 
USING (true);
