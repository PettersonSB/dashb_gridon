-- ============================================
-- Gridon Dashboard — Migração: team_members
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Tabela de membros da equipe
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'vendedor',   -- 'owner', 'admin', 'vendedor'
    permissions JSONB NOT NULL DEFAULT '{}', -- { site: [...], budget: [...], devices: [...] }
    status TEXT NOT NULL DEFAULT 'ativo',    -- 'ativo', 'suspenso'
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas usuários autenticados
CREATE POLICY "team_read" ON team_members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Escrita: apenas usuários autenticados (validação real é na Edge Function)
CREATE POLICY "team_write" ON team_members
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 3. Inserir configuração default de limite de membros
INSERT INTO global_settings (key, value)
VALUES ('team_max_members', '6')
ON CONFLICT (key) DO NOTHING;
