import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];
type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];

export const blogService = {
    // Get all posts
    async getPosts() {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('id, title, slug, category, image_url, author, read_time, published, published_at, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as BlogPost[];
    },

    // Get a single post by ID
    async getPostById(id: string) {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    // Create a new post
    async createPost(post: BlogPostInsert) {
        const { data, error } = await supabase
            .from('blog_posts')
            .insert({
                ...post,
                // Ensure slug is unique if not provided correctly, but ideally handled by DB/UI
            })
            .select()
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    // Update an existing post
    async updatePost(id: string, updates: BlogPostUpdate) {
        const { data, error } = await supabase
            .from('blog_posts')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    // Toggle publish status
    async togglePublish(id: string, currentStatus: boolean) {
        const { data, error } = await supabase
            .from('blog_posts')
            .update({
                published: !currentStatus,
                published_at: !currentStatus ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    // Delete a post
    async deletePost(id: string) {
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Upload an image for the blog cover
    async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(filePath, file, { cacheControl: '31536000', upsert: false });

        if (uploadError) {
            console.error('Blog Upload Error:', uploadError);
            throw new Error(`Erro ao fazer upload da imagem do blog: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
