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
        // Obter usuário logado atual para o created_by de forma segura e rápida (instantâneo do local cache)
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        // Tentar buscar informações do perfil (user_metadata) 
        const createdByName = user?.user_metadata?.full_name || user?.email || 'Sistema';
        const createdByAvatar = user?.user_metadata?.avatar_url || null;

        const { data, error } = await supabase
            .from('solar_budgets')
            .insert([{
                ...budget,
                status: 'novo',
                created_by: user?.id || null,
                created_by_name: createdByName,
                created_by_avatar: createdByAvatar
            }])
            .select()
            .single();

        if (error) throw error;
        return data as SolarBudget;
    },

    async duplicateBudget(originalId: string): Promise<SolarBudget> {
        // 1. Buscar o orçamento original completo
        const { data: original, error: fetchError } = await supabase
            .from('solar_budgets')
            .select('*')
            .eq('id', originalId)
            .single();

        if (fetchError || !original) throw fetchError || new Error('Orçamento não encontrado');

        // 2. Remover campos que devem ser regenerados
        const { id, created_at, status, created_by, created_by_name, created_by_avatar, ...clonePayload } = original;

        // 3. Obter usuário atual de forma rápida e segura
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const createdByName = user?.user_metadata?.full_name || user?.email || 'Sistema';
        const createdByAvatar = user?.user_metadata?.avatar_url || null;

        // 4. Inserir como novo orçamento
        const { data: newBudget, error: insertError } = await supabase
            .from('solar_budgets')
            .insert([{
                ...clonePayload,
                status: 'novo',
                created_by: user?.id || null,
                created_by_name: createdByName,
                created_by_avatar: createdByAvatar
            }])
            .select()
            .single();

        if (insertError) throw insertError;
        return newBudget as SolarBudget;
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
