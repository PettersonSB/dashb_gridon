-- ============================================
-- Gridon+ Migration: Link Prospect to Client and Approved Budget
-- ============================================

-- 1. Vincular cliente ao prospect de origem
ALTER TABLE client_accounts 
  ADD COLUMN IF NOT EXISTS prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL;

-- 2. Registrar no prospect qual client_account foi criado
ALTER TABLE prospects 
  ADD COLUMN IF NOT EXISTS converted_to_client_id UUID;

-- 3. Registrar qual orçamento o cliente fechou
ALTER TABLE client_accounts
  ADD COLUMN IF NOT EXISTS closed_budget_id UUID REFERENCES solar_budgets(id) ON DELETE SET NULL;

-- 4. Índices para melhorar a performance das queries
CREATE INDEX IF NOT EXISTS idx_client_accounts_prospect_id ON client_accounts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospects_converted_client ON prospects(converted_to_client_id);
