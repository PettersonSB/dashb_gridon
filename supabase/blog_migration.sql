-- Criar tabela de Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    author TEXT DEFAULT 'Equipe Gridon',
    read_time TEXT,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para tabela
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON blog_posts
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users only" ON blog_posts
    FOR ALL USING (auth.role() = 'authenticated');

-- Inserir Bucket de Storage se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar RLS do Bucket
CREATE POLICY "Public Blog Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Auth Blog Insert" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth Blog Update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth Blog Delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
