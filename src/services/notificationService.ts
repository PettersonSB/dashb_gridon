import { supabase } from '@/lib/supabase';
import { Notification } from '@/lib/types';

export const notificationService = {
    async getNotifications() {
        // Fetch up to 50 recent notifications
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data as Notification[];
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw error;
    },

    async markAllAsRead() {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) throw error;
    },

    async createNotification(payload: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
        const { error } = await supabase
            .from('notifications')
            .insert([payload]);

        if (error) throw error;
    },
    
    async deleteAllNotifications() {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to allow clearing all

        if (error) throw error;
    },

    async checkAndNotifyExpiredBudgets() {
        // Busca orçamentos ativos (que ainda não foram marcados como 'vencido')
        const { data: budgets, error } = await supabase
            .from('solar_budgets')
            .select('id, customer_name, status, proposal_validity_days, created_at')
            .in('status', ['novo', 'em analise', 'visualizado']);
            
        if (error || !budgets || budgets.length === 0) return;

        const now = new Date();
        const expiredBudgets = budgets.filter(b => {
            const createdDate = new Date(b.created_at);
            const expirationDate = new Date(createdDate.getTime() + (b.proposal_validity_days * 24 * 60 * 60 * 1000));
            // Dá uma margem até o fim do dia
            expirationDate.setHours(23, 59, 59, 999);
            return now > expirationDate;
        });

        if (expiredBudgets.length === 0) return;

        // Batch update: atualiza TODOS os vencidos de uma só vez (em vez de N PATCHs individuais)
        const expiredIds = expiredBudgets.map(b => b.id);
        await supabase
            .from('solar_budgets')
            .update({ status: 'vencido' })
            .in('id', expiredIds);

        // Verifica quais notificações já existem para evitar duplicatas
        const { data: existingNotifs } = await supabase
            .from('notifications')
            .select('budget_id')
            .eq('type', 'expired')
            .in('budget_id', expiredIds);

        const alreadyNotified = new Set((existingNotifs || []).map(n => n.budget_id));
        const newExpired = expiredBudgets.filter(b => !alreadyNotified.has(b.id));

        // Cria notificações apenas para os que ainda não foram notificados
        if (newExpired.length > 0) {
            const notifPayloads = newExpired.map(budget => ({
                type: 'expired',
                title: 'Orçamento Vencido',
                message: `O orçamento do(a) cliente ${budget.customer_name} acabou de vencer e teve o status atualizado.`,
                budget_id: budget.id,
                metadata: { customer: budget.customer_name }
            }));

            const { error: insertErr } = await supabase
                .from('notifications')
                .insert(notifPayloads);
            if (insertErr) {
                console.error('Erro ao inserir notificações:', insertErr);
            }
        }
    }
};
