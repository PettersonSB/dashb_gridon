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
