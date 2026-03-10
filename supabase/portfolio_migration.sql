-- Criar tabela de Portfólio
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON portfolio_items
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users only" ON portfolio_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Inserir Bucket de Storage se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar RLS do Bucket
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'portfolio-images');

CREATE POLICY "Auth Insert" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth Delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');
