import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook utilitário para verificar permissões do usuário logado.
 * Consome o AuthContext e expõe helpers amigáveis.
 */
export function usePermissions() {
    const { role, permissions } = useAuth();

    const isOwner = role === 'owner';
    const isAdmin = role === 'admin';
    const isVendedor = role === 'vendedor';

    /** Verifica se o usuário tem acesso a uma ação específica dentro de um módulo */
    const hasPermission = (module: string, action: string): boolean => {
        // Owner sempre tem acesso total
        if (isOwner) return true;
        const modulePerms = permissions?.[module];
        if (!modulePerms) return false;
        return modulePerms.includes(action);
    };

    /** Verifica se o usuário tem pelo menos 1 permissão dentro de um módulo */
    const canAccessModule = (module: string): boolean => {
        if (isOwner) return true;
        const modulePerms = permissions?.[module];
        return Array.isArray(modulePerms) && modulePerms.length > 0;
    };

    /** Verifica se o usuário pode gerenciar equipe (owner ou admin) */
    const canManageTeam = isOwner || isAdmin;

    /**
     * Mapeia uma rota do dashboard para module+action.
     * Retorna true se o usuário tem permissão para acessar a rota.
     */
    const canAccessRoute = (pathname: string): boolean => {
        if (isOwner) return true;

        // Settings é sempre acessível
        if (pathname === '/settings') return true;

        // Mapa de rotas → permissões
        const routeMap: Record<string, [string, string]> = {
            '/': ['site', 'dashboard'],
            '/hero': ['site', 'hero'],
            '/problems': ['site', 'problems'],
            '/services': ['site', 'services'],
            '/stats': ['site', 'stats'],
            '/testimonials': ['site', 'testimonials'],
            '/blog': ['site', 'blog'],
            '/company': ['site', 'company'],
            '/seo': ['site', 'seo'],
            '/budget': ['budget', 'overview'],
            '/budget/list': ['budget', 'list'],
            '/budget/new': ['budget', 'create'],
            '/budget/prospects': ['budget', 'prospects'],
            '/budget/kits': ['budget', 'kits'],
            '/budget/surveys': ['budget', 'list'],
            '/budget/surveys/new': ['budget', 'create'],
            '/devices/general': ['devices', 'general'],
            '/devices/clients': ['devices', 'clients'],
        };

        // Rota exata
        const exact = routeMap[pathname];
        if (exact) return hasPermission(exact[0], exact[1]);

        // Rotas dinâmicas
        if (pathname.startsWith('/blog/edit/') || pathname.startsWith('/blog/new')) {
            return hasPermission('site', 'blog');
        }
        if (pathname.startsWith('/budget/edit/') || pathname.startsWith('/budget/surveys/edit/')) {
            return hasPermission('budget', 'create');
        }
        if (pathname.startsWith('/budget/preview/')) {
            return hasPermission('budget', 'list');
        }
        if (pathname.startsWith('/devices/clients/')) {
            return hasPermission('devices', 'clients');
        }

        // Rota desconhecida: bloquear por segurança
        return false;
    };

    /** Retorna a primeira rota acessível (para redirect quando acesso negado) */
    const getDefaultRoute = (): string => {
        if (isOwner) return '/';

        // Tenta encontrar a primeira rota permitida
        const priorities: [string, string, string][] = [
            ['/', 'site', 'dashboard'],
            ['/budget', 'budget', 'overview'],
            ['/budget/list', 'budget', 'list'],
            ['/budget/new', 'budget', 'create'],
            ['/budget/prospects', 'budget', 'prospects'],
            ['/budget/kits', 'budget', 'kits'],
            ['/devices/general', 'devices', 'general'],
            ['/devices/clients', 'devices', 'clients'],
        ];

        for (const [route, mod, action] of priorities) {
            if (hasPermission(mod, action)) return route;
        }

        // Fallback: settings (sempre acessível)
        return '/settings';
    };

    return {
        role,
        isOwner,
        isAdmin,
        isVendedor,
        permissions,
        hasPermission,
        canAccessModule,
        canManageTeam,
        canAccessRoute,
        getDefaultRoute,
    };
}
