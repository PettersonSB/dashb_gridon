-- ============================================
-- UPGRADE: Dispositivos - Preparação App Nativo
-- ============================================
-- Executar no Supabase SQL Editor

-- Campo para vincular dispositivo a um cliente final (futuro app nativo)
ALTER TABLE devices ADD COLUMN IF NOT EXISTS client_user_id UUID DEFAULT NULL;

-- Comentário explicativo para o campo
COMMENT ON COLUMN devices.client_user_id IS 'Referência ao usuário-cliente que será dono do dispositivo no app nativo';
