export type Database = {
    public: {
        Tables: {
            blog_posts: {
                Row: {
                    id: string;
                    slug: string;
                    title: string;
                    excerpt: string | null;
                    content: string;
                    category: string;
                    image_url: string | null;
                    author: string | null;
                    read_time: string | null;
                    published: boolean | null;
                    published_at: string | null;
                    created_at: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    title: string;
                    excerpt?: string | null;
                    content: string;
                    category: string;
                    image_url?: string | null;
                    author?: string | null;
                    read_time?: string | null;
                    published?: boolean | null;
                    published_at?: string | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    slug?: string;
                    title?: string;
                    excerpt?: string | null;
                    content?: string;
                    category?: string;
                    image_url?: string | null;
                    author?: string | null;
                    read_time?: string | null;
                    published?: boolean | null;
                    published_at?: string | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                };
            };
        };
    };
};

export interface HeroContent {
    id: string;
    badge_text: string;
    headline: string;
    subheadline: string;
    cta_text: string;
    cta_link: string;
    updated_at: string;
}

export interface ProblemCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    color_from: string;
    color_to: string;
    sort_order: number;
    created_at: string;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    icon: string;
    features: string[];
    sort_order: number;
    active: boolean;
    created_at: string;
}

export interface Stat {
    id: string;
    value: number;
    suffix: string;
    label: string;
    sort_order: number;
}

export interface Testimonial {
    id: string;
    text: string;
    author: string;
    role: string;
    active: boolean;
    sort_order: number;
    created_at: string;
}

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    image_url: string;
    author: string;
    read_time: string;
    published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CompanyInfo {
    id: string;
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    opening_hours: string;
    instagram: string;
    facebook: string;
    linkedin: string;
    institutional_video_url?: string;
    updated_at: string;
}

export interface SeoConfig {
    id: string;
    page: string;
    title: string;
    description: string;
    og_image: string;
    keywords: string;
    updated_at: string;
}

export interface SolarBrand {
    id: string;
    name: string;
    type: 'aparelho' | 'placas' | 'carregador';
    created_at: string;
}

export interface SolarProduct {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    brand_id: string | null;
    model: string;
    power: number;
    voltage: string;
    warranty: number | null;
    image_url: string;
    created_at: string;
    brand?: SolarBrand; // for joins
}

export interface SolarKitItem {
    id: string;
    kit_id: string;
    product_id: string;
    quantity: number;
    created_at: string;
    product?: SolarProduct; // for joins
}

export interface SolarKit {
    id: string;
    name: string;
    system_type: 'On Grid' | 'Off Grid' | 'Híbrido' | 'Backup Box';
    equipment_type?: 'Inversor' | 'Inversor Híbrido' | 'Micro Inversor' | 'Wallbox'; // optional/legacy
    equipment_brand_id?: string | null; // legacy
    equipment_warranty?: number | null; // legacy
    estimated_generation: number | null;
    panels_count?: number; // legacy
    panel_power?: number;  // legacy
    panel_brand_id?: string | null; // legacy
    panel_warranty?: number | null; // legacy
    system_power: number;
    kit_price: number;
    is_price_auto: boolean;
    image_url: string;
    description: string;
    created_at: string;
    equipment_brand?: SolarBrand; // legacy
    panel_brand?: SolarBrand;     // legacy
    items?: SolarKitItem[];       // NEW REALATION
    budgets?: { id: string; customer_name: string; status: string }[];
}

export interface Notification {
    id: string;
    type: 'view' | 'click' | 'lead' | 'expired' | 'system';
    title: string;
    message: string;
    is_read: boolean;
    budget_id?: string | null;
    metadata?: any;
    created_at: string;
}

export interface CustomBudgetCard {
    id: number;
    title: string;
    description: string;
    image_url?: string;
    note?: string;
    included?: boolean;  // true = incluso na proposta, false = valor à parte
    price?: number;      // valor quando não incluso (isolado do orçamento)
}

export interface MultiOption {
    id: string; // Gerado apenas para chaves no front-end
    name: string; // Ex: Basic (Hoymiles), Premium (Enphase)
    kit_id: string;
    kit?: SolarKit;

    // Custos
    labor_cost?: number;
    engineering_cost?: number;
    profit_type?: 'percentage' | 'fixed';
    profit_value?: number;
    commission_type?: 'percentage' | 'fixed';
    commission_value?: number;
    tax_type?: 'percentage' | 'fixed';
    tax_value?: number;

    // Métodos de Pagamento
    cash_discount?: number;
    cash_mode?: 'automatic' | 'manual';
    cash_manual_value?: number;
    cash_enabled?: boolean;
    pix_discount?: number;
    pix_mode?: 'automatic' | 'manual';
    pix_manual_value?: number;
    pix_enabled?: boolean;
    financing_options?: any[]; // JSON array
}

export interface SolarBudget {
    id: string;

    // Dados do Cliente
    customer_name: string;
    customer_phone: string;
    customer_city: string;
    customer_neighborhood: string;
    customer_state: string;
    customer_email: string | null;

    // Informações da Instalação
    average_monthly_consumption: number | null;
    energy_tariff: number | null;
    installation_location: 'telhado fibrocimento' | 'telhado colonial' | 'telhado de concreto' | 'telhado zinco' | 'laje' | 'solo';
    construction_type: 'residencial' | 'comercial' | 'industrial' | 'predio residencial' | 'predio comercial' | 'rural';
    supply_type: 'monofasico' | 'bifasico' | 'trifasico';
    installation_warranty: number;

    // Proposta Comercial
    kit_id: string;
    proposal_validity_days: number;
    installation_notes: string | null;
    status: 'novo' | 'em analise' | 'visualizado' | 'aprovado' | 'recusado' | 'suspenso' | 'vencido';

    // Campos Financeiros e de Customização (Novo)
    labor_cost?: number;
    engineering_cost?: number;
    profit_type?: 'percentage' | 'fixed';
    profit_value?: number;
    commission_type?: 'percentage' | 'fixed';
    commission_value?: number;
    tax_type?: 'percentage' | 'fixed';
    tax_value?: number;
    cash_discount?: number;
    cash_mode?: 'automatic' | 'manual';
    cash_manual_value?: number;
    cash_enabled?: boolean;
    pix_discount?: number;
    pix_mode?: 'automatic' | 'manual';
    pix_manual_value?: number;
    pix_enabled?: boolean;
    financing_options?: any[]; // JSONB array

    // Orçamento Múltiplo (NOVO)
    is_multi?: boolean;
    multi_options?: MultiOption[] | null;

    // Relacionamento com Prospect (CRM)
    prospect_id?: string | null;

    // Auditoria e Joins
    created_by: string | null;
    created_by_name?: string | null;
    created_by_avatar?: string | null;
    audio_url?: string | null;
    show_audio?: boolean; // NEW: Toggle to show/hide audio on the public page
    cover_image_url?: string | null; // Keep for backward compatibility
    cover_image_urls?: string[] | null; // Array of images for carousel
    show_kit_images?: boolean; // NEW: Toggle to show/hide kit images on the public page
    custom_cards?: CustomBudgetCard[] | null; // JSONB array, até 5 cards personalizados
    show_custom_cards?: boolean; // Toggle to show/hide custom cards on the public page
    created_at: string;
    kit?: SolarKit; // For nested joins
}

export interface PhaseTelemetry {
    voltage: number | null;
    current: number | null;
    power: number | null;
    forward_energy: number | null;
    reverse_energy: number | null;
    power_factor: number | null;
}

export interface Device {
    id: string;
    device_id: string;
    user_id: string;
    name: string | null;

    voltage: number | null;
    current: number | null;
    power: number | null;

    is_on: boolean | null;
    online: string | null;

    updated_at: string;
    phase_config?: {
        a?: 'generation' | 'consumption' | 'none';
        b?: 'generation' | 'consumption' | 'none';
        c?: 'generation' | 'consumption' | 'none';
    } | null;
    telemetry_data?: {
        total_power: number | null;
        forward_energy_total: number | null;
        reverse_energy_total: number | null;
        frequency?: number | null;
        temperature?: number | null;
        power_factor?: number | null;
        phases?: {
            a?: PhaseTelemetry | null;
            b?: PhaseTelemetry | null;
            c?: PhaseTelemetry | null;
        } | null;
    } | null;
}

export interface DeviceLog {
    id: string;
    device_id: string;
    user_id: string;

    voltage: number | null;
    current: number | null;
    power: number | null;

    created_at: string;
    telemetry_data?: {
        total_power: number | null;
        forward_energy_total: number | null;
        reverse_energy_total: number | null;
        frequency?: number | null;
        temperature?: number | null;
        power_factor?: number | null;
        phases?: {
            a?: PhaseTelemetry | null;
            b?: PhaseTelemetry | null;
            c?: PhaseTelemetry | null;
        } | null;
    } | null;
}

export interface Prospect {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    city: string | null;
    state: string | null;
    neighborhood: string | null;
    status: 'novo' | 'em contato' | 'negociando' | 'ganho' | 'perdido';
    created_at: string;
    updated_at: string;
    
    // Auxiliares (Joins)
    budgets_count?: number; // Para mostrar quantos orçamentos esse prospect possui
    converted_to_client_id?: string | null;
}

export type TeamRole = 'owner' | 'admin' | 'vendedor';

export interface TeamPermissions {
    site?: string[];      // ['dashboard','hero','problems','services','stats','testimonials','blog','company','seo']
    budget?: string[];    // ['overview','list','create','prospects','kits']
    devices?: string[];   // ['general','clients']
}

export interface TeamMember {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    role: TeamRole;
    permissions: TeamPermissions;
    status: 'ativo' | 'suspenso';
    created_by: string | null;
    created_at: string;
    updated_at: string;
    avatar_url?: string; // Obtido do user_metadata via Auth
}

// Mapa completo de todas as permissões disponíveis (para UI de checkboxes)
export const ALL_PERMISSIONS: Record<string, { label: string; items: { key: string; label: string }[] }> = {
    site: {
        label: 'Site',
        items: [
            { key: 'dashboard', label: 'Visão Geral' },
            { key: 'hero', label: 'Hero' },
            { key: 'problems', label: 'Problemas' },
            { key: 'services', label: 'Soluções' },
            { key: 'stats', label: 'Métricas' },
            { key: 'testimonials', label: 'Depoimentos' },
            { key: 'blog', label: 'Blog' },
            { key: 'company', label: 'Empresa' },
            { key: 'seo', label: 'SEO' },
        ],
    },
    budget: {
        label: 'Proposta',
        items: [
            { key: 'overview', label: 'Visão Geral' },
            { key: 'list', label: 'Todos os Orçamentos' },
            { key: 'create', label: 'Novo Orçamento' },
            { key: 'prospects', label: 'Prospects' },
            { key: 'kits', label: 'Kit Solar' },
        ],
    },
    devices: {
        label: 'Dispositivos',
        items: [
            { key: 'general', label: 'Geral' },
            { key: 'clients', label: 'App Cliente' },
        ],
    },
};

// Presets de permissões para criação rápida
export const PERMISSION_PRESETS: Record<string, { label: string; permissions: TeamPermissions }> = {
    vendedor: {
        label: 'Vendedor Padrão',
        permissions: {
            budget: ['overview', 'list', 'create', 'prospects'],
        },
    },
    admin: {
        label: 'Admin Completo',
        permissions: {
            site: ['dashboard', 'hero', 'problems', 'services', 'stats', 'testimonials', 'blog', 'company', 'seo'],
            budget: ['overview', 'list', 'create', 'prospects', 'kits'],
            devices: ['general', 'clients'],
        },
    },
};

