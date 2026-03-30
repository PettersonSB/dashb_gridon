import { useLocation } from "react-router-dom";
import { sidebarItems } from "@/data/sidebarItems";
import { Bell, ExternalLink, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const TopBar = () => {
    const location = useLocation();
    const current = sidebarItems.find((item) => item.href === location.pathname);
    const title = current?.label || "Dashboard";

    const [isDark, setIsDark] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('dashboard_theme');
        if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
        
        loadNotifications();
        
        // Polling para notificações
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const { notificationService } = await import('@/services/notificationService');
            // Check for expirations silently before loading
            await notificationService.checkAndNotifyExpiredBudgets().catch(console.error);
            
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Erro ao carregar notificações:", error);
        }
    };

    const handleClearNotifications = async () => {
        try {
            const { notificationService } = await import('@/services/notificationService');
            await notificationService.markAllAsRead();
            await loadNotifications();
        } catch (error) {
            console.error("Erro ao limpar notificações:", error);
        }
    };

    const markAsRead = async (id: string, is_read: boolean) => {
        if (is_read) return;
        try {
            const { notificationService } = await import('@/services/notificationService');
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Erro ao ler notificação:", error);
        }
    };

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

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Agora mesmo';
        if (minutes < 60) return `${minutes}m atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    return (
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            <div>
                <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
                <a
                    href="http://gridon.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-2"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Site
                </a>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                    title={isDark ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
                >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <div className="relative">
                    <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className={`relative p-2 rounded-xl transition-all ${isNotificationsOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[9px] font-bold text-background border-2 border-background">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotificationsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                            <div className="absolute top-full right-0 mt-2 w-[320px] sm:w-[380px] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                                    <h3 className="font-display font-bold text-foreground">Notificações</h3>
                                    {notifications.length > 0 && (
                                        <button 
                                            onClick={handleClearNotifications}
                                            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Limpar
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center">
                                            <Bell className="w-8 h-8 text-muted-foreground/30 mb-3" />
                                            <p className="text-sm text-muted-foreground">Nenhuma notificação nova</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {notifications.map(notification => (
                                                <div 
                                                    key={notification.id} 
                                                    onClick={() => markAsRead(notification.id, notification.is_read)}
                                                    className={`p-4 transition-colors cursor-pointer hover:bg-muted/50 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <h4 className={`text-sm font-semibold flex-1 ${!notification.is_read ? 'text-primary' : 'text-foreground'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                            {formatTimeAgo(notification.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    {notification.metadata?.btn && (
                                                        <div className="mt-2 text-[10px] font-bold text-primary/70 bg-primary/10 inline-block px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                            Ação: {notification.metadata.btn}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
