import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { sidebarItems } from "@/data/sidebarItems";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, LogOut, ChevronDown } from "lucide-react";

const Sidebar = () => {
    const { user, signOut } = useAuth();
    const location = useLocation();

    // Group items
    const groups: Record<string, typeof sidebarItems> = {};
    const ungrouped: typeof sidebarItems = [];

    sidebarItems.forEach((item) => {
        if (item.group) {
            if (!groups[item.group]) groups[item.group] = [];
            groups[item.group].push(item);
        } else {
            ungrouped.push(item);
        }
    });

    // Determine which groups should be initially open based on the current path
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

    const toggleGroup = (group: string) => {
        setOpenGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[hsl(228,25%,7%)] border-r border-white/[0.04] flex flex-col z-40">
            {/* Logo */}
            <div className="px-6 h-16 flex items-center gap-3 border-b border-white/[0.04]">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="font-display font-bold text-white text-sm">Gridon</span>
                    <span className="text-xs text-white/30 block -mt-0.5">Dashboard</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
                {ungrouped.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === "/"}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? "active" : ""}`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {item.label}
                    </NavLink>
                ))}

                {Object.entries(groups).map(([group, items]) => {
                    const isOpen = openGroups[group];
                    
                    return (
                        <div key={group} className="pt-2">
                            <button
                                onClick={() => toggleGroup(group)}
                                className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-white/40 uppercase tracking-widest hover:text-white/70 transition-colors"
                            >
                                <span>{group}</span>
                                <ChevronDown 
                                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                                />
                            </button>
                            
                            <div 
                                className={`mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                            >
                                {items.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        className={({ isActive }) =>
                                            `sidebar-item ml-2 ${isActive ? "active" : ""}`
                                        }
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer - User + Sign Out */}
            <div className="px-4 py-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {user?.email?.[0].toUpperCase() || "G"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/70 truncate">Admin</p>
                        <p className="text-xs text-white/30 truncate">{user?.email || "—"}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Sair"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
