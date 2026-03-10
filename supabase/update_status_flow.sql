-- =========================================================================
-- Atualização do Ciclo de Vida do Orçamento (Gridon Solar)
-- Execute este script no SQL Editor do Supabase para corrigir o status.
-- =========================================================================

-- 1. Remover a restrição antiga (se existir) de check de status ('ativo', 'suspenso', etc)
-- Caso você não tenha um check contraint estrito, o bloco abaixo pode falhar pacificamente,
-- mas garante que a alteração de status seja permitida.
ALTER TABLE solar_budgets DROP CONSTRAINT IF EXISTS solar_budgets_status_check;

-- 2. Alterar o valor padrão da coluna para o novo status 'novo'
ALTER TABLE solar_budgets ALTER COLUMN status SET DEFAULT 'novo';

-- 3. Opcional (Recomendado): Forçar uma constraint de texto alinhada com os novos tipos
ALTER TABLE solar_budgets ADD CONSTRAINT solar_budgets_status_check 
CHECK (status IN ('novo', 'em analise', 'visualizado', 'aprovado', 'recusado', 'suspenso', 'vencido'));

-- 4. Migrar os orçamentos legados ('ativo' para 'novo' ou 'fechado' para 'aprovado')
UPDATE solar_budgets SET status = 'novo' WHERE status = 'ativo';
UPDATE solar_budgets SET status = 'aprovado' WHERE status = 'fechado';

-- 5. Conceder permissão na tabela para o webhook de visualização funcionar na página pública
GRANT UPDATE ON solar_budgets TO anon;

-- Remover a política antiga (caso tenha sido criada anteriormente com outro nome)
DROP POLICY IF EXISTS "allow_anon_update_status" ON solar_budgets;
DROP POLICY IF EXISTS "anon_viewed" ON solar_budgets;

-- 6. Criar a política de segurança RLS (apenas permitindo mudar para 'visualizado')
CREATE POLICY "allow_anon_update_status" ON solar_budgets 
FOR UPDATE USING (true) WITH CHECK (status = 'visualizado');
