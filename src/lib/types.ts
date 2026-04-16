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
}

export interface DeviceLog {
    id: string;
    device_id: string;
    user_id: string;

    voltage: number | null;
    current: number | null;
    power: number | null;

    created_at: string;
}
