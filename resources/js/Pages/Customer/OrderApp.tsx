import React, { useState, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import LogoutConfirmModal from '../../Components/LogoutConfirmModal';
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
    Users, 
    Plus, 
    Minus, 
    CheckCircle2, 
    AlertCircle, 
    MapPin, 
    Utensils, 
    UtensilsCrossed,
    Check, 
    Info, 
    ShieldCheck,
    LogOut,
    Coffee,
    User as UserIcon,
    RefreshCw,
    PanelLeft
} from 'lucide-react';

function TypingGreeting({ name }: { name: string }) {
    const rawName = name?.trim() || 'Tamu Terhormat';
    const prefix = 'Selamat datang, ';
    const fullText = prefix + rawName;
    const [charCount, setCharCount] = useState(0);
    const [isDone, setIsDone] = useState(false);

    React.useEffect(() => {
        let idx = 0;
        setCharCount(0);
        setIsDone(false);
        const timer = setInterval(() => {
            if (idx <= fullText.length) {
                setCharCount(idx);
                idx++;
            } else {
                setIsDone(true);
                clearInterval(timer);
            }
        }, 55);
        return () => clearInterval(timer);
    }, [fullText]);

    const prefixPart = fullText.slice(0, Math.min(charCount, prefix.length));
    const namePart = charCount > prefix.length ? fullText.slice(prefix.length, charCount) : '';

    return (
        <span className="inline-flex items-baseline flex-wrap">
            <span className="text-[#211D1B]">{prefixPart}</span>
            {namePart && (
                <span className="text-[#946E2D] ml-1.5 font-black drop-shadow-xs">
                    {namePart}
                </span>
            )}
            {!isDone && (
                <span className="inline-block w-1.5 h-6 ml-1.5 bg-[#946E2D] animate-pulse rounded-full self-center" />
            )}
        </span>
    );
}

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

    // Sidebar, Logout & Exit Confirmation Modal State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isExitHomeModalOpen, setIsExitHomeModalOpen] = useState(false);

    // Cart State with localStorage Persistence (Tersimpan aman walau logout / reload)
    const [cart, setCart] = useState<CartItem[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('nusara_customer_cart');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Gagal membaca data keranjang dari storage', e);
        }
        return [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [generalNotes, setGeneralNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bank_transfer' | 'cash'>('qris');
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Otomatis simpan setiap perubahan keranjang ke localStorage
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('nusara_customer_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Gagal menyimpan keranjang ke storage', e);
        }
    }, [cart]);

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

    // 3 Menu Promo Unggulan untuk Hero Full Desktop
    const promoMenus = useMemo(() => {
        const candidates = menus.filter(m => m.is_featured || m.is_best_seller);
        const list = candidates.length >= 3 ? candidates : menus;
        const discounts = [20, 25, 15];
        const badges = ['Promo Spesial 20%', 'Promo Terlaris 25%', 'Chef Choice 15%'];
        return list.slice(0, 3).map((item, idx) => {
            const disc = discounts[idx] || 20;
            const origPrice = Math.round((item.price / (1 - disc / 100)) / 1000) * 1000;
            return {
                ...item,
                promoBadge: badges[idx] || `${disc}% OFF`,
                originalPrice: origPrice,
                promoPrice: item.price,
                discountPercent: disc
            };
        });
    }, [menus]);

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

    const getStatusBadgeText = (status: string | any) => {
        const s = String(status || '');
        if (s === 'Pending' || s === 'Awaiting Payment') return 'Menunggu ACC Kasir';
        if (s === 'Preparing' || s === 'Paid' || s === 'Confirmed') return 'Proses Dapur';
        if (s === 'Ready') return 'Siap Saji';
        if (s === 'Served' || s === 'Picked Up' || s === 'Completed') return 'Selesai Terhidang';
        if (s === 'Cancelled') return 'Dibatalkan';
        return s;
    };

    const getStatusTrackerText = (status: string | any) => {
        const s = String(status || '');
        if (s === 'Pending' || s === 'Awaiting Payment') return '1/4 - Menunggu ACC Kasir';
        if (s === 'Preparing' || s === 'Paid' || s === 'Confirmed') return '2/4 - Sedang Dimasak Dapur';
        if (s === 'Ready') return '3/4 - Siap Disajikan';
        return '4/4 - Selesai Terhidang';
    };

    const getActiveOrderStatusText = (status: string | any) => {
        const s = String(status || '');
        if (s === 'Pending' || s === 'Awaiting Payment') return 'Menunggu Konfirmasi Kasir';
        if (s === 'Preparing' || s === 'Paid' || s === 'Confirmed') return 'Sedang Dimasak Dapur';
        return 'Pesanan Siap Disajikan / Diambil';
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

    const getMenuImageUrl = (path?: string) => {
        if (!path) return '/images/menus/sate-lilit.jpg';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/')) return path;
        return `/storage/${path}`;
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
                try {
                    localStorage.removeItem('nusara_customer_cart');
                } catch {}
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
                APP HEADER (LOGO + DINE IN / TAKE AWAY + SIDEBAR TRIGGER + LOGOUT)
            ======================================================== */}
            <header className="sticky top-0 z-40 bg-[#32151F] text-[#F4EFE6] shadow-xl border-b border-[#B99A65]/30">
                <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
                    {/* Left: Sidebar Toggle Button (Klik di Kiri, Muncul di Kiri) + Brand Logo */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(prev => !prev)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 relative border ${
                                isSidebarOpen
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] border-[#D4B886] shadow-md'
                                    : 'bg-[#211D1B] text-[#D4B886] border-[#B99A65]/40 hover:border-[#D4B886] hover:bg-[#2A2320]'
                            }`}
                            title={isSidebarOpen ? "Tutup Sidebar Menu" : "Buka Sidebar Menu (Kiri)"}
                        >
                            <PanelLeft className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold shadow animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        <button 
                            type="button"
                            onClick={() => {
                                if (cartCount > 0) {
                                    setIsExitHomeModalOpen(true);
                                } else {
                                    router.visit('/');
                                }
                            }}
                            title="Kembali ke Beranda Publik"
                            className="group flex items-center gap-2 text-left"
                        >
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA" 
                                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" 
                            />
                        </button>
                    </div>

                    {/* Right: Dine in / Takeaway Selector + Logout/Login (Button menu navbar dihilangkan sesuai permintaan) */}
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
                                title="Ganti Meja Makan di Restoran"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold">{selectedTable}</span>
                            </button>
                            <button
                                onClick={() => setOrderType('takeaway')}
                                className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                                    orderType === 'takeaway'
                                        ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md'
                                        : 'text-[#F4EFE6]/70 hover:text-white'
                                }`}
                                title="Bawa Pulang (Takeaway)"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold">Takeaway</span>
                            </button>
                        </div>

                        {/* Tombol Logout dengan Alert Konfirmasi */}
                        {auth?.user ? (
                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                title="Keluar / Logout Akun"
                                className="w-9 h-9 rounded-full bg-[#211D1B] border border-rose-500/40 text-rose-300 flex items-center justify-center hover:bg-rose-950/80 active:scale-90 transition-all shadow"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FFF0BA] via-[#F6D072] to-[#C99A36] text-[#1A1412] font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
                            >
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Masuk</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ========================================================
                CHROME-STYLE FLEX LAYOUT (LEFT PUSH SIDEBAR + MAIN CANVAS)
            ======================================================== */}
            <div className="flex w-full min-h-[calc(100vh-65px)] relative">
                {/* 
                    LEFT PUSH SIDEBAR ALA CHROME VERTICAL SIDE PANEL 
                    Background: Terang (#FAF7F2 / #F5F1E8)
                    Hover: Berubah lebih gelap (#E5DDCF / #D8CDBB)
                */}
                <aside 
                    className={`transition-all duration-300 ease-in-out flex-shrink-0 bg-[#FAF7F2] border-r border-[#E5DDCF] flex flex-col justify-between overflow-hidden ${
                        isSidebarOpen ? 'w-72 sm:w-80 opacity-100 shadow-lg' : 'w-0 opacity-0 pointer-events-none border-none'
                    }`}
                >
                    <div className="w-72 sm:w-80 h-full flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300 p-4 space-y-4">
                        <div>
                            {/* Panel Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#E5DDCF]">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[#211D1B] text-[#D4B886] flex items-center justify-center">
                                        <PanelLeft className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-sm text-[#211D1B]">
                                            Menu & Layanan
                                        </h2>
                                        <p className="text-[10px] text-[#7C6E65]">
                                            Sidebar Vertikal Nusara
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-[#EAE2D3] transition-colors"
                                    title="Tutup Panel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* User & Table Summary Box */}
                            <div className="p-3 my-3 rounded-2xl bg-[#F0E9DC] border border-[#E0D5C3] text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#695E57]">Pelanggan:</span>
                                    <span className="font-bold text-[#946E2D]">{auth?.user?.name || customerName || 'Tamu Restoran'}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DFD4C0]">
                                    <span className="text-[#695E57]">Layanan:</span>
                                    <button 
                                        type="button"
                                        onClick={() => setIsTableModalOpen(true)}
                                        className="font-bold text-[#211D1B] hover:text-[#946E2D] flex items-center gap-1 transition-colors"
                                    >
                                        <span>{orderType === 'dine_in' ? `Dine-in (${selectedTable})` : 'Takeaway (Self-Pickup)'}</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-[#946E2D]" />
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Menu List */}
                            <nav className="space-y-2">
                                {/* 1. Katalog Menu */}
                                <button
                                    onClick={() => setActiveTab('menu')}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-all ${
                                        activeTab === 'menu'
                                            ? 'bg-[#211D1B] text-[#F4EFE6] shadow-sm'
                                            : 'bg-white/80 text-[#211D1B] border border-[#E5DDCF] hover:bg-[#E4DCCA] hover:border-[#D0C5B3]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Utensils className="w-4 h-4 text-[#946E2D]" />
                                        <span>Katalog Menu</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                        activeTab === 'menu' ? 'bg-[#3A3330] text-[#D4B886]' : 'bg-[#EAE2D3] text-[#211D1B]'
                                    }`}>
                                        {menus.length}
                                    </span>
                                </button>

                                {/* 2. Keranjang Belanja */}
                                <button
                                    onClick={() => setIsCartOpen(true)}
                                    className="w-full p-3 rounded-xl flex items-center justify-between text-xs font-bold uppercase tracking-wider bg-white/80 text-[#211D1B] border border-[#E5DDCF] hover:bg-[#E4DCCA] hover:border-[#D0C5B3] transition-all group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className="w-4 h-4 text-[#946E2D]" />
                                        <span>Keranjang Pesanan</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {cartCount > 0 && (
                                            <span className="text-[10px] font-mono font-bold text-[#946E2D]">
                                                {formatRupiah(cartTotal)}
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow">
                                            {cartCount}
                                        </span>
                                    </div>
                                </button>

                                {/* 3. Favorit Saya */}
                                {!isGuest ? (
                                    <button
                                        onClick={() => setActiveTab('favorites')}
                                        className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-all ${
                                            activeTab === 'favorites'
                                                ? 'bg-[#211D1B] text-[#F4EFE6] shadow-sm'
                                                : 'bg-white/80 text-[#211D1B] border border-[#E5DDCF] hover:bg-[#E4DCCA] hover:border-[#D0C5B3]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                            <span>Favorit Saya</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                            activeTab === 'favorites' ? 'bg-[#3A3330] text-[#D4B886]' : 'bg-[#EAE2D3] text-[#211D1B]'
                                        }`}>
                                            {favorites.length}
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            alert('Fitur favorit hidangan memerlukan Akun Customer. Silakan masuk untuk menyimpan menu favorit Anda.');
                                            router.visit('/login');
                                        }}
                                        className="w-full p-3 rounded-xl flex items-center justify-between text-xs font-bold uppercase tracking-wider bg-white/40 text-stone-500 border border-[#E5DDCF] hover:bg-[#E4DCCA] transition-all"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Heart className="w-4 h-4 text-stone-400" />
                                            <span>Favorit (Login)</span>
                                        </div>
                                        <span className="text-[10px] text-[#946E2D]">Masuk</span>
                                    </button>
                                )}

                                {/* 4. Riwayat / Pelacakan Pesanan */}
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-all ${
                                        activeTab === 'history'
                                            ? 'bg-[#211D1B] text-[#F4EFE6] shadow-sm'
                                            : 'bg-white/80 text-[#211D1B] border border-[#E5DDCF] hover:bg-[#E4DCCA] hover:border-[#D0C5B3]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Clock className="w-4 h-4 text-[#946E2D]" />
                                        <span>{isGuest ? 'Pelacakan Pesanan' : 'Riwayat Pembelian'}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                        activeTab === 'history' ? 'bg-[#3A3330] text-[#D4B886]' : 'bg-[#EAE2D3] text-[#211D1B]'
                                    }`}>
                                        {initialOrders.length}
                                    </span>
                                </button>

                                {/* 5. Konsierge / Chat Admin */}
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-all ${
                                        activeTab === 'chat'
                                            ? 'bg-[#211D1B] text-[#F4EFE6] shadow-sm'
                                            : 'bg-white/80 text-[#211D1B] border border-[#E5DDCF] hover:bg-[#E4DCCA] hover:border-[#D0C5B3]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <MessageSquare className="w-4 h-4 text-[#946E2D]" />
                                        <span>Konsierge / Chat Admin</span>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </button>
                            </nav>
                        </div>

                        {/* Sidebar Footer: Keluar / Logout */}
                        <div className="pt-3 border-t border-[#E5DDCF]">
                            {auth?.user ? (
                                <button
                                    type="button"
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="w-full py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Keluar dari Akun</span>
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className="w-full py-2.5 px-3 rounded-xl bg-[#211D1B] text-[#D4B886] hover:bg-[#32151F] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                                >
                                    <UserIcon className="w-4 h-4" />
                                    <span>Masuk ke Akun Customer</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                {/* 
                    MAIN CONTENT AREA (SMOOTHLY SHIFTS RIGHT WHEN SIDEBAR OPENS)
                */}
                <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto w-full">
                    {/* ========================================================
                        HERO FULL DESKTOP: GREETING & 3 PROMO MENU HIGHLIGHTS
                        (Full 1 Halaman Desktop, Gambar Menu Promo, Harga Asli Dicoret)
                    ======================================================== */}
                    {activeTab === 'menu' && (
                        <section className="min-h-[82vh] lg:min-h-[86vh] flex flex-col justify-between pt-2 pb-10 mb-8 border-b border-[#E5DDCF]">
                            {/* Top: Editorial Greeting & Ambient Tag */}
                            <div className="space-y-3 max-w-4xl">
                                <button
                                    type="button"
                                    onClick={() => setIsTableModalOpen(true)}
                                    className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#32151F] to-[#211D1B] border border-[#B99A65]/50 text-xs font-semibold text-[#F4EFE6] shadow-md hover:border-[#D4B886] hover:shadow-lg transition-all active:scale-95"
                                    title="Pilih atau ganti nomor meja makan Anda"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4B886] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B99A65]"></span>
                                    </span>
                                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span className="font-heading tracking-wide text-xs sm:text-sm font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                        {orderType === 'dine_in' 
                                            ? `Makan di ${selectedTable?.match(/\d+/)?.[0] ? `Meja ${selectedTable.match(/\d+/)![0].padStart(2, '0')}` : 'Meja 01'}` 
                                            : 'Pesan Bawa Pulang (Klik untuk Makan di Meja)'}
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-[#B99A65] group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                                    <div className="space-y-2 max-w-2xl">
                                        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-[#211D1B] leading-[1.15]">
                                            <TypingGreeting name={auth?.user?.name || customerName} />
                                        </h1>
                                        <p className="text-xs sm:text-sm text-[#63574F] leading-relaxed">
                                            Nikmati kelezatan racikan bumbu autentik kepulauan Nusantara. Diolah dari bahan pusaka pilihan dengan resep turun-temurun, tersaji hangat langsung ke meja Anda.
                                        </p>
                                    </div>

                                    {/* Indikator Layanan Meja Aktif */}
                                    <div className="flex items-center gap-2 flex-shrink-0 self-start lg:self-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsTableModalOpen(true)}
                                            className="px-3.5 py-1.5 rounded-2xl bg-white border border-[#D5CBB9] shadow-xs hover:border-[#B99A65] flex items-center gap-2 text-xs transition-all text-[#63574F]"
                                        >
                                            <Users className="w-3.5 h-3.5 text-[#946E2D]" />
                                            <span className="font-medium text-[#211D1B]">
                                                {orderType === 'dine_in' ? `${selectedTable || 'Meja 01'} · 5 Kursi` : 'Bawa Pulang (Takeaway)'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Center: 3 Promo Bento Cards (Gapless, High-End Layout) */}
                            <div className="w-full my-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#946E2D]">
                                            Menu Rekomendasi Chef
                                        </span>
                                        <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#211D1B]">
                                            Sajian Promo Spesial
                                        </h2>
                                    </div>
                                    <a 
                                        href="#katalog-menu"
                                        className="text-xs font-bold text-[#946E2D] hover:underline flex items-center gap-1 transition-colors"
                                    >
                                        <span>Lihat Semua ({menus.length})</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </a>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
                                    {promoMenus.map((item, idx) => {
                                        const fallbackImg = idx === 0 
                                            ? 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
                                            : idx === 1
                                            ? 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'
                                            : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
                                        const imgSrc = item.image_path || fallbackImg;

                                        return (
                                            <div 
                                                key={item.id}
                                                className="group relative rounded-3xl bg-white border border-[#E5DDCF] hover:border-[#D4B886] hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between"
                                            >
                                                {/* Image Container with Badges */}
                                                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                                                    <img 
                                                        src={imgSrc} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                                                    {/* Promo Badge */}
                                                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md">
                                                        {item.promoBadge}
                                                    </span>

                                                    {/* Hemat Tag */}
                                                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-[#D4B886] font-mono font-bold text-[10px] border border-[#B99A65]/40">
                                                        Hemat {item.discountPercent}%
                                                    </span>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#946E2D] block mb-1">
                                                            {item.category_name || 'Hidangan Utama'}
                                                        </span>
                                                        <h3 className="font-heading font-bold text-base sm:text-lg text-[#211D1B] group-hover:text-[#946E2D] transition-colors line-clamp-1">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-xs text-[#63574F] line-clamp-2 mt-1 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                    </div>

                                                    {/* Price Section: Harga Asli Dicoret + Harga Promo */}
                                                    <div className="pt-3 border-t border-[#F0E9DC] flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[11px] line-through text-stone-400 font-mono block">
                                                                {formatRupiah(item.originalPrice)}
                                                            </span>
                                                            <span className="font-heading text-lg lg:text-xl font-extrabold text-[#946E2D] font-mono">
                                                                {formatRupiah(item.promoPrice)}
                                                            </span>
                                                        </div>

                                                        <button
                                                            onClick={() => handleOpenCustomizer(item)}
                                                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                            title="Pesan Menu Promo Ini"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                                            <span>Pesan</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bottom: Scroll Down Guidance Anchor */}
                            <div className="flex justify-center pt-2">
                                <a 
                                    href="#katalog-menu"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EAE2D3]/60 hover:bg-[#EAE2D3] border border-[#D5CBB9] text-xs font-semibold text-[#63574F] hover:text-[#211D1B] transition-all"
                                >
                                    <span>Gulir ke Bawah untuk Eksplorasi 20+ Menu Lengkap</span>
                                    <ChevronRight className="w-4 h-4 rotate-90 text-[#946E2D] animate-bounce" />
                                </a>
                            </div>
                        </section>
                    )}

                {/* Sub-Header Breadcrumb saat melihat tab selain menu (Favorit / Riwayat / Chat) */}
                {activeTab !== 'menu' && (
                    <div className="mb-5 flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#B99A65]/30 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#32151F]">
                            {activeTab === 'favorites' && <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />}
                            {activeTab === 'history' && <Clock className="w-4 h-4 text-[#B99A65]" />}
                            {activeTab === 'chat' && <MessageSquare className="w-4 h-4 text-[#B99A65]" />}
                            <span>
                                {activeTab === 'favorites' ? `Favorit Saya (${favorites.length})` : activeTab === 'history' ? (isGuest ? `Pelacakan Pesanan (${initialOrders.length})` : `Riwayat Pembelian (${initialOrders.length})`) : 'Konsierge / Chat Admin'}
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveTab('menu')}
                            className="px-3 py-1.5 rounded-xl bg-[#32151F] text-[#D4B886] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Katalog</span>
                        </button>
                    </div>
                )}

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
                                        {getActiveOrderStatusText(activeOrder.order_status)}
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
                    <div id="katalog-menu" className="space-y-6 pt-2 scroll-mt-20">
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
                                                    src={getMenuImageUrl(menu.image_path)}
                                                    alt={menu.name}
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/images/menus/sate-lilit.jpg';
                                                    }}
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
                                                            : getStatusStep(order.order_status) === 2
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                                            : getStatusStep(order.order_status) === 1
                                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse'
                                                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                                                    }`}>
                                                        {getStatusBadgeText(order.order_status)}
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
                                                        {getStatusTrackerText(order.order_status)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                                                    <div className="space-y-1">
                                                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                                                            getStatusStep(order.order_status) >= 1
                                                                ? getStatusStep(order.order_status) === 1 ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                                                                : 'bg-stone-200 text-stone-500'
                                                        }`}>
                                                            {getStatusStep(order.order_status) > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
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
                                                            {getStatusStep(order.order_status) > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
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
                                                            {getStatusStep(order.order_status) > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
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
                                                            {getStatusStep(order.order_status) >= 4 ? <Check className="w-3.5 h-3.5" /> : '4'}
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
                        <div className="rounded-3xl bg-white border border-[#D8CDBB] shadow-xl overflow-hidden flex flex-col h-[600px]">
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
                        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-white">
                            {initialChats.map(chat => {
                                const isMe = chat.sender_type === 'customer';
                                return (
                                    <div 
                                        key={chat.id} 
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                            isMe 
                                                ? 'bg-gradient-to-br from-[#D4B886] to-[#B99A65] text-[#211D1B] rounded-br-md shadow' 
                                                : 'bg-[#32151F] text-[#F4EFE6] border border-[#B99A65]/25 rounded-bl-md shadow'
                                        }`}>
                                            {!isMe && (
                                                <span className="font-bold text-[10px] text-[#B99A65] block uppercase tracking-wider mb-1">
                                                    Kasir / Admin NUSARA
                                                </span>
                                            )}
                                            <p>{chat.message}</p>
                                        </div>
                                        <span className="text-[9px] text-stone-500 mt-1 px-1">
                                            {new Date(chat.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Prompts */}
                        <div className="p-2.5 bg-[#F8F5F0] border-t border-[#D8CDBB] flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                            <span className="text-[10px] text-[#B99A65] uppercase font-bold flex-shrink-0">Cepat:</span>
                            <button
                                onClick={() => setChatInput('Berapa lama estimasi pesanan saya siap?')}
                                className="px-3 py-1 rounded-full bg-white border border-[#D8CDBB] text-[#51453A] text-[11px] whitespace-nowrap hover:border-[#B99A65]"
                            >
                                Estimasi Waktu?
                            </button>
                            <button
                                onClick={() => setChatInput('Tolong bawakan piring kecil dan garpu tambahan ke meja saya.')}
                                className="px-3 py-1 rounded-full bg-white border border-[#D8CDBB] text-[#51453A] text-[11px] whitespace-nowrap hover:border-[#B99A65]"
                            >
                                Piring & Garpu Tambahan
                            </button>
                            <button
                                onClick={() => setChatInput('Apakah menu rendang ini sangat pedas?')}
                                className="px-3 py-1 rounded-full bg-white border border-[#D8CDBB] text-[#51453A] text-[11px] whitespace-nowrap hover:border-[#B99A65]"
                            >
                                Tingkat Kepedasan Rendang?
                            </button>
                        </div>

                        {/* Chat Input Box */}
                        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-[#D8CDBB] flex items-center gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Tulis pesan ke admin atau minta bantuan staf..."
                                className="flex-grow px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#D8CDBB] text-[#211D1B] placeholder:text-stone-400 text-xs focus:outline-none focus:border-[#B99A65]"
                            />
                            <button
                                type="submit"
                                disabled={isSendingChat || !chatInput.trim()}
                                className="p-2.5 rounded-full bg-gradient-to-br from-[#D4B886] to-[#B99A65] text-[#211D1B] hover:bg-gradient-to-r hover:from-[#B99A65] hover:to-[#D4B886] hover:text-[#211D1B] disabled:opacity-40 transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                    )
                )}
            </main>
        </div>

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
                                src={getMenuImageUrl(customizingMenu.image_path)}
                                alt={customizingMenu.name}
                                onError={(e) => {
                                    e.currentTarget.src = '/images/menus/sate-lilit.jpg';
                                }}
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
                MODAL 2: CENTERED LIGHT-THEMED CART MODAL & CHECKOUT
                (Muncul di Tengah Layar dengan Warna Terang Hangat)
            ======================================================== */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-xl max-h-[92vh] bg-[#FAF7F2] border border-[#D4B886]/60 rounded-3xl p-5 sm:p-7 shadow-2xl text-[#211D1B] flex flex-col justify-between overflow-hidden">
                        {/* Scrollable Container */}
                        <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-300 space-y-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-[#E5DDCF] pb-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#946E2D] block">
                                        Konfirmasi Pemesanan
                                    </span>
                                    <h3 className="font-heading text-2xl font-bold text-[#211D1B]">
                                        Keranjang & Pembayaran
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-[#EAE2D3] transition-colors"
                                    title="Tutup Keranjang"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mode Info Box */}
                            <div className="p-3.5 rounded-2xl bg-[#F0E9DC] border border-[#E0D5C3] text-xs flex items-center justify-between shadow-xs">
                                <span className="text-[#695E57] font-medium">Jenis Layanan:</span>
                                <span className="font-bold text-[#946E2D] uppercase tracking-wide">
                                    {orderType === 'dine_in' ? `Dine-in (${selectedTable})` : 'Bawa Pulang (Takeaway)'}
                                </span>
                            </div>

                            {/* Input Nama Pemesan / Tamu */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D] mb-1.5 flex items-center justify-between">
                                    <span>Nama Pemesan / Pelanggan:</span>
                                    <span className="text-[10px] text-amber-700 font-normal">*Wajib diisi</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Masukkan Nama Anda (contoh: Anindya Laksmi)"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8CDBB] text-xs text-[#211D1B] placeholder-stone-400 focus:outline-none focus:border-[#946E2D] shadow-xs"
                                />
                            </div>

                            {/* Pilihan Nomor Meja (Khusus Dine-in): Dropdown + Ketik Manual */}
                            {orderType === 'dine_in' && (
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D]">
                                        Nomor Meja Dine-In:
                                    </label>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={selectedTable}
                                            onChange={(e) => setSelectedTable(e.target.value)}
                                            placeholder="Ketik manual meja (contoh: Meja 03)..."
                                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#D8CDBB] text-xs text-[#211D1B] placeholder-stone-400 focus:outline-none focus:border-[#946E2D] shadow-xs"
                                        />
                                        <select
                                            value={tables.some(t => t.table_number === selectedTable) ? selectedTable : ''}
                                            onChange={(e) => {
                                                if (e.target.value) setSelectedTable(e.target.value);
                                            }}
                                            className="px-3 py-2.5 rounded-xl bg-white border border-[#D8CDBB] text-xs text-[#211D1B] font-semibold focus:outline-none shadow-xs"
                                        >
                                            <option value="">Pilih List Meja</option>
                                            {tables.map(t => (
                                                <option key={t.id} value={t.table_number}>
                                                    {t.table_number} ({t.capacity || 5} Kursi)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Catatan Meja Fisik */}
                                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Penting:</strong> Sesuaikan dengan nomor meja yang sedang Anda tempati agar pelayan mengantar pesanan langsung ke meja Anda.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Daftar Hidangan di Keranjang */}
                            <div className="space-y-2.5">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D]">
                                    Daftar Hidangan Dipilih ({cartCount} porsi):
                                </label>
                                {cart.map((item, index) => (
                                    <div 
                                        key={index}
                                        className="p-3.5 rounded-2xl bg-white border border-[#E5DDCF] space-y-2 shadow-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-bold text-xs text-[#211D1B]">
                                                    {item.menu.name}
                                                </h5>
                                                <span className="text-[11px] font-semibold text-[#946E2D]">
                                                    {formatRupiah(item.menu.price)} x {item.quantity}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, -1)}
                                                    className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#D8CDBB] flex items-center justify-center text-xs text-[#211D1B] hover:bg-[#EAE2D3] transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="font-bold text-xs w-4 text-center text-[#211D1B]">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(index, 1)}
                                                    className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#D8CDBB] flex items-center justify-center text-xs text-[#211D1B] hover:bg-[#EAE2D3] transition-colors"
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
                                            placeholder="Catatan menu: misal pedas sedang, kuah dipisah..."
                                            className="w-full px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E5DDCF] text-[11px] text-[#211D1B] placeholder-stone-400 focus:outline-none focus:border-[#946E2D]"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Catatan Umum Pesanan */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D] mb-1.5">
                                    Catatan Umum Pesanan (Opsional):
                                </label>
                                <textarea
                                    rows={2}
                                    value={generalNotes}
                                    onChange={(e) => setGeneralNotes(e.target.value)}
                                    placeholder="Contoh: Tolong disajikan bersamaan, kami membawa tamu penting..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8CDBB] text-xs text-[#211D1B] placeholder-stone-400 focus:outline-none focus:border-[#946E2D] shadow-xs"
                                />
                            </div>

                            {/* Pilihan Metode Pembayaran */}
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D] mb-2">
                                    Pilih Metode Pembayaran:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('qris')}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                            paymentMethod === 'qris'
                                                ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] border-[#D4B886] font-bold shadow-xs'
                                                : 'bg-white text-[#695E57] border-[#D8CDBB] hover:bg-[#F0E9DC]'
                                        }`}
                                    >
                                        QRIS Instan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                            paymentMethod === 'bank_transfer'
                                                ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] border-[#D4B886] font-bold shadow-xs'
                                                : 'bg-white text-[#695E57] border-[#D8CDBB] hover:bg-[#F0E9DC]'
                                        }`}
                                    >
                                        Virtual Account
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                            paymentMethod === 'cash'
                                                ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] border-[#D4B886] font-bold shadow-xs'
                                                : 'bg-white text-[#695E57] border-[#D8CDBB] hover:bg-[#F0E9DC]'
                                        }`}
                                    >
                                        Tunai di Kasir
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Summary & Order Lock Warning (Warna Terang) */}
                        <div className="pt-4 mt-3 border-t border-[#E5DDCF] space-y-3">
                            {/* PRD Order Lock Callout */}
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
                                <span>
                                    <strong>Ketentuan PRD NUSARA:</strong> Setelah pesanan dikonfirmasi ke kasir & dapur, pesanan langsung dimasak dan tidak dapat diubah kembali.
                                </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-[#F0E9DC] border border-[#E0D5C3] space-y-1.5 text-xs text-[#695E57]">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(cartSubtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pajak Restoran (PB1 11%)</span>
                                    <span>{formatRupiah(cartTax)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm text-[#211D1B] pt-1 border-t border-[#DFD4C0]">
                                    <span>Total Tagihan</span>
                                    <span className="text-[#946E2D] font-extrabold text-base">{formatRupiah(cartTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut || cart.length === 0}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-extrabold text-xs uppercase tracking-widest hover:shadow-xl active:scale-[0.99] transition-all disabled:opacity-50"
                            >
                                {isCheckingOut ? 'Memproses Order...' : `Konfirmasi & Kirim Pesanan — ${formatRupiah(cartTotal)}`}
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

            {/* ========================================================
                MODAL 5: CONFIRMATION LOGOUT (CEGAH KEPENCET KELUAR)
            ======================================================== */}
            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                cartCount={cartCount}
                userName={auth?.user?.name}
            />

            {/* ========================================================
                MODAL 6: CONFIRMATION EXIT TO HOME (BERANDA)
            ======================================================== */}
            {isExitHomeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-sm bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 shadow-2xl text-[#F4EFE6] text-center">
                        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 text-[#D4B886] mx-auto flex items-center justify-center mb-3">
                            <ShoppingBag className="w-6 h-6" />
                        </div>

                        <h3 className="font-heading text-xl font-bold text-[#F4EFE6] mb-1">
                            Kembali ke Beranda?
                        </h3>
                        <p className="text-xs text-[#F4EFE6]/70 mb-4">
                            Anda memiliki <strong>{cartCount} item</strong> di keranjang belanja. Pesanan Anda tetap tersimpan dengan aman.
                        </p>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsExitHomeModalOpen(false)}
                                className="py-2.5 px-4 rounded-xl border border-stone-700 bg-stone-900/60 hover:bg-stone-800 text-[#F4EFE6] text-xs font-semibold transition-colors"
                            >
                                Tetap di Pesanan
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit('/')}
                                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] text-xs font-bold transition-all shadow-md"
                            >
                                Ke Beranda
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
