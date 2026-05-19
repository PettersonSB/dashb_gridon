import { supabase } from '@/lib/supabase';

// ── Tipos ──────────────────────────────────────────

export interface ClientNotification {
    id: string;
    target_user_id: string | null;
    title: string;
    body: string;
    type: string;
    route: string;
    data: any;
    sent_by: string | null;
    sent_by_name: string | null;
    onesignal_response: any;
    created_at: string;
}

export interface SendNotificationPayload {
    title: string;
    body: string;
    type: string;
    target_user_id?: string | null;
    route?: string;
    data?: any;
}

// ── Service ────────────────────────────────────────

export const clientNotificationService = {

    /** Envia uma notificação para o app do cliente via Edge Function */
    async sendNotification(payload: SendNotificationPayload): Promise<{ message: string; recipients: number }> {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            throw new Error('Você precisa estar logado. Faça login novamente.');
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-client-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': ANON_KEY,
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let result: any;
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(`Erro inesperado do servidor (${response.status}): ${responseText}`);
        }

        if (!response.ok) {
            throw new Error(result.error || result.message || `Erro ao enviar notificação (${response.status})`);
        }

        return result;
    },

    /** Lista o histórico de notificações enviadas */
    async getNotifications(): Promise<ClientNotification[]> {
        const { data, error } = await supabase
            .from('client_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data || [];
    },

    /** Remove uma notificação do histórico */
    async deleteNotification(id: string): Promise<void> {
        const { error } = await supabase
            .from('client_notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
