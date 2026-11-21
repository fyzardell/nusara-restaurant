// resources/js/Pages/Customer/Reservation.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    Users, 
    Utensils, 
    UtensilsCrossed,
    MapPin, 
    Sparkles, 
    ShieldCheck, 
    Check, 
    Lock, 
    AlertCircle, 
    ChevronRight, 
    ChevronLeft, 
    X, 
    Info, 
    Phone, 
    User as UserIcon, 
    History, 
    CheckCircle2, 
    ArrowRight,
    LogOut,
    QrCode,
    Plus,
    Search,
    BookOpen,
    Filter,
    Layers,
    ExternalLink,
    FileText,
    Eye,
    Table as TableIcon,
    Menu as MenuIcon,
    CreditCard,
    Building2,
    Heart,
    MessageSquare,
    DollarSign,
    CheckSquare,
    Square
} from 'lucide-react';
import FlashToast from '../../Components/FlashToast';
import { DiningExperience, RestaurantTable, OperatingHour, RestaurantSettings, User, Menu } from '../../types';

interface ReservationItem {
    id: number;
    reservation_code: string;
    reservation_datetime: string;
    duration_minutes: number;
    status: string;
    guest_count: number;
    table_id: number;
}

interface CustomerReservationHistory {
    id: number;
    reservation_code: string;
    reservation_datetime: string;
    guest_count: number;
    duration_minutes: number;
    status: string;
    special_request?: string | null;
    created_at: string;
    experience_name?: string | null;
    table_number?: string | null;
}

interface Props {
    auth: {
        user: User;
    };
    customer?: {
        id: number;
        name: string;
        email?: string;
        phone_normalized?: string;
    } | null;
    tables: RestaurantTable[];
    experiences: DiningExperience[];
    menus?: Menu[];
    operatingHours: OperatingHour[];
    settings?: RestaurantSettings | null;
    reservations: ReservationItem[];
    customerReservations: CustomerReservationHistory[];
    nowJakarta: {
        iso: string;
        date: string;
        time: string;
        hour: number;
        minute: number;
    };
    preselectedExperience?: string | number | null;
}

type AppShell8Tab = 'all' | 'pending' | 'confirmed' | 'completed' | 'experiences' | 'menu' | 'tables' | 'policy';

export default function Reservation({
    auth,
    customer,
    tables = [],
    experiences = [],
    menus = [],
    operatingHours = [],
    settings,
    reservations = [],
    customerReservations = [],
    nowJakarta,
    preselectedExperience
}: Props) {
    // App Shell 8 Active View State
    const [activeTab, setActiveTab] = useState<AppShell8Tab>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming'>('all');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

    // Slide-over / Modal Booking Drawer State ("+ Book job" style)
    const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState<boolean>(!!preselectedExperience);
    const [drawerStep, setDrawerStep] = useState<'details' | 'payment'>('details');
    const [selectedReservationDetail, setSelectedReservationDetail] = useState<CustomerReservationHistory | null>(null);

    // Filter kategori paket di drawer/katalog
    const [experienceCategory, setExperienceCategory] = useState<'all' | 'chef' | 'buyout' | 'regular'>('all');

    // Digital Menu Modal state for A La Carte preview
    const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
    const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
    const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('all');

    // Date calculations in Jakarta Time
    const initialDate = nowJakarta?.date || new Date().toISOString().split('T')[0];

    // Form state for creating a new reservation
    const { data, setData, post, processing, errors, reset } = useForm({
        date: initialDate,
        time: '18:30',
        guest_count: 2,
        experience_id: preselectedExperience ? Number(preselectedExperience) : '',
        table_id: '' as number | string,
        table_ids: [] as number[],
        customer_name: customer?.name || auth.user.name || '',
        customer_phone: customer?.phone_normalized || '+6281234567890',
        special_request: '',
        dp_amount: 150000,
        dp_payment_method: 'qris' as 'qris' | 'bca' | 'mandiri',
    });

    // Multi-table selection state
    const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
    const [isDpConfirmed, setIsDpConfirmed] = useState<boolean>(false);

    // Calendar Popup State for the main date field
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Live clock for Jakarta time
    const [currentTimeWib, setCurrentTimeWib] = useState(nowJakarta?.time || '12:00');
    useEffect(() => {
        const timer = setInterval(() => {
            const jkt = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
            const h = String(jkt.getHours()).padStart(2, '0');
            const m = String(jkt.getMinutes()).padStart(2, '0');
            setCurrentTimeWib(`${h}:${m}`);
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    // Format Rupiah currency
    const formatRupiah = (val: number | null | undefined) => {
        if (!val) return 'Rp 0';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    // Selected Experience Object
    const selectedExpObj = useMemo(() => {
        return experiences.find(e => e.id === Number(data.experience_id)) || null;
    }, [experiences, data.experience_id]);

    // Deteksi Paket Sewa 1 Resto (Buyout)
    const isBuyout50 = useMemo(() => {
        return selectedExpObj?.slug?.includes('50-pax') || false;
    }, [selectedExpObj]);

    const isBuyoutRomantic = useMemo(() => {
        return selectedExpObj?.slug?.includes('privat-berdua') || false;
    }, [selectedExpObj]);

    const isAnyBuyout = isBuyout50 || isBuyoutRomantic;

    // Ketentuan Jumlah Meja yang Wajib Dipilih (Maks. 5 Orang/Meja)
    const requiredTableCount = useMemo(() => {
        if (isAnyBuyout) return 10; // Sewa 1 resto mengamankan 10 meja
        if (data.guest_count > 5) return 2; // 6-10 orang = wajib 2 meja!
        return 1; // 1-5 orang = 1 meja
    }, [isAnyBuyout, data.guest_count]);

    // Hitungan Down Payment (DP) Wajib
    const calculatedDpAmount = useMemo(() => {
        if (isBuyout50) return 3000000;
        if (isBuyoutRomantic) return 1500000;
        if (requiredTableCount === 2) return 300000;
        return 150000;
    }, [isBuyout50, isBuyoutRomantic, requiredTableCount]);

    useEffect(() => {
        setData('dp_amount', calculatedDpAmount);
    }, [calculatedDpAmount]);

    // Auto-update guest count jika paket sewa resto dipilih
    useEffect(() => {
        if (isBuyout50 && data.guest_count !== 50) {
            setData('guest_count', 50);
        } else if (isBuyoutRomantic && data.guest_count !== 2) {
            setData('guest_count', 2);
        }
    }, [isBuyout50, isBuyoutRomantic]);

    // Check if the selected date is Today in Jakarta time
    const isSelectedDateToday = useMemo(() => {
        return data.date === (nowJakarta?.date || new Date().toISOString().split('T')[0]);
    }, [data.date, nowJakarta?.date]);

    // Current hour & minute in Jakarta for 3-hour buffer
    const currentWibMinutes = useMemo(() => {
        const parts = currentTimeWib.split(':');
        const h = parseInt(parts[0] || '0', 10);
        const m = parseInt(parts[1] || '0', 10);
        return h * 60 + m;
    }, [currentTimeWib]);

    // Available operating time slots (every 30 minutes from 11:30 to 21:00)
    const timeSlots = useMemo(() => {
        const slots: { time: string; label: string; isPastOrCutoff: boolean; reason?: string }[] = [];
        const openH = 11;
        const openM = 30;
        const closeH = 21;
        const closeM = 0;

        let current = openH * 60 + openM;
        const end = closeH * 60 + closeM;

        while (current <= end) {
            const h = Math.floor(current / 60);
            const m = current % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            let isPastOrCutoff = false;
            let reason = '';

            if (isSelectedDateToday) {
                if (current <= currentWibMinutes) {
                    isPastOrCutoff = true;
                    reason = 'Waktu telah lewat';
                } else if (current - currentWibMinutes < 180) {
                    isPastOrCutoff = true;
                    reason = 'Terkunci (Min. 3 Jam)';
                }
            }

            slots.push({
                time: timeStr,
                label: `${timeStr} WIB`,
                isPastOrCutoff,
                reason
            });

            current += 30;
        }
        return slots;
    }, [isSelectedDateToday, currentWibMinutes]);

    // Real-Time Table Availability & Collision Check
    const tableAvailabilityMap = useMemo(() => {
        const map = new Map<number, { isAvailable: boolean; bookedByCode?: string; bookedTime?: string }>();
        if (!data.date || !data.time) {
            tables.forEach(t => map.set(t.id, { isAvailable: true }));
            return map;
        }

        const [reqH, reqM] = data.time.split(':').map(Number);
        const reqTotalMin = reqH * 60 + reqM;
        const durationMin = selectedExpObj?.duration_minutes || 120;

        tables.forEach(t => {
            const conflict = reservations.find(r => {
                if (Number(r.table_id) !== t.id) return false;
                const rDateStr = r.reservation_datetime.split('T')[0] || r.reservation_datetime.split(' ')[0];
                if (rDateStr !== data.date) return false;

                const rTimeStr = (r.reservation_datetime.split('T')[1] || r.reservation_datetime.split(' ')[1] || '').substring(0, 5);
                const [rH, rM] = rTimeStr.split(':').map(Number);
                const rTotalMin = rH * 60 + rM;

                return Math.abs(reqTotalMin - rTotalMin) < (durationMin - 15);
            });

            if (conflict) {
                const confTime = (conflict.reservation_datetime.split('T')[1] || conflict.reservation_datetime.split(' ')[1] || '').substring(0, 5);
                map.set(t.id, {
                    isAvailable: false,
                    bookedByCode: conflict.reservation_code,
                    bookedTime: confTime ? `${confTime} WIB` : 'Terjadwal'
                });
            } else {
                map.set(t.id, { isAvailable: true });
            }
        });

        return map;
    }, [tables, reservations, data.date, data.time, selectedExpObj]);

    // Auto-manage table selection according to requiredTableCount
    useEffect(() => {
        if (isAnyBuyout) {
            const allIds = tables.map(t => t.id);
            setSelectedTableIds(allIds);
            setData('table_id', allIds[0] || '');
            setData('table_ids', allIds);
            return;
        }

        const available = tables.filter(t => tableAvailabilityMap.get(t.id)?.isAvailable);

        if (requiredTableCount === 2) {
            const valid = selectedTableIds.filter(id => tableAvailabilityMap.get(id)?.isAvailable);
            if (valid.length < 2 && available.length >= 2) {
                const autoPair = [available[0].id, available[1].id];
                setSelectedTableIds(autoPair);
                setData('table_id', autoPair[0]);
                setData('table_ids', autoPair);
            }
        } else {
            if (!selectedTableIds[0] || !tableAvailabilityMap.get(selectedTableIds[0])?.isAvailable) {
                if (available[0]) {
                    setSelectedTableIds([available[0].id]);
                    setData('table_id', available[0].id);
                    setData('table_ids', [available[0].id]);
                }
            } else if (selectedTableIds.length > 1) {
                setSelectedTableIds([selectedTableIds[0]]);
                setData('table_ids', [selectedTableIds[0]]);
            }
        }
    }, [requiredTableCount, isAnyBuyout, tableAvailabilityMap, tables]);

    // Handle table toggle selection
    const handleToggleTable = (tableId: number) => {
        if (isAnyBuyout) return; // Full venue buyout automatically selects all 10 tables

        if (requiredTableCount === 1) {
            setSelectedTableIds([tableId]);
            setData('table_id', tableId);
            setData('table_ids', [tableId]);
            return;
        }

        // When 2 tables are required (for 6-10 guests)
        let updated: number[];
        if (selectedTableIds.includes(tableId)) {
            updated = selectedTableIds.filter(id => id !== tableId);
        } else {
            if (selectedTableIds.length >= 2) {
                updated = [selectedTableIds[1], tableId];
            } else {
                updated = [...selectedTableIds, tableId];
            }
        }
        setSelectedTableIds(updated);
        setData('table_id', updated[0] || '');
        setData('table_ids', updated);
    };

    const selectedTableNames = useMemo(() => {
        if (isAnyBuyout) return 'Seluruh Meja 01 s/d 10 (Venue Buyout)';
        return tables
            .filter(t => selectedTableIds.includes(t.id))
            .map(t => t.table_number)
            .join(', ') || 'Belum dipilih';
    }, [tables, selectedTableIds, isAnyBuyout]);

    const setQuickDate = (daysAhead: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setData('date', `${y}-${m}-${day}`);
    };

    // Menu Categories & Filtering
    const menuCategories = useMemo(() => {
        const cats = new Set<string>();
        menus.forEach(m => {
            if (m.category_name) cats.add(m.category_name);
        });
        return Array.from(cats);
    }, [menus]);

    const filteredMenus = useMemo(() => {
        return menus.filter(m => {
            const matchesCategory = selectedMenuCategory === 'all' || m.category_name === selectedMenuCategory;
            const matchesSearch = !menuSearchQuery || 
                m.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || 
                (m.description || '').toLowerCase().includes(menuSearchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menus, selectedMenuCategory, menuSearchQuery]);

    // Handle Quick Pre-Order Append to Special Request
    const handleAddDishToRequest = (menuName: string) => {
        const tag = `[Pre-order Menu: ${menuName}]`;
        if (!data.special_request.includes(tag)) {
            setData('special_request', data.special_request ? `${data.special_request}, ${tag}` : tag);
        }
    };

    // Form Submission (Dispatched after DP Payment Step)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reservation', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setDrawerStep('details');
                setIsBookingDrawerOpen(false);
                setActiveTab('all');
                setIsDpConfirmed(false);
            },
        });
    };

    // Filtered Customer Reservations for the App Shell 8 Table
    const filteredReservations = useMemo(() => {
        return customerReservations.filter(res => {
            const s = (res.status || '').toLowerCase();
            if (activeTab === 'pending' && s !== 'pending') return false;
            if (activeTab === 'confirmed' && s !== 'confirmed') return false;
            if (activeTab === 'completed' && s !== 'completed' && s !== 'finished' && s !== 'cancelled') return false;

            if (dateFilter === 'today') {
                const isToday = res.reservation_datetime.includes(nowJakarta?.date || '') || res.created_at.includes(nowJakarta?.date || '');
                if (!isToday) return false;
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchCode = res.reservation_code.toLowerCase().includes(q);
                const matchTable = (res.table_number || '').toLowerCase().includes(q);
                const matchExp = (res.experience_name || '').toLowerCase().includes(q);
                const matchStatus = (res.status || '').toLowerCase().includes(q);
                if (!matchCode && !matchTable && !matchExp && !matchStatus) return false;
            }

            return true;
        });
    }, [customerReservations, activeTab, dateFilter, searchQuery, nowJakarta?.date]);

    // Filter Experiences for catalog & drawer
    const filteredExperiences = useMemo(() => {
        return experiences.filter(exp => {
            const slug = exp.slug || '';
            if (experienceCategory === 'buyout') return slug.includes('sewa-resto');
            if (experienceCategory === 'chef') return !slug.includes('sewa-resto');
            return true;
        });
    }, [experiences, experienceCategory]);

    // Badges calculation for App Shell 8 Sidebar
    const pendingCount = useMemo(() => customerReservations.filter(r => (r.status || '').toLowerCase() === 'pending').length, [customerReservations]);
    const confirmedCount = useMemo(() => customerReservations.filter(r => (r.status || '').toLowerCase() === 'confirmed').length, [customerReservations]);
    const completedCount = useMemo(() => customerReservations.filter(r => ['completed', 'finished', 'cancelled'].includes((r.status || '').toLowerCase())).length, [customerReservations]);
    const availableTablesCount = useMemo(() => {
        let count = 0;
        tableAvailabilityMap.forEach(v => {
            if (v.isAvailable) count++;
        });
        return count;
    }, [tableAvailabilityMap]);

    return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#1A1615] flex flex-col font-sans antialiased selection:bg-[#32151F] selection:text-[#D4B886]">
            <Head title="Reservasi Meja Restoran - NUSARA Senopati" />
            <FlashToast />

            {/* ============================================================
                MOBILE TOP BAR (HAMBURGER & LOGO)
            ============================================================ */}
            <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#E8DFD3] px-4 py-3 flex items-center justify-between shadow-xs">
                <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-2 rounded-xl text-[#4A1525] hover:bg-[#FAF4ED] transition-colors"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
                <img 
                    src="/images/nusara-logo.png" 
                    alt="NUSARA Logo" 
                    className="h-7 w-auto object-contain" 
                />
                <button
                    type="button"
                    onClick={() => {
                        setDrawerStep('details');
                        setIsBookingDrawerOpen(true);
                    }}
                    className="p-2 rounded-xl bg-[#32151F] text-[#D4B886] font-bold text-xs shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* ============================================================
                APP SHELL 8 MAIN CONTAINER (SIDEBAR + MAIN CONTENT WORKSPACE)
            ============================================================ */}
            <div className="flex-1 flex overflow-hidden">

                {/* ========================================================
                    LEFT SIDEBAR (APP SHELL 8 SPECIFICATION)
                ======================================================== */}
                {isMobileSidebarOpen && (
                    <div 
                        className="fixed inset-0 z-40 bg-[#1A1615]/40 backdrop-blur-xs lg:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                <aside className={`
                    fixed lg:static top-0 bottom-0 left-0 z-50
                    w-72 bg-[#FFFFFF] border-r border-[#E8DFD3] flex flex-col justify-between
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="flex flex-col h-full overflow-y-auto">
                        {/* 1. Header Profile & Brand Banner */}
                        <div className="p-5 border-b border-[#F2E8DC] flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#32151F] to-[#4A1525] text-[#D4B886] flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-[#B99A65]/40">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-heading font-bold text-sm text-[#1A1615] truncate">
                                        {auth.user.name}
                                    </h2>
                                    <p className="text-[11px] text-[#7C7169] truncate flex items-center gap-1 font-medium">
                                        <Sparkles className="w-3 h-3 text-[#B99A65]" />
                                        <span>Tamu Kehormatan</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="lg:hidden p-1.5 rounded-lg text-[#7C7169] hover:bg-[#FAF4ED]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 2. Grouped Navigation Links with Badges */}
                        <div className="p-4 space-y-6 flex-1">
                            {/* Group A: Status Reservasi */}
                            <div className="space-y-1">
                                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#7C7169] block mb-1">
                                    Reservasi Saya
                                </span>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('all'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'all'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <CalendarIcon className="w-4 h-4 text-[#B99A65]" />
                                        <span>Semua Jadwal</span>
                                    </span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                                        activeTab === 'all' ? 'bg-[#4A1525] text-[#D4B886]' : 'bg-[#FAF4ED] text-[#7C7169]'
                                    }`}>
                                        {customerReservations.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('pending'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'pending'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        <span>Menunggu Validasi Kasir</span>
                                    </span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                                        activeTab === 'pending' ? 'bg-[#4A1525] text-[#D4B886]' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {pendingCount}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('confirmed'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'confirmed'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span>Terkonfirmasi</span>
                                    </span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                                        activeTab === 'confirmed' ? 'bg-[#4A1525] text-[#D4B886]' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        {confirmedCount}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('completed'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'completed'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <History className="w-4 h-4 text-[#7C7169]" />
                                        <span>Selesai / Riwayat</span>
                                    </span>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                                        activeTab === 'completed' ? 'bg-[#4A1525] text-[#D4B886]' : 'bg-[#FAF4ED] text-[#7C7169]'
                                    }`}>
                                        {completedCount}
                                    </span>
                                </button>
                            </div>

                            {/* Group B: Katalog & Sewa Resto */}
                            <div className="space-y-1">
                                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#7C7169] block mb-1">
                                    Eksplorasi & Paket
                                </span>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('experiences'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'experiences'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Building2 className="w-4 h-4 text-[#B99A65]" />
                                        <span>Paket Kurasi & Sewa Resto</span>
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-[#FAF4ED] text-[#7C7169]">
                                        {experiences.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('menu'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'menu'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <BookOpen className="w-4 h-4 text-[#B99A65]" />
                                        <span>Buku Menu A La Carte</span>
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-[#FAF4ED] text-[#7C7169]">
                                        {menus.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('tables'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'tables'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <TableIcon className="w-4 h-4 text-[#B99A65]" />
                                        <span>Denah Meja 01–10</span>
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-[#FAF4ED] text-[#7C7169]">
                                        10
                                    </span>
                                </button>
                            </div>

                            {/* Group C: Hubungi Admin & Aturan */}
                            <div className="space-y-1">
                                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#7C7169] block mb-1">
                                    Konsierge & Aturan
                                </span>

                                <a
                                    href="https://wa.me/6281299998888?text=Halo%20Admin%20NUSARA,%20saya%20ingin%20konsultasi%20reservasi%20dan%20sewa%20satu%20resto%20kustom"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#FAF4ED] text-[#32151F] border border-[#EBD7BE] hover:bg-[#F2E8DC] transition-all"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <MessageSquare className="w-4 h-4 text-[#B99A65]" />
                                        <span>Hubungi Admin Sekarang</span>
                                    </span>
                                    <ExternalLink className="w-3.5 h-3.5 text-[#B99A65]" />
                                </a>

                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('policy'); setIsMobileSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'policy'
                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                            : 'text-[#4A1525] hover:bg-[#FAF7F2]'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <ShieldCheck className="w-4 h-4 text-[#B99A65]" />
                                        <span>Aturan 3 Jam & DP</span>
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Bottom Shift Status Card */}
                        <div className="p-4 border-t border-[#F2E8DC] space-y-3">
                            <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EBD7BE] shadow-xs space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B99A65] block">
                                    Status Sesi Meja Hari Ini
                                </span>
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-[#1A1615]">Ketersediaan Meja:</span>
                                    <span className="font-mono text-[#4A1525] font-bold">
                                        {availableTablesCount} dari 10 Siap
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-[#7C7169]">
                                    <span>Jam Jakarta Saat Ini:</span>
                                    <span className="font-mono font-bold text-[#1A1615]">{currentTimeWib} WIB</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <Link
                                    href="/"
                                    className="text-xs text-[#7C7169] hover:text-[#1A1615] font-medium flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Landing Page</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => router.post('/logout')}
                                    className="text-xs text-[#7C7169] hover:text-rose-600 font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Keluar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ========================================================
                    MAIN WORKSPACE (APP SHELL 8 HEADER + TABLE / LIST VIEW)
                ======================================================== */}
                <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FAF7F2]">
                    
                    {/* Top Main Bar */}
                    <div className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD3] p-4 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#1A1615]">
                                    {activeTab === 'experiences' && 'Katalog Paket Gastronomi & Sewa 1 Resto'}
                                    {activeTab === 'menu' && 'Buku Menu Digital NUSARA'}
                                    {activeTab === 'tables' && 'Denah & Status Meja 01–10'}
                                    {activeTab === 'policy' && 'Kebijakan Reservasi & Pembayaran DP'}
                                    {['all', 'pending', 'confirmed', 'completed'].includes(activeTab) && 'Jadwal Reservasi Meja'}
                                </h1>
                                <p className="text-xs text-[#7C7169] mt-0.5">
                                    Senopati Flagship Dining · Waktu Jakarta: <span className="font-mono font-semibold text-[#1A1615]">{currentTimeWib} WIB</span>
                                </p>
                            </div>

                            {/* Right Action: "+ Reservasi Meja Baru" Button */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDrawerStep('details');
                                        setIsBookingDrawerOpen(true);
                                    }}
                                    className="px-5 py-2.5 rounded-full bg-[#32151F] text-[#D4B886] hover:bg-[#4A1525] active:scale-95 transition-all shadow-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-[#B99A65]/40"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Reservasi Meja / Sewa Resto</span>
                                </button>
                            </div>
                        </div>

                        {/* Search & Quick Filters Bar */}
                        {['all', 'pending', 'confirmed', 'completed'].includes(activeTab) && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 text-[#7C7169] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari kode booking, nama tamu, meja, atau paket..."
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs text-[#1A1615] placeholder-[#7C7169] focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65] shadow-xs"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C7169] hover:text-[#1A1615]"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    <span className="text-[11px] text-[#7C7169] mr-1 hidden sm:inline">Filter:</span>
                                    <button
                                        type="button"
                                        onClick={() => setDateFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            dateFilter === 'all'
                                                ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                                : 'bg-white text-[#7C7169] hover:text-[#1A1615] border border-[#E8DFD3]'
                                        }`}
                                    >
                                        Semua Tanggal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDateFilter('today')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            dateFilter === 'today'
                                                ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                                : 'bg-white text-[#7C7169] hover:text-[#1A1615] border border-[#E8DFD3]'
                                        }`}
                                    >
                                        Hari Ini
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ========================================================
                        CONTENT VIEW A: RESERVATIONS TABLE (APP SHELL 8 LIST)
                    ======================================================== */}
                    {['all', 'pending', 'confirmed', 'completed'].includes(activeTab) && (
                        <div className="p-4 sm:p-6 flex-1">
                            {filteredReservations.length === 0 ? (
                                <div className="p-12 text-center rounded-3xl bg-white border border-[#E8DFD3] shadow-xs max-w-2xl mx-auto space-y-4 my-8">
                                    <div className="w-16 h-16 rounded-2xl bg-[#FAF4ED] text-[#B99A65] mx-auto flex items-center justify-center border border-[#E8DFD3]">
                                        <CalendarIcon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-heading font-bold text-lg text-[#1A1615]">
                                            Belum Ada Jadwal Reservasi
                                        </h3>
                                        <p className="text-xs text-[#7C7169] max-w-md mx-auto leading-relaxed">
                                            {searchQuery 
                                                ? 'Tidak ditemukan reservasi yang sesuai dengan kata kunci pencarian Anda.' 
                                                : 'Nikmati jamuan santap eksklusif gastronomi nusantara di Senopati. Pesan meja Anda sekarang minimal 3 jam sebelumnya dengan pembayaran DP yang aman.'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDrawerStep('details');
                                            setIsBookingDrawerOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#4A1525] shadow-md transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Buat Reservasi Meja / Sewa Resto</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-[#E8DFD3] shadow-xs overflow-hidden">
                                    <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-[#FFFDF9] border-b border-[#F2E8DC] text-[11px] font-bold uppercase tracking-wider text-[#7C7169]">
                                        <span className="col-span-3 sm:col-span-2">Kode</span>
                                        <span className="col-span-5 sm:col-span-4">Paket & Meja</span>
                                        <span className="col-span-4 sm:col-span-3 hidden md:block">Tamu & Kontak</span>
                                        <span className="col-span-4 sm:col-span-2 text-right sm:text-left">Jadwal (WIB)</span>
                                        <span className="col-span-1 text-right hidden sm:block">Status</span>
                                    </div>

                                    <div className="divide-y divide-[#F2E8DC]">
                                        {filteredReservations.map(res => {
                                            const isConfirmed = (res.status || '').toLowerCase() === 'confirmed';
                                            const isPending = (res.status || '').toLowerCase() === 'pending';
                                            return (
                                                <div
                                                    key={res.id}
                                                    onClick={() => setSelectedReservationDetail(res)}
                                                    className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-[#FAF7F2] transition-colors cursor-pointer group"
                                                >
                                                    {/* 1. Job Code */}
                                                    <div className="col-span-3 sm:col-span-2">
                                                        <span className="font-mono text-xs font-bold text-[#4A1525] group-hover:text-[#B99A65] transition-colors block">
                                                            {res.reservation_code}
                                                        </span>
                                                        <span className="text-[10px] text-[#7C7169] block font-mono">
                                                            {res.created_at.split(' ')[0]}
                                                        </span>
                                                    </div>

                                                    {/* 2. Experience Name & Table */}
                                                    <div className="col-span-5 sm:col-span-4 min-w-0">
                                                        <h4 className="font-bold text-xs sm:text-sm text-[#1A1615] truncate group-hover:text-[#32151F]">
                                                            {res.experience_name || 'Santap Meja Reguler (A La Carte)'}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-[11px] text-[#7C7169] mt-0.5">
                                                            <span className="font-semibold text-[#1A1615] bg-[#FAF4ED] px-2 py-0.5 rounded border border-[#EBD7BE]">
                                                                {res.table_number || 'Alokasi Staf'}
                                                            </span>
                                                            <span>·</span>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3 text-[#B99A65]" />
                                                                <span>{res.guest_count} Tamu</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 3. Customer & Contact */}
                                                    <div className="col-span-4 sm:col-span-3 hidden md:block min-w-0">
                                                        <span className="text-xs font-semibold text-[#1A1615] block truncate">
                                                            {auth.user.name}
                                                        </span>
                                                        <span className="text-[11px] text-[#7C7169] font-mono truncate block">
                                                            {customer?.phone_normalized || auth.user.email}
                                                        </span>
                                                    </div>

                                                    {/* 4. Time Range */}
                                                    <div className="col-span-4 sm:col-span-2 text-right sm:text-left">
                                                        <span className="font-mono text-xs font-bold text-[#1A1615] block">
                                                            {res.reservation_datetime.split(',')[1] || res.reservation_datetime}
                                                        </span>
                                                        <span className="text-[10px] text-[#7C7169] block">
                                                            {res.reservation_datetime.split(',')[0]}
                                                        </span>
                                                    </div>

                                                    {/* 5. Status Badge */}
                                                    <div className="col-span-12 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-none border-[#F2E8DC]">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            isConfirmed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                            isPending ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                                                            'bg-stone-100 text-stone-700'
                                                        }`} title={isPending ? 'DP Terkirim · Menunggu Validasi Staf Kasir' : 'Terkonfirmasi'}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-emerald-600' : isPending ? 'bg-amber-600' : 'bg-stone-500'}`} />
                                                            <span>{isPending ? 'Validasi Kasir' : res.status}</span>
                                                        </span>

                                                        <ChevronRight className="w-4 h-4 text-[#7C7169] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================
                        CONTENT VIEW B: EXPERIENCES & BUYOUT CATALOG
                    ======================================================== */}
                    {activeTab === 'experiences' && (
                        <div className="p-4 sm:p-6 space-y-6">
                            {/* Filter Sub-Tabs */}
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E8DFD3] shadow-xs">
                                <div className="flex items-center gap-1.5 overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setExperienceCategory('all')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            experienceCategory === 'all'
                                                ? 'bg-[#32151F] text-[#D4B886] shadow-xs'
                                                : 'text-[#7C7169] hover:bg-[#FAF7F2]'
                                        }`}
                                    >
                                        Semua Paket ({experiences.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExperienceCategory('buyout')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            experienceCategory === 'buyout'
                                                ? 'bg-[#32151F] text-[#D4B886] shadow-xs'
                                                : 'text-[#7C7169] hover:bg-[#FAF7F2]'
                                        }`}
                                    >
                                        <Building2 className="w-3.5 h-3.5 text-[#B99A65]" />
                                        <span>Sewa 1 Resto (Venue Buyout)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExperienceCategory('chef')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            experienceCategory === 'chef'
                                                ? 'bg-[#32151F] text-[#D4B886] shadow-xs'
                                                : 'text-[#7C7169] hover:bg-[#FAF7F2]'
                                        }`}
                                    >
                                        Paket Kurasi Chef
                                    </button>
                                </div>

                                <a
                                    href="https://wa.me/6281299998888?text=Halo%20Admin%20NUSARA,%20saya%20ingin%20konsultasi%20sewa%20satu%20resto%20kustom"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF4ED] text-[#32151F] border border-[#EBD7BE] hover:bg-[#F2E8DC] text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <MessageSquare className="w-3.5 h-3.5 text-[#B99A65]" />
                                    <span>Konsultasi Paket Kustom</span>
                                </a>
                            </div>

                            {/* Custom Buyout Notice Banner */}
                            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF4ED] to-[#FFFDF9] border border-[#EBD7BE] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#32151F] text-[#D4B886] flex items-center justify-center shrink-0 shadow-sm">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="font-heading font-bold text-sm text-[#1A1615]">
                                            Ingin Sewa Satu Resto dengan Durasi & Kebutuhan Kustom?
                                        </h3>
                                        <p className="text-xs text-[#7C7169] leading-relaxed max-w-2xl">
                                            Untuk perayaan resepsi pernikahan intim, jamuan kenegaraan/direksi, atau sewa privat di luar paket standar, tim Admin Konsierge kami siap merancang jamuan khusus untuk Anda.
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://wa.me/6281299998888?text=Halo%20Admin%20NUSARA,%20saya%20ingin%20konsultasi%20sewa%20satu%20resto%20kustom"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 px-5 py-2.5 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#4A1525] transition-all shadow-md flex items-center gap-2"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Hubungi Admin Sekarang</span>
                                </a>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredExperiences.map(exp => {
                                    const isBuyout = exp.slug?.includes('sewa-resto');
                                    return (
                                        <div
                                            key={exp.id}
                                            className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:border-[#B99A65] transition-all flex flex-col justify-between ${
                                                isBuyout ? 'ring-2 ring-[#B99A65]/30 border-[#B99A65]' : 'border-[#E8DFD3]'
                                            }`}
                                        >
                                            <div>
                                                <div className="relative">
                                                    {exp.image_url ? (
                                                        <img
                                                            src={exp.image_url}
                                                            alt={exp.name}
                                                            className="w-full h-48 object-cover border-b border-[#E8DFD3]"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-48 bg-[#FAF4ED] flex items-center justify-center text-[#B99A65] font-bold text-2xl">
                                                            NUSARA
                                                        </div>
                                                    )}
                                                    {isBuyout && (
                                                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-[10px] uppercase tracking-wider shadow-md border border-[#B99A65]/40 flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" />
                                                            Full Venue Buyout
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65]">
                                                            {isBuyout ? '10 Meja Indoor & VIP' : 'Set Kurasi Chef'}
                                                        </span>
                                                        <span className="text-xs text-[#7C7169] flex items-center gap-1 font-mono">
                                                            <Clock className="w-3.5 h-3.5 text-[#B99A65]" />
                                                            <span>{exp.duration_minutes} Menit</span>
                                                        </span>
                                                    </div>
                                                    <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                                        {exp.name}
                                                    </h3>
                                                    <p className="text-xs text-[#7C7169] leading-relaxed line-clamp-3">
                                                        {exp.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-5 pt-0 border-t border-[#F2E8DC] mt-4 flex items-center justify-between">
                                                <div className="pt-3">
                                                    <span className="text-[10px] text-[#7C7169] block">
                                                        {isBuyout ? 'Total Paket Sewa Resto:' : 'Harga Per Orang:'}
                                                    </span>
                                                    <span className="font-mono font-bold text-[#4A1525] text-sm">
                                                        {exp.price_per_person 
                                                            ? (isBuyout && exp.slug?.includes('50-pax') ? formatRupiah(exp.price_per_person * 50) : (isBuyout && exp.slug?.includes('berdua') ? formatRupiah(exp.price_per_person * 2) : `${formatRupiah(exp.price_per_person)} / pax`))
                                                            : 'A La Carte'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData('experience_id', exp.id);
                                                        setDrawerStep('details');
                                                        setIsBookingDrawerOpen(true);
                                                    }}
                                                    className="mt-3 px-4 py-2 rounded-xl bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#4A1525] transition-all shadow-sm"
                                                >
                                                    Pilih Paket Ini
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========================================================
                        CONTENT VIEW C: DIGITAL MENU (A LA CARTE EXPLORER)
                    ======================================================== */}
                    {activeTab === 'menu' && (
                        <div className="p-4 sm:p-6 space-y-6">
                            <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-4 h-4 text-[#7C7169] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={menuSearchQuery}
                                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                                        placeholder="Cari masakan khas nusantara..."
                                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-xs text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMenuCategory('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                            selectedMenuCategory === 'all'
                                                ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                                : 'bg-white text-[#7C7169] hover:text-[#1A1615] border border-[#E8DFD3]'
                                        }`}
                                    >
                                        Semua ({menus.length})
                                    </button>
                                    {menuCategories.map((cat, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setSelectedMenuCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                                selectedMenuCategory === cat
                                                    ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                                    : 'bg-white text-[#7C7169] hover:text-[#1A1615] border border-[#E8DFD3]'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredMenus.map(m => (
                                    <div
                                        key={m.id}
                                        className="p-3.5 rounded-2xl bg-white border border-[#E8DFD3] hover:border-[#D4B886] transition-all flex gap-3 shadow-xs"
                                    >
                                        {m.image_path ? (
                                            <img
                                                src={`/storage/${m.image_path}`}
                                                alt={m.name}
                                                className="w-20 h-20 rounded-xl object-cover border border-[#E8DFD3] shrink-0"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-xl bg-[#FAF4ED] border border-[#E8DFD3] flex items-center justify-center text-[#B99A65] shrink-0">
                                                <UtensilsCrossed className="w-6 h-6" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className="font-bold text-xs text-[#1A1615] truncate">
                                                        {m.name}
                                                    </h4>
                                                    <span className="font-mono text-xs font-bold text-[#4A1525] shrink-0">
                                                        {formatRupiah(m.price)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#7C7169] line-clamp-2 mt-0.5 leading-relaxed">
                                                    {m.description}
                                                </p>
                                            </div>

                                            <div className="pt-2 flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-[#B99A65] font-semibold bg-[#FAF4ED] px-2 py-0.5 rounded border border-[#EBD7BE]">
                                                    {m.category_name || 'A La Carte'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleAddDishToRequest(m.name);
                                                        setDrawerStep('details');
                                                        setIsBookingDrawerOpen(true);
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-[#FAF4ED] hover:bg-[#32151F] text-[#4A1525] hover:text-[#D4B886] border border-[#E8DFD3] text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>Pre-Order</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================
                        CONTENT VIEW D: FLOOR PLAN (MEJA 01-10)
                    ======================================================== */}
                    {activeTab === 'tables' && (
                        <div className="p-4 sm:p-6 space-y-6">
                            <div className="p-5 rounded-3xl bg-white border border-[#E8DFD3] shadow-xs space-y-2">
                                <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                    Denah Ruang Bersantap (Meja 01 s/d 10)
                                </h3>
                                <p className="text-xs text-[#7C7169]">
                                    Setiap meja di Senopati Flagship memiliki kapasitas maksimal 5 tamu. Untuk reservasi 6 hingga 10 orang, sistem otomatis mewajibkan pemilihan 2 meja berdampingan demi kenyamanan perjamuan.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {tables.map(t => {
                                    const avail = tableAvailabilityMap.get(t.id);
                                    const isAvail = avail ? avail.isAvailable : true;
                                    return (
                                        <div
                                            key={t.id}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                                isAvail
                                                    ? 'bg-white border-[#E8DFD3] hover:border-[#B99A65]'
                                                    : 'bg-[#FAF4ED] border-[#EBD7BE] opacity-80'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8DC]">
                                                <span className="font-heading font-bold text-sm text-[#1A1615]">
                                                    {t.table_number}
                                                </span>
                                                <span className={`w-2.5 h-2.5 rounded-full ${isAvail ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            </div>
                                            <div className="py-3 space-y-1">
                                                <span className="text-[11px] text-[#7C7169] block">
                                                    Maksimal: {t.capacity} Tamu
                                                </span>
                                                <span className="text-[11px] font-semibold text-[#1A1615] block">
                                                    {t.location || 'Main Hall Dining'}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider py-1 text-center rounded-lg ${
                                                isAvail ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                            }`}>
                                                {isAvail ? 'Siap Dipesan' : 'Terjadwal'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========================================================
                        CONTENT VIEW E: RESERVATION POLICY & DP
                    ======================================================== */}
                    {activeTab === 'policy' && (
                        <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
                            <div className="p-6 rounded-3xl bg-white border border-[#E8DFD3] shadow-xs space-y-4">
                                <h3 className="font-heading font-bold text-lg text-[#1A1615]">
                                    Standar Operasional, Aturan Meja & Kebijakan DP NUSARA
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EBD7BE] space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-[#805315]">
                                            <Clock className="w-4 h-4 text-[#B99A65]" />
                                            <span>Aturan Pemesanan Minimal 3 Jam (WIB)</span>
                                        </div>
                                        <p className="text-[#7C7169] leading-relaxed">
                                            Untuk reservasi pada hari yang sama, pemesanan wajib diajukan minimal 3 jam sebelumnya agar tim dapur dan pramusaji dapat mempersiapkan bahan segar dan meja terbaik Anda.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EBD7BE] space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-[#805315]">
                                            <Users className="w-4 h-4 text-[#B99A65]" />
                                            <span>Kapasitas Meja: Maks. 5 Tamu / Meja</span>
                                        </div>
                                        <p className="text-[#7C7169] leading-relaxed">
                                            Satu meja dirancang maksimal untuk 5 orang tamu. Jika rombongan Anda berjumlah 6 s/d 10 orang, sistem otomatis mewajibkan 2 meja. Di atas 10 orang disarankan memilih paket Sewa 1 Resto.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EBD7BE] space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-[#805315]">
                                            <CreditCard className="w-4 h-4 text-[#B99A65]" />
                                            <span>Uang Muka (DP) & Validasi Kasir</span>
                                        </div>
                                        <p className="text-[#7C7169] leading-relaxed">
                                            Demi kepastian reservasi, pembayaran uang muka (DP) dilakukan di awal via QRIS / Transfer Bank resmi. Status reservasi akan divalidasi langsung oleh staf kasir restoran sebelum jamuan.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EBD7BE] space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-[#805315]">
                                            <ShieldCheck className="w-4 h-4 text-[#B99A65]" />
                                            <span>Batas Toleransi Kedatangan</span>
                                        </div>
                                        <p className="text-[#7C7169] leading-relaxed">
                                            Meja reservasi disimpan hingga maksimal 15 menit dari jam yang dijadwalkan. Mohon konfirmasi konsierge kami via WhatsApp jika mengalami keterlambatan di perjalanan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* ============================================================
                SLIDE-OVER / MODAL BOOKING DRAWER ("+ Book job" Style)
            ============================================================ */}
            {isBookingDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-[#1A1615]/50 backdrop-blur-xs flex justify-end">
                    <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-[#F2E8DC] bg-[#FFFDF9] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#FAF4ED] text-[#B99A65] flex items-center justify-center border border-[#E8DFD3]">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                        {drawerStep === 'details' ? 'Formulir Reservasi Meja Baru' : 'Pembayaran Uang Muka (DP)'}
                                    </h3>
                                    <p className="text-xs text-[#7C7169]">
                                        {drawerStep === 'details' 
                                            ? 'Senopati Flagship Dining · Batas 3 Jam WIB Berlaku' 
                                            : 'Konfirmasi DP untuk Validasi Kasir NUSARA'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsBookingDrawerOpen(false)}
                                className="p-2 rounded-xl text-[#7C7169] hover:text-[#1A1615] hover:bg-[#FAF4ED] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ====================================================
                            DRAWER STEP 1: FORMULIR DETAIL
                        ==================================================== */}
                        {drawerStep === 'details' && (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* 1. Pengalaman Bersantap */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider">
                                            1. Pilih Pengalaman Bersantap
                                        </label>
                                        <span className="text-[11px] text-[#7C7169]">
                                            Tersedia {experiences.length} paket
                                        </span>
                                    </div>

                                    {/* Notice Kustom Buyout */}
                                    <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#EBD7BE] flex items-center justify-between gap-3 text-xs">
                                        <p className="text-[#805315] text-[11px] leading-relaxed">
                                            Mau sewa 1 resto tapi kustom durasi/jumlah tamu?
                                        </p>
                                        <a
                                            href="https://wa.me/6281299998888?text=Halo%20Admin%20NUSARA,%20saya%20ingin%20konsultasi%20sewa%20satu%20resto%20kustom"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 rounded-lg bg-[#32151F] text-[#D4B886] font-bold text-[10px] uppercase tracking-wider hover:bg-[#4A1525] shrink-0"
                                        >
                                            Hubungi Admin
                                        </a>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                        {/* Opsi Santap Reguler */}
                                        <div
                                            onClick={() => setData('experience_id', '')}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                !data.experience_id
                                                    ? 'bg-[#FDF9F3] border-[#B99A65] ring-2 ring-[#B99A65]/40 shadow-sm'
                                                    : 'bg-white border-[#E8DFD3] hover:border-[#D4B886]'
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-[#32151F] text-[#D4B886] flex items-center justify-center shrink-0">
                                                    <UtensilsCrossed className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-xs text-[#1A1615] truncate">
                                                        Santap Reguler (A La Carte)
                                                    </h4>
                                                    <p className="text-[11px] text-[#7C7169] mt-0.5 line-clamp-2">
                                                        Pesan bebas di meja lewat Scan QR saat hadir.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-[#F2E8DC] flex items-center justify-between text-[11px]">
                                                <span className="font-bold text-[#4A1525]">A La Carte</span>
                                                <span className="text-[#7C7169]">120 Menit</span>
                                            </div>
                                        </div>

                                        {/* Opsi Paket Kurasi & Sewa 1 Resto */}
                                        {experiences.map(exp => {
                                            const isSelected = Number(data.experience_id) === exp.id;
                                            const isBuyout = exp.slug?.includes('sewa-resto');
                                            return (
                                                <div
                                                    key={exp.id}
                                                    onClick={() => setData('experience_id', exp.id)}
                                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'bg-[#FDF9F3] border-[#B99A65] ring-2 ring-[#B99A65]/40 shadow-sm'
                                                            : 'bg-white border-[#E8DFD3] hover:border-[#D4B886]'
                                                    }`}
                                                >
                                                    <div className="flex gap-3">
                                                        {exp.image_url ? (
                                                            <img
                                                                src={exp.image_url}
                                                                alt={exp.name}
                                                                className="w-12 h-12 rounded-xl object-cover border border-[#E8DFD3] shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-[#FAF4ED] text-[#B99A65] font-bold flex items-center justify-center shrink-0">
                                                                {isBuyout ? <Building2 className="w-6 h-6" /> : 'N'}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-xs text-[#1A1615] truncate flex items-center gap-1">
                                                                <span>{exp.name}</span>
                                                            </h4>
                                                            <p className="text-[11px] text-[#7C7169] mt-0.5 line-clamp-2">
                                                                {exp.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-[#F2E8DC] flex items-center justify-between text-[11px]">
                                                        <span className="font-bold text-[#4A1525]">
                                                            {exp.price_per_person 
                                                                ? (isBuyout && exp.slug?.includes('50-pax') ? formatRupiah(exp.price_per_person * 50) : (isBuyout && exp.slug?.includes('berdua') ? formatRupiah(exp.price_per_person * 2) : `${formatRupiah(exp.price_per_person)} / pax`))
                                                                : 'Paket Kurasi'}
                                                        </span>
                                                        <span className="text-[#7C7169]">{exp.duration_minutes} Menit</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Tanggal & Jam Kedatangan (WIB) */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider">
                                        2. Tanggal & Jam Kedatangan (WIB)
                                    </label>

                                    <div className="flex items-center gap-2 pb-1">
                                        <button
                                            type="button"
                                            onClick={() => setQuickDate(0)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                                isSelectedDateToday ? 'bg-[#32151F] text-[#D4B886] font-bold' : 'bg-[#FAF4ED] text-[#7C7169] border border-[#E8DFD3]'
                                            }`}
                                        >
                                            Hari Ini
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickDate(1)}
                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF4ED] text-[#7C7169] border border-[#E8DFD3]"
                                        >
                                            Besok
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickDate(2)}
                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF4ED] text-[#7C7169] border border-[#E8DFD3]"
                                        >
                                            Lusa
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="relative">
                                            <CalendarIcon className="w-4 h-4 text-[#B99A65] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={data.date}
                                                min={nowJakarta?.date}
                                                onChange={(e) => setData('date', e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs font-bold font-mono text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                            />
                                        </div>

                                        <div className="relative">
                                            <Users className="w-4 h-4 text-[#B99A65] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <select
                                                value={data.guest_count}
                                                disabled={isAnyBuyout}
                                                onChange={(e) => setData('guest_count', Number(e.target.value))}
                                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs font-bold text-[#1A1615] focus:outline-none focus:border-[#B99A65] disabled:bg-[#FAF4ED]"
                                            >
                                                {isBuyout50 ? (
                                                    <option value={50}>50 Tamu (Sewa 1 Resto)</option>
                                                ) : isBuyoutRomantic ? (
                                                    <option value={2}>2 Tamu (Romantic Buyout)</option>
                                                ) : (
                                                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                        <option key={n} value={n}>
                                                            {n} Orang Tamu {n > 5 ? '(Wajib 2 Meja)' : '(1 Meja)'}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Time Slot Selector with 3-hour buffer */}
                                    <div className="space-y-1.5 pt-1">
                                        <span className="text-[11px] text-[#7C7169]">Pilih Jam Kedatangan:</span>
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                            {timeSlots.map(slot => {
                                                const isSelected = data.time === slot.time;
                                                return (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={slot.isPastOrCutoff}
                                                        onClick={() => setData('time', slot.time)}
                                                        className={`py-2 px-1 rounded-xl text-center font-mono text-xs transition-all ${
                                                            isSelected
                                                                ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-sm'
                                                                : slot.isPastOrCutoff
                                                                ? 'bg-[#F2ECE4] text-[#A89E96] cursor-not-allowed opacity-50'
                                                                : 'bg-white border border-[#E8DFD3] text-[#1A1615] hover:border-[#B99A65]'
                                                        }`}
                                                        title={slot.reason || slot.label}
                                                    >
                                                        {slot.time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Alokasi Meja 01 s/d 10 (Aturan Maks. 5 Orang/Meja) */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider">
                                            3. Alokasi Meja Makan (01–10)
                                        </label>
                                        <span className="text-[11px] font-semibold text-[#805315]">
                                            {isAnyBuyout 
                                                ? 'Sewa 1 Resto: Seluruh 10 Meja'
                                                : requiredTableCount === 2 
                                                ? `Wajib 2 Meja (${selectedTableIds.length}/2 Terpilih)`
                                                : `Pilih 1 Meja (${selectedTableIds.length}/1 Terpilih)`}
                                        </span>
                                    </div>

                                    {/* Dynamic Table Capacity Notice */}
                                    <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#EBD7BE] text-[11px] text-[#805315] space-y-0.5">
                                        <p className="font-bold flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-[#B99A65]" />
                                            <span>Aturan Kapasitas Meja:</span>
                                        </p>
                                        <p className="leading-relaxed">
                                            {isAnyBuyout
                                                ? 'Paket Sewa 1 Resto otomatis mengamankan seluruh 10 meja untuk privasi eksklusif Anda.'
                                                : data.guest_count > 5
                                                ? `Kapasitas 1 meja maksimal 5 orang. Karena Anda memesan untuk ${data.guest_count} tamu, Anda wajib memilih minimal 2 meja yang masih tersedia.`
                                                : 'Maksimal 1 meja untuk 5 orang tamu. Meja pilihan Anda berkapasitas nyaman hingga 5 kursi.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                        {tables.map(t => {
                                            const avail = tableAvailabilityMap.get(t.id);
                                            const isAvail = avail ? avail.isAvailable : true;
                                            const isSelected = selectedTableIds.includes(t.id);
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    disabled={!isAvail && !isAnyBuyout}
                                                    onClick={() => handleToggleTable(t.id)}
                                                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                                                        isSelected
                                                            ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-sm font-bold ring-2 ring-[#B99A65]'
                                                            : !isAvail && !isAnyBuyout
                                                            ? 'bg-[#F2ECE4] border-[#E8DFD3] text-[#A89E96] opacity-40 cursor-not-allowed'
                                                            : 'bg-white border-[#E8DFD3] text-[#1A1615] hover:border-[#B99A65]'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D4B886] text-[#32151F] flex items-center justify-center text-[10px]">
                                                            ✓
                                                        </span>
                                                    )}
                                                    <span className="font-heading font-bold text-xs">{t.table_number}</span>
                                                    <span className="text-[10px] opacity-75">
                                                        {isAvail || isAnyBuyout ? `${t.capacity} Kursi` : 'Terisi'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 4. Data Tamu & Catatan Khusus */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider">
                                        4. Data Tamu & Catatan Khusus
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[11px] text-[#7C7169] block mb-1">Nama Lengkap:</span>
                                            <input
                                                type="text"
                                                value={data.customer_name}
                                                onChange={(e) => setData('customer_name', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-[#7C7169] block mb-1">Nomor WhatsApp:</span>
                                            <input
                                                type="tel"
                                                value={data.customer_phone}
                                                onChange={(e) => setData('customer_phone', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs font-mono text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[11px] text-[#7C7169] block mb-1">Catatan / Pre-Order Hidangan:</span>
                                        <textarea
                                            rows={2}
                                            value={data.special_request}
                                            onChange={(e) => setData('special_request', e.target.value)}
                                            placeholder="Contoh: Meja dekat jendela, perayaan ulang tahun, atau request dekorasi bunga..."
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                        />
                                    </div>
                                </div>

                                {/* Tombol Lanjut ke Pembayaran DP */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        disabled={selectedTableIds.length < (isAnyBuyout ? 1 : requiredTableCount)}
                                        onClick={() => setDrawerStep('payment')}
                                        className="w-full py-3.5 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-widest hover:bg-[#4A1525] active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
                                    >
                                        <span>Lanjut ke Pembayaran DP (Down Payment)</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ====================================================
                            DRAWER STEP 2: PEMBAYARAN DOWN PAYMENT (DP)
                        ==================================================== */}
                        {drawerStep === 'payment' && (
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                                <button
                                    type="button"
                                    onClick={() => setDrawerStep('details')}
                                    className="inline-flex items-center gap-1.5 text-xs text-[#B99A65] hover:text-[#32151F] font-bold"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Kembali ke Detail Pemesanan</span>
                                </button>

                                {/* Invoice / Tagihan Summary Box */}
                                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF4ED] to-[#FFFDF9] border border-[#EBD7BE] shadow-xs space-y-3">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block">
                                        Ringkasan & Kewajiban Uang Muka (DP)
                                    </span>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#7C7169]">Paket / Sesi:</span>
                                            <span className="font-bold text-[#1A1615]">{selectedExpObj?.name || 'Santap Reguler A La Carte'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#7C7169]">Jadwal Kedatangan:</span>
                                            <span className="font-mono font-bold text-[#1A1615]">{data.date} pukul {data.time} WIB</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#7C7169]">Alokasi Meja:</span>
                                            <span className="font-semibold text-[#4A1525]">{selectedTableNames}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#7C7169]">Jumlah Tamu:</span>
                                            <span className="font-bold text-[#1A1615]">{data.guest_count} Orang</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-[#E8DFD3] flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-[#7C7169] block">Total Uang Muka (DP) Wajib:</span>
                                            <span className="font-heading font-bold text-lg text-[#4A1525]">
                                                {formatRupiah(calculatedDpAmount)}
                                            </span>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                            Menunggu Validasi Kasir
                                        </span>
                                    </div>
                                </div>

                                {/* Pilihan Metode Pembayaran DP */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider">
                                        Pilih Metode Pembayaran Uang Muka (DP)
                                    </label>

                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setData('dp_payment_method', 'qris')}
                                            className={`p-3 rounded-2xl border text-center transition-all ${
                                                data.dp_payment_method === 'qris'
                                                    ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] font-bold shadow-xs'
                                                    : 'bg-white border-[#E8DFD3] text-[#7C7169] hover:border-[#B99A65]'
                                            }`}
                                        >
                                            <QrCode className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs block">QRIS</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setData('dp_payment_method', 'bca')}
                                            className={`p-3 rounded-2xl border text-center transition-all ${
                                                data.dp_payment_method === 'bca'
                                                    ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] font-bold shadow-xs'
                                                    : 'bg-white border-[#E8DFD3] text-[#7C7169] hover:border-[#B99A65]'
                                            }`}
                                        >
                                            <CreditCard className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs block">Transfer BCA</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setData('dp_payment_method', 'mandiri')}
                                            className={`p-3 rounded-2xl border text-center transition-all ${
                                                data.dp_payment_method === 'mandiri'
                                                    ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] font-bold shadow-xs'
                                                    : 'bg-white border-[#E8DFD3] text-[#7C7169] hover:border-[#B99A65]'
                                            }`}
                                        >
                                            <CreditCard className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs block">Transfer Mandiri</span>
                                        </button>
                                    </div>

                                    {/* Tampilan Visual Pembayaran */}
                                    {data.dp_payment_method === 'qris' && (
                                        <div className="p-5 rounded-3xl bg-white border border-[#E8DFD3] text-center space-y-3">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block">
                                                Scan QRIS Resmi NUSARA
                                            </span>
                                            <div className="w-48 h-48 mx-auto p-3 rounded-2xl bg-[#FAF7F2] border-2 border-[#D4B886]/40 flex flex-col items-center justify-center space-y-2">
                                                <QrCode className="w-32 h-32 text-[#32151F]" />
                                                <span className="font-mono text-[10px] font-bold text-[#4A1525]">NMD-NUSARA-SNPT</span>
                                            </div>
                                            <p className="text-[11px] text-[#7C7169] leading-relaxed">
                                                Mendukung BCA Mobile, GoPay, OVO, ShopeePay, Dana, LinkAja, dan seluruh aplikasi m-banking berstandar QRIS.
                                            </p>
                                        </div>
                                    )}

                                    {data.dp_payment_method === 'bca' && (
                                        <div className="p-5 rounded-3xl bg-white border border-[#E8DFD3] space-y-2">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block">
                                                Rekening Bank Central Asia (BCA)
                                            </span>
                                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EBD7BE] flex items-center justify-between font-mono">
                                                <span className="text-sm font-bold text-[#1A1615]">8820-1928-3341</span>
                                                <span className="text-[10px] text-[#B99A65] font-bold">SALIN REKENING</span>
                                            </div>
                                            <p className="text-xs text-[#7C7169]">
                                                Atas Nama: <strong>PT NUSARA SENOPATI GASTRONOMI</strong>
                                            </p>
                                        </div>
                                    )}

                                    {data.dp_payment_method === 'mandiri' && (
                                        <div className="p-5 rounded-3xl bg-white border border-[#E8DFD3] space-y-2">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block">
                                                Rekening Bank Mandiri
                                            </span>
                                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EBD7BE] flex items-center justify-between font-mono">
                                                <span className="text-sm font-bold text-[#1A1615]">122-00-9988776-5</span>
                                                <span className="text-[10px] text-[#B99A65] font-bold">SALIN REKENING</span>
                                            </div>
                                            <p className="text-xs text-[#7C7169]">
                                                Atas Nama: <strong>PT NUSARA SENOPATI GASTRONOMI</strong>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Checkbox Konfirmasi DP */}
                                <div
                                    onClick={() => setIsDpConfirmed(!isDpConfirmed)}
                                    className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EBD7BE] flex items-center gap-3 cursor-pointer select-none"
                                >
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                        isDpConfirmed ? 'bg-[#32151F] border-[#32151F] text-[#D4B886]' : 'border-[#7C7169] bg-white'
                                    }`}>
                                        {isDpConfirmed && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <p className="text-xs text-[#1A1615] leading-relaxed">
                                        Saya telah menyelesaikan pembayaran uang muka (DP) sebesar <strong>{formatRupiah(calculatedDpAmount)}</strong> dan memahami reservasi akan diproses untuk <strong>Validasi oleh Kasir</strong>.
                                    </p>
                                </div>

                                {/* Tombol Submit Final */}
                                <button
                                    type="submit"
                                    disabled={processing || !isDpConfirmed}
                                    className="w-full py-4 rounded-full bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:brightness-105 active:scale-98 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>{processing ? 'Memproses Pengajuan...' : 'Saya Sudah Bayar DP · Kirim untuk Validasi Kasir'}</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
                DETAIL RESERVATION VOUCHER MODAL (CLICK ON ROW)
            ============================================================ */}
            {selectedReservationDetail && (
                <div className="fixed inset-0 z-50 bg-[#1A1615]/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8DFD3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-[#F2E8DC] bg-[#FFFDF9] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-[#B99A65]" />
                                <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                    Voucher Reservasi Tamu
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedReservationDetail(null)}
                                className="p-1.5 rounded-xl text-[#7C7169] hover:bg-[#FAF4ED]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD3] space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#B99A65] block">
                                    Kode Reservasi Resmi
                                </span>
                                <h4 className="font-mono font-bold text-xl text-[#4A1525]">
                                    {selectedReservationDetail.reservation_code}
                                </h4>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    (selectedReservationDetail.status || '').toLowerCase() === 'confirmed'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                }`}>
                                    {(selectedReservationDetail.status || '').toLowerCase() === 'confirmed' ? 'Terkonfirmasi' : 'Menunggu Validasi Kasir'}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[#7C7169]">
                                    <span>Jadwal Kedatangan:</span>
                                    <span className="font-mono font-bold text-[#1A1615]">
                                        {selectedReservationDetail.reservation_datetime}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[#7C7169]">
                                    <span>Alokasi Meja:</span>
                                    <span className="font-bold text-[#1A1615]">
                                        {selectedReservationDetail.table_number || 'Dipersiapkan Staf'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[#7C7169]">
                                    <span>Jumlah Tamu:</span>
                                    <span className="font-bold text-[#1A1615]">
                                        {selectedReservationDetail.guest_count} Orang
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[#7C7169]">
                                    <span>Pengalaman Bersantap:</span>
                                    <span className="font-bold text-[#4A1525]">
                                        {selectedReservationDetail.experience_name || 'Santap Reguler (A La Carte)'}
                                    </span>
                                </div>
                                {selectedReservationDetail.special_request && (
                                    <div className="pt-2 border-t border-[#F2E8DC] text-[11px]">
                                        <span className="text-[#7C7169] block">Catatan Khusus & DP:</span>
                                        <p className="font-semibold text-[#1A1615] mt-0.5">
                                            {selectedReservationDetail.special_request}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-[#F2E8DC] flex items-center justify-between">
                                <a
                                    href={`https://wa.me/6281299998888?text=${encodeURIComponent(`Halo Konsierge NUSARA, saya ingin menanyakan kode reservasi saya: ${selectedReservationDetail.reservation_code}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Chat Konsierge Meja</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setSelectedReservationDetail(null)}
                                    className="px-4 py-2 rounded-xl bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
