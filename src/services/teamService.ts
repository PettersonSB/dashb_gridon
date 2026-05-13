import { supabase } from '@/lib/supabase';
import type { TeamMember, TeamPermissions, TeamRole } from '@/lib/types';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-team`;

async function callEdgeFunction(body: Record<string, any>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': ANON_KEY,
        },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
        const detail = data.details ? ` (${data.details})` : '';
        throw new Error((data.error || 'Erro na operação') + detail);
    }
    return data;
}

export const teamService = {
    /** Lista todos os membros da equipe */
    async getTeamMembers(): Promise<TeamMember[]> {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao buscar membros:', error);
            return [];
        }

        return (data as TeamMember[]) || [];
    },

    /** Busca as permissões do usuário logado */
    async getMyMembership(userId: string): Promise<TeamMember | null> {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // PGRST116 = not found (usuário ainda não está na tabela)
            if (error.code !== 'PGRST116') {
                console.error('Erro ao buscar membership:', error);
            }
            return null;
        }

        return data as TeamMember;
    },

    /** Registra o primeiro usuário como owner (auto-bootstrap) */
    async bootstrapOwner(userId: string, email: string, fullName: string): Promise<TeamMember> {
        const { data, error } = await supabase
            .from('team_members')
            .insert({
                user_id: userId,
                email,
                full_name: fullName || email.split('@')[0],
                role: 'owner',
                permissions: {
                    site: ['dashboard', 'hero', 'problems', 'services', 'stats', 'testimonials', 'blog', 'company', 'seo'],
                    budget: ['overview', 'list', 'create', 'prospects', 'kits'],
                    devices: ['general', 'clients'],
                },
                status: 'ativo',
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao registrar owner:', error);
            throw error;
        }

        return data as TeamMember;
    },

    /** Criar novo membro (via Edge Function) */
    async createMember(params: {
        email: string;
        password: string;
        full_name: string;
        role: TeamRole;
        permissions: TeamPermissions;
    }) {
        return callEdgeFunction({ action: 'create', ...params });
    },

    /** Atualizar role/permissões de um membro */
    async updateMember(targetUserId: string, updates: {
        role?: TeamRole;
        permissions?: TeamPermissions;
    }) {
        return callEdgeFunction({
            action: 'update',
            target_user_id: targetUserId,
            ...updates,
        });
    },

    /** Suspender membro */
    async suspendMember(targetUserId: string) {
        return callEdgeFunction({
            action: 'suspend',
            target_user_id: targetUserId,
        });
    },

    /** Reativar membro */
    async reactivateMember(targetUserId: string) {
        return callEdgeFunction({
            action: 'reactivate',
            target_user_id: targetUserId,
        });
    },

    /** Excluir membro */
    async deleteMember(targetUserId: string) {
        return callEdgeFunction({
            action: 'delete',
            target_user_id: targetUserId,
        });
    },

    /** Resetar senha de um membro */
    async resetPassword(targetUserId: string, newPassword: string) {
        return callEdgeFunction({
            action: 'reset_password',
            target_user_id: targetUserId,
            new_password: newPassword,
        });
    },

    /** Lê o limite de membros configurado */
    async getMaxMembers(): Promise<number> {
        const { data } = await supabase
            .from('global_settings')
            .select('value')
            .eq('key', 'team_max_members')
            .single();

        return data?.value ? parseInt(data.value) : 6;
    },

    /** Atualiza o limite de membros (apenas owner via RLS) */
    async setMaxMembers(max: number): Promise<void> {
        const { error } = await supabase
            .from('global_settings')
            .upsert({
                key: 'team_max_members',
                value: String(max),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

        if (error) {
            console.error('Erro ao atualizar limite:', error);
            throw error;
        }
    },
};
