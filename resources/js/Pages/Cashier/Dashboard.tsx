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
    XCircle,
    SlidersHorizontal,
    Bell,
    TrendingUp,
    ChevronDown,
    ArrowUpRight,
    Table as TableIcon
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

    // Sidebar collapse state (App Shell 9)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // State modal cetak struk
    const [receiptOrder, setReceiptOrder] = useState<OrderWithDetails | null>(null);

    // State modal bayar tunai
    const [cashPaymentOrder, setCashPaymentOrder] = useState<OrderWithDetails | null>(null);
    const [cashReceived, setCashReceived] = useState<number>(0);

    // Logout with confirmation alert
    const handleLogout = () => {
        if (window.confirm('Konfirmasi Keluar: Apakah Anda yakin ingin mengakhiri sesi Kasir? Pastikan seluruh transaksi aktif telah diverifikasi.')) {
            router.post('/logout');
        }
    };

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
        setCashReceived(Math.ceil(order.total / 10000) * 10000);
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
        }).format(val || 0);
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
        <div className="min-h-screen bg-[#0E0D0C] text-[#F4EFE6] font-body flex flex-col lg:flex-row selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Terminal Kasir Operasional — POS Antrean Terpusat NUSARA" />
            <FlashToast flash={flash} durationMs={3000} />

            {/* ========================================================
                APP SHELL 9: LEFT SIDEBAR
            ======================================================== */}
            <aside 
                className={`${
                    sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
                } w-full lg:min-h-screen bg-[#141110] border-r border-[#2C2421] flex flex-col justify-between p-4 transition-all duration-300 z-30 shrink-0`}
            >
                {/* Top Section */}
                <div className="space-y-4">
                    {/* Header: Initial Box + Role + Collapse Button */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#2C2421]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] text-[#211D1B] font-heading font-bold text-base flex items-center justify-center shrink-0 shadow-md">
                                K
                            </div>
                            {!sidebarCollapsed && (
                                <div className="truncate">
                                    <h1 className="text-sm font-bold text-[#F4EFE6] tracking-wide truncate">
                                        Kasir Operasional
                                    </h1>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#B99A65] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>Terminal POS Aktif</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-[#D4B886] hover:bg-[#211D1B] transition-colors"
                            title={sidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Primary Action Button (White/Light Pill from App Shell 9) */}
                    <button
                        type="button"
                        onClick={() => {
                            setMainTab('orders');
                            setSelectedStatus('pending');
                        }}
                        className="w-full bg-[#F4EFE6] hover:bg-white text-[#211D1B] font-semibold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] text-xs"
                    >
                        <Wallet className="w-4 h-4 text-[#32151F]" />
                        {!sidebarCollapsed && <span className="tracking-wide">Konfirmasi Transaksi Cepat</span>}
                    </button>

                    {/* Segmented Chips (App Shell 9 "Model" Section) */}
                    <div>
                        {!sidebarCollapsed && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
                                Mode Operasional
                            </p>
                        )}
                        <div className={`grid ${sidebarCollapsed ? 'grid-cols-1' : 'grid-cols-3'} gap-1.5 bg-[#1C1816] p-1.5 rounded-xl border border-[#2C2421]`}>
                            <button
                                type="button"
                                onClick={() => setMainTab('orders')}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                                    mainTab === 'orders'
                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm font-bold border border-[#B99A65]/40'
                                        : 'text-stone-400 hover:text-stone-200 hover:bg-[#241E1C]'
                                }`}
                                title="Antrean Pesanan"
                            >
                                <ShoppingBag className="w-3.5 h-3.5 mb-1 text-[#D4B886]" />
                                {!sidebarCollapsed && <span>Order</span>}
                                <span className="text-[9px] font-mono opacity-80 font-bold">{orders.length}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMainTab('tables')}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                                    mainTab === 'tables'
                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm font-bold border border-[#B99A65]/40'
                                        : 'text-stone-400 hover:text-stone-200 hover:bg-[#241E1C]'
                                }`}
                                title="Denah & Alokasi Meja"
                            >
                                <TableIcon className="w-3.5 h-3.5 mb-1 text-[#D4B886]" />
                                {!sidebarCollapsed && <span>Meja</span>}
                                <span className="text-[9px] font-mono opacity-80 font-bold">{tables.length}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMainTab('reservations')}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                                    mainTab === 'reservations'
                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm font-bold border border-[#B99A65]/40'
                                        : 'text-stone-400 hover:text-stone-200 hover:bg-[#241E1C]'
                                }`}
                                title="Buku Reservasi"
                            >
                                <Calendar className="w-3.5 h-3.5 mb-1 text-[#D4B886]" />
                                {!sidebarCollapsed && <span>Reservasi</span>}
                                <span className="text-[9px] font-mono opacity-80 font-bold">{reservations.length}</span>
                            </button>
                        </div>
                    </div>

                    {/* App Shell 9: Pinned Items Section */}
                    {!sidebarCollapsed && (
                        <div className="space-y-1.5 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
                                Prioritas Langsung
                            </p>

                            {/* Pinned 1: Menunggu ACC Kasir */}
                            <div 
                                onClick={() => { setMainTab('orders'); setSelectedStatus('pending'); }}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    metrics.pendingOrders > 0 
                                        ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-600' 
                                        : 'bg-[#1C1816] border-[#2C2421] opacity-70'
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Menunggu Bayar</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/50 text-amber-300 font-mono">
                                        {metrics.pendingOrders} order
                                    </span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1 truncate">
                                    {metrics.pendingOrders > 0 ? 'Verifikasi pembayaran tunai / QRIS segera' : 'Semua transaksi telah lunas'}
                                </p>
                            </div>

                            {/* Pinned 2: Dapur & Siap Diambil */}
                            <div 
                                onClick={() => { setMainTab('orders'); setSelectedStatus('ready'); }}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    metrics.readyOrders > 0 
                                        ? 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-600' 
                                        : 'bg-[#1C1816] border-[#2C2421] opacity-70'
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Siap Diambil / Saji</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/50 text-emerald-300 font-mono">
                                        {metrics.readyOrders} order
                                    </span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1 truncate">
                                    {metrics.readyOrders > 0 ? 'Pesanan matang, siap diserahkan ke tamu' : 'Tidak ada antrean siap ambil'}
                                </p>
                            </div>

                            {/* Pinned 3: Total Omzet Hari Ini */}
                            <div className="p-2.5 rounded-xl border border-[#B99A65]/40 bg-[#32151F]/40">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[#D4B886] flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Omzet Sesi Ini</span>
                                    </span>
                                </div>
                                <p className="text-base font-bold text-[#F4EFE6] font-mono mt-1">
                                    {formatIDR(metrics.todayRevenue)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* App Shell 9: Recent Order Queue */}
                    {!sidebarCollapsed && (
                        <div className="space-y-1 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
                                Antrean Terkini
                            </p>
                            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                {orders.slice(0, 8).map((ord) => (
                                    <button
                                        key={ord.id}
                                        type="button"
                                        onClick={() => {
                                            setMainTab('orders');
                                            setSearchQuery(ord.order_code);
                                        }}
                                        className="w-full flex items-center justify-between p-1.5 rounded-lg text-xs text-stone-300 hover:bg-[#211D1B] hover:text-[#D4B886] transition-colors text-left"
                                    >
                                        <span className="font-mono font-medium truncate">{ord.order_code}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-stone-400">
                                            {ord.order_type === 'dine_in' ? ord.table_number || 'Dine-in' : 'Takeaway'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Section: Cashier Profile & Logout */}
                <div className="pt-3 border-t border-[#2C2421] space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] flex items-center justify-center font-bold text-xs shrink-0 shadow">
                                {cashierUser.name.charAt(0).toUpperCase()}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="truncate text-xs leading-tight">
                                    <p className="font-semibold text-stone-200 truncate">{cashierUser.name}</p>
                                    <p className="text-[10px] text-[#B99A65] truncate font-mono">Kasir Shift Aktif</p>
                                </div>
                            )}
                        </div>

                        {/* Logout with Alert Confirmation */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2 rounded-xl bg-[#211D1B] hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 border border-stone-800 transition-colors"
                            title="Keluar dari Akun Kasir"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ========================================================
                APP SHELL 9: MAIN STAGE & OPERATIONAL CANVAS
            ======================================================== */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Top Navigation Bar with Official NUSARA Logo */}
                <header className="h-16 border-b border-[#2C2421] bg-[#141110]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
                    {/* Left: Station Dropdown Pill */}
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211D1B] border border-stone-800 text-xs font-semibold text-stone-200 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Terminal Kasir Utama POS</span>
                            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                        </div>
                    </div>

                    {/* Center: Official Logo (navbar/hero identity) */}
                    <div className="flex items-center justify-center">
                        <Link href="/kasir" className="inline-flex items-center gap-2 group">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA — Nusantara & Rasa" 
                                className="h-8 sm:h-9 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform" 
                            />
                        </Link>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#211D1B] border border-stone-800 text-xs text-stone-400">
                            <Clock className="w-3.5 h-3.5 text-[#B99A65]" />
                            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#211D1B] hover:bg-[#32151F] text-stone-300 hover:text-[#D4B886] border border-stone-800 transition-all text-xs"
                            title="Segarkan data antrean"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Segarkan</span>
                        </button>
                    </div>
                </header>

                {/* Main Content Stage */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
                    
                    {/* ========================================================
                        APP SHELL 9: CENTER HERO & GREETING
                    ======================================================== */}
                    <div className="text-center max-w-2xl mx-auto pt-2 pb-4 space-y-3">
                        {/* Avatar Icon Box */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#32151F] to-[#211D1B] border border-[#B99A65]/40 text-[#D4B886] mx-auto flex items-center justify-center shadow-lg">
                            <Receipt className="w-7 h-7" />
                        </div>

                        {/* Title & Subtitle */}
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#F4EFE6] leading-tight">
                            Terminal Kasir & Konfirmasi Order
                        </h2>
                        <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-lg mx-auto">
                            Kelola verifikasi pembayaran tunai & QRIS, koordinasikan antrean dapur, serta proses serah terima pesanan takeaway.
                        </p>
                    </div>

                    {/* ========================================================
                        APP SHELL 9: FLOATING SEARCH & ACTION INPUT BOX
                    ======================================================== */}
                    <div className="max-w-2xl mx-auto">
                        <div className="relative rounded-2xl bg-[#1C1816] border border-[#B99A65]/35 p-3 shadow-xl focus-within:border-[#D4B886] transition-all">
                            <div className="flex items-center gap-3">
                                <Search className="w-4 h-4 text-[#B99A65] shrink-0 ml-1" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari kode pesanan (#ORD-...), nama tamu, atau nomor meja..."
                                    className="w-full bg-transparent border-0 text-[#F4EFE6] text-xs sm:text-sm focus:outline-none placeholder-stone-500 font-sans"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1 rounded bg-[#2A2421]"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ========================================================
                        APP SHELL 9: 4 QUICK ACTION SUGGESTION CARDS
                    ======================================================== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-5xl mx-auto">
                        {/* Card 1: Verifikasi Pembayaran */}
                        <button
                            type="button"
                            onClick={() => {
                                setMainTab('orders');
                                setSelectedStatus('pending');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                mainTab === 'orders' && selectedStatus === 'pending'
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
                                    <Wallet className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-amber-400 transition-colors">
                                    Verifikasi Pembayaran
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {metrics.pendingOrders} Pesanan Menunggu
                                </p>
                            </div>
                        </button>

                        {/* Card 2: Status Dapur */}
                        <button
                            type="button"
                            onClick={() => {
                                setMainTab('orders');
                                setSelectedStatus('preparing');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                mainTab === 'orders' && selectedStatus === 'preparing'
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-orange-950/60 border border-orange-800/60 text-orange-400 flex items-center justify-center">
                                    <Flame className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-orange-400 transition-colors">
                                    Pesanan Dalam Dapur
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {metrics.preparingOrders} Sedang Dimasak
                                </p>
                            </div>
                        </button>

                        {/* Card 3: Siap Saji / Ambil */}
                        <button
                            type="button"
                            onClick={() => {
                                setMainTab('orders');
                                setSelectedStatus('ready');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                mainTab === 'orders' && selectedStatus === 'ready'
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-emerald-400 transition-colors">
                                    Siap Ambil / Saji
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {metrics.readyOrders} Siap Diserahkan
                                </p>
                            </div>
                        </button>

                        {/* Card 4: Buku Reservasi */}
                        <button
                            type="button"
                            onClick={() => {
                                setMainTab('reservations');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                mainTab === 'reservations'
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-[#D4B886] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                    Buku Reservasi Meja
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {reservations.length} Jadwal Hari Ini
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* ========================================================
                        TAB WORKSPACE FEEDS
                    ======================================================== */}
                    {/* TAB 1: CENTRALIZED ORDER QUEUE */}
                    {mainTab === 'orders' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Filter Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2C2421]">
                                <div>
                                    <h3 className="font-heading text-xl font-bold text-[#F4EFE6] flex items-center gap-2">
                                        <ShoppingBag className="w-5 h-5 text-[#D4B886]" />
                                        <span>Antrean Pesanan Terpusat ({filteredOrders.length})</span>
                                    </h3>
                                    <p className="text-xs text-stone-400 mt-0.5">
                                        Pantau pesanan Dine-in dan Takeaway, konfirmasi pembayaran, dan perbarui proses dapur.
                                    </p>
                                </div>

                                {/* Status Filters */}
                                <div className="flex items-center gap-1 bg-[#1C1816] p-1 rounded-xl border border-stone-800 text-xs flex-wrap">
                                    {[
                                        { id: 'all', label: 'Semua' },
                                        { id: 'pending', label: 'Menunggu ACC' },
                                        { id: 'preparing', label: 'Dapur' },
                                        { id: 'ready', label: 'Siap' },
                                        { id: 'completed', label: 'Selesai' },
                                        { id: 'cancelled', label: 'Batal' }
                                    ].map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setSelectedStatus(f.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                selectedStatus === f.id
                                                    ? 'bg-[#32151F] text-[#D4B886] font-bold border border-[#B99A65]/40 shadow-sm'
                                                    : 'text-stone-400 hover:text-stone-200'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Orders Grid */}
                            {filteredOrders.length === 0 ? (
                                <div className="p-12 text-center rounded-3xl bg-[#141110] border border-[#2C2421]">
                                    <CheckCircle2 className="w-12 h-12 text-[#D4B886]/60 mx-auto mb-3" />
                                    <h4 className="font-heading text-lg font-bold text-stone-200">
                                        Tidak Ada Pesanan Ditemukan
                                    </h4>
                                    <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                                        Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredOrders.map((order) => {
                                        const badge = getStatusBadge(order.order_status);
                                        const isAwaitingPay = ['Pending', 'Awaiting Payment'].includes(order.order_status);
                                        const isPaidConfirmed = ['Paid', 'Confirmed'].includes(order.order_status);
                                        const isPreparing = order.order_status === 'Preparing';
                                        const isReady = order.order_status === 'Ready';
                                        const isDineIn = order.order_type === 'dine_in';

                                        return (
                                            <div
                                                key={order.id}
                                                className="p-5 rounded-2xl bg-[#141110] border border-[#2C2421] hover:border-[#B99A65]/50 shadow-xl flex flex-col justify-between transition-all"
                                            >
                                                <div>
                                                    {/* Top Info */}
                                                    <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs font-bold text-[#D4B886]">
                                                                    {order.order_code}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                    isDineIn 
                                                                        ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40' 
                                                                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                                }`}>
                                                                    {isDineIn ? (order.table_number || 'Dine-in') : 'Takeaway'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1.5">
                                                                <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                                                                <span>{order.customer_name || 'Pelanggan'}</span>
                                                                {order.customer_phone && <span className="text-stone-500 font-mono">({order.customer_phone})</span>}
                                                            </p>
                                                        </div>

                                                        {/* Status Pill */}
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                            <span>{badge.label}</span>
                                                        </span>
                                                    </div>

                                                    {/* Item Breakdown */}
                                                    <div className="py-3 space-y-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                                            Rincian Menu:
                                                        </p>
                                                        <ul className="space-y-1.5 text-xs text-stone-300">
                                                            {(order.items || []).map((it, idx) => (
                                                                <li key={idx} className="flex justify-between items-start">
                                                                    <span>
                                                                        <strong className="text-[#D4B886] font-mono mr-1.5">{it.quantity}x</strong>
                                                                        {it.menu_name_snapshot}
                                                                    </span>
                                                                    <span className="text-stone-400 font-mono">{formatIDR(it.subtotal)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>

                                                        {order.customer_notes && (
                                                            <div className="mt-2 p-2 rounded-lg bg-[#211D1B] border border-amber-900/40 text-[11px] text-amber-300">
                                                                <strong>Catatan:</strong> {order.customer_notes}
                                                            </div>
                                                        )}

                                                        <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline text-xs">
                                                            <span className="text-stone-400">Total Transaksi:</span>
                                                            <span className="font-mono text-base font-bold text-[#F4EFE6]">
                                                                {formatIDR(order.total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Controls for Cashier */}
                                                <div className="pt-3 border-t border-stone-800 space-y-2">
                                                    {/* 1. Jika Menunggu Bayar -> Terima Tunai / ACC */}
                                                    {isAwaitingPay && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenCashModal(order)}
                                                                className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                                                            >
                                                                <Wallet className="w-3.5 h-3.5" />
                                                                <span>Bayar Tunai</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateStatus(order.id, 'Paid', 'Konfirmasi kasir')}
                                                                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>Konfirmasi Paid</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* 2. Jika Paid/Confirmed -> Kirim ke Dapur */}
                                                    {isPaidConfirmed && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateStatus(order.id, 'Preparing', 'Diteruskan ke dapur')}
                                                            className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                                                        >
                                                            <Flame className="w-4 h-4" />
                                                            <span>Kirim ke Dapur (Preparing)</span>
                                                        </button>
                                                    )}

                                                    {/* 3. Jika Preparing -> Tandai Siap (Ready) */}
                                                    {isPreparing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateStatus(order.id, 'Ready', 'Dapur selesai')}
                                                            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                                                        >
                                                            <Sparkles className="w-4 h-4" />
                                                            <span>Konfirmasi Matang (Ready)</span>
                                                        </button>
                                                    )}

                                                    {/* 4. Jika Ready & Takeaway -> Serahkan ke Tamu (Picked Up) */}
                                                    {isReady && !isDineIn && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateStatus(order.id, 'Picked Up', 'Takeaway diserahkan')}
                                                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
                                                        >
                                                            <CheckCheck className="w-4 h-4" />
                                                            <span>Serahkan Takeaway (Picked Up)</span>
                                                        </button>
                                                    )}

                                                    {/* Secondary Buttons: Cetak Struk */}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setReceiptOrder(order)}
                                                            className="flex-1 py-1.5 rounded-lg bg-[#211D1B] hover:bg-black border border-stone-800 text-stone-300 text-xs flex items-center justify-center gap-1 transition-colors"
                                                        >
                                                            <Printer className="w-3.5 h-3.5 text-[#D4B886]" />
                                                            <span>Cetak Struk POS</span>
                                                        </button>

                                                        {isAwaitingPay && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (confirm(`Yakin ingin membatalkan pesanan #${order.order_code}?`)) {
                                                                        handleUpdateStatus(order.id, 'Cancelled', 'Dibatalkan oleh kasir');
                                                                    }
                                                                }}
                                                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/40 text-xs transition-colors"
                                                            >
                                                                Batalkan
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
                    )}

                    {/* TAB 2: DENAH & ALOKASI MEJA */}
                    {mainTab === 'tables' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="pb-3 border-b border-[#2C2421]">
                                <h3 className="font-heading text-xl font-bold text-[#F4EFE6] flex items-center gap-2">
                                    <TableIcon className="w-5 h-5 text-[#D4B886]" />
                                    <span>Denah & Koordinasi Meja Restoran ({tables.length} Meja)</span>
                                </h3>
                                <p className="text-xs text-stone-400 mt-0.5">
                                    Pantau kapasitas meja, kelola status terisi, dan koordinasikan alokasi dengan tim waiter.
                                </p>
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
                                                    ? 'bg-[#32151F]/40 border-rose-500/40'
                                                    : isCleaning
                                                    ? 'bg-amber-950/30 border-amber-500/40'
                                                    : isReserved
                                                    ? 'bg-sky-950/30 border-sky-500/40'
                                                    : 'bg-[#141110] border-stone-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-heading text-base font-bold text-[#D4B886]">
                                                    {tbl.table_number}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    isOccupied ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                    isCleaning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                    isReserved ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                                                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
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

                                            <div className="pt-2 border-t border-stone-800">
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

                    {/* TAB 3: BUKU RESERVASI */}
                    {mainTab === 'reservations' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="pb-3 border-b border-[#2C2421]">
                                <h3 className="font-heading text-xl font-bold text-[#F4EFE6] flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#D4B886]" />
                                    <span>Buku Reservasi Tamu Restoran ({reservations.length})</span>
                                </h3>
                                <p className="text-xs text-stone-400 mt-0.5">
                                    Kelola konfirmasi kedatangan dan alokasikan meja tamu prioritas hari ini.
                                </p>
                            </div>

                            {reservations.length === 0 ? (
                                <div className="py-16 text-center rounded-2xl bg-[#141110] border border-[#2C2421]">
                                    <Calendar className="w-10 h-10 text-stone-500 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-[#D4B886]">Belum Ada Reservasi Aktif</p>
                                    <p className="text-xs text-stone-400">Jadwal reservasi tamu mendatang akan tampil di sini.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {reservations.map(res => (
                                        <div key={res.id} className="p-4 rounded-2xl bg-[#141110] border border-[#2C2421] space-y-3">
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
                                                    <span>{res.guest_count} Orang Tamu</span>
                                                </p>
                                                {res.experience_name && (
                                                    <p className="text-[11px] font-semibold text-[#D4B886] mt-1">
                                                        Paket: {res.experience_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
                                                {res.status === 'Pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReservationStatusChange(res.id, 'Confirmed')}
                                                        className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs"
                                                    >
                                                        Konfirmasi
                                                    </button>
                                                )}
                                                {res.status === 'Confirmed' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReservationStatusChange(res.id, 'Seated')}
                                                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                                                    >
                                                        Tamu Duduk (Seated)
                                                    </button>
                                                )}
                                                {res.status === 'Seated' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReservationStatusChange(res.id, 'Completed')}
                                                        className="flex-1 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs"
                                                    >
                                                        Selesai
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
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
                </div>
            </main>

            {/* ========================================================
                MODAL: CASH PAYMENT CONFIRMATION
            ======================================================== */}
            {cashPaymentOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl bg-[#1C1716] border border-[#B99A65]/40 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-heading text-lg font-bold text-[#D4B886]">
                                    Penerimaan Pembayaran Tunai
                                </h3>
                            </div>
                            <button 
                                type="button"
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

                            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex justify-between items-center">
                                <span className="font-semibold text-emerald-300">Kembalian ke Pelanggan:</span>
                                <span className="font-mono text-base font-bold text-emerald-400">
                                    {formatIDR(Math.max(0, cashReceived - cashPaymentOrder.total))}
                                </span>
                            </div>
                        </div>

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
                MODAL: RECEIPT PRINT
            ======================================================== */}
            {receiptOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl bg-white text-[#211D1B] shadow-2xl p-6 space-y-4 font-mono max-h-[90vh] overflow-y-auto">
                        <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA" 
                                className="h-10 w-auto object-contain mx-auto mb-1 filter invert"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                            <p className="text-[11px] uppercase tracking-widest text-stone-600 font-bold">
                                Restoran Nusantara & Rasa
                            </p>
                            <p className="text-[10px] text-stone-500 leading-tight">
                                {settings?.address || 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan'}
                            </p>
                            <p className="text-[10px] text-stone-500">
                                Telp: {settings?.phone || '(021) 7208889'}
                            </p>
                        </div>

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

                        <div className="text-center text-[10px] text-stone-500 space-y-1">
                            <p className="font-serif italic text-stone-700">"Matur Nuwun / Terima Kasih"</p>
                            <p>Cita Rasa Luhur Nusantara di Setiap Suapan</p>
                            <p className="text-[9px] text-stone-400">Simpan struk ini sebagai bukti pembayaran resmi</p>
                        </div>

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
