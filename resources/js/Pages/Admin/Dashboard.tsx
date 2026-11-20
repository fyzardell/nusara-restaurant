import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import { 
    AdminMetrics, 
    Order, 
    Menu, 
    RestaurantTable, 
    Reservation, 
    AuditLog, 
    RestaurantSettings, 
    User 
} from '../../types';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    UtensilsCrossed, 
    QrCode, 
    Calendar, 
    History, 
    Search, 
    Filter, 
    TrendingUp, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    DollarSign, 
    Users, 
    Sparkles, 
    MapPin, 
    LogOut, 
    ExternalLink, 
    ChevronRight, 
    Edit3, 
    Star, 
    Eye, 
    X, 
    RefreshCw, 
    ArrowUpRight,
    ShieldCheck
} from 'lucide-react';

interface Props {
    metrics: AdminMetrics;
    orders: Order[];
    menus: Menu[];
    tables: RestaurantTable[];
    reservations: Reservation[];
    auditLogs: AuditLog[];
    settings: RestaurantSettings;
    adminUser: User;
}

export default function AdminDashboard({ 
    metrics, 
    orders: initialOrders, 
    menus: initialMenus, 
    tables: initialTables, 
    reservations: initialReservations, 
    auditLogs, 
    settings, 
    adminUser 
}: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menus' | 'tables' | 'reservations' | 'audit'>('overview');

    // Filter states for orders
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
    const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

    // Filter states for menu
    const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
    const [editingMenuStock, setEditingMenuStock] = useState<Menu | null>(null);
    const [newStockQuantity, setNewStockQuantity] = useState<number>(0);
    const [newIsAvailable, setNewIsAvailable] = useState<boolean>(true);

    // Format currency
    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return initialOrders.filter(order => {
            const matchesStatus = orderStatusFilter === 'all' || order.order_status === orderStatusFilter;
            const matchesType = orderTypeFilter === 'all' || order.order_type === orderTypeFilter;
            const matchesSearch = order.order_code.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                (order.customer_name && order.customer_name.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
                (order.table_number && order.table_number.toLowerCase().includes(orderSearchQuery.toLowerCase()));
            return matchesStatus && matchesType && matchesSearch;
        });
    }, [initialOrders, orderStatusFilter, orderTypeFilter, orderSearchQuery]);

    // Filtered menus
    const filteredMenus = useMemo(() => {
        return initialMenus.filter(menu => {
            return menu.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                (menu.category_name && menu.category_name.toLowerCase().includes(menuSearchQuery.toLowerCase()));
        });
    }, [initialMenus, menuSearchQuery]);

    // Handle Order Status Update
    const handleUpdateOrderStatus = (orderId: number, status: string) => {
        router.post(`/admin/order/${orderId}/status`, {
            order_status: status,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
                    setSelectedOrderDetails({
                        ...selectedOrderDetails,
                        order_status: status as any
                    });
                }
            }
        });
    };

    // Handle Save Stock
    const handleSaveStock = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMenuStock) return;

        router.post(`/admin/menu/${editingMenuStock.id}/stock`, {
            stock_quantity: newStockQuantity,
            is_available: newIsAvailable,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingMenuStock(null);
            }
        });
    };

    // Handle Table Status Update
    const handleUpdateTableStatus = (tableId: number, status: string) => {
        router.post(`/admin/table/${tableId}/status`, {
            status: status,
        }, {
            preserveScroll: true,
        });
    };

    // Handle Reservation Status
    const handleUpdateReservationStatus = (reservationId: number, status: string) => {
        router.post(`/admin/reservation/${reservationId}/status`, {
            status: status,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-[#181413] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="HQ Operations & Order Tracking — NUSARA Admin" />

            {/* Flash Alerts (3 Detik Auto Dismiss) */}
            <FlashToast flash={flash} durationMs={3000} />

            {/* ========================================================
                TOP EXECUTIVE NAVIGATION BAR
            ======================================================== */}
            <header className="sticky top-0 z-40 bg-[#211D1B] border-b border-[#32151F] shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Brand & Single Branch Flagship */}
                        <div className="flex items-center gap-3">
                            <Link href="/" title="Ke Beranda Publik" className="group flex items-center gap-2.5">
                                <img 
                                    src="/images/nusara-logo.png" 
                                    alt="NUSARA — Nusantara & Rasa" 
                                    className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow" 
                                />
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-[#B99A65] text-[#211D1B] shadow">
                                    HQ Admin
                                </span>
                            </Link>
                            <div className="hidden lg:block pl-3 border-l border-stone-800">
                                <p className="text-[10px] text-[#B99A65] flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>Single Branch · Senopati, Jakarta Selatan</span>
                                </p>
                            </div>
                        </div>

                        {/* Right: Admin Profile & Actions */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                target="_blank"
                                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#B99A65]/40 text-xs text-[#F4EFE6]/80 hover:text-[#D4B886] hover:border-[#D4B886] transition-colors"
                            >
                                <span>Lihat Website</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-xs">
                                <div className="w-7 h-7 rounded-full bg-[#211D1B] text-[#D4B886] flex items-center justify-center font-bold text-xs">
                                    {adminUser.name.charAt(0)}
                                </div>
                                <div className="text-left hidden md:block">
                                    <p className="font-bold text-[11px] leading-tight">{adminUser.name}</p>
                                    <p className="text-[9px] uppercase tracking-wider text-[#B99A65]">Executive Admin</p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.post('/logout')}
                                title="Keluar / Logout"
                                className="p-2 rounded-full text-rose-300 hover:bg-rose-950/60 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subnav Tabs */}
                <div className="border-t border-[#32151F]/80 bg-[#1A1615]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-xs">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                activeTab === 'overview'
                                    ? 'bg-[#B99A65] text-[#211D1B] shadow'
                                    : 'text-[#F4EFE6]/70 hover:text-white hover:bg-[#211D1B]'
                            }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Ringkasan & Metrik</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                activeTab === 'orders'
                                    ? 'bg-[#B99A65] text-[#211D1B] shadow'
                                    : 'text-[#F4EFE6]/70 hover:text-white hover:bg-[#211D1B]'
                            }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Tracking Pembelian & Pesanan</span>
                            {metrics.activeOrders > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-extrabold animate-pulse">
                                    {metrics.activeOrders}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('menus')}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                activeTab === 'menus'
                                    ? 'bg-[#B99A65] text-[#211D1B] shadow'
                                    : 'text-[#F4EFE6]/70 hover:text-white hover:bg-[#211D1B]'
                            }`}
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            <span>Kelola Menu & Stok</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('tables')}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                activeTab === 'tables'
                                    ? 'bg-[#B99A65] text-[#211D1B] shadow'
                                    : 'text-[#F4EFE6]/70 hover:text-white hover:bg-[#211D1B]'
                            }`}
                        >
                            <QrCode className="w-4 h-4" />
                            <span>Status Meja & QR Sesi</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('reservations')}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                activeTab === 'reservations'
                                    ? 'bg-[#B99A65] text-[#211D1B] shadow'
                                    : 'text-[#F4EFE6]/70 hover:text-white hover:bg-[#211D1B]'
                            }`}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Jadwal Reservasi</span>
                            {metrics.pendingReservations > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                                    {metrics.pendingReservations}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                activeTab === 'audit'
                                    ? 'bg-[#B99A65] text-[#211D1B] shadow'
                                    : 'text-[#F4EFE6]/70 hover:text-white hover:bg-[#211D1B]'
                            }`}
                        >
                            <History className="w-4 h-4" />
                            <span>Audit Log & Laporan</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ========================================================
                MAIN DASHBOARD CONTENT
            ======================================================== */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* ----------------------------------------------------
                    1. OVERVIEW & KPI METRICS TAB
                ---------------------------------------------------- */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Welcome Banner */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886]">
                                    Pusat Kendali Operasional Tunggal
                                </span>
                                <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#F4EFE6] mt-1">
                                    Selamat Bertugas, Raden Mas Haryo
                                </h1>
                                <p className="text-xs sm:text-sm text-[#F4EFE6]/75 mt-1 max-w-xl">
                                    Seluruh data pemesanan Dine-in QR, pesanan Takeaway, stok bahan menu, alokasi meja, dan reservasi tamu terpantau terpusat di sini.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider hover:shadow-lg transition-all"
                                >
                                    Pantau Pesanan Aktif ({metrics.activeOrders})
                                </button>
                            </div>
                        </div>

                        {/* Top KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Card 1: Today Revenue */}
                            <div className="p-5 rounded-2xl bg-[#211D1B] border border-[#B99A65]/30 shadow-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                        Omzet Hari Ini
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-[#32151F] text-[#D4B886] flex items-center justify-center">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="font-mono text-2xl font-bold text-[#F4EFE6]">
                                    {formatRupiah(metrics.todayRevenue)}
                                </h3>
                                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>Termasuk pajak PB1 11%</span>
                                </p>
                            </div>

                            {/* Card 2: Active Orders */}
                            <div className="p-5 rounded-2xl bg-[#211D1B] border border-[#B99A65]/30 shadow-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                        Pesanan Dalam Proses
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="font-mono text-2xl font-bold text-amber-300">
                                    {metrics.activeOrders} Pesanan
                                </h3>
                                <p className="text-[11px] text-stone-400">
                                    Total {metrics.totalOrders} transaksi selesai
                                </p>
                            </div>

                            {/* Card 3: Table Occupancy */}
                            <div className="p-5 rounded-2xl bg-[#211D1B] border border-[#B99A65]/30 shadow-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                        Okupansi Meja
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                                        <QrCode className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="font-mono text-2xl font-bold text-[#F4EFE6]">
                                    {metrics.occupiedTables} / {metrics.totalTables} Meja
                                </h3>
                                <p className="text-[11px] text-sky-300">
                                    {metrics.totalTables - metrics.occupiedTables} Meja siap digunakan (Available)
                                </p>
                            </div>

                            {/* Card 4: Reservations */}
                            <div className="p-5 rounded-2xl bg-[#211D1B] border border-[#B99A65]/30 shadow-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                        Reservasi Tertunda
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="font-mono text-2xl font-bold text-rose-300">
                                    {metrics.pendingReservations} Reservasi
                                </h3>
                                <p className="text-[11px] text-stone-400">
                                    Perlu konfirmasi jadwal meja
                                </p>
                            </div>
                        </div>

                        {/* Recent Orders Overview Snippet */}
                        <div className="p-6 rounded-3xl bg-[#211D1B] border border-[#B99A65]/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-heading text-xl font-bold text-[#F4EFE6]">
                                        Pesanan Terkini (Live Feed)
                                    </h3>
                                    <p className="text-xs text-[#F4EFE6]/60">5 transaksi terakhir yang masuk ke dapur</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="text-xs text-[#D4B886] font-semibold hover:underline flex items-center gap-1"
                                >
                                    <span>Lihat Semua Pesanan</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[10px] uppercase text-[#B99A65] border-b border-[#32151F]">
                                        <tr>
                                            <th className="py-2.5 px-3">Kode Order</th>
                                            <th className="py-2.5 px-3">Pelanggan / Meja</th>
                                            <th className="py-2.5 px-3">Menu Dipesan</th>
                                            <th className="py-2.5 px-3">Total</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#32151F]/60">
                                        {initialOrders.slice(0, 5).map(ord => (
                                            <tr key={ord.id} className="hover:bg-[#32151F]/40 transition-colors">
                                                <td className="py-3 px-3 font-mono font-bold text-[#D4B886]">
                                                    {ord.order_code}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="font-semibold block text-white">
                                                        {ord.customer_name || 'Tamu Restoran'}
                                                    </span>
                                                    <span className="text-[10px] text-stone-400">
                                                        {ord.order_type === 'dine_in' ? ord.table_number || 'Dine-in' : 'Takeaway'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    {ord.items && ord.items.length > 0 ? (
                                                        <span>{ord.items.map(i => `${i.quantity}x ${i.menu_name_snapshot}`).join(', ')}</span>
                                                    ) : (
                                                        <span className="text-stone-500">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 font-mono font-bold">
                                                    {formatRupiah(ord.total)}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        ['Served', 'Picked Up'].includes(ord.order_status)
                                                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                                            : ord.order_status === 'Preparing'
                                                            ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                                                            : 'bg-sky-950 text-sky-300 border border-sky-600'
                                                    }`}>
                                                        {ord.order_status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <button
                                                        onClick={() => setSelectedOrderDetails(ord)}
                                                        className="px-3 py-1 rounded-lg bg-[#32151F] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] transition-colors"
                                                    >
                                                        Rincian
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    2. TRACKING PEMBELIAN & PESANAN TAB
                ---------------------------------------------------- */}
                {activeTab === 'orders' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Header & Filters */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F4EFE6]">
                                    Tracking Pembelian & Pesanan Pelanggan
                                </h2>
                                <p className="text-xs text-[#F4EFE6]/70 mt-1">
                                    Pantau antrean pesanan langsung, update status pengerjaan dapur, dan rincian transaksi.
                                </p>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full md:w-80">
                                <Search className="w-4 h-4 text-[#B99A65] absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={orderSearchQuery}
                                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                                    placeholder="Cari kode order, nama pelanggan, meja..."
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#211D1B] border border-[#B99A65]/40 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/40 focus:outline-none focus:border-[#D4B886]"
                                />
                            </div>
                        </div>

                        {/* Filter Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-[#32151F] pb-4 text-xs">
                            <span className="text-[11px] font-bold text-[#B99A65] uppercase mr-2">Status:</span>
                            {['all', 'Preparing', 'Ready', 'Served', 'Picked Up', 'Paid', 'Cancelled'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setOrderStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                                        orderStatusFilter === st
                                            ? 'bg-[#B99A65] text-[#211D1B] font-bold shadow'
                                            : 'bg-[#211D1B] text-[#F4EFE6]/70 hover:text-white border border-[#32151F]'
                                    }`}
                                >
                                    {st === 'all' ? 'Semua Status' : st}
                                </button>
                            ))}

                            <span className="text-[11px] font-bold text-[#B99A65] uppercase ml-4 mr-2">Tipe:</span>
                            {['all', 'dine_in', 'takeaway'].map((tp) => (
                                <button
                                    key={tp}
                                    onClick={() => setOrderTypeFilter(tp)}
                                    className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                                        orderTypeFilter === tp
                                            ? 'bg-[#B99A65] text-[#211D1B] font-bold shadow'
                                            : 'bg-[#211D1B] text-[#F4EFE6]/70 hover:text-white border border-[#32151F]'
                                    }`}
                                >
                                    {tp === 'all' ? 'Semua Tipe' : (tp === 'dine_in' ? 'Dine-in (Meja)' : 'Takeaway')}
                                </button>
                            ))}
                        </div>

                        {/* Orders List Table */}
                        <div className="rounded-3xl bg-[#211D1B] border border-[#B99A65]/30 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-[#32151F] text-[10px] uppercase tracking-wider text-[#D4B886]">
                                        <tr>
                                            <th className="py-3 px-4">Kode Order</th>
                                            <th className="py-3 px-4">Waktu</th>
                                            <th className="py-3 px-4">Pelanggan</th>
                                            <th className="py-3 px-4">Tipe / Lokasi</th>
                                            <th className="py-3 px-4">Rincian Menu</th>
                                            <th className="py-3 px-4">Total</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-center">Ubah Status</th>
                                            <th className="py-3 px-4 text-right">Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#32151F]/60">
                                        {filteredOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-[#32151F]/30 transition-colors">
                                                <td className="py-3 px-4 font-mono font-bold text-[#D4B886]">
                                                    {order.order_code}
                                                </td>
                                                <td className="py-3 px-4 text-stone-400">
                                                    {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-white">
                                                    {order.customer_name || 'Guest Pelanggan'}
                                                    {order.customer_phone && (
                                                        <span className="block text-[10px] text-stone-400 font-mono">
                                                            {order.customer_phone}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#32151F] text-[#D4B886]">
                                                        {order.order_type === 'dine_in' ? (order.table_number || 'Dine-in') : 'Takeaway'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 max-w-xs truncate">
                                                    {order.items?.map(it => `${it.quantity}x ${it.menu_name_snapshot}`).join(', ')}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold text-[#D4B886]">
                                                    {formatRupiah(order.total)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        ['Served', 'Picked Up'].includes(order.order_status)
                                                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                                            : order.order_status === 'Preparing'
                                                            ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                                                            : 'bg-sky-950 text-sky-300 border border-sky-600'
                                                    }`}>
                                                        {order.order_status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <select
                                                        value={order.order_status}
                                                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                        className="px-2.5 py-1 rounded-lg bg-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] text-xs font-semibold focus:outline-none focus:border-[#D4B886]"
                                                    >
                                                        <option value="Pending">Pending (Menunggu ACC)</option>
                                                        <option value="Preparing">Preparing (Dapur)</option>
                                                        <option value="Ready">Ready (Siap Saji)</option>
                                                        <option value="Served">Served (Dine-in)</option>
                                                        <option value="Picked Up">Picked Up (Takeaway)</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedOrderDetails(order)}
                                                        className="px-3 py-1 rounded-lg bg-[#32151F] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] transition-colors"
                                                    >
                                                        Lihat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    3. KELOLA MENU & STOK TAB
                ---------------------------------------------------- */}
                {activeTab === 'menus' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F4EFE6]">
                                    Manajemen Menu & Ketersediaan Stok
                                </h2>
                                <p className="text-xs text-[#F4EFE6]/70 mt-1">
                                    Pantau jumlah stok hidangan secara real-time. Menu habis otomatis berstatus disabled di halaman pemesanan pelanggan.
                                </p>
                            </div>

                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 text-[#B99A65] absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={menuSearchQuery}
                                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                                    placeholder="Cari menu atau kategori..."
                                    className="w-full pl-11 pr-4 py-2 rounded-xl bg-[#211D1B] border border-[#B99A65]/40 text-xs text-[#F4EFE6] focus:outline-none focus:border-[#D4B886]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMenus.map(menu => {
                                const isOut = !menu.is_available || menu.stock_quantity <= 0;
                                return (
                                    <div
                                        key={menu.id}
                                        className="p-5 rounded-3xl bg-[#211D1B] border border-[#B99A65]/30 shadow-xl flex flex-col justify-between space-y-4"
                                    >
                                        <div className="flex gap-4">
                                            {menu.image_path ? (
                                                <img
                                                    src={menu.image_path}
                                                    alt={menu.name}
                                                    className="w-20 h-20 rounded-2xl object-cover border border-[#B99A65]/20 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-[#32151F] flex items-center justify-center text-[#D4B886] font-bold">
                                                    N
                                                </div>
                                            )}

                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-[#B99A65] tracking-wider">
                                                    {menu.category_name}
                                                </span>
                                                <h4 className="font-heading text-lg font-bold text-[#F4EFE6] leading-snug">
                                                    {menu.name}
                                                </h4>
                                                <span className="font-mono text-xs font-bold text-[#D4B886] block mt-1">
                                                    {formatRupiah(menu.price)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-[#32151F]/60 border border-[#B99A65]/20 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="text-stone-400 block text-[10px]">Stok Tersedia</span>
                                                <span className="font-mono text-base font-bold text-white">
                                                    {menu.stock_quantity} Porsi
                                                </span>
                                            </div>

                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                isOut 
                                                    ? 'bg-rose-950 text-rose-300 border border-rose-600' 
                                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                            }`}>
                                                {isOut ? 'Habis' : 'Tersedia'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setEditingMenuStock(menu);
                                                setNewStockQuantity(menu.stock_quantity);
                                                setNewIsAvailable(menu.is_available);
                                            }}
                                            className="w-full py-2.5 rounded-xl bg-[#32151F] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] transition-colors font-semibold text-xs flex items-center justify-center gap-1.5"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>Sesuaikan Stok & Status</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    4. STATUS MEJA & QR SESI TAB
                ---------------------------------------------------- */}
                {activeTab === 'tables' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F4EFE6]">
                                Denah Meja & Sesi QR Dine-in
                            </h2>
                            <p className="text-xs text-[#F4EFE6]/70 mt-1">
                                Kelola 8 meja restoran Nusara. Pastikan meja berstatus Available setelah dibersihkan oleh waiter.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {initialTables.map(tbl => {
                                const isAvailable = tbl.status === 'Available';
                                const isOccupied = tbl.status === 'Occupied';
                                const isCleaning = tbl.status === 'Cleaning';

                                return (
                                    <div
                                        key={tbl.id}
                                        className={`p-6 rounded-3xl border transition-all space-y-4 ${
                                            isOccupied
                                                ? 'bg-[#32151F]/90 border-amber-500/50 shadow-xl'
                                                : isCleaning
                                                ? 'bg-sky-950/60 border-sky-500/50'
                                                : 'bg-[#211D1B] border-[#B99A65]/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-heading text-2xl font-bold text-[#F4EFE6]">
                                                {tbl.table_number}
                                            </h3>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                isAvailable
                                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                                    : isOccupied
                                                    ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                                                    : 'bg-sky-950 text-sky-300 border border-sky-600'
                                            }`}>
                                                {tbl.status}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-[#F4EFE6]/75">
                                            <p>📍 {tbl.location}</p>
                                            <p>👥 Kapasitas: {tbl.capacity} Orang</p>
                                            {tbl.active_session && (
                                                <p className="text-[#D4B886] font-mono text-[11px] pt-1 border-t border-[#32151F]">
                                                    Sesi Aktif: {tbl.active_session.session_code}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <label className="block text-[10px] uppercase font-bold text-[#B99A65] mb-1">
                                                Ubah Status Meja:
                                            </label>
                                            <select
                                                value={tbl.status}
                                                onChange={(e) => handleUpdateTableStatus(tbl.id, e.target.value)}
                                                className="w-full px-3 py-1.5 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] text-xs font-semibold focus:outline-none focus:border-[#D4B886]"
                                            >
                                                <option value="Available">Available (Siap Digunakan)</option>
                                                <option value="Occupied">Occupied (Tamu Duduk)</option>
                                                <option value="Reserved">Reserved (Dipesan)</option>
                                                <option value="Cleaning">Cleaning (Sedang Dibersihkan)</option>
                                                <option value="Inactive">Inactive (Tutup)</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    5. JADWAL RESERVASI TAB
                ---------------------------------------------------- */}
                {activeTab === 'reservations' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F4EFE6]">
                                Jadwal Reservasi Tamu Restoran
                            </h2>
                            <p className="text-xs text-[#F4EFE6]/70 mt-1">
                                Kelola permohonan reservasi meja online dan paket Dining Experience.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-[#211D1B] border border-[#B99A65]/30 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-[#32151F] text-[10px] uppercase tracking-wider text-[#D4B886]">
                                        <tr>
                                            <th className="py-3 px-4">Kode Booking</th>
                                            <th className="py-3 px-4">Nama Tamu</th>
                                            <th className="py-3 px-4">Jadwal & Jam</th>
                                            <th className="py-3 px-4">Jml Tamu</th>
                                            <th className="py-3 px-4">Paket Experience</th>
                                            <th className="py-3 px-4">Permintaan Khusus</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Tindakan Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#32151F]/60">
                                        {initialReservations.map(res => (
                                            <tr key={res.id} className="hover:bg-[#32151F]/30 transition-colors">
                                                <td className="py-3 px-4 font-mono font-bold text-[#D4B886]">
                                                    {res.reservation_code}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-white">
                                                    {res.customer_name || 'Tamu NUSARA'}
                                                    <span className="block text-[10px] text-stone-400 font-mono">
                                                        {res.customer_phone}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {new Date(res.reservation_datetime).toLocaleDateString('id-ID', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}, {new Date(res.reservation_datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                </td>
                                                <td className="py-3 px-4 font-bold text-center">
                                                    {res.guest_count} Orang
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-[#D4B886] font-semibold">
                                                        {res.experience_name || 'A la Carte Standard'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 max-w-xs text-stone-300 italic">
                                                    {res.special_request || '-'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        res.status === 'Confirmed'
                                                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                                            : res.status === 'Pending'
                                                            ? 'bg-amber-950 text-amber-300 border border-amber-600'
                                                            : 'bg-rose-950 text-rose-300 border border-rose-600'
                                                    }`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right space-x-2">
                                                    {res.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateReservationStatus(res.id, 'Confirmed')}
                                                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                                                            >
                                                                Konfirmasi
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateReservationStatus(res.id, 'Rejected')}
                                                                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </>
                                                    )}
                                                    {res.status === 'Confirmed' && (
                                                        <button
                                                            onClick={() => handleUpdateReservationStatus(res.id, 'Completed')}
                                                            className="px-3 py-1 rounded-lg bg-[#32151F] text-[#D4B886] font-bold hover:bg-[#B99A65] hover:text-[#211D1B]"
                                                        >
                                                            Selesai
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------------------------------------------
                    6. AUDIT LOG & LAPORAN AKTIVITAS TAB
                ---------------------------------------------------- */}
                {activeTab === 'audit' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F4EFE6]">
                                Log Audit Keamanan & Riwayat Operasional
                            </h2>
                            <p className="text-xs text-[#F4EFE6]/70 mt-1">
                                Setiap perubahan status pesanan, stok menu, dan alokasi meja tercatat otomatis demi akuntabilitas operasional single branch.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-[#211D1B] border border-[#B99A65]/30 p-6 shadow-2xl space-y-4">
                            {auditLogs.length > 0 ? (
                                <div className="space-y-3">
                                    {auditLogs.map(log => (
                                        <div 
                                            key={log.id} 
                                            className="p-3.5 rounded-2xl bg-[#32151F]/40 border border-[#B99A65]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-[#32151F] text-[#D4B886] flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-xs font-bold">
                                                    LOG
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#D4B886]">{log.action}</span>
                                                    <p className="text-[#F4EFE6]/80 mt-0.5">{log.description}</p>
                                                    <span className="text-[10px] text-stone-400">
                                                        Oleh: {log.user_name || 'Sistem'} · Entitas: {log.entity_type} #{log.entity_id}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-stone-400 font-mono flex-shrink-0">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-stone-500 text-xs">
                                    Belum ada catatan aktivitas di audit log.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* ========================================================
                MODAL 1: ORDER DETAIL DRAWER
            ======================================================== */}
            {selectedOrderDetails && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-lg bg-[#211D1B] border-l border-[#B99A65]/40 h-full p-6 text-[#F4EFE6] flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-[#32151F] pb-3">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#B99A65] tracking-widest">
                                        Rincian Nota & Status Pesanan
                                    </span>
                                    <h3 className="font-heading text-2xl font-bold text-[#F4EFE6]">
                                        #{selectedOrderDetails.order_code}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedOrderDetails(null)}
                                    className="p-2 rounded-full text-stone-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-[#32151F]/60">
                                    <span className="text-stone-400 block text-[10px]">Tipe Pesanan</span>
                                    <span className="font-bold text-white">
                                        {selectedOrderDetails.order_type === 'dine_in' ? `Dine-in (${selectedOrderDetails.table_number || 'Meja'})` : 'Takeaway (Pickup)'}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-[#32151F]/60">
                                    <span className="text-stone-400 block text-[10px]">Waktu Masuk</span>
                                    <span className="font-bold text-white">
                                        {new Date(selectedOrderDetails.created_at).toLocaleTimeString('id-ID')} WIB
                                    </span>
                                </div>
                            </div>

                            {/* Customer info */}
                            <div className="p-3.5 rounded-2xl bg-[#32151F]/40 border border-[#B99A65]/20 text-xs">
                                <span className="text-[10px] uppercase font-bold text-[#B99A65]">Informasi Pelanggan:</span>
                                <p className="font-semibold text-white mt-1">
                                    {selectedOrderDetails.customer_name || 'Tamu Restoran'}
                                </p>
                                {selectedOrderDetails.customer_phone && (
                                    <p className="font-mono text-stone-300 text-[11px]">
                                        {selectedOrderDetails.customer_phone}
                                    </p>
                                )}
                            </div>

                            {/* Items list */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold text-[#B99A65]">Item Pesanan:</span>
                                {selectedOrderDetails.items?.map(it => (
                                    <div key={it.id} className="p-3 rounded-xl bg-[#1A1615] border border-[#32151F] text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white">
                                                {it.quantity}x {it.menu_name_snapshot}
                                            </span>
                                            <span className="font-mono font-bold text-[#D4B886]">
                                                {formatRupiah(it.subtotal)}
                                            </span>
                                        </div>
                                        {it.item_notes && (
                                            <p className="text-[11px] text-[#B99A65] italic mt-1">
                                                Request: "{it.item_notes}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Customer General Notes */}
                            {selectedOrderDetails.customer_notes && (
                                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                                    <strong>Catatan Meja:</strong> {selectedOrderDetails.customer_notes}
                                </div>
                            )}

                            {/* Rating if available */}
                            {selectedOrderDetails.rating && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs">
                                    <div className="flex items-center gap-1 text-amber-400 font-bold mb-1">
                                        {Array.from({ length: selectedOrderDetails.rating.rating }).map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                        ))}
                                        <span className="ml-1 text-white">Ulasan Tamu</span>
                                    </div>
                                    <p className="text-stone-300 italic">"{selectedOrderDetails.rating.review}"</p>
                                </div>
                            )}
                        </div>

                        {/* Drawer Bottom Controls */}
                        <div className="pt-4 border-t border-[#32151F] space-y-3">
                            <div className="flex justify-between font-bold text-sm text-[#D4B886]">
                                <span>Total Tagihan (PB1 11%)</span>
                                <span>{formatRupiah(selectedOrderDetails.total)}</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Preparing')}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase transition-all shadow"
                                >
                                    ACC Kasir & Masak
                                </button>
                                <button
                                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Ready')}
                                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase transition-all shadow"
                                >
                                    Siap Saji
                                </button>
                                <button
                                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'Served')}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase transition-all shadow"
                                >
                                    Selesai Terhidang
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: EDIT MENU STOCK & AVAILABILITY
            ======================================================== */}
            {editingMenuStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-md bg-[#211D1B] border border-[#B99A65]/40 rounded-3xl p-6 shadow-2xl text-[#F4EFE6]">
                        <button
                            onClick={() => setEditingMenuStock(null)}
                            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="font-heading text-2xl font-bold text-[#F4EFE6] mb-1">
                            Sesuaikan Stok Hidangan
                        </h3>
                        <p className="text-xs text-[#D4B886] mb-4">
                            {editingMenuStock.name}
                        </p>

                        <form onSubmit={handleSaveStock} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B99A65] mb-1.5">
                                    Jumlah Kuantitas Stok (Porsi):
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={newStockQuantity}
                                    onChange={(e) => setNewStockQuantity(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-[#F4EFE6] font-mono text-sm focus:outline-none focus:border-[#D4B886]"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    id="is_available_toggle"
                                    type="checkbox"
                                    checked={newIsAvailable}
                                    onChange={(e) => setNewIsAvailable(e.target.checked)}
                                    className="w-4 h-4 rounded bg-[#32151F] border-[#B99A65] text-[#B99A65] cursor-pointer"
                                />
                                <label htmlFor="is_available_toggle" className="text-xs text-[#F4EFE6] cursor-pointer">
                                    Menu Aktif & Dapat Dipesan Pelanggan
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold text-xs uppercase tracking-wider hover:shadow-xl transition-all"
                            >
                                Simpan Perubahan Stok
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
