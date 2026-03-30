-- Migration script for notifications system

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL, -- 'view', 'click', 'lead', 'expired', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    budget_id UUID REFERENCES public.solar_budgets(id) ON DELETE CASCADE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura de notificações para usuários autenticados" 
ON public.notifications 
FOR SELECT 
TO authenticated 
USING (true);

-- API Anônima pode inserir notificações (para eventos do site público)
CREATE POLICY "Permitir inserção anônima de notificações"
ON public.notifications
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Permitir update para marcar como lida
CREATE POLICY "Permitir update de notificações para usuários autenticados"
ON public.notifications
FOR UPDATE
TO authenticated
USING (true);

-- Permitir deleção para usuários autenticados ("Limpar")
CREATE POLICY "Permitir delete de notificações para usuários autenticados"
ON public.notifications
FOR DELETE
TO authenticated
USING (true);
