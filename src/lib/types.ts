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
    type: 'equipamento' | 'placa';
    created_at: string;
}

export interface SolarKit {
    id: string;
    system_type: 'On Grid' | 'Off Grid' | 'Híbrido' | 'Backup Box';
    equipment_type: 'Inversor' | 'Inversor Híbrido' | 'Micro Inversor' | 'Wallbox';
    equipment_brand_id: string | null;
    equipment_warranty: number | null;
    estimated_generation: number | null;
    panels_count: number;
    panel_power: number;
    panel_brand_id: string | null;
    panel_warranty: number | null;
    system_power: number;
    kit_price: number;
    image_url: string;
    description: string;
    created_at: string;
    equipment_brand?: SolarBrand; // For joins
    panel_brand?: SolarBrand;     // For joins
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
    status: 'ativo' | 'suspenso' | 'vencido' | 'fechado';

    // Auditoria e Joins
    created_by: string | null;
    created_at: string;
    kit?: SolarKit; // For nested joins
}
