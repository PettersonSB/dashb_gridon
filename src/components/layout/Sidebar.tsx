import React, { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { sidebarItems } from "@/data/sidebarItems";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { LogOut, ChevronDown, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const Sidebar = ({ isPinned, onTogglePin }: { isPinned: boolean, onTogglePin: () => void }) => {
    const { user, signOut } = useAuth();
    const { hasPermission, canAccessModule } = usePermissions();
    const location = useLocation();
    
    // Manage hover state
    const [isHovered, setIsHovered] = useState(false);
    const isExpanded = isPinned || isHovered;

    // Group items
    const siteGroups: Record<string, typeof sidebarItems> = {};
    const ungrouped: typeof sidebarItems = [];

    sidebarItems.forEach((item) => {
        if (item.label === "Site" || (item.group && item.group !== "Orçamento" && item.group !== "Dispositivos")) {
            if (item.group) {
                if (!siteGroups[item.group]) siteGroups[item.group] = [];
                siteGroups[item.group].push(item);
            }
        } else if (item.label === "Orçamento" || item.group === "Orçamento") {
            // Handled manually
        } else if (item.label === "Dispositivos" || item.group === "Dispositivos") {
            // Handled manually
        } else {
            ungrouped.push(item);
        }
    });

    // ── Mapeamento de rotas para permissões ──────────────────
    const siteRoutePermMap: Record<string, string> = {
        '/': 'dashboard',
        '/hero': 'hero',
        '/problems': 'problems',
        '/services': 'services',
        '/stats': 'stats',
        '/testimonials': 'testimonials',
        '/blog': 'blog',
        '/company': 'company',
        '/seo': 'seo',
    };

    const budgetRoutePermMap: Record<string, string> = {
        '/budget': 'overview',
        '/budget/list': 'list',
        '/budget/new': 'create',
        '/budget/prospects': 'prospects',
        '/budget/kits': 'kits',
        '/budget/surveys': 'list',
    };

    const devicesRoutePermMap: Record<string, string> = {
        '/devices/general': 'general',
        '/devices/clients': 'clients',
    };

    // ── Filtrar itens do Site por permissão ──────────────────
    const filteredSiteGroups: Record<string, typeof sidebarItems> = {};
    Object.entries(siteGroups).forEach(([group, items]) => {
        const filtered = items.filter(item => {
            const perm = siteRoutePermMap[item.href];
            return perm ? hasPermission('site', perm) : true;
        });
        if (filtered.length > 0) {
            filteredSiteGroups[group] = filtered;
        }
    });

    // ── Filtrar dropdown do Orçamento por permissão ──────────
    const budgetItem = sidebarItems.find(item => item.label === "Orçamento");
    const filteredBudgetDropdown = budgetItem?.dropdown?.filter(sub => {
        const perm = budgetRoutePermMap[sub.href];
        return perm ? hasPermission('budget', perm) : true;
    }) || [];

    // ── Filtrar dropdown dos Dispositivos por permissão ──────
    const devicesItem = sidebarItems.find(item => item.label === "Dispositivos");
    const filteredDevicesDropdown = devicesItem?.dropdown?.filter(sub => {
        const perm = devicesRoutePermMap[sub.href];
        return perm ? hasPermission('devices', perm) : true;
    }) || [];

    // ── Verificar visibilidade dos módulos ──────────────────
    const showSite = canAccessModule('site');
    const showBudget = canAccessModule('budget') && filteredBudgetDropdown.length > 0;
    const showDevices = canAccessModule('devices') && filteredDevicesDropdown.length > 0;
    const showSiteDashboard = hasPermission('site', 'dashboard');

    const isSiteRelated = (path: string) => {
        if (path === "/") return true;
        for (const items of Object.values(filteredSiteGroups)) {
            if (items.some(item => path === item.href || path.startsWith(item.href + '/'))) return true;
        }
        return false;
    };

    // Groups that are nested inside "Site"
    const groups: Record<string, typeof sidebarItems> = filteredSiteGroups;

    // Determine which nested groups should be initially open
    const getInitialOpenGroups = () => {
        const initial: Record<string, boolean> = {};
        Object.entries(groups).forEach(([group, items]) => {
            if (items.some(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'))) {
                initial[group] = true;
            }
        });
        return initial;
    };

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);
    const [isSiteOpen, setIsSiteOpen] = useState(false);
    const [isBudgetOpen, setIsBudgetOpen] = useState(location.pathname.startsWith('/budget'));
    const [isDevicesOpen, setIsDevicesOpen] = useState(location.pathname.startsWith('/devices'));

    const toggleGroup = (group: string) => {
        setOpenGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const toggleSite = () => {
        setIsSiteOpen(!isSiteOpen);
    };

    const toggleBudget = () => {
        setIsBudgetOpen(!isBudgetOpen);
    };

    const toggleDevices = () => {
        setIsDevicesOpen(!isDevicesOpen);
    };

    return (
        <aside 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed left-0 top-0 bottom-0 bg-background dark:bg-[hsl(228,25%,7%)] border-r border-border dark:border-white/[0.04] flex flex-col z-[60] transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? "w-64" : "w-[72px]"}`}
        >
            {/* Logo */}
            <div className="h-20 flex items-center justify-between border-b border-white/[0.04] px-4 overflow-hidden">
                <div className={`flex items-center transition-all duration-300 ${isExpanded ? "w-auto" : "w-10 justify-center"}`}>
                    {isExpanded ? (
                        <img
                            src="https://bfsddnjwjbqlxfxxlorf.supabase.co/storage/v1/object/sign/sistema/logo-gridon-CuReGPKe.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85MmMzNGE1NC02ZjBiLTRhMzItOWMxMC1jZTdjNmVmNjlmNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzaXN0ZW1hL2xvZ28tZ3JpZG9uLUN1UmVHUEtlLnBuZyIsImlhdCI6MTc3MjkzNDQwNCwiZXhwIjo0OTI2NTM0NDA0fQ.O2WN8HLKj9zWa95-AVfUtG0qKGGP8lIT6YjdUpSC0GI"
                            alt="Gridon"
                            className="h-10 w-auto object-contain dark:brightness-0 dark:invert opacity-90 transition-all"
                        />
                    ) : (
                        <img
                            src="https://bfsddnjwjbqlxfxxlorf.supabase.co/storage/v1/object/sign/sistema/logo-gridon-raio.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85MmMzNGE1NC02ZjBiLTRhMzItOWMxMC1jZTdjNmVmNjlmNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzaXN0ZW1hL2xvZ28tZ3JpZG9uLXJhaW8ucG5nIiwiaWF0IjoxNzc0NTc4Njg3LCJleHAiOjMxNzEwMzA0MjY4N30.BVUbUhx5yvShqLKL1tBR2xXlIhGZk8VOX4aCREeDYEA"
                            alt="Gridon"
                            className="h-8 w-8 object-contain transition-all"
                        />
                    )}
                </div>
                {isExpanded && (
                    <button onClick={onTogglePin} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                        {isPinned ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
                {ungrouped.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === "/"}
                        title={!isExpanded ? item.label : undefined}
                        className={({ isActive }) =>
                            `sidebar-item flex items-center gap-3 ${isActive ? "active" : ""} ${!isExpanded ? "!justify-center !px-0" : ""}`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {isExpanded && <span className="truncate">{item.label}</span>}
                    </NavLink>
                ))}

                {/* Site Master Dropdown — só visível se tem permissões */}
                {showSite && (
                    <div className="pt-2 pb-2">
                        <button
                            onClick={isExpanded ? toggleSite : undefined}
                            title={!isExpanded ? "Site" : undefined}
                            className={`w-full flex items-center justify-between py-2.5 rounded-xl transition-all ${!isExpanded ? "px-0 justify-center" : "px-3"} ${isSiteRelated(location.pathname) && (!isExpanded || !isSiteOpen)
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" // Active but collapsed state
                                : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                                }`}
                        >
                            <div className={`flex items-center gap-3 ${!isExpanded ? "justify-center w-full" : ""}`}>
                                {/* Assuming the first item is the site root to borrow its icon */}
                                {sidebarItems.find(i => i.label === "Site")?.icon && React.createElement(sidebarItems.find(i => i.label === "Site")!.icon as React.ElementType, { className: "w-5 h-5 flex-shrink-0" })}
                                {isExpanded && <span className="font-medium truncate">Site</span>}
                            </div>
                            {isExpanded && (
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isSiteOpen ? 'rotate-180' : ''}`}
                                />
                            )}
                        </button>

                        <div
                            className={`mt-1 pl-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out border-l border-white/[0.04] ml-5 ${(isSiteOpen && isExpanded) ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            {/* Direct Site Link inside the dropdown — só se tem permissão dashboard */}
                            {showSiteDashboard && (
                                <NavLink
                                    to="/"
                                    end
                                    className={({ isActive }) =>
                                        `sidebar-item mt-2 !text-[13px] ${isActive ? "active" : ""}`
                                    }
                                >
                                    Visão Geral
                                </NavLink>
                            )}

                            {/* Nested Groups — filtrados por permissão */}
                            {Object.entries(groups).map(([group, items]) => {
                                const isOpen = openGroups[group];

                                return (
                                    <div key={group} className="pt-3">
                                        <button
                                            onClick={() => toggleGroup(group)}
                                            className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider hover:text-white/70 transition-colors"
                                        >
                                            <span>{group}</span>
                                            <ChevronDown
                                                className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        <div
                                            className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            {items.map((item) => (
                                                <NavLink
                                                    key={item.href}
                                                    to={item.href}
                                                    className={({ isActive }) =>
                                                        `sidebar-item !py-1.5 !px-3 !text-[13px] !rounded-lg ml-1 ${isActive ? "active" : ""}`
                                                    }
                                                >
                                                    <item.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                                                    {item.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Orçamento Master Dropdown — só visível se tem permissões */}
                {showBudget && (
                    <div className="pt-2 pb-2">
                        <button
                            onClick={isExpanded ? toggleBudget : undefined}
                            title={!isExpanded ? "Orçamento" : undefined}
                            className={`w-full flex items-center justify-between py-2.5 rounded-xl transition-all ${!isExpanded ? "px-0 justify-center" : "px-3"} ${location.pathname.startsWith('/budget') && (!isExpanded || !isBudgetOpen)
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" // Active but collapsed state
                                : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                                }`}
                        >
                            <div className={`flex items-center gap-3 ${!isExpanded ? "justify-center w-full" : ""}`}>
                                {sidebarItems.find(i => i.label === "Orçamento")?.icon && React.createElement(sidebarItems.find(i => i.label === "Orçamento")!.icon as React.ElementType, { className: "w-5 h-5 flex-shrink-0" })}
                                {isExpanded && <span className="font-medium truncate">Orçamento</span>}
                            </div>
                            {isExpanded && (
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isBudgetOpen ? 'rotate-180' : ''}`}
                                />
                            )}
                        </button>

                        <div
                            className={`mt-1 pl-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out border-l border-white/[0.04] ml-5 ${(isBudgetOpen && isExpanded) ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            {/* Orçamento nested items — filtrados */}
                            <div className="pt-2 space-y-1">
                                {filteredBudgetDropdown.map((subItem) => (
                                    <NavLink
                                        key={subItem.href}
                                        to={subItem.href}
                                        end={subItem.href === '/budget'}
                                        className={({ isActive }) =>
                                            `sidebar-item !py-1.5 !px-4 !text-[13px] !rounded-lg ml-2 ${isActive ? "active" : ""}`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-2 transition-all ${isActive ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-white/20'}`} />
                                                {subItem.label}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Dispositivos Master Dropdown — só visível se tem permissões */}
                {showDevices && (
                    <div className="pt-2 pb-2">
                        <button
                            onClick={isExpanded ? toggleDevices : undefined}
                            title={!isExpanded ? "Dispositivos" : undefined}
                            className={`w-full flex items-center justify-between py-2.5 rounded-xl transition-all ${!isExpanded ? "px-0 justify-center" : "px-3"} ${location.pathname.startsWith('/devices') && (!isExpanded || !isDevicesOpen)
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" // Active but collapsed state
                                : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                                }`}
                        >
                            <div className={`flex items-center gap-3 ${!isExpanded ? "justify-center w-full" : ""}`}>
                                {sidebarItems.find(i => i.label === "Dispositivos")?.icon && React.createElement(sidebarItems.find(i => i.label === "Dispositivos")!.icon as React.ElementType, { className: "w-5 h-5 flex-shrink-0" })}
                                {isExpanded && <span className="font-medium truncate">Dispositivos</span>}
                            </div>
                            {isExpanded && (
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isDevicesOpen ? 'rotate-180' : ''}`}
                                />
                            )}
                        </button>

                        <div
                            className={`mt-1 pl-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out border-l border-white/[0.04] ml-5 ${(isDevicesOpen && isExpanded) ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            {/* Dispositivos nested items — filtrados */}
                            <div className="pt-2 space-y-1">
                                {filteredDevicesDropdown.map((subItem) => (
                                    <NavLink
                                        key={subItem.href}
                                        to={subItem.href}
                                        end={subItem.href === '/devices'}
                                        className={({ isActive }) =>
                                            `sidebar-item !py-1.5 !px-4 !text-[13px] !rounded-lg ml-2 ${isActive ? "active" : ""}`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-2 transition-all ${isActive ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-white/20'}`} />
                                                {subItem.label}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Footer - User + Sign Out */}
            <div className={`px-4 py-4 border-t border-white/[0.04] transition-all duration-300 ${!isExpanded ? "px-2" : ""}`}>
                <div className={`flex items-center gap-3 overflow-hidden ${!isExpanded ? "justify-center" : "px-2"}`}>
                    <Link to="/settings" title={!isExpanded ? "Configurações" : undefined} className="flex-shrink-0 relative group">
                        {user?.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Avatar"
                                className="w-8 h-8 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-500 ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all">
                                {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.[0].toUpperCase() || "G"}
                            </div>
                        )}
                        {isExpanded && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Settings className="w-2.5 h-2.5 text-white/70" />
                            </div>
                        )}
                    </Link>
                    
                    {isExpanded && (
                        <>
                            <div className="flex-1 min-w-0 transition-opacity duration-300 overflow-hidden">
                                <p className="text-sm font-medium text-white/70 truncate">{user?.user_metadata?.full_name || "Admin"}</p>
                                <p className="text-xs text-white/30 truncate">{user?.email || "—"}</p>
                            </div>
                            <button
                                onClick={signOut}
                                className="p-2 flex-shrink-0 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Sair"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
                
                {/* Sign out button for collapsed mode */}
                {!isExpanded && (
                    <button
                        onClick={signOut}
                        className="mt-4 w-full flex justify-center p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Sair"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
