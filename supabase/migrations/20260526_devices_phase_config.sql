-- Adiciona a coluna phase_config para mapeamento dinâmico de TCs por dispositivo
ALTER TABLE devices ADD COLUMN IF NOT EXISTS phase_config JSONB DEFAULT NULL;
