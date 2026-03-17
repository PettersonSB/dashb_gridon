CREATE TABLE IF NOT EXISTS global_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Leitura pública, Escrita apenas autenticada
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON global_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON global_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Enable update for authenticated users only" ON global_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON global_settings
    FOR DELETE USING (auth.role() = 'authenticated');
    
--- Inserir dado padrão para o tema do site principal
INSERT INTO global_settings (key, value) VALUES
('site_theme', 'dark')
ON CONFLICT (key) DO NOTHING;
