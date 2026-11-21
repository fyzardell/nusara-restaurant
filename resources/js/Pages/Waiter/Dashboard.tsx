import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import FlashToast from '../../Components/FlashToast';
import CircularFloorPlan from '../../Components/CircularFloorPlan';
import OperationalChatModal from '../../Components/OperationalChatModal';
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
    ChevronLeft, 
    Flame, 
    QrCode, 
    Search,
    Table as TableIcon,
    ArrowRight,
    Bell,
    CheckCheck,
    PanelRightClose,
    PanelRight,
    Menu as MenuIcon,
    X,
    Store,
    ShoppingBag,
    MapPin,
    ExternalLink,
    MessageSquare
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
    reservations?: any[];
    chatMessages?: any[];
    unreadChatCount?: number;
    settings: any;
}

export type WaiterTab = 'serve' | 'tables' | 'kitchen' | 'history';

export default function WaiterDashboard({
    waiterUser,
    metrics,
    readyOrders = [],
    preparingOrders = [],
    recentServedOrders = [],
    tables = [],
    reservations = [],
    chatMessages = [],
    unreadChatCount = 0,
    settings
}: Props) {
    // App Shell 4 Layout State
    const [activeTab, setActiveTab] = useState<WaiterTab>('serve');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

    // Operational Action States
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [servingOrderId, setServingOrderId] = useState<number | null>(null);
    const [cleaningTableId, setCleaningTableId] = useState<number | null>(null);
    const [tableFilter, setTableFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Calendar state for Right Schedule Panel
    const today = useMemo(() => new Date(), []);
    const [currentCalMonth, setCurrentCalMonth] = useState<number>(today.getMonth());
    const [currentCalYear, setCurrentCalYear] = useState<number>(today.getFullYear());
    const [selectedCalDate, setSelectedCalDate] = useState<Date>(today);

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
        const normalize = (s?: string) => (s || '').toLowerCase().replace(/[\s_-]+/g, '');
        return tables.filter(t => {
            const matchFilter = tableFilter === 'all' || normalize(t.status) === normalize(tableFilter);
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

    // Filtered Preparing Orders
    const filteredPreparingOrders = useMemo(() => {
        if (!searchQuery) return preparingOrders;
        const q = searchQuery.toLowerCase();
        return preparingOrders.filter(o => 
            o.order_code.toLowerCase().includes(q) ||
            (o.table_number || o.table?.table_number || '').toLowerCase().includes(q) ||
            (o.customer_name || o.customer?.name || '').toLowerCase().includes(q)
        );
    }, [preparingOrders, searchQuery]);

    // Filtered History Orders
    const filteredHistoryOrders = useMemo(() => {
        if (!searchQuery) return recentServedOrders;
        const q = searchQuery.toLowerCase();
        return recentServedOrders.filter(o => 
            o.order_code.toLowerCase().includes(q) ||
            (o.table_number || o.table?.table_number || '').toLowerCase().includes(q) ||
            (o.customer_name || o.customer?.name || '').toLowerCase().includes(q)
        );
    }, [recentServedOrders, searchQuery]);

    // Calendar generation for App Shell 4 right schedule
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentCalYear, currentCalMonth, 1).getDay();
        const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentCalYear, currentCalMonth, 0).getDate();

        const days = [];
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: daysInPrevMonth - i,
                isCurrentMonth: false,
                date: new Date(currentCalYear, currentCalMonth - 1, daysInPrevMonth - i)
            });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(currentCalYear, currentCalMonth, i)
            });
        }
        const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length);
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(currentCalYear, currentCalMonth + 1, i)
            });
        }
        return days;
    }, [currentCalYear, currentCalMonth]);

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Priority Action Lists for Right Inspector Panel
    const pendingValidationTablesList = useMemo(() => {
        return tables.filter(t => t.status.toLowerCase() === 'pending_validation' || t.status.toLowerCase() === 'pending validation');
    }, [tables]);

    const cleaningTablesList = useMemo(() => {
        return tables.filter(t => t.status.toLowerCase() === 'cleaning');
    }, [tables]);

    // Navigation tab button styling
    const navCls = (tab: WaiterTab) =>
        `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === tab
                ? 'bg-[#241F1D] text-white font-semibold shadow-inner'
                : 'text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18]'
        }`;

    const goTab = (tab: WaiterTab) => {
        setActiveTab(tab);
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="h-screen w-screen bg-[#110F0E] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#110F0E] flex overflow-hidden">
            <Head title="Stasiun Layanan Waiter — NUSARA Operations" />
            <FlashToast />

            {/* ========================================================
                APP SHELL 4: COLUMN 1 — LEFT NAVIGATION SIDEBAR
            ======================================================== */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[#161312] border-r border-[#241F1D] flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex flex-col h-full overflow-y-auto scrollbar-none">
                    {/* Top Identity Block */}
                    <div className="p-4 border-b border-[#241F1D] flex items-center justify-between">
                        <Link href="/waiter" className="flex items-center gap-2.5">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA — Nusantara & Rasa" 
                                className="h-8 w-auto object-contain drop-shadow" 
                            />
                            <div className="leading-tight">
                                <span className="px-2 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[9px] font-bold text-[#D4B886] tracking-wider uppercase block">
                                    Layanan Waiter
                                </span>
                            </div>
                        </Link>

                        {/* Mobile close */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="md:hidden p-1.5 rounded-lg text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Groups */}
                    <div className="p-3 space-y-6">
                        {/* Group 1: Operasional Saji */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Operasional Saji
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button onClick={() => goTab('serve')} className={navCls('serve')}>
                                    <div className="flex items-center gap-2.5">
                                        <UtensilsCrossed className="w-4 h-4 text-[#B99A65]" />
                                        <span>Siap Saji</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        readyOrders.length > 0
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                            : 'text-[#9E938B]'
                                    }`}>
                                        {readyOrders.length}
                                    </span>
                                </button>

                                <button onClick={() => goTab('tables')} className={navCls('tables')}>
                                    <div className="flex items-center gap-2.5">
                                        <TableIcon className="w-4 h-4 text-[#B99A65]" />
                                        <span>Denah Meja (1-10)</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                        {metrics.occupiedTables}/{tables.length}
                                    </span>
                                </button>

                                <button onClick={() => goTab('kitchen')} className={navCls('kitchen')}>
                                    <div className="flex items-center gap-2.5">
                                        <Flame className="w-4 h-4 text-[#B99A65]" />
                                        <span>Antrean Dapur</span>
                                    </div>
                                    <span className="text-[10px] text-amber-400 font-mono">
                                        {preparingOrders.length}
                                    </span>
                                </button>

                                <button onClick={() => goTab('history')} className={navCls('history')}>
                                    <div className="flex items-center gap-2.5">
                                        <CheckCheck className="w-4 h-4 text-[#B99A65]" />
                                        <span>Riwayat Tersaji</span>
                                    </div>
                                    <span className="text-[10px] text-[#9E938B] font-mono">
                                        {recentServedOrders.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Group 2: Koordinasi & Notifikasi Chat Admin */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Koordinasi Staf
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <MessageSquare className="w-4 h-4 text-[#B99A65]" />
                                        <span>Chat Admin HQ</span>
                                    </div>
                                    {unreadChatCount > 0 ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 animate-pulse">
                                            {unreadChatCount} baru
                                        </span>
                                    ) : (
                                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Group 3: Status Okupansi Meja */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Status Meja
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button
                                    onClick={() => { goTab('tables'); setTableFilter('occupied'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                                        <span>Meja Terisi</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-rose-400">{metrics.occupiedTables}</span>
                                </button>

                                <button
                                    onClick={() => { goTab('tables'); setTableFilter('pending_validation'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                        <span>Perlu Validasi</span>
                                    </div>
                                    <span className="font-mono text-[10px] font-bold text-amber-400">{metrics.pendingValidationTables}</span>
                                </button>

                                <button
                                    onClick={() => { goTab('tables'); setTableFilter('cleaning'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                                        <span>Pembersihan</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-blue-400">{metrics.cleaningTables}</span>
                                </button>
                            </div>
                        </div>

                        {/* Group 4: Navigasi Cepat */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Navigasi Cepat
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <Link
                                    href="/cashier"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Store className="w-4 h-4 text-[#B99A65]" />
                                        <span>Stasiun Kasir POS</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>

                                <Link
                                    href="/order"
                                    target="_blank"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className="w-4 h-4 text-[#B99A65]" />
                                        <span>Katalog Order Publik</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>

                                <Link
                                    href="/"
                                    target="_blank"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <MapPin className="w-4 h-4 text-[#B99A65]" />
                                        <span>Web Publik Nusara</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom User Profile Card & Sign Out */}
                <div className="p-3 border-t border-[#241F1D] bg-[#141110]">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E1A18] border border-[#2D2622]">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#B99A65] text-[#110F0E] font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {waiterUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate leading-tight">
                                    {waiterUser.name}
                                </p>
                                <p className="text-[10px] text-[#B99A65] truncate">
                                    Pramusaji On-Duty
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Keluar"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors flex-shrink-0"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile backdrop */}
            {isMobileSidebarOpen && (
                <div
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
                />
            )}

            {/* ========================================================
                APP SHELL 4: COLUMN 2 — CENTER MAIN WORKSPACE
            ======================================================== */}
            <section className="flex-1 h-full overflow-hidden flex flex-col bg-[#110F0E]">
                {/* Center Top Bar */}
                <header className="h-14 px-4 sm:px-6 border-b border-[#241F1D] flex items-center justify-between bg-[#141110] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="md:hidden p-1.5 rounded-lg text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-[#9E938B]">NUSARA</span>
                            <span className="text-[#4D443E]">/</span>
                            <span className="text-[#9E938B]">Layanan Waiter</span>
                            <span className="text-[#4D443E]">/</span>
                            <span className="font-semibold text-[#F4EFE6]">
                                {activeTab === 'serve' && 'Pesanan Siap Saji'}
                                {activeTab === 'tables' && 'Denah Meja Restoran (Meja 01 - 10)'}
                                {activeTab === 'kitchen' && 'Antrean Proses Dapur'}
                                {activeTab === 'history' && 'Riwayat Sajian Tersaji'}
                            </span>
                        </div>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-2">
                        {/* Button Notifikasi & Chat Admin */}
                        <button
                            type="button"
                            onClick={() => setIsChatOpen(true)}
                            className="relative px-3 py-1.5 rounded-lg bg-[#241F1D] border border-[#342D2A] text-xs font-semibold text-[#F4EFE6] hover:bg-[#2D2622] flex items-center gap-1.5 transition-colors"
                            title="Buka Chat Koordinasi dengan Admin"
                        >
                            <Bell className={`w-3.5 h-3.5 ${unreadChatCount > 0 ? 'text-amber-400' : 'text-[#B99A65]'}`} />
                            <span className="hidden sm:inline">Chat Admin</span>
                            {unreadChatCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 animate-pulse">
                                    {unreadChatCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="px-3 py-1.5 rounded-lg bg-[#241F1D] border border-[#342D2A] text-xs font-semibold text-[#F4EFE6] hover:bg-[#2D2622] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4B886]' : ''}`} />
                            <span className="hidden sm:inline">Segarkan</span>
                        </button>

                        <button
                            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                            className="p-1.5 rounded-lg text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#241F1D] transition-colors"
                            title={isRightPanelOpen ? 'Tutup Panel Agenda' : 'Buka Panel Agenda'}
                        >
                            {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                        </button>
                    </div>
                </header>

                {/* Subheader: App Shell 4 Pill Tabs & Search Filter */}
                <div className="px-4 sm:px-6 py-2.5 border-b border-[#241F1D] bg-[#141110]/60 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                    {/* Left: Pill tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                        <button
                            onClick={() => setActiveTab('serve')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'serve'
                                    ? 'bg-white text-[#110F0E] shadow'
                                    : 'text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]'
                            }`}
                        >
                            Siap Saji ({readyOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('tables')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'tables'
                                    ? 'bg-white text-[#110F0E] shadow'
                                    : 'text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]'
                            }`}
                        >
                            Denah Meja (1-10)
                        </button>
                        <button
                            onClick={() => setActiveTab('kitchen')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'kitchen'
                                    ? 'bg-white text-[#110F0E] shadow'
                                    : 'text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]'
                            }`}
                        >
                            Dapur ({preparingOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'history'
                                    ? 'bg-white text-[#110F0E] shadow'
                                    : 'text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]'
                            }`}
                        >
                            Riwayat ({recentServedOrders.length})
                        </button>
                    </div>

                    {/* Right: Search Box */}
                    <div className="relative min-w-[200px] sm:min-w-[260px]">
                        <Search className="w-3.5 h-3.5 text-[#9E938B] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={activeTab === 'tables' ? 'Cari meja atau lokasi...' : 'Cari pesanan, tamu, meja...'}
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#161312] border border-[#2D2622] text-xs text-[#F4EFE6] placeholder-[#665C54] focus:outline-none focus:border-[#B99A65]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9E938B] hover:text-white text-xs"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-bar for Tables: Specific Status Filter Pills */}
                {activeTab === 'tables' && (
                    <div className="px-4 sm:px-6 py-2.5 border-b border-[#241F1D] bg-[#110F0E] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E938B] mr-1 hidden sm:inline">
                                Filter Meja:
                            </span>
                            {[
                                { key: 'all', label: `Keseluruhan (${tables.length})` },
                                { key: 'cleaning', label: `Pembersihan (${metrics.cleaningTables})` },
                                { key: 'occupied', label: `Terisi (${metrics.occupiedTables})` },
                                { key: 'pending_validation', label: `Perlu Validasi (${metrics.pendingValidationTables})` },
                                { key: 'available', label: `Kosong (${metrics.availableTables})` },
                                { key: 'reserved', label: 'Reservasi' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTableFilter(key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                        tableFilter === key
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65] font-bold shadow-sm'
                                            : 'text-[#9E938B] hover:text-[#F4EFE6] bg-[#161312] border border-[#241F1D]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {tableFilter !== 'all' && (
                            <button
                                type="button"
                                onClick={() => setTableFilter('all')}
                                className="text-xs text-[#D4B886] hover:underline flex items-center gap-1 font-semibold"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Reset ke Keseluruhan</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Main Scrollable Canvas */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none">
                    
                    {/* TAB 1: READY ORDERS (SIAP SAJI) */}
                    {activeTab === 'serve' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                <div>
                                    <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                                        <UtensilsCrossed className="w-4 h-4 text-[#B99A65]" />
                                        <span>Pesanan Siap Diantarkan ({filteredReadyOrders.length})</span>
                                    </h3>
                                    <p className="text-xs text-[#9E938B] mt-0.5">
                                        Makanan telah selesai diracik oleh dapur. Harap antarkan ke meja tamu secara tepat waktu.
                                    </p>
                                </div>
                            </div>

                            {filteredReadyOrders.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl bg-[#161312] border border-[#241F1D]">
                                    <CheckCircle2 className="w-10 h-10 text-[#D4B886]/60 mx-auto mb-2" />
                                    <h4 className="font-heading text-base font-bold text-[#F4EFE6]">
                                        Tidak Ada Pesanan Menunggu Diantar
                                    </h4>
                                    <p className="text-xs text-[#9E938B] max-w-md mx-auto mt-1">
                                        Seluruh pesanan siap saji telah berhasil diantarkan ke meja tamu.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredReadyOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="p-4 rounded-2xl bg-[#161312] border border-[#B99A65]/30 hover:border-[#D4B886] shadow-lg flex flex-col justify-between transition-all"
                                        >
                                            <div>
                                                {/* Header info */}
                                                <div className="flex items-center justify-between pb-2.5 border-b border-[#241F1D]">
                                                    <div>
                                                        <span className="text-xs font-mono font-bold text-[#D4B886]">
                                                            #{order.order_code}
                                                        </span>
                                                        <div className="text-[11px] text-[#9E938B] mt-0.5 flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5 text-[#9E938B]" />
                                                            <span>{order.customer_name || order.customer?.name || 'Tamu Dine-in'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="px-3 py-1 rounded-xl bg-[#32151F] border border-[#B99A65]/50 text-center">
                                                        <span className="text-[9px] text-[#B99A65] uppercase font-bold block">
                                                            Antar Ke
                                                        </span>
                                                        <span className="font-heading font-bold text-sm text-[#F4EFE6] leading-none">
                                                            {order.table_number || order.table?.table_number || 'Meja Walk-in'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Items List */}
                                                <div className="py-2.5 space-y-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E938B]">
                                                        Daftar Sajian:
                                                    </span>
                                                    <ul className="space-y-1.5">
                                                        {order.items?.map((item, idx) => (
                                                            <li key={idx} className="flex items-start justify-between text-xs text-[#F4EFE6]">
                                                                <span className="leading-snug">
                                                                    <strong className="text-[#D4B886] font-mono mr-1.5">{item.quantity}x</strong>
                                                                    {item.menu_name_snapshot}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    {order.customer_notes && (
                                                        <div className="mt-2 p-2 rounded-lg bg-[#211D1B] border border-amber-900/40 text-[11px] text-amber-300">
                                                            <strong>Catatan:</strong> {order.customer_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button: Konfirmasi Tersaji */}
                                            <div className="pt-3 border-t border-[#241F1D]">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkServed(order.id)}
                                                    disabled={servingOrderId === order.id}
                                                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#110F0E] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    <span>{servingOrderId === order.id ? 'Memproses...' : 'Konfirmasi Tersaji (Served)'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: DENAH MEJA RESTORAN (CIRCULAR BLUEPRINT FLOOR PLAN 1-10) */}
                    {activeTab === 'tables' && (
                        <div className="space-y-6">
                            {/* Visual Circular Floor Plan Component with Filter state */}
                            <CircularFloorPlan
                                tables={tables}
                                reservations={reservations}
                                selectedDate={selectedCalDate}
                                role="waiter"
                                statusFilter={tableFilter}
                                onFilterChange={setTableFilter}
                                onValidateTable={handleValidateTable}
                                onStartCleaning={handleStartCleaning}
                                onFinishCleaning={handleFinishCleaning}
                            />

                            {/* Tables Detail Cards Grid */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                    <div>
                                        <h4 className="font-heading font-bold text-sm text-[#F4EFE6]">
                                            {tableFilter === 'all'
                                                ? `Daftar Rincian Keseluruhan (${tables.length} Meja)`
                                                : `Daftar Meja Terfilter (${filteredTables.length} Meja)`}
                                        </h4>
                                        <p className="text-[11px] text-[#9E938B]">
                                            {tableFilter === 'all'
                                                ? 'Menampilkan status seluruh meja restoran (Meja 01 s/d 10)'
                                                : `Menampilkan hanya meja yang sedang berstatus ${tableFilter.toUpperCase()}`}
                                        </p>
                                    </div>
                                    {tableFilter !== 'all' && (
                                        <button
                                            type="button"
                                            onClick={() => setTableFilter('all')}
                                            className="px-2.5 py-1 rounded-lg bg-[#241F1D] text-[#D4B886] hover:bg-[#32151F] text-xs font-semibold transition-colors"
                                        >
                                            Tampilkan Keseluruhan
                                        </button>
                                    )}
                                </div>

                                {filteredTables.length === 0 ? (
                                    <div className="p-8 text-center rounded-2xl bg-[#161312] border border-[#241F1D] space-y-2">
                                        <p className="text-sm font-semibold text-stone-300">
                                            Tidak ada meja dengan status "{tableFilter}" saat ini.
                                        </p>
                                        <p className="text-xs text-[#9E938B]">
                                            Pilih filter status lain atau kembali ke denah keseluruhan.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setTableFilter('all')}
                                            className="inline-block mt-2 px-3 py-1.5 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] text-xs font-bold hover:bg-[#B99A65] hover:text-[#110F0E] transition-all"
                                        >
                                            Kembali ke Keseluruhan Meja
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredTables.map((tbl) => {
                                        const isPending = tbl.status.toLowerCase() === 'pending_validation' || tbl.status.toLowerCase() === 'pending validation';
                                        const isOccupied = tbl.status.toLowerCase() === 'occupied';
                                        const isCleaning = tbl.status.toLowerCase() === 'cleaning';
                                        const isAvailable = tbl.status.toLowerCase() === 'available';
                                        const isReserved = tbl.status.toLowerCase() === 'reserved';

                                        return (
                                            <div
                                                key={tbl.id}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                                    isPending
                                                        ? 'bg-amber-950/20 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                                                        : isOccupied
                                                        ? 'bg-[#161312] border-rose-900/50'
                                                        : isCleaning
                                                        ? 'bg-blue-950/20 border-blue-800/60'
                                                        : isAvailable
                                                        ? 'bg-[#161312] border-emerald-900/40'
                                                        : 'bg-[#161312] border-[#241F1D]'
                                                }`}
                                            >
                                                <div>
                                                    {/* Header Table Info */}
                                                    <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                                        <div>
                                                            <h4 className="font-heading font-bold text-base text-[#F4EFE6]">
                                                                {tbl.table_number}
                                                            </h4>
                                                            <span className="text-[10px] text-[#9E938B]">
                                                                Kapasitas {tbl.capacity} Kursi · {tbl.location || 'Lantai 1'}
                                                            </span>
                                                        </div>

                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                                                    <div className="py-2.5 space-y-1 text-xs text-[#9E938B]">
                                                        {tbl.active_session ? (
                                                            <div className="p-2 rounded-xl bg-[#141110] border border-[#241F1D] text-[11px]">
                                                                <div className="flex items-center justify-between text-stone-300 font-mono">
                                                                    <span>Sesi: {tbl.active_session.session_code}</span>
                                                                    <span className="text-emerald-400 font-bold">{tbl.active_session.status}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[11px] italic text-[#665C54]">Tidak ada sesi aktif</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="pt-3 border-t border-[#241F1D] space-y-2">
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
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ANTREAN DAPUR (PREPARING) */}
                    {activeTab === 'kitchen' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                <div>
                                    <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-amber-500" />
                                        <span>Antrean Dapur Dalam Proses ({filteredPreparingOrders.length})</span>
                                    </h3>
                                    <p className="text-xs text-[#9E938B] mt-0.5">
                                        Pantau status pesanan yang sedang diracik chef untuk persiapan pengantaran meja.
                                    </p>
                                </div>
                            </div>

                            {filteredPreparingOrders.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl bg-[#161312] border border-[#241F1D]">
                                    <Flame className="w-10 h-10 text-amber-500/60 mx-auto mb-2" />
                                    <h4 className="font-heading text-base font-bold text-[#F4EFE6]">
                                        Tidak Ada Antrean Masakan di Dapur
                                    </h4>
                                    <p className="text-xs text-[#9E938B] max-w-md mx-auto mt-1">
                                        Semua pesanan yang telah dikonfirmasi kasir telah siap saji atau tersaji.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredPreparingOrders.map((ord) => (
                                        <div key={ord.id} className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] text-xs space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                                <span className="font-mono text-xs text-amber-400 font-bold">#{ord.order_code}</span>
                                                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900/60 text-[10px] text-amber-300 font-bold">
                                                    {ord.table_number || ord.table?.table_number || 'Dine-in'}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white font-medium">
                                                    {ord.customer_name || ord.customer?.name || 'Tamu Restoran'}
                                                </p>
                                                <p className="text-[11px] text-[#9E938B]">
                                                    {ord.items?.map(it => `${it.quantity}x ${it.menu_name_snapshot}`).join(', ')}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-[#241F1D] flex items-center justify-between text-[11px] text-[#9E938B]">
                                                <span>Total: {formatRupiah(ord.total)}</span>
                                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                                    <Flame className="w-3.5 h-3.5 animate-pulse" /> Sedang Dimasak
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: RIWAYAT SAJIAN TERSAJI (HISTORY) */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                <div>
                                    <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                                        <span>Riwayat Sajian Berhasil Tersaji ({filteredHistoryOrders.length})</span>
                                    </h3>
                                    <p className="text-xs text-[#9E938B] mt-0.5">
                                        Catatan audit pesanan dine-in yang telah selesai diantarkan pramusaji.
                                    </p>
                                </div>
                            </div>

                            {filteredHistoryOrders.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl bg-[#161312] border border-[#241F1D]">
                                    <Clock className="w-10 h-10 text-[#9E938B]/60 mx-auto mb-2" />
                                    <p className="text-xs text-[#9E938B]">Belum ada catatan sajian tersaji pada sesi operasional ini.</p>
                                </div>
                            ) : (
                                <div className="rounded-2xl bg-[#161312] border border-[#241F1D] overflow-hidden shadow">
                                    <div className="divide-y divide-[#241F1D]">
                                        {filteredHistoryOrders.map((ord) => (
                                            <div key={ord.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-[#D4B886]">#{ord.order_code}</span>
                                                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-800/40">
                                                            TERSAJI
                                                        </span>
                                                        <span className="text-[#F4EFE6] font-semibold">
                                                            {ord.table_number || ord.table?.table_number || 'Meja Dine-in'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[#9E938B] mt-1">
                                                        {ord.items?.map(i => `${i.quantity}x ${i.menu_name_snapshot}`).join(', ')}
                                                    </p>
                                                </div>

                                                <div className="text-right text-[#9E938B] text-[11px]">
                                                    <span className="font-mono font-bold text-[#F4EFE6] block">
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
            </section>

            {/* ========================================================
                APP SHELL 4: COLUMN 3 — RIGHT SCHEDULE & INSPECTOR PANEL
            ======================================================== */}
            {isRightPanelOpen && (
                <aside className="w-80 flex-shrink-0 bg-[#161312] border-l border-[#241F1D] flex flex-col h-full overflow-y-auto scrollbar-none hidden lg:flex">
                    {/* Header */}
                    <div className="p-4 border-b border-[#241F1D] flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-[#9E938B]">
                            Schedule & Prioritas
                        </span>
                        <button
                            onClick={() => setIsRightPanelOpen(false)}
                            className="p-1 rounded-lg text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Mini Calendar Widget */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">
                                    {monthNames[currentCalMonth]} {currentCalYear}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            if (currentCalMonth === 0) {
                                                setCurrentCalMonth(11);
                                                setCurrentCalYear(currentCalYear - 1);
                                            } else {
                                                setCurrentCalMonth(currentCalMonth - 1);
                                            }
                                        }}
                                        className="p-1 rounded hover:bg-[#241F1D] text-[#9E938B] hover:text-white"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (currentCalMonth === 11) {
                                                setCurrentCalMonth(0);
                                                setCurrentCalYear(currentCalYear + 1);
                                            } else {
                                                setCurrentCalMonth(currentCalMonth + 1);
                                            }
                                        }}
                                        className="p-1 rounded hover:bg-[#241F1D] text-[#9E938B] hover:text-white"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Days Header */}
                            <div className="grid grid-cols-7 text-center text-[10px] text-[#9E938B] font-semibold">
                                <span>S</span>
                                <span>M</span>
                                <span>T</span>
                                <span>W</span>
                                <span>T</span>
                                <span>F</span>
                                <span>S</span>
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {calendarDays.map((calDay, idx) => {
                                    const isSelected = selectedCalDate.toDateString() === calDay.date.toDateString();
                                    const isTodayDate = today.toDateString() === calDay.date.toDateString();

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedCalDate(calDay.date)}
                                            className={`relative h-8 w-8 mx-auto rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                                                isSelected
                                                    ? 'bg-white text-[#110F0E] font-bold shadow-md'
                                                    : calDay.isCurrentMonth
                                                    ? 'text-[#F4EFE6] hover:bg-[#241F1D]'
                                                    : 'text-[#4D443E] hover:text-[#9E938B]'
                                            }`}
                                        >
                                            <span className="leading-none">{calDay.day}</span>
                                            {isTodayDate && (
                                                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-[#110F0E]' : 'bg-[#D4B886]'}`}></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Up Next: Priority Waiter Actions */}
                        <div className="space-y-3 pt-4 border-t border-[#241F1D]">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#F4EFE6]">
                                    Up next
                                </span>
                                <span className="text-[10px] text-[#9E938B]">
                                    {selectedCalDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            {/* 1. Urgent: Meja Perlu Validasi */}
                            {pendingValidationTablesList.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Perlu Validasi Meja ({pendingValidationTablesList.length})</span>
                                    </span>
                                    {pendingValidationTablesList.map(t => (
                                        <div key={t.id} className="p-2.5 rounded-xl bg-[#141110] border border-amber-500/40 text-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-white">{t.table_number}</span>
                                                <span className="text-[10px] text-amber-400 font-mono">Tamu Datang</span>
                                            </div>
                                            <button
                                                onClick={() => handleValidateTable(t.id)}
                                                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] uppercase transition-colors"
                                            >
                                                Validasi Tamu Duduk
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 2. Meja Perlu Pembersihan */}
                            {cleaningTablesList.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Pembersihan Meja ({cleaningTablesList.length})</span>
                                    </span>
                                    {cleaningTablesList.map(t => (
                                        <div key={t.id} className="p-2.5 rounded-xl bg-[#141110] border border-blue-500/40 text-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-white">{t.table_number}</span>
                                                <span className="text-[10px] text-blue-400 font-mono">Perlu Dibereskan</span>
                                            </div>
                                            <button
                                                onClick={() => handleFinishCleaning(t.id)}
                                                disabled={cleaningTableId === t.id}
                                                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase transition-colors disabled:opacity-50"
                                            >
                                                {cleaningTableId === t.id ? 'Memproses...' : 'Selesai Bersih (Available)'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 3. Pesanan Siap Saji Terdekat */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-[#D4B886] flex items-center gap-1.5">
                                    <UtensilsCrossed className="w-3.5 h-3.5" />
                                    <span>Siap Antar ({readyOrders.length})</span>
                                </span>
                                {readyOrders.length === 0 ? (
                                    <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] text-xs text-[#9E938B]">
                                        Seluruh pesanan siap saji telah tersaji ke meja tamu.
                                    </div>
                                ) : (
                                    readyOrders.slice(0, 3).map(o => (
                                        <div key={o.id} className="p-2.5 rounded-xl bg-[#141110] border border-[#241F1D] text-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-[#D4B886]">#{o.order_code}</span>
                                                <span className="font-bold text-white">
                                                    {o.table_number || o.table?.table_number || 'Dine-in'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[#9E938B] truncate">
                                                {o.items?.map(it => `${it.quantity}x ${it.menu_name_snapshot}`).join(', ')}
                                            </p>
                                            <button
                                                onClick={() => handleMarkServed(o.id)}
                                                disabled={servingOrderId === o.id}
                                                className="w-full py-1.5 rounded-lg bg-[#32151F] hover:bg-[#461e2b] text-[#D4B886] border border-[#B99A65]/40 font-bold text-[11px] uppercase transition-colors disabled:opacity-50"
                                            >
                                                {servingOrderId === o.id ? 'Memproses...' : 'Antar Sekarang (Served)'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            )}

            {/* ========================================================
                OPERATIONAL CHAT MODAL WITH ADMIN HQ
            ======================================================== */}
            <OperationalChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                role="waiter"
                userName={waiterUser.name}
                messages={chatMessages}
            />
        </div>
    );
}
