-- Adição de campos financeiros e de customização de pagamento na tabela solar_budgets
ALTER TABLE solar_budgets 
ADD COLUMN IF NOT EXISTS labor_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS engineering_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS profit_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS tax_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_mode TEXT DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS cash_manual_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pix_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pix_mode TEXT DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS pix_manual_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pix_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS financing_options JSONB DEFAULT '[]'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN solar_budgets.cash_mode IS 'Modo de cálculo para pagamento à vista: automatic ou manual';
COMMENT ON COLUMN solar_budgets.pix_mode IS 'Modo de cálculo para pagamento via Pix: automatic ou manual';
COMMENT ON COLUMN solar_budgets.financing_options IS 'Lista de opções de parcelamento, incluindo modos de cálculo e valores manuais';
