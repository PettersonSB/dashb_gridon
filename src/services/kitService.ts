import { supabase } from '@/lib/supabase';
import { SolarBrand, SolarKit, SolarProduct, SolarKitItem } from '@/lib/types';

export const kitService = {
    // --- Brands ---

    async getBrands(type?: 'aparelho' | 'placas' | 'carregador') {
        let query = supabase
            .from('solar_brands')
            .select('id, name, type')
            .order('name', { ascending: true });

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as SolarBrand[];
    },

    async createBrand(name: string, type: 'aparelho' | 'placas' | 'carregador') {
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
                equipment_brand:equipment_brand_id(id, name),
                panel_brand:panel_brand_id(id, name),
                items:solar_kit_items(id, quantity, product_id, product:product_id(*, brand:brand_id(name)))
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SolarKit[];
    },

    async createKit(kit: Omit<SolarKit, 'id' | 'created_at' | 'equipment_brand' | 'panel_brand' | 'items'>, items: { product_id: string, quantity: number }[]) {
        const { data, error } = await supabase
            .from('solar_kits')
            .insert([kit])
            .select()
            .single();

        if (error) throw error;
        
        if (items.length > 0) {
            await this.saveKitItems(data.id, items);
        }
        
        return data as SolarKit;
    },

    async updateKit(id: string, kit: Partial<Omit<SolarKit, 'id' | 'created_at' | 'equipment_brand' | 'panel_brand' | 'items'>>, items: { product_id: string, quantity: number }[]) {
        const { data, error } = await supabase
            .from('solar_kits')
            .update(kit)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Error updating kit:", error);
            throw error;
        }
        
        await this.saveKitItems(id, items);
        
        return data as SolarKit;
    },

    async saveKitItems(kitId: string, items: { product_id: string, quantity: number }[]) {
        // Delete old items
        const { error: deleteError } = await supabase.from('solar_kit_items').delete().eq('kit_id', kitId);
        if (deleteError) {
            console.error("Error deleting old kit items:", deleteError);
            throw deleteError;
        }
        
        if (items.length > 0) {
            const newItems = items.map(item => ({
                kit_id: kitId,
                product_id: item.product_id,
                quantity: item.quantity
            }));
            const { error: insertError } = await supabase.from('solar_kit_items').insert(newItems);
            if (insertError) {
                console.error("Error inserting new kit items:", insertError);
                throw insertError;
            }
        }
    },

    async deleteKit(id: string) {
        // Since solar_kit_items has ON DELETE CASCADE, deleting the kit deletes the items automatically
        const { error } = await supabase
            .from('solar_kits')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Products ---

    async getProducts() {
        const { data, error } = await supabase
            .from('solar_products')
            .select(`
                *,
                brand:brand_id(id, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SolarProduct[];
    },

    async createProduct(product: Omit<SolarProduct, 'id' | 'created_at' | 'brand'>) {
        const { data, error } = await supabase
            .from('solar_products')
            .insert([product])
            .select()
            .single();

        if (error) throw error;
        return data as SolarProduct;
    },

    async updateProduct(id: string, product: Partial<Omit<SolarProduct, 'id' | 'created_at' | 'brand'>>) {
        const { data, error } = await supabase
            .from('solar_products')
            .update(product)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as SolarProduct;
    },

    async deleteProduct(id: string) {
        const { error } = await supabase
            .from('solar_products')
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
                cacheControl: '31536000',
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
