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

export interface OrderItem {
    id: number;
    order_id: number;
    menu_id: number;
    menu_name_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
    subtotal: number;
    item_notes: string | null;
}

export interface OrderRating {
    id: number;
    order_id: number;
    user_id: number;
    rating: number;
    review: string | null;
    created_at: string;
}

export interface Order {
    id: number;
    order_code: string;
    order_type: 'dine_in' | 'takeaway';
    order_status: 'Awaiting Payment' | 'Paid' | 'Confirmed' | 'Preparing' | 'Ready' | 'Served' | 'Picked Up' | 'Cancelled';
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    customer_notes: string | null;
    created_at: string;
    items?: OrderItem[];
    payment?: {
        payment_method: string;
        payment_status: string;
        amount: number;
        paid_at: string | null;
    };
    rating?: OrderRating | null;
}

export interface ChatMessage {
    id: number;
    user_id: number;
    sender_type: 'customer' | 'admin';
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface RestaurantTable {
    id: number;
    table_number: string;
    capacity: number;
    location: string;
    status: string;
    is_active: boolean;
}
