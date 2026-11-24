import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import LogoutConfirmModal from '../../Components/LogoutConfirmModal';
import CustomerSettings from './CustomerSettings';
import LuxuryAlertModal, { LuxuryAlertState } from '../../Components/LuxuryAlertModal';
import { 
    QrisLogo, 
    GopayLogo, 
    ShopeePayLogo, 
    DanaLogo, 
    OvoLogo, 
    BcaLogo, 
    MandiriLogo, 
    BniLogo, 
    BriLogo, 
    PermataLogo 
} from '../../Components/PaymentLogos';
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
    PanelLeft,
    CreditCard,
    Flame,
    ChevronLeft,
    SlidersHorizontal,
    Home,
    CalendarDays,
    MoreHorizontal,
    Banknote,
    HelpCircle,
    CheckCircle,
    Salad,
    IceCream,
    Leaf,
    Crown,
    RotateCcw,
    Lock,
    Building2,
    Wallet,
    Settings,
    KeyRound,
    Shield,
    Soup,
    Cake
} from 'lucide-react';

function TypingGreeting({ name }: { name: string }) {
    const rawName = name?.trim() || 'Tamu Terhormat';
    const prefix = 'Selamat datang, ';
    const fullText = prefix + rawName;
    const [charCount, setCharCount] = useState(0);
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
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
        }, 50);
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
    midtransClientKey?: string;
    midtransIsConfigured?: boolean;
}

interface CartItem {
    menu: Menu;
    quantity: number;
    item_notes: string;
}

const ORDER_PAYMENT_METHODS = [
    // 1. Tunai di Kasir
    {
        id: 'cash' as const,
        category: 'cash' as const,
        title: 'Tunai di Kasir (Cash)',
        subtitle: 'Selesaikan transaksi di meja kasir restoran',
        badge: 'Pembayaran Langsung',
        badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
        logo: (
            <div className="h-7 px-2 rounded-lg bg-[#32151F] text-[#D4B886] flex items-center justify-center font-bold text-[11px] gap-1.5 border border-[#B99A65]/40 shadow-xs">
                <Banknote className="w-4 h-4 text-[#D4B886]" />
                <span className="font-heading tracking-wide">KASIR CASH</span>
            </div>
        ),
        apps: ['Uang Tunai (IDR)', 'Kasir Restoran NUSARA'],
        instructions: [
            'Pramusaji atau kasir kami akan menerima pembayaran tunai Anda di meja kasir restoran.',
            'Pesanan langsung masuk ke sistem dan koki dapur segera memasak hidangan istimewa Anda.',
            'Struk transaksi resmi restoran NUSARA akan dicetak langsung setelah kasir menerima pembayaran.'
        ]
    },
    // 2. QRIS & e-Wallet
    {
        id: 'qris' as const,
        category: 'ewallet' as const,
        title: 'QRIS Instan',
        subtitle: 'Semua e-Wallet & M-Banking',
        badge: 'Scan Bebas Biaya',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        logo: <QrisLogo className="h-6 w-auto" />,
        apps: ['GoPay', 'OVO', 'ShopeePay', 'Dana', 'BCA QR', 'Livin', 'LinkAja'],
        instructions: [
            'Buka aplikasi e-Wallet atau Mobile Banking Anda (GoPay, OVO, ShopeePay, Dana, BCA Mobile, Livin, dll).',
            'Tekan tombol checkout untuk membuka kode QRIS dinamis resmi.',
            'Pindai (scan) kode QR dan selesaikan transaksi. Pesanan Anda langsung otomatis terverifikasi dan masuk antrean dapur.'
        ]
    },
    {
        id: 'gopay' as const,
        category: 'ewallet' as const,
        title: 'GoPay',
        subtitle: 'GoPay App & Gojek',
        badge: 'Direct Deeplink / QR',
        badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
        logo: <GopayLogo className="h-6 w-auto" />,
        apps: ['GoPay App', 'Gojek Superapp', 'QRIS GoPay'],
        instructions: [
            'Tekan tombol checkout untuk membuka jendela pembayaran resmi GoPay.',
            'Pada smartphone, aplikasi GoPay / Gojek akan terbuka otomatis untuk menyelesaikan pembayaran.',
            'Pada laptop/desktop, pindai kode QR GoPay yang tampil di layar melalui aplikasi ponsel Anda.'
        ]
    },
    {
        id: 'shopeepay' as const,
        category: 'ewallet' as const,
        title: 'ShopeePay',
        subtitle: 'Shopee & ShopeePay App',
        badge: 'Direct Deeplink / QR',
        badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
        logo: <ShopeePayLogo className="h-6 w-auto" />,
        apps: ['Shopee App', 'ShopeePay App'],
        instructions: [
            'Tekan tombol checkout untuk menghubungkan langsung ke dompet ShopeePay.',
            'Konfirmasi transaksi di aplikasi Shopee Anda dengan memasukkan PIN ShopeePay atau biometrik.',
            'Setelah pembayaran terverifikasi, pesanan Anda langsung diproses oleh koki dapur NUSARA.'
        ]
    },
    {
        id: 'dana' as const,
        category: 'ewallet' as const,
        title: 'DANA',
        subtitle: 'Dompet Digital Indonesia',
        badge: 'Scan QRIS Dinamis',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        logo: <DanaLogo className="h-6 w-auto" />,
        apps: ['DANA App', 'QRIS DANA'],
        instructions: [
            'Tekan tombol checkout untuk memunculkan kode QRIS resmi.',
            'Buka aplikasi DANA di ponsel Anda lalu pilih menu "Scan / Pindai".',
            'Arahkan kamera ke kode QR dan masukkan PIN DANA Anda untuk menyelesaikan pembayaran pesanan.'
        ]
    },
    {
        id: 'ovo' as const,
        category: 'ewallet' as const,
        title: 'OVO Cash',
        subtitle: 'OVO Points & Cash',
        badge: 'Scan QRIS Dinamis',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
        logo: <OvoLogo className="h-6 w-auto" />,
        apps: ['OVO App', 'QRIS OVO'],
        instructions: [
            'Tekan tombol checkout untuk membuka kode QRIS dinamis resmi.',
            'Buka aplikasi OVO di smartphone Anda lalu tekan tombol "QRIS" di halaman utama.',
            'Pindai kode QR dan konfirmasi nominal pembayaran pesanan dengan Security Code OVO.'
        ]
    },
    // 3. Virtual Account Bank
    {
        id: 'bca_va' as const,
        category: 'va' as const,
        title: 'BCA Virtual Account',
        subtitle: 'BCA Mobile, myBCA, KlikBCA',
        badge: 'Verifikasi Otomatis',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        logo: <BcaLogo className="h-6 w-auto" />,
        apps: ['BCA Mobile', 'myBCA', 'KlikBCA', 'ATM BCA'],
        instructions: [
            'Tekan tombol checkout untuk memperoleh nomor Virtual Account BCA resmi.',
            'Buka aplikasi BCA Mobile / myBCA / KlikBCA pilih m-Transfer lalu BCA Virtual Account.',
            'Masukkan nomor VA yang tertera dan selesaikan pembayaran sesuai nominal tepat.'
        ]
    },
    {
        id: 'mandiri_va' as const,
        category: 'va' as const,
        title: 'Mandiri Virtual Account',
        subtitle: "Livin' by Mandiri & ATM",
        badge: 'Verifikasi Otomatis',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        logo: <MandiriLogo className="h-6 w-auto" />,
        apps: ["Livin' by Mandiri", 'Mandiri ATM', 'Internet Banking'],
        instructions: [
            'Tekan tombol checkout untuk memperoleh kode perusahaan dan nomor Virtual Account.',
            "Buka aplikasi Livin' by Mandiri pilih menu Bayar lalu Cari Penyedia Jasa atau masukkan kode.",
            'Konfirmasi detail pembayaran dan masukkan PIN Livin Anda.'
        ]
    },
    {
        id: 'bni_va' as const,
        category: 'va' as const,
        title: 'BNI Virtual Account',
        subtitle: 'BNI Mobile Banking & ATM',
        badge: 'Verifikasi Otomatis',
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
        logo: <BniLogo className="h-6 w-auto" />,
        apps: ['BNI Mobile', 'BNI Direct', 'ATM BNI'],
        instructions: [
            'Tekan tombol checkout untuk memperoleh nomor Virtual Account BNI.',
            'Buka aplikasi BNI Mobile Banking pilih Pembayaran lalu Virtual Account Billing.',
            'Masukkan nomor VA dan selesaikan pembayaran dengan password transaksi Anda.'
        ]
    },
    {
        id: 'bri_va' as const,
        category: 'va' as const,
        title: 'BRI Virtual Account',
        subtitle: 'BRIVA via BRImo & ATM',
        badge: 'Verifikasi Otomatis',
        badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
        logo: <BriLogo className="h-6 w-auto" />,
        apps: ['BRImo', 'Internet Banking BRI', 'ATM BRI'],
        instructions: [
            'Tekan tombol checkout untuk memperoleh nomor BRIVA (BRI Virtual Account).',
            'Buka aplikasi BRImo pilih menu Tagihan / BRIVA lalu Pembayaran Baru.',
            'Masukkan nomor BRIVA dan konfirmasi pembayaran dengan PIN BRImo Anda.'
        ]
    },
    {
        id: 'permata_va' as const,
        category: 'va' as const,
        title: 'Permata & Bank Lainnya',
        subtitle: 'PermataMobile X, ATM Bersama',
        badge: 'Verifikasi Otomatis',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
        logo: <PermataLogo className="h-6 w-auto" />,
        apps: ['PermataMobile X', 'ATM Bersama', 'Prima', 'ALTO'],
        instructions: [
            'Tekan tombol checkout untuk memperoleh nomor Virtual Account Permata.',
            'Dapat dibayar dari bank apa pun melalui menu Transfer Antar Bank (pilih Bank Permata / kode 013).',
            'Masukkan nomor VA sebagai nomor rekening tujuan transfer.'
        ]
    },
];

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
    isGuest: initialIsGuest = false,
    midtransClientKey = 'SB-Mid-client-vRlZ-ZTbkviZQkzo',
    midtransIsConfigured = false,
}: Props) {
    const { auth, flash } = usePage<{ auth: { user: User | null }; flash: { success?: string; error?: string } }>().props;
    const isGuest = !auth?.user;

    // Service Mode: 'unselected' (3 cards) | 'selecting_table' | 'confirmed' (catalog)
    const [serviceMode, setServiceMode] = useState<'unselected' | 'selecting_table' | 'confirmed'>(() => {
        if (typeof window === 'undefined') return 'unselected';
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('table') || urlParams.get('type') || initialTable) return 'confirmed';
        const saved = localStorage.getItem('nusara_service_mode');
        if (saved === 'confirmed' || saved === 'selecting_table') return saved as any;
        return 'unselected';
    });

    // Order mode: 'dine_in' | 'takeaway'
    const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>(() => {
        if (typeof window === 'undefined') return initialType || 'dine_in';
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('type') === 'takeaway') return 'takeaway';
        const saved = localStorage.getItem('nusara_order_type');
        if (saved === 'takeaway' || saved === 'dine_in') return saved;
        return initialType || 'dine_in';
    });

    const [selectedTable, setSelectedTable] = useState<string>(() => {
        if (typeof window === 'undefined') return initialTable || 'Meja 01';
        const urlParams = new URLSearchParams(window.location.search);
        const urlTable = urlParams.get('table');
        if (urlTable) return urlTable;
        const saved = localStorage.getItem('nusara_selected_table');
        return saved || initialTable || 'Meja 01';
    });

    const [customerName, setCustomerName] = useState<string>(() => {
        if (auth?.user?.name) return auth.user.name;
        if (typeof window === 'undefined') return '';
        const saved = localStorage.getItem('nusara_customer_name');
        return saved || '';
    });

    // Sync Service State with localStorage so page reload DOES NOT reset
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('nusara_service_mode', serviceMode);
            localStorage.setItem('nusara_order_type', orderType);
            localStorage.setItem('nusara_selected_table', selectedTable);
            localStorage.setItem('nusara_customer_name', customerName);
        } catch {}
    }, [serviceMode, orderType, selectedTable, customerName]);

    // Navigation Tab state (Demo: Pesanan Aktif only, No Riwayat Selesai or Favorit)
    const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'active_order' | 'chat' | 'settings'>('menu');

    // Orders local state (reactive for ratings & updates)
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    // Search and Category
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Favorites local state (kept for prop compatibility, favoriting disabled in demo)
    const [favorites, setFavorites] = useState<number[]>(initialFavorites);

    // Sidebar & Modal states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem('nusara_sidebar_expanded') === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('nusara_sidebar_expanded', String(isDesktopSidebarExpanded));
        } catch {}
    }, [isDesktopSidebarExpanded]);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isExitHomeModalOpen, setIsExitHomeModalOpen] = useState(false);

    // Cart State with localStorage Persistence
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

    const [generalNotes, setGeneralNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<
        'cash' | 'qris' | 'gopay' | 'shopeepay' | 'dana' | 'ovo' | 'bca_va' | 'mandiri_va' | 'bni_va' | 'bri_va' | 'permata_va'
    >('cash');
    const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<'all' | 'ewallet' | 'va' | 'cash'>('all');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [luxuryAlert, setLuxuryAlert] = useState<LuxuryAlertState | null>(null);

    const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string, onClose?: () => void) => {
        setLuxuryAlert({
            isOpen: true,
            message,
            type,
            title,
            onClose,
        });
    };

    // Kupon Promo
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState<number>(0);

    // Cart calculations
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.menu.price * item.quantity), 0);
    const cartTax = Math.round(cartSubtotal * 0.11);
    const cartTotal = cartSubtotal + cartTax;

    const handleApplyCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        const code = couponCode.trim().toUpperCase();
        if (!code) return;
        if (code === 'NUSARA20' || code === 'PROMO20' || code === 'DISKON20') {
            setAppliedCoupon(code);
            setCouponDiscount(Math.round(cartSubtotal * 0.20));
            showAlert('Selamat! Kupon diskon 20% berhasil diterapkan pada pesanan Anda.', 'success', 'Kupon Aktif');
        } else {
            showAlert('Kode kupon tidak valid atau telah kedaluwarsa. Gunakan kode promo NUSARA20 untuk potongan istimewa 20%.', 'warning', 'Kupon Tidak Valid');
        }
    };

    // Otomatis simpan setiap perubahan keranjang ke localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('nusara_customer_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Gagal menyimpan keranjang ke storage', e);
        }
    }, [cart]);

    // Recalculate coupon discount if cart changes
    useEffect(() => {
        if (appliedCoupon) {
            setCouponDiscount(Math.round(cartSubtotal * 0.20));
        }
    }, [cart, appliedCoupon, cartSubtotal]);

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

    // Refund Modal State for Customer Order
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
    const [refundBank, setRefundBank] = useState('BCA');
    const [refundAccountNumber, setRefundAccountNumber] = useState('');
    const [refundAccountHolder, setRefundAccountHolder] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
    const [refundError, setRefundError] = useState('');

    const handleOpenRefundModal = (order: Order) => {
        if (order.order_status !== 'Pending') {
            showAlert('Pengajuan pengembalian dana hanya dapat dilakukan saat pesanan masih dalam antrean (sebelum proses memasak dimulai).', 'warning', 'Batasan Pengembalian Dana');
            return;
        }
        setSelectedOrderForRefund(order);
        setRefundBank('BCA');
        setRefundAccountNumber('');
        setRefundAccountHolder(customer?.name || (order as any).customer_name || '');
        setRefundReason('');
        setRefundError('');
        setIsRefundModalOpen(true);
    };

    const handleSubmitOrderRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderForRefund) return;
        if (!refundAccountNumber.trim() || !refundAccountHolder.trim() || !refundReason.trim()) {
            setRefundError('Mohon lengkapi bank/e-wallet, nomor rekening, nama pemilik, dan alasan refund.');
            return;
        }

        setIsSubmittingRefund(true);
        setRefundError('');

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/order/${selectedOrderForRefund.id}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    bank_or_wallet: refundBank,
                    account_number: refundAccountNumber,
                    account_holder: refundAccountHolder,
                    reason: refundReason,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showAlert(data.message || 'Pengajuan pengembalian dana berhasil dikirimkan!', 'success', 'Pengajuan Berhasil');
                setIsRefundModalOpen(false);
                router.reload();
            } else {
                setRefundError(data.message || 'Gagal mengajukan pengembalian dana.');
            }
        } catch (err: any) {
            setRefundError(err?.message || 'Terjadi kesalahan sistem saat mengajukan refund.');
        } finally {
            setIsSubmittingRefund(false);
        }
    };

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


    // Filtered Menus (Katalog Hidangan)
    const displayedMenus = useMemo(() => {
        return menus.filter(menu => {
            const matchesCategory = selectedCategory === 'all' || menu.category_slug === selectedCategory;
            const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  menu.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menus, selectedCategory, searchQuery]);

    // Popular Picks Menus (featured or best seller)
    const popularPicks = useMemo(() => {
        const feat = menus.filter(m => m.is_featured || m.is_best_seller);
        return feat.length >= 3 ? feat.slice(0, 6) : menus.slice(0, 6);
    }, [menus]);

    // Pesanan Aktif: Memuat seluruh pesanan sesi santap ini (Pending s/d Served & Completed untuk rating bintang)
    const activeOrders = useMemo(() => {
        return orders.filter(o => !['Cancelled', 'Refunded'].includes(o.order_status));
    }, [orders]);

    // Background polling for customer order status (updates real-time when kitchen prepares/waiter serves/chat arrives)
    useEffect(() => {
        let isPolling = false;
        const intervalTime = activeTab === 'active_order' ? 2500 : 3500;
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible' && !isPolling) {
                isPolling = true;
                router.reload({
                    only: ['orders', 'tables', 'chatMessages'],
                    preserveScroll: true,
                    preserveState: true,
                    data: selectedTable ? { table: selectedTable } : {},
                    onFinish: () => {
                        isPolling = false;
                    },
                });
            }
        }, intervalTime);

        return () => clearInterval(interval);
    }, [activeTab, selectedTable]);

    // Otomatis verifikasi pesanan online Midtrans di latar belakang (langsung ke 'Preparing' saat pembayaran berhasil di ponsel)
    useEffect(() => {
        const pendingOnlineOrder = orders.find(
            o => o.payment_status === 'Pending' && o.payment_method !== 'cash' && !['Cancelled', 'Refunded'].includes(o.order_status)
        );
        if (!pendingOnlineOrder) return;

        let isChecking = false;
        const interval = setInterval(async () => {
            if (isChecking || typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            isChecking = true;
            try {
                const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
                const res = await fetch(`/order/${pendingOnlineOrder.id}/confirm-online-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({ result_status: 'check_status' }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    router.reload({ only: ['orders'], preserveScroll: true, preserveState: true });
                }
            } catch (e) {
                // Silently ignore temporary network retry
            } finally {
                isChecking = false;
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [orders]);

    useEffect(() => {
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
            case 'Pending': 
            case 'Awaiting Payment': return 1;
            case 'Confirmed':
            case 'Paid':
            case 'Preparing': return 2;
            case 'Ready': return 3;
            case 'Served':
            case 'Picked Up':
            case 'Completed': return 4;
            default: return 1;
        }
    };

    const getStatusBadgeText = (status: string | any, paymentMethod?: string, isPaid?: boolean) => {
        const s = String(status || '');
        if (s === 'Pending' || s === 'Awaiting Payment') {
            if (paymentMethod === 'cash') return 'Menunggu ACC Kasir';
            return 'Menunggu Pembayaran';
        }
        if (s === 'Preparing' || s === 'Paid' || s === 'Confirmed') return 'Sedang Dalam Antrean';
        if (s === 'Ready') return 'Siap Saji';
        if (s === 'Served' || s === 'Picked Up' || s === 'Completed') return 'Selesai Terhidang';
        if (s === 'Refund Requested') return 'Pengajuan Refund';
        if (s === 'Refunded') return 'Dana Dikembalikan';
        if (s === 'Cancelled') return 'Dibatalkan';
        return s;
    };


    const getStatusTrackerText = (status: string | any, paymentMethod?: string) => {
        const s = String(status || '');
        if (s === 'Pending' || s === 'Awaiting Payment') {
            if (paymentMethod === 'cash') return '1/4 - Menunggu Bayar Tunai di Kasir';
            return '1/4 - Menunggu Pembayaran Midtrans';
        }
        if (s === 'Preparing' || s === 'Paid' || s === 'Confirmed') return '2/4 - Sedang Dimasak di Dapur';
        if (s === 'Ready') return '3/4 - Hidangan Siap Disajikan';
        return '4/4 - Selesai Terhidang';
    };

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
            showAlert('Fitur favorit hidangan memerlukan Akun Terdaftar. Silakan masuk untuk menyimpan mahakarya kuliner favorit Anda.', 'info', 'Akses Anggota', () => {
                router.visit('/login');
            });
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

    // Quick Add Single Item to Cart directly
    const handleQuickAddToCart = (menu: Menu) => {
        if (!menu.is_available || menu.stock_quantity <= 0) return;
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.menu.id === menu.id && item.item_notes === '');
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += 1;
                return updated;
            }
            return [...prev, {
                menu,
                quantity: 1,
                item_notes: ''
            }];
        });
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

    const getCategoryIcon = (slugOrName: string) => {
        const s = (slugOrName || '').toLowerCase().replace(/[-_]/g, ' ');
        if (s.includes('pembuka') || s.includes('starter') || s.includes('appetiz') || s.includes('salad')) {
            return Salad;
        }
        if (s.includes('penutup') || s.includes('dessert') || s.includes('manis') || s.includes('pencuci')) {
            return IceCream;
        }
        if (s.includes('minum') || s.includes('beverag') || s.includes('drink') || s.includes('kopi') || s.includes('tea')) {
            return Coffee;
        }
        if (s.includes('aceh')) {
            return Flame;
        }
        if (s.includes('sunda')) {
            return Leaf;
        }
        if (s.includes('jawa')) {
            return Crown;
        }
        if (s.includes('utama') || s.includes('main')) {
            return Utensils;
        }
        return Sparkles;
    };

    const ensureSnapLoaded = async (clientKey: string): Promise<boolean> => {
        if ((window as any).snap) return true;
        return new Promise<boolean>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
            script.setAttribute('data-client-key', clientKey || 'SB-Mid-client-vRlZ-ZTbkviZQkzo');
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    };

    const handlePayWithSnap = async (snapToken: string, targetOrderId?: number) => {
        const snapReady = await ensureSnapLoaded(midtransClientKey);
        if (!snapReady || !(window as any).snap) {
            showAlert('Modul pembayaran Midtrans gagal dimuat di peramban. Pastikan koneksi internet stabil.', 'error', 'Koneksi Gateway');
            return;
        }

        (window as any).snap.pay(snapToken, {
            onSuccess: async function (result: any) {
                setCart([]);
                try { localStorage.removeItem('nusara_customer_cart'); } catch {}
                
                // Konfirmasi otomatis pembayaran online ke server backend agar status langsung 'Preparing'
                try {
                    const orderIdToConfirm = targetOrderId || result?.order_id;
                    if (orderIdToConfirm) {
                        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
                        await fetch(`/order/${orderIdToConfirm}/confirm-online-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': csrfToken,
                            },
                            body: JSON.stringify(result || { result_status: 'success' }),
                        });
                    }
                } catch (e) {
                    console.error('Error auto-confirming online payment:', e);
                }

                showAlert('Pembayaran Berhasil! Pesanan Anda telah diverifikasi dan saat ini langsung dipersiapkan di dapur NUSARA.', 'success', 'Pembayaran Berhasil');
                router.reload({ only: ['orders'] });
                setActiveTab('active_order');
            },
            onPending: function () {
                setCart([]);
                try { localStorage.removeItem('nusara_customer_cart'); } catch {}
                showAlert('Pesanan tersimpan. Silakan selesaikan pembayaran QRIS / Virtual Account Anda agar segera diproses dapur.', 'info', 'Menunggu Pembayaran');
                router.reload({ only: ['orders'] });
                setActiveTab('active_order');
            },
            onError: function () {
                showAlert('Pembayaran Midtrans belum selesai atau dibatalkan.', 'error', 'Pembayaran Tertunda');
                router.reload({ only: ['orders'] });
                setActiveTab('active_order');
            },
            onClose: function () {
                setCart([]);
                try { localStorage.removeItem('nusara_customer_cart'); } catch {}
                showAlert('Jendela pembayaran ditutup. Status pesanan Anda saat ini Menunggu Pembayaran. Anda dapat membuka QRIS kembali kapan saja dari tab Pesanan Aktif atau membayar langsung ke kasir.', 'info', 'Jendela Ditutup');
                router.reload({ only: ['orders'] });
                setActiveTab('active_order');
            }
        });
    };

    // Verifikasi Manual Status Pembayaran Online Midtrans
    const handleVerifyMidtransPayment = async (orderId: number) => {
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/order/${orderId}/confirm-online-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ result_status: 'check_status' }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showAlert(data.message || 'Pembayaran berhasil diverifikasi! Pesanan Anda saat ini sedang dimasak di dapur.', 'success', 'Verifikasi Berhasil');
                router.reload({ only: ['orders'] });
            } else {
                showAlert(data.message || 'Pembayaran belum dapat dikonfirmasi oleh Midtrans. Pastikan transaksi QRIS atau Virtual Account Anda telah berhasil.', 'warning', 'Status Pembayaran');
            }
        } catch {
            showAlert('Terjadi kendala jaringan saat memverifikasi status pembayaran ke Midtrans.', 'error', 'Gangguan Jaringan');
        }
    };

    // Submit Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (!customerName.trim()) {
            showAlert('Mohon lengkapi nama pemesan terlebih dahulu sebelum melanjutkan pesanan agar pramusaji kami dapat mengantarkan santapan dengan tepat ke meja Anda.', 'warning', 'Nama Pemesan Wajib Diisi');
            return;
        }

        if (orderType === 'dine_in' && !selectedTable.trim()) {
            showAlert('Mohon tentukan nomor meja yang Anda tempati sebelum memesan santapan Dine-in.', 'warning', 'Pilih Nomor Meja');
            return;
        }

        if (paymentMethod !== 'cash' && !midtransIsConfigured) {
            showAlert('Layanan pembayaran online Midtrans belum aktif. Silakan pilih metode Tunai di Kasir (Cash) atau konfirmasi ke staf kami.', 'warning', 'Metode Pembayaran');
            return;
        }

        setIsCheckingOut(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const response = await fetch('/order/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
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
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Gagal memproses pesanan.');
            }

            // Jika Pembayaran Online Midtrans (QRIS, e-Wallet, VA Bank)
            if (paymentMethod !== 'cash') {
                if (!data.snap_token) {
                    throw new Error(data.message || 'Token pembayaran Midtrans tidak ditemukan.');
                }
                await handlePayWithSnap(data.snap_token, data.order_id);
            } else {
                setCart([]);
                try {
                    localStorage.removeItem('nusara_customer_cart');
                } catch {}
                showAlert(`Pesanan #${data.order_code} berhasil dibuat! Silakan lakukan pembayaran di kasir.`, 'success', 'Pesanan Diterima');
                router.reload({ only: ['orders'] });
                setActiveTab('active_order');
            }
        } catch (error: any) {
            showAlert(error.message || 'Terjadi gangguan saat memproses pesanan.', 'error', 'Kendala Pemesanan');
        } finally {
            setIsCheckingOut(false);
        }
    };

    // Submit Rating (Instant Notification & Reactive State Update)
    const handleSubmitRating = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ratingOrder) return;

        setIsSubmittingRating(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/order/${ratingOrder.id}/rating`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    rating: selectedStars,
                    review: reviewComment,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Gagal mengirim ulasan.');
            }

            // Update local order rating immediately so card switches to "Rating Terkirim"
            setOrders(prevOrders => prevOrders.map(o => {
                if (o.id === ratingOrder.id) {
                    return {
                        ...o,
                        rating: {
                            rating: selectedStars,
                            review: reviewComment,
                        }
                    };
                }
                return o;
            }));

            showAlert(
                `Rating ${selectedStars} Bintang berhasil dikirim! Terima kasih banyak atas apresiasi dan ulasan Anda untuk jamuan NUSARA.`,
                'success',
                'Rating Terkirim'
            );
            setRatingOrder(null);
            setReviewComment('');
        } catch (err: any) {
            showAlert(err.message || 'Gagal mengirim rating.', 'error', 'Kendala Pengiriman Rating');
        } finally {
            setIsSubmittingRating(false);
        }
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
        <div className="min-h-screen bg-[#F4EFE6] text-[#211D1B] font-body selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Pemesanan Kuliner — NUSARA Indonesian Dining" />

            {/* Flash Alerts */}
            <FlashToast flash={flash} durationMs={3000} />

            {/* ========================================================
                APP HEADER (LOGO + SERVICE PILL + ACTION BUTTONS)
            ======================================================== */}
            <header className="sticky top-0 z-40 bg-[#32151F] text-[#F4EFE6] shadow-xl border-b border-[#B99A65]/30">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
                    {/* Left: Brand Logo on mobile only (Desktop logo is in the sidebar dock) */}
                    <div className="flex items-center gap-3">
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
                            className="group flex md:hidden items-center gap-2 text-left"
                        >
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA" 
                                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" 
                            />
                        </button>
                    </div>

                    {/* Center: Service Mode Badge (Only shown when confirmed) */}
                    {serviceMode === 'confirmed' && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211D1B] border border-[#B99A65]/40 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-semibold text-[#D4B886]">
                                {orderType === 'dine_in' ? `Makan di ${selectedTable}` : 'Bawa Pulang (Takeaway)'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setServiceMode('unselected')}
                                className="ml-1 text-[11px] underline text-stone-300 hover:text-white"
                            >
                                Ubah
                            </button>
                        </div>
                    )}

                    {/* Right: Cart Button & Profile/Logout */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {serviceMode === 'confirmed' && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('cart')}
                                className="relative p-2 rounded-xl bg-[#211D1B] border border-[#B99A65]/40 text-[#D4B886] hover:bg-[#32151F] transition-all"
                                title="Buka Keranjang Pesanan"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#211D1B] animate-pulse">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {auth?.user ? (
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('settings')}
                                    title="Pengaturan Akun & 2FA"
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow"
                                >
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </button>
                                <button
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    title="Keluar / Logout Akun"
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#211D1B] border border-rose-500/40 text-rose-300 flex items-center justify-center hover:bg-rose-950/80 active:scale-90 transition-all shadow"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FFF0BA] via-[#F6D072] to-[#C99A36] text-[#1A1412] font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
                            >
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Masuk</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ========================================================
                STAGE 1: SERVICE SELECTION (3 CARDS ALA MOCKUP & PRD)
                (Tampil ketika serviceMode !== 'confirmed')
                *Sidebar dan Footer TIDAK DITAMPILKAN pada fase ini*
            ======================================================== */}
            {serviceMode !== 'confirmed' && (
                <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 animate-fade-in">
                    {serviceMode === 'unselected' ? (
                        <div className="space-y-8 text-center">
                            <div className="space-y-3 max-w-xl mx-auto">
                                <span className="inline-block px-3 py-1 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] text-xs font-semibold uppercase tracking-widest">
                                    Pemesanan Kuliner Autentik
                                </span>
                                <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#32151F]">
                                    Pilih Pengalaman Bersantap Anda
                                </h1>
                                <p className="text-xs sm:text-sm text-[#211D1B]/70 leading-relaxed">
                                    Selamat datang di NUSARA Indonesian Dining. Silakan tentukan bagaimana Anda ingin menikmati sajian pusaka keraton Nusantara hari ini.
                                </p>
                            </div>

                            {/* 3 Large Service Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto text-left">
                                {/* 1. Makan di Tempat (Dine In) */}
                                <div 
                                    onClick={() => setServiceMode('selecting_table')}
                                    className="group relative p-6 rounded-3xl bg-white border-2 border-[#B99A65]/30 hover:border-[#32151F] hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#32151F] text-[#D4B886] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                            <UtensilsCrossed className="w-7 h-7 stroke-[2]" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-xl font-bold text-[#32151F] group-hover:text-[#946E2D] transition-colors">
                                                Makan di Tempat (Dine In)
                                            </h3>
                                            <p className="text-xs text-[#211D1B]/70 mt-1 leading-relaxed">
                                                Pilih meja Anda di ruang saji restoran. Hidangan tersaji hangat langsung ke meja Anda.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-5 mt-4 border-t border-stone-200 flex items-center justify-between text-xs font-bold text-[#32151F]">
                                        <span>Pilih Meja Santap</span>
                                        <ChevronRight className="w-4 h-4 text-[#B99A65] group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                {/* 2. Bawa Pulang (Takeaway) */}
                                <div 
                                    onClick={() => {
                                        setOrderType('takeaway');
                                        setServiceMode('confirmed');
                                    }}
                                    className="group relative p-6 rounded-3xl bg-white border-2 border-[#B99A65]/30 hover:border-[#32151F] hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                            <ShoppingBag className="w-7 h-7 stroke-[2]" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-xl font-bold text-[#32151F] group-hover:text-[#946E2D] transition-colors">
                                                Bawa Pulang (Takeaway)
                                            </h3>
                                            <p className="text-xs text-[#211D1B]/70 mt-1 leading-relaxed">
                                                Pesan praktis dari perangkat Anda, lalu ambil pesanan di kasir untuk dinikmati di rumah atau kantor.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-5 mt-4 border-t border-stone-200 flex items-center justify-between text-xs font-bold text-[#32151F]">
                                        <span>Pesan Langsung</span>
                                        <ChevronRight className="w-4 h-4 text-[#B99A65] group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                {/* 3. Reservasi Meja (Dedicated Page - NO POPUP) */}
                                <div 
                                    onClick={() => router.visit('/reservation')}
                                    className="group relative p-6 rounded-3xl bg-[#211D1B] border-2 border-[#B99A65]/40 text-[#F4EFE6] hover:border-[#D4B886] hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                            <CalendarDays className="w-7 h-7 stroke-[2]" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-xl font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                                Reservasi Meja (VIP)
                                            </h3>
                                            <p className="text-xs text-[#F4EFE6]/70 mt-1 leading-relaxed">
                                                Booking meja jauh-jauh hari untuk jamuan keluarga besar, arisan, atau Private Dining seremonial.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#D4B886]">
                                        <span>Buka Halaman Reservasi</span>
                                        <ChevronRight className="w-4 h-4 text-[#D4B886] group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* IN-PAGE DINE IN TABLE SELECTOR (NO POPUP!) */
                        <div className="space-y-6 max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-[#B99A65]/40 shadow-xl">
                            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setServiceMode('unselected')}
                                        className="p-2 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <div>
                                        <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#32151F]">
                                            Pilih Meja Santap Anda
                                        </h2>
                                        <p className="text-xs text-[#211D1B]/70 mt-0.5">
                                            Pilih meja yang tersedia di Main Dining Hall atau ketik manual nomor meja fisik Anda.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Legend */}
                            <div className="flex items-center gap-3 text-xs flex-wrap p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200">
                                <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span>Tersedia</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span>Direservasi</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-rose-800 font-semibold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span>Sedang Terisi (Makan)</span>
                                </span>
                            </div>

                            {/* Ketik Manual Nomor Meja */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-[#32151F] uppercase tracking-wider">
                                    Atau Ketik Nomor Meja Fisik Anda:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={selectedTable}
                                        onChange={(e) => setSelectedTable(e.target.value)}
                                        placeholder="Contoh: Meja 03..."
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs text-[#211D1B] focus:outline-none focus:border-[#B99A65]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!selectedTable.trim()) {
                                                showAlert('Mohon masukkan atau pilih nomor meja yang Anda tempati.', 'warning', 'Nomor Meja Diperlukan');
                                                return;
                                            }
                                            setOrderType('dine_in');
                                            setServiceMode('confirmed');
                                        }}
                                        className="px-5 py-2.5 rounded-xl bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#B99A65] hover:text-[#211D1B] transition-all"
                                    >
                                        Pilih Meja Ini
                                    </button>
                                </div>
                            </div>

                            {/* Tables Grid */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-[#32151F] uppercase tracking-wider">
                                    Denah Meja Restoran:
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {tables.map(table => {
                                        const isOccupied = table.status === 'Occupied';
                                        const isReserved = table.status === 'Reserved';
                                        const isAvailable = !isOccupied && !isReserved;

                                        return (
                                            <button
                                                key={table.id}
                                                type="button"
                                                disabled={!isAvailable}
                                                onClick={() => {
                                                    setSelectedTable(table.table_number);
                                                    setOrderType('dine_in');
                                                    setServiceMode('confirmed');
                                                }}
                                                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                                                    isAvailable
                                                        ? 'bg-white border-[#B99A65]/40 hover:border-[#32151F] hover:shadow-md cursor-pointer'
                                                        : isOccupied
                                                        ? 'bg-rose-50/70 border-rose-200 cursor-not-allowed opacity-70'
                                                        : 'bg-amber-50/70 border-amber-200 cursor-not-allowed opacity-75'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-heading font-extrabold text-sm sm:text-base text-[#32151F]">
                                                            {table.table_number}
                                                        </span>
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            isAvailable ? 'bg-emerald-500' : isOccupied ? 'bg-rose-500' : 'bg-amber-500'
                                                        }`} />
                                                    </div>
                                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                                        {table.capacity || 5} Kursi · {table.location || 'Main Hall'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 pt-2 border-t border-stone-200/60 text-[10px] font-bold">
                                                    {isAvailable && (
                                                        <span className="text-emerald-700">Tersedia · Klik untuk Pilih</span>
                                                    )}
                                                    {isOccupied && (
                                                        <span className="text-rose-700">Sedang Makan (Terisi)</span>
                                                    )}
                                                    {isReserved && (
                                                        <span className="text-amber-700">
                                                            Direservasi {table.reserved_until ? `s/d ${table.reserved_until}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================
                STAGE 2: CONFIRMED CATALOG VIEW (DESKTOP DOCK SIDEBAR + MAIN CANVAS + RIGHT CART)
                (Hanya tampil ketika serviceMode === 'confirmed')
            ======================================================== */}
            {serviceMode === 'confirmed' && (
                <div className="flex w-full min-h-[calc(100vh-65px)]">
                    {/* ========================================================
                        DESKTOP LEFT SIDEBAR: RESPONSIVE TOGGLEABLE DOCK ALA IMAGE 3
                        (Hanya tampil di Desktop: hidden md:flex)
                    ======================================================== */}
                    <aside className={`hidden md:flex flex-col ${
                        isDesktopSidebarExpanded ? 'w-64' : 'w-16 lg:w-20'
                    } bg-[#211D1B] border-r border-[#32151F] text-[#F4EFE6] py-4 ${
                        isDesktopSidebarExpanded ? 'px-3' : 'px-2'
                    } justify-between flex-shrink-0 sticky top-[57px] h-[calc(100vh-57px)] z-30 transition-all duration-300 ease-in-out`}>
                        {/* Top: Nusara Real Logo + Toggle Button */}
                        <div className="flex flex-col items-center w-full gap-2 pb-3 border-b border-[#32151F]">
                            {isDesktopSidebarExpanded ? (
                                <div className="flex items-center justify-between w-full px-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab('menu');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="flex items-center gap-2 group text-left"
                                        title="NUSARA - Beranda Menu"
                                    >
                                        <img
                                            src="/images/nusara-logo.png"
                                            alt="NUSARA"
                                            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDesktopSidebarExpanded(false)}
                                        className="p-1.5 rounded-xl bg-[#32151F] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] transition-colors"
                                        title="Kecilkan Sidebar (Dock Mode)"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab('menu');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="p-1 rounded-2xl hover:bg-white/5 transition-all group flex items-center justify-center"
                                        title="NUSARA - Beranda Menu"
                                    >
                                        <img
                                            src="/images/nusara-logo.png"
                                            alt="NUSARA"
                                            className="h-8 w-auto object-contain transition-transform group-hover:scale-110"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDesktopSidebarExpanded(true)}
                                        className="p-1.5 rounded-xl text-stone-400 hover:text-[#D4B886] hover:bg-white/5 transition-colors"
                                        title="Perluas Sidebar"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Center: Vertical Navigation Icon / Full Row Buttons */}
                        <nav className="flex flex-col items-center w-full gap-2.5">
                            {/* 1. Menu Katalog */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('menu')}
                                className={isDesktopSidebarExpanded
                                    ? `w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                                        activeTab === 'menu'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/70 hover:text-white hover:bg-white/5'
                                    }`
                                    : `w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative group ${
                                        activeTab === 'menu'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                                title="Katalog Menu"
                            >
                                <div className="flex items-center gap-3">
                                    <Utensils className="w-5 h-5 stroke-[2] flex-shrink-0" />
                                    {isDesktopSidebarExpanded && <span>Katalog Menu</span>}
                                </div>
                                {isDesktopSidebarExpanded ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-stone-400">
                                        {menus.length}
                                    </span>
                                ) : (
                                    <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        Katalog Menu ({menus.length})
                                    </span>
                                )}
                            </button>

                            {/* 2. Keranjang Belanja */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('cart')}
                                className={isDesktopSidebarExpanded
                                    ? `w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                                        activeTab === 'cart'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/70 hover:text-white hover:bg-white/5'
                                    }`
                                    : `w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative group ${
                                        activeTab === 'cart'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                                title="Keranjang Pesanan"
                            >
                                <div className="flex items-center gap-3 relative">
                                    <ShoppingBag className="w-5 h-5 stroke-[2] flex-shrink-0" />
                                    {isDesktopSidebarExpanded && <span>Keranjang</span>}
                                    {!isDesktopSidebarExpanded && cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                                {isDesktopSidebarExpanded ? (
                                    cartCount > 0 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                                            {cartCount}
                                        </span>
                                    )
                                ) : (
                                    <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        Keranjang ({cartCount})
                                    </span>
                                )}
                            </button>

                            {/* 3. Pesanan Aktif (Live Tracking) */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('active_order')}
                                className={isDesktopSidebarExpanded
                                    ? `w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                                        activeTab === 'active_order'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/70 hover:text-white hover:bg-white/5'
                                    }`
                                    : `w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative group ${
                                        activeTab === 'active_order'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                                title="Pesanan Aktif"
                            >
                                <div className="flex items-center gap-3 relative">
                                    <Clock className="w-5 h-5 stroke-[2] flex-shrink-0" />
                                    {isDesktopSidebarExpanded && <span>Pesanan Aktif</span>}
                                    {!isDesktopSidebarExpanded && activeOrders.length > 0 && (
                                        <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                    )}
                                </div>
                                {isDesktopSidebarExpanded ? (
                                    activeOrders.length > 0 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 animate-pulse">
                                            {activeOrders.length} Aktif
                                        </span>
                                    )
                                ) : (
                                    <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        Pesanan Aktif ({activeOrders.length})
                                    </span>
                                )}
                            </button>

                            {/* 4. Reservasi Meja VIP */}
                            <button
                                type="button"
                                onClick={() => router.visit('/reservation')}
                                className={isDesktopSidebarExpanded
                                    ? 'w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold text-[#F4EFE6]/70 hover:text-white hover:bg-white/5 transition-all'
                                    : 'w-10 h-10 rounded-2xl flex items-center justify-center transition-all text-[#F4EFE6]/60 hover:text-white hover:bg-white/5 relative group'
                                }
                                title="Reservasi Meja VIP"
                            >
                                <div className="flex items-center gap-3">
                                    <CalendarDays className="w-5 h-5 stroke-[2] flex-shrink-0" />
                                    {isDesktopSidebarExpanded && <span>Reservasi VIP</span>}
                                </div>
                                {isDesktopSidebarExpanded ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#B99A65]/20 text-[#D4B886] font-extrabold uppercase">
                                        VIP
                                    </span>
                                ) : (
                                    <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        Reservasi Meja VIP
                                    </span>
                                )}
                            </button>

                            {/* 7. Konsierge Chat */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('chat')}
                                className={isDesktopSidebarExpanded
                                    ? `w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                                        activeTab === 'chat'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/70 hover:text-white hover:bg-white/5'
                                    }`
                                    : `w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative group ${
                                        activeTab === 'chat'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                                title="Konsierge / Chat Kasir"
                            >
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 stroke-[2] flex-shrink-0" />
                                    {isDesktopSidebarExpanded && <span>Konsierge Chat</span>}
                                </div>
                                {isDesktopSidebarExpanded ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                ) : (
                                    <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        Konsierge Chat
                                    </span>
                                )}
                            </button>

                            {/* 8. Pengaturan Akun */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('settings')}
                                className={isDesktopSidebarExpanded
                                    ? `w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                                        activeTab === 'settings'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/70 hover:text-white hover:bg-white/5'
                                    }`
                                    : `w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative group ${
                                        activeTab === 'settings'
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/50 shadow-md'
                                            : 'text-[#F4EFE6]/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                                title="Pengaturan Akun & 2FA"
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5 stroke-[2] flex-shrink-0" />
                                    {isDesktopSidebarExpanded && <span>Pengaturan Akun</span>}
                                </div>
                                {!isDesktopSidebarExpanded && (
                                    <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                        Pengaturan Akun
                                    </span>
                                )}
                            </button>
                        </nav>

                        {/* Bottom: Logout / User Action */}
                        <div className="flex flex-col items-center w-full pt-3 border-t border-[#32151F]">
                            {isDesktopSidebarExpanded ? (
                                auth?.user ? (
                                    <div className="w-full p-2.5 rounded-2xl bg-[#32151F]/60 border border-[#B99A65]/30 space-y-2">
                                        <div className="flex items-center gap-2.5 px-1">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] flex items-center justify-center font-bold text-xs">
                                                {auth.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-[#F4EFE6] truncate">{auth.user.name}</p>
                                                <p className="text-[10px] text-stone-400 truncate">{auth.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('settings')}
                                                className="flex-1 py-1.5 px-2 rounded-xl bg-[#211D1B] border border-[#B99A65]/40 text-[#D4B886] hover:bg-[#32151F] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <Settings className="w-3.5 h-3.5" />
                                                <span>Pengaturan</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsLogoutModalOpen(true)}
                                                className="py-1.5 px-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-[11px] font-bold flex items-center justify-center transition-colors"
                                                title="Keluar Akun"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                                    >
                                        <UserIcon className="w-4 h-4" />
                                        <span>Masuk Akun</span>
                                    </Link>
                                )
                            ) : (
                                auth?.user ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('settings')}
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-stone-300 hover:text-[#D4B886] hover:bg-white/5 transition-all group relative"
                                            title="Pengaturan Akun & 2FA"
                                        >
                                            <Settings className="w-5 h-5" />
                                            <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                                Pengaturan
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsLogoutModalOpen(true)}
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-950/60 border border-rose-500/30 transition-all group relative"
                                            title="Keluar dari Akun"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-rose-300 text-xs font-bold shadow-lg border border-rose-500/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                                Keluar
                                            </span>
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#D4B886] hover:bg-white/5 transition-all group relative"
                                        title="Masuk ke Akun Customer"
                                    >
                                        <UserIcon className="w-5 h-5" />
                                        <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#211D1B] text-[#D4B886] text-xs font-bold shadow-lg border border-[#B99A65]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                            Masuk Akun
                                        </span>
                                    </Link>
                                )
                            )}
                        </div>
                    </aside>

                    {/* ========================================================
                        CENTER MAIN CANVAS (RESPONSIVE: MOBILE & DESKTOP)
                    ======================================================== */}
                    <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-5 max-w-5xl mx-auto w-full pb-28 md:pb-12">
                        {/* ----------------------------------------------------
                            TAB: MENU CATALOG
                        ---------------------------------------------------- */}
                        {activeTab === 'menu' && (
                            <div className="space-y-6">
                                {/* Search Bar & Filter trigger */}
                                <div className="flex items-center gap-2.5">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 text-[#B99A65] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cari hidangan Nusantara (Bebek Betutu, Wagyu, Rendang)..."
                                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-white border border-[#B99A65]/40 text-xs text-[#211D1B] placeholder-stone-400 focus:outline-none focus:border-[#32151F] shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory('all')}
                                        className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#B99A65]/40 text-[#32151F] hover:bg-[#32151F] hover:text-[#D4B886] transition-all shadow-sm"
                                        title="Reset Filter"
                                    >
                                        <SlidersHorizontal className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* CINEMATIC LUXURY HERO BANNER (NO PROMO/BESTSELLER BADGES ALA USER RULE) */}
                                {activeTab === 'menu' && !searchQuery && (
                                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#32151F] via-[#211D1B] to-[#32151F] text-[#F4EFE6] shadow-xl border border-[#B99A65]/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                                            {/* Text Content */}
                                            <div className="p-6 sm:p-8 lg:p-10 space-y-3 z-10">
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4B886] block">
                                                    Pusaka Cita Rasa Keraton
                                                </span>
                                                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F4EFE6] leading-tight">
                                                    Warisan Autentik Kuliner Nusantara
                                                </h1>
                                                <p className="text-xs sm:text-sm text-[#F4EFE6]/75 leading-relaxed max-w-md">
                                                    Diracik dari rempah pilihan kepulauan Indonesia. Tersaji hangat langsung dari dapur pusaka ke meja santap Anda.
                                                </p>
                                                <div className="pt-2 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const el = document.getElementById('katalog-menu');
                                                            el?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                    >
                                                        <span>Eksplorasi Menu</span>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Hero Image */}
                                            <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden">
                                                <img
                                                    src="/images/menus/sate-lilit.jpg"
                                                    alt="NUSARA Signature"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
                                                    }}
                                                    className="w-full h-full object-cover object-center"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#211D1B] via-transparent to-transparent" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CATEGORY CIRCULAR ICONS (ALA SUSHI ZEN & TASTE HAVEN MOCKUPS) */}
                                <div className="space-y-2 py-1">
                                    <div className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto pb-2 pt-1 scrollbar-none">
                                        {/* All Menu */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('all')}
                                            className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
                                        >
                                            <div className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all duration-200 ${
                                                selectedCategory === 'all'
                                                    ? 'bg-[#32151F] text-[#D4B886] shadow-lg ring-2 ring-[#B99A65]'
                                                    : 'bg-white text-stone-700 border border-stone-200 group-hover:border-[#B99A65]/50 group-hover:shadow-sm'
                                            }`}>
                                                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <span className={`text-[11px] sm:text-xs tracking-tight text-center whitespace-nowrap ${
                                                selectedCategory === 'all' ? 'font-bold text-[#32151F]' : 'text-stone-600'
                                            }`}>
                                                Semua Menu
                                            </span>
                                        </button>

                                        {/* Dynamic categories */}
                                        {categories.map(cat => {
                                            const isSelected = selectedCategory === cat.slug;
                                            const CatIcon = getCategoryIcon(cat.slug || cat.name);

                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(cat.slug)}
                                                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
                                                >
                                                    <div className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all duration-200 ${
                                                        isSelected
                                                            ? 'bg-[#32151F] text-[#D4B886] shadow-lg ring-2 ring-[#B99A65]'
                                                            : 'bg-white text-stone-700 border border-stone-200 group-hover:border-[#B99A65]/50 group-hover:shadow-sm'
                                                    }`}>
                                                        <CatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </div>
                                                    <span className={`text-[11px] sm:text-xs tracking-tight text-center whitespace-nowrap ${
                                                        isSelected ? 'font-bold text-[#32151F]' : 'text-stone-600'
                                                    }`}>
                                                        {cat.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* POPULAR PICKS: HORIZONTAL CAROUSEL ON MOBILE, COMPACT CARDS (NO BADGES) */}
                                {activeTab === 'menu' && !searchQuery && selectedCategory === 'all' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#32151F]">
                                                Popular Picks
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const el = document.getElementById('katalog-menu');
                                                    el?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="text-xs font-bold text-[#946E2D] hover:underline flex items-center gap-1"
                                            >
                                                <span>Lihat Semua</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none sm:grid sm:grid-cols-3 sm:gap-4">
                                            {popularPicks.map(menu => (
                                                <div
                                                    key={menu.id}
                                                    className="w-44 sm:w-auto flex-shrink-0 bg-white rounded-3xl border border-[#B99A65]/30 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                                >
                                                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-2.5">
                                                        <img
                                                            src={getMenuImageUrl(menu.image_path)}
                                                            alt={menu.name}
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/images/menus/sate-lilit.jpg';
                                                            }}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <h4 className="font-heading font-bold text-xs sm:text-sm text-[#211D1B] truncate">
                                                            {menu.name}
                                                        </h4>
                                                        <div className="flex items-center gap-1 text-[10px] text-stone-500">
                                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            <span className="font-semibold text-stone-700">4.9</span>
                                                            <span>(1.2K+)</span>
                                                        </div>
                                                        <div className="pt-2 flex items-center justify-between">
                                                            <span className="font-heading font-black text-xs sm:text-sm text-[#946E2D]">
                                                                {formatRupiah(menu.price)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenCustomizer(menu)}
                                                                className="w-7 h-7 rounded-full bg-[#211D1B] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] transition-all flex items-center justify-center shadow-md active:scale-90"
                                                                title="Pesan Menu Ini"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* MAIN CATALOG GRID: 2 COLUMNS ON MOBILE (NO BADGES) */}
                                <div id="katalog-menu" className="space-y-3 pt-2 scroll-mt-20">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#32151F]">
                                            Katalog Hidangan
                                        </h3>
                                        <span className="text-xs text-stone-500 font-semibold">
                                            {displayedMenus.length} Menu
                                        </span>
                                    </div>

                                    {displayedMenus.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-6">
                                            <Utensils className="w-12 h-12 text-[#B99A65] mx-auto mb-3 opacity-50" />
                                            <h4 className="font-heading text-lg font-bold text-[#32151F]">
                                                Menu Tidak Ditemukan
                                            </h4>
                                            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                                                Coba ubah kata kunci pencarian atau pilih kategori lainnya.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                                            {displayedMenus.map(menu => {
                                                const isOutOfStock = !menu.is_available || menu.stock_quantity <= 0;

                                                return (
                                                    <div
                                                        key={menu.id}
                                                        className={`rounded-3xl bg-white border border-[#B99A65]/30 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                                                            isOutOfStock ? 'opacity-60 bg-stone-100' : ''
                                                        }`}
                                                    >
                                                        {/* Image */}
                                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-2">
                                                            <img
                                                                src={getMenuImageUrl(menu.image_path)}
                                                                alt={menu.name}
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/images/menus/sate-lilit.jpg';
                                                                }}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>

                                                        {/* Text Body */}
                                                        <div className="space-y-1">
                                                            <h4 className="font-heading font-bold text-xs sm:text-sm text-[#211D1B] truncate">
                                                                {menu.name}
                                                            </h4>
                                                            <p className="text-[11px] text-stone-500 line-clamp-1">
                                                                {menu.description}
                                                            </p>

                                                            <div className="pt-2 flex items-center justify-between">
                                                                <span className="font-heading font-extrabold text-xs sm:text-sm text-[#946E2D]">
                                                                    {formatRupiah(menu.price)}
                                                                </span>

                                                                {isOutOfStock ? (
                                                                    <span className="text-[10px] font-bold text-stone-400">
                                                                        Habis
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenCustomizer(menu)}
                                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#211D1B] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] transition-all flex items-center justify-center shadow-md active:scale-90"
                                                                        title="Pesan Menu Ini"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* SECONDARY PROMO BANNER (ALA SUSHI ZEN / TASTE HAVEN BOTTOM BANNER) */}
                                {activeTab === 'menu' && !searchQuery && selectedCategory === 'all' && (
                                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#211D1B] via-[#32151F] to-[#211D1B] border border-[#B99A65]/40 text-[#F4EFE6] p-4 sm:p-5 shadow-xl mt-4">
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Left details */}
                                            <div className="space-y-1.5 max-w-[60%] sm:max-w-[65%]">
                                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D4B886] block">
                                                    Paket Spesial Siang
                                                </span>
                                                <h4 className="font-heading font-extrabold text-sm sm:text-lg text-white leading-tight">
                                                    NUSARA COMBO + ES KELAPA MUDA
                                                </h4>
                                                <p className="text-[10px] sm:text-xs text-stone-300">
                                                    Hanya berlaku jam santap siang 11:00 - 15:00 WIB
                                                </p>
                                                <div className="pt-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (popularPicks.length > 0) {
                                                                handleOpenCustomizer(popularPicks[0]);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] text-[11px] font-extrabold uppercase tracking-wider hover:shadow-lg transition-transform active:scale-95"
                                                    >
                                                        <span>Pesan Sekarang</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Right: 20% OFF Badge & Image */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#B99A65]/40 shadow-lg">
                                                    <img
                                                        src="/images/menus/sate-lilit.jpg"
                                                        alt="Paket Spesial"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80';
                                                        }}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {/* Circular 20% OFF badge */}
                                                <div className="absolute -top-2 -left-2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-600 border-2 border-white text-white flex flex-col items-center justify-center font-black shadow-lg">
                                                    <span className="text-[10px] leading-none">20%</span>
                                                    <span className="text-[8px] leading-none uppercase">OFF</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ----------------------------------------------------
                            TAB: MY CART (DEDICATED IN-PAGE VIEW ALA IMAGE 1 KIRI - NO POPUP)
                        ---------------------------------------------------- */}
                        {activeTab === 'cart' && (
                            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                                {/* Top Header matching Image 1 */}
                                <div className="flex items-center justify-between pb-3 border-b border-[#B99A65]/20">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('menu')}
                                            className="w-10 h-10 rounded-full bg-white border border-[#B99A65]/40 text-[#32151F] flex items-center justify-center hover:bg-[#32151F] hover:text-[#D4B886] transition-all shadow-sm"
                                            title="Kembali ke Menu"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                                My Cart
                                            </h2>
                                            <span className="text-[11px] text-[#211D1B]/70">
                                                {cartCount} porsi dipilih ({orderType === 'dine_in' ? `Makan di Tempat · ${selectedTable}` : 'Bawa Pulang / Takeaway'})
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setServiceMode('unselected')}
                                        className="px-3 py-1.5 rounded-xl bg-white border border-[#B99A65]/40 text-[#32151F] hover:bg-[#32151F] hover:text-[#D4B886] text-xs font-semibold transition-all shadow-sm"
                                    >
                                        Ubah Meja
                                    </button>
                                </div>

                                {cart.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-stone-300 space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#B99A65]/40 text-[#B99A65] mx-auto flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                                Keranjang Anda Masih Kosong
                                            </h3>
                                            <p className="text-xs text-[#211D1B]/70 mt-1 max-w-sm mx-auto">
                                                Jelajahi menu kuliner Nusantara kami dan tambahkan hidangan favorit Anda ke keranjang.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('menu')}
                                            className="px-6 py-3 rounded-2xl bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#B99A65] hover:text-[#211D1B] transition-all shadow-md"
                                        >
                                            Buka Katalog Menu
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Cart Items List matching Image 1 left screen */}
                                        <div className="space-y-3">
                                            {cart.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 rounded-3xl bg-[#211D1B] text-[#F4EFE6] border border-[#B99A65]/30 shadow-lg flex items-center justify-between gap-3"
                                                >
                                                    {/* Left: Circular Image & Dish Info */}
                                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                        <img
                                                            src={getMenuImageUrl(item.menu.image_path)}
                                                            alt={item.menu.name}
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/images/menus/sate-lilit.jpg';
                                                            }}
                                                            className="w-16 h-16 rounded-full object-cover border-2 border-[#B99A65]/40 shadow-md flex-shrink-0"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="font-bold text-sm sm:text-base text-[#F4EFE6] truncate">
                                                                {item.menu.name}
                                                            </h4>
                                                            <p className="font-heading font-extrabold text-sm text-[#D4B886] mt-0.5">
                                                                {formatRupiah(item.menu.price)}
                                                            </p>
                                                            {/* Item notes input */}
                                                            <input
                                                                type="text"
                                                                value={item.item_notes}
                                                                onChange={(e) => handleUpdateItemNotes(index, e.target.value)}
                                                                placeholder="Catatan porsi: kuah pisah, pedas..."
                                                                className="mt-1.5 w-full max-w-xs px-2.5 py-1 rounded-lg bg-[#32151F]/70 border border-[#B99A65]/30 text-[11px] text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Right: Vertical Stepper Capsule matching Image 1 */}
                                                    <div className="flex flex-col items-center justify-between w-9 h-24 rounded-2xl bg-gradient-to-b from-[#B99A65] via-[#D4B886] to-[#987B49] text-[#211D1B] font-bold p-1 shadow-md flex-shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateQuantity(index, 1)}
                                                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-transform"
                                                            title="Tambah porsi"
                                                        >
                                                            <Plus className="w-4 h-4 stroke-[2.5]" />
                                                        </button>
                                                        <span className="font-mono text-xs font-black">
                                                            {String(item.quantity).padStart(2, '0')}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateQuantity(index, -1)}
                                                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-transform"
                                                            title="Kurang porsi"
                                                        >
                                                            <Minus className="w-4 h-4 stroke-[2.5]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Customer Details & Service Inputs */}
                                        <div className="p-5 rounded-3xl bg-white border border-[#B99A65]/30 shadow-md space-y-4 text-[#211D1B]">
                                            <h4 className="font-heading font-bold text-base text-[#32151F] border-b border-stone-200 pb-2">
                                                Data Pemesanan & Meja
                                            </h4>

                                            {/* Customer Name */}
                                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-600/30 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#946E2D]">
                                                        Nama Pemesan <span className="text-rose-600 font-extrabold">* (Wajib Diisi)</span>
                                                    </label>
                                                    {isGuest && (
                                                        <span className="text-[10px] text-amber-900 font-semibold bg-amber-200/80 px-2 py-0.5 rounded-full">
                                                            Pindai Meja (Tanpa Login)
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    placeholder="Ketik nama Anda (contoh: Anindya Laksmi)"
                                                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-[#211D1B] focus:outline-none transition-all ${
                                                        !customerName.trim()
                                                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                                                            : 'border-stone-300 focus:border-[#B99A65]'
                                                    }`}
                                                />
                                                <p className="text-[10px] text-stone-500 leading-tight">
                                                    Nama ini akan digunakan oleh staf pramusaji untuk mengonfirmasi dan menyajikan hidangan ke meja Anda.
                                                </p>
                                            </div>

                                            {/* Table Input for Dine-in */}
                                            {orderType === 'dine_in' && (
                                                <div>
                                                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D] mb-1.5">
                                                        Nomor Meja:
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={selectedTable}
                                                            onChange={(e) => setSelectedTable(e.target.value)}
                                                            placeholder="Contoh: Meja 03..."
                                                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs text-[#211D1B] focus:outline-none focus:border-[#B99A65]"
                                                        />
                                                        <select
                                                            value={tables.some(t => t.table_number === selectedTable) ? selectedTable : ''}
                                                            onChange={(e) => {
                                                                if (e.target.value) setSelectedTable(e.target.value);
                                                            }}
                                                            className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs font-semibold focus:outline-none"
                                                        >
                                                            <option value="">Pilih Meja</option>
                                                            {tables.map(t => (
                                                                <option key={t.id} value={t.table_number}>
                                                                    {t.table_number} ({t.capacity || 5} Kursi)
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {/* General Notes */}
                                            <div>
                                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D] mb-1.5">
                                                    Catatan Pesanan ke Dapur (Opsional):
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={generalNotes}
                                                    onChange={(e) => setGeneralNotes(e.target.value)}
                                                    placeholder="Contoh: Tolong disajikan bersamaan untuk semua porsi..."
                                                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs text-[#211D1B] focus:outline-none focus:border-[#B99A65]"
                                                />
                                            </div>

                                            {/* Coupon Input */}
                                            <div>
                                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#946E2D] mb-1.5">
                                                    Kupon Promo:
                                                </label>
                                                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        placeholder="Kode kupon (contoh: NUSARA20)"
                                                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs text-[#211D1B] focus:outline-none focus:border-[#B99A65]"
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="px-4 py-2 rounded-xl bg-[#32151F] text-[#D4B886] font-bold text-xs hover:bg-[#B99A65] hover:text-[#211D1B] transition-colors"
                                                    >
                                                        Terapkan
                                                    </button>
                                                </form>
                                                {appliedCoupon && (
                                                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                                                        Kupon '{appliedCoupon}' aktif: Diskon 20% (-{formatRupiah(couponDiscount)})
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payment Method Selector (Reservation Parity for Logged-In Customers) */}
                                        <div className="p-5 rounded-3xl bg-white border border-[#B99A65]/30 shadow-md space-y-4">
                                            {auth?.user ? (
                                                <>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-stone-200">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#946E2D]">
                                                                    Metode Pembayaran
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                                                    11 Saluran Member Aktif
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-stone-600 mt-0.5">
                                                                Pilih saluran pembayaran instan terverifikasi otomatis atau bayar langsung ke kasir.
                                                            </p>
                                                        </div>

                                                        {/* Filter Kategori ala Halaman Reservasi */}
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentCategoryFilter('all')}
                                                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                                                    paymentCategoryFilter === 'all'
                                                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm'
                                                                        : 'bg-[#FAF7F2] text-stone-600 border border-stone-200 hover:border-stone-300'
                                                                }`}
                                                            >
                                                                Semua (11)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentCategoryFilter('ewallet')}
                                                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                                                    paymentCategoryFilter === 'ewallet'
                                                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm'
                                                                        : 'bg-[#FAF7F2] text-stone-600 border border-stone-200 hover:border-stone-300'
                                                                }`}
                                                            >
                                                                e-Wallet & QRIS (5)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentCategoryFilter('va')}
                                                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                                                    paymentCategoryFilter === 'va'
                                                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm'
                                                                        : 'bg-[#FAF7F2] text-stone-600 border border-stone-200 hover:border-stone-300'
                                                                }`}
                                                            >
                                                                VA Bank (5)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentCategoryFilter('cash')}
                                                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                                                    paymentCategoryFilter === 'cash'
                                                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm'
                                                                        : 'bg-[#FAF7F2] text-stone-600 border border-stone-200 hover:border-stone-300'
                                                                }`}
                                                            >
                                                                Tunai (1)
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Grid Saluran Pembayaran */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {(paymentCategoryFilter === 'all' 
                                                            ? ORDER_PAYMENT_METHODS 
                                                            : ORDER_PAYMENT_METHODS.filter(m => m.category === paymentCategoryFilter)
                                                        ).map((m) => {
                                                            const isSelected = paymentMethod === m.id;
                                                            return (
                                                                <button
                                                                    key={m.id}
                                                                    type="button"
                                                                    onClick={() => setPaymentMethod(m.id)}
                                                                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 relative cursor-pointer ${
                                                                        isSelected
                                                                            ? 'bg-[#32151F] text-[#F4EFE6] border-[#B99A65] ring-2 ring-[#D4B886]/40 shadow-lg scale-[1.01]'
                                                                            : 'bg-[#FAF7F2] text-[#211D1B] border-stone-200 hover:border-[#B99A65]/50 hover:bg-white shadow-2xs'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-2 w-full">
                                                                        <div className="h-7 flex items-center">
                                                                            {m.logo}
                                                                        </div>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                                            isSelected ? 'bg-white/10 text-[#D4B886] border-[#D4B886]/30' : m.badgeColor
                                                                        }`}>
                                                                            {m.badge}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className={`font-heading font-bold text-sm ${isSelected ? 'text-[#F4EFE6]' : 'text-[#32151F]'}`}>
                                                                            {m.title}
                                                                        </h4>
                                                                        <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                                                                            {m.subtitle}
                                                                        </p>
                                                                    </div>
                                                                    <div className={`pt-2 border-t text-[10px] truncate ${
                                                                        isSelected ? 'border-white/10 text-[#D4B886]/90' : 'border-stone-200 text-stone-500'
                                                                    }`}>
                                                                        {m.apps.join(' · ')}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Petunjuk & Langkah Pembayaran untuk Metode yang Dipilih */}
                                                    {(() => {
                                                        const activeM = ORDER_PAYMENT_METHODS.find(m => m.id === paymentMethod) || ORDER_PAYMENT_METHODS[0];
                                                        return (
                                                            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#B99A65]/30 space-y-2 text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-[#32151F] flex items-center gap-1.5">
                                                                        <Info className="w-4 h-4 text-[#946E2D]" />
                                                                        Panduan: {activeM.title}
                                                                    </span>
                                                                    <span className="text-[10px] text-stone-500 font-semibold">
                                                                        Verifikasi Otomatis
                                                                    </span>
                                                                </div>
                                                                <ol className="list-decimal list-inside space-y-1 text-stone-700 text-[11px] leading-relaxed">
                                                                    {activeM.instructions.map((ins, i) => (
                                                                        <li key={i}>{ins}</li>
                                                                    ))}
                                                                </ol>
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#946E2D] block">
                                                        Pilih Metode Pembayaran
                                                    </span>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentMethod('cash')}
                                                            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer ${
                                                                paymentMethod === 'cash'
                                                                    ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-sm'
                                                                    : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                                                            }`}
                                                        >
                                                            <Banknote className="w-5 h-5 text-[#D4B886]" />
                                                            <span>Tunai di Kasir (Cash)</span>
                                                            <span className="text-[10px] opacity-75 font-normal">Bayar langsung di kasir restoran</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentMethod('qris')}
                                                            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center relative cursor-pointer ${
                                                                paymentMethod === 'qris'
                                                                    ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-sm'
                                                                    : 'bg-[#FAF7F2] text-stone-700 border-stone-200 hover:border-stone-300'
                                                            }`}
                                                        >
                                                            <QrCode className="w-5 h-5 text-[#D4B886]" />
                                                            <span>QRIS Instan Midtrans</span>
                                                            <span className="text-[10px] opacity-75 font-normal">
                                                                {midtransIsConfigured ? 'Scan QRIS Bebas Biaya' : 'Perlu Server Key .env'}
                                                            </span>
                                                            {!midtransIsConfigured && (
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 font-bold border border-amber-500/30">
                                                                    Belum Aktif
                                                                </span>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Banner Member Login untuk Buka Semua Metode */}
                                                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF7F2] to-[#FAF6F0] border border-[#B99A65]/40 flex items-center justify-between gap-3 flex-wrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-[#32151F] text-[#D4B886] flex items-center justify-center flex-shrink-0 shadow-2xs">
                                                                <Wallet className="w-4 h-4 text-[#D4B886]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-[#32151F]">
                                                                    Ingin Bayar via GoPay, ShopeePay, DANA, OVO, atau VA Bank?
                                                                </p>
                                                                <p className="text-[11px] text-[#6E625A]">
                                                                    Masuk ke akun Anda untuk membuka seluruh 11 saluran pembayaran resmi sama seperti di reservasi.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Link
                                                            href="/login"
                                                            className="px-3.5 py-1.5 rounded-xl bg-[#32151F] hover:bg-[#4A1525] text-[#D4B886] text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                                        >
                                                            <span>Masuk Akun</span>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Price Breakdown matching Image 1 */}
                                        <div className="p-5 rounded-3xl bg-[#211D1B] text-[#F4EFE6] border border-[#B99A65]/30 shadow-xl space-y-2.5 text-xs">
                                            <div className="flex justify-between text-[#F4EFE6]/70">
                                                <span>Item Subtotal</span>
                                                <span className="font-semibold text-[#F4EFE6]">{formatRupiah(cartSubtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-[#F4EFE6]/70">
                                                <span>Pajak Restoran PB1 (11%)</span>
                                                <span className="font-semibold text-[#F4EFE6]">{formatRupiah(cartTax)}</span>
                                            </div>
                                            {couponDiscount > 0 && (
                                                <div className="flex justify-between text-emerald-400 font-semibold">
                                                    <span>Diskon Kupon</span>
                                                    <span>-{formatRupiah(couponDiscount)}</span>
                                                </div>
                                            )}
                                            <div className="pt-3 border-t border-[#B99A65]/30 flex justify-between items-center font-bold text-sm">
                                                <span className="text-[#F4EFE6]">Grand Total</span>
                                                <span className="font-heading font-black text-xl text-[#D4B886]">
                                                    {formatRupiah(Math.max(0, cartTotal - couponDiscount))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Large Orange Checkout CTA Button matching Image 1 */}
                                        <button
                                            type="button"
                                            disabled={isCheckingOut || cart.length === 0}
                                            onClick={handleCheckout}
                                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#987B49] text-[#211D1B] font-extrabold text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isCheckingOut ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    <span>Memproses Pesanan...</span>
                                                </>
                                            ) : (
                                                <span>Checkout — {formatRupiah(Math.max(0, cartTotal - couponDiscount))}</span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ----------------------------------------------------
                            TAB: PESANAN AKTIF / LIVE TRACKING (MATCHING IMAGE 1 KANAN)
                        ---------------------------------------------------- */}
                        {activeTab === 'active_order' && (
                            <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                                <div className="flex items-center justify-between pb-3 border-b border-[#B99A65]/30">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B99A65]">
                                                Live Kitchen Tracking
                                            </span>
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Sinkron Real-Time
                                            </span>
                                        </div>
                                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                            Informasi Pesanan (Order Info)
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.reload({ only: ['orders'] })}
                                            className="p-2 rounded-xl bg-white border border-[#B99A65]/40 text-[#32151F] hover:bg-[#32151F] hover:text-[#D4B886] transition-all text-xs flex items-center gap-1.5 shadow-sm"
                                            title="Segarkan status pesanan"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Refresh Status</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('menu')}
                                            className="px-3 py-1.5 rounded-xl bg-[#32151F] text-[#D4B886] text-xs font-bold hover:bg-[#B99A65] hover:text-[#211D1B] transition-all"
                                        >
                                            + Tambah Menu
                                        </button>
                                    </div>
                                </div>

                                {activeOrders.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-stone-300 p-8 space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#B99A65]/40 text-[#B99A65] mx-auto flex items-center justify-center">
                                            <Clock className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-2xl font-bold text-[#32151F]">
                                                Tidak Ada Pesanan yang Sedang Aktif
                                            </h3>
                                            <p className="text-xs text-[#211D1B]/70 mt-1 max-w-sm mx-auto">
                                                Silakan pilih menu jamuan istimewa NUSARA dan lakukan pemesanan untuk memulai santapan Anda.
                                            </p>
                                        </div>
                                        <div className="pt-2 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('menu')}
                                                className="px-6 py-2.5 rounded-xl bg-[#32151F] text-[#D4B886] font-bold text-xs hover:bg-[#B99A65] hover:text-[#211D1B] transition-all shadow-md active:scale-95"
                                            >
                                                Pesan Menu Sekarang
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {activeOrders.map(order => {
                                            const step = getStatusStep(order.order_status);

                                            return (
                                                <div
                                                    key={order.id}
                                                    className="p-5 sm:p-7 rounded-3xl bg-[#211D1B] text-[#F4EFE6] border border-[#B99A65]/40 shadow-2xl space-y-6"
                                                >
                                                    {/* Header Card matching Image 1 kanan */}
                                                    <div className="text-center space-y-1 border-b border-[#32151F] pb-4">
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4B886]">
                                                            Order Number
                                                        </span>
                                                        <h3 className="font-heading font-black text-4xl sm:text-5xl text-[#F4EFE6] tracking-tight">
                                                            {order.queue_number || order.order_code.slice(-4)}
                                                        </h3>
                                                        <p className="text-xs text-[#D4B886]/90">
                                                            Kode: #{order.order_code} · {order.order_type === 'dine_in' ? `Makan di ${order.table_number || selectedTable}` : 'Takeaway (Ambil di Kasir)'}
                                                        </p>
                                                    </div>

                                                    {/* 4-Step Stepper ala Image 1 kanan */}
                                                    <div className="py-2">
                                                        <div className="flex items-center justify-between relative max-w-md mx-auto">
                                                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#32151F] -translate-y-1/2 z-0" />
                                                            <div 
                                                                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#B99A65] to-[#D4B886] -translate-y-1/2 z-0 transition-all duration-500"
                                                                style={{ width: `${Math.min(100, (step - 1) * 33.3)}%` }}
                                                            />

                                                            {[
                                                                { s: 1, label: 'Diterima' },
                                                                { s: 2, label: 'Dimasak' },
                                                                { s: 3, label: 'Siap Saji' },
                                                                { s: 4, label: 'Selesai' },
                                                            ].map(item => (
                                                                <div key={item.s} className="relative z-10 flex flex-col items-center">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                                                        step >= item.s
                                                                            ? 'bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] ring-4 ring-[#211D1B] shadow-md'
                                                                            : 'bg-[#32151F] text-stone-500 border border-stone-700'
                                                                    }`}>
                                                                        {step > item.s ? <Check className="w-4 h-4 stroke-[2.5]" /> : item.s}
                                                                    </div>
                                                                    <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${
                                                                        step >= item.s ? 'text-[#D4B886]' : 'text-stone-500'
                                                                    }`}>
                                                                        {item.label}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="text-center mt-4">
                                                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] text-xs font-bold animate-pulse">
                                                                {getStatusTrackerText(order.order_status, order.payment?.payment_method)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Items Ordered List matching Image 1 kanan */}
                                                    <div className="space-y-3 pt-2">
                                                        <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-[#D4B886]">
                                                            Items Ordered
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {order.items?.map(it => (
                                                                <div
                                                                    key={it.id}
                                                                    className="p-3 rounded-2xl bg-[#32151F]/60 border border-[#B99A65]/20 flex items-center justify-between gap-3"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-10 h-10 rounded-full bg-[#211D1B] border border-[#B99A65]/40 flex items-center justify-center text-[#D4B886] flex-shrink-0 font-bold text-xs">
                                                                            {it.quantity}x
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <h5 className="font-bold text-xs text-[#F4EFE6] truncate">
                                                                                {it.menu_name_snapshot}
                                                                            </h5>
                                                                            {it.item_notes && (
                                                                                <p className="text-[10px] text-[#D4B886] truncate">
                                                                                    Catatan: {it.item_notes}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-mono text-xs font-bold text-[#D4B886] flex-shrink-0">
                                                                        {formatRupiah(it.subtotal)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Selesaikan Pembayaran Midtrans jika masih Pending */}
                                                    {order.payment?.payment_status === 'Pending' && order.payment?.payment_method !== 'cash' && (
                                                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/80 to-[#32151F] border border-amber-500/40 space-y-2">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                                                                    <AlertCircle className="w-4 h-4 text-amber-400" />
                                                                    Pembayaran Midtrans Belum Selesai
                                                                </span>
                                                                <span className="text-[10px] text-stone-300">Menunggu Pembayaran Online</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {order.transaction?.payment_url && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handlePayWithSnap(order.transaction.payment_url, order.id)}
                                                                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:from-[#a88954] hover:to-[#c3a775] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                                                                    >
                                                                        <QrCode className="w-4 h-4" />
                                                                        <span>Buka QRIS Midtrans</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleVerifyMidtransPayment(order.id)}
                                                                    className="py-2.5 px-3 rounded-xl bg-stone-900 border border-[#B99A65]/50 hover:bg-[#32151F] text-[#D4B886] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                                                                >
                                                                    <RefreshCw className="w-4 h-4" />
                                                                    <span>Cek Status Bayar</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Petunjuk Pesanan Tunai Menunggu ACC Kasir */}
                                                    {order.payment?.payment_method === 'cash' && order.order_status === 'Pending' && (
                                                        <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
                                                            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                                            <span>Pesanan menunggu konfirmasi kasir. Silakan selesaikan pembayaran tunai di kasir restoran agar dapur segera memasak pesanan Anda.</span>
                                                        </div>
                                                    )}

                                                    {/* Status Masak di Dapur */}
                                                    {order.order_status === 'Preparing' && (
                                                        <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
                                                            <Flame className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                                                            <span>Pembayaran terverifikasi! Koki dapur NUSARA saat ini sedang memasak hidangan istimewa Anda.</span>
                                                        </div>
                                                    )}

                                                    {/* Rating & Kepuasan Pelanggan (Hanya untuk Tamu / Pelanggan Terdaftar yang Log In) */}
                                                    {Boolean(auth?.user) && (
                                                        <div className="pt-3 border-t border-[#32151F]">
                                                            {order.rating ? (
                                                                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 text-xs flex-wrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-0.5 text-amber-400">
                                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                                <Star
                                                                                    key={star}
                                                                                    className={`w-3.5 h-3.5 ${
                                                                                        star <= (order.rating.rating || 5)
                                                                                            ? 'fill-amber-400 text-amber-400'
                                                                                            : 'text-stone-600'
                                                                                    }`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="font-bold text-amber-200">
                                                                            Rating Terkirim ({order.rating.rating || 5} Bintang)
                                                                        </span>
                                                                    </div>
                                                                    {order.rating.review && (
                                                                        <span className="text-[11px] text-[#D4B886]/90 italic max-w-xs truncate">
                                                                            "{order.rating.review}"
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="p-3.5 rounded-2xl bg-[#32151F]/60 border border-[#B99A65]/30 flex items-center justify-between gap-3 flex-wrap">
                                                                    <div>
                                                                        <span className="font-heading font-bold text-xs text-[#F4EFE6] block">
                                                                            Kepuasan Santap
                                                                        </span>
                                                                        <span className="text-[11px] text-[#D4B886]/80">
                                                                            Bagikan penilaian bintang Anda untuk hidangan ini.
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setRatingOrder(order);
                                                                            setSelectedStars(5);
                                                                            setReviewComment('');
                                                                        }}
                                                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:from-[#a88954] hover:to-[#c3a775] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                                                                    >
                                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                                        <span>Beri Bintang</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Refund Action & Badges */}
                                                    {(order.order_status === 'Pending' || order.order_status === 'Refund Requested' || order.order_status === 'Refunded') && (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {order.order_status === 'Pending' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenRefundModal(order)}
                                                                    className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-900 transition-all flex items-center gap-1.5"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                                                    <span>Ajukan Pembatalan & Refund</span>
                                                                </button>
                                                            )}
                                                            {order.order_status === 'Refund Requested' && (
                                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-semibold">
                                                                    <RotateCcw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                                                                    <span>Pengajuan Refund Sedang Ditinjau Admin</span>
                                                                </div>
                                                            )}
                                                            {order.order_status === 'Refunded' && (
                                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                                    <span>Dana Telah Dikembalikan (Refunded)</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Order Summary & Actions matching Image 1 kanan */}
                                                    <div className="pt-3 border-t border-[#32151F] flex flex-col sm:flex-row items-center justify-between gap-3">
                                                        <div className="text-left w-full sm:w-auto">
                                                            <span className="text-[11px] text-stone-400">Total Tagihan:</span>
                                                            <span className="font-heading font-black text-lg text-[#D4B886] ml-2">
                                                                {formatRupiah(order.total)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveTab('chat')}
                                                                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-900/60 hover:bg-stone-800 text-stone-200 text-xs font-bold transition-all"
                                                            >
                                                                Bantuan Staf
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => router.reload({ only: ['orders'] })}
                                                                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] text-xs font-extrabold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
                                                            >
                                                                Refresh
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ----------------------------------------------------
                            TAB: KONSORGE CHAT
                        ---------------------------------------------------- */}
                        {activeTab === 'chat' && (
                            <div className="space-y-4 max-w-2xl mx-auto bg-white rounded-3xl border border-[#B99A65]/40 shadow-xl overflow-hidden flex flex-col h-[70vh]">
                                <div className="p-4 bg-[#32151F] text-[#F4EFE6] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-[#D4B886]" />
                                        <div>
                                            <h3 className="font-heading font-bold text-sm">
                                                Konsierge & Bantuan Kasir
                                            </h3>
                                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                Kasir NUSARA Online
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('menu')}
                                        className="p-1 rounded-lg text-stone-400 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]">
                                    {initialChats.map(chat => {
                                        const isMe = chat.sender_type === 'customer';
                                        return (
                                            <div 
                                                key={chat.id} 
                                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                            >
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                                                    isMe 
                                                        ? 'bg-gradient-to-br from-[#D4B886] to-[#B99A65] text-[#211D1B] rounded-br-md shadow' 
                                                        : 'bg-[#32151F] text-[#F4EFE6] border border-[#B99A65]/25 rounded-bl-md shadow'
                                                }`}>
                                                    {!isMe && (
                                                        <span className="font-bold text-[10px] text-[#B99A65] block uppercase tracking-wider mb-0.5">
                                                            Kasir NUSARA
                                                        </span>
                                                    )}
                                                    <p>{chat.message}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ketik pesan ke kasir atau minta bantuan..."
                                        className="flex-1 px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-stone-300 text-xs text-[#211D1B] focus:outline-none focus:border-[#B99A65]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSendingChat || !chatInput.trim()}
                                        className="p-2.5 rounded-full bg-[#32151F] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] transition-all disabled:opacity-40"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ----------------------------------------------------
                            TAB: PENGATURAN AKUN PELANGGAN & 2FA GOOGLE AUTHENTICATOR
                        ---------------------------------------------------- */}
                        {activeTab === 'settings' && (
                            <CustomerSettings 
                                user={auth?.user || null} 
                                isGuest={isGuest} 
                                onBackToMenu={() => setActiveTab('menu')} 
                            />
                        )}
                    </main>

                    {/* ========================================================
                        DESKTOP RIGHT STICKY ORDER COLUMN (ALA IMAGE 3 KANAN)
                        (Hanya tampil di Desktop: hidden lg:flex)
                    ======================================================== */}
                    <aside className="hidden lg:flex flex-col w-96 flex-shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto p-4 space-y-4 border-l border-[#B99A65]/20 bg-white">
                        {/* Service Mode Card */}
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] shadow-md flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B886] block">
                                    Layanan Aktif
                                </span>
                                <h4 className="font-heading font-bold text-base text-[#F4EFE6]">
                                    {orderType === 'dine_in' ? selectedTable : 'Bawa Pulang (Takeaway)'}
                                </h4>
                                <span className="text-[11px] text-stone-300">
                                    {customerName || 'Tamu Restoran'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setServiceMode('unselected')}
                                className="px-2.5 py-1 rounded-xl bg-[#211D1B] border border-[#B99A65]/40 text-[#D4B886] text-xs font-bold hover:bg-[#B99A65] hover:text-[#211D1B] transition-all"
                            >
                                Ubah
                            </button>
                        </div>

                        {/* Order Menu Card */}
                        <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-stone-200 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-[#32151F]" />
                                        <h3 className="font-heading font-extrabold text-base text-[#211D1B]">
                                            Order Menu
                                        </h3>
                                    </div>
                                    <span className="text-xs font-bold text-[#946E2D]">
                                        {cartCount} Menu
                                    </span>
                                </div>

                                {cart.length === 0 ? (
                                    <div className="py-8 text-center space-y-2">
                                        <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto" />
                                        <p className="text-xs font-semibold text-stone-600">
                                            Keranjang masih kosong
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                        {cart.map((item, index) => (
                                            <div
                                                key={index}
                                                className="p-2.5 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-2"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="font-bold text-xs text-[#211D1B] truncate">
                                                        {item.menu.name}
                                                    </h5>
                                                    <span className="font-mono text-[11px] text-[#946E2D] block">
                                                        {formatRupiah(item.menu.price)}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={item.item_notes}
                                                        onChange={(e) => handleUpdateItemNotes(index, e.target.value)}
                                                        placeholder="+ Catatan (misal: pedas sedang, kuah pisah)..."
                                                        className="mt-1 w-full px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-200 text-[10px] text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#B99A65]"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQuantity(index, -1)}
                                                        className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQuantity(index, 1)}
                                                        className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary & Checkout */}
                            <div className="space-y-3 pt-2 border-t border-stone-200">
                                <div className="space-y-1.5 text-xs text-stone-600">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatRupiah(cartSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pajak Resto (11%)</span>
                                        <span>{formatRupiah(cartTax)}</span>
                                    </div>
                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-semibold">
                                            <span>Diskon Kupon</span>
                                            <span>-{formatRupiah(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-stone-300 flex justify-between font-bold text-sm text-[#211D1B]">
                                        <span>Total</span>
                                        <span className="text-base text-[#946E2D]">
                                            {formatRupiah(Math.max(0, cartTotal - couponDiscount))}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Selector (Reservation Parity for Members) */}
                                {auth?.user ? (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-stone-700">Metode Bayar:</span>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('cart')}
                                                className="text-[10px] text-[#946E2D] font-bold hover:underline cursor-pointer"
                                            >
                                                Pilih di Keranjang &gt;
                                            </button>
                                        </div>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                                            className="w-full py-2 px-3 rounded-xl border border-[#B99A65]/40 bg-[#FAF7F2] text-xs font-bold text-[#32151F] focus:outline-none focus:ring-1 focus:ring-[#B99A65] cursor-pointer"
                                        >
                                            <optgroup label="Tunai">
                                                <option value="cash">Tunai di Kasir (Cash)</option>
                                            </optgroup>
                                            <optgroup label="e-Wallet & QRIS">
                                                <option value="qris">QRIS Instan (Semua e-Wallet & Bank)</option>
                                                <option value="gopay">GoPay (GoPay App & Gojek)</option>
                                                <option value="shopeepay">ShopeePay (Shopee App)</option>
                                                <option value="dana">DANA (Dompet Digital)</option>
                                                <option value="ovo">OVO Cash</option>
                                            </optgroup>
                                            <optgroup label="Virtual Account Bank">
                                                <option value="bca_va">BCA Virtual Account</option>
                                                <option value="mandiri_va">Mandiri Virtual Account</option>
                                                <option value="bni_va">BNI Virtual Account</option>
                                                <option value="bri_va">BRI Virtual Account</option>
                                                <option value="permata_va">Permata & Bank Lainnya</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold text-center ${
                                                paymentMethod === 'cash'
                                                    ? 'bg-[#32151F] text-[#D4B886] border-[#32151F]'
                                                    : 'bg-white text-stone-600 border-stone-200'
                                            }`}
                                        >
                                            Kasir / Tunai
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('qris')}
                                            className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold text-center ${
                                                paymentMethod === 'qris'
                                                    ? 'bg-[#32151F] text-[#D4B886] border-[#32151F]'
                                                    : 'bg-white text-stone-600 border-stone-200'
                                            }`}
                                        >
                                            Midtrans QRIS {!midtransIsConfigured && '(Belum Aktif)'}
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={cart.length === 0 || isCheckingOut}
                                    onClick={handleCheckout}
                                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#987B49] text-[#211D1B] font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <span>Checkout ({formatRupiah(Math.max(0, cartTotal - couponDiscount))})</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* ========================================================
                BOTTOM FLOATING CART PILL (HANYA SAAT CONFIRMED & ADA ITEM)
            ======================================================== */}
            {serviceMode === 'confirmed' && cartCount > 0 && activeTab !== 'cart' && (
                <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
                    <div className="max-w-md mx-auto pointer-events-auto">
                        <button
                            onClick={() => setActiveTab('cart')}
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
                MOBILE BOTTOM NAVIGATION BAR (DOCK FOOTER ALA MOCKUP)
                (HANYA TAMPIL DI MOBILE SAAT serviceMode === 'confirmed')
            ======================================================== */}
            {serviceMode === 'confirmed' && (
                <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#211D1B]/95 backdrop-blur-md border-t border-[#32151F] text-[#F4EFE6] px-3 py-1.5 shadow-2xl safe-area-bottom">
                    <div className="grid grid-cols-5 items-center text-center relative max-w-lg mx-auto">
                        {/* 1. Beranda (Home) */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('menu');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`flex flex-col items-center py-1 transition-all ${
                                activeTab === 'menu' ? 'text-[#D4B886] font-bold' : 'text-[#F4EFE6]/60 hover:text-white'
                            }`}
                        >
                            <Home className="w-5 h-5" />
                            <span className="text-[10px] mt-1 tracking-tight">Beranda</span>
                        </button>

                        {/* 2. Menu (Katalog) */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('menu');
                                const el = document.getElementById('katalog-menu');
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`flex flex-col items-center py-1 transition-all ${
                                activeTab === 'menu' ? 'text-[#D4B886] font-bold' : 'text-[#F4EFE6]/60 hover:text-white'
                            }`}
                        >
                            <UtensilsCrossed className="w-5 h-5" />
                            <span className="text-[10px] mt-1 tracking-tight">Menu</span>
                        </button>

                        {/* 3. Order (Center Elevated Circular Action Button) */}
                        <div className="flex justify-center items-center">
                            <button
                                type="button"
                                onClick={() => setActiveTab('cart')}
                                className="-translate-y-4 w-13 h-13 rounded-full bg-gradient-to-tr from-[#B99A65] via-[#D4B886] to-[#987B49] text-[#211D1B] shadow-2xl flex items-center justify-center border-4 border-[#211D1B] relative active:scale-90 transition-transform group"
                                title="Keranjang & Checkout"
                            >
                                <ShoppingBag className="w-6 h-6 stroke-[2.3]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow-md animate-pulse">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* 4. Pesanan Aktif (Live Tracking) */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('active_order')}
                            className={`flex flex-col items-center py-1 transition-all relative ${
                                activeTab === 'active_order' ? 'text-[#D4B886] font-bold' : 'text-[#F4EFE6]/60 hover:text-white'
                            }`}
                        >
                            <Clock className="w-5 h-5" />
                            <span className="text-[10px] mt-1 tracking-tight">Pesanan</span>
                            {activeOrders.length > 0 && (
                                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                        </button>

                        {/* 5. Reservasi Meja (Dedicated Page - NO POPUP) */}
                        <button
                            type="button"
                            onClick={() => router.visit('/reservation')}
                            className="flex flex-col items-center py-1 transition-all text-[#F4EFE6]/60 hover:text-[#D4B886]"
                        >
                            <CalendarDays className="w-5 h-5" />
                            <span className="text-[10px] mt-1 tracking-tight">Reservasi</span>
                        </button>
                    </div>
                </nav>
            )}

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

                        {/* Special Notes / Request Khusus (Gojek / Grab Style) */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#B99A65]">
                                    Catatan Menu (Opsional):
                                </label>
                                <span className="text-[10px] text-stone-400">Instruksi Dapur</span>
                            </div>
                            <textarea
                                rows={2}
                                value={customizeNotes}
                                onChange={(e) => setCustomizeNotes(e.target.value)}
                                placeholder="Tulis catatan opsional: pedas sedang, kuah dipisah, ekstra sambal..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                            />
                            {/* Gojek-style Quick Suggestion Chips */}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {[
                                    'Pedas Sedang',
                                    'Tidak Pedas',
                                    'Kuah Dipisah',
                                    'Ekstra Sambal',
                                    'Kurangi Minyak',
                                    'Bungkus Sebagian'
                                ].map((chip) => (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => {
                                            setCustomizeNotes(prev => prev ? `${prev}, ${chip}` : chip);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-[#161312] hover:bg-[#32151F] border border-[#B99A65]/40 text-[10px] font-medium text-[#D4B886] transition-all cursor-pointer active:scale-95"
                                    >
                                        + {chip}
                                    </button>
                                ))}
                            </div>
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
                MODAL 2: RATING & REVIEW FOR COMPLETED ORDERS
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
                            Ulasan Anda untuk pesanan <strong className="text-[#D4B886]">#{ratingOrder.order_code}</strong> sangat berharga bagi kami.
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
                                placeholder="Bagikan tanggapan Anda seputar kelezatan hidangan atau keramahan staf..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[#32151F]/70 border border-[#B99A65]/30 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/30 focus:outline-none focus:border-[#D4B886]"
                            />

                            <button
                                type="submit"
                                disabled={isSubmittingRating}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:from-[#a88954] hover:to-[#c3a775] text-[#211D1B] font-extrabold text-xs uppercase tracking-widest hover:shadow-xl transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
                            >
                                {isSubmittingRating ? 'Mengirim Ulasan...' : `Kirim Rating (${selectedStars} Bintang)`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL: PENGAJUAN PENGEMBALIAN DANA (REFUND ORDER)
            ======================================================== */}
            {isRefundModalOpen && selectedOrderForRefund && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-lg bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 shadow-2xl text-[#F4EFE6] space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300">
                                    <RotateCcw className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-lg font-bold text-[#F4EFE6]">
                                        Ajukan Pengembalian Dana (Refund)
                                    </h3>
                                    <span className="font-mono text-xs text-[#D4B886]">
                                        Pesanan #{selectedOrderForRefund.order_code}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRefundModalOpen(false)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order info summary */}
                        <div className="p-3.5 rounded-2xl bg-[#141110] border border-[#2D2622] flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                                    Total Nilai Pesanan
                                </span>
                                <span className="font-heading text-xl font-bold text-[#D4B886]">
                                    {formatRupiah(selectedOrderForRefund.total)}
                                </span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Status: Menunggu Dapur
                            </span>
                        </div>

                        {/* Ketentuan refund notice */}
                        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Ketentuan Pembatalan:</strong> Pembatalan dan refund 100% hanya dapat diajukan sebelum pesanan masuk ke tahap persiapan memasak oleh dapur NUSARA. Dana akan dikembalikan melalui transfer ke rekening/e-wallet Anda.
                            </span>
                        </div>

                        {refundError && (
                            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
                                {refundError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitOrderRefund} className="space-y-3.5">
                            <div>
                                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                                    Pilih Bank / Dompet Digital (e-Wallet)
                                </label>
                                <select
                                    value={refundBank}
                                    onChange={(e) => setRefundBank(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141110] border border-[#2D2622] text-xs text-white focus:outline-none focus:border-[#B99A65]"
                                >
                                    <optgroup label="Virtual Account / Bank Transfer">
                                        <option value="BCA">BCA (Bank Central Asia)</option>
                                        <option value="Mandiri">Bank Mandiri</option>
                                        <option value="BNI">BNI (Bank Negara Indonesia)</option>
                                        <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                                        <option value="Permata">Bank Permata</option>
                                        <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                                    </optgroup>
                                    <optgroup label="Dompet Digital (e-Wallet)">
                                        <option value="GoPay">GoPay</option>
                                        <option value="OVO">OVO</option>
                                        <option value="DANA">DANA</option>
                                        <option value="ShopeePay">ShopeePay</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                                    Nomor Rekening / Nomor Ponsel Terdaftar
                                </label>
                                <input
                                    type="text"
                                    value={refundAccountNumber}
                                    onChange={(e) => setRefundAccountNumber(e.target.value)}
                                    placeholder="Contoh: 1234567890 atau 08123456789"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141110] border border-[#2D2622] text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#B99A65]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                                    Nama Pemilik Rekening / Akun (Sesuai KTP)
                                </label>
                                <input
                                    type="text"
                                    value={refundAccountHolder}
                                    onChange={(e) => setRefundAccountHolder(e.target.value)}
                                    placeholder="Nama lengkap pemilik rekening"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141110] border border-[#2D2622] text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#B99A65]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                                    Alasan Pembatalan
                                </label>
                                <textarea
                                    rows={2}
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Contoh: Salah pilih menu / Mendadak harus meninggalkan restoran..."
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141110] border border-[#2D2622] text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#B99A65] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRefundModalOpen(false)}
                                    className="py-2.5 px-4 rounded-xl border border-stone-700 bg-stone-900/60 hover:bg-stone-800 text-stone-300 text-xs font-semibold transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingRefund}
                                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {isSubmittingRefund ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Mengirim...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Kirim Pengajuan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 3: CONFIRMATION LOGOUT (CEGAH KEPENCET KELUAR)
            ======================================================== */}
            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                cartCount={cartCount}
                userName={auth?.user?.name}
            />

            {/* ========================================================
                MODAL 4: CONFIRMATION EXIT TO HOME (BERANDA)
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

            {/* Luxury Alert Modal */}
            <LuxuryAlertModal alert={luxuryAlert} onClose={() => setLuxuryAlert(null)} />
        </div>
    );
}
