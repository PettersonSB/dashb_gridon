import {
    LayoutDashboard,
    Sparkles,
    AlertTriangle,
    Wrench,
    BarChart3,
    MessageSquareQuote,
    FileText,
    Building2,
    Search,
    type LucideIcon,
} from "lucide-react";

export interface SidebarItem {
    label: string;
    href: string;
    icon: LucideIcon;
    group?: string;
}

export const sidebarItems: SidebarItem[] = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Hero", href: "/hero", icon: Sparkles, group: "Seções" },
    { label: "Problemas", href: "/problems", icon: AlertTriangle, group: "Seções" },
    { label: "Soluções", href: "/services", icon: Wrench, group: "Seções" },
    { label: "Métricas", href: "/stats", icon: BarChart3, group: "Seções" },
    { label: "Depoimentos", href: "/testimonials", icon: MessageSquareQuote, group: "Seções" },
    { label: "Blog", href: "/blog", icon: FileText, group: "Conteúdo" },
    { label: "Empresa", href: "/company", icon: Building2, group: "Config" },
    { label: "SEO", href: "/seo", icon: Search, group: "Config" },
];
