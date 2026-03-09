import { supabase } from '@/lib/supabase';
import { SolarBrand, SolarKit } from '@/lib/types';

export const kitService = {
    // --- Brands ---

    async getBrands(type?: 'equipamento' | 'placa') {
        let query = supabase
            .from('solar_brands')
            .select('*')
            .order('name', { ascending: true });

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as SolarBrand[];
    },

    async createBrand(name: string, type: 'equipamento' | 'placa') {
        const { data, error } = await supabase
            .from('solar_brands')
            .insert([{ name, type }])
            .select()
            .single();

        if (error) throw error;
        return data as SolarBrand;
    },

    // --- Kits ---

    async getKits() {
        const { data, error } = await supabase
            .from('solar_kits')
            .select(`
        *,
        equipment_brand:equipment_brand_id(*),
        panel_brand:panel_brand_id(*)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SolarKit[];
    },

    async createKit(kit: Omit<SolarKit, 'id' | 'created_at' | 'equipment_brand' | 'panel_brand'>) {
        const { data, error } = await supabase
            .from('solar_kits')
            .insert([kit])
            .select()
            .single();

        if (error) throw error;
        return data as SolarKit;
    },

    async updateKit(id: string, kit: Partial<Omit<SolarKit, 'id' | 'created_at' | 'equipment_brand' | 'panel_brand'>>) {
        const { data, error } = await supabase
            .from('solar_kits')
            .update(kit)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as SolarKit;
    },

    async deleteKit(id: string) {
        const { error } = await supabase
            .from('solar_kits')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Storage ---

    async uploadKitImage(file: File): Promise<string> {
        // Create a unique file name to avoid collisions
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('kit-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('kit-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
