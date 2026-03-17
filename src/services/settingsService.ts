import { supabase } from '@/lib/supabase';

export interface GlobalSetting {
    key: string;
    value: string;
}

export const settingsService = {
    async getSetting(key: string, defaultValue: string = ''): Promise<string> {
        const { data, error } = await supabase
            .from('global_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            console.error(`Error fetching setting ${key}:`, error);
            return defaultValue;
        }

        return data?.value || defaultValue;
    },

    async updateSetting(key: string, value: string): Promise<void> {
        const { error } = await supabase
            .from('global_settings')
            .upsert({ 
                key, 
                value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            console.error(`Error updating setting ${key}:`, error);
            throw error;
        }
    }
};
