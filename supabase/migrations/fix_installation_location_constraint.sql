-- ============================================
-- FIX: Remover CHECK constraint em installation_location
-- ============================================
-- O frontend permite que o admin adicione locais de instalação customizados,
-- mas a tabela original tem um CHECK que só aceita valores fixos.
-- Isso causa erro silencioso ao criar orçamentos com locais customizados.
-- ============================================

-- 1. Remover a constraint original que limita os valores de installation_location
ALTER TABLE solar_budgets DROP CONSTRAINT IF EXISTS solar_budgets_installation_location_check;

-- 2. Remover a constraint original que limita os valores de construction_type (mesma lógica)
ALTER TABLE solar_budgets DROP CONSTRAINT IF EXISTS solar_budgets_construction_type_check;

-- 3. Remover a constraint original que limita os valores de supply_type (mesma lógica)
ALTER TABLE solar_budgets DROP CONSTRAINT IF EXISTS solar_budgets_supply_type_check;
