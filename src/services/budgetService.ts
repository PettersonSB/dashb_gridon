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
                    panel_brand:panel_brand_id(*),
                    items:solar_kit_items(
                        quantity,
                        product:product_id(category)
                    )
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
                    panel_brand:panel_brand_id(*),
                    items:solar_kit_items(
                        quantity,
                        product:product_id(category)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as SolarBudget;
    },

    async createBudget(budget: Omit<SolarBudget, 'id' | 'created_at' | 'created_by' | 'created_by_name' | 'created_by_avatar' | 'kit' | 'status'>) {
        // Obter usuário logado atual para o created_by
        const { data: userData } = await supabase.auth.getUser();

        // Tentar buscar informações do perfil (user_metadata) 
        const createdByName = userData.user?.user_metadata?.full_name || userData.user?.email || 'Sistema';
        const createdByAvatar = userData.user?.user_metadata?.avatar_url || null;

        const { data, error } = await supabase
            .from('solar_budgets')
            .insert([{
                ...budget,
                status: 'novo',
                created_by: userData.user?.id || null,
                created_by_name: createdByName,
                created_by_avatar: createdByAvatar
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
    },

    async uploadBudgetImage(file: File): Promise<string> {
        // Create a unique file name to avoid collisions
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('kit-images')
            .upload(filePath, file, {
                cacheControl: '31536000',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Erro ao fazer upload da imagem de capa: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('kit-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async uploadBudgetImages(files: File[]): Promise<string[]> {
        if (!files || files.length === 0) return [];
        
        const uploadPromises = files.map(file => this.uploadBudgetImage(file));
        const urls = await Promise.all(uploadPromises);
        
        return urls;
    },

    async uploadBudgetAudio(budgetId: string, audioBlob: Blob): Promise<string> {
        const fileName = `${budgetId}/audio_${Date.now()}.webm`;

        const { error: uploadError } = await supabase.storage
            .from('budget_audios')
            .upload(fileName, audioBlob, {
                contentType: 'audio/webm',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('budget_audios')
            .getPublicUrl(fileName);

        const audioUrl = publicUrlData.publicUrl;

        // Atualizar o registro do orçamento com a URL do áudio
        await supabase
            .from('solar_budgets')
            .update({ audio_url: audioUrl })
            .eq('id', budgetId);

        return audioUrl;
    },

    async deleteBudgetAudio(budgetId: string) {
        // Listar e excluir todos os arquivos do pasta do orçamento
        const { data: files } = await supabase.storage
            .from('budget_audios')
            .list(budgetId);

        if (files && files.length > 0) {
            const filePaths = files.map(f => `${budgetId}/${f.name}`);
            await supabase.storage
                .from('budget_audios')
                .remove(filePaths);
        }

        // Limpar a referência no banco
        await supabase
            .from('solar_budgets')
            .update({ audio_url: null })
            .eq('id', budgetId);
    }
};
