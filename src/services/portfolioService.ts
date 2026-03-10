import { supabase } from '@/lib/supabase';

export interface PortfolioItem {
    id: string;
    image_url: string;
    location: string;
    created_at: string;
}

export const portfolioService = {
    // Buscar todos os itens do portfólio (ordem de criação decrescente)
    getItems: async (): Promise<PortfolioItem[]> => {
        const { data, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching portfolio items:', error);
            throw new Error('Falha ao buscar itens do portfólio.');
        }

        return data || [];
    },

    // Upload de Imagem e Retorno da URL Pública
    uploadImage: async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('portfolio-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // Adicionar novo item (com base na URL já upada e location digitada)
    addItem: async (itemData: Omit<PortfolioItem, 'id' | 'created_at'>): Promise<PortfolioItem> => {
        const { data, error } = await supabase
            .from('portfolio_items')
            .insert([itemData])
            .select();

        if (error) {
            console.error('Error adding portfolio item:', error);
            throw new Error('Falha ao adicionar serviço ao portfólio.');
        }

        return data[0];
    },

    // Deletar item pelo ID
    deleteItem: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('portfolio_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting portfolio item:', error);
            throw new Error('Falha ao deletar o serviço do portfólio.');
        }

        return true;
    }
};
