export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'cashier' | 'waiter' | 'customer';
}

export interface RestaurantSettings {
    restaurant_name: string;
    address: string;
    phone: string;
    email: string;
    social_links: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
    };
    tax_percentage: number;
    reservation_policy: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
}

export interface Menu {
    id: number;
    category_id: number;
    category_slug: string;
    category_name: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock_quantity: number;
    is_available: boolean;
    is_featured: boolean;
    is_best_seller: boolean;
    image_path: string;
}

export interface DiningExperience {
    id: number;
    name: string;
    slug: string;
    description: string;
    duration_minutes: number;
    price_per_person: number | null;
    image_url: string;
    is_available: boolean;
}

export interface OperatingHour {
    id: number;
    day_of_week: number;
    day_name: string;
    open_time: string;
    close_time: string;
    is_closed: boolean;
}

export interface DemoAccount {
    role: string;
    title: string;
    email: string;
    phone?: string;
    password: string;
    badge: string;
    desc: string;
}
