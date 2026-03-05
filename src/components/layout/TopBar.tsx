import { useLocation } from "react-router-dom";
import { sidebarItems } from "@/data/sidebarItems";
import { Bell, ExternalLink } from "lucide-react";

const TopBar = () => {
    const location = useLocation();
    const current = sidebarItems.find((item) => item.href === location.pathname);
    const title = current?.label || "Dashboard";

    return (
        <header className="h-16 border-b border-white/[0.04] bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            <div>
                <h1 className="font-display text-lg font-semibold text-white">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
                <a
                    href="http://localhost:5173"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost flex items-center gap-2 text-xs"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Site
                </a>
                <button className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                </button>
            </div>
        </header>
    );
};

export default TopBar;
