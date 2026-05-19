-- ============================================
-- Gridon Dashboard — Migração: client_notifications
-- Tabela de notificações enviadas para o app Gridon+ (cliente)
-- Execute no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS client_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Destinatário (NULL = broadcast para todos os clientes)
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Conteúdo
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general', -- 'general', 'billing', 'maintenance', 'promo', 'system'

    -- Deep link: rota do app para abrir ao clicar na notificação
    route TEXT DEFAULT '/home',

    -- Dados extras livres (JSON)
    data JSONB DEFAULT '{}',

    -- Auditoria
    sent_by UUID REFERENCES auth.users(id),
    sent_by_name TEXT,
    onesignal_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

-- Leitura por usuários autenticados (dashboard + app cliente)
CREATE POLICY "read_client_notifications" ON client_notifications
    FOR SELECT TO authenticated USING (true);

-- Escrita por usuários autenticados (dashboard)
CREATE POLICY "write_client_notifications" ON client_notifications
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
