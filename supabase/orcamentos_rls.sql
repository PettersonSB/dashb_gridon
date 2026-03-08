-- ============================================
-- Gridon Solar — RLS para tabelas de orçamento
-- Execute no SQL Editor do Supabase
-- ============================================

-- Habilitar RLS nas tabelas de orçamento
ALTER TABLE solar_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_brands ENABLE ROW LEVEL SECURITY;

-- Leitura pública (para que o link /orcamento/:id funcione sem login)
CREATE POLICY "public_read" ON solar_budgets FOR SELECT USING (true);
CREATE POLICY "public_read" ON solar_kits FOR SELECT USING (true);
CREATE POLICY "public_read" ON solar_brands FOR SELECT USING (true);

-- Escrita apenas para usuários autenticados (dashboard)
CREATE POLICY "auth_write" ON solar_budgets FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON solar_kits FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON solar_brands FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
