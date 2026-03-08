-- Create a bucket for storing avatar images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para Avatares
-- Qualquer pessoa pode exibir a imagem de perfil
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Apenas o administrador autenticado pode subir a foto para a pasta dele
CREATE POLICY "Users can upload their own avatar." 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Apenas o administrador autenticado pode atualizar a própria foto
CREATE POLICY "Users can update their own avatar." 
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Apenas o administrador autenticado pode deletar a própria foto
CREATE POLICY "Users can delete their own avatar." 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
