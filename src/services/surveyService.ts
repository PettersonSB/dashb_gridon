import { supabase } from '@/lib/supabase';
import { SolarSurvey } from '@/lib/types';

export const surveyService = {
    async getSurveys() {
        const { data, error } = await supabase
            .from('solar_surveys')
            .select(`
                *,
                budget:budget_id (
                    id,
                    customer_name,
                    kit:kit_id (
                        system_power
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as any[];
    },

    async getSurveyById(id: string) {
        const { data, error } = await supabase
            .from('solar_surveys')
            .select(`
                *,
                budget:budget_id (
                    id,
                    customer_name,
                    kit:kit_id (
                        system_power
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as any;
    },

    async createSurvey(survey: Omit<SolarSurvey, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        const { data, error } = await supabase
            .from('solar_surveys')
            .insert([{
                ...survey,
                created_by: user?.id || null,
                status: 'pendente'
            }])
            .select()
            .single();

        if (error) throw error;
        return data as SolarSurvey;
    },

    async updateSurvey(id: string, survey: Partial<Omit<SolarSurvey, 'id' | 'created_at' | 'updated_at'>>) {
        const { data, error } = await supabase
            .from('solar_surveys')
            .update({
                ...survey,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as SolarSurvey;
    },

    async deleteSurvey(id: string) {
        // 1. Listar arquivos do bucket storage correspondentes à vistoria
        const { data: files } = await supabase.storage
            .from('survey_files')
            .list(id);

        if (files && files.length > 0) {
            const filePaths = files.map(f => `${id}/${f.name}`);
            await supabase.storage
                .from('survey_files')
                .remove(filePaths);
        }

        // 2. Excluir registro do banco de dados
        const { error } = await supabase
            .from('solar_surveys')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
