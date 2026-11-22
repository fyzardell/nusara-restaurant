// resources/js/Pages/Admin/Dashboard.tsx
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
    User,
    MonthSalesPoint,
    BestSellerTrend
} from '../../types';
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    QrCode,
    Calendar,
    History,
    MessageSquare,
    Search,
    TrendingUp,
    Users,
    MapPin,
    LogOut,
    ExternalLink,
    ChevronRight,
    ChevronLeft,
    Edit3,
    Star,
    X,
    RefreshCw,
    PanelRightClose,
    PanelRight,
    Menu as MenuIcon,
    Award,
    CreditCard,
    ArrowRight
} from 'lucide-react';
import CircularFloorPlan from '../../Components/CircularFloorPlan';

/* ============================================================
   ADMIN HEADER (dipakai juga oleh halaman Chats & ChatShow)
   - adminUser, onSelect, metrics bersifat opsional agar kompatibel
     dengan semua pemanggil lama (Dashboard lama & halaman Chat).
============================================================ */
export type DashboardTab = 'overview' | 'orders' | 'menus' | 'tables' | 'reservations' | 'audit';
export type AdminTab = DashboardTab | 'chats';

const adminTabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'orders', label: 'Pesanan', icon: ShoppingBag },
    { key: 'menus', label: 'Menu & Stok', icon: UtensilsCrossed },
    { key: 'tables', label: 'Meja & QR', icon: QrCode },
    { key: 'reservations', label: 'Reservasi', icon: Calendar },
    { key: 'audit', label: 'Audit Log', icon: History },
    { key: 'chats', label: 'Konsierge / Chat', icon: MessageSquare },
];

export function AdminHeader({ adminUser, active, onSelect, metrics }: {
    adminUser?: User;
    active?: AdminTab | string;
    onSelect?: (tab: DashboardTab) => void;
    metrics?: { activeOrders: number; pendingReservations: number; unreadChatCount?: number };
}) {
    const current = active ?? 'overview';

    const badge = (key: AdminTab) => {
        if (key === 'orders' && metrics && metrics.activeOrders > 0) {
            return (
                <span className="px-1.5 rounded-full text-[10px] bg-amber-500 text-black font-extrabold animate-pulse">
                    {metrics.activeOrders}
                </span>
            );
        }
        if (key === 'reservations' && metrics && metrics.pendingReservations > 0) {
            return (
                <span className="px-1.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                    {metrics.pendingReservations}
                </span>
            );
        }
        if (key === 'chats' && metrics && (metrics.unreadChatCount ?? 0) > 0) {
            return (
                <span className="px-1.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold animate-pulse">
                    {metrics.unreadChatCount}
                </span>
            );
        }
        return null;
    };

    return (
        <header className="sticky top-0 z-40 bg-[#141110] text-[#F4EFE6] border-b border-[#241F1D] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <Link href="/admin" className="flex items-center gap-2.5 text-stone-200 hover:text-[#D4B886] font-bold shrink-0">
                    <img src="/images/nusara-logo.png" alt="NUSARA — Nusantara & Rasa" className="h-7 w-auto object-contain" />
                    <span className="px-2 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[10px] font-bold text-[#D4B886] tracking-wider uppercase">
                        Admin Executive
                    </span>
                </Link>
                <nav className="hidden sm:flex items-center gap-1 ml-4 text-xs text-stone-400 overflow-x-auto scrollbar-none">
                    {adminTabs.map(({ key, label, icon: Icon }) => {
                        const cls = `px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                            current === key
                                ? 'text-[#D4B886] bg-[#211D1B] font-semibold border border-[#B99A65]/30'
                                : 'hover:text-stone-200'
                        }`;
                        const content = (
                            <>
                                <Icon className="w-3.5 h-3.5" />
                                <span>{label}</span>
                                {badge(key)}
                            </>
                        );

                        if (key === 'chats') {
                            return <Link key={key} href="/admin/chats" className={cls}>{content}</Link>;
                        }
                        if (onSelect) {
                            return <button key={key} onClick={() => onSelect(key as DashboardTab)} className={cls}>{content}</button>;
                        }
                        return (
                            <Link key={key} href={key === 'overview' ? '/admin' : `/admin?tab=${key}`} className={cls}>
                                {content}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {adminUser && (
                    <span className="text-xs text-stone-300 font-medium">{adminUser.name}</span>
                )}
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Konfirmasi Keluar: Apakah Anda yakin ingin keluar dari sesi Admin?')) {
                            router.post('/logout');
                        }
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-[#211D1B] transition-colors"
                    title="Keluar / Logout"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}

/* ============================================================
   DASHBOARD PAGE
============================================================ */
interface Props {
    metrics: AdminMetrics;
    orders: Order[];
    menus: Menu[];
    tables: RestaurantTable[];
    reservations: Reservation[];
    auditLogs: AuditLog[];
    settings: RestaurantSettings;
    adminUser: User;
    monthlySales?: MonthSalesPoint[];
    bestSellerTrends?: BestSellerTrend[];
}

const orderBadgeClass = (status: string) =>
    ['Served', 'Picked Up'].includes(status)
        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
        : status === 'Preparing'
        ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40 animate-pulse'
        : 'bg-sky-950/80 text-sky-300 border border-sky-600/40';

export default function AdminDashboard({
    metrics,
    orders: initialOrders,
    menus: initialMenus,
    tables: initialTables,
    reservations: initialReservations,
    auditLogs,
    settings,
    adminUser,
    monthlySales = [],
    bestSellerTrends = []
}: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    // App Shell 4 State: Navigation, Panels, and View
    // Tab awal bisa dibuka lewat /admin?tab=orders dari halaman lain (mis. halaman Chat)
    const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
        if (typeof window === 'undefined') return 'overview';
        const t = new URLSearchParams(window.location.search).get('tab');
        const valid: DashboardTab[] = ['orders', 'menus', 'tables', 'reservations', 'audit'];
        return valid.includes(t as DashboardTab) ? (t as DashboardTab) : 'overview';
    });
    const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

    // Chart Mode: 'bestseller' or 'revenue'
    const [chartMode, setChartMode] = useState<'bestseller' | 'revenue'>('bestseller');
    const [activeMenuHighlight, setActiveMenuHighlight] = useState<string | null>(null);
    const [chartHoverPoint, setChartHoverPoint] = useState<{
        x: number;
        y: number;
        title: string;
        value: string;
        subtitle: string;
    } | null>(null);

    // Calendar state for Right Inspector
    const today = useMemo(() => new Date(), []);
    const [currentCalMonth, setCurrentCalMonth] = useState<number>(today.getMonth());
    const [currentCalYear, setCurrentCalYear] = useState<number>(today.getFullYear());
    const [selectedCalDate, setSelectedCalDate] = useState<Date>(today);

    // Filter states for orders
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
    const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

    // Filter states for menu
    const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
    const [menuCatFilter, setMenuCatFilter] = useState<string>('all');
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

    const getMenuImageUrl = (path?: string) => {
        if (!path) return '/images/menus/sate-lilit.jpg';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/')) return path;
        return `/storage/${path}`;
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

    // Categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        initialMenus.forEach(m => {
            if (m.category_name) cats.add(m.category_name);
        });
        return Array.from(cats);
    }, [initialMenus]);

    // Filtered menus
    const filteredMenus = useMemo(() => {
        return initialMenus.filter(menu => {
            const matchesCat = menuCatFilter === 'all' || menu.category_name === menuCatFilter;
            const matchesSearch = menu.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                (menu.category_name && menu.category_name.toLowerCase().includes(menuSearchQuery.toLowerCase()));
            return matchesCat && matchesSearch;
        });
    }, [initialMenus, menuSearchQuery, menuCatFilter]);

    // Order status update
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

    // Save stock
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

    // Table status update
    const handleUpdateTableStatus = (tableId: number, status: string) => {
        router.post(`/admin/table/${tableId}/status`, {
            status: status,
        }, {
            preserveScroll: true,
        });
    };

    // Reservation status
    const handleUpdateReservationStatus = (reservationId: number, status: string) => {
        router.post(`/admin/reservation/${reservationId}/status`, {
            status: status,
        }, {
            preserveScroll: true,
        });
    };

    // Calendar Generation
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentCalYear, currentCalMonth, 1).getDay();
        const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentCalYear, currentCalMonth, 0).getDate();

        const days = [];
        // Previous month padding
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                day: daysInPrevMonth - i,
                isCurrentMonth: false,
                date: new Date(currentCalYear, currentCalMonth - 1, daysInPrevMonth - i)
            });
        }
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(currentCalYear, currentCalMonth, i)
            });
        }
        // Next month padding to fill grid
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

    // Calendar Month Name
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const nextCalMonth = () => {
        if (currentCalMonth === 11) {
            setCurrentCalMonth(0);
            setCurrentCalYear(y => y + 1);
        } else {
            setCurrentCalMonth(m => m + 1);
        }
    };

    const prevCalMonth = () => {
        if (currentCalMonth === 0) {
            setCurrentCalMonth(11);
            setCurrentCalYear(y => y - 1);
        } else {
            setCurrentCalMonth(m => m - 1);
        }
    };

    // Check if day has reservations
    const reservationsByDate = useMemo(() => {
        const map = new Map<string, Reservation[]>();
        initialReservations.forEach(res => {
            if (!res.reservation_datetime) return;
            const match = res.reservation_datetime.match(/^(\d{4}-\d{2}-\d{2})/);
            const dateStr = match ? match[1] : (res.reservation_datetime.includes('T')
                ? res.reservation_datetime.split('T')[0]
                : res.reservation_datetime.split(' ')[0]).trim();
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(res);
        });
        return map;
    }, [initialReservations]);

    // Format date key (YYYY-MM-DD)
    const getDateKey = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Filtered agenda items for "Up Next"
    const selectedDateKey = getDateKey(selectedCalDate);
    const dayReservations = reservationsByDate.get(selectedDateKey) || [];

    // Pending/Ready orders for agenda
    const pendingOrdersForAgenda = useMemo(() => {
        return initialOrders.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.order_status)).slice(0, 4);
    }, [initialOrders]);

    // SVG Chart Calculations for Best Seller Tracking
    const chartSvgProps = useMemo(() => {
        const width = 640;
        const height = 220;
        const padding = { top: 24, right: 30, bottom: 32, left: 45 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        if (chartMode === 'bestseller') {
            const allPoints = bestSellerTrends.flatMap(t => t.data.map(p => p.qty));
            const maxVal = Math.max(10, ...allPoints) * 1.15;
            const minVal = 0;

            const months = bestSellerTrends[0]?.data.map(d => d.month) || ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'];
            const stepX = plotWidth / (months.length - 1 || 1);

            const lines = bestSellerTrends.map(trend => {
                const points = trend.data.map((d, idx) => {
                    const x = padding.left + idx * stepX;
                    const y = padding.top + plotHeight - ((d.qty - minVal) / (maxVal - minVal)) * plotHeight;
                    return { x, y, qty: d.qty, month: d.month, fullMonth: d.fullMonth, name: trend.name };
                });

                // Generate path string
                const pathD = points.reduce((acc, p, i) => {
                    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, '');

                return {
                    name: trend.name,
                    color: trend.color,
                    totalQty: trend.totalQty,
                    pathD,
                    points
                };
            });

            return {
                width,
                height,
                padding,
                plotWidth,
                plotHeight,
                months,
                stepX,
                maxVal,
                lines,
                isRevenue: false
            };
        } else {
            // Revenue Mode
            const allRevs = monthlySales.map(m => m.revenue);
            const maxVal = Math.max(1000000, ...allRevs) * 1.15;
            const minVal = 0;
            const months = monthlySales.map(m => m.short);
            const stepX = plotWidth / (months.length - 1 || 1);

            const points = monthlySales.map((m, idx) => {
                const x = padding.left + idx * stepX;
                const y = padding.top + plotHeight - ((m.revenue - minVal) / (maxVal - minVal)) * plotHeight;
                return { x, y, revenue: m.revenue, orders: m.orders, month: m.short, fullMonth: m.label };
            });

            const pathD = points.reduce((acc, p, i) => {
                return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
            }, '');

            // Area path
            const areaD = points.length > 0
                ? `${pathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
                : '';

            return {
                width,
                height,
                padding,
                plotWidth,
                plotHeight,
                months,
                stepX,
                maxVal,
                points,
                pathD,
                areaD,
                isRevenue: true
            };
        }
    }, [chartMode, bestSellerTrends, monthlySales]);

    // Sidebar nav button style
    const navCls = (tab: DashboardTab) =>
        `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === tab
                ? 'bg-[#241F1D] text-white font-semibold shadow-inner'
                : 'text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18]'
        }`;
    const goTab = (tab: DashboardTab) => { setActiveTab(tab); setIsMobileSidebarOpen(false); };

    return (
        <div className="h-screen w-screen bg-[#110F0E] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#110F0E] flex overflow-hidden">
            <Head title="HQ Operations & Best Seller Analytics — NUSARA Admin" />

            {/* Flash Alerts (3 Detik Auto Dismiss) */}
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
                        <Link href="/admin" className="flex items-center gap-2.5">
                            <img 
                                src="/images/nusara-logo.png" 
                                alt="NUSARA — Nusantara & Rasa" 
                                className="h-8 w-auto object-contain drop-shadow" 
                            />
                            <div className="leading-tight">
                                <span className="px-2 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[9px] font-bold text-[#D4B886] tracking-wider uppercase block">
                                    Executive Desk
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
                        {/* Group 1: Operasional Utama */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Operasional
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button onClick={() => goTab('overview')} className={navCls('overview')}>
                                    <div className="flex items-center gap-2.5">
                                        <LayoutDashboard className="w-4 h-4 text-[#B99A65]" />
                                        <span>Ikhtisar & Tren</span>
                                    </div>
                                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'overview' ? 'opacity-100' : 'opacity-0'}`} />
                                </button>

                                <button onClick={() => goTab('orders')} className={navCls('orders')}>
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className="w-4 h-4 text-[#B99A65]" />
                                        <span>Antrean Pesanan</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        metrics.activeOrders > 0
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'text-[#9E938B]'
                                    }`}>
                                        {metrics.activeOrders > 0 ? metrics.activeOrders : metrics.totalOrders}
                                    </span>
                                </button>

                                <button onClick={() => goTab('menus')} className={navCls('menus')}>
                                    <div className="flex items-center gap-2.5">
                                        <UtensilsCrossed className="w-4 h-4 text-[#B99A65]" />
                                        <span>Katalog & Stok</span>
                                    </div>
                                    <span className="text-[10px] text-[#9E938B] font-mono">
                                        {initialMenus.length}
                                    </span>
                                </button>

                                <button onClick={() => goTab('tables')} className={navCls('tables')}>
                                    <div className="flex items-center gap-2.5">
                                        <QrCode className="w-4 h-4 text-[#B99A65]" />
                                        <span>Meja & Sesi QR</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 font-mono">
                                        {metrics.occupiedTables}/{metrics.totalTables}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Group 2: Layanan & Tamu */}
                        <div>
                            <span className="px-3 text-[10px] font-semibold tracking-wider text-[#9E938B] uppercase">
                                Layanan & Tamu
                            </span>
                            <div className="mt-1.5 space-y-1">
                                <button onClick={() => goTab('reservations')} className={navCls('reservations')}>
                                    <div className="flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-[#B99A65]" />
                                        <span>Jadwal Reservasi</span>
                                    </div>
                                    {metrics.pendingReservations > 0 ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                                            {metrics.pendingReservations}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-[#9E938B] font-mono">
                                            {initialReservations.length}
                                        </span>
                                    )}
                                </button>

                                {/* Riwayat Chat (halaman terpisah: /admin/chats) */}
                                <Link
                                    href="/admin/chats"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-[#F4EFE6] hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <MessageSquare className="w-4 h-4 text-[#B99A65]" />
                                        <span>Konsierge / Chat</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {(metrics.unreadChatCount ?? 0) > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                                                {metrics.unreadChatCount} baru
                                            </span>
                                        )}
                                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                    </div>
                                </Link>

                                <button onClick={() => goTab('audit')} className={navCls('audit')}>
                                    <div className="flex items-center gap-2.5">
                                        <History className="w-4 h-4 text-[#B99A65]" />
                                        <span>Audit Log</span>
                                    </div>
                                    <span className="text-[10px] text-[#9E938B] font-mono">
                                        {auditLogs.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Group 3: Akses Cepat */}
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
                                        <CreditCard className="w-4 h-4 text-[#B99A65]" />
                                        <span>Halaman Kasir POS</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </Link>

                                <Link
                                    href="/order"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9E938B] hover:text-white hover:bg-[#1E1A18] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ShoppingBag className="w-4 h-4 text-[#B99A65]" />
                                        <span>Order App (Customer)</span>
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
                                {adminUser.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate leading-tight">
                                    {adminUser.name}
                                </p>
                                <p className="text-[10px] text-[#B99A65] truncate">
                                    Executive Admin
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                        if (window.confirm('Konfirmasi Keluar: Apakah Anda yakin ingin keluar dari sesi Admin?')) {
                            router.post('/logout');
                        }
                    }}
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
                            <span className="font-semibold text-[#F4EFE6]">
                                {activeTab === 'overview' && 'Ikhtisar & Tren Penjualan'}
                                {activeTab === 'orders' && 'Antrean Pesanan'}
                                {activeTab === 'menus' && 'Katalog Menu & Stok'}
                                {activeTab === 'tables' && 'Meja Restoran & Sesi QR'}
                                {activeTab === 'reservations' && 'Jadwal Reservasi Tamu'}
                                {activeTab === 'audit' && 'Audit Log & Keamanan'}
                            </span>
                        </div>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-2">
                        {activeTab === 'orders' && (
                            <button
                                onClick={() => router.reload({ only: ['orders', 'metrics'] })}
                                className="px-3 py-1.5 rounded-lg bg-[#241F1D] border border-[#342D2A] text-xs font-semibold text-[#F4EFE6] hover:bg-[#2D2622] flex items-center gap-1.5 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-[#B99A65]" />
                                <span className="hidden sm:inline">Segarkan</span>
                            </button>
                        )}

                        {activeTab === 'menus' && (
                            <span className="text-[11px] text-[#B99A65] font-mono hidden sm:inline">
                                {metrics.totalTables} Meja · Senopati Branch
                            </span>
                        )}

                        {/* Inspector Toggle Button */}
                        <button
                            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                            title={isRightPanelOpen ? "Tutup Panel Jadwal" : "Buka Panel Jadwal"}
                            className={`p-2 rounded-lg border transition-all ${
                                isRightPanelOpen
                                    ? 'bg-[#241F1D] border-[#3D332D] text-[#D4B886]'
                                    : 'bg-transparent border-transparent text-[#9E938B] hover:text-white hover:bg-[#1E1A18]'
                            }`}
                        >
                            {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                        </button>
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#241F1D] p-4 sm:p-6 space-y-6">
                    {/* ====================================================
                        TAB 1: OVERVIEW & MONTHLY BEST SELLER LINE CHART
                    ==================================================== */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Chart mode pills */}
                            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#241F1D]">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setChartMode('bestseller')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            chartMode === 'bestseller'
                                                ? 'bg-white text-[#110F0E] shadow-sm font-bold'
                                                : 'bg-[#1C1816] text-[#9E938B] hover:text-[#F4EFE6] border border-[#2A2421]'
                                        }`}
                                    >
                                        Tren Menu Best Seller
                                    </button>
                                    <button
                                        onClick={() => setChartMode('revenue')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            chartMode === 'revenue'
                                                ? 'bg-white text-[#110F0E] shadow-sm font-bold'
                                                : 'bg-[#1C1816] text-[#9E938B] hover:text-[#F4EFE6] border border-[#2A2421]'
                                        }`}
                                    >
                                        Tren Omzet Bulanan
                                    </button>
                                </div>

                                <div className="text-xs text-[#9E938B] flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Single Branch · Senopati, Jakarta Selatan</span>
                                </div>
                            </div>

                            {/* KPI Metrics Cards Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] shadow-sm">
                                    <span className="text-[10px] uppercase tracking-wider text-[#9E938B] font-semibold block mb-1">
                                        Omzet Hari Ini
                                    </span>
                                    <p className="font-mono text-xl sm:text-2xl font-bold text-[#F4EFE6]">
                                        {formatRupiah(metrics.todayRevenue)}
                                    </p>
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>PB1 11% Included</span>
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] shadow-sm">
                                    <span className="text-[10px] uppercase tracking-wider text-[#9E938B] font-semibold block mb-1">
                                        Pesanan Aktif
                                    </span>
                                    <p className="font-mono text-xl sm:text-2xl font-bold text-amber-400">
                                        {metrics.activeOrders} <span className="text-xs font-normal text-[#9E938B]">Antrean</span>
                                    </p>
                                    <span className="text-[10px] text-[#9E938B] block mt-1">
                                        Total {metrics.totalOrders} Transaksi
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] shadow-sm">
                                    <span className="text-[10px] uppercase tracking-wider text-[#9E938B] font-semibold block mb-1">
                                        Okupansi Meja
                                    </span>
                                    <p className="font-mono text-xl sm:text-2xl font-bold text-white">
                                        {metrics.occupiedTables} / {metrics.totalTables} <span className="text-xs font-normal text-[#9E938B]">Meja</span>
                                    </p>
                                    <span className="text-[10px] text-emerald-400 block mt-1">
                                        {metrics.totalTables - metrics.occupiedTables} Meja Siap Pakai
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] shadow-sm">
                                    <span className="text-[10px] uppercase tracking-wider text-[#9E938B] font-semibold block mb-1">
                                        Reservasi Tertunda
                                    </span>
                                    <p className="font-mono text-xl sm:text-2xl font-bold text-rose-400">
                                        {metrics.pendingReservations} <span className="text-xs font-normal text-[#9E938B]">Permintaan</span>
                                    </p>
                                    <span className="text-[10px] text-[#9E938B] block mt-1">
                                        Menunggu Konfirmasi
                                    </span>
                                </div>
                            </div>

                            {/* MULTI-LINE CHART */}
                            <div className="p-5 rounded-2xl bg-[#161312] border border-[#241F1D] space-y-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-[#B99A65]" />
                                            <h3 className="font-heading text-base font-bold text-[#F4EFE6]">
                                                {chartMode === 'bestseller' ? 'Trajektori Penjualan Menu Best Seller (6 Bulan)' : 'Pertumbuhan Omzet Bulanan (6 Bulan)'}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-[#9E938B] mt-0.5">
                                            {chartMode === 'bestseller'
                                                ? 'Grafik garis pergerakan porsi terjual menu unggulan setiap bulan'
                                                : 'Total pendapatan kotor bulanan dari Dine-in dan Takeaway'}
                                        </p>
                                    </div>

                                    {chartMode === 'bestseller' && (
                                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                            {bestSellerTrends.map(t => (
                                                <button
                                                    key={t.name}
                                                    onClick={() => setActiveMenuHighlight(activeMenuHighlight === t.name ? null : t.name)}
                                                    className={`px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-all ${
                                                        activeMenuHighlight === t.name
                                                            ? 'bg-white text-black font-bold border-white'
                                                            : 'bg-[#1C1816] text-[#9E938B] border-[#2A2421] hover:border-[#3D332D]'
                                                    }`}
                                                >
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                                                    <span className="truncate max-w-[120px]">{t.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* SVG Chart Canvas */}
                                <div className="relative w-full overflow-x-auto bg-[#13100F] rounded-xl border border-[#221D1B] p-2">
                                    <svg
                                        viewBox={`0 0 ${chartSvgProps.width} ${chartSvgProps.height}`}
                                        className="w-full h-56 min-w-[500px]"
                                    >
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#D4B886" stopOpacity="0.35" />
                                                <stop offset="100%" stopColor="#D4B886" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Horizontal Grid lines */}
                                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                                            const y = chartSvgProps.padding.top + chartSvgProps.plotHeight * pct;
                                            return (
                                                <g key={i}>
                                                    <line
                                                        x1={chartSvgProps.padding.left}
                                                        y1={y}
                                                        x2={chartSvgProps.width - chartSvgProps.padding.right}
                                                        y2={y}
                                                        stroke="#241F1D"
                                                        strokeDasharray="3 3"
                                                    />
                                                </g>
                                            );
                                        })}

                                        {/* Month X Labels */}
                                        {chartSvgProps.months.map((m, idx) => {
                                            const x = chartSvgProps.padding.left + idx * chartSvgProps.stepX;
                                            return (
                                                <text
                                                    key={idx}
                                                    x={x}
                                                    y={chartSvgProps.height - 10}
                                                    textAnchor="middle"
                                                    fill="#6E625A"
                                                    fontSize="11"
                                                    fontFamily="monospace"
                                                >
                                                    {m}
                                                </text>
                                            );
                                        })}

                                        {chartMode === 'bestseller' ? (
                                            chartSvgProps.lines?.map((line) => {
                                                const isMuted = activeMenuHighlight && activeMenuHighlight !== line.name;
                                                const isSelected = activeMenuHighlight === line.name;

                                                return (
                                                    <g key={line.name} opacity={isMuted ? 0.2 : 1} className="transition-opacity duration-200">
                                                        <path
                                                            d={line.pathD}
                                                            fill="none"
                                                            stroke={line.color}
                                                            strokeWidth={isSelected ? 3.5 : 2}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />

                                                        {line.points.map((pt, pIdx) => (
                                                            <circle
                                                                key={pIdx}
                                                                cx={pt.x}
                                                                cy={pt.y}
                                                                r={isSelected ? 4.5 : 3.5}
                                                                fill="#110F0E"
                                                                stroke={line.color}
                                                                strokeWidth={2}
                                                                className="cursor-pointer hover:r-6 transition-all"
                                                                onMouseEnter={() => {
                                                                    setChartHoverPoint({
                                                                        x: pt.x,
                                                                        y: pt.y,
                                                                        title: pt.name,
                                                                        value: `${pt.qty} Porsi Terjual`,
                                                                        subtitle: `Periode: ${pt.fullMonth}`
                                                                    });
                                                                }}
                                                                onMouseLeave={() => setChartHoverPoint(null)}
                                                            />
                                                        ))}
                                                    </g>
                                                );
                                            })
                                        ) : (
                                            <g>
                                                {chartSvgProps.areaD && (
                                                    <path
                                                        d={chartSvgProps.areaD}
                                                        fill="url(#revenueGradient)"
                                                    />
                                                )}
                                                {chartSvgProps.pathD && (
                                                    <path
                                                        d={chartSvgProps.pathD}
                                                        fill="none"
                                                        stroke="#D4B886"
                                                        strokeWidth={3}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                )}
                                                {chartSvgProps.points?.map((pt, pIdx) => (
                                                    <circle
                                                        key={pIdx}
                                                        cx={pt.x}
                                                        cy={pt.y}
                                                        r={4.5}
                                                        fill="#110F0E"
                                                        stroke="#D4B886"
                                                        strokeWidth={2}
                                                        className="cursor-pointer hover:r-6 transition-all"
                                                        onMouseEnter={() => {
                                                            setChartHoverPoint({
                                                                x: pt.x,
                                                                y: pt.y,
                                                                title: pt.fullMonth,
                                                                value: formatRupiah(pt.revenue),
                                                                subtitle: `${pt.orders} Transaksi Pesanan`
                                                            });
                                                        }}
                                                        onMouseLeave={() => setChartHoverPoint(null)}
                                                    />
                                                ))}
                                            </g>
                                        )}
                                    </svg>

                                    {/* Tooltip Overlay */}
                                    {chartHoverPoint && (
                                        <div
                                            className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl bg-[#1E1A18] border border-[#B99A65]/50 shadow-2xl text-xs -translate-x-1/2 -translate-y-full -mt-2 transition-all"
                                            style={{ left: chartHoverPoint.x, top: chartHoverPoint.y }}
                                        >
                                            <p className="font-bold text-white text-[11px] leading-tight">{chartHoverPoint.title}</p>
                                            <p className="font-mono text-sm font-bold text-[#D4B886]">{chartHoverPoint.value}</p>
                                            <p className="text-[10px] text-[#9E938B]">{chartHoverPoint.subtitle}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Best Seller Ranking */}
                                {chartMode === 'bestseller' && (
                                    <div className="pt-2">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#B99A65] block mb-2">
                                            Peringkat Menu Paling Laris (Historis 6 Bulan)
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                                            {bestSellerTrends.map((trend, idx) => (
                                                <div
                                                    key={trend.name}
                                                    onClick={() => setActiveMenuHighlight(activeMenuHighlight === trend.name ? null : trend.name)}
                                                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                        activeMenuHighlight === trend.name
                                                            ? 'bg-[#241F1D] border-white shadow-md'
                                                            : 'bg-[#141110] border-[#241F1D] hover:border-[#3D332D]'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-stone-300">
                                                            #{idx + 1}
                                                        </span>
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: trend.color }}></span>
                                                    </div>
                                                    <p className="font-bold text-xs text-white truncate" title={trend.name}>
                                                        {trend.name}
                                                    </p>
                                                    <p className="text-[11px] font-mono font-bold text-[#D4B886] mt-0.5">
                                                        {trend.totalQty} Porsi
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recent Orders Feed */}
                            <div className="rounded-2xl bg-[#161312] border border-[#241F1D] overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-[#241F1D] flex items-center justify-between">
                                    <div>
                                        <h3 className="font-heading text-sm font-bold text-[#F4EFE6]">
                                            Antrean Pesanan Terkini
                                        </h3>
                                        <p className="text-[11px] text-[#9E938B]">
                                            Pantauan langsung pesanan masuk ke meja dan dapur
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className="text-xs text-[#B99A65] hover:text-[#D4B886] font-semibold flex items-center gap-1"
                                    >
                                        <span>Buka Semua Antrean</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-[#141110] text-[10px] uppercase text-[#9E938B] border-b border-[#241F1D]">
                                            <tr>
                                                <th className="py-2.5 px-4">Order</th>
                                                <th className="py-2.5 px-4">Pelanggan / Meja</th>
                                                <th className="py-2.5 px-4">Menu</th>
                                                <th className="py-2.5 px-4">Total</th>
                                                <th className="py-2.5 px-4">Status</th>
                                                <th className="py-2.5 px-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#241F1D]">
                                            {initialOrders.slice(0, 6).map(ord => (
                                                <tr key={ord.id} className="hover:bg-[#1E1A18] transition-colors">
                                                    <td className="py-2.5 px-4 font-mono font-bold text-[#D4B886]">
                                                        {ord.order_code}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span className="font-semibold text-white block">
                                                            {ord.customer_name || 'Tamu Restoran'}
                                                        </span>
                                                        <span className="text-[10px] text-[#9E938B]">
                                                            {ord.order_type === 'dine_in' ? ord.table_number || 'Dine-in' : 'Takeaway'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 max-w-xs truncate text-[#9E938B]">
                                                        {ord.items?.map(i => `${i.quantity}x ${i.menu_name_snapshot}`).join(', ') || '-'}
                                                    </td>
                                                    <td className="py-2.5 px-4 font-mono font-bold text-white">
                                                        {formatRupiah(ord.total)}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${orderBadgeClass(ord.order_status)}`}>
                                                            {ord.order_status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right">
                                                        <button
                                                            onClick={() => setSelectedOrderDetails(ord)}
                                                            className="px-2.5 py-1 rounded-md bg-[#241F1D] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#110F0E] transition-colors text-[11px] font-semibold"
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

                    {/* ====================================================
                        TAB 2: ANTREAN PESANAN (ORDERS QUEUE)
                    ==================================================== */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Search & Filters */}
                            <div className="flex flex-col gap-3 pb-3 border-b border-[#241F1D]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="relative w-full sm:w-80">
                                        <Search className="w-4 h-4 text-[#9E938B] absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={orderSearchQuery}
                                            onChange={(e) => setOrderSearchQuery(e.target.value)}
                                            placeholder="Cari kode order, tamu, meja..."
                                            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#161312] border border-[#241F1D] text-xs text-[#F4EFE6] placeholder-[#6E625A] focus:outline-none focus:border-[#B99A65]"
                                        />
                                    </div>

                                    {/* Filter Tipe Pesanan */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                        <span className="text-[10px] font-bold text-[#B99A65] uppercase mr-1">Tipe:</span>
                                        {['all', 'dine_in', 'takeaway'].map((tp) => (
                                            <button
                                                key={tp}
                                                onClick={() => setOrderTypeFilter(tp)}
                                                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                                                    orderTypeFilter === tp
                                                        ? 'bg-white text-[#110F0E] font-bold shadow-sm'
                                                        : 'bg-[#161312] text-[#9E938B] hover:text-[#F4EFE6] border border-[#241F1D]'
                                                }`}
                                            >
                                                {tp === 'all' ? 'Semua Tipe' : (tp === 'dine_in' ? 'Dine-in (Meja)' : 'Takeaway')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Filter Status */}
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="text-[10px] font-bold text-[#B99A65] uppercase mr-1">Status:</span>
                                    {['all', 'Pending', 'Preparing', 'Ready', 'Served', 'Picked Up', 'Paid', 'Cancelled'].map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setOrderStatusFilter(st)}
                                            className={`px-3 py-1 rounded-lg font-medium transition-all ${
                                                orderStatusFilter === st
                                                    ? 'bg-white text-[#110F0E] font-bold shadow-sm'
                                                    : 'bg-[#161312] text-[#9E938B] hover:text-[#F4EFE6] border border-[#241F1D]'
                                            }`}
                                        >
                                            {st === 'all' ? 'Semua' : st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Full Table */}
                            <div className="rounded-2xl bg-[#161312] border border-[#241F1D] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-[#141110] text-[10px] uppercase tracking-wider text-[#9E938B] border-b border-[#241F1D]">
                                            <tr>
                                                <th className="py-3 px-4">Kode Order</th>
                                                <th className="py-3 px-4">Waktu</th>
                                                <th className="py-3 px-4">Pelanggan</th>
                                                <th className="py-3 px-4">Tipe / Meja</th>
                                                <th className="py-3 px-4">Menu Pesanan</th>
                                                <th className="py-3 px-4">Total</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4 text-center">Ubah Status</th>
                                                <th className="py-3 px-4 text-right">Detail</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#241F1D]">
                                            {filteredOrders.map(order => (
                                                <tr key={order.id} className="hover:bg-[#1E1A18] transition-colors">
                                                    <td className="py-3 px-4 font-mono font-bold text-[#D4B886]">
                                                        {order.order_code}
                                                    </td>
                                                    <td className="py-3 px-4 text-[#9E938B]">
                                                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-white">
                                                        {order.customer_name || 'Guest Pelanggan'}
                                                        {order.customer_phone && (
                                                            <span className="block text-[10px] text-[#9E938B] font-mono">
                                                                {order.customer_phone}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#241F1D] text-[#D4B886]">
                                                            {order.order_type === 'dine_in' ? (order.table_number || 'Dine-in') : 'Takeaway'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 max-w-xs truncate text-[#9E938B]">
                                                        {order.items?.map(it => `${it.quantity}x ${it.menu_name_snapshot}`).join(', ') || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-bold text-white">
                                                        {formatRupiah(order.total)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${orderBadgeClass(order.order_status)}`}>
                                                            {order.order_status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <select
                                                            value={order.order_status}
                                                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                            className="px-2 py-1 rounded-md bg-[#241F1D] border border-[#342D2A] text-xs text-[#F4EFE6] focus:outline-none focus:border-[#B99A65]"
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
                                                            className="px-2.5 py-1 rounded-md bg-[#241F1D] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#110F0E] transition-colors text-[11px] font-semibold"
                                                        >
                                                            Nota
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan={9} className="py-10 text-center text-[#9E938B]">
                                                        Tidak ada pesanan yang cocok dengan filter.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ====================================================
                        TAB 3: KATALOG MENU & STOK
                    ==================================================== */}
                    {activeTab === 'menus' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#241F1D]">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 text-[#9E938B] absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={menuSearchQuery}
                                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                                        placeholder="Cari menu atau kategori..."
                                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#161312] border border-[#241F1D] text-xs text-[#F4EFE6] placeholder-[#6E625A] focus:outline-none focus:border-[#B99A65]"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <button
                                        onClick={() => setMenuCatFilter('all')}
                                        className={`px-3 py-1 rounded-lg font-medium transition-all ${
                                            menuCatFilter === 'all'
                                                ? 'bg-white text-[#110F0E] font-bold shadow-sm'
                                                : 'bg-[#161312] text-[#9E938B] hover:text-[#F4EFE6] border border-[#241F1D]'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setMenuCatFilter(cat)}
                                            className={`px-3 py-1 rounded-lg font-medium transition-all ${
                                                menuCatFilter === cat
                                                    ? 'bg-white text-[#110F0E] font-bold shadow-sm'
                                                    : 'bg-[#161312] text-[#9E938B] hover:text-[#F4EFE6] border border-[#241F1D]'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-[11px] text-[#9E938B]">
                                Pantau stok hidangan secara real-time. Menu habis otomatis berstatus disabled di halaman pemesanan pelanggan.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredMenus.map(menu => {
                                    const isOut = !menu.is_available || menu.stock_quantity <= 0;
                                    return (
                                        <div
                                            key={menu.id}
                                            className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] flex flex-col justify-between space-y-3"
                                        >
                                            <div className="flex gap-3">
                                                {menu.image_path ? (
                                                    <img
                                                        src={getMenuImageUrl(menu.image_path)}
                                                        alt={menu.name}
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/images/menus/sate-lilit.jpg';
                                                        }}
                                                        className="w-16 h-16 rounded-xl object-cover border border-[#241F1D] flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-xl bg-[#241F1D] flex items-center justify-center text-[#B99A65] font-bold flex-shrink-0">
                                                        N
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <span className="text-[10px] uppercase font-bold text-[#B99A65]">
                                                        {menu.category_name}
                                                    </span>
                                                    <h4 className="font-heading text-sm font-bold text-white truncate">
                                                        {menu.name}
                                                    </h4>
                                                    <span className="font-mono text-xs font-bold text-[#D4B886] block mt-0.5">
                                                        {formatRupiah(menu.price)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-[#141110] border border-[#241F1D] flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="text-[#9E938B] text-[10px] block">Stok Real-time:</span>
                                                    <span className="font-mono font-bold text-white">
                                                        {menu.stock_quantity} Porsi
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    isOut
                                                        ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
                                                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
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
                                                className="w-full py-2 rounded-lg bg-[#241F1D] text-[#D4B886] hover:bg-[#B99A65] hover:text-[#110F0E] transition-colors font-semibold text-xs flex items-center justify-center gap-1.5"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>Ubah Stok & Status</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ====================================================
                        TAB 4: STATUS MEJA & SESI QR
                    ==================================================== */}
                    {activeTab === 'tables' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Interactive Circular Floor Plan Meja 01 s/d Meja 10 (Full Control) */}
                            <CircularFloorPlan
                                tables={initialTables}
                                reservations={initialReservations}
                                selectedDate={selectedCalDate}
                                role="admin"
                                onValidateTable={(id) => handleUpdateTableStatus(id, 'Occupied')}
                                onStartCleaning={(id) => handleUpdateTableStatus(id, 'Cleaning')}
                                onFinishCleaning={(id) => handleUpdateTableStatus(id, 'Available')}
                                onUpdateStatus={handleUpdateTableStatus}
                            />

                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                <div>
                                    <h3 className="font-heading text-base font-bold text-white">
                                        Daftar Detail {metrics.totalTables} Meja Makan Nusara
                                    </h3>
                                    <p className="text-xs text-[#9E938B]">
                                        Kelola ketersediaan meja restoran Senopati Flagship. Pastikan meja berstatus Available setelah dibersihkan oleh waiter.
                                    </p>
                                </div>
                                <span className="text-xs font-mono text-emerald-400">
                                    {metrics.occupiedTables} Terisi / {metrics.totalTables} Total
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {initialTables.map(tbl => {
                                    const isAvailable = tbl.status === 'Available';
                                    const isOccupied = tbl.status === 'Occupied';
                                    const isCleaning = tbl.status === 'Cleaning';

                                    return (
                                        <div
                                            key={tbl.id}
                                            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                                                isOccupied
                                                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                                                    : isCleaning
                                                    ? 'bg-sky-950/20 border-sky-500/40'
                                                    : 'bg-[#161312] border-[#241F1D]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-heading text-lg font-bold text-white">
                                                    {tbl.table_number}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                    isAvailable
                                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                                                        : isOccupied
                                                        ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40 animate-pulse'
                                                        : 'bg-sky-950/80 text-sky-300 border border-sky-600/40'
                                                }`}>
                                                    {tbl.status}
                                                </span>
                                            </div>

                                            <div className="text-[11px] text-[#9E938B] space-y-1">
                                                <p className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-[#B99A65] shrink-0" />
                                                    <span>{tbl.capacity} Kursi Tamu</span>
                                                </p>
                                                <p className="flex items-center gap-1.5 truncate">
                                                    <MapPin className="w-3.5 h-3.5 text-[#B99A65] shrink-0" />
                                                    <span className="truncate">{tbl.location}</span>
                                                </p>
                                                {tbl.active_session && (
                                                    <p className="text-[#D4B886] font-mono text-[10px] truncate">
                                                        QR: {tbl.active_session.session_code}
                                                    </p>
                                                )}
                                            </div>

                                            <select
                                                value={tbl.status}
                                                onChange={(e) => handleUpdateTableStatus(tbl.id, e.target.value)}
                                                className="w-full px-2 py-1 rounded-md bg-[#241F1D] border border-[#342D2A] text-[#F4EFE6] text-xs font-semibold focus:outline-none focus:border-[#B99A65]"
                                            >
                                                <option value="Available">Available (Siap Digunakan)</option>
                                                <option value="Occupied">Occupied (Tamu Duduk)</option>
                                                <option value="Reserved">Reserved (Dipesan)</option>
                                                <option value="Cleaning">Cleaning (Sedang Dibersihkan)</option>
                                                <option value="Inactive">Inactive (Tutup)</option>
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ====================================================
                        TAB 5: JADWAL RESERVASI TAMU
                    ==================================================== */}
                    {activeTab === 'reservations' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between pb-2 border-b border-[#241F1D]">
                                <div>
                                    <h3 className="font-heading text-base font-bold text-white">
                                        Buku Tamu & Jadwal Reservasi Meja
                                    </h3>
                                    <p className="text-xs text-[#9E938B]">
                                        Kelola permohonan reservasi meja online dan paket Dining Experience
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-[#161312] border border-[#241F1D] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-[#141110] text-[10px] uppercase tracking-wider text-[#9E938B] border-b border-[#241F1D]">
                                            <tr>
                                                <th className="py-3 px-4">Booking</th>
                                                <th className="py-3 px-4">Tamu</th>
                                                <th className="py-3 px-4">Jadwal & Jam</th>
                                                <th className="py-3 px-4">Pax</th>
                                                <th className="py-3 px-4">Paket Experience</th>
                                                <th className="py-3 px-4">Permintaan Khusus</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4 text-right">Tindakan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#241F1D]">
                                            {initialReservations.map(res => (
                                                <tr key={res.id} className="hover:bg-[#1E1A18] transition-colors">
                                                    <td className="py-3 px-4 font-mono font-bold text-[#D4B886]">
                                                        {res.reservation_code}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-white">
                                                        {res.customer_name || 'Tamu NUSARA'}
                                                        <span className="block text-[10px] text-[#9E938B] font-mono">
                                                            {res.customer_phone}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-[#9E938B]">
                                                        {new Date(res.reservation_datetime.replace(' ', 'T')).toLocaleDateString('id-ID', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}, {new Date(res.reservation_datetime.replace(' ', 'T')).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-white">
                                                        {res.guest_count} Orang
                                                    </td>
                                                    <td className="py-3 px-4 text-[#D4B886]">
                                                        {res.experience_name || 'A la Carte Standard'}
                                                    </td>
                                                    <td className="py-3 px-4 max-w-xs text-stone-300 italic">
                                                        {res.special_request || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            res.status === 'Confirmed'
                                                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                                                                : res.status === 'Pending'
                                                                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                                                                : 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
                                                        }`}>
                                                            {res.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right space-x-1.5">
                                                        {res.status === 'Pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateReservationStatus(res.id, 'Confirmed')}
                                                                    className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-500 text-[11px]"
                                                                >
                                                                    Konfirmasi
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateReservationStatus(res.id, 'Rejected')}
                                                                    className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold hover:bg-rose-500 text-[11px]"
                                                                >
                                                                    Tolak
                                                                </button>
                                                            </>
                                                        )}
                                                        {res.status === 'Confirmed' && (
                                                            <button
                                                                onClick={() => handleUpdateReservationStatus(res.id, 'Completed')}
                                                                className="px-2.5 py-1 rounded-md bg-[#241F1D] text-[#D4B886] font-bold hover:bg-[#B99A65] hover:text-[#110F0E] text-[11px]"
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

                    {/* ====================================================
                        TAB 6: AUDIT LOG
                    ==================================================== */}
                    {activeTab === 'audit' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="pb-2 border-b border-[#241F1D]">
                                <h3 className="font-heading text-base font-bold text-white">
                                    Audit Log Keamanan & Aktivitas Operasional
                                </h3>
                                <p className="text-xs text-[#9E938B]">
                                    Semua catatan mutasi status pesanan, stok, dan sesi meja
                                </p>
                            </div>

                            <div className="rounded-2xl bg-[#161312] border border-[#241F1D] p-4 space-y-2.5 shadow-sm">
                                {auditLogs.length > 0 ? (
                                    auditLogs.map(log => (
                                        <div
                                            key={log.id}
                                            className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-[#241F1D] text-[#D4B886] flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 mt-0.5">
                                                    LOG
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#D4B886]">{log.action}</span>
                                                    <p className="text-[#F4EFE6] mt-0.5">{log.description}</p>
                                                    <span className="text-[10px] text-[#9E938B]">
                                                        Oleh: {log.user_name || 'Sistem'} · {log.entity_type} #{log.entity_id}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-[#9E938B] font-mono flex-shrink-0">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-[#6E625A] text-xs">
                                        Belum ada catatan aktivitas di audit log.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ========================================================
                APP SHELL 4: COLUMN 3 — RIGHT SCHEDULE / CALENDAR PANEL
            ======================================================== */}
            {isRightPanelOpen && (
                <aside className="w-80 flex-shrink-0 bg-[#161312] border-l border-[#241F1D] flex flex-col h-full z-30 transition-all duration-300">
                    <div className="h-14 px-5 border-b border-[#241F1D] flex items-center justify-between flex-shrink-0">
                        <h2 className="font-heading font-bold text-sm tracking-wide text-[#F4EFE6]">
                            Schedule
                        </h2>
                        <button
                            onClick={() => setIsRightPanelOpen(false)}
                            className="p-1.5 rounded-lg text-[#9E938B] hover:text-white hover:bg-[#241F1D] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#241F1D] p-5 space-y-6">
                        {/* Month Header & Navigation */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-heading font-bold text-sm text-[#F4EFE6]">
                                    {monthNames[currentCalMonth]} {currentCalYear}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={prevCalMonth}
                                        className="p-1 rounded-md text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={nextCalMonth}
                                        className="p-1 rounded-md text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayHead, i) => (
                                    <span key={i} className="py-1 text-[11px] font-semibold text-[#6E625A]">
                                        {dayHead}
                                    </span>
                                ))}

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

                        {/* Up Next */}
                        <div className="space-y-3 pt-4 border-t border-[#241F1D]">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#F4EFE6]">
                                    Up next
                                </span>
                                <span className="text-[10px] text-[#9E938B]">
                                    {selectedCalDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            {dayReservations.length > 0 ? (
                                <div className="space-y-3">
                                    {dayReservations.map(res => (
                                        <div
                                            key={res.id}
                                            onClick={() => setActiveTab('reservations')}
                                            className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] hover:border-[#D4B886]/40 text-xs space-y-1 transition-all cursor-pointer group"
                                            title="Klik untuk membuka tab Reservasi"
                                        >
                                            <div className="flex items-center justify-between text-[11px] text-[#9E938B]">
                                                <span className="font-mono text-[#D4B886] font-semibold group-hover:text-white transition-colors">
                                                    #{res.reservation_code}
                                                </span>
                                                <span>
                                                    {new Date(res.reservation_datetime.replace(' ', 'T')).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    res.status === 'Confirmed' ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                                                }`}>
                                                    {res.status}
                                                </span>
                                            </div>
                                            <p className="font-bold text-white leading-snug">
                                                {res.customer_name || 'Tamu Restoran'} ({res.guest_count} Pax)
                                            </p>
                                            <p className="text-[11px] text-[#D4B886]">
                                                {res.experience_name || 'Meja Reguler'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] text-xs text-[#9E938B]">
                                    Tidak ada reservasi pada {selectedCalDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}.
                                </div>
                            )}

                            {/* Active Kitchen Orders */}
                            <div className="pt-2">
                                <span className="text-[11px] font-bold text-[#9E938B] block mb-2">
                                    Pesanan Dalam Proses ({pendingOrdersForAgenda.length})
                                </span>
                                <div className="space-y-2">
                                    {pendingOrdersForAgenda.map(o => (
                                        <div
                                            key={o.id}
                                            onClick={() => setSelectedOrderDetails(o)}
                                            className="p-2.5 rounded-xl bg-[#141110] border border-[#241F1D] hover:border-[#3D332D] cursor-pointer text-xs transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-[#D4B886]">#{o.order_code}</span>
                                                <span className="text-[10px] text-amber-400 font-bold">{o.order_status}</span>
                                            </div>
                                            <p className="text-white font-medium truncate mt-0.5">
                                                {o.customer_name || 'Pelanggan'} · {o.order_type === 'dine_in' ? (o.table_number || 'Dine-in') : 'Takeaway'}
                                            </p>
                                            <p className="text-[11px] text-[#9E938B] font-mono mt-0.5">
                                                {formatRupiah(o.total)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            )}

            {/* ========================================================
                MODAL 1: ORDER DETAIL DRAWER
            ======================================================== */}
            {selectedOrderDetails && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-lg bg-[#161312] border-l border-[#241F1D] h-full p-6 text-[#F4EFE6] flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-[#241F1D] pb-3">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#B99A65] tracking-widest">
                                        Rincian Nota & Status Pesanan
                                    </span>
                                    <h3 className="font-heading text-2xl font-bold text-white">
                                        #{selectedOrderDetails.order_code}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedOrderDetails(null)}
                                    className="p-2 rounded-full text-[#9E938B] hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D]">
                                    <span className="text-[#9E938B] block text-[10px]">Tipe Pesanan</span>
                                    <span className="font-bold text-white">
                                        {selectedOrderDetails.order_type === 'dine_in' ? `Dine-in (${selectedOrderDetails.table_number || 'Meja'})` : 'Takeaway (Pickup)'}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D]">
                                    <span className="text-[#9E938B] block text-[10px]">Waktu Masuk</span>
                                    <span className="font-bold text-white">
                                        {new Date(selectedOrderDetails.created_at).toLocaleTimeString('id-ID')} WIB
                                    </span>
                                </div>
                            </div>

                            {/* Customer info */}
                            <div className="p-3.5 rounded-2xl bg-[#141110] border border-[#241F1D] text-xs">
                                <span className="text-[10px] uppercase font-bold text-[#B99A65]">Informasi Pelanggan:</span>
                                <p className="font-semibold text-white mt-1">
                                    {selectedOrderDetails.customer_name || 'Tamu Restoran'}
                                </p>
                                {selectedOrderDetails.customer_phone && (
                                    <p className="font-mono text-[#9E938B] text-[11px]">
                                        {selectedOrderDetails.customer_phone}
                                    </p>
                                )}
                            </div>

                            {/* Items list */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold text-[#B99A65]">Item Pesanan:</span>
                                {selectedOrderDetails.items?.map(it => (
                                    <div key={it.id} className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] text-xs">
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
                                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs">
                                    <strong>Catatan Meja:</strong> {selectedOrderDetails.customer_notes}
                                </div>
                            )}

                            {/* Rating if available */}
                            {selectedOrderDetails.rating && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
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
                        <div className="pt-4 border-t border-[#241F1D] space-y-3">
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
                    <div className="relative w-full max-w-md bg-[#161312] border border-[#241F1D] rounded-3xl p-6 shadow-2xl text-[#F4EFE6]">
                        <button
                            onClick={() => setEditingMenuStock(null)}
                            className="absolute top-4 right-4 p-2 rounded-full text-[#9E938B] hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="font-heading text-xl font-bold text-white mb-1">
                            Sesuaikan Stok Hidangan
                        </h3>
                        <p className="text-xs text-[#B99A65] mb-4">
                            {editingMenuStock.name}
                        </p>

                        <form onSubmit={handleSaveStock} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9E938B] mb-1.5">
                                    Jumlah Kuantitas Stok (Porsi):
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={newStockQuantity}
                                    onChange={(e) => setNewStockQuantity(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#141110] border border-[#241F1D] text-[#F4EFE6] font-mono text-sm focus:outline-none focus:border-[#B99A65]"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    id="is_available_toggle"
                                    type="checkbox"
                                    checked={newIsAvailable}
                                    onChange={(e) => setNewIsAvailable(e.target.checked)}
                                    className="w-4 h-4 rounded bg-[#141110] border-[#241F1D] text-[#B99A65] cursor-pointer"
                                />
                                <label htmlFor="is_available_toggle" className="text-xs text-[#F4EFE6] cursor-pointer">
                                    Menu Aktif & Dapat Dipesan Pelanggan
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-white text-[#110F0E] font-bold text-xs uppercase tracking-wider hover:bg-[#F4EFE6] transition-all shadow-md"
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
