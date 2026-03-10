import { supabase } from '@/lib/supabase';
import { SolarBudget } from '@/lib/types';

export const budgetService = {
    async getBudgets() {
        const { data, error } = await supabase
            .from('solar_budgets')
            .select(`
                *,
                kit:kit_id(
                    *,
                    equipment_brand:equipment_brand_id(*),
                    panel_brand:panel_brand_id(*)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SolarBudget[];
    },

    async getBudgetById(id: string) {
        const { data, error } = await supabase
            .from('solar_budgets')
            .select(`
                *,
                kit:kit_id(
                    *,
                    equipment_brand:equipment_brand_id(*),
                    panel_brand:panel_brand_id(*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as SolarBudget;
    },

    async createBudget(budget: Omit<SolarBudget, 'id' | 'created_at' | 'created_by' | 'kit' | 'status'>) {
        // Obter usuário logado atual para o created_by
        const { data: userData } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('solar_budgets')
            .insert([{
                ...budget,
                status: 'novo',
                created_by: userData.user?.id || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data as SolarBudget;
    },

    async deleteBudget(id: string) {
        const { error } = await supabase
            .from('solar_budgets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateBudget(id: string, budget: Partial<Omit<SolarBudget, 'id' | 'created_at' | 'created_by' | 'kit'>>) {
        const { data, error } = await supabase
            .from('solar_budgets')
            .update(budget)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as SolarBudget;
    },

    async updateBudgetStatus(id: string, status: SolarBudget['status']) {
        const { error } = await supabase
            .from('solar_budgets')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    async renewBudget(id: string) {
        // Obter usuário atual e horário para renovação
        const { error } = await supabase
            .from('solar_budgets')
            .update({
                created_at: new Date().toISOString(),
                status: 'ativo' // Ao renovar, volta pra ativo caso estivesse vencido
            })
            .eq('id', id);

        if (error) throw error;
    }
};
