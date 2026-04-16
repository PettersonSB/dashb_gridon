-- Corrige a falta de permissão de exclusão (RLS DELETE) para os prospects
CREATE POLICY "Permitir exclusão pública temporária para prospects"
    ON prospects FOR DELETE
    USING (true);
