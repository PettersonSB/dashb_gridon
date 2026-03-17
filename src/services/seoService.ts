import { supabase } from '@/lib/supabase';

export interface SeoSettings {
    id: string;
    page_name: string;
    title: string;
    description: string | null;
    keywords: string | null;
    og_image: string | null;
    created_at?: string;
    updated_at?: string;
}

export const seoService = {
    async getSettings(): Promise<SeoSettings[]> {
        const { data, error } = await supabase
            .from('page_seo_settings')
            .select('id, page_name, title, description, keywords, og_image')
            .order('page_name', { ascending: true });

        if (error) {
            console.error('Error fetching SEO settings:', error);
            throw error;
        }

        return data || [];
    },

    async updateSettings(settings: SeoSettings[]): Promise<void> {
        // Prepare data for upsert
        const updates = settings.map(setting => ({
            id: setting.id,
            page_name: setting.page_name,
            title: setting.title,
            description: setting.description,
            keywords: setting.keywords,
            og_image: setting.og_image,
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('page_seo_settings')
            .upsert(updates, { onConflict: 'id' });

        if (error) {
            console.error('Error updating SEO settings:', error);
            throw error;
        }
    }
};
