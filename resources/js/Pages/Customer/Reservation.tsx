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
    HelpCircle,
    PanelRightClose,
    PanelRight,
    QrCode,
    Plus,
    Search,
    BookOpen
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
    // Active navigation tab on the left sidebar
    const [sidebarTab, setSidebarTab] = useState<'form' | 'experiences' | 'tables' | 'history' | 'policy'>('form');

    // App Shell 4 Right Panel Toggle
    const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

    // Digital Menu Modal state for A La Carte preview
    const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
    const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
    const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('all');

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

    // Date calculations in Jakarta Time
    const initialDate = nowJakarta?.date || new Date().toISOString().split('T')[0];

    // Form state
    const { data, setData, post, processing, errors, reset } = useForm({
        date: initialDate,
        time: '18:30',
        guest_count: 2,
        experience_id: preselectedExperience ? Number(preselectedExperience) : (experiences[0]?.id || ''),
        table_id: '' as number | string,
        customer_name: customer?.name || auth.user.name || '',
        customer_phone: customer?.phone_normalized || '+6281234567890',
        special_request: '',
    });

    // Calendar Popup State for the main date field
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Right Inspector Panel Calendar Month State
    const todayObj = useMemo(() => new Date(), []);
    const [viewYear, setViewYear] = useState<number>(todayObj.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(todayObj.getMonth());

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

    // Close calendar on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
        const slots: { time: string; label: string; disabled: boolean; reason?: string }[] = [];
        const times = [
            '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
            '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
        ];

        times.forEach(t => {
            const [sh, sm] = t.split(':').map(Number);
            const slotMinutes = sh * 60 + sm;

            let disabled = false;
            let reason = '';

            // Rule 3 Jam Sebelum Reservasi (Untuk Pemesanan Hari Ini):
            // Jika tanggal = hari ini, maka slot yang kurang dari 180 menit (3 jam) ke depan WAJIB di-disable
            if (isSelectedDateToday) {
                const diff = slotMinutes - currentWibMinutes;
                if (diff < 180) { // kurang dari 3 jam (180 menit)
                    disabled = true;
                    reason = diff <= 0 ? 'Waktu sudah lewat' : 'Minimal 3 jam sebelumnya';
                }
            }

            slots.push({
                time: t,
                label: `${t} WIB`,
                disabled,
                reason
            });
        });

        return slots;
    }, [isSelectedDateToday, currentWibMinutes]);

    // Auto-adjust time if currently selected time is disabled
    useEffect(() => {
        const currentSlot = timeSlots.find(s => s.time === data.time);
        if (currentSlot && currentSlot.disabled) {
            const firstAvailable = timeSlots.find(s => !s.disabled);
            if (firstAvailable) {
                setData('time', firstAvailable.time);
            }
        }
    }, [timeSlots, data.time]);

    // Table Availability Logic:
    // Menghubungkan ketersediaan Meja 01 s/d 10 secara real-time dengan data reservasi backend
    const tableAvailabilityMap = useMemo(() => {
        const map = new Map<number, { isAvailable: boolean; bookedByCode?: string; bookedTime?: string }>();

        if (!data.date || !data.time) {
            tables.forEach(t => map.set(t.id, { isAvailable: true }));
            return map;
        }

        const [reqH, reqM] = data.time.split(':').map(Number);
        const reqTotalMin = reqH * 60 + reqM;
        const durationMin = 120; // 2 jam alokasi per sesi santap

        tables.forEach(t => {
            // Temukan apakah meja ini memiliki reservasi pada tanggal yang sama dalam selisih waktu 105 menit
            const conflict = reservations.find(r => {
                if (r.table_id !== t.id) return false;
                const rDateStr = r.reservation_datetime.split('T')[0] || r.reservation_datetime.split(' ')[0];
                if (rDateStr !== data.date) return false;

                const rTimeStr = (r.reservation_datetime.split('T')[1] || r.reservation_datetime.split(' ')[1] || '').substring(0, 5);
                const [rH, rM] = rTimeStr.split(':').map(Number);
                const rTotalMin = rH * 60 + rM;

                // Cek bentrok overlap durasi santap (± 105 menit)
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
    }, [tables, reservations, data.date, data.time]);

    // Auto-select first available table if current table is invalid/booked
    useEffect(() => {
        if (!data.table_id || !tableAvailabilityMap.get(Number(data.table_id))?.isAvailable) {
            const firstAvail = tables.find(t => tableAvailabilityMap.get(t.id)?.isAvailable);
            if (firstAvail) {
                setData('table_id', firstAvail.id);
            }
        }
    }, [tableAvailabilityMap, tables, data.table_id]);

    // Selected Table Object
    const selectedTableObj = useMemo(() => {
        return tables.find(t => t.id === Number(data.table_id)) || null;
    }, [tables, data.table_id]);

    // Calendar Days Generator for Visual Pickers
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        const list: { day: number; dateStr: string; isCurrentMonth: boolean; isPast: boolean; isToday: boolean }[] = [];

        // Prev month padding
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const prevMonthDate = new Date(viewYear, viewMonth - 1, d);
            const dateStr = prevMonthDate.toISOString().split('T')[0];
            list.push({
                day: d,
                dateStr,
                isCurrentMonth: false,
                isPast: true,
                isToday: false,
            });
        }

        // Current month days
        const todayStr = nowJakarta?.date || new Date().toISOString().split('T')[0];
        for (let d = 1; d <= daysInMonth; d++) {
            const m = String(viewMonth + 1).padStart(2, '0');
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${viewYear}-${m}-${dayStr}`;
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;

            list.push({
                day: d,
                dateStr,
                isCurrentMonth: true,
                isPast,
                isToday
            });
        }

        // Next month padding to fill 42 cells (6 rows)
        const remaining = 42 - list.length;
        for (let d = 1; d <= remaining; d++) {
            const nextMonthDate = new Date(viewYear, viewMonth + 1, d);
            const dateStr = nextMonthDate.toISOString().split('T')[0];
            list.push({
                day: d,
                dateStr,
                isCurrentMonth: false,
                isPast: false,
                isToday: false
            });
        }

        return list;
    }, [viewYear, viewMonth, nowJakarta?.date]);

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear(v => v - 1);
            setViewMonth(11);
        } else {
            setViewMonth(v => v - 1);
        }
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear(v => v + 1);
            setViewMonth(0);
        } else {
            setViewMonth(v => v + 1);
        }
    };

    const handleSelectDate = (dateStr: string) => {
        setData('date', dateStr);
        setIsCalendarOpen(false);
    };

    // Quick Date Helpers
    const setQuickDate = (daysAhead: number) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setData('date', `${y}-${m}-${day}`);
    };

    // Submit Reservation
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reservation', {
            preserveScroll: true,
            onSuccess: () => {
                reset('special_request');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#FBF9F5] text-[#1A1615] font-sans selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Reservasi Meja Restoran — NUSARA Nusantara & Rasa" />
            <FlashToast />

            {/* ============================================================
                TOP BAR HEADER (APP SHELL 4 - LIGHT VERSION)
            ============================================================ */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8DFD3] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                    <Link href="/" className="flex items-center gap-3 shrink-0 group">
                        <img 
                            src="/images/nusara-logo.png" 
                            alt="NUSARA Logo" 
                            className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
                        />
                        <span className="px-2.5 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[10px] font-bold text-[#D4B886] tracking-wider uppercase">
                            Reservasi Eksklusif
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#E8DFD3] text-xs text-[#7C7169]">
                        <span className="font-semibold text-[#1A1615]">Senopati Flagship Dining</span>
                        <span>·</span>
                        <span className="flex items-center gap-1.5 font-mono text-[#4A1525] font-bold bg-[#FAF4ED] px-2 py-0.5 rounded-md border border-[#E5DDCF]">
                            <Clock className="w-3.5 h-3.5 text-[#B99A65]" />
                            WIB: {currentTimeWib}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsMenuModalOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF4ED] hover:bg-[#F2E8DC] text-[#4A1525] border border-[#E8DFD3] text-xs font-bold transition-all shadow-sm"
                    >
                        <BookOpen className="w-3.5 h-3.5 text-[#B99A65]" />
                        <span>Buku Menu A La Carte</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                        className="p-2 rounded-xl border border-[#E8DFD3] text-[#7C7169] hover:text-[#1A1615] hover:bg-[#FAF4ED] transition-colors"
                        title={isRightPanelOpen ? "Sembunyikan Panel Jadwal (App Shell 4)" : "Tampilkan Panel Jadwal (App Shell 4)"}
                    >
                        {isRightPanelOpen ? <PanelRightClose className="w-4 h-4 text-[#B99A65]" /> : <PanelRight className="w-4 h-4 text-[#B99A65]" />}
                    </button>

                    <div className="flex items-center gap-2 pl-2 border-l border-[#E8DFD3]">
                        <div className="text-right hidden sm:block">
                            <span className="text-xs font-bold text-[#1A1615] block leading-tight">{auth.user.name}</span>
                            <span className="text-[10px] text-[#7C7169] block font-mono">{auth.user.email}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#32151F] text-[#D4B886] font-bold flex items-center justify-center text-xs shadow-sm">
                            {auth.user.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            className="p-1.5 rounded-lg text-[#7C7169] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Keluar"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ============================================================
                3-COLUMN WORKSPACE (APP SHELL 4 - LIGHT)
            ============================================================ */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">

                {/* ========================================================
                    COLUMN 1: LEFT NAVIGATION & INFO SIDEBAR
                ======================================================== */}
                <aside className="w-full lg:w-72 shrink-0 space-y-4">
                    {/* Customer Profile Card */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E8DFD3] shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#32151F] to-[#4A1525] text-[#D4B886] flex items-center justify-center font-bold text-base shadow">
                                {auth.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B99A65] block">
                                    Tamu Kehormatan
                                </span>
                                <h3 className="font-bold text-sm text-[#1A1615] truncate">{auth.user.name}</h3>
                                <span className="text-[11px] text-[#7C7169] font-mono truncate block">
                                    {customer?.phone_normalized || auth.user.email}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="pt-2 border-t border-[#F2E8DC] space-y-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setSidebarTab('form')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                                    sidebarTab === 'form'
                                        ? 'bg-[#32151F] text-[#F4EFE6] font-bold shadow-sm'
                                        : 'text-[#4A1525] hover:bg-[#FAF4ED]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-[#D4B886]" />
                                    <span>Formulir Reservasi</span>
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setSidebarTab('history')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                                    sidebarTab === 'history'
                                        ? 'bg-[#32151F] text-[#F4EFE6] font-bold shadow-sm'
                                        : 'text-[#4A1525] hover:bg-[#FAF4ED]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-[#D4B886]" />
                                    <span>Riwayat Reservasi Saya</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded-full bg-[#FAF4ED] text-[#4A1525] text-[10px] font-mono font-bold">
                                    {customerReservations.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSidebarTab('policy')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                                    sidebarTab === 'policy'
                                        ? 'bg-[#32151F] text-[#F4EFE6] font-bold shadow-sm'
                                        : 'text-[#4A1525] hover:bg-[#FAF4ED]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#D4B886]" />
                                    <span>Aturan & Kebijakan Meja</span>
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </button>
                        </div>
                    </div>

                    {/* Operational Clock & 3-Hour Buffer Rule Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EC] border border-[#E8DFD3] shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#4A1525] uppercase tracking-wider">
                            <Clock className="w-4 h-4 text-[#B99A65]" />
                            <span>Waktu Jakarta & Aturan</span>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E8DFD3]">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-[#7C7169]">Jam Jakarta Saat Ini:</span>
                                <span className="font-mono text-sm font-bold text-[#32151F]">{currentTimeWib} WIB</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-[#7C7169]">
                                <span>Tanggal Hari Ini:</span>
                                <span className="font-mono font-semibold text-[#1A1615]">{nowJakarta?.date}</span>
                            </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#FFF6EA] border border-[#EBD7BE] text-[11px] text-[#805315] space-y-1">
                            <p className="font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-[#B99A65] shrink-0" />
                                <span>Aturan Reservasi 3 Jam:</span>
                            </p>
                            <p className="leading-relaxed">
                                Pemesanan untuk hari ini wajib dilakukan minimal <strong>3 jam sebelumnya</strong>. Pilihan jam kurang dari 3 jam dari sekarang otomatis dinonaktifkan.
                            </p>
                        </div>
                    </div>

                    {/* Operating Hours Card */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E8DFD3] shadow-sm space-y-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#B99A65] block">
                            Jam Operasional Restoran
                        </span>
                        <div className="space-y-1.5 text-xs">
                            {operatingHours.map(oh => (
                                <div key={oh.id} className="flex items-center justify-between py-1 border-b border-[#FAF4ED] last:border-none">
                                    <span className="text-[#7C7169]">{oh.day_name}</span>
                                    <span className="font-mono font-semibold text-[#1A1615]">
                                        {oh.is_closed ? 'Tutup' : `${oh.open_time.substring(0, 5)} - ${oh.close_time.substring(0, 5)}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Concierge Help Card */}
                    <div className="p-4 rounded-2xl bg-[#32151F] text-[#F4EFE6] border border-[#B99A65]/40 shadow-sm space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#D4B886]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Butuh Bantuan Khusus?</span>
                        </div>
                        <p className="text-[11px] text-[#F4EFE6]/75 leading-relaxed">
                            Untuk reservasi kelompok di atas 10 tamu atau private room VIP, hubungi konsierge reservasi NUSARA langsung.
                        </p>
                        <a
                            href={`https://wa.me/6281299998888?text=${encodeURIComponent('Halo Konsierge NUSARA, saya ingin menanyakan reservasi meja VIP.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4B886] hover:underline pt-1"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Chat WhatsApp Konsierge</span>
                        </a>
                    </div>
                </aside>

                {/* ========================================================
                    COLUMN 2: MAIN INTERACTIVE RESERVATION CANVAS
                ======================================================== */}
                <main className="flex-1 space-y-6 min-w-0">

                    {/* Header Banner */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#FFFDF9] via-white to-[#FDF8F0] border border-[#E8DFD3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B99A65]">
                                Formulir Reservasi Gastronomi
                            </span>
                            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1A1615] mt-1">
                                Reservasi Pengalaman Bersantap
                            </h1>
                            <p className="text-xs sm:text-sm text-[#7C7169] mt-1 max-w-xl">
                                Pastikan alokasi meja restoran Senopati Flagship Anda siap menyambut jamuan istimewa Nusantara.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSidebarTab('form')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    sidebarTab === 'form'
                                        ? 'bg-[#32151F] text-[#F4EFE6] shadow'
                                        : 'bg-white text-[#4A1525] border border-[#E8DFD3]'
                                }`}
                            >
                                Buat Reservasi
                            </button>
                            <button
                                type="button"
                                onClick={() => setSidebarTab('history')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    sidebarTab === 'history'
                                        ? 'bg-[#32151F] text-[#F4EFE6] shadow'
                                        : 'bg-white text-[#4A1525] border border-[#E8DFD3]'
                                }`}
                            >
                                Riwayat ({customerReservations.length})
                            </button>
                        </div>
                    </div>

                    {/* VIEW A: MAIN RESERVATION FORM */}
                    {sidebarTab === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* SECTION 1: PILIHAN PENGALAMAN GASTRONOMI */}
                            <div className="p-6 rounded-3xl bg-white border border-[#E8DFD3] shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-[#F2E8DC]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#FAF4ED] text-[#B99A65] border border-[#E8DFD3] flex items-center justify-center font-bold text-xs">
                                            1
                                        </span>
                                        <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                            Pilih Pengalaman Bersantap
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-[#7C7169]">
                                        Paketan Kurasi Chef & Santap Reguler A La Carte
                                    </span>
                                </div>

                                {/* Luxury Clarification Callout regarding Menus & Ordering */}
                                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EBD7BE] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-[#FAF4ED] border border-[#E8DFD3] flex items-center justify-center text-[#B99A65] shrink-0">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <div className="text-xs space-y-0.5">
                                            <p className="font-bold text-[#1A1615]">
                                                Apakah Wajib Memilih Menu Saat Reservasi?
                                            </p>
                                            <p className="text-[#7C7169] leading-relaxed text-[11px]">
                                                <strong>Tidak wajib.</strong> Jika Anda memilih <em>Paket Gastronomi</em>, menu sudah lengkap 1 set per orang. Jika Anda memilih <em>Santap Reguler (A La Carte)</em>, pilihan menu makanan dan minuman dipesan bebas langsung di meja Anda saat tiba melalui <strong>Scan QR Meja</strong>.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsMenuModalOpen(true)}
                                        className="shrink-0 px-3.5 py-2 rounded-xl bg-white border border-[#B99A65] text-[#4A1525] hover:bg-[#FAF4ED] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <BookOpen className="w-3.5 h-3.5 text-[#B99A65]" />
                                        <span>Buku Menu A La Carte</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Option A: Santap Reguler A La Carte */}
                                    <div
                                        onClick={() => setData('experience_id', '')}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            !data.experience_id
                                                ? 'bg-[#FDF9F3] border-[#B99A65] ring-2 ring-[#B99A65]/40 shadow-md'
                                                : 'bg-white border-[#E8DFD3] hover:border-[#D4B886] hover:bg-[#FAF7F2]'
                                        }`}
                                    >
                                        <div className="flex gap-3.5">
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#32151F] to-[#4A1525] border border-[#B99A65]/40 flex items-center justify-center text-[#D4B886] shrink-0 shadow-sm">
                                                <UtensilsCrossed className="w-7 h-7" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className="font-bold text-sm text-[#1A1615] truncate">
                                                        Santap Reguler (A La Carte)
                                                    </h4>
                                                    {!data.experience_id && (
                                                        <span className="w-4 h-4 rounded-full bg-[#32151F] text-[#D4B886] flex items-center justify-center shrink-0">
                                                            <Check className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#7C7169] line-clamp-2 mt-1 leading-relaxed">
                                                    Hanya reservasi meja. Pesan menu favorit Anda bebas di restoran lewat Scan QR Meja saat kedatangan.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-[#F2E8DC] flex items-center justify-between text-xs">
                                            <span className="font-mono font-bold text-[#4A1525]">
                                                Bebas Pilih Menu (A La Carte)
                                            </span>
                                            <span className="text-[11px] text-[#7C7169] flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-[#B99A65]" />
                                                <span>120 Menit Sesi</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Option B: Curated Gastronomy Packages */}
                                    {experiences.map(exp => {
                                        const isSelected = Number(data.experience_id) === exp.id;
                                        return (
                                            <div
                                                key={exp.id}
                                                onClick={() => setData('experience_id', exp.id)}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSelected
                                                        ? 'bg-[#FDF9F3] border-[#B99A65] ring-2 ring-[#B99A65]/40 shadow-md'
                                                        : 'bg-white border-[#E8DFD3] hover:border-[#D4B886] hover:bg-[#FAF7F2]'
                                                }`}
                                            >
                                                <div className="flex gap-3.5">
                                                    {exp.image_url ? (
                                                        <img
                                                            src={exp.image_url}
                                                            alt={exp.name}
                                                            className="w-16 h-16 rounded-xl object-cover border border-[#E8DFD3] shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-xl bg-[#FAF4ED] border border-[#E8DFD3] flex items-center justify-center text-[#B99A65] font-bold text-lg shrink-0">
                                                            N
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <h4 className="font-bold text-sm text-[#1A1615] truncate">
                                                                {exp.name}
                                                            </h4>
                                                            {isSelected && (
                                                                <span className="w-4 h-4 rounded-full bg-[#32151F] text-[#D4B886] flex items-center justify-center shrink-0">
                                                                    <Check className="w-3 h-3" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-[#7C7169] line-clamp-2 mt-1 leading-relaxed">
                                                            {exp.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-2.5 border-t border-[#F2E8DC] flex items-center justify-between text-xs">
                                                    <span className="font-mono font-bold text-[#4A1525]">
                                                        {exp.price_per_person ? `${formatRupiah(exp.price_per_person)} / pax` : 'Paket Kurasi Chef'}
                                                    </span>
                                                    <span className="text-[11px] text-[#7C7169] flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-[#B99A65]" />
                                                        <span>{exp.duration_minutes} Menit</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SECTION 2: TANGGAL & WAKTU RESERVASI (DENGAN ATURAN 3 JAM WIB) */}
                            <div className="p-6 rounded-3xl bg-white border border-[#E8DFD3] shadow-sm space-y-5">
                                <div className="flex items-center justify-between pb-3 border-b border-[#F2E8DC]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#FAF4ED] text-[#B99A65] border border-[#E8DFD3] flex items-center justify-center font-bold text-xs">
                                            2
                                        </span>
                                        <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                            Tanggal & Waktu Reservasi (WIB)
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono text-[#4A1525] bg-[#FAF4ED] px-2.5 py-1 rounded-md border border-[#E8DFD3] font-bold">
                                        Jam Sekarang: {currentTimeWib} WIB
                                    </span>
                                </div>

                                {/* Date Picker with Calendar Popup & Manual Input */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider">
                                        Pilih Tanggal Reservasi *
                                    </label>

                                    {/* Quick Date Pills */}
                                    <div className="flex flex-wrap items-center gap-2 pb-1">
                                        <button
                                            type="button"
                                            onClick={() => setQuickDate(0)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                                isSelectedDateToday
                                                    ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-sm'
                                                    : 'bg-[#FAF4ED] text-[#7C7169] hover:text-[#1A1615] border border-[#E8DFD3]'
                                            }`}
                                        >
                                            Hari Ini ({nowJakarta?.date})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickDate(1)}
                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF4ED] text-[#7C7169] hover:text-[#1A1615] border border-[#E8DFD3] transition-all"
                                        >
                                            Besok
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickDate(2)}
                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF4ED] text-[#7C7169] hover:text-[#1A1615] border border-[#E8DFD3] transition-all"
                                        >
                                            Lusa
                                        </button>
                                    </div>

                                    {/* Interactive Date Input Container with Calendar Popup */}
                                    <div className="relative" ref={calendarRef}>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <CalendarIcon className="w-4 h-4 text-[#B99A65] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    value={data.date}
                                                    min={nowJakarta?.date}
                                                    onChange={(e) => setData('date', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8DFD3] text-xs font-mono font-bold text-[#1A1615] focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65]"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setIsCalendarOpen(prev => !prev)}
                                                className="px-4 py-2.5 rounded-xl bg-[#FAF4ED] hover:bg-[#F2E8DC] text-[#4A1525] border border-[#E8DFD3] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                            >
                                                <CalendarIcon className="w-3.5 h-3.5 text-[#B99A65]" />
                                                <span>Buka Kalender</span>
                                            </button>
                                        </div>

                                        {/* Pop-up Interactive Calendar */}
                                        {isCalendarOpen && (
                                            <div className="absolute top-full left-0 z-50 mt-2 p-4 rounded-2xl bg-white border border-[#B99A65]/40 shadow-2xl w-80 animate-fade-in">
                                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F2E8DC]">
                                                    <span className="font-bold text-xs text-[#1A1615]">
                                                        {monthNames[viewMonth]} {viewYear}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={prevMonth}
                                                            className="p-1 rounded-md hover:bg-[#FAF4ED] text-[#7C7169]"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={nextMonth}
                                                            className="p-1 rounded-md hover:bg-[#FAF4ED] text-[#7C7169]"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#7C7169] mb-1">
                                                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                                                        <span key={i}>{d}</span>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                                    {calendarDays.map((cDay, idx) => {
                                                        const isSelected = data.date === cDay.dateStr;
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                disabled={cDay.isPast}
                                                                onClick={() => handleSelectDate(cDay.dateStr)}
                                                                className={`h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all ${
                                                                    isSelected
                                                                        ? 'bg-[#32151F] text-[#D4B886] font-bold shadow'
                                                                        : cDay.isPast
                                                                        ? 'text-[#C5BCB3] cursor-not-allowed'
                                                                        : cDay.isCurrentMonth
                                                                        ? 'text-[#1A1615] hover:bg-[#FAF4ED] font-semibold'
                                                                        : 'text-[#9E938B] hover:bg-[#FAF4ED]'
                                                                }`}
                                                            >
                                                                {cDay.day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {errors.date && (
                                        <p className="text-xs text-rose-600 font-semibold">{errors.date}</p>
                                    )}
                                </div>

                                {/* Time Slot Selection with 3-Hour Buffer Rule */}
                                <div className="space-y-2.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider">
                                            Pilih Jam Kedatangan (WIB) *
                                        </label>
                                        {isSelectedDateToday && (
                                            <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                                                <Info className="w-3 h-3 text-[#B99A65]" />
                                                <span>Pemesanan hari ini minimal 3 jam sebelumnya</span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                        {timeSlots.map(slot => {
                                            const isSelected = data.time === slot.time;
                                            return (
                                                <button
                                                    key={slot.time}
                                                    type="button"
                                                    disabled={slot.disabled}
                                                    onClick={() => setData('time', slot.time)}
                                                    className={`py-2 px-1.5 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center ${
                                                        isSelected
                                                            ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65] shadow-md ring-2 ring-[#B99A65]/40'
                                                            : slot.disabled
                                                            ? 'bg-[#F2ECE4] text-[#A69C92] cursor-not-allowed border border-[#E5DDD2] opacity-60'
                                                            : 'bg-white hover:bg-[#FAF7F2] text-[#1A1615] border border-[#E8DFD3]'
                                                    }`}
                                                    title={slot.reason || slot.label}
                                                >
                                                    <span>{slot.time}</span>
                                                    {slot.disabled ? (
                                                        <span className="text-[8px] font-sans text-rose-500 font-normal leading-tight mt-0.5">
                                                            {slot.reason === 'Waktu sudah lewat' ? 'Lewat' : 'Terkunci'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-sans text-[#7C7169] font-normal leading-tight mt-0.5">
                                                            Tersedia
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.time && (
                                        <p className="text-xs text-rose-600 font-semibold">{errors.time}</p>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 3: PEMILIHAN MEJA RESTORAN (MEJA 01 - MEJA 10) */}
                            <div className="p-6 rounded-3xl bg-white border border-[#E8DFD3] shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F2E8DC]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#FAF4ED] text-[#B99A65] border border-[#E8DFD3] flex items-center justify-center font-bold text-xs">
                                            3
                                        </span>
                                        <div>
                                            <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                                Pilih Meja Restoran (Meja 01 – Meja 10)
                                            </h3>
                                            <p className="text-[11px] text-[#7C7169]">
                                                Ketersediaan meja diperiksa otomatis sesuai tanggal {data.date} pukul {data.time} WIB.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[#1A1615] font-semibold">Tersedia</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-stone-300" />
                                            <span className="text-[#7C7169]">Sudah Dipesan</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 10 Tables Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                                    {tables.map(tbl => {
                                        const availInfo = tableAvailabilityMap.get(tbl.id);
                                        const isAvailable = availInfo?.isAvailable ?? true;
                                        const isSelected = Number(data.table_id) === tbl.id;

                                        return (
                                            <div
                                                key={tbl.id}
                                                onClick={() => {
                                                    if (isAvailable) {
                                                        setData('table_id', tbl.id);
                                                    }
                                                }}
                                                className={`relative p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center ${
                                                    isSelected
                                                        ? 'bg-[#FDF9F3] border-[#B99A65] ring-2 ring-[#B99A65]/40 shadow-lg scale-102 z-10'
                                                        : !isAvailable
                                                        ? 'bg-[#F5F2EB] border-[#E8DFD3] opacity-45 cursor-not-allowed'
                                                        : 'bg-white border-[#E8DFD3] hover:border-[#D4B886] hover:bg-[#FAF7F2] cursor-pointer'
                                                }`}
                                            >
                                                {/* Table Number & Status Pill */}
                                                <div className="w-full flex items-center justify-between">
                                                    <span className="font-heading font-bold text-sm text-[#1A1615]">
                                                        {tbl.table_number}
                                                    </span>
                                                    {isSelected ? (
                                                        <span className="w-4 h-4 rounded-full bg-[#32151F] text-[#D4B886] flex items-center justify-center">
                                                            <Check className="w-3 h-3" />
                                                        </span>
                                                    ) : !isAvailable ? (
                                                        <span className="text-[#7C7169]" title="Sudah terpesan di jam ini">
                                                            <Lock className="w-3.5 h-3.5" />
                                                        </span>
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    )}
                                                </div>

                                                {/* Circular Visual Table Mockup */}
                                                <div className="my-2 relative w-16 h-16 rounded-full border-2 border-dashed border-[#D4B886]/60 bg-[#FAF6F0] flex flex-col items-center justify-center">
                                                    <span className="text-[10px] font-bold text-[#4A1525]">
                                                        {tbl.capacity} Kursi
                                                    </span>
                                                    <span className="text-[8px] text-[#7C7169]">
                                                        {tbl.location || 'Hall'}
                                                    </span>
                                                </div>

                                                {/* Bottom Status Text */}
                                                <div className="w-full pt-1.5 border-t border-[#F2E8DC]">
                                                    {isAvailable ? (
                                                        <span className="text-[10px] font-bold text-emerald-700 block">
                                                            {isSelected ? 'Terpilih' : 'Siap Dipesan'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] text-[#8C827A] font-medium block">
                                                            Sudah Terisi
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.table_id && (
                                    <p className="text-xs text-rose-600 font-semibold">{errors.table_id}</p>
                                )}
                            </div>

                            {/* SECTION 4: DETAIL TAMU & CATATAN KHUSUS */}
                            <div className="p-6 rounded-3xl bg-white border border-[#E8DFD3] shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-[#F2E8DC]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#FAF4ED] text-[#B99A65] border border-[#E8DFD3] flex items-center justify-center font-bold text-xs">
                                            4
                                        </span>
                                        <h3 className="font-heading font-bold text-base text-[#1A1615]">
                                            Detail Tamu & Catatan Jamuan
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-[#7C7169]">
                                        Data otomatis terhubung dengan akun Anda
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Jumlah Tamu */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider mb-1.5">
                                            Jumlah Tamu *
                                        </label>
                                        <div className="flex items-center rounded-xl bg-white border border-[#E8DFD3] p-1">
                                            <button
                                                type="button"
                                                onClick={() => setData('guest_count', Math.max(1, data.guest_count - 1))}
                                                className="w-9 h-9 rounded-lg bg-[#FAF4ED] hover:bg-[#F2E8DC] text-[#4A1525] font-bold text-sm flex items-center justify-center transition-colors"
                                            >
                                                -
                                            </button>
                                            <div className="flex-1 text-center font-mono font-bold text-sm text-[#1A1615]">
                                                {data.guest_count} Tamu
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setData('guest_count', Math.min(10, data.guest_count + 1))}
                                                className="w-9 h-9 rounded-lg bg-[#FAF4ED] hover:bg-[#F2E8DC] text-[#4A1525] font-bold text-sm flex items-center justify-center transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Nama Pemesan */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider mb-1.5">
                                            Nama Pemesan *
                                        </label>
                                        <div className="relative">
                                            <UserIcon className="w-4 h-4 text-[#B99A65] absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={data.customer_name}
                                                onChange={(e) => setData('customer_name', e.target.value)}
                                                placeholder="Nama lengkap tamu..."
                                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs font-medium text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* No WhatsApp / Telepon */}
                                    <div>
                                        <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider mb-1.5">
                                            Nomor WhatsApp / Kontak *
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-[#B99A65] absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={data.customer_phone}
                                                onChange={(e) => setData('customer_phone', e.target.value)}
                                                placeholder="+62 812..."
                                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs font-mono font-medium text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Catatan Khusus */}
                                <div>
                                    <label className="block text-xs font-bold text-[#1A1615] uppercase tracking-wider mb-1.5">
                                        Permintaan Khusus (Opsional)
                                    </label>
                                    <textarea
                                        value={data.special_request}
                                        onChange={(e) => setData('special_request', e.target.value)}
                                        placeholder="Contoh: Alergi makanan laut, perayaan ulang tahun pernikahan, mohon disiapkan baby chair..."
                                        rows={3}
                                        className="w-full p-3 rounded-xl bg-white border border-[#E8DFD3] text-xs text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                    />
                                    <span className="text-[10px] text-[#7C7169] mt-1 block">
                                        Tim kami akan berusaha mengakomodasi permintaan Anda sebaik mungkin sesuai ketersediaan.
                                    </span>
                                </div>
                            </div>

                            {/* SUBMIT BUTTON BAR */}
                            <div className="p-4 rounded-2xl bg-white border border-[#E8DFD3] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-[#7C7169]">
                                    <span className="font-bold text-[#1A1615] block">
                                        {selectedExpObj?.name || 'Paket Bersantap'} · {selectedTableObj?.table_number || 'Pilih Meja'}
                                    </span>
                                    <span>
                                        {data.date} pukul {data.time} WIB ({data.guest_count} Tamu)
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.table_id}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:brightness-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>{processing ? 'Menyimpan Reservasi...' : 'Konfirmasi Reservasi Sekarang'}</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* VIEW B: RIWAYAT RESERVASI SAYA */}
                    {sidebarTab === 'history' && (
                        <div className="p-6 rounded-3xl bg-white border border-[#E8DFD3] shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8DC]">
                                <div>
                                    <h3 className="font-heading font-bold text-lg text-[#1A1615]">
                                        Riwayat Reservasi Anda
                                    </h3>
                                    <p className="text-xs text-[#7C7169]">
                                        Daftar reservasi meja restoran yang pernah Anda ajukan di NUSARA.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSidebarTab('form')}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF4ED] text-[#4A1525] hover:bg-[#F2E8DC] text-xs font-bold transition-all"
                                >
                                    + Reservasi Baru
                                </button>
                            </div>

                            {customerReservations.length === 0 ? (
                                <div className="py-16 text-center space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-[#FAF4ED] text-[#B99A65] mx-auto flex items-center justify-center">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-sm text-[#1A1615]">Belum Ada Reservasi</h4>
                                    <p className="text-xs text-[#7C7169] max-w-sm mx-auto">
                                        Anda belum memiliki jadwal reservasi meja. Buat reservasi pertama Anda sekarang.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSidebarTab('form')}
                                        className="mt-2 px-5 py-2 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider"
                                    >
                                        Pesan Meja Sekarang
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {customerReservations.map(res => {
                                        const isPending = res.status === 'Pending';
                                        const isConfirmed = res.status === 'Confirmed';
                                        return (
                                            <div
                                                key={res.id}
                                                className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFD3] hover:border-[#D4B886] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-[#4A1525]">
                                                            {res.reservation_code}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            isConfirmed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                            isPending ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                                                            'bg-stone-100 text-stone-700'
                                                        }`}>
                                                            {res.status}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-[#1A1615]">
                                                            {res.table_number || 'Meja Alokasi Staf'}
                                                        </span>
                                                    </div>
                                                    <h5 className="font-bold text-sm text-[#1A1615]">
                                                        {res.experience_name || 'Santap Meja Reguler'}
                                                    </h5>
                                                    <div className="flex items-center gap-3 text-xs text-[#7C7169]">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarIcon className="w-3.5 h-3.5 text-[#B99A65]" />
                                                            <span>{res.reservation_datetime}</span>
                                                        </span>
                                                        <span>·</span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3.5 h-3.5 text-[#B99A65]" />
                                                            <span>{res.guest_count} Tamu</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right sm:self-center">
                                                    <span className="text-[10px] text-[#7C7169] block">
                                                        Dibuat: {new Date(res.created_at).toLocaleDateString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW C: ATURAN & KEBIJAKAN MEJA */}
                    {sidebarTab === 'policy' && (
                        <div className="p-6 rounded-3xl bg-white border border-[#E8DFD3] shadow-sm space-y-4">
                            <div className="pb-3 border-b border-[#F2E8DC]">
                                <h3 className="font-heading font-bold text-lg text-[#1A1615]">
                                    Kebijakan & Ketentuan Reservasi Restoran
                                </h3>
                                <p className="text-xs text-[#7C7169]">
                                    Standar operasional Senopati Flagship Dining NUSARA demi kenyamanan seluruh tamu.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4A1525]">
                                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD3] space-y-1.5">
                                    <h4 className="font-bold text-sm text-[#1A1615] flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-[#B99A65]" />
                                        <span>Batas Reservasi 3 Jam (WIB)</span>
                                    </h4>
                                    <p className="text-[#7C7169] leading-relaxed">
                                        Reservasi untuk hari yang sama wajib diajukan minimal 3 jam sebelum jadwal jamuan agar tim dapur dan pramusaji dapat menyiapkan meja serta bahan segar optimal.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD3] space-y-1.5">
                                    <h4 className="font-bold text-sm text-[#1A1615] flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-[#B99A65]" />
                                        <span>Toleransi Keterlambatan</span>
                                    </h4>
                                    <p className="text-[#7C7169] leading-relaxed">
                                        Meja akan disimpan hingga maksimal 15 menit dari jam reservasi yang dipilih. Setelahnya, alokasi meja dapat dialihkan kepada tamu waiting list.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD3] space-y-1.5">
                                    <h4 className="font-bold text-sm text-[#1A1615] flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-[#B99A65]" />
                                        <span>Kapasitas Meja 1 s/d 10</span>
                                    </h4>
                                    <p className="text-[#7C7169] leading-relaxed">
                                        Setiap meja memiliki kapasitas ideal 5 kursi tamu. Untuk rombongan di atas 5 orang, dapat memesan meja berdampingan atau menghubungi konsierge kami.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD3] space-y-1.5">
                                    <h4 className="font-bold text-sm text-[#1A1615] flex items-center gap-1.5">
                                        <Phone className="w-4 h-4 text-[#B99A65]" />
                                        <span>Konfirmasi WhatsApp</span>
                                    </h4>
                                    <p className="text-[#7C7169] leading-relaxed">
                                        Staf kasir / konsierge kami akan mengirimkan pesan konfirmasi status meja melalui nomor WhatsApp yang terdaftar dalam waktu 15 menit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* ========================================================
                    COLUMN 3: RIGHT SCHEDULE & CALENDAR PANEL (APP SHELL 4)
                ======================================================== */}
                <aside className={`w-full lg:w-80 shrink-0 space-y-4 ${isRightPanelOpen ? 'block' : 'hidden'}`}>
                    <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-[#B99A65]" />
                            <span className="text-xs font-bold text-[#1A1615]">Jadwal & Voucher</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsRightPanelOpen(false)}
                            className="p-1 rounded-lg text-[#7C7169] hover:text-[#1A1615] hover:bg-[#FAF4ED] transition-colors"
                            title="Tutup Panel Jadwal"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Visual Month Calendar Widget */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E8DFD3] shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#1A1615]">
                                {monthNames[viewMonth]} {viewYear}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={prevMonth}
                                    className="p-1 rounded-md hover:bg-[#FAF4ED] text-[#7C7169]"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextMonth}
                                    className="p-1 rounded-md hover:bg-[#FAF4ED] text-[#7C7169]"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Week Header */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#7C7169]">
                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((dh, i) => (
                                <span key={i}>{dh}</span>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                            {calendarDays.map((cDay, idx) => {
                                const isSelected = data.date === cDay.dateStr;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={cDay.isPast}
                                        onClick={() => handleSelectDate(cDay.dateStr)}
                                        className={`h-7 rounded-lg flex items-center justify-center font-mono text-[11px] transition-all ${
                                            isSelected
                                                ? 'bg-[#32151F] text-[#D4B886] font-bold shadow'
                                                : cDay.isPast
                                                ? 'text-[#C5BCB3] cursor-not-allowed'
                                                : cDay.isCurrentMonth
                                                ? 'text-[#1A1615] hover:bg-[#FAF4ED] font-semibold'
                                                : 'text-[#9E938B]'
                                        }`}
                                    >
                                        {cDay.day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Booking Voucher Ticket Summary */}
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EC] border-2 border-[#D4B886]/40 shadow-md space-y-4 relative overflow-hidden">
                        <div className="space-y-1 pb-3 border-b border-[#E8DFD3]">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B99A65] block">
                                Voucher Reservasi
                            </span>
                            <h4 className="font-heading font-bold text-base text-[#1A1615]">
                                {selectedExpObj?.name || 'Paket Bersantap'}
                            </h4>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[#7C7169]">
                                <span>Tanggal Reservasi:</span>
                                <span className="font-mono font-bold text-[#1A1615]">{data.date}</span>
                            </div>

                            <div className="flex items-center justify-between text-[#7C7169]">
                                <span>Waktu Kedatangan:</span>
                                <span className="font-mono font-bold text-[#4A1525]">{data.time} WIB</span>
                            </div>

                            <div className="flex items-center justify-between text-[#7C7169]">
                                <span>Alokasi Meja:</span>
                                <span className="font-bold text-[#1A1615] bg-white px-2 py-0.5 rounded border border-[#E8DFD3]">
                                    {selectedTableObj?.table_number || 'Pilih Meja'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[#7C7169]">
                                <span>Jumlah Tamu:</span>
                                <span className="font-mono font-bold text-[#1A1615]">{data.guest_count} Orang</span>
                            </div>

                            <div className="flex items-center justify-between text-[#7C7169]">
                                <span>Durasi Sesi:</span>
                                <span className="font-mono text-[#7C7169]">120 Menit (2 Jam)</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[#E8DFD3] space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-[#1A1615]">
                                <span>Estimasi Paket:</span>
                                <span className="font-mono text-[#4A1525]">
                                    {selectedExpObj?.price_per_person 
                                        ? formatRupiah(selectedExpObj.price_per_person * data.guest_count) 
                                        : 'A la Carte'}
                                </span>
                            </div>
                            <p className="text-[10px] text-[#7C7169] italic">
                                *Pembayaran dilakukan langsung di restoran kasir POS saat selesai bersantap.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing || !data.table_id}
                            className="w-full py-3 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#4A1525] transition-all shadow flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{processing ? 'Menyimpan...' : 'Ajukan Reservasi Ini'}</span>
                        </button>
                    </div>

                    {/* Upcoming Booking Quick Pill */}
                    {customerReservations.length > 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-[#E8DFD3] shadow-sm space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B99A65] block">
                                Reservasi Terdekat Anda
                            </span>
                            <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-[#4A1525]">{customerReservations[0].reservation_code}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                        {customerReservations[0].status}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#1A1615] font-semibold mt-1">
                                    {customerReservations[0].table_number || 'Meja Dipersiapkan'} · {customerReservations[0].reservation_datetime}
                                </p>
                            </div>
                        </div>
                    )}
                </aside>

            </div>

            {/* ============================================================
                DIGITAL MENU MODAL (A LA CARTE EXPLORER & PRE-ORDER)
            ============================================================ */}
            {isMenuModalOpen && (
                <div className="fixed inset-0 z-50 bg-[#1A1615]/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-[#E8DFD3] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#F2E8DC] flex items-center justify-between bg-[#FFFDF9]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#FAF4ED] border border-[#E8DFD3] flex items-center justify-center text-[#B99A65]">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-lg text-[#1A1615]">
                                        Buku Menu NUSARA (Katalog A La Carte)
                                    </h3>
                                    <p className="text-xs text-[#7C7169]">
                                        Menu ini dapat dipesan leluasa di meja melalui Scan QR saat kedatangan, atau dicatat sebagai pre-order.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMenuModalOpen(false)}
                                className="p-2 rounded-xl text-[#7C7169] hover:text-[#1A1615] hover:bg-[#FAF4ED] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search and Category Filters */}
                        <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD3] flex flex-col sm:flex-row gap-3 items-center justify-between">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 text-[#7C7169] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={menuSearchQuery}
                                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                                    placeholder="Cari menu nusantara..."
                                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs text-[#1A1615] placeholder-[#7C7169] focus:outline-none focus:border-[#B99A65]"
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
                                    Semua Kategori ({menus.length})
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

                        {/* Menus Grid */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {filteredMenus.length === 0 ? (
                                <div className="py-12 text-center text-[#7C7169] text-xs">
                                    Tidak ada hidangan yang cocok dengan pencarian Anda.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        onClick={() => handleAddDishToRequest(m.name)}
                                                        className="px-2.5 py-1 rounded-lg bg-[#FAF4ED] hover:bg-[#32151F] text-[#4A1525] hover:text-[#D4B886] border border-[#E8DFD3] text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                                                        title="Sertakan ke Catatan Khusus Reservasi"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        <span>Pre-Order</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-[#F2E8DC] bg-[#FFFDF9] flex items-center justify-between">
                            <span className="text-xs text-[#7C7169]">
                                Klik <strong>+ Pre-Order</strong> untuk menambahkan hidangan ke Catatan Khusus reservasi.
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsMenuModalOpen(false)}
                                className="px-5 py-2 rounded-xl bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#4A1525] transition-all"
                            >
                                Tutup & Kembali
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
