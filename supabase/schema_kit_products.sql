-- Script de Migração: Kit Fotovoltaicos como uma Composição de Produtos
-- Execute isso no Supabase SQL Editor

-- 1. Cria Tabela de Produtos
CREATE TABLE IF NOT EXISTS solar_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    brand_id UUID REFERENCES solar_brands(id) ON DELETE SET NULL,
    model TEXT,
    power NUMERIC NOT NULL DEFAULT 0,
    voltage TEXT,
    warranty INTEGER,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE solar_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Produtos são visíveis para todos" ON solar_products;
CREATE POLICY "Produtos são visíveis para todos"
ON solar_products FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Apenas admin logado escreve produtos" ON solar_products;
CREATE POLICY "Apenas admin logado escreve produtos"
ON solar_products FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 2. Atualiza a Tabela de Kits (Torna reativa)
ALTER TABLE solar_kits ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE solar_kits ADD COLUMN IF NOT EXISTS is_price_auto BOOLEAN DEFAULT true;

UPDATE solar_kits SET name = 'Kit ' || system_type || ' ' || system_power || 'kWp' WHERE name IS NULL;
ALTER TABLE solar_kits ALTER COLUMN name SET NOT NULL;


-- 3. Tabela Relacional (Kit <-> Itens/Produtos)
CREATE TABLE IF NOT EXISTS solar_kit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID NOT NULL REFERENCES solar_kits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES solar_products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE solar_kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Itens do kit são visíveis para todos" ON solar_kit_items;
CREATE POLICY "Itens do kit são visíveis para todos"
ON solar_kit_items FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Apenas admin logado escreve itens do kit" ON solar_kit_items;
CREATE POLICY "Apenas admin logado escreve itens do kit"
ON solar_kit_items FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
