-- Permite inserção anônima na tabela solar_budgets
-- Isso é necessário para orçamentos criados quando a sessão expirar ou for inexistente (caindo para o role anon)
CREATE POLICY "anon_insert" ON public.solar_budgets 
FOR INSERT 
TO anon 
WITH CHECK (true);
