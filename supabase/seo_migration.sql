CREATE TABLE IF NOT EXISTS page_seo_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_name TEXT UNIQUE NOT NULL, -- ex: 'home', 'blog'
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT,
    og_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Leitura pública, Escrita apenas autenticada
ALTER TABLE page_seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON page_seo_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON page_seo_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Enable update for authenticated users only" ON page_seo_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON page_seo_settings
    FOR DELETE USING (auth.role() = 'authenticated');
    
--- Inserir dados padrão baseados no conteúdo atual
INSERT INTO page_seo_settings (page_name, title, description, keywords, og_image) VALUES
('home', 'Gridon Energia Solar', 'A Gridon Energia Solar oferece soluções completas em energia fotovoltaica para residências e empresas em Brasília. Economize até 95% na conta de luz. Orçamento grátis!', 'energia solar, painéis solares, fotovoltaica, Brasília, DF, economia energia, sustentabilidade', 'https://storage.googleapis.com/gpt-engineer-file-uploads/YeAzsxerr9WCwtEyIX6LXraWO4N2/social-images/social-1769828167180-unnamed.png'),
('blog', 'Blog — Gridon Energia Solar', 'Artigos, guias e novidades sobre energia fotovoltaica, economia e sustentabilidade.', 'blog energia solar, artigos fotovoltaica, dicas economia energia', 'https://storage.googleapis.com/gpt-engineer-file-uploads/YeAzsxerr9WCwtEyIX6LXraWO4N2/social-images/social-1769828167180-unnamed.png')
ON CONFLICT (page_name) DO NOTHING;
