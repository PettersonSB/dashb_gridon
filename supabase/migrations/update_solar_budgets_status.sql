-- Atualização da tabela de orçamentos para suportar status de funil
ALTER TABLE solar_budgets 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' 
CHECK (status IN ('ativo', 'suspenso', 'vencido', 'fechado'));
