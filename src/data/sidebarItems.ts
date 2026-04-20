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
    DollarSign,
    Sun,
    Calculator,
    Smartphone, // Need to import an icon for Dispositivos
    type LucideIcon,
} from "lucide-react";

export interface SidebarItem {
    label: string;
    href: string;
    icon: LucideIcon;
    group?: string;
    dropdown?: { label: string; href: string }[];
}

export const sidebarItems: SidebarItem[] = [
    { label: "Site", href: "/", icon: LayoutDashboard },
    { label: "Hero", href: "/hero", icon: Sparkles, group: "Seções" },
    { label: "Problemas", href: "/problems", icon: AlertTriangle, group: "Seções" },
    { label: "Soluções", href: "/services", icon: Wrench, group: "Seções" },
    { label: "Métricas", href: "/stats", icon: BarChart3, group: "Seções" },
    { label: "Depoimentos", href: "/testimonials", icon: MessageSquareQuote, group: "Seções" },
    { label: "Blog", href: "/blog", icon: FileText, group: "Conteúdo" },
    { label: "Empresa", href: "/company", icon: Building2, group: "Config" },
    { label: "SEO", href: "/seo", icon: Search, group: "Config" },
    {
        label: 'Orçamento',
        href: '#',
        icon: Calculator,
        group: "Orçamento",
        dropdown: [
            { label: 'Visão Geral', href: '/budget' },
            { label: 'Todos os Orçamentos', href: '/budget/list' },
            { label: 'Novo Orçamento', href: '/budget/new' },
            { label: 'Prospects', href: '/budget/prospects' },
            { label: 'Kit Solar', href: '/budget/kits' }
        ],
    },
    {
        label: 'Dispositivos',
        href: '#',
        icon: Smartphone,
        group: "Dispositivos",
        dropdown: [
            { label: 'Geral', href: '/devices/general' },
            { label: 'App Cliente', href: '/devices/clients' }
        ],
    },
];
