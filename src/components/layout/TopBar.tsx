import { useLocation } from "react-router-dom";
import { sidebarItems } from "@/data/sidebarItems";
import { Bell, ExternalLink, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const TopBar = () => {
    const location = useLocation();
    const current = sidebarItems.find((item) => item.href === location.pathname);
    const title = current?.label || "Dashboard";

    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // Inicializa o tema baseado no localStorage ou padrão escuro
        const savedTheme = localStorage.getItem('dashboard_theme');
        if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('dashboard_theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('dashboard_theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <header className="h-16 border-b border-white/[0.04] bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            <div>
                <h1 className="font-display text-lg font-semibold text-white">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
                <a
                    href="http://gridon.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost flex items-center gap-2 text-xs"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Site
                </a>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                    title={isDark ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
                >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                </button>
            </div>
        </header>
    );
};

export default TopBar;
