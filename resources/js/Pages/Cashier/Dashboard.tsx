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
    ChevronRight, 
    ChevronLeft,
    X, 
    Phone, 
    User as UserIcon, 
    Calendar, 
    Check, 
    ArrowRight, 
    Flame, 
    Sparkles, 
    Store, 
    LogOut, 
    CheckCheck, 
    Wallet, 
    Receipt,
    CheckCircle2,
    XCircle,
    Bell,
    TrendingUp,
    Table as TableIcon,
    PanelRightClose,
    PanelRight,
    Menu as MenuIcon,
    ExternalLink,
    MapPin
} from 'lucide-react';
import { Order, OrderStatus, RestaurantSettings } from '../../types';

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

export type CashierTab = 'orders' | 'tables' | 'reservations';

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

    // App Shell 4 Layout State
    const [mainTab, setMainTab] = useState<CashierTab>('orders');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

    // Filters for Orders
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'all');
    const [selectedType, setSelectedType] = useState<string>(filters.type || 'all');
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');

    // Modals
    const [receiptOrder, setReceiptOrder] = useState<OrderWithDetails | null>(null);
    const [cashPaymentOrder, setCashPaymentOrder] = useState<OrderWithDetails | null>(null);
    const [cashReceived, setCashReceived] = useState<number>(0);

    // Calendar state for Right Schedule
    const today = useMemo(() => new Date(), []);
    const [currentCalMonth, setCurrentCalMonth] = useState<number>(today.getMonth());
    const [currentCalYear, setCurrentCalYear] = useState<number>(today.getFullYear());
    const [selectedCalDate, setSelectedCalDate] = useState<Date>(today);

    // Logout with confirmation alert
    const handleLogout = () => {
        if (window.confirm('Konfirmasi Keluar: Apakah Anda yakin ingin mengakhiri sesi Kasir? Pastikan seluruh transaksi aktif telah diverifikasi.')) {
            router.post('/logout');
        }
    };

    // Format currency IDR
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    // Filter orders
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
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

            if (selectedType !== 'all' && order.order_type !== selectedType) {
                return false;
            }

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

    // Reservations by date map
    const reservationsByDate = useMemo(() => {
        const map = new Map<string, ReservationItem[]>();
        reservations.forEach(res => {
            const dateStr = res.reservation_datetime.split('T')[0] || res.reservation_datetime.split(' ')[0];
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(res);
        });
        return map;
    }, [reservations]);

    const getDateKey = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const selectedDateKey = getDateKey(selectedCalDate);
    const dayReservations = reservationsByDate.get(selectedDateKey) || [];

    // Pending orders needing Cashier ACC
    const pendingOrdersForAgenda = useMemo(() => {
        return orders.filter(o => ['Pending', 'Awaiting Payment', 'Paid'].includes(o.order_status)).slice(0, 4);
    }, [orders]);

    // Navigation tab button styling
    const navCls = (tab: CashierTab) =>
        `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            mainTab === tab
                ? 'bg-[#241F1D] text-white font-semibold shadow-inner'
                : 'text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18]'
        }`;

    const goTab = (tab: CashierTab) => {
        setMainTab(tab);
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="h-screen w-screen bg-[#110F0E] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#110F0E] flex overflow-hidden">
            <Head title="Terminal Kasir Operasional — NUSARA Cashier Desk" />
            <FlashToast flash={flash} durationMs={3000} />

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
                        <Link href="/cashier" className="flex items-center gap-2.5">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA — Nusantara & Rasa" 
                                className="h-8 w-auto object-contain drop-shadow" 
                            />
                            <div className="leading-tight">
                                <span className="px-2 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[9px] font-bold text-[#D4B886] tracking-wider uppercase block">
                                    Stasiun Kasir
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
                        {/* Group 1: Transaksi & Kasir */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Transaksi & Kasir
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button onClick={() => goTab('orders')} className={navCls('orders')}>
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className="w-4 h-4 text-[#B99A65]" />
                                        <span>Antrean Pesanan</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        metrics.pendingOrders > 0
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                            : 'text-[#9E938B]'
                                    }`}>
                                        {orders.length}
                                    </span>
                                </button>

                                <button onClick={() => goTab('tables')} className={navCls('tables')}>
                                    <div className="flex items-center gap-2.5">
                                        <TableIcon className="w-4 h-4 text-[#B99A65]" />
                                        <span>Denah Meja & Sesi</span>
                                    </div>
                                    <span className="text-[10px] text-[#9E938B] font-mono">
                                        {tables.length}
                                    </span>
                                </button>

                                <button onClick={() => goTab('reservations')} className={navCls('reservations')}>
                                    <div className="flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-[#B99A65]" />
                                        <span>Jadwal Reservasi</span>
                                    </div>
                                    <span className="text-[10px] text-[#9E938B] font-mono">
                                        {reservations.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Group 2: Status Pesanan Kasir */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Status Kasir
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button
                                    onClick={() => { goTab('orders'); setSelectedStatus('pending'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Wallet className="w-4 h-4 text-amber-400" />
                                        <span>Menunggu Bayar</span>
                                    </div>
                                    <span className="font-mono text-[10px] font-bold text-amber-400">{metrics.pendingOrders}</span>
                                </button>

                                <button
                                    onClick={() => { goTab('orders'); setSelectedStatus('preparing'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Flame className="w-4 h-4 text-orange-400" />
                                        <span>Sedang Dimasak</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-orange-400">{metrics.preparingOrders}</span>
                                </button>

                                <button
                                    onClick={() => { goTab('orders'); setSelectedStatus('ready'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                        <span>Siap Saji</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-emerald-400">{metrics.readyOrders}</span>
                                </button>

                                <button
                                    onClick={() => { goTab('orders'); setSelectedStatus('completed'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <CheckCheck className="w-4 h-4 text-stone-400" />
                                        <span>Selesai Hari Ini</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-stone-400">{metrics.completedToday}</span>
                                </button>
                            </div>
                        </div>

                        {/* Group 3: Navigasi Cepat */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Navigasi Cepat
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <Link
                                    href="/waiter"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <UtensilsCrossed className="w-4 h-4 text-[#B99A65]" />
                                        <span>Stasiun Waiter</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>

                                <Link
                                    href="/admin"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Store className="w-4 h-4 text-[#B99A65]" />
                                        <span>Admin Executive HQ</span>
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
                                {cashierUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate leading-tight">
                                    {cashierUser.name}
                                </p>
                                <p className="text-[10px] text-[#B99A65] truncate font-mono">
                                    Kasir Shift Aktif
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
                            <span className="text-[#9E938B]">Stasiun Kasir</span>
                            <span className="text-[#4D443E]">/</span>
                            <span className="font-semibold text-[#F4EFE6]">
                                {mainTab === 'orders' && 'Antrean Pesanan & Kasir POS'}
                                {mainTab === 'tables' && 'Denah & Status Meja'}
                                {mainTab === 'reservations' && 'Buku Reservasi Tamu'}
                            </span>
                        </div>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.reload()}
                            className="px-3 py-1.5 rounded-lg bg-[#241F1D] border border-[#342D2A] text-xs font-semibold text-[#F4EFE6] hover:bg-[#2D2622] flex items-center gap-1.5 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
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
                    {mainTab === 'orders' ? (
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                            {[
                                { key: 'all', label: `Semua (${orders.length})` },
                                { key: 'pending', label: `Menunggu (${metrics.pendingOrders})` },
                                { key: 'preparing', label: `Dimasak (${metrics.preparingOrders})` },
                                { key: 'ready', label: `Siap Saji (${metrics.readyOrders})` },
                                { key: 'completed', label: `Selesai (${metrics.completedToday})` },
                                { key: 'cancelled', label: 'Dibatalkan' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedStatus(key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                        selectedStatus === key
                                            ? 'bg-white text-[#110F0E] shadow'
                                            : 'text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setMainTab('orders')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]"
                            >
                                Antrean Pesanan ({orders.length})
                            </button>
                            <button
                                onClick={() => setMainTab('tables')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    mainTab === 'tables' ? 'bg-white text-[#110F0E]' : 'text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]'
                                }`}
                            >
                                Denah Meja ({tables.length})
                            </button>
                            <button
                                onClick={() => setMainTab('reservations')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    mainTab === 'reservations' ? 'bg-white text-[#110F0E]' : 'text-[#9E938B] hover:text-white bg-[#1E1A18] border border-[#241F1D]'
                                }`}
                            >
                                Reservasi ({reservations.length})
                            </button>
                        </div>
                    )}

                    {/* Right: Search Box */}
                    <div className="relative min-w-[200px] sm:min-w-[260px]">
                        <Search className="w-3.5 h-3.5 text-[#9E938B] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode pesanan, nama tamu, meja..."
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

                {/* Sub-bar for Order Types */}
                {mainTab === 'orders' && (
                    <div className="px-4 sm:px-6 py-2 border-b border-[#241F1D] bg-[#110F0E] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                            {[
                                { key: 'all', label: 'Semua Tipe' },
                                { key: 'dine_in', label: 'Dine-in (Makan di Tempat)' },
                                { key: 'takeaway', label: 'Takeaway (Bungkus)' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedType(key)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                                        selectedType === key
                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40 font-bold'
                                            : 'text-[#9E938B] hover:text-[#F4EFE6] bg-[#161312] border border-[#241F1D]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="text-[11px] text-[#9E938B] font-mono shrink-0">
                            Menampilkan <span className="text-[#F4EFE6] font-bold">{filteredOrders.length}</span> order
                        </div>
                    </div>
                )}

                {/* Main Scrollable Canvas */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-none">
                    
                    {/* VIEW 1: ORDERS QUEUE */}
                    {mainTab === 'orders' && (
                        <div className="space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl bg-[#161312] border border-[#241F1D]">
                                    <ShoppingBag className="w-10 h-10 text-[#9E938B]/60 mx-auto mb-2" />
                                    <h4 className="font-heading text-base font-bold text-[#F4EFE6]">
                                        Tidak Ada Pesanan Ditemukan
                                    </h4>
                                    <p className="text-xs text-[#9E938B] max-w-md mx-auto mt-1">
                                        Tidak ada pesanan yang sesuai dengan kriteria filter atau pencarian saat ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {filteredOrders.map((order) => {
                                        const isDineIn = order.order_type === 'dine_in';
                                        const isPending = ['Pending', 'Awaiting Payment', 'Paid'].includes(order.order_status);
                                        const isPreparing = order.order_status === 'Preparing';
                                        const isReady = order.order_status === 'Ready';
                                        const isCompleted = ['Served', 'Picked Up', 'Completed'].includes(order.order_status);
                                        const isCancelled = order.order_status === 'Cancelled';

                                        return (
                                            <div
                                                key={order.id}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                                    isPending
                                                        ? 'bg-[#161312] border-amber-500/50 shadow-lg ring-1 ring-amber-500/30'
                                                        : isPreparing
                                                        ? 'bg-[#161312] border-orange-500/40'
                                                        : isReady
                                                        ? 'bg-[#161312] border-emerald-500/50 ring-1 ring-emerald-500/30'
                                                        : 'bg-[#161312] border-[#241F1D]'
                                                }`}
                                            >
                                                <div>
                                                    {/* Header Card */}
                                                    <div className="flex items-center justify-between pb-3 border-b border-[#241F1D]">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-sm text-[#D4B886]">
                                                                    #{order.order_code}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                    isDineIn ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40' : 'bg-[#1C1816] text-stone-300 border border-[#2C2421]'
                                                                }`}>
                                                                    {isDineIn ? (order.table_number || 'Dine-in') : 'Takeaway'}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-[#9E938B] mt-1 flex items-center gap-2">
                                                                <span>{order.customer_name || 'Tamu Restoran'}</span>
                                                                {order.customer_phone && <span>· {order.customer_phone}</span>}
                                                            </div>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <div className="text-right">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider block ${
                                                                isPending ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse' :
                                                                isPreparing ? 'bg-orange-950 text-orange-300 border border-orange-600 animate-pulse' :
                                                                isReady ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-extrabold' :
                                                                isCompleted ? 'bg-stone-800 text-stone-300' :
                                                                isCancelled ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                                                'bg-stone-800 text-stone-300'
                                                            }`}>
                                                                {order.order_status}
                                                            </span>
                                                            <span className="text-[10px] text-[#9E938B] mt-0.5 block">
                                                                {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Items Summary */}
                                                    <div className="py-2.5 space-y-1.5 text-xs">
                                                        <div className="space-y-1">
                                                            {order.items?.map((it, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-[#F4EFE6]">
                                                                    <span>
                                                                        <strong className="text-[#D4B886] font-mono mr-1.5">{it.quantity}x</strong>
                                                                        {it.menu_name_snapshot}
                                                                    </span>
                                                                    <span className="font-mono text-[#9E938B]">
                                                                        {formatIDR(it.subtotal)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {order.customer_notes && (
                                                            <div className="mt-2 p-2 rounded-lg bg-[#211D1B] border border-amber-900/40 text-[11px] text-amber-300">
                                                                <strong>Catatan:</strong> {order.customer_notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bottom Footer & Actions */}
                                                <div className="pt-3 border-t border-[#241F1D] space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-[#9E938B]">Total Tagihan:</span>
                                                        <span className="font-mono font-bold text-sm text-[#D4B886]">
                                                            {formatIDR(order.total)}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons Row */}
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {/* Cash confirmation trigger */}
                                                        {isPending && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenCashModal(order)}
                                                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow"
                                                            >
                                                                <Wallet className="w-3.5 h-3.5" />
                                                                <span>Bayar Tunai</span>
                                                            </button>
                                                        )}

                                                        {/* Send to kitchen ACC */}
                                                        {isPending && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                                                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow"
                                                            >
                                                                <Flame className="w-3.5 h-3.5" />
                                                                <span>ACC & Masak</span>
                                                            </button>
                                                        )}

                                                        {/* Ready button */}
                                                        {isPreparing && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateStatus(order.id, 'Ready')}
                                                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                                <span>Tandai Siap Saji</span>
                                                            </button>
                                                        )}

                                                        {/* Handover / Served button */}
                                                        {isReady && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateStatus(order.id, isDineIn ? 'Served' : 'Picked Up')}
                                                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>{isDineIn ? 'Konfirmasi Tersaji' : 'Konfirmasi Diambil'}</span>
                                                            </button>
                                                        )}

                                                        {/* Print Receipt button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setReceiptOrder(order)}
                                                            className="p-1.5 rounded-lg bg-[#241F1D] hover:bg-[#2D2622] text-[#F4EFE6] border border-[#342D2A] transition-colors"
                                                            title="Cetak Struk Pembayaran"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>

                                                        {/* Cancel button if pending */}
                                                        {isPending && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm(`Batalkan pesanan #${order.order_code}?`)) {
                                                                        handleUpdateStatus(order.id, 'Cancelled');
                                                                    }
                                                                }}
                                                                className="p-1.5 rounded-lg bg-[#241F1D] hover:bg-rose-950/60 text-rose-400 border border-rose-900/40 transition-colors"
                                                                title="Batalkan Pesanan"
                                                            >
                                                                <XCircle className="w-4 h-4" />
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

                    {/* VIEW 2: TABLES MANAGEMENT */}
                    {mainTab === 'tables' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                <div>
                                    <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                                        <TableIcon className="w-4 h-4 text-[#B99A65]" />
                                        <span>Denah Meja & Sesi ({tables.length})</span>
                                    </h3>
                                    <p className="text-xs text-[#9E938B] mt-0.5">
                                        Pantau okupansi meja makan, status sesi tamu, dan alokasikan meja tamu walk-in / reservasi.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {tables.map((t) => (
                                    <div key={t.id} className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                            <div>
                                                <h4 className="font-heading font-bold text-base text-white">{t.table_number}</h4>
                                                <span className="text-[10px] text-[#9E938B]">
                                                    Kapasitas {t.capacity} Kursi · {t.location}
                                                </span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                t.status === 'Available' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                                t.status === 'Occupied' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                                t.status === 'Cleaning' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                                t.status === 'Reserved' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                                'bg-stone-800 text-stone-300'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-[#9E938B]">
                                            {t.active_session ? (
                                                <div className="p-2 rounded-xl bg-[#141110] border border-[#241F1D] text-[11px]">
                                                    <span className="font-mono text-stone-300 block">Sesi: {t.active_session.session_code}</span>
                                                    <span className="text-emerald-400 font-bold text-[10px] uppercase">{t.active_session.status}</span>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] italic text-[#665C54]">Tidak ada sesi aktif</p>
                                            )}
                                        </div>

                                        {/* Status Changer */}
                                        <div className="pt-2 border-t border-[#241F1D]">
                                            <select
                                                value={t.status}
                                                onChange={(e) => handleTableStatusChange(t.id, e.target.value)}
                                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#141110] border border-[#2D2622] text-xs text-[#F4EFE6] focus:outline-none focus:border-[#B99A65]"
                                            >
                                                <option value="Available">Available (Kosong)</option>
                                                <option value="Occupied">Occupied (Terisi)</option>
                                                <option value="Reserved">Reserved (Dipesan)</option>
                                                <option value="Cleaning">Cleaning (Pembersihan)</option>
                                                <option value="Inactive">Inactive (Tutup)</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEW 3: RESERVATIONS BOOK */}
                    {mainTab === 'reservations' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                <div>
                                    <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#B99A65]" />
                                        <span>Buku Jadwal Reservasi Tamu ({reservations.length})</span>
                                    </h3>
                                    <p className="text-xs text-[#9E938B] mt-0.5">
                                        Kelola jadwal kedatangan tamu restoran dan konfirmasi alokasi meja santap.
                                    </p>
                                </div>
                            </div>

                            {reservations.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl bg-[#161312] border border-[#241F1D]">
                                    <Calendar className="w-10 h-10 text-[#9E938B]/60 mx-auto mb-2" />
                                    <h4 className="font-heading text-base font-bold text-[#F4EFE6]">
                                        Belum Ada Jadwal Reservasi
                                    </h4>
                                    <p className="text-xs text-[#9E938B] max-w-md mx-auto mt-1">
                                        Jadwal reservasi online dari tamu akan muncul di sini secara otomatis.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl bg-[#161312] border border-[#241F1D] overflow-hidden shadow">
                                    <div className="divide-y divide-[#241F1D]">
                                        {reservations.map((r) => (
                                            <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-[#D4B886]">#{r.reservation_code}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            r.status === 'Confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                                            r.status === 'Seated' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                                                            r.status === 'Completed' ? 'bg-stone-800 text-stone-300' :
                                                            r.status === 'Cancelled' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                                            'bg-amber-950 text-amber-300 border border-amber-800'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                        <span className="text-[#F4EFE6] font-semibold">{r.customer_name}</span>
                                                        <span className="text-[#9E938B]">({r.guest_count} Pax)</span>
                                                    </div>
                                                    <div className="text-[11px] text-[#9E938B] mt-1 space-x-2">
                                                        <span>Waktu: {new Date(r.reservation_datetime).toLocaleString('id-ID')}</span>
                                                        {r.customer_phone && <span>· Telp: {r.customer_phone}</span>}
                                                        {r.experience_name && <span className="text-[#D4B886]">· {r.experience_name}</span>}
                                                    </div>
                                                    {r.special_request && (
                                                        <p className="text-[11px] text-amber-300 italic mt-1">
                                                            Catatan: "{r.special_request}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {r.status === 'Pending' && (
                                                        <button
                                                            onClick={() => handleReservationStatusChange(r.id, 'Confirmed')}
                                                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                                                        >
                                                            Konfirmasi
                                                        </button>
                                                    )}
                                                    {r.status === 'Confirmed' && (
                                                        <button
                                                            onClick={() => handleReservationStatusChange(r.id, 'Seated')}
                                                            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] transition-colors"
                                                        >
                                                            Tamu Hadir (Duduk)
                                                        </button>
                                                    )}
                                                    {['Confirmed', 'Seated'].includes(r.status) && (
                                                        <button
                                                            onClick={() => handleReservationStatusChange(r.id, 'Completed')}
                                                            className="px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-white font-bold text-[11px] transition-colors"
                                                        >
                                                            Selesai
                                                        </button>
                                                    )}
                                                    {r.status !== 'Cancelled' && (
                                                        <button
                                                            onClick={() => handleReservationStatusChange(r.id, 'Cancelled')}
                                                            className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] transition-colors"
                                                        >
                                                            Batal
                                                        </button>
                                                    )}
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
                            Schedule & Kasir
                        </span>
                        <button
                            onClick={() => setIsRightPanelOpen(false)}
                            className="p-1 rounded-lg text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Daily Turnover Card */}
                        <div className="p-3.5 rounded-2xl bg-[#141110] border border-[#B99A65]/40 space-y-1">
                            <div className="flex items-center justify-between text-xs text-[#D4B886]">
                                <span className="font-bold uppercase tracking-wider">Omzet Sesi Ini</span>
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <p className="font-mono font-bold text-lg text-white">
                                {formatIDR(metrics.todayRevenue)}
                            </p>
                            <p className="text-[11px] text-[#9E938B]">
                                {metrics.completedToday} transaksi berhasil diselesaikan
                            </p>
                        </div>

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
                                    const dayKey = getDateKey(calDay.date);
                                    const hasReservations = reservationsByDate.has(dayKey);

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
                                            {hasReservations && (
                                                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-[#110F0E]' : 'bg-[#D4B886]'}`}></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Up Next: Agenda & Priority Orders */}
                        <div className="space-y-3 pt-4 border-t border-[#241F1D]">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#F4EFE6]">
                                    Up next
                                </span>
                                <span className="text-[10px] text-[#9E938B]">
                                    {selectedCalDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            {/* Reservations on selected date */}
                            {dayReservations.length > 0 ? (
                                <div className="space-y-2">
                                    <span className="text-[11px] font-bold text-[#D4B886] block">
                                        Reservasi Tanggal Ini ({dayReservations.length})
                                    </span>
                                    {dayReservations.map(res => (
                                        <div key={res.id} className="p-2.5 rounded-xl bg-[#141110] border border-[#241F1D] text-xs space-y-1">
                                            <div className="flex items-center justify-between text-[11px] text-[#9E938B]">
                                                <span>
                                                    {new Date(res.reservation_datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    res.status === 'Confirmed' ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                                                }`}>
                                                    {res.status}
                                                </span>
                                            </div>
                                            <p className="font-bold text-white leading-snug">
                                                {res.customer_name} ({res.guest_count} Pax)
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] text-xs text-[#9E938B]">
                                    Tidak ada reservasi pada {selectedCalDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}.
                                </div>
                            )}

                            {/* Priority Orders Needing Cashier ACC */}
                            <div className="pt-2 space-y-2">
                                <span className="text-[11px] font-bold text-amber-400 block">
                                    Menunggu Kasir ({pendingOrdersForAgenda.length})
                                </span>
                                {pendingOrdersForAgenda.length === 0 ? (
                                    <p className="text-xs text-[#9E938B] italic">Semua transaksi pesanan telah terverifikasi.</p>
                                ) : (
                                    pendingOrdersForAgenda.map(o => (
                                        <div key={o.id} className="p-2.5 rounded-xl bg-[#141110] border border-[#241F1D] text-xs space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-[#D4B886]">#{o.order_code}</span>
                                                <span className="text-[10px] text-amber-400 font-bold">{o.order_status}</span>
                                            </div>
                                            <p className="text-white font-medium truncate">
                                                {o.customer_name || 'Pelanggan'} · {o.order_type === 'dine_in' ? (o.table_number || 'Dine-in') : 'Takeaway'}
                                            </p>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="font-mono text-[#9E938B]">{formatIDR(o.total)}</span>
                                                <button
                                                    onClick={() => handleOpenCashModal(o)}
                                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase transition-colors"
                                                >
                                                    Bayar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            )}

            {/* ========================================================
                MODAL 1: CASH PAYMENT CONFIRMATION
            ======================================================== */}
            {cashPaymentOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md rounded-2xl bg-[#161312] border border-[#241F1D] shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#241F1D]">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-heading text-lg font-bold text-white">
                                    Penerimaan Pembayaran Tunai
                                </h3>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setCashPaymentOrder(null)}
                                className="text-[#9E938B] hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-[#9E938B]">Kode Pesanan:</span>
                                    <span className="font-mono font-bold text-white">#{cashPaymentOrder.order_code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#9E938B]">Tipe / Meja:</span>
                                    <span className="font-semibold text-[#D4B886]">
                                        {cashPaymentOrder.order_type === 'dine_in' ? cashPaymentOrder.table_number || 'Dine-in' : 'Takeaway'}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-[#241F1D]">
                                    <span className="text-[#F4EFE6] font-bold">Total Tagihan:</span>
                                    <span className="font-mono text-base font-bold text-[#D4B886]">
                                        {formatIDR(cashPaymentOrder.total)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white">
                                    Nominal Uang Tunai Diterima (Rp):
                                </label>
                                <input
                                    type="number"
                                    value={cashReceived || ''}
                                    onChange={(e) => setCashReceived(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#141110] border border-[#241F1D] font-mono text-base font-bold text-emerald-300 focus:outline-none focus:border-[#B99A65]"
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
                                className="flex-1 py-2.5 rounded-xl bg-[#241F1D] hover:bg-[#2D2622] text-[#9E938B] font-semibold text-xs transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCashPayment}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow transition-all"
                            >
                                Selesai & Kirim Dapur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: RECEIPT PRINT PREVIEW
            ======================================================== */}
            {receiptOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
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
                                <span className="font-bold">#{receiptOrder.order_code}</span>
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
