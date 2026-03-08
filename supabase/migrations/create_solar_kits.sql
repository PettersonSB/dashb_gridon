-- Criação da tabela de marcas de equipamentos fotovoltaicos
CREATE TABLE IF NOT EXISTS solar_brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('equipamento', 'placa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserção de algumas marcas comuns para facilitar o uso inicial
INSERT INTO solar_brands (name, type) VALUES
('Growatt', 'equipamento'),
('Deye', 'equipamento'),
('Solis', 'equipamento'),
('Hoymiles', 'equipamento'),
('WEG', 'equipamento'),
('BYD', 'placa'),
('Canadian Solar', 'placa'),
('Jinko Solar', 'placa'),
('Trina Solar', 'placa'),
('DAH Solar', 'placa');

-- Criação da tabela de kits solares (orçamentos base)
CREATE TABLE IF NOT EXISTS solar_kits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    system_type TEXT NOT NULL CHECK (system_type IN ('On Grid', 'Off Grid', 'Híbrido', 'Backup Box')),
    equipment_type TEXT NOT NULL CHECK (equipment_type IN ('Inversor', 'Inversor Híbrido', 'Micro Inversor', 'Wallbox')),
    equipment_brand_id UUID REFERENCES solar_brands(id),
    equipment_warranty INTEGER,
    estimated_generation NUMERIC, -- Pode ser nulo se for Wallbox
    panels_count INTEGER NOT NULL,
    panel_power NUMERIC NOT NULL,
    panel_brand_id UUID REFERENCES solar_brands(id),
    panel_warranty INTEGER,
    system_power NUMERIC NOT NULL,
    kit_price NUMERIC NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Atendimento a quem já rodou o script antes (adicionar colunas se faltarem)
DO $$
BEGIN
    BEGIN
        ALTER TABLE solar_kits ADD COLUMN image_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column image_url already exists in solar_kits.';
    END;
    
    BEGIN
        ALTER TABLE solar_kits ADD COLUMN description TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column description already exists in solar_kits.';
    END;

    BEGIN
        ALTER TABLE solar_kits ADD COLUMN equipment_warranty INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column equipment_warranty already exists in solar_kits.';
    END;

    BEGIN
        ALTER TABLE solar_kits ADD COLUMN panel_warranty INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column panel_warranty already exists in solar_kits.';
    END;
END $$;

-- Políticas de Segurança (Row Level Security)

-- Políticas para solar_brands
ALTER TABLE solar_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marcas são visíveis para todos os usuários autenticados" ON solar_brands;
CREATE POLICY "Marcas são visíveis para todos os usuários autenticados" 
ON solar_brands FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Apenas usuários logados podem criar novas marcas" ON solar_brands;
CREATE POLICY "Apenas usuários logados podem criar novas marcas" 
ON solar_brands FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Políticas para solar_kits
ALTER TABLE solar_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kits são visíveis para todos os usuários autenticados" ON solar_kits;
CREATE POLICY "Kits são visíveis para todos os usuários autenticados" 
ON solar_kits FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Apenas usuários logados podem criar kits" ON solar_kits;
CREATE POLICY "Apenas usuários logados podem criar kits" 
ON solar_kits FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários logados podem atualizar kits" ON solar_kits;
CREATE POLICY "Usuários logados podem atualizar kits" 
ON solar_kits FOR UPDATE
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Usuários logados podem deletar kits" ON solar_kits;
CREATE POLICY "Usuários logados podem deletar kits" 
ON solar_kits FOR DELETE
TO authenticated 
USING (true);

-- --- Configuração do Supabase Storage para Imagens dos Kits ---

-- 1. Criar o bucket público 'kit-images' (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kit-images', 'kit-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Segurança do Storage (RLS)

-- Permitir leitura pública (Qualquer um pode ver as fotos dos kits no site final)
DROP POLICY IF EXISTS "Imagens de kits são públicas" ON storage.objects;
CREATE POLICY "Imagens de kits são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'kit-images');

-- Permitir upload apenas para usuários autenticados (Admin do Dashboard)
DROP POLICY IF EXISTS "Usuários logados podem fazer upload de imagens de kits" ON storage.objects;
CREATE POLICY "Usuários logados podem fazer upload de imagens de kits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kit-images');

-- Permitir atualizar/deletar imagens (Admin do Dashboard)
DROP POLICY IF EXISTS "Usuários logados podem atualizar imagens de kits" ON storage.objects;
CREATE POLICY "Usuários logados podem atualizar imagens de kits"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'kit-images');

DROP POLICY IF EXISTS "Usuários logados podem deletar imagens de kits" ON storage.objects;
CREATE POLICY "Usuários logados podem deletar imagens de kits"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'kit-images');
