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
    Table as TableIcon
} from 'lucide-react';
import { RestaurantTable, WaiterMetrics, Order, OrderItem } from '../../types';

interface WaiterOrder extends Order {
    customer_phone?: string;
    session_code?: string;
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
    const [activeTab, setActiveTab] = useState<'serve' | 'tables' | 'history'>('serve');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [servingOrderId, setServingOrderId] = useState<number | null>(null);
    const [cleaningTableId, setCleaningTableId] = useState<number | null>(null);
    const [tableFilter, setTableFilter] = useState<string>('all');
    const [searchTableQuery, setSearchTableQuery] = useState<string>('');

    // Handle Manual Refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
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

    // Simulasi Tamu Scan QR
    const handleSimulateScan = (tableId: number) => {
        router.post(`/waiter/table/${tableId}/request-occupancy`, {}, {
            preserveScroll: true,
        });
    };

    // Filtered Tables
    const filteredTables = useMemo(() => {
        return tables.filter(t => {
            const matchFilter = tableFilter === 'all' || t.status.toLowerCase() === tableFilter.toLowerCase();
            const matchSearch = t.table_number.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
                (t.active_session?.session_code || '').toLowerCase().includes(searchTableQuery.toLowerCase());
            return matchFilter && matchSearch;
        });
    }, [tables, tableFilter, searchTableQuery]);

    return (
        <div className="min-h-screen bg-[#141110] text-[#F4EFE6] font-sans selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Waiter Station — Layanan Meja & Saji NUSARA" />
            <FlashToast />

            {/* ========================================================
                TOP HEADER: BRAND, WAITER ROLE & QUICK ACTIONS
            ======================================================== */}
            <header className="sticky top-0 z-40 bg-[#1C1816] border-b border-[#2C2421] shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
                    {/* Brand & Sub-role */}
                    <div className="flex items-center gap-3">
                        <Link href="/waiter" className="flex items-center gap-2.5">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA" 
                                className="h-7 sm:h-8 w-auto object-contain"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                            <div>
                                <span className="font-heading tracking-[0.16em] text-sm sm:text-base font-bold text-[#F4EFE6] block leading-none">
                                    NUSARA
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-semibold text-[#D4B886] tracking-wider uppercase">
                                    Staf Waiter · Layanan Meja
                                </span>
                            </div>
                        </Link>

                        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[10px] text-[#D4B886] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Station Aktif</span>
                        </div>
                    </div>

                    {/* Waiter Profile & Action Controls */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Tombol Refresh Live Floor */}
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#241E1C] border border-stone-800 text-stone-300 hover:text-[#D4B886] hover:border-[#B99A65]/50 transition-all text-xs flex items-center gap-1.5"
                            title="Segarkan data lantai & pesanan"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4B886]' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        {/* Profil Waiter */}
                        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-800">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#B99A65] to-[#D4B886] text-[#211D1B] flex items-center justify-center font-bold text-xs">
                                {waiterUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left text-xs leading-tight">
                                <p className="font-semibold text-stone-200 truncate max-w-[120px]">{waiterUser.name}</p>
                                <p className="text-[10px] text-[#B99A65]">Waiter On-Duty</p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            className="p-2 rounded-xl bg-[#241E1C] border border-stone-800 text-stone-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all text-xs"
                            title="Keluar / Logout Akun"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ========================================================
                MAIN CONTENT: OPERATIONAL METRICS & WORK QUEUE
            ======================================================== */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* 1. ROW METRIK OPERASIONAL WAITER (6 STATS) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Stat 1: Siap Saji (Ready) */}
                    <div className="p-3.5 rounded-2xl bg-[#1C1816] border border-[#B99A65]/40 shadow-md relative overflow-hidden">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="font-medium text-[11px]">Siap Saji</span>
                            <Sparkles className="w-4 h-4 text-[#D4B886]" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-2xl font-bold font-mono ${metrics.readyToServeOrders > 0 ? 'text-[#D4B886] animate-pulse' : 'text-stone-300'}`}>
                                {metrics.readyToServeOrders}
                            </span>
                            <span className="text-[10px] text-stone-400">Pesanan</span>
                        </div>
                    </div>

                    {/* Stat 2: Perlu Validasi Okupansi */}
                    <div className="p-3.5 rounded-2xl bg-[#1C1816] border border-stone-800 shadow-md">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="font-medium text-[11px]">Validasi Tamu</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-2xl font-bold font-mono ${metrics.pendingValidationTables > 0 ? 'text-amber-400 animate-pulse' : 'text-stone-300'}`}>
                                {metrics.pendingValidationTables}
                            </span>
                            <span className="text-[10px] text-stone-400">Meja</span>
                        </div>
                    </div>

                    {/* Stat 3: Meja Ditempati (Occupied) */}
                    <div className="p-3.5 rounded-2xl bg-[#1C1816] border border-stone-800 shadow-md">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="font-medium text-[11px]">Meja Terisi</span>
                            <Users className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono text-stone-200">
                                {metrics.occupiedTables}
                            </span>
                            <span className="text-[10px] text-stone-400">/ 10 Meja</span>
                        </div>
                    </div>

                    {/* Stat 4: Perlu Dibersihkan (Cleaning) */}
                    <div className="p-3.5 rounded-2xl bg-[#1C1816] border border-stone-800 shadow-md">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="font-medium text-[11px]">Perlu Bersih</span>
                            <AlertCircle className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-2xl font-bold font-mono ${metrics.cleaningTables > 0 ? 'text-sky-400' : 'text-stone-300'}`}>
                                {metrics.cleaningTables}
                            </span>
                            <span className="text-[10px] text-stone-400">Meja</span>
                        </div>
                    </div>

                    {/* Stat 5: Meja Siap (Available) */}
                    <div className="p-3.5 rounded-2xl bg-[#1C1816] border border-stone-800 shadow-md">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="font-medium text-[11px]">Meja Siap</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono text-emerald-400">
                                {metrics.availableTables}
                            </span>
                            <span className="text-[10px] text-stone-400">Available</span>
                        </div>
                    </div>

                    {/* Stat 6: Tersaji Hari Ini */}
                    <div className="p-3.5 rounded-2xl bg-[#1C1816] border border-stone-800 shadow-md">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="font-medium text-[11px]">Tersaji Hari Ini</span>
                            <UtensilsCrossed className="w-4 h-4 text-[#B99A65]" />
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono text-[#D4B886]">
                                {metrics.servedToday}
                            </span>
                            <span className="text-[10px] text-stone-400">Selesai</span>
                        </div>
                    </div>
                </div>

                {/* 2. ALERT BANNER: MEJA MENUNGGU VALIDASI OKUPANSI (PRD SECTION 4.1 & 6.1) */}
                {metrics.pendingValidationTables > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-bold text-amber-200">
                                    {metrics.pendingValidationTables} Meja Menunggu Konfirmasi Okupansi!
                                </h3>
                                <p className="text-[11px] text-amber-300/80">
                                    Tamu telah memindai QR meja. Mohon pastikan tamu benar-benar telah menempati meja sebelum membuka sesi.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveTab('tables')}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-[#211D1B] font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all self-start sm:self-auto shrink-0 shadow"
                        >
                            Periksa Denah Meja
                        </button>
                    </div>
                )}

                {/* 3. TAB NAVIGATION */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('serve')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                activeTab === 'serve'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] border-[#D4B886] shadow'
                                    : 'bg-[#1C1816] text-stone-400 border-stone-800 hover:text-stone-200'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Antrean Saji ({metrics.readyToServeOrders})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('tables')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                activeTab === 'tables'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] border-[#D4B886] shadow'
                                    : 'bg-[#1C1816] text-stone-400 border-stone-800 hover:text-stone-200'
                            }`}
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                            <span>Denah 10 Meja ({tables.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                activeTab === 'history'
                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] border-[#D4B886] shadow'
                                    : 'bg-[#1C1816] text-stone-400 border-stone-800 hover:text-stone-200'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tersaji Hari Ini ({metrics.servedToday})</span>
                        </button>
                    </div>

                    <span className="hidden md:inline-block text-[11px] text-stone-400 font-mono">
                        {settings?.restaurant_name || 'NUSARA Resto'} · Single Branch
                    </span>
                </div>

                {/* ========================================================
                    TAB 1: ANTREAN HIDANGAN SIAP SAJI (READY TO SERVE)
                ======================================================== */}
                {activeTab === 'serve' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Column: Hidangan Siap Disajikan (2 Cols) */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-heading text-lg sm:text-xl font-bold text-[#F4EFE6]">
                                        Hidangan Siap Saji (Ready to Deliver)
                                    </h2>
                                    <p className="text-xs text-stone-400">
                                        Makanan telah selesai dimasak dapur. Ambil dari pass dapur dan antarkan ke meja tamu.
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] text-xs font-bold font-mono">
                                    {readyOrders.length} Siap
                                </span>
                            </div>

                            {readyOrders.length === 0 ? (
                                <div className="p-10 rounded-2xl bg-[#1C1816] border border-dashed border-stone-800 text-center space-y-2">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-sm text-stone-200">Semua Hidangan Telah Disajikan</h3>
                                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                                        Tidak ada pesanan Dine-in yang sedang menunggu disajikan saat ini. Anda dapat memeriksa proses memasak dapur di kolom samping.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {readyOrders.map(order => (
                                        <div 
                                            key={order.id}
                                            className="p-5 rounded-2xl bg-[#1C1816] border border-[#B99A65]/50 shadow-xl space-y-4 relative overflow-hidden"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                                                <div className="flex items-center gap-3">
                                                    {/* Table Badge Callout */}
                                                    <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-black text-base shadow flex items-center gap-1.5">
                                                        <UtensilsCrossed className="w-4 h-4" />
                                                        <span>{order.table_number}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[#F4EFE6] leading-tight">
                                                            {order.customer_name || 'Tamu Restoran'}
                                                        </p>
                                                        <p className="text-[11px] text-stone-400 font-mono">
                                                            Order #{order.order_code} · {order.session_code ? `Sesi ${order.session_code}` : 'Dine-In'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>Siap Disajikan</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Rincian Menu Yang Perlu Diantar */}
                                            <div className="space-y-2 bg-[#141110] p-3.5 rounded-xl border border-stone-800">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4B886]">
                                                    Daftar Menu Hidangan:
                                                </p>
                                                <ul className="space-y-1.5 divide-y divide-stone-800/60">
                                                    {(order.items || []).map((item, idx) => (
                                                        <li key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 text-xs">
                                                            <div className="space-y-0.5">
                                                                <span className="font-semibold text-stone-200">
                                                                    <strong className="text-[#D4B886] font-mono mr-1.5">{item.quantity}x</strong>
                                                                    {item.menu_name_snapshot}
                                                                </span>
                                                                {item.item_notes && (
                                                                    <p className="text-[11px] text-amber-300/90 italic pl-5">
                                                                        Catatan: "{item.item_notes}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Catatan Keseluruhan Tamu */}
                                            {order.customer_notes && (
                                                <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-300">
                                                    <span className="text-[#D4B886] font-bold">Catatan Khusus Tamu:</span> {order.customer_notes}
                                                </div>
                                            )}

                                            {/* Tombol Aksi Waiter: Konfirmasi Tersaji */}
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-xs text-stone-400 font-mono">
                                                    Total: {formatRupiah(order.total)}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkServed(order.id)}
                                                    disabled={servingOrderId === order.id}
                                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4 stroke-[3]" />
                                                    <span>{servingOrderId === order.id ? 'Memproses...' : 'Konfirmasi Tersaji ke Meja'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Side Column: Dalam Proses Masak Dapur (Up Next Preview) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-heading text-base font-bold text-[#F4EFE6]">
                                        Sedang Dimasak Dapur
                                    </h3>
                                    <p className="text-[11px] text-stone-400">
                                        Disiapkan dapur, segera siap saji berikutnya.
                                    </p>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-400 text-xs font-mono font-bold">
                                    {preparingOrders.length} Masak
                                </span>
                            </div>

                            {preparingOrders.length === 0 ? (
                                <div className="p-6 rounded-2xl bg-[#1C1816] border border-stone-800 text-center text-xs text-stone-400">
                                    Tidak ada hidangan yang sedang dimasak saat ini.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {preparingOrders.map(order => (
                                        <div 
                                            key={order.id}
                                            className="p-3.5 rounded-xl bg-[#1C1816] border border-stone-800 space-y-2 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-[#D4B886] font-mono">
                                                    {order.table_number}
                                                </span>
                                                <span className="px-2 py-0.5 rounded bg-orange-950/50 text-orange-300 text-[10px] font-semibold flex items-center gap-1">
                                                    <Flame className="w-3 h-3 text-orange-400" />
                                                    <span>Memasak</span>
                                                </span>
                                            </div>
                                            <p className="text-stone-300 font-medium">
                                                {order.customer_name || 'Tamu Meja'} · Order #{order.order_code}
                                            </p>
                                            <div className="text-[11px] text-stone-400 space-y-0.5">
                                                {(order.items || []).map((itm, i) => (
                                                    <p key={i} className="truncate">
                                                        • {itm.quantity}x {itm.menu_name_snapshot}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 2: DENAH 10 MEJA & KONTROL SESI (PRD SECTION 6.1 & 6.2)
                ======================================================== */}
                {activeTab === 'tables' && (
                    <div className="space-y-4">
                        {/* Filters & Floor Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1C1816] p-4 rounded-2xl border border-stone-800">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                                {[
                                    { id: 'all', label: 'Semua Meja' },
                                    { id: 'available', label: 'Available (Siap)' },
                                    { id: 'pending validation', label: 'Perlu Validasi' },
                                    { id: 'occupied', label: 'Occupied (Terisi)' },
                                    { id: 'cleaning', label: 'Cleaning (Bersih)' }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setTableFilter(f.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                                            tableFilter === f.id
                                                ? 'bg-[#B99A65]/20 border-[#D4B886] text-[#D4B886]'
                                                : 'bg-[#241E1C] border-stone-800 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full sm:w-60">
                                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchTableQuery}
                                    onChange={(e) => setSearchTableQuery(e.target.value)}
                                    placeholder="Cari nomor meja / kode sesi..."
                                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#241E1C] border border-stone-800 text-xs text-[#F4EFE6] placeholder-stone-500 focus:outline-none focus:border-[#B99A65]"
                                />
                            </div>
                        </div>

                        {/* Grid 10 Meja Restoran (2x5 atau 5x2) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {filteredTables.map(tbl => {
                                const isPending = tbl.status === 'Pending Validation';
                                const isOccupied = tbl.status === 'Occupied';
                                const isCleaning = tbl.status === 'Cleaning';
                                const isAvailable = tbl.status === 'Available';

                                return (
                                    <div
                                        key={tbl.id}
                                        className={`p-4 rounded-2xl border transition-all shadow-md space-y-3 relative flex flex-col justify-between ${
                                            isPending
                                                ? 'bg-amber-950/30 border-amber-500/70 shadow-amber-900/20 animate-pulse'
                                                : isOccupied
                                                    ? 'bg-[#231A19] border-[#B99A65]/50'
                                                    : isCleaning
                                                        ? 'bg-sky-950/30 border-sky-500/50'
                                                        : 'bg-[#1C1816] border-stone-800'
                                        }`}
                                    >
                                        {/* Header Meja */}
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-heading text-lg font-bold text-[#F4EFE6]">
                                                    {tbl.table_number}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                                    isPending
                                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                                        : isOccupied
                                                            ? 'bg-rose-950/60 text-rose-300 border-rose-600/40'
                                                            : isCleaning
                                                                ? 'bg-sky-950/60 text-sky-300 border-sky-600/40'
                                                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                                                }`}>
                                                    {tbl.status}
                                                </span>
                                            </div>

                                            <div className="mt-2 text-[11px] text-stone-400 space-y-1">
                                                <p className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-[#B99A65]" />
                                                    <span>Kapasitas {tbl.capacity} Kursi</span>
                                                </p>
                                                {tbl.active_session && (
                                                    <p className="flex items-center gap-1 text-[#D4B886] font-mono text-[10px]">
                                                        <QrCode className="w-3 h-3" />
                                                        <span>{tbl.active_session.session_code}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Aksi Operasional Sesuai Status Meja */}
                                        <div className="pt-2 border-t border-stone-800/80 space-y-2">
                                            {isPending && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleValidateTable(tbl.id)}
                                                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#211D1B] font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                                                >
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    <span>Validasi Ditempati</span>
                                                </button>
                                            )}

                                            {isOccupied && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartCleaning(tbl.id)}
                                                    className="w-full py-2 rounded-xl bg-sky-900/60 hover:bg-sky-800/80 text-sky-200 border border-sky-600/40 font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    <span>Tamu Selesai (Bersihkan)</span>
                                                </button>
                                            )}

                                            {isCleaning && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFinishCleaning(tbl.id)}
                                                    disabled={cleaningTableId === tbl.id}
                                                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                                    <span>{cleaningTableId === tbl.id ? 'Memproses...' : 'Selesai Bersih (Available)'}</span>
                                                </button>
                                            )}

                                            {isAvailable && (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleValidateTable(tbl.id)}
                                                        className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-[#32151F] text-stone-300 hover:text-[#D4B886] font-semibold text-[10px] transition-colors"
                                                        title="Buka sesi manual untuk tamu walk-in"
                                                    >
                                                        Buka Meja Tamu
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSimulateScan(tbl.id)}
                                                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-950/50 text-stone-400 hover:text-amber-300 text-[10px] transition-colors"
                                                        title="Tes: Simulasi Tamu Scan QR"
                                                    >
                                                        <QrCode className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 3: RIWAYAT TERSAJI HARI INI
                ======================================================== */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-heading text-lg sm:text-xl font-bold text-[#F4EFE6]">
                                    Riwayat Hidangan Tersaji Hari Ini
                                </h2>
                                <p className="text-xs text-stone-400">
                                    Daftar pesanan Dine-in yang telah sukses diantarkan oleh staf waiter hari ini.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                                {recentServedOrders.length} Pesanan
                            </span>
                        </div>

                        {recentServedOrders.length === 0 ? (
                            <div className="p-10 rounded-2xl bg-[#1C1816] border border-stone-800 text-center text-xs text-stone-400">
                                Belum ada hidangan yang tercatat tersaji hari ini.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {recentServedOrders.map(order => (
                                    <div 
                                        key={order.id}
                                        className="p-4 rounded-2xl bg-[#1C1816] border border-stone-800 space-y-2.5 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-[#D4B886]">
                                                {order.table_number}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 text-[10px] font-bold">
                                                Tersaji
                                            </span>
                                        </div>

                                        <p className="text-xs font-semibold text-stone-200">
                                            {order.customer_name || 'Tamu Restoran'}
                                        </p>

                                        <div className="text-[11px] text-stone-400 space-y-0.5 pt-1 border-t border-stone-800">
                                            {(order.items || []).map((itm, i) => (
                                                <p key={i} className="truncate">
                                                    • {itm.quantity}x {itm.menu_name_snapshot}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="text-[10px] text-stone-500 font-mono pt-1 flex justify-between">
                                            <span>Order #{order.order_code}</span>
                                            <span>{formatRupiah(order.total)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
