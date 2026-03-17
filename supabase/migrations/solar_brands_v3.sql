-- ============================================
-- Gridon Solar — Migração de Marcas v3
-- Atualiza os tipos para: placas, aparelho, carregador
-- ============================================

-- 1. Remover restrição antiga se existir
ALTER TABLE solar_brands DROP CONSTRAINT IF EXISTS solar_brands_type_check;

-- 2. Migrar dados existentes primeiro
UPDATE solar_brands SET type = 'aparelho' WHERE type = 'equipamento';
UPDATE solar_brands SET type = 'placas' WHERE type = 'placa';

-- 3. Adicionar nova restrição
ALTER TABLE solar_brands ADD CONSTRAINT solar_brands_type_check 
CHECK (type IN ('aparelho', 'placas', 'carregador'));

-- 4. Inserir novas marcas de carregadores (Wallbox)
INSERT INTO solar_brands (name, type) VALUES
('Intelbras', 'carregador'),
('Volvo', 'carregador'),
('ABB', 'carregador'),
('Wallbox (Brand)', 'carregador'),
('Schneider Electric', 'carregador');
