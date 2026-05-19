-- ============================================
-- FIX: Corrigir RLS de solar_budgets para membros da equipe
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE solar_budgets ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas antigas que possam causar conflito
DROP POLICY IF EXISTS "Orçamentos são visíveis para todos os usuários autenticados" ON solar_budgets;
DROP POLICY IF EXISTS "Usuários logados podem criar orçamentos" ON solar_budgets;
DROP POLICY IF EXISTS "Usuários logados podem atualizar orçamentos" ON solar_budgets;
DROP POLICY IF EXISTS "Usuários logados podem deletar orçamentos" ON solar_budgets;
DROP POLICY IF EXISTS "public_read" ON solar_budgets;
DROP POLICY IF EXISTS "auth_write" ON solar_budgets;
DROP POLICY IF EXISTS "allow_anon_update_status" ON solar_budgets;

-- 3. Recriar as políticas de forma limpa e correta

-- Leitura pública (para que o link /orcamento/:id funcione sem login)
CREATE POLICY "public_read" ON solar_budgets 
    FOR SELECT USING (true);

-- INSERT: qualquer usuário autenticado pode criar
CREATE POLICY "auth_insert" ON solar_budgets 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- UPDATE: qualquer usuário autenticado pode atualizar
CREATE POLICY "auth_update" ON solar_budgets 
    FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- DELETE: qualquer usuário autenticado pode deletar
CREATE POLICY "auth_delete" ON solar_budgets 
    FOR DELETE 
    TO authenticated 
    USING (true);

-- 4. Manter a permissão para anon atualizar status para 'visualizado' (página pública)
GRANT UPDATE ON solar_budgets TO anon;

CREATE POLICY "anon_update_status" ON solar_budgets 
    FOR UPDATE 
    TO anon 
    USING (true) 
    WITH CHECK (status = 'visualizado');
