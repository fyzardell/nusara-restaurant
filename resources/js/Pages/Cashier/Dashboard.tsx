import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import { 
    Clock, 
    Search, 
    RefreshCw, 
    ShoppingBag, 
    UtensilsCrossed, 
    Printer, 
    DollarSign, 
    AlertCircle, 
    Eye, 
    ChevronRight, 
    X, 
    Phone, 
    User as UserIcon, 
    Calendar, 
    Check, 
    ArrowRight, 
    Flame, 
    Sparkles, 
    Filter, 
    Store, 
    LogOut, 
    CheckCheck, 
    Wallet, 
    Receipt,
    CheckCircle2,
    SlidersHorizontal,
    Bell,
    TrendingUp
} from 'lucide-react';
import { Order, OrderStatus, RestaurantSettings, Table } from '../../types';

interface OrderItemWithMenu {
    id: number;
    order_id: number;
    menu_id: number;
    menu_name_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
    subtotal: number;
    item_notes: string | null;
}

interface OrderWithDetails extends Order {
    customer_name?: string;
    customer_phone?: string;
    table_number?: string;
    session_code?: string;
    items?: OrderItemWithMenu[];
    payment?: {
        id: number;
        payment_method: string;
        payment_status: string;
        amount: number;
        paid_at: string | null;
    } | null;
}

interface TableWithSession {
    id: number;
    table_number: string;
    capacity: number;
    location: string;
    status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Inactive';
    is_active: boolean;
    active_session?: {
        id: number;
        session_code: string;
        status: string;
    } | null;
}

interface ReservationItem {
    id: number;
    reservation_code: string;
    customer_name?: string;
    customer_phone?: string;
    reservation_datetime: string;
    guest_count: number;
    duration_minutes: number;
    status: 'Pending' | 'Confirmed' | 'Seated' | 'Completed' | 'Cancelled';
    special_request: string | null;
    experience_name?: string;
}

interface Props {
    cashierUser: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    metrics: {
        pendingOrders: number;
        preparingOrders: number;
        readyOrders: number;
        completedToday: number;
        todayRevenue: number;
    };
    orders: OrderWithDetails[];
    tables: TableWithSession[];
    reservations: ReservationItem[];
    settings?: RestaurantSettings;
    filters: {
        status?: string;
        type?: string;
        search?: string;
    };
}

export default function CashierDashboard({
    cashierUser,
    metrics,
    orders = [],
    tables = [],
    reservations = [],
    settings,
    filters = {}
}: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    // View Tabs: 'orders' | 'tables' | 'reservations'
    const [mainTab, setMainTab] = useState<'orders' | 'tables' | 'reservations'>('orders');

    // Order status filter: 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'all');
    
    // Order type filter: 'all' | 'dine_in' | 'takeaway'
    const [selectedType, setSelectedType] = useState<string>(filters.type || 'all');

    // Search query
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');

    // State modal cetak struk
    const [receiptOrder, setReceiptOrder] = useState<OrderWithDetails | null>(null);

    // State modal bayar tunai
    const [cashPaymentOrder, setCashPaymentOrder] = useState<OrderWithDetails | null>(null);
    const [cashReceived, setCashReceived] = useState<number>(0);

    // Quick filter orders client-side for ultra-fast instant UI responsiveness
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Filter status
            if (selectedStatus === 'pending') {
                if (!['Pending', 'Awaiting Payment', 'Paid'].includes(order.order_status)) return false;
            } else if (selectedStatus === 'preparing') {
                if (order.order_status !== 'Preparing') return false;
            } else if (selectedStatus === 'ready') {
                if (order.order_status !== 'Ready') return false;
            } else if (selectedStatus === 'completed') {
                if (!['Served', 'Picked Up', 'Completed'].includes(order.order_status)) return false;
            } else if (selectedStatus === 'cancelled') {
                if (order.order_status !== 'Cancelled') return false;
            }

            // Filter type
            if (selectedType !== 'all' && order.order_type !== selectedType) {
                return false;
            }

            // Filter search
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchCode = order.order_code.toLowerCase().includes(q);
                const matchName = (order.customer_name || '').toLowerCase().includes(q);
                const matchTable = (order.table_number || '').toLowerCase().includes(q);
                if (!matchCode && !matchName && !matchTable) return false;
            }

            return true;
        });
    }, [orders, selectedStatus, selectedType, searchQuery]);

    // Handle Update Status
    const handleUpdateStatus = (orderId: number, nextStatus: OrderStatus, customNotes?: string) => {
        router.post(`/cashier/order/${orderId}/status`, {
            order_status: nextStatus,
            notes: customNotes
        }, {
            preserveScroll: true
        });
    };

    // Handle Open Cash Payment Modal
    const handleOpenCashModal = (order: OrderWithDetails) => {
        setCashPaymentOrder(order);
        setCashReceived(Math.ceil(order.total / 10000) * 10000); // Default ke pecahan terdekat
    };

    // Handle Confirm Cash Payment Submit
    const handleConfirmCashPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cashPaymentOrder) return;

        router.post(`/cashier/order/${cashPaymentOrder.id}/payment`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setCashPaymentOrder(null);
            }
        });
    };

    // Handle Update Table Status
    const handleTableStatusChange = (tableId: number, newStatus: string) => {
        router.post(`/cashier/table/${tableId}/status`, {
            status: newStatus
        }, {
            preserveScroll: true
        });
    };

    // Handle Update Reservation Status
    const handleReservationStatusChange = (resId: number, newStatus: string) => {
        router.post(`/cashier/reservation/${resId}/status`, {
            status: newStatus
        }, {
            preserveScroll: true
        });
    };

    // Format currency IDR
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    // Get Status Badge Color
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
            case 'Awaiting Payment':
                return {
                    label: 'Menunggu ACC Kasir',
                    bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    dot: 'bg-amber-400 animate-ping'
                };
            case 'Paid':
            case 'Confirmed':
                return {
                    label: 'Terkonfirmasi Kasir',
                    bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                    dot: 'bg-sky-400'
                };
            case 'Preparing':
                return {
                    label: 'Sedang Dimasak Dapur',
                    bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                    dot: 'bg-orange-400 animate-pulse'
                };
            case 'Ready':
                return {
                    label: 'Siap Disajikan / Diambil',
                    bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    dot: 'bg-emerald-400 animate-bounce'
                };
            case 'Served':
                return {
                    label: 'Telah Terhidang di Meja',
                    bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
                    dot: 'bg-teal-400'
                };
            case 'Picked Up':
                return {
                    label: 'Pesanan Telah Diambil',
                    bg: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40',
                    dot: 'bg-emerald-400'
                };
            case 'Cancelled':
                return {
                    label: 'Dibatalkan',
                    bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                    dot: 'bg-rose-400'
                };
            default:
                return {
                    label: status,
                    bg: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
                    dot: 'bg-stone-400'
                };
        }
    };

    return (
        <div className="min-h-screen bg-[#141211] text-[#F4EFE6] font-sans selection:bg-[#B99A65] selection:text-[#211D1B]">
            <Head title="Dashboard Kasir & POS Antrean Terpusat — NUSARA" />

            {/* Flash notification banner (3 detik) */}
            <FlashToast flash={flash} durationMs={3000} />

            {/* ========================================================
                1. TOPBAR HEADER OPERASIONAL KASIR
            ======================================================== */}
            <header className="sticky top-0 z-40 bg-[#1C1716]/95 backdrop-blur-md border-b border-[#B99A65]/20 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xl">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Brand & Badge Kasir */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#32151F] to-[#211D1B] border border-[#B99A65]/40 flex items-center justify-center shadow-md group-hover:border-[#D4B886] transition-all">
                                <span className="font-heading text-lg font-bold text-[#D4B886] tracking-widest">N</span>
                            </div>
                            <div>
                                <h1 className="font-heading text-base font-bold tracking-wider text-[#D4B886] uppercase leading-tight">
                                    NUSARA
                                </h1>
                                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400">
                                    Nusantara & Rasa
                                </p>
                            </div>
                        </Link>

                        <div className="h-6 w-px bg-stone-700/60 hidden sm:block mx-1" />

                        {/* Kasir Operational Badge */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#32151F] border border-[#B99A65]/50 shadow-inner">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4B886]">
                                Pos Kasir Operasional
                            </span>
                        </div>
                    </div>

                    {/* Quick Search & Control Buttons */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Live Sync Status */}
                        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-stone-800 text-xs text-stone-400">
                            <Clock className="w-3.5 h-3.5 text-[#B99A65]" />
                            <span>Shift Aktif: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                        </div>

                        {/* Search Bar Input */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari Kode / Meja / Tamu..."
                                className="w-full pl-9 pr-3 py-1.5 bg-black/50 border border-[#B99A65]/30 rounded-xl text-xs text-[#F4EFE6] placeholder-stone-500 focus:outline-none focus:border-[#D4B886] transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={() => router.reload()}
                            className="p-2 rounded-xl bg-black/40 hover:bg-black/70 border border-[#B99A65]/30 text-[#D4B886] transition-all hover:scale-105 active:scale-95"
                            title="Segarkan Data Antrean"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        {/* User Profile Kasir & Logout */}
                        <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-[#F4EFE6] leading-tight">
                                    {cashierUser.name}
                                </p>
                                <p className="text-[10px] text-[#B99A65] font-mono capitalize">
                                    {cashierUser.role}
                                </p>
                            </div>
                            <button
                                onClick={() => router.post('/logout')}
                                className="px-3 py-1.5 rounded-xl bg-[#32151F]/80 hover:bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
                                title="Keluar dari Akun Kasir"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Keluar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ========================================================
                2. OPERATIONAL SUMMARY METRICS (KARTU STATISTIK KASIR)
            ======================================================== */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {/* 1. Menunggu ACC Kasir */}
                    <div 
                        onClick={() => { setMainTab('orders'); setSelectedStatus('pending'); }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            selectedStatus === 'pending' && mainTab === 'orders'
                                ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                                : 'bg-[#1C1716] border-[#B99A65]/20 hover:border-amber-500/40 hover:bg-amber-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-400">Perlu ACC Kasir</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                                <Clock className="w-4 h-4 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold font-mono text-amber-300 mt-2">
                            {metrics.pendingOrders}
                        </p>
                        <p className="text-[10px] text-amber-400/80 mt-0.5">
                            Menunggu verifikasi kasir
                        </p>
                    </div>

                    {/* 2. Sedang Dimasak Dapur */}
                    <div 
                        onClick={() => { setMainTab('orders'); setSelectedStatus('preparing'); }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            selectedStatus === 'preparing' && mainTab === 'orders'
                                ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/30'
                                : 'bg-[#1C1716] border-[#B99A65]/20 hover:border-orange-500/40 hover:bg-orange-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-400">Sedang Dimasak</span>
                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                                <Flame className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold font-mono text-orange-300 mt-2">
                            {metrics.preparingOrders}
                        </p>
                        <p className="text-[10px] text-orange-400/80 mt-0.5">
                            Proses chef & dapur
                        </p>
                    </div>

                    {/* 3. Siap Saji / Siap Diambil */}
                    <div 
                        onClick={() => { setMainTab('orders'); setSelectedStatus('ready'); }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            selectedStatus === 'ready' && mainTab === 'orders'
                                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                                : 'bg-[#1C1716] border-[#B99A65]/20 hover:border-emerald-500/40 hover:bg-emerald-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-400">Siap Saji / Ambil</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                <Sparkles className="w-4 h-4 animate-bounce" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">
                            {metrics.readyOrders}
                        </p>
                        <p className="text-[10px] text-emerald-400/80 mt-0.5">
                            Siap diantar / diserahkan
                        </p>
                    </div>

                    {/* 4. Selesai Terhidang Hari Ini */}
                    <div 
                        onClick={() => { setMainTab('orders'); setSelectedStatus('completed'); }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            selectedStatus === 'completed' && mainTab === 'orders'
                                ? 'bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/30'
                                : 'bg-[#1C1716] border-[#B99A65]/20 hover:border-teal-500/40 hover:bg-teal-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-400">Selesai Hari Ini</span>
                            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                                <CheckCheck className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold font-mono text-teal-300 mt-2">
                            {metrics.completedToday}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                            Served / Picked Up
                        </p>
                    </div>

                    {/* 5. Total Pendapatan Terverifikasi Hari Ini */}
                    <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-[#32151F] to-[#211D1B] border border-[#B99A65]/40 shadow-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#D4B886]">Omset Hari Ini</span>
                            <div className="w-8 h-8 rounded-lg bg-[#B99A65]/20 border border-[#B99A65]/40 flex items-center justify-center text-[#D4B886]">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-xl font-bold font-mono text-[#F4EFE6] mt-2">
                            {formatIDR(metrics.todayRevenue)}
                        </p>
                        <p className="text-[10px] text-stone-300 mt-0.5">
                            Total transaksi lunas
                        </p>
                    </div>
                </div>

                {/* ========================================================
                    3. NAVIGATION TABS: ORDERS / TABLES / RESERVATIONS
                ======================================================== */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                    {/* Main Nav Segmented Control */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1C1716] border border-[#B99A65]/30">
                        <button
                            onClick={() => setMainTab('orders')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                mainTab === 'orders'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md'
                                    : 'text-stone-400 hover:text-white'
                            }`}
                        >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>Antrean Pesanan ({orders.length})</span>
                        </button>

                        <button
                            onClick={() => setMainTab('tables')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                mainTab === 'tables'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md'
                                    : 'text-stone-400 hover:text-white'
                            }`}
                        >
                            <Store className="w-3.5 h-3.5" />
                            <span>Denah Meja ({tables.length})</span>
                        </button>

                        <button
                            onClick={() => setMainTab('reservations')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                mainTab === 'reservations'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] shadow-md'
                                    : 'text-stone-400 hover:text-white'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Reservasi Tamu ({reservations.length})</span>
                        </button>
                    </div>

                    {/* Secondary Filter Buttons (When Tab is Orders) */}
                    {mainTab === 'orders' && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            {/* Type filter pills */}
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-stone-800">
                                <button
                                    onClick={() => setSelectedType('all')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                        selectedType === 'all' ? 'bg-[#32151F] text-[#D4B886]' : 'text-stone-400 hover:text-white'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => setSelectedType('dine_in')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                        selectedType === 'dine_in' ? 'bg-[#32151F] text-[#D4B886]' : 'text-stone-400 hover:text-white'
                                    }`}
                                >
                                    <UtensilsCrossed className="w-3 h-3" />
                                    <span>Dine-in</span>
                                </button>
                                <button
                                    onClick={() => setSelectedType('takeaway')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                        selectedType === 'takeaway' ? 'bg-[#32151F] text-[#D4B886]' : 'text-stone-400 hover:text-white'
                                    }`}
                                >
                                    <ShoppingBag className="w-3 h-3" />
                                    <span>Takeaway</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================================================
                    4. CONTENT TAB 1: CENTRALIZED ORDER QUEUE
                ======================================================== */}
                {mainTab === 'orders' && (
                    <div className="space-y-4">
                        {/* Sub Status Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                            {[
                                { id: 'all', label: 'Semua Status', count: orders.length },
                                { id: 'pending', label: '⏳ Perlu ACC Kasir', count: metrics.pendingOrders },
                                { id: 'preparing', label: '🔥 Sedang Dimasak', count: metrics.preparingOrders },
                                { id: 'ready', label: '✨ Siap Saji / Ambil', count: metrics.readyOrders },
                                { id: 'completed', label: '✓ Selesai', count: metrics.completedToday },
                                { id: 'cancelled', label: '✕ Dibatalkan', count: orders.filter(o => o.order_status === 'Cancelled').length }
                            ].map(st => (
                                <button
                                    key={st.id}
                                    onClick={() => setSelectedStatus(st.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                                        selectedStatus === st.id
                                            ? 'bg-[#B99A65]/20 border-[#D4B886] text-[#D4B886] shadow-sm'
                                            : 'bg-[#1C1716] border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                                    }`}
                                >
                                    <span>{st.label}</span>
                                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                                        {st.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* List of Orders */}
                        {filteredOrders.length === 0 ? (
                            <div className="py-16 text-center rounded-2xl bg-[#1C1716] border border-[#B99A65]/20 space-y-3">
                                <div className="w-12 h-12 mx-auto rounded-full bg-stone-800/80 flex items-center justify-center text-stone-500">
                                    <UtensilsCrossed className="w-6 h-6" />
                                </div>
                                <h3 className="font-heading text-lg font-bold text-[#D4B886]">
                                    Tidak Ada Pesanan Ditemukan
                                </h3>
                                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                                    Tidak ada antrean pesanan yang cocok dengan kriteria filter atau kata kunci pencarian Anda saat ini.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredOrders.map(order => {
                                    const badge = getStatusBadge(order.order_status);
                                    const isPaid = order.payment?.payment_status === 'Success' || ['Paid', 'Confirmed', 'Preparing', 'Ready', 'Served', 'Picked Up'].includes(order.order_status);

                                    return (
                                        <div 
                                            key={order.id}
                                            className="rounded-2xl bg-[#1C1716] border border-[#B99A65]/25 hover:border-[#D4B886]/60 transition-all shadow-md flex flex-col justify-between overflow-hidden"
                                        >
                                            {/* Card Top: Order Code, Type & Status */}
                                            <div className="p-4 border-b border-stone-800/80 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-bold text-[#D4B886] tracking-wider">
                                                            {order.order_code}
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                                                            order.order_type === 'dine_in'
                                                                ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40'
                                                                : 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                                                        }`}>
                                                            {order.order_type === 'dine_in' ? (
                                                                <>
                                                                    <UtensilsCrossed className="w-2.5 h-2.5" />
                                                                    <span>{order.table_number || 'Meja'}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShoppingBag className="w-2.5 h-2.5" />
                                                                    <span>Takeaway</span>
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Waktu Pesan */}
                                                    <span className="text-[11px] text-stone-400 font-mono">
                                                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                    </span>
                                                </div>

                                                {/* Customer Name & Status Badge */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-stone-300 truncate">
                                                        <UserIcon className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                                                        <span className="font-semibold truncate">{order.customer_name || 'Tamu Restoran'}</span>
                                                    </div>

                                                    <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider flex items-center gap-1.5 ${badge.bg}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                        <span>{badge.label}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Middle: Ordered Items List */}
                                            <div className="p-4 space-y-2 flex-1 text-xs">
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                                                    {(order.items || []).map((item, idx) => (
                                                        <div key={idx} className="flex items-start justify-between gap-2 py-1 border-b border-stone-800/40 last:border-none">
                                                            <div className="space-y-0.5 flex-1">
                                                                <p className="font-medium text-[#F4EFE6] leading-tight">
                                                                    <span className="font-bold text-[#D4B886] font-mono mr-1">{item.quantity}x</span>
                                                                    <span>{item.menu_name_snapshot}</span>
                                                                </p>
                                                                {item.item_notes && (
                                                                    <p className="text-[10px] text-amber-300/90 italic bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                                        "{item.item_notes}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className="font-mono text-stone-400 shrink-0 text-[11px]">
                                                                {formatIDR(item.subtotal)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Order General Notes if any */}
                                                {order.customer_notes && (
                                                    <div className="p-2 rounded-lg bg-black/40 border border-stone-800 text-[11px] text-stone-300">
                                                        <span className="font-bold text-[#D4B886]">Catatan: </span>
                                                        <span>{order.customer_notes}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Bottom: Financial & Action Buttons */}
                                            <div className="p-4 bg-black/40 border-t border-stone-800/80 space-y-3">
                                                {/* Payment Status & Total */}
                                                <div className="flex items-center justify-between text-xs">
                                                    <div>
                                                        <span className="text-stone-400 block text-[10px]">Total Pembayaran:</span>
                                                        <span className="font-mono text-base font-bold text-[#D4B886]">
                                                            {formatIDR(order.total)}
                                                        </span>
                                                    </div>

                                                    <div className="text-right">
                                                        <span className="text-stone-400 block text-[10px]">Status Bayar:</span>
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            isPaid 
                                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                        }`}>
                                                            {isPaid ? 'LUNAS' : 'BELUM DIBAYAR'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Cashier Workflow Action Buttons */}
                                                <div className="space-y-1.5 pt-1">
                                                    {/* 1. Status: PENDING / Awaiting Payment */}
                                                    {['Pending', 'Awaiting Payment', 'Paid'].includes(order.order_status) && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {!isPaid ? (
                                                                <button
                                                                    onClick={() => handleOpenCashModal(order)}
                                                                    className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                                                                >
                                                                    <Wallet className="w-3.5 h-3.5" />
                                                                    <span>Bayar Tunai</span>
                                                                </button>
                                                            ) : null}

                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'Preparing', 'Dikonfirmasi kasir, diteruskan ke dapur')}
                                                                className={`${!isPaid ? 'col-span-1' : 'col-span-2'} py-2 px-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:brightness-110 text-[#211D1B] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95`}
                                                            >
                                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                                <span>ACC & Masak Dapur</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* 2. Status: PREPARING (Sedang Dimasak) */}
                                                    {order.order_status === 'Preparing' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id, 'Ready', 'Dapur selesai memasak, pesanan siap')}
                                                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span>Tandai Siap Saji / Ambil (Ready)</span>
                                                        </button>
                                                    )}

                                                    {/* 3. Status: READY (Siap Disajikan atau Diambil) */}
                                                    {order.order_status === 'Ready' && (
                                                        <div>
                                                            {order.order_type === 'takeaway' ? (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order.id, 'Picked Up', 'Pesanan takeaway telah diserahkan ke pelanggan')}
                                                                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                                                                >
                                                                    <ShoppingBag className="w-3.5 h-3.5" />
                                                                    <span>Konfirmasi Diambil (Picked Up)</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order.id, 'Served', 'Pesanan dine-in selesai diantar ke meja')}
                                                                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                                                                >
                                                                    <UtensilsCrossed className="w-3.5 h-3.5" />
                                                                    <span>Konfirmasi Terhidang (Served)</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Secondary Buttons: Cetak Struk & Pembatalan */}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button
                                                            onClick={() => setReceiptOrder(order)}
                                                            className="flex-1 py-1.5 rounded-lg bg-black/50 hover:bg-black/80 border border-stone-800 hover:border-[#B99A65]/40 text-stone-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                                                        >
                                                            <Printer className="w-3 h-3 text-[#D4B886]" />
                                                            <span>Cetak Struk</span>
                                                        </button>

                                                        {['Pending', 'Awaiting Payment'].includes(order.order_status) && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Yakin ingin membatalkan pesanan #${order.order_code}?`)) {
                                                                        handleUpdateStatus(order.id, 'Cancelled', 'Dibatalkan oleh kasir');
                                                                    }
                                                                }}
                                                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-400 text-[11px] font-medium transition-all"
                                                                title="Batalkan Pesanan"
                                                            >
                                                                Batalkan
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================
                    5. CONTENT TAB 2: RESTAURANT TABLE STATUS BOARD
                ======================================================== */}
                {mainTab === 'tables' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-heading text-lg font-bold text-[#D4B886]">
                                    Manajemen & Koordinasi Meja Restoran
                                </h3>
                                <p className="text-xs text-stone-400">
                                    Pantau kapasitas, status terisi, dan koordinasikan meja dengan staf waiter.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {tables.map(tbl => {
                                const isOccupied = tbl.status === 'Occupied';
                                const isCleaning = tbl.status === 'Cleaning';
                                const isReserved = tbl.status === 'Reserved';

                                return (
                                    <div 
                                        key={tbl.id}
                                        className={`p-4 rounded-2xl border transition-all ${
                                            isOccupied
                                                ? 'bg-[#32151F]/40 border-rose-500/40 shadow-rose-950/30'
                                                : isCleaning
                                                ? 'bg-amber-950/30 border-amber-500/40'
                                                : isReserved
                                                ? 'bg-sky-950/30 border-sky-500/40'
                                                : 'bg-[#1C1716] border-[#B99A65]/20 hover:border-[#D4B886]/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-heading text-base font-bold text-[#D4B886]">
                                                {tbl.table_number}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                isOccupied
                                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                    : isCleaning
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                    : isReserved
                                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}>
                                                {tbl.status}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-stone-400 mb-4">
                                            <p>Kapasitas: <span className="text-white font-bold">{tbl.capacity} Orang</span></p>
                                            <p>Lokasi: <span className="text-white font-medium">{tbl.location}</span></p>
                                            {tbl.active_session && (
                                                <p className="text-[10px] text-[#B99A65] font-mono mt-1">
                                                    Sesi: {tbl.active_session.session_code}
                                                </p>
                                            )}
                                        </div>

                                        {/* Status Switcher Action */}
                                        <div className="pt-2 border-t border-stone-800/80">
                                            <select
                                                value={tbl.status}
                                                onChange={(e) => handleTableStatusChange(tbl.id, e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-xl bg-black/60 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-[#D4B886]"
                                            >
                                                <option value="Available">Available (Kosong)</option>
                                                <option value="Occupied">Occupied (Terisi)</option>
                                                <option value="Reserved">Reserved (Dipesan)</option>
                                                <option value="Cleaning">Cleaning (Dibersihkan)</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========================================================
                    6. CONTENT TAB 3: RESERVATIONS BOARD
                ======================================================== */}
                {mainTab === 'reservations' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-heading text-lg font-bold text-[#D4B886]">
                                    Kelola Reservasi Tamu Restoran
                                </h3>
                                <p className="text-xs text-stone-400">
                                    Konfirmasi kedatangan dan alokasikan meja untuk tamu reservasi hari ini.
                                </p>
                            </div>
                        </div>

                        {reservations.length === 0 ? (
                            <div className="py-16 text-center rounded-2xl bg-[#1C1716] border border-[#B99A65]/20">
                                <Calendar className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-[#D4B886]">Belum Ada Reservasi Aktif</p>
                                <p className="text-xs text-stone-400">Reservasi tamu mendatang akan muncul di sini.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reservations.map(res => (
                                    <div key={res.id} className="p-4 rounded-2xl bg-[#1C1716] border border-[#B99A65]/25 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs font-bold text-[#D4B886]">
                                                {res.reservation_code}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40 font-bold uppercase">
                                                {res.status}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs">
                                            <p className="font-bold text-[#F4EFE6] text-sm">{res.customer_name || 'Tamu Reservasi'}</p>
                                            <p className="text-stone-400 flex items-center gap-1.5">
                                                <Phone className="w-3 h-3 text-[#B99A65]" />
                                                <span>{res.customer_phone || '-'}</span>
                                            </p>
                                            <p className="text-stone-400 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-[#B99A65]" />
                                                <span>{new Date(res.reservation_datetime).toLocaleString('id-ID')}</span>
                                            </p>
                                            <p className="text-stone-400 flex items-center gap-1.5">
                                                <UserIcon className="w-3 h-3 text-[#B99A65]" />
                                                <span>{res.guest_count} Orang Guest</span>
                                            </p>
                                            {res.experience_name && (
                                                <p className="text-[11px] font-semibold text-[#D4B886] mt-1">
                                                    Paket: {res.experience_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
                                            {res.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleReservationStatusChange(res.id, 'Confirmed')}
                                                    className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs"
                                                >
                                                    Konfirmasi
                                                </button>
                                            )}
                                            {res.status === 'Confirmed' && (
                                                <button
                                                    onClick={() => handleReservationStatusChange(res.id, 'Seated')}
                                                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                                                >
                                                    Tamu Duduk (Seated)
                                                </button>
                                            )}
                                            {res.status === 'Seated' && (
                                                <button
                                                    onClick={() => handleReservationStatusChange(res.id, 'Completed')}
                                                    className="flex-1 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs"
                                                >
                                                    Selesai
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (confirm('Batalkan reservasi ini?')) {
                                                        handleReservationStatusChange(res.id, 'Cancelled');
                                                    }
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-rose-300 text-xs"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ========================================================
                7. MODAL CASH PAYMENT CONFIRMATION (BAYAR TUNAI DI KASIR)
            ======================================================== */}
            {cashPaymentOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md rounded-2xl bg-[#1C1716] border border-[#B99A65]/40 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-heading text-lg font-bold text-[#D4B886]">
                                    Penerimaan Pembayaran Tunai
                                </h3>
                            </div>
                            <button 
                                onClick={() => setCashPaymentOrder(null)}
                                className="text-stone-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-black/40 border border-stone-800 space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Kode Pesanan:</span>
                                    <span className="font-mono font-bold text-white">{cashPaymentOrder.order_code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-400">Tipe / Meja:</span>
                                    <span className="font-semibold text-[#D4B886]">
                                        {cashPaymentOrder.order_type === 'dine_in' ? cashPaymentOrder.table_number || 'Dine-in' : 'Takeaway'}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-stone-800/80">
                                    <span className="text-stone-300 font-bold">Total Tagihan:</span>
                                    <span className="font-mono text-base font-bold text-amber-300">
                                        {formatIDR(cashPaymentOrder.total)}
                                    </span>
                                </div>
                            </div>

                            {/* Input Uang Tunai Diterima */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-stone-300">
                                    Nominal Uang Tunai Diterima (Rp):
                                </label>
                                <input
                                    type="number"
                                    value={cashReceived || ''}
                                    onChange={(e) => setCashReceived(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-[#B99A65]/40 font-mono text-lg font-bold text-emerald-300 focus:outline-none focus:border-[#D4B886]"
                                    min={cashPaymentOrder.total}
                                />
                            </div>

                            {/* Hitungan Kembalian */}
                            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex justify-between items-center">
                                <span className="font-semibold text-emerald-300">Kembalian ke Pelanggan:</span>
                                <span className="font-mono text-base font-bold text-emerald-400">
                                    {formatIDR(Math.max(0, cashReceived - cashPaymentOrder.total))}
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCashPaymentOrder(null)}
                                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCashPayment}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all"
                            >
                                Selesai & Kirim Dapur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                8. MODAL CETAK STRUK RESMI KASIR NUSARA (RECEIPT MODAL)
            ======================================================== */}
            {receiptOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm rounded-2xl bg-white text-[#211D1B] shadow-2xl p-6 space-y-4 font-mono max-h-[90vh] overflow-y-auto">
                        {/* Struk Thermal View Header */}
                        <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
                            <h2 className="font-heading text-2xl font-bold tracking-wider text-[#32151F]">
                                NUSARA
                            </h2>
                            <p className="text-[11px] uppercase tracking-widest text-stone-600">
                                Restoran Nusantara & Rasa
                            </p>
                            <p className="text-[10px] text-stone-500 leading-tight">
                                {settings?.address || 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan'}
                            </p>
                            <p className="text-[10px] text-stone-500">
                                Telp: {settings?.phone || '(021) 7208889'}
                            </p>
                        </div>

                        {/* Order Metadata */}
                        <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-stone-300 text-stone-700">
                            <div className="flex justify-between">
                                <span>No. Struk:</span>
                                <span className="font-bold">{receiptOrder.order_code}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal:</span>
                                <span>{new Date(receiptOrder.created_at).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kasir:</span>
                                <span>{cashierUser.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tamu:</span>
                                <span>{receiptOrder.customer_name || 'Tamu Umum'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Layanan:</span>
                                <span className="font-bold text-[#32151F]">
                                    {receiptOrder.order_type === 'dine_in' ? (receiptOrder.table_number || 'Dine-in') : 'Takeaway'}
                                </span>
                            </div>
                        </div>

                        {/* Item Breakdown */}
                        <div className="space-y-2 text-[11px] pb-3 border-b border-dashed border-stone-300">
                            {(receiptOrder.items || []).map((it, idx) => (
                                <div key={idx} className="space-y-0.5">
                                    <div className="flex justify-between">
                                        <span className="font-bold">{it.menu_name_snapshot}</span>
                                        <span>{formatIDR(it.subtotal)}</span>
                                    </div>
                                    <div className="text-[10px] text-stone-500 flex justify-between">
                                        <span>{it.quantity} x {formatIDR(it.unit_price_snapshot)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="text-xs space-y-1 pb-3 border-b border-dashed border-stone-300">
                            <div className="flex justify-between text-stone-600">
                                <span>Subtotal:</span>
                                <span>{formatIDR(receiptOrder.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                                <span>PB1 Restoran (11%):</span>
                                <span>{formatIDR(receiptOrder.tax)}</span>
                            </div>
                            {receiptOrder.discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Diskon:</span>
                                    <span>-{formatIDR(receiptOrder.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-sm text-[#32151F] pt-1">
                                <span>TOTAL BAYAR:</span>
                                <span>{formatIDR(receiptOrder.total)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-stone-600 pt-1">
                                <span>Metode:</span>
                                <span>{receiptOrder.payment?.payment_method || 'Cash / Tunai'} (LUNAS)</span>
                            </div>
                        </div>

                        {/* Struk Footer Greeting */}
                        <div className="text-center text-[10px] text-stone-500 space-y-1">
                            <p className="font-serif italic text-stone-700">"Matur Nuwun / Terima Kasih"</p>
                            <p>Cita Rasa Luhur Nusantara di Setiap Suapan</p>
                            <p className="text-[9px] text-stone-400">Simpan struk ini sebagai bukti pembayaran resmi</p>
                        </div>

                        {/* Action Buttons: Print and Close */}
                        <div className="pt-2 flex items-center gap-2 print:hidden font-sans">
                            <button
                                type="button"
                                onClick={() => setReceiptOrder(null)}
                                className="flex-1 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-all"
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex-1 py-2 rounded-xl bg-[#32151F] hover:bg-[#461e2b] text-[#D4B886] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak Sekarang</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
