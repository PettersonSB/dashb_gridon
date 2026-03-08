import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const profileService = {
    async updateProfile(fullName: string, avatarFile?: File | null) {
        try {
            // Se houver uma nova imagem, fazemos o upload no Supabase Storage primeiro
            let mappedAvatarUrl: string | undefined = undefined;

            if (avatarFile) {
                // Remove espaços e caracteres especiais para evitar conflitos de URL
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = `profiles/${fileName}`;

                // Faz upload do arquivo
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) {
                    throw uploadError;
                }

                // Recupera o Link público gerado para essa imagem
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                mappedAvatarUrl = data.publicUrl;
            }

            // Atualiza os metadados do Auth User atual com as novas info
            const updates: Record<string, string> = { full_name: fullName };
            if (mappedAvatarUrl) {
                updates.avatar_url = mappedAvatarUrl;
            }

            const { data: userData, error: updateError } = await supabase.auth.updateUser({
                data: updates
            });

            if (updateError) throw updateError;

            return userData;
        } catch (error) {
            console.error("Erro no updateProfile:", error);
            throw error;
        }
    },

    async updatePassword(newPassword: string) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
        } catch (error) {
            console.error("Erro no updatePassword:", error);
            throw error;
        }
    }
};
