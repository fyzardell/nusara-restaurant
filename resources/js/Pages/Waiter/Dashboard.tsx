import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import { 
    UtensilsCrossed, 
    CheckCircle2, 
    Clock, 
    Sparkles, 
    RefreshCw, 
    Users, 
    LogOut, 
    Check, 
    AlertCircle, 
    ChevronRight, 
    Flame, 
    QrCode, 
    Eye, 
    Search,
    SlidersHorizontal,
    Table as TableIcon,
    ArrowUpRight,
    Bell,
    CheckCheck,
    Coffee,
    HelpCircle,
    ChevronDown,
    MapPin,
    ShieldCheck,
    Phone
} from 'lucide-react';
import { RestaurantTable, WaiterMetrics, Order } from '../../types';

interface WaiterOrder extends Order {
    customer_name?: string;
    customer_phone?: string;
    table_number?: string;
    session_code?: string;
    table?: { id?: number; table_number?: string; location?: string } | null;
    customer?: { id?: number; name?: string; phone_normalized?: string; email?: string } | null;
}

interface Props {
    waiterUser: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    metrics: WaiterMetrics;
    readyOrders: WaiterOrder[];
    preparingOrders: WaiterOrder[];
    recentServedOrders: WaiterOrder[];
    tables: (RestaurantTable & { active_orders_count?: number })[];
    settings: any;
}

export default function WaiterDashboard({
    waiterUser,
    metrics,
    readyOrders = [],
    preparingOrders = [],
    recentServedOrders = [],
    tables = [],
    settings
}: Props) {
    // Active navigation tab matching App Shell 9 operational models
    const [activeTab, setActiveTab] = useState<'serve' | 'tables' | 'history'>('serve');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [servingOrderId, setServingOrderId] = useState<number | null>(null);
    const [cleaningTableId, setCleaningTableId] = useState<number | null>(null);
    const [tableFilter, setTableFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Manual Refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
    };

    // Logout with confirmation alert
    const handleLogout = () => {
        if (window.confirm('Konfirmasi Keluar: Apakah Anda yakin ingin mengakhiri sesi kerja Waiter? Pastikan seluruh pesanan siap saji telah dikoordinasikan.')) {
            router.post('/logout');
        }
    };

    // Format Rupiah
    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    // Action: Waiter Konfirmasi Makanan Tersaji ke Meja (Ready -> Served)
    const handleMarkServed = (orderId: number) => {
        setServingOrderId(orderId);
        router.post(`/waiter/order/${orderId}/serve`, {}, {
            preserveScroll: true,
            onFinish: () => setServingOrderId(null),
        });
    };

    // Action: Waiter Validasi Meja Ditempati (Pending Validation -> Occupied / Sesi Open)
    const handleValidateTable = (tableId: number) => {
        router.post(`/waiter/table/${tableId}/validate`, {}, {
            preserveScroll: true,
        });
    };

    // Action: Mulai Pembersihan Meja (Occupied -> Cleaning)
    const handleStartCleaning = (tableId: number) => {
        router.post(`/waiter/table/${tableId}/cleaning`, {}, {
            preserveScroll: true,
        });
    };

    // Action: Selesai Bersih & Reset Meja (Cleaning -> Available & Tutup Sesi)
    const handleFinishCleaning = (tableId: number) => {
        setCleaningTableId(tableId);
        router.post(`/waiter/table/${tableId}/available`, {}, {
            preserveScroll: true,
            onFinish: () => setCleaningTableId(null),
        });
    };

    // Filtered Tables
    const filteredTables = useMemo(() => {
        return tables.filter(t => {
            const matchFilter = tableFilter === 'all' || t.status.toLowerCase() === tableFilter.toLowerCase();
            const matchSearch = t.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.active_session?.session_code || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchFilter && matchSearch;
        });
    }, [tables, tableFilter, searchQuery]);

    // Filtered Ready Orders
    const filteredReadyOrders = useMemo(() => {
        if (!searchQuery) return readyOrders;
        const q = searchQuery.toLowerCase();
        return readyOrders.filter(o => 
            o.order_code.toLowerCase().includes(q) ||
            (o.table_number || o.table?.table_number || '').toLowerCase().includes(q) ||
            (o.customer_name || o.customer?.name || '').toLowerCase().includes(q)
        );
    }, [readyOrders, searchQuery]);

    return (
        <div className="min-h-screen bg-[#0E0D0C] text-[#F4EFE6] font-body flex flex-col lg:flex-row selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Stasiun Pelayanan Waiter — Layanan Meja & Saji NUSARA" />
            <FlashToast />

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
                                W
                            </div>
                            {!sidebarCollapsed && (
                                <div className="truncate">
                                    <h1 className="text-sm font-bold text-[#F4EFE6] tracking-wide truncate">
                                        Pramusaji Waiter
                                    </h1>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#B99A65] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>Layanan Meja Aktif</span>
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
                            setActiveTab('serve');
                            const readyEl = document.getElementById('ready-orders-section');
                            if (readyEl) readyEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full bg-[#F4EFE6] hover:bg-white text-[#211D1B] font-semibold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] text-xs"
                    >
                        <UtensilsCrossed className="w-4 h-4 text-[#32151F]" />
                        {!sidebarCollapsed && <span className="tracking-wide">Antar Sajian Siap Saji</span>}
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
                                onClick={() => setActiveTab('serve')}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                                    activeTab === 'serve'
                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm font-bold border border-[#B99A65]/40'
                                        : 'text-stone-400 hover:text-stone-200 hover:bg-[#241E1C]'
                                }`}
                                title="Pesanan Siap Saji"
                            >
                                <Bell className="w-3.5 h-3.5 mb-1 text-[#D4B886]" />
                                {!sidebarCollapsed && <span>Siap Saji</span>}
                                <span className="text-[9px] font-mono opacity-80 font-bold">{metrics.readyToServeOrders}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('tables')}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                                    activeTab === 'tables'
                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm font-bold border border-[#B99A65]/40'
                                        : 'text-stone-400 hover:text-stone-200 hover:bg-[#241E1C]'
                                }`}
                                title="Denah Seluruh Meja"
                            >
                                <TableIcon className="w-3.5 h-3.5 mb-1 text-[#D4B886]" />
                                {!sidebarCollapsed && <span>Meja</span>}
                                <span className="text-[9px] font-mono opacity-80 font-bold">{tables.length}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                                    activeTab === 'history'
                                        ? 'bg-[#32151F] text-[#D4B886] shadow-sm font-bold border border-[#B99A65]/40'
                                        : 'text-stone-400 hover:text-stone-200 hover:bg-[#241E1C]'
                                }`}
                                title="Riwayat Tersaji"
                            >
                                <Clock className="w-3.5 h-3.5 mb-1 text-[#D4B886]" />
                                {!sidebarCollapsed && <span>Riwayat</span>}
                                <span className="text-[9px] font-mono opacity-80 font-bold">{recentServedOrders.length}</span>
                            </button>
                        </div>
                    </div>

                    {/* App Shell 9: Pinned Items Section */}
                    {!sidebarCollapsed && (
                        <div className="space-y-1.5 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
                                Prioritas Langsung
                            </p>

                            {/* Pinned 1: Ready to Serve Orders */}
                            <div 
                                onClick={() => setActiveTab('serve')}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    metrics.readyToServeOrders > 0 
                                        ? 'bg-[#32151F]/60 border-[#B99A65]/50 hover:border-[#D4B886]' 
                                        : 'bg-[#1C1816] border-[#2C2421] opacity-70'
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#D4B886]" />
                                        <span>Siap Antar Meja</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B99A65]/20 text-[#D4B886] font-mono">
                                        {metrics.readyToServeOrders} order
                                    </span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1 truncate">
                                    {metrics.readyToServeOrders > 0 ? 'Segera antarkan sajian hangat ke meja' : 'Semua pesanan siap telah tersaji'}
                                </p>
                            </div>

                            {/* Pinned 2: Meja Pending Validation */}
                            <div 
                                onClick={() => { setActiveTab('tables'); setTableFilter('pending_validation'); }}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    metrics.pendingValidationTables > 0 
                                        ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-600' 
                                        : 'bg-[#1C1816] border-[#2C2421] opacity-70'
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Validasi Okupansi</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/50 text-amber-300 font-mono">
                                        {metrics.pendingValidationTables} meja
                                    </span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1 truncate">
                                    {metrics.pendingValidationTables > 0 ? 'Tamu memindai QR, butuh konfirmasi' : 'Tidak ada antrean validasi walk-in'}
                                </p>
                            </div>

                            {/* Pinned 3: Meja Perlu Pembersihan */}
                            <div 
                                onClick={() => { setActiveTab('tables'); setTableFilter('cleaning'); }}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    metrics.cleaningTables > 0 
                                        ? 'bg-blue-950/40 border-blue-800/60 hover:border-blue-600' 
                                        : 'bg-[#1C1816] border-[#2C2421] opacity-70'
                                }`}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Pembersihan Meja</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/50 text-blue-300 font-mono">
                                        {metrics.cleaningTables} meja
                                    </span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1 truncate">
                                    {metrics.cleaningTables > 0 ? 'Selesaikan pembersihan untuk tamu baru' : 'Seluruh meja bersih dan siap saji'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* App Shell 9: Recent Meja Quick List */}
                    {!sidebarCollapsed && (
                        <div className="space-y-1 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
                                Denah Meja Cepat
                            </p>
                            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                {tables.slice(0, 8).map((tbl) => (
                                    <button
                                        key={tbl.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab('tables');
                                            setSearchQuery(tbl.table_number);
                                        }}
                                        className="w-full flex items-center justify-between p-1.5 rounded-lg text-xs text-stone-300 hover:bg-[#211D1B] hover:text-[#D4B886] transition-colors text-left"
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <TableIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                            <span className="font-medium truncate">{tbl.table_number}</span>
                                        </span>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                            tbl.status === 'Available' ? 'bg-emerald-400' :
                                            tbl.status === 'Occupied' ? 'bg-rose-400' :
                                            tbl.status === 'Cleaning' ? 'bg-blue-400' :
                                            tbl.status === 'Reserved' ? 'bg-amber-400' : 'bg-stone-500'
                                        }`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Section: Waiter User Profile & Logout */}
                <div className="pt-3 border-t border-[#2C2421] space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] flex items-center justify-center font-bold text-xs shrink-0 shadow">
                                {waiterUser.name.charAt(0).toUpperCase()}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="truncate text-xs leading-tight">
                                    <p className="font-semibold text-stone-200 truncate">{waiterUser.name}</p>
                                    <p className="text-[10px] text-[#B99A65] truncate">Pramusaji On-Duty</p>
                                </div>
                            )}
                        </div>

                        {/* Logout Trigger with Alert Confirmation */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2 rounded-xl bg-[#211D1B] hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 border border-stone-800 transition-colors"
                            title="Keluar dari Sesi Waiter"
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
                            <span>Stasiun Pramusaji Utama</span>
                            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                        </div>
                    </div>

                    {/* Center: Official Logo (navbar/hero identity) */}
                    <div className="flex items-center justify-center">
                        <Link href="/waiter" className="inline-flex items-center gap-2 group">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA — Nusantara & Rasa" 
                                className="h-8 sm:h-9 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform" 
                            />
                        </Link>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#211D1B] hover:bg-[#32151F] text-stone-300 hover:text-[#D4B886] border border-stone-800 transition-all text-xs"
                            title="Segarkan data lantai & pesanan"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4B886]' : ''}`} />
                            <span className="hidden sm:inline">Segarkan Data</span>
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
                            <UtensilsCrossed className="w-7 h-7" />
                        </div>

                        {/* Title & Subtitle */}
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#F4EFE6] leading-tight">
                            Layanan Meja & Stasiun Pramusaji
                        </h2>
                        <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-lg mx-auto">
                            Pantau pesanan dapur, validasi kehadiran tamu meja walk-in, dan antarkan sajian siap saji secara tepat waktu.
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
                                    placeholder="Cari nomor meja (cth: Meja 03), kode pesanan, atau menu..."
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
                        {/* Card 1: Antar Makanan Ready */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('serve');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                activeTab === 'serve' 
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] flex items-center justify-center">
                                    <UtensilsCrossed className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-[#D4B886] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                    Antar Sajian Ready
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {metrics.readyToServeOrders} Pesanan Siap Saji
                                </p>
                            </div>
                        </button>

                        {/* Card 2: Validasi Meja Tamu */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('tables');
                                setTableFilter('pending_validation');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                activeTab === 'tables' && tableFilter === 'pending_validation'
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-amber-400 transition-colors">
                                    Validasi Tamu Walk-in
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {metrics.pendingValidationTables} Meja Menunggu
                                </p>
                            </div>
                        </button>

                        {/* Card 3: Pembersihan Meja Selesai Santap */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('tables');
                                setTableFilter('cleaning');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                activeTab === 'tables' && tableFilter === 'cleaning'
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-blue-400 transition-colors">
                                    Pembersihan Meja
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {metrics.cleaningTables} Meja Perlu Bersih
                                </p>
                            </div>
                        </button>

                        {/* Card 4: Denah Meja & Okupansi */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('tables');
                                setTableFilter('all');
                                setSearchQuery('');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                                activeTab === 'tables' && tableFilter === 'all'
                                    ? 'bg-[#32151F]/80 border-[#D4B886] shadow-lg' 
                                    : 'bg-[#141110] border-[#2C2421] hover:border-[#B99A65]/50 hover:bg-[#1C1816]'
                            }`}
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                                    <TableIcon className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xs text-[#F4EFE6] group-hover:text-emerald-400 transition-colors">
                                    Denah Lantai Restoran
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-1 font-mono">
                                    {metrics.occupiedTables} Terisi / {tables.length} Total
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* ========================================================
                        TAB WORKSPACE FEEDS
                    ======================================================== */}
                    {/* TAB 1: PESANAN SIAP SAJI (SERVE QUEUE) */}
                    {activeTab === 'serve' && (
                        <div id="ready-orders-section" className="space-y-6 animate-in fade-in duration-300">
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2C2421]">
                                <div>
                                    <h3 className="font-heading text-xl font-bold text-[#F4EFE6] flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#D4B886]" />
                                        <span>Pesanan Siap Saji ({filteredReadyOrders.length})</span>
                                    </h3>
                                    <p className="text-xs text-stone-400 mt-0.5">
                                        Makanan telah selesai diracik oleh dapur dan siap diantarkan ke meja tamu.
                                    </p>
                                </div>
                            </div>

                            {/* Ready Orders Grid */}
                            {filteredReadyOrders.length === 0 ? (
                                <div className="p-12 text-center rounded-3xl bg-[#141110] border border-[#2C2421]">
                                    <CheckCircle2 className="w-12 h-12 text-[#D4B886]/60 mx-auto mb-3" />
                                    <h4 className="font-heading text-lg font-bold text-stone-200">
                                        Tidak Ada Pesanan Menunggu Diantar
                                    </h4>
                                    <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                                        Seluruh sajian siap saji telah berhasil diantarkan ke meja tamu.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredReadyOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="p-5 rounded-2xl bg-[#141110] border border-[#B99A65]/40 hover:border-[#D4B886] shadow-xl flex flex-col justify-between transition-all"
                                        >
                                            {/* Order Card Top Info */}
                                            <div>
                                                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                                                    <div>
                                                        <span className="text-xs font-mono font-bold text-[#D4B886]">
                                                            {order.order_code}
                                                        </span>
                                                        <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5 text-stone-400" />
                                                            <span>{order.customer_name || order.customer?.name || 'Tamu Dine-in'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Table Badge */}
                                                    <div className="px-3 py-1 rounded-xl bg-[#32151F] border border-[#B99A65]/60 text-center">
                                                        <span className="text-[10px] text-[#B99A65] uppercase font-bold block">
                                                            Antar Ke
                                                        </span>
                                                        <span className="font-heading font-bold text-base text-[#F4EFE6] leading-none">
                                                            {order.table_number || order.table?.table_number || 'Meja Walk-in'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Items List */}
                                                <div className="py-3 space-y-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                                        Daftar Sajian:
                                                    </p>
                                                    <ul className="space-y-1.5">
                                                        {order.items?.map((item, idx) => (
                                                            <li key={idx} className="flex items-start justify-between text-xs text-stone-300">
                                                                <span className="leading-snug">
                                                                    <strong className="text-[#D4B886] font-mono mr-1.5">{item.quantity}x</strong>
                                                                    {item.menu_name_snapshot}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    {/* Customer Notes if any */}
                                                    {order.customer_notes && (
                                                        <div className="mt-2.5 p-2 rounded-lg bg-[#211D1B] border border-amber-900/40 text-[11px] text-amber-300">
                                                            <strong>Catatan:</strong> {order.customer_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button: Konfirmasi Tersaji */}
                                            <div className="pt-3 border-t border-stone-800">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkServed(order.id)}
                                                    disabled={servingOrderId === order.id}
                                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#B99A65]/20 disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    <span>{servingOrderId === order.id ? 'Memproses...' : 'Konfirmasi Tersaji (Served)'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Section: Pesanan Sedang Dimasak di Dapur */}
                            <div className="pt-8 border-t border-[#2C2421]">
                                <h3 className="font-heading text-lg font-bold text-stone-300 flex items-center gap-2 mb-3">
                                    <Flame className="w-4 h-4 text-amber-500" />
                                    <span>Sedang Dimasak di Dapur ({preparingOrders.length})</span>
                                </h3>

                                {preparingOrders.length === 0 ? (
                                    <p className="text-xs text-stone-400 italic">Tidak ada antrean masakan yang sedang diproses dapur.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {preparingOrders.map((ord) => (
                                            <div key={ord.id} className="p-3.5 rounded-xl bg-[#141110] border border-stone-800 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-[11px] text-amber-400 font-bold">{ord.order_code}</span>
                                                    <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900/60 text-[10px] text-amber-300">
                                                        {ord.table_number || ord.table?.table_number || 'Dine-in'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-400 mt-2 truncate">
                                                    {ord.items?.map(it => `${it.quantity}x ${it.menu_name_snapshot}`).join(', ')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: MANAJEMEN DENAH MEJA */}
                    {activeTab === 'tables' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Table Filter Tabs */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2C2421]">
                                <div>
                                    <h3 className="font-heading text-xl font-bold text-[#F4EFE6] flex items-center gap-2">
                                        <TableIcon className="w-5 h-5 text-[#D4B886]" />
                                        <span>Denah Lantai Restoran ({filteredTables.length} Meja)</span>
                                    </h3>
                                    <p className="text-xs text-stone-400 mt-0.5">
                                        Kelola status meja, validasi tamu walk-in, dan pastikan meja siap digunakan kembali.
                                    </p>
                                </div>

                                {/* Filter Buttons */}
                                <div className="flex items-center gap-1 bg-[#1C1816] p-1 rounded-xl border border-stone-800 text-xs">
                                    {['all', 'pending_validation', 'available', 'occupied', 'cleaning', 'reserved'].map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => setTableFilter(f)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                tableFilter === f
                                                    ? 'bg-[#32151F] text-[#D4B886] font-bold border border-[#B99A65]/40 shadow-sm'
                                                    : 'text-stone-400 hover:text-stone-200'
                                            }`}
                                        >
                                            {f === 'all' && 'Semua'}
                                            {f === 'pending_validation' && 'Perlu Validasi'}
                                            {f === 'available' && 'Kosong'}
                                            {f === 'occupied' && 'Terisi'}
                                            {f === 'cleaning' && 'Pembersihan'}
                                            {f === 'reserved' && 'Reservasi'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tables Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredTables.map((tbl) => {
                                    const isPending = tbl.status.toLowerCase() === 'pending_validation';
                                    const isOccupied = tbl.status.toLowerCase() === 'occupied';
                                    const isCleaning = tbl.status.toLowerCase() === 'cleaning';
                                    const isAvailable = tbl.status.toLowerCase() === 'available';
                                    const isReserved = tbl.status.toLowerCase() === 'reserved';

                                    return (
                                        <div
                                            key={tbl.id}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                                isPending
                                                    ? 'bg-amber-950/30 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                                                    : isOccupied
                                                    ? 'bg-[#1C1816] border-rose-900/50'
                                                    : isCleaning
                                                    ? 'bg-blue-950/20 border-blue-800/60'
                                                    : isAvailable
                                                    ? 'bg-[#141110] border-emerald-900/40'
                                                    : 'bg-[#141110] border-stone-800'
                                            }`}
                                        >
                                            <div>
                                                {/* Header Table Info */}
                                                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                                                    <div>
                                                        <h4 className="font-heading font-bold text-lg text-[#F4EFE6]">
                                                            {tbl.table_number}
                                                        </h4>
                                                        <span className="text-[10px] text-stone-400">
                                                            Kapasitas {tbl.capacity} Kursi · {tbl.location || 'Lantai 1'}
                                                        </span>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        isAvailable ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                                        isOccupied ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                                        isCleaning ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse' :
                                                        isPending ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse font-extrabold' :
                                                        isReserved ? 'bg-amber-900 text-amber-200 border border-amber-700' :
                                                        'bg-stone-800 text-stone-300'
                                                    }`}>
                                                        {isPending ? 'Perlu Validasi' : tbl.status}
                                                    </span>
                                                </div>

                                                {/* Active Session Info */}
                                                <div className="py-2.5 space-y-1 text-xs text-stone-400">
                                                    {tbl.active_session ? (
                                                        <div className="p-2 rounded-lg bg-[#211D1B] border border-stone-800 text-[11px]">
                                                            <div className="flex items-center justify-between text-stone-300 font-mono">
                                                                <span>Sesi: {tbl.active_session.session_code}</span>
                                                                <span className="text-emerald-400 font-bold">{tbl.active_session.status}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] italic text-stone-500">Tidak ada sesi aktif</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons for Waiter */}
                                            <div className="pt-3 border-t border-stone-800 space-y-2">
                                                {/* If Pending Validation -> Button Konfirmasi Tamu Duduk */}
                                                {isPending && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleValidateTable(tbl.id)}
                                                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        <span>Validasi Tamu Duduk</span>
                                                    </button>
                                                )}

                                                {/* If Occupied -> Button Mulai Pembersihan */}
                                                {isOccupied && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartCleaning(tbl.id)}
                                                        className="w-full py-2 px-3 rounded-xl bg-[#211D1B] hover:bg-blue-950/60 text-blue-300 border border-blue-900/60 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>Mulai Bersihkan Meja</span>
                                                    </button>
                                                )}

                                                {/* If Cleaning -> Button Selesai Bersih & Available */}
                                                {isCleaning && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFinishCleaning(tbl.id)}
                                                        disabled={cleaningTableId === tbl.id}
                                                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                                                    >
                                                        <CheckCheck className="w-4 h-4" />
                                                        <span>{cleaningTableId === tbl.id ? 'Memproses...' : 'Selesai Bersih (Available)'}</span>
                                                    </button>
                                                )}

                                                {/* If Available -> Label Status */}
                                                {isAvailable && (
                                                    <div className="text-center py-1 text-[11px] text-emerald-400 font-medium flex items-center justify-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Meja Bersih & Siap Digunakan</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: RIWAYAT SAJIAN TERSAJI HARI INI */}
                    {activeTab === 'history' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="pb-3 border-b border-[#2C2421]">
                                <h3 className="font-heading text-xl font-bold text-[#F4EFE6] flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-[#D4B886]" />
                                    <span>Riwayat Pesanan Berhasil Tersaji Hari Ini ({recentServedOrders.length})</span>
                                </h3>
                                <p className="text-xs text-stone-400 mt-0.5">
                                    Catatan audit pesanan dine-in yang telah selesai diantarkan pramusaji.
                                </p>
                            </div>

                            {recentServedOrders.length === 0 ? (
                                <div className="p-12 text-center rounded-3xl bg-[#141110] border border-[#2C2421]">
                                    <Clock className="w-10 h-10 text-stone-500 mx-auto mb-2" />
                                    <p className="text-xs text-stone-400">Belum ada catatan sajian tersaji pada sesi operasional ini.</p>
                                </div>
                            ) : (
                                <div className="rounded-2xl bg-[#141110] border border-stone-800 overflow-hidden shadow-lg">
                                    <div className="divide-y divide-stone-800">
                                        {recentServedOrders.map((ord) => (
                                            <div key={ord.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-[#D4B886]">{ord.order_code}</span>
                                                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                                                            TERSAJI
                                                        </span>
                                                        <span className="text-stone-400 font-semibold">
                                                            {ord.table_number || ord.table?.table_number || 'Meja Dine-in'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-stone-400 mt-1">
                                                        {ord.items?.map(i => `${i.quantity}x ${i.menu_name_snapshot}`).join(', ')}
                                                    </p>
                                                </div>

                                                <div className="text-right text-stone-400 text-[11px]">
                                                    <span className="font-mono font-bold text-stone-200 block">
                                                        {formatRupiah(ord.total)}
                                                    </span>
                                                    <span>{ord.customer_name || ord.customer?.name || 'Pelanggan'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
