import React, { useState, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import { 
    Category, 
    Menu, 
    Order, 
    ChatMessage, 
    RestaurantTable, 
    RestaurantSettings, 
    User 
} from '../../types';
import { 
    ShoppingBag, 
    Heart, 
    Clock, 
    MessageSquare, 
    Search, 
    Sparkles, 
    QrCode, 
    ChevronRight, 
    ArrowLeft, 
    Star, 
    Send, 
    X, 
    Plus, 
    Minus, 
    CheckCircle2, 
    AlertCircle, 
    MapPin, 
    Utensils, 
    Check, 
    Info, 
    ShieldCheck,
    LogOut,
    Coffee,
    User as UserIcon,
    RefreshCw
} from 'lucide-react';

interface Props {
    categories: Category[];
    menus: Menu[];
    favorites: number[];
    orders: Order[];
    chatMessages: ChatMessage[];
    tables: RestaurantTable[];
    settings: RestaurantSettings;
    initialTable?: string | null;
    initialType?: 'dine_in' | 'takeaway';
    initialMenuId?: number | null;
    isGuest?: boolean;
}

interface CartItem {
    menu: Menu;
    quantity: number;
    item_notes: string;
}

export default function OrderApp({ 
    categories = [], 
    menus = [], 
    favorites: initialFavorites = [], 
    orders: initialOrders = [], 
    chatMessages: initialChats = [], 
    tables = [], 
    settings,
    initialTable,
    initialType,
    initialMenuId,
    isGuest: initialIsGuest = false
}: Props) {
    const { auth, flash } = usePage<{ auth: { user: User | null }; flash: { success?: string; error?: string } }>().props;
    const isGuest = !auth?.user;

    // Navigation Tab state: 'menu' | 'favorites' | 'history' | 'chat'
    const [activeTab, setActiveTab] = useState<'menu' | 'favorites' | 'history' | 'chat'>('menu');

    // Order mode: 'dine_in' | 'takeaway'
    const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>(
        initialType || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('type') === 'takeaway' ? 'takeaway' : 'dine_in')
    );
    const [selectedTable, setSelectedTable] = useState<string>(initialTable || 'Meja 01');
    const [customerName, setCustomerName] = useState<string>(auth?.user?.name || '');
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);

    // Search and Category
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Favorites local state
    const [favorites, setFavorites] = useState<number[]>(initialFavorites);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [generalNotes, setGeneralNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bank_transfer' | 'cash'>('qris');
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Menu Item Modal for Customizing / Adding Notes
    const [customizingMenu, setCustomizingMenu] = useState<Menu | null>(null);
    const [customizeQuantity, setCustomizeQuantity] = useState(1);
    const [customizeNotes, setCustomizeNotes] = useState('');

    // Rating Modal State
    const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
    const [selectedStars, setSelectedStars] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    // Chat Message State
    const [chatInput, setChatInput] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);

    // Filtered Menus
    const displayedMenus = useMemo(() => {
        let list = menus;
        if (activeTab === 'favorites') {
            list = list.filter(m => favorites.includes(m.id));
        }
        return list.filter(menu => {
            const matchesCategory = selectedCategory === 'all' || menu.category_slug === selectedCategory;
            const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  menu.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menus, favorites, activeTab, selectedCategory, searchQuery]);

    const activeOrder = useMemo(() => {
        return initialOrders.find(o => ['Pending', 'Preparing', 'Ready'].includes(o.order_status)) || null;
    }, [initialOrders]);

    React.useEffect(() => {
        if (initialMenuId) {
            const m = menus.find(item => item.id === Number(initialMenuId));
            if (m && m.is_available && m.stock_quantity > 0) {
                setCustomizingMenu(m);
                setCustomizeQuantity(1);
                setCustomizeNotes('');
            }
        }
    }, [initialMenuId, menus]);

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'Pending': return 1;
            case 'Preparing': return 2;
            case 'Ready': return 3;
            case 'Served':
            case 'Picked Up':
            case 'Completed': return 4;
            default: return 1;
        }
    };

    // Cart calculations
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.menu.price * item.quantity), 0);
    const cartTax = Math.round(cartSubtotal * 0.11);
    const cartTotal = cartSubtotal + cartTax;

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    // Toggle Favorite
    const handleToggleFavorite = (menuId: number) => {
        if (isGuest) {
            alert('Fitur favorit hidangan memerlukan Akun Customer. Silakan masuk untuk menyimpan menu favorit Anda.');
            router.visit('/login');
            return;
        }
        setFavorites(prev => 
            prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
        );
        router.post('/favorites/toggle', { menu_id: menuId }, { preserveScroll: true });
    };

    // Open Customizer for Menu
    const handleOpenCustomizer = (menu: Menu) => {
        if (!menu.is_available || menu.stock_quantity <= 0) return;
        setCustomizingMenu(menu);
        setCustomizeQuantity(1);
        setCustomizeNotes('');
    };

    // Add to Cart from Customizer
    const handleAddToCart = () => {
        if (!customizingMenu) return;

        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.menu.id === customizingMenu.id && item.item_notes === customizeNotes);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += customizeQuantity;
                return updated;
            }
            return [...prev, {
                menu: customizingMenu,
                quantity: customizeQuantity,
                item_notes: customizeNotes
            }];
        });

        setCustomizingMenu(null);
    };

    // Update Cart Quantity
    const handleUpdateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const updated = [...prev];
            const newQty = updated[index].quantity + delta;
            if (newQty <= 0) {
                updated.splice(index, 1);
            } else {
                updated[index].quantity = newQty;
            }
            return updated;
        });
    };

    // Update Cart Item Notes
    const handleUpdateItemNotes = (index: number, notes: string) => {
        setCart(prev => {
            const updated = [...prev];
            updated[index].item_notes = notes;
            return updated;
        });
    };

    // Submit Checkout
    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;

        if (!customerName.trim()) {
            alert('Mohon masukkan nama pemesan / pelanggan terlebih dahulu.');
            return;
        }

        if (orderType === 'dine_in' && !selectedTable.trim()) {
            alert('Mohon pilih atau ketik nomor meja yang sedang Anda tempati.');
            return;
        }

        if (orderType === 'takeaway' && isGuest) {
            alert('Pesanan Bawa Pulang (Takeaway) mewajibkan Anda masuk ke Akun Customer terlebih dahulu agar kami dapat mengonfirmasi kesiapan pesanan.');
            router.visit('/login');
            return;
        }

        setIsCheckingOut(true);
        router.post('/order/checkout', {
            order_type: orderType,
            customer_name: customerName.trim(),
            table_number: orderType === 'dine_in' ? selectedTable.trim() : null,
            customer_notes: generalNotes,
            payment_method: paymentMethod,
            items: cart.map(item => ({
                menu_id: item.menu.id,
                quantity: item.quantity,
                item_notes: item.item_notes,
            })),
        }, {
            onSuccess: () => {
                setCart([]);
                setIsCartOpen(false);
                setIsCheckingOut(false);
                setActiveTab('history');
            },
            onError: () => {
                setIsCheckingOut(false);
            }
        });
    };

    // Submit Rating
    const handleSubmitRating = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ratingOrder) return;

        setIsSubmittingRating(true);
        router.post(`/order/${ratingOrder.id}/rating`, {
            rating: selectedStars,
            review: reviewComment,
        }, {
            onSuccess: () => {
                setIsSubmittingRating(false);
                setRatingOrder(null);
                setReviewComment('');
            },
            onError: () => {
                setIsSubmittingRating(false);
            }
        });
    };

    // Send Chat Message
    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        setIsSendingChat(true);
        const text = chatInput;
        setChatInput('');

        router.post('/chat/send', {
            message: text
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSendingChat(false);
            },
            onError: () => {
                setIsSendingChat(false);
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#F4EFE6] text-[#211D1B] font-body selection:bg-[#B99A65] selection:text-[#32151F] pb-24 md:pb-12">
            <Head title="Pemesanan Online — NUSARA Dining" />

            {/* Flash Alerts (3 Detik Auto Dismiss) */}
            <FlashToast flash={flash} durationMs={3000} />

            {/* ========================================================
                APP HEADER (KOPKEN STYLE)
            ======================================================== */}
            <header className="sticky top-0 z-40 bg-[#32151F] text-[#F4EFE6] shadow-xl border-b border-[#B99A65]/30">
                <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Brand & Return */}
                        <div className="flex items-center gap-3">
                            <Link 
                                href="/" 
                                title="Kembali ke Beranda Publik"
                                className="group flex items-center"
                            >
                                <img 
                                    src="/images/nusara-logo.png" 
                                    alt="NUSARA" 
                                    className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" 
                                />
                                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#B99A65] text-[#211D1B] ml-2">
                                    APP
                                </span>
                            </Link>
                        </div>

                        {/* Right: User Profile & Mode Switcher */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Order Type Pill (Dine-in vs Takeaway) */}
                            <div className="flex items-center rounded-full bg-[#211D1B] p-1 border border-[#B99A65]/40 text-xs">
                                <button
                                    onClick={() => {
                                        setOrderType('dine_in');
                                        setIsTableModalOpen(true);
                                    }}
                                    className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                                        orderType === 'dine_in'
                                            ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md'
                                            : 'text-[#F4EFE6]/70 hover:text-white'
                                    }`}
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">{selectedTable}</span>
                                </button>
                                <button
                                    onClick={() => setOrderType('takeaway')}
                                    className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                                        orderType === 'takeaway'
                                            ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md'
                                            : 'text-[#F4EFE6]/70 hover:text-white'
                                    }`}
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">Bawa Pulang</span>
                                </button>
                            </div>

                            {/* User Profile / Login Button */}
                            {auth?.user ? (
                                <button
                                    onClick={() => router.post('/logout')}
                                    title="Keluar / Logout"
                                    className="w-8 h-8 rounded-full bg-[#211D1B] border border-rose-500/40 text-rose-300 flex items-center justify-center hover:bg-rose-950 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FFF0BA] via-[#F6D072] to-[#C99A36] text-[#1A1412] font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
                                >
                                    <UserIcon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Masuk</span> Akun
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Member Greeting / Guest Table Sub-bar */}
                    <div className="mt-3 pt-2.5 border-t border-[#B99A65]/20 flex items-center justify-between text-xs">
                        {auth?.user ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[#F4EFE6]/70">Selamat datang,</span>
                                <span className="font-bold text-[#D4B886]">{auth.user.name}</span>
                                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#B99A65]/20 text-[#D4B886] text-[10px] font-semibold border border-[#B99A65]/30">
                                    Akun Customer (Member)
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-[#211D1B] border border-[#B99A65]/40 text-[#D4B886] text-[10px] font-bold uppercase tracking-wider">
                                    Akun Tamu Meja
                                </span>
                                <span className="text-[11px] text-[#F4EFE6]/70 hidden sm:inline">
                                    Bisa pesan langsung tanpa login. <Link href="/login" className="text-[#D4B886] underline font-semibold ml-1">Masuk Customer</Link> untuk simpan riwayat & favorit.
                                </span>
                            </div>
                        )}
                        <div className="text-[11px] text-[#D4B886] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>{orderType === 'dine_in' ? `Makan di ${selectedTable}` : 'Takeaway (Self-Pickup)'}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ========================================================
                MAIN CONTENT TABS (MENU, FAVORITES, HISTORY, CHAT)
            ======================================================== */}
            <main className="max-w-5xl mx-auto px-4 py-6">
                {/* Desktop Tabs Header */}
                <div className="hidden sm:flex items-center gap-2 mb-6 border-b border-[#B99A65]/30 pb-3">
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                            activeTab === 'menu'
                                ? 'bg-[#32151F] text-[#D4B886] shadow-md border border-[#B99A65]/50'
                                : 'text-[#211D1B]/70 hover:text-[#32151F] hover:bg-[#E8DFCF]'
                        }`}
                    >
                        <Utensils className="w-4 h-4" />
                        <span>Katalog Menu</span>
                    </button>

                    {!isGuest && (
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                                activeTab === 'favorites'
                                    ? 'bg-[#32151F] text-[#D4B886] shadow-md border border-[#B99A65]/50'
                                    : 'text-[#211D1B]/70 hover:text-[#32151F] hover:bg-[#E8DFCF]'
                            }`}
                        >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                            <span>Favorit Saya ({favorites.length})</span>
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                            activeTab === 'history'
                                ? 'bg-[#32151F] text-[#D4B886] shadow-md border border-[#B99A65]/50'
                                : 'text-[#211D1B]/70 hover:text-[#32151F] hover:bg-[#E8DFCF]'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        <span>{isGuest ? `Pelacakan Pesanan (${initialOrders.length})` : `Riwayat Pembelian (${initialOrders.length})`}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                            activeTab === 'chat'
                                ? 'bg-[#32151F] text-[#D4B886] shadow-md border border-[#B99A65]/50'
                                : 'text-[#211D1B]/70 hover:text-[#32151F] hover:bg-[#E8DFCF]'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Konsierge / Chat Admin</span>
                    </button>
                </div>

                {/* Banner Status Pesanan Aktif (Live Tracking di Tab Menu) */}
                {activeOrder && activeTab === 'menu' && (
                    <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65] text-[#F4EFE6] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#B99A65]/20 border border-[#B99A65]/50 flex items-center justify-center text-[#D4B886] flex-shrink-0">
                                <Clock className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#D4B886]">
                                        {activeOrder.order_code}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-[#F4EFE6] font-semibold border border-[#B99A65]/30">
                                        {activeOrder.order_type === 'dine_in' ? (activeOrder.table_number || 'Dine-in') : 'Takeaway'}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-[#F4EFE6] mt-0.5">
                                    Status: <span className="text-[#D4B886]">
                                        {(activeOrder.order_status as string) === 'Pending' ? '⏳ Menunggu Konfirmasi / ACC Kasir' : (activeOrder.order_status as string) === 'Preparing' ? '🔥 Sedang Dimasak Dapur' : '✨ Pesanan Siap Disajikan / Diambil'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => router.reload({ only: ['orders'] })}
                                className="px-3 py-2 rounded-xl bg-black/30 text-[#D4B886] hover:bg-black/50 border border-[#B99A65]/30 transition-all text-xs flex items-center gap-1.5"
                                title="Perbarui Status Pesanan"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Cek Status</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Lihat Tracking Meja
                            </button>
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    TAB 1 & 2: MENU & FAVORITES LIST
                ---------------------------------------------------- */}
                {(activeTab === 'menu' || activeTab === 'favorites') && (
                    <div className="space-y-6">
                        {/* Search and Category Filter */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#B99A65] absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari hidangan favorit (Wagyu, Bebek Betutu, Rawon, Es Bir Pletok)..."
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#B99A65]/40 text-xs text-[#211D1B] placeholder-stone-400 focus:outline-none focus:border-[#32151F] shadow-sm"
                                />
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                        selectedCategory === 'all'
                                            ? 'bg-[#32151F] text-[#D4B886] shadow-md font-bold'
                                            : 'bg-white text-[#211D1B]/70 hover:text-[#211D1B] border border-stone-300'
                                    }`}
                                >
                                    Semua Kategori
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.slug)}
                                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                            selectedCategory === cat.slug
                                                ? 'bg-[#32151F] text-[#D4B886] shadow-md font-bold'
                                                : 'bg-white text-[#211D1B]/70 hover:text-[#211D1B] border border-stone-300'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Grid / Favorites Guest Lock */}
                        {activeTab === 'favorites' && isGuest ? (
                            <div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#B99A65]/40 shadow-md max-w-lg mx-auto">
                                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-500 mx-auto flex items-center justify-center mb-4">
                                    <Heart className="w-8 h-8 fill-current" />
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block mb-1">
                                    Fitur Khusus Akun Customer
                                </span>
                                <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                    Simpan Hidangan Favorit Anda
                                </h3>
                                <p className="text-xs text-[#211D1B]/70 mt-2 leading-relaxed">
                                    Sebagai <strong>Akun Tamu Meja</strong>, hidangan favorit tidak disimpan secara permanen. Masuk ke Akun Customer Anda agar daftar hidangan favorit, re-order cepat, dan preferensi koki Anda selalu tersimpan.
                                </p>
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Link
                                        href="/login"
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all"
                                    >
                                        Masuk ke Akun Customer
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('menu')}
                                        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                                    >
                                        Jelajahi Menu
                                    </button>
                                </div>
                            </div>
                        ) : displayedMenus.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedMenus.map(menu => {
                                    const isOutOfStock = !menu.is_available || menu.stock_quantity <= 0;
                                    const isFav = favorites.includes(menu.id);

                                    return (
                                        <div
                                            key={menu.id}
                                            className={`rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                                                isOutOfStock
                                                    ? 'bg-stone-200/60 border-stone-300 opacity-60'
                                                    : 'bg-white border-[#B99A65]/30 hover:border-[#32151F] hover:shadow-xl'
                                            }`}
                                        >
                                            <div className="relative h-48 w-full bg-stone-900 overflow-hidden">
                                                <img
                                                    src={menu.image_path}
                                                    alt={menu.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                                {menu.is_best_seller && (
                                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] text-[10px] font-bold uppercase tracking-wider shadow">
                                                        Best Seller
                                                    </span>
                                                )}

                                                {isOutOfStock && (
                                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 text-[10px] font-bold uppercase tracking-wider">
                                                        Habis
                                                    </span>
                                                )}

                                                {/* Favorite Toggle */}
                                                <button
                                                    onClick={() => handleToggleFavorite(menu.id)}
                                                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-md transition-all ${
                                                        isFav
                                                            ? 'bg-rose-950/90 text-rose-400 border border-rose-500/50'
                                                            : 'bg-black/40 text-white hover:text-rose-400'
                                                    }`}
                                                >
                                                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                </button>

                                                <div className="absolute bottom-3 left-3">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#32151F] text-[#D4B886]">
                                                        {menu.category_name}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-5 flex flex-col flex-grow justify-between">
                                                <div>
                                                    <h3 className="font-heading text-xl font-bold text-[#32151F] leading-snug">
                                                        {menu.name}
                                                    </h3>
                                                    <p className="mt-1.5 text-xs text-[#211D1B]/70 line-clamp-2 leading-relaxed">
                                                        {menu.description}
                                                    </p>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between">
                                                    <span className="font-heading text-lg font-bold text-[#32151F]">
                                                        {formatRupiah(menu.price)}
                                                    </span>

                                                    {isOutOfStock ? (
                                                        <span className="text-xs font-semibold text-stone-400">
                                                            Habis
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenCustomizer(menu)}
                                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#32151F] text-[#D4B886] hover:bg-gradient-to-r hover:from-[#B99A65] hover:to-[#D4B886] hover:text-[#211D1B] transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Pesan</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-3xl border border-stone-300">
                                <Utensils className="w-12 h-12 text-[#B99A65] mx-auto mb-3 opacity-50" />
                                <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                    {activeTab === 'favorites' ? 'Belum Ada Menu Favorit' : 'Menu Tidak Ditemukan'}
                                </h3>
                                <p className="text-xs text-[#211D1B]/70 mt-1 max-w-sm mx-auto">
                                    {activeTab === 'favorites' 
                                        ? 'Tekan ikon hati pada menu untuk menyimpannya ke daftar favorit agar mudah dipesan kembali.'
                                        : 'Coba ganti kata kunci pencarian atau ubah filter kategori Anda.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ----------------------------------------------------
                    TAB 3: RIWAYAT PEMBELIAN & RATING
                ---------------------------------------------------- */}
                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-heading text-2xl font-bold text-[#32151F]">
                                    {isGuest ? 'Pelacakan Pesanan Meja (Live Tracking)' : 'Riwayat Pembelian Pelanggan'}
                                </h2>
                                <p className="text-xs text-[#211D1B]/70 mt-0.5">
                                    {isGuest 
                                        ? 'Pantau tahapan pesanan aktif Anda: Menunggu ACC kasir, proses memasak dapur, hingga siap disajikan ke meja.'
                                        : 'Pantau status pesanan aktif dan beri rating kepuasan hidangan yang sudah selesai.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.reload({ only: ['orders'] })}
                                    className="p-2 rounded-xl bg-white border border-[#B99A65]/40 text-[#32151F] hover:bg-[#32151F] hover:text-[#D4B886] transition-all text-xs flex items-center gap-1.5 shadow-sm"
                                    title="Perbarui status pesanan"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                                <span className="px-3 py-1 rounded-full bg-[#32151F] text-[#D4B886] text-xs font-bold">
                                    {initialOrders.length} Pesanan
                                </span>
                            </div>
                        </div>

                        {initialOrders.length > 0 ? (
                            <div className="space-y-4">
                                {initialOrders.map(order => {
                                    const isServedOrDone = ['Served', 'Picked Up', 'Completed'].includes(order.order_status);

                                    return (
                                        <div 
                                            key={order.id} 
                                            className="p-6 rounded-3xl bg-white border border-[#B99A65]/40 shadow-md space-y-4"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-bold text-[#32151F]">
                                                            {order.order_code}
                                                        </span>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#32151F]/10 text-[#32151F]">
                                                            {order.order_type === 'dine_in' ? 'Dine-in (Meja)' : 'Takeaway (Pickup)'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-stone-500 mt-1">
                                                        Waktu Pesan: {new Date(order.created_at).toLocaleString('id-ID')}
                                                    </p>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                        isServedOrDone
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : (order.order_status as string) === 'Preparing'
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                                            : (order.order_status as string) === 'Pending'
                                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse'
                                                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                                                    }`}>
                                                        {(order.order_status as string) === 'Pending' ? 'Menunggu ACC Kasir' : (order.order_status as string) === 'Preparing' ? 'Proses Dapur' : (order.order_status as string) === 'Ready' ? 'Siap Saji' : order.order_status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Live Order Tracking Stepper */}
                                            <div className="py-3.5 px-4 rounded-2xl bg-[#32151F]/5 border border-[#B99A65]/30">
                                                <div className="flex items-center justify-between text-xs mb-3">
                                                    <span className="font-bold text-[#32151F] flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-[#B99A65]" />
                                                        <span>Status Live Tracking:</span>
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-[#B99A65]">
                                                        {(order.order_status as string) === 'Pending' ? '1/4 - Menunggu ACC Kasir' : (order.order_status as string) === 'Preparing' ? '2/4 - Sedang Dimasak Dapur' : (order.order_status as string) === 'Ready' ? '3/4 - Siap Disajikan' : '4/4 - Selesai Terhidang'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                                                    <div className="space-y-1">
                                                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                                                            getStatusStep(order.order_status) >= 1
                                                                ? getStatusStep(order.order_status) === 1 ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                                                                : 'bg-stone-200 text-stone-500'
                                                        }`}>
                                                            {getStatusStep(order.order_status) > 1 ? '✓' : '1'}
                                                        </div>
                                                        <p className={`font-semibold ${getStatusStep(order.order_status) === 1 ? 'text-amber-700 font-bold' : 'text-stone-600'}`}>
                                                            ACC Kasir
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                                                            getStatusStep(order.order_status) >= 2
                                                                ? getStatusStep(order.order_status) === 2 ? 'bg-orange-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                                                                : 'bg-stone-200 text-stone-500'
                                                        }`}>
                                                            {getStatusStep(order.order_status) > 2 ? '✓' : '2'}
                                                        </div>
                                                        <p className={`font-semibold ${getStatusStep(order.order_status) === 2 ? 'text-orange-700 font-bold' : 'text-stone-600'}`}>
                                                            Proses Dapur
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                                                            getStatusStep(order.order_status) >= 3
                                                                ? getStatusStep(order.order_status) === 3 ? 'bg-sky-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                                                                : 'bg-stone-200 text-stone-500'
                                                        }`}>
                                                            {getStatusStep(order.order_status) > 3 ? '✓' : '3'}
                                                        </div>
                                                        <p className={`font-semibold ${getStatusStep(order.order_status) === 3 ? 'text-sky-700 font-bold' : 'text-stone-600'}`}>
                                                            Siap Saji
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                                                            getStatusStep(order.order_status) >= 4
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-stone-200 text-stone-500'
                                                        }`}>
                                                            {getStatusStep(order.order_status) >= 4 ? '✓' : '4'}
                                                        </div>
                                                        <p className={`font-semibold ${getStatusStep(order.order_status) >= 4 ? 'text-emerald-700 font-bold' : 'text-stone-600'}`}>
                                                            Selesai
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Item snapshots */}
                                            <div className="space-y-2 text-xs">
                                                {order.items?.map(it => (
                                                    <div key={it.id} className="flex justify-between items-start py-1">
                                                        <div>
                                                            <span className="font-semibold text-[#211D1B]">
                                                                {it.quantity}x {it.menu_name_snapshot}
                                                            </span>
                                                            {it.item_notes && (
                                                                <p className="text-[11px] text-[#B99A65] italic mt-0.5">
                                                                    Catatan: "{it.item_notes}"
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-[#32151F]">
                                                            {formatRupiah(it.subtotal)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {order.customer_notes && (
                                                <div className="p-3 rounded-xl bg-stone-100 text-[11px] text-stone-700">
                                                    <strong>Catatan Umum:</strong> {order.customer_notes}
                                                </div>
                                            )}

                                            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                                                <div>
                                                    <span className="text-[11px] text-stone-500 block">Total Pembayaran (Termasuk PB1 11%)</span>
                                                    <span className="font-heading text-xl font-bold text-[#32151F]">
                                                        {formatRupiah(order.total)}
                                                    </span>
                                                </div>

                                                {/* Rating & Review Action */}
                                                {order.rating ? (
                                                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                                                        <div className="flex text-amber-500">
                                                            {Array.from({ length: order.rating.rating }).map((_, i) => (
                                                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                                            ))}
                                                        </div>
                                                        <span>Ulasan Diterima</span>
                                                    </div>
                                                ) : isServedOrDone ? (
                                                    <button
                                                        onClick={() => {
                                                            setRatingOrder(order);
                                                            setSelectedStars(5);
                                                            setReviewComment('');
                                                        }}
                                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider hover:shadow-md transition-all flex items-center gap-1.5"
                                                    >
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        <span>Beri Rating & Ulasan</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-stone-500 italic">
                                                        Rating dapat diberikan setelah pesanan selesai disajikan.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {isGuest && initialOrders.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-900 text-xs flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-4 h-4 text-[#B99A65] flex-shrink-0" />
                                            <span>
                                                Pesanan di atas adalah pesanan aktif sesi meja Anda saat ini.
                                            </span>
                                        </div>
                                        <Link 
                                            href="/login" 
                                            className="px-3 py-1.5 rounded-lg bg-[#32151F] text-[#D4B886] font-bold text-[11px] whitespace-nowrap hover:bg-[#B99A65] hover:text-[#211D1B] transition-all"
                                        >
                                            Simpan ke Akun Customer
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : isGuest ? (
                            <div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#B99A65]/40 shadow-sm max-w-lg mx-auto">
                                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-[#B99A65] mx-auto flex items-center justify-center mb-4">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block mb-1">
                                    Sesi Akun Tamu Meja
                                </span>
                                <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                    Belum Ada Riwayat Pesanan
                                </h3>
                                <p className="text-xs text-[#211D1B]/70 mt-2 leading-relaxed">
                                    Saat Anda memesan sebagai Tamu Meja, pesanan aktif sesi ini akan tampil di sini. Namun untuk menyimpan seluruh arsip struk digital dan melihat riwayat pembelian sebelumnya secara permanen, silakan masuk ke Akun Customer.
                                </p>
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Link
                                        href="/login"
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all"
                                    >
                                        Masuk ke Akun Customer
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('menu')}
                                        className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                                    >
                                        Pesan Menu Sekarang
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-3xl border border-stone-300">
                                <Clock className="w-12 h-12 text-[#B99A65] mx-auto mb-3 opacity-50" />
                                <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                    Belum Ada Riwayat Pesanan
                                </h3>
                                <p className="text-xs text-[#211D1B]/70 mt-1 max-w-sm mx-auto">
                                    Pesanan yang Anda buat akan tercatat otomatis di sini beserta nota digital dan fitur ulasan.
                                </p>
                                <button
                                    onClick={() => setActiveTab('menu')}
                                    className="mt-4 px-6 py-2.5 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider"
                                >
                                    Pesan Menu Sekarang
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ----------------------------------------------------
                    TAB 4: CHAT WITH ADMIN / CONCIERGE
                ---------------------------------------------------- */}
                {activeTab === 'chat' && (
                    isGuest ? (
                        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#B99A65]/40 shadow-sm max-w-lg mx-auto">
                            <div className="w-16 h-16 rounded-full bg-[#32151F] border border-[#B99A65] text-[#D4B886] mx-auto flex items-center justify-center mb-4 shadow">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block mb-1">
                                Fitur Khusus Akun Customer
                            </span>
                            <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                Live Concierge & Bantuan Staf
                            </h3>
                            <p className="text-xs text-[#211D1B]/70 mt-2 leading-relaxed">
                                Fitur interaktif obrolan langsung dengan kasir dan concierge restoran memerlukan identitas Akun Customer terdaftar.
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link
                                    href="/login"
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all"
                                >
                                    Masuk ke Akun Customer
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('menu')}
                                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                                >
                                    Kembali ke Menu
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl bg-white border border-[#B99A65]/40 shadow-xl overflow-hidden flex flex-col h-[600px]">
                        {/* Chat Header */}
                        <div className="p-4 bg-[#32151F] text-[#F4EFE6] flex items-center justify-between border-b border-[#B99A65]/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#211D1B] border border-[#B99A65] text-[#D4B886] flex items-center justify-center font-bold">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-heading text-lg font-bold text-[#F4EFE6] leading-none">
                                        NUSARA Live Concierge
                                    </h4>
                                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>Staf Admin & Kasir Online</span>
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] text-[#D4B886] font-semibold hidden sm:inline">
                                Bantuan Khusus Meja & Pesanan
                            </span>
                        </div>

                        {/* Chat Message List */}
                        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]">
                            {initialChats.map(chat => {
                                const isMe = chat.sender_type === 'customer';
                                return (
                                    <div 
                                        key={chat.id} 
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                            isMe 
                                                ? 'bg-[#32151F] text-[#F4EFE6] rounded-br-none shadow' 
                                                : 'bg-white text-[#211D1B] border border-stone-200 rounded-bl-none shadow-sm'
                                        }`}>
                                            {!isMe && (
                                                <span className="font-bold text-[10px] text-[#B99A65] block uppercase tracking-wider mb-1">
                                                    Concierge NUSARA
                                                </span>
                                            )}
                                            <p>{chat.message}</p>
                                        </div>
                                        <span className="text-[9px] text-stone-400 mt-1 px-1">
                                            {new Date(chat.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Prompts */}
                        <div className="p-2.5 bg-stone-100 border-t border-stone-200 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                            <span className="text-[10px] text-stone-500 uppercase font-bold flex-shrink-0">Cepat:</span>
                            <button
                                onClick={() => setChatInput('Berapa lama estimasi pesanan saya siap?')}
                                className="px-3 py-1 rounded-full bg-white border border-stone-300 text-[11px] whitespace-nowrap hover:border-[#32151F]"
                            >
                                Estimasi Waktu?
                            </button>
                            <button
                                onClick={() => setChatInput('Tolong bawakan piring kecil dan garpu tambahan ke meja saya.')}
                                className="px-3 py-1 rounded-full bg-white border border-stone-300 text-[11px] whitespace-nowrap hover:border-[#32151F]"
                            >
                                Piring & Garpu Tambahan
                            </button>
                            <button
                                onClick={() => setChatInput('Apakah menu rendang ini sangat pedas?')}
                                className="px-3 py-1 rounded-full bg-white border border-stone-300 text-[11px] whitespace-nowrap hover:border-[#32151F]"
                            >
                                Tingkat Kepedasan Rendang?
                            </button>
                        </div>

                        {/* Chat Input Box */}
                        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Tulis pesan ke admin atau minta bantuan staf..."
                                className="flex-grow px-4 py-2.5 rounded-full bg-stone-100 border border-stone-300 text-xs focus:outline-none focus:border-[#32151F]"
                            />
                            <button
                                type="submit"
                                disabled={isSendingChat || !chatInput.trim()}
                                className="p-2.5 rounded-full bg-[#32151F] text-[#D4B886] hover:bg-gradient-to-r hover:from-[#B99A65] hover:to-[#D4B886] hover:text-[#211D1B] disabled:opacity-40 transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                    )
                )}
            </main>

            {/* ========================================================
                BOTTOM FLOATING CART PILL (KOPKEN STYLE)
            ======================================================== */}
            {cartCount > 0 && !isCartOpen && (
                <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
                    <div className="max-w-md mx-auto pointer-events-auto">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#32151F] to-[#211D1B] border border-[#B99A65] text-[#F4EFE6] shadow-2xl flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all animate-bounce-subtle"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#B99A65] text-[#211D1B] flex items-center justify-center font-bold relative">
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center border-2 border-[#211D1B]">
                                        {cartCount}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] uppercase font-bold text-[#D4B886] block">
                                        Keranjang ({orderType === 'dine_in' ? selectedTable : 'Takeaway'})
                                    </span>
                                    <span className="font-heading text-lg font-bold text-[#F4EFE6]">
                                        {formatRupiah(cartTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4B886] uppercase tracking-wider pr-1">
                                <span>Lihat Keranjang</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================
                MOBILE BOTTOM NAVIGATION BAR (KOPKEN APP STYLE)
            ======================================================== */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-[#211D1B] border-t border-[#32151F] text-[#F4EFE6] py-2 px-4 shadow-2xl">
                <div className={`grid ${isGuest ? 'grid-cols-3' : 'grid-cols-4'} gap-1 text-center`}>
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex flex-col items-center py-1 transition-colors ${
                            activeTab === 'menu' ? 'text-[#D4B886] font-bold' : 'text-[#F4EFE6]/60'
                        }`}
                    >
                        <Utensils className="w-5 h-5" />
                        <span className="text-[10px] mt-1">Menu</span>
                    </button>

                    {!isGuest && (
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`flex flex-col items-center py-1 transition-colors ${
                                activeTab === 'favorites' ? 'text-rose-400 font-bold' : 'text-[#F4EFE6]/60'
                            }`}
                        >
                            <Heart className="w-5 h-5" />
                            <span className="text-[10px] mt-1">Favorit</span>
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex flex-col items-center py-1 transition-colors ${
                            activeTab === 'history' ? 'text-[#D4B886] font-bold' : 'text-[#F4EFE6]/60'
                        }`}
                    >
                        <Clock className="w-5 h-5" />
                        <span className="text-[10px] mt-1">{isGuest ? 'Tracking' : 'Riwayat'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex flex-col items-center py-1 transition-colors ${
                            activeTab === 'chat' ? 'text-[#D4B886] font-bold' : 'text-[#F4EFE6]/60'
                        }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-[10px] mt-1">Konsierge</span>
                    </button>
                </div>
            </nav>

            {/* ========================================================
                MODAL 1: ITEM CUSTOMIZER / SPECIAL NOTES (REQUEST KHUSUS)
            ======================================================== */}
            {customizingMenu && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 shadow-2xl text-[#F4EFE6]">
                        <button
                            onClick={() => setCustomizingMenu(null)}
                            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex gap-4 items-start mb-4">
                            <img
                                src={customizingMenu.image_path}
                                alt={customizingMenu.name}
                                className="w-20 h-20 rounded-2xl object-cover border border-[#B99A65]/30 flex-shrink-0"
                            />
                            <div>
                                <span className="text-[10px] uppercase font-bold text-[#B99A65] tracking-wider">
                                    {customizingMenu.category_name}
                                </span>
                                <h3 className="font-heading text-xl font-bold text-[#F4EFE6] leading-tight">
                                    {customizingMenu.name}
                                </h3>
                                <span className="font-heading text-lg font-bold text-[#D4B886] block mt-1">
                                    {formatRupiah(customizingMenu.price)}
                                </span>
                            </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="p-3.5 rounded-2xl bg-[#32151F] border border-[#B99A65]/30 mb-4 flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#F4EFE6]">Jumlah Pesanan</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCustomizeQuantity(Math.max(1, customizeQuantity - 1))}
                                    className="w-8 h-8 rounded-lg bg-[#211D1B] border border-[#B99A65]/40 flex items-center justify-center text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B]"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-sm w-6 text-center">{customizeQuantity}</span>
                                <button
                                    onClick={() => setCustomizeQuantity(customizeQuantity + 1)}
                                    className="w-8 h-8 rounded-lg bg-[#211D1B] border border-[#B99A65]/40 flex items-center justify-center text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B]"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Special Notes / Request Khusus */}
                        <div className="mb-6">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                Catatan Khusus Menu Ini (Request):
                            </label>
                            <textarea
                                rows={2}
                                value={customizeNotes}
                                onChange={(e) => setCustomizeNotes(e.target.value)}
                                placeholder="Contoh: Pedas sedang, kuah dipisah, tanpa daun ketumbar, es batu sedikit, dll."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                            />
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all"
                        >
                            Tambahkan ke Keranjang — {formatRupiah(customizingMenu.price * customizeQuantity)}
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: FULL CART DRAWER & ORDER LOCK CHECKOUT
            ======================================================== */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-lg bg-[#211D1B] border-l border-[#B99A65]/40 h-full p-6 text-[#F4EFE6] flex flex-col justify-between overflow-y-auto">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-[#32151F] pb-4 mb-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65]">
                                        Konfirmasi Pemesanan
                                    </span>
                                    <h3 className="font-heading text-2xl font-bold text-[#F4EFE6]">
                                        Keranjang Anda
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="p-2 rounded-full text-stone-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mode info */}
                            <div className="p-3 rounded-xl bg-[#32151F] border border-[#B99A65]/30 text-xs mb-4 flex items-center justify-between">
                                <span className="text-[#F4EFE6]/80">Jenis Pesanan:</span>
                                <span className="font-bold text-[#D4B886] uppercase">
                                    {orderType === 'dine_in' ? `Dine-in (${selectedTable})` : 'Takeaway (Self-Pickup)'}
                                </span>
                            </div>

                            {/* Input Nama Pemesan / Tamu */}
                            <div className="mb-4">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5 flex items-center justify-between">
                                    <span>Nama Pemesan / Pelanggan:</span>
                                    <span className="text-[10px] text-amber-300 font-normal">*Wajib diisi</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Masukkan Nama Anda (contoh: Pak Budi)"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/40 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                                />
                            </div>

                            {/* Pilihan Nomor Meja (Khusus Dine-in): Dropdown + Ketik Manual */}
                            {orderType === 'dine_in' && (
                                <div className="mb-4 space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65]">
                                        Nomor Meja Dine-In:
                                    </label>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={selectedTable}
                                            onChange={(e) => setSelectedTable(e.target.value)}
                                            placeholder="Ketik manual meja (contoh: Meja 03)..."
                                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/40 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                                        />
                                        <select
                                            value={tables.some(t => t.table_number === selectedTable) ? selectedTable : ''}
                                            onChange={(e) => {
                                                if (e.target.value) setSelectedTable(e.target.value);
                                            }}
                                            className="px-3 py-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-xs text-[#D4B886] font-semibold focus:outline-none"
                                        >
                                            <option value="">Pilih List Meja</option>
                                            {tables.map(t => (
                                                <option key={t.id} value={t.table_number}>
                                                    {t.table_number} ({t.capacity || 5} Kursi)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Catatan Wajib: Sesuai meja fisik */}
                                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Penting:</strong> Harus sesuai dengan nomor meja yang sedang ditempati saat ini agar hidangan diantar pelayan ke meja yang tepat.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Item List */}
                            <div className="space-y-3 mb-6">
                                {cart.map((item, index) => (
                                    <div 
                                        key={index}
                                        className="p-3.5 rounded-2xl bg-[#32151F]/60 border border-[#B99A65]/20 space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-bold text-xs text-[#F4EFE6]">
                                                    {item.menu.name}
                                                </h5>
                                                <span className="text-[11px] text-[#D4B886]">
                                                    {formatRupiah(item.menu.price)} x {item.quantity}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, -1)}
                                                    className="w-7 h-7 rounded-lg bg-[#211D1B] border border-[#B99A65]/30 flex items-center justify-center text-xs text-[#D4B886]"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, 1)}
                                                    className="w-7 h-7 rounded-lg bg-[#211D1B] border border-[#B99A65]/30 flex items-center justify-center text-xs text-[#D4B886]"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline note edit */}
                                        <input
                                            type="text"
                                            value={item.item_notes}
                                            onChange={(e) => handleUpdateItemNotes(index, e.target.value)}
                                            placeholder="Catatan menu: misal pedas sedang..."
                                            className="w-full px-3 py-1.5 rounded-lg bg-[#211D1B] border border-[#B99A65]/20 text-[11px] text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* General Notes */}
                            <div className="mb-4">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                    Catatan Umum Pesanan (Opsional):
                                </label>
                                <textarea
                                    rows={2}
                                    value={generalNotes}
                                    onChange={(e) => setGeneralNotes(e.target.value)}
                                    placeholder="Contoh: Tolong disajikan bersamaan, kami membawa kue ulang tahun..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#32151F]/60 border border-[#B99A65]/30 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                                />
                            </div>

                            {/* Payment Method Selector */}
                            <div className="mb-6">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-2">
                                    Metode Pembayaran:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('qris')}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                            paymentMethod === 'qris'
                                                ? 'bg-[#B99A65] text-[#211D1B] border-[#D4B886] font-bold'
                                                : 'bg-[#32151F] text-[#F4EFE6]/70 border-[#B99A65]/30'
                                        }`}
                                    >
                                        QRIS Instan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                            paymentMethod === 'bank_transfer'
                                                ? 'bg-[#B99A65] text-[#211D1B] border-[#D4B886] font-bold'
                                                : 'bg-[#32151F] text-[#F4EFE6]/70 border-[#B99A65]/30'
                                        }`}
                                    >
                                        Virtual Account
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                            paymentMethod === 'cash'
                                                ? 'bg-[#B99A65] text-[#211D1B] border-[#D4B886] font-bold'
                                                : 'bg-[#32151F] text-[#F4EFE6]/70 border-[#B99A65]/30'
                                        }`}
                                    >
                                        Tunai di Kasir
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Total & Order Lock Warning (PRD Section 4.2) */}
                        <div className="pt-4 border-t border-[#32151F] space-y-3">
                            {/* PRD Order Lock Callout */}
                            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-2">
                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong>Ketentuan PRD NUSARA:</strong> Setelah pesanan dibayar dan dikonfirmasi, pesanan langsung masuk ke dapur dan tidak dapat diubah atau dibatalkan.
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-[#F4EFE6]/70">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(cartSubtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pajak Restoran (PB1 11%)</span>
                                    <span>{formatRupiah(cartTax)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm text-[#D4B886] pt-1 border-t border-[#32151F]">
                                    <span>Total Tagihan</span>
                                    <span>{formatRupiah(cartTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut || cart.length === 0}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {isCheckingOut ? 'Memproses Order...' : `Kirim Pesanan — ${formatRupiah(cartTotal)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 3: RATING & REVIEW FOR COMPLETED ORDERS
            ======================================================== */}
            {ratingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 shadow-2xl text-[#F4EFE6] text-center">
                        <button
                            onClick={() => setRatingOrder(null)}
                            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 mx-auto flex items-center justify-center mb-3">
                            <Star className="w-7 h-7 fill-current" />
                        </div>

                        <h3 className="font-heading text-2xl font-bold text-[#F4EFE6]">
                            Bagaimana Pengalaman Santap Anda?
                        </h3>
                        <p className="text-xs text-[#F4EFE6]/70 mt-1 mb-4">
                            Ulasan Anda untuk pesanan <strong className="text-[#D4B886]">#{ratingOrder.order_code}</strong> sangat berharga bagi peningkatan mutu layanan kami.
                        </p>

                        {/* Interactive Star Selector */}
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setSelectedStars(star)}
                                    className="p-1 transition-transform hover:scale-125"
                                >
                                    <Star className={`w-8 h-8 ${
                                        star <= selectedStars ? 'text-amber-400 fill-amber-400' : 'text-stone-600'
                                    }`} />
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmitRating} className="space-y-4">
                            <textarea
                                rows={3}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Bagikan tanggapan Anda seputar kelezatan hidangan, keramahan staf, atau suasana restoran..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                            />

                            <button
                                type="submit"
                                disabled={isSubmittingRating}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {isSubmittingRating ? 'Mengirim Ulasan...' : 'Kirim Rating Bintang 5'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 4: SELECT TABLE FOR DINE-IN (10 MEJA DENGAN 5 KURSI)
            ======================================================== */}
            {isTableModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 shadow-2xl text-[#F4EFE6]">
                        <button
                            onClick={() => setIsTableModalOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B99A65] font-bold mb-1">
                            <QrCode className="w-4 h-4" />
                            <span>Dine-in Table Selector</span>
                        </div>
                        <h3 className="font-heading text-2xl font-bold text-[#F4EFE6] mb-1">
                            Pilih Nomor Meja Anda
                        </h3>
                        <p className="text-xs text-[#F4EFE6]/70 mb-4">
                            Tersedia 10 Meja (kapasitas masing-masing 5 kursi) di Main Dining Hall.
                        </p>

                        {/* Ketik Manual Nomor Meja */}
                        <div className="mb-4">
                            <label className="block text-[11px] font-semibold text-[#B99A65] uppercase tracking-wider mb-1.5">
                                Ketik Nomor Meja Manual:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={selectedTable}
                                    onChange={(e) => setSelectedTable(e.target.value)}
                                    placeholder="Contoh: Meja 03 atau ketik 3..."
                                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsTableModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs hover:scale-105 transition-all"
                                >
                                    Pilih
                                </button>
                            </div>
                        </div>

                        {/* Catatan Wajib: Sesuai meja fisik */}
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] flex items-start gap-2 mb-4">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Penting:</strong> Harus sesuai dengan nomor meja yang sedang Anda tempati saat ini agar hidangan diantar pelayan ke meja yang tepat.
                            </span>
                        </div>

                        {/* Grid 10 Meja (5 Kursi per Meja) */}
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedTable(table.table_number);
                                        setIsTableModalOpen(false);
                                    }}
                                    className={`p-3 rounded-2xl border text-center transition-all ${
                                        selectedTable === table.table_number
                                            ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold border-[#D4B886]'
                                            : 'bg-[#32151F] text-[#F4EFE6] border-[#B99A65]/30 hover:border-[#D4B886]'
                                    }`}
                                >
                                    <div className="text-sm font-bold">{table.table_number}</div>
                                    <div className="text-[10px] opacity-75">{table.location} ({table.capacity || 5} Kursi)</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
