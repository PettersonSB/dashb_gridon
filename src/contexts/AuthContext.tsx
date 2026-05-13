import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { teamService } from "@/services/teamService";
import type { Session, User } from "@supabase/supabase-js";
import type { TeamRole } from "@/lib/types";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: TeamRole | null;
    permissions: Record<string, string[]>;
    isOwner: boolean;
    hasPermission: (module: string, action: string) => boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<TeamRole | null>(null);
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const initialized = useRef(false);

    const isOwner = role === 'owner';

    const hasPermission = (module: string, action: string): boolean => {
        if (role === 'owner') return true;
        const modulePerms = permissions[module];
        if (!modulePerms) return false;
        return modulePerms.includes(action);
    };

    // Carrega role e permissões do team_members
    const loadTeamData = async (currentUser: User) => {
        try {
            let member = await teamService.getMyMembership(currentUser.id);

            // Auto-bootstrap: se não existe nenhum registro, este é o owner
            if (!member) {
                const allMembers = await teamService.getTeamMembers();
                if (allMembers.length === 0) {
                    try {
                        member = await teamService.bootstrapOwner(
                            currentUser.id,
                            currentUser.email || '',
                            currentUser.user_metadata?.full_name || ''
                        );
                    } catch (bootstrapErr) {
                        console.warn('Bootstrap owner falhou (pode já existir):', bootstrapErr);
                    }
                }
            }

            if (member) {
                if (member.status === 'suspenso') {
                    await supabase.auth.signOut();
                    return;
                }
                setRole(member.role as TeamRole);
                setPermissions((member.permissions || {}) as Record<string, string[]>);
            } else {
                // Usuário autenticado mas sem registro na equipe — acesso total temporário
                setRole(null);
                setPermissions({});
            }
        } catch (error) {
            console.error('Erro ao carregar dados da equipe:', error);
            // Não bloqueia o acesso — fallback sem permissões restritivas
            setRole(null);
            setPermissions({});
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                await loadTeamData(s.user);
            }
            initialized.current = true;
            setLoading(false);
        }).catch(() => {
            initialized.current = true;
            setLoading(false);
        });

        // Listen for auth changes (ignore until initialized)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
            if (!initialized.current) return; // Skip — getSession will handle it

            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                await loadTeamData(s.user);
            } else {
                setRole(null);
                setPermissions({});
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
    };

    const signOut = async () => {
        setRole(null);
        setPermissions({});
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, role, permissions, isOwner, hasPermission, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
