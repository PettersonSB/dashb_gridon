import { NavLink } from "react-router-dom";
import { sidebarItems } from "@/data/sidebarItems";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, LogOut } from "lucide-react";

const Sidebar = () => {
    const { user, signOut } = useAuth();

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

                {Object.entries(groups).map(([group, items]) => (
                    <div key={group} className="pt-4">
                        <span className="px-4 text-[11px] font-semibold text-white/20 uppercase tracking-widest">
                            {group}
                        </span>
                        <div className="mt-2 space-y-1">
                            {items.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    className={({ isActive }) =>
                                        `sidebar-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
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
