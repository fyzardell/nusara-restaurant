// resources/js/Pages/Customer/Reservation.tsx
import React, { useState, useMemo, useEffect } from 'react';
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
    AlertCircle, 
    ChevronRight, 
    ChevronLeft, 
    X, 
    Info, 
    Phone, 
    User as UserIcon, 
    CheckCircle2, 
    ArrowRight,
    QrCode,
    Search,
    Table as TableIcon,
    CreditCard,
    Building2,
    MessageSquare,
    Copy,
    History,
    RefreshCw,
    ExternalLink,
    ArrowLeft,
    LogOut
} from 'lucide-react';
import FlashToast from '../../Components/FlashToast';
import LogoutConfirmModal from '../../Components/LogoutConfirmModal';
import { DiningExperience, RestaurantTable, OperatingHour, RestaurantSettings, User, Menu, Category } from '../../types';

interface ReservationItem {
    id: number;
    reservation_code: string;
    reservation_datetime: string;
    duration_minutes: number;
    status: string;
    guest_count: number;
    table_id: number;
    experience_name?: string | null;
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
    categories?: Category[];
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

type BookingStep = 1 | 2 | 3 | 4 | 5;

export default function Reservation({
    auth,
    customer,
    tables = [],
    experiences = [],
    categories = [],
    menus = [],
    operatingHours = [],
    settings,
    reservations = [],
    customerReservations = [],
    nowJakarta,
    preselectedExperience
}: Props) {
    // Mode Tampilan: 'booking' (Multi-Step Form) atau 'history' (Riwayat Reservasi Saya)
    const [pageView, setPageView] = useState<'booking' | 'history'>('booking');

    // Langkah Aktif: 1 sampai 5 (1 Tampilan per Langkah, Tanpa Scroll Panjang)
    const [currentStep, setCurrentStep] = useState<BookingStep>(1);

    // Filter kategori paket pada langkah 3
    const [expFilter, setExpFilter] = useState<'all' | 'chef' | 'buyout' | 'alacarte'>('all');

    // Menu catalog preview state pada langkah 3
    const [showMenuCatalog, setShowMenuCatalog] = useState<boolean>(false);
    const [menuCatalogCategory, setMenuCatalogCategory] = useState<string>('all');

    // Salin nomor rekening state
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

    // Logout Confirmation Modal
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    // Close user dropdown on outside click
    useEffect(() => {
        const handleWindowClick = () => setUserDropdownOpen(false);
        if (userDropdownOpen) {
            window.addEventListener('click', handleWindowClick);
            return () => window.removeEventListener('click', handleWindowClick);
        }
    }, [userDropdownOpen]);

    // Initial Date in Jakarta time
    const initialDate = nowJakarta?.date || new Date().toISOString().split('T')[0];

    // Form Inertia
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
    const [isDpAgreed, setIsDpAgreed] = useState<boolean>(false);

    // Format Rupiah
    const formatRupiah = (val: number | null | undefined) => {
        if (!val) return 'Rp 0';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    // Helper url gambar menu
    const getMenuImageUrl = (path?: string) => {
        if (!path) return '/images/menus/sate-lilit.jpg';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/')) return path;
        return `/storage/${path}`;
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

    // Aturan Meja Dinamis: 1 meja = max 5 orang. 6-10 = wajib 2 meja. Buyout = 10 meja.
    const requiredTableCount = useMemo(() => {
        if (isAnyBuyout) return 10;
        if (data.guest_count > 5) return 2;
        return 1;
    }, [isAnyBuyout, data.guest_count]);

    // Hitungan Estimasi Total & Down Payment (DP)
    const estimatedTotal = useMemo(() => {
        if (!selectedExpObj) {
            // A La Carte Standard: estimasi rata-rata santap Rp 250.000 / pax
            return data.guest_count * 250000;
        }
        if (isBuyout50) {
            return selectedExpObj.slug?.includes('3-jam') ? 20000000 : 15000000;
        }
        if (isBuyoutRomantic) {
            return 7500000;
        }
        return (selectedExpObj.price_per_person || 0) * data.guest_count;
    }, [selectedExpObj, isBuyout50, isBuyoutRomantic, data.guest_count]);

    const calculatedDpAmount = useMemo(() => {
        if (isBuyout50) return 3000000;
        if (isBuyoutRomantic) return 1500000;
        if (requiredTableCount === 2) return 300000;
        return 150000;
    }, [isBuyout50, isBuyoutRomantic, requiredTableCount]);

    const remainingBalance = useMemo(() => {
        return Math.max(0, estimatedTotal - calculatedDpAmount);
    }, [estimatedTotal, calculatedDpAmount]);

    useEffect(() => {
        setData('dp_amount', calculatedDpAmount);
    }, [calculatedDpAmount]);

    // Sinkronisasi guest count jika buyout dipilih
    useEffect(() => {
        if (isBuyout50 && data.guest_count !== 50) {
            setData('guest_count', 50);
        } else if (isBuyoutRomantic && data.guest_count !== 2) {
            setData('guest_count', 2);
        }
    }, [isBuyout50, isBuyoutRomantic]);

    // Live clock Jakarta
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

    const isSelectedDateToday = useMemo(() => {
        return data.date === (nowJakarta?.date || new Date().toISOString().split('T')[0]);
    }, [data.date, nowJakarta?.date]);

    const currentWibMinutes = useMemo(() => {
        const parts = currentTimeWib.split(':');
        const h = parseInt(parts[0] || '0', 10);
        const m = parseInt(parts[1] || '0', 10);
        return h * 60 + m;
    }, [currentTimeWib]);

    // Daftar Slot Waktu
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
                    reason = 'Terkunci (Min. 3 Jam WIB)';
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

    // Deteksi Tabrakan Sewa 1 Resto (Full Venue Buyout) pada Tanggal & Waktu Terpilih
    const isTimeSlotBuyoutBlocked = useMemo(() => {
        if (!data.date || !data.time) return false;
        const [reqH, reqM] = data.time.split(':').map(Number);
        const reqTotalMin = reqH * 60 + reqM;
        const durationMin = selectedExpObj?.duration_minutes || 120;

        const buyoutConflict = reservations.find(r => {
            const rDateStr = (r.reservation_datetime.includes('T')
                ? r.reservation_datetime.split('T')[0]
                : r.reservation_datetime.split(' ')[0]).trim();
            if (rDateStr !== data.date) return false;
            if (!['Pending', 'Confirmed', 'Seated'].includes(r.status)) return false;

            const isBuyoutRes = r.guest_count >= 50 || (r.experience_name && r.experience_name.toLowerCase().includes('sewa'));
            if (!isBuyoutRes) return false;

            const rTimeStr = (r.reservation_datetime.includes('T')
                ? r.reservation_datetime.split('T')[1]
                : r.reservation_datetime.split(' ')[1] || '').substring(0, 5);
            const [rH, rM] = rTimeStr.split(':').map(Number);
            const rTotalMin = rH * 60 + rM;
            const rDuration = r.duration_minutes || 120;

            return Math.abs(reqTotalMin - rTotalMin) < (Math.max(durationMin, rDuration) - 15);
        });

        return !!buyoutConflict;
    }, [reservations, data.date, data.time, selectedExpObj]);

    // Peta Ketersediaan Meja Real-Time
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
            if (isTimeSlotBuyoutBlocked) {
                map.set(t.id, {
                    isAvailable: false,
                    bookedTime: 'Private Buyout',
                });
                return;
            }

            const conflict = reservations.find(r => {
                if (Number(r.table_id) !== t.id) return false;
                const rDateStr = (r.reservation_datetime.includes('T')
                    ? r.reservation_datetime.split('T')[0]
                    : r.reservation_datetime.split(' ')[0]).trim();
                if (rDateStr !== data.date) return false;
                if (!['Pending', 'Confirmed', 'Seated'].includes(r.status)) return false;

                const rTimeStr = (r.reservation_datetime.includes('T')
                    ? r.reservation_datetime.split('T')[1]
                    : r.reservation_datetime.split(' ')[1] || '').substring(0, 5);
                const [rH, rM] = rTimeStr.split(':').map(Number);
                const rTotalMin = rH * 60 + rM;
                const rDuration = r.duration_minutes || 120;

                return Math.abs(reqTotalMin - rTotalMin) < (Math.max(durationMin, rDuration) - 15);
            });

            if (conflict) {
                const confTime = (conflict.reservation_datetime.includes('T')
                    ? conflict.reservation_datetime.split('T')[1]
                    : conflict.reservation_datetime.split(' ')[1] || '').substring(0, 5);
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
    }, [tables, reservations, data.date, data.time, selectedExpObj, isTimeSlotBuyoutBlocked]);

    // Jumlah Meja Tersedia
    const availableTablesCount = useMemo(() => {
        return tables.filter(t => tableAvailabilityMap.get(t.id)?.isAvailable).length;
    }, [tables, tableAvailabilityMap]);

    // Sinkronisasi otomatis meja terpilih
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
                const pair = [available[0].id, available[1].id];
                setSelectedTableIds(pair);
                setData('table_id', pair[0]);
                setData('table_ids', pair);
            }
        } else {
            if (!selectedTableIds[0] || !tableAvailabilityMap.get(selectedTableIds[0])?.isAvailable) {
                if (available[0]) {
                    setSelectedTableIds([available[0].id]);
                    setData('table_id', available[0].id);
                    setData('table_ids', [available[0].id]);
                }
            }
        }
    }, [requiredTableCount, isAnyBuyout, tableAvailabilityMap]);

    // Handler toggle meja
    const handleToggleTable = (tableId: number) => {
        if (isAnyBuyout) return; // Buyout otomatis kunci semua meja

        const isAvailable = tableAvailabilityMap.get(tableId)?.isAvailable;
        if (!isAvailable) return;

        if (requiredTableCount === 1) {
            setSelectedTableIds([tableId]);
            setData('table_id', tableId);
            setData('table_ids', [tableId]);
            return;
        }

        if (requiredTableCount === 2) {
            let next: number[] = [];
            if (selectedTableIds.includes(tableId)) {
                next = selectedTableIds.filter(id => id !== tableId);
            } else {
                if (selectedTableIds.length >= 2) {
                    next = [selectedTableIds[1], tableId];
                } else {
                    next = [...selectedTableIds, tableId];
                }
            }
            setSelectedTableIds(next);
            setData('table_id', next[0] || '');
            setData('table_ids', next);
        }
    };

    // Validasi per langkah untuk tombol "Lanjut"
    const isStep1Valid = useMemo(() => {
        if (!data.date || !data.time) return false;
        if (isTimeSlotBuyoutBlocked) return false;
        const currentSlot = timeSlots.find(s => s.time === data.time);
        if (currentSlot?.isPastOrCutoff) return false;
        return true;
    }, [data.date, data.time, isTimeSlotBuyoutBlocked, timeSlots]);

    const isStep2Valid = useMemo(() => {
        if (isAnyBuyout) return true;
        if (requiredTableCount === 2) return selectedTableIds.length === 2;
        return selectedTableIds.length === 1;
    }, [isAnyBuyout, requiredTableCount, selectedTableIds]);

    const isStep3Valid = true; // Paket opsional (bisa pilih A La Carte)

    const isStep4Valid = useMemo(() => {
        return data.customer_name.trim().length > 1 && data.customer_phone.trim().length >= 9;
    }, [data.customer_name, data.customer_phone]);

    const isStep5Valid = isDpAgreed && !processing;

    // Nama-nama meja terpilih untuk ringkasan
    const selectedTableNamesString = useMemo(() => {
        if (isAnyBuyout) return 'Seluruh Area Restoran (Meja 01 – Meja 10)';
        if (selectedTableIds.length === 0) return 'Belum dipilih';
        return selectedTableIds
            .map(id => tables.find(t => t.id === id)?.table_number || `Meja #${id}`)
            .join(' & ');
    }, [isAnyBuyout, selectedTableIds, tables]);

    // Submit Reservasi
    const handleSubmitReservation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isStep5Valid) return;

        post('/reservation', {
            preserveScroll: false,
            onSuccess: () => {
                setPageView('history');
                setCurrentStep(1);
            }
        });
    };

    // Salin nomor rekening ke clipboard
    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAccount(type);
        setTimeout(() => setCopiedAccount(null), 3000);
    };

    // Stepper label config
    const stepsConfig = [
        { step: 1, title: 'Jadwal & Sesi', desc: 'Tanggal & Jam' },
        { step: 2, title: 'Tamu & Meja', desc: 'Kapasitas & Alokasi' },
        { step: 3, title: 'Paket Jamuan', desc: 'Kurasi / A La Carte' },
        { step: 4, title: 'Data Pemesan', desc: 'Kontak & Catatan' },
        { step: 5, title: 'Konfirmasi & DP', desc: 'Ringkasan & Bayar' },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1615] flex flex-col selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Reservasi Meja & Dining Experience — NUSARA" />
            <FlashToast />

            {/* Top Navigation Bar (Sama seperti Navbar Hero Landing Page: Burgundy #32151F Mewah & Aksen Gold) */}
            <header className="sticky top-0 left-0 right-0 z-40 bg-[#32151F]/95 backdrop-blur-md shadow-2xl py-3.5 sm:py-4 border-b border-[#B99A65]/20 text-[#F4EFE6] transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Logo NUSARA Resmi */}
                        <div className="flex items-center">
                            <Link href="/" className="group flex items-center">
                                <img 
                                    src="/images/nusara-logo.png" 
                                    alt="NUSARA — Nusantara & Rasa" 
                                    className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-md" 
                                />
                            </Link>
                        </div>

                        {/* Center: Navigation Tab (Pemesanan vs Riwayat) */}
                        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-[#211D1B]/90 border border-[#B99A65]/30 rounded-full text-xs font-semibold shadow-inner">
                            <button
                                type="button"
                                onClick={() => setPageView('booking')}
                                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all flex items-center gap-1.5 ${
                                    pageView === 'booking'
                                        ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold shadow-sm'
                                        : 'text-[#F4EFE6]/70 hover:text-[#F4EFE6]'
                                }`}
                            >
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>Pemesanan</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPageView('history')}
                                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all flex items-center gap-1.5 ${
                                    pageView === 'history'
                                        ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-bold shadow-sm'
                                        : 'text-[#F4EFE6]/70 hover:text-[#F4EFE6]'
                                }`}
                            >
                                <History className="w-3.5 h-3.5" />
                                <span>Riwayat</span>
                                {customerReservations.length > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                                        pageView === 'history' ? 'bg-[#32151F] text-[#D4B886]' : 'bg-[#B99A65] text-[#211D1B]'
                                    }`}>
                                        {customerReservations.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Right: Concierge Help & User Account / Login */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                href="/order?open_chat=1"
                                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#211D1B]/80 border border-[#B99A65]/40 text-xs font-semibold text-[#D4B886] hover:text-[#F4EFE6] hover:border-[#D4B886] transition-all shadow-xs"
                                title="Bantuan Konsierge"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-[#B99A65]" />
                                <span>Chat Admin</span>
                            </Link>

                            {auth?.user ? (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserDropdownOpen(!userDropdownOpen);
                                        }}
                                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#211D1B] border border-[#B99A65]/50 text-[#F4EFE6] text-xs font-medium hover:border-[#D4B886] transition-colors shadow-sm"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-[#32151F] text-[#D4B886] flex items-center justify-center font-bold text-xs border border-[#B99A65]/30">
                                            {auth.user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="hidden md:inline max-w-[120px] truncate">{auth.user.name}</span>
                                    </button>

                                    {userDropdownOpen && (
                                        <div 
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 mt-2 w-56 bg-[#211D1B] border border-[#B99A65]/40 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fade-in text-left text-[#F4EFE6]"
                                        >
                                            <div className="px-4 py-2 border-b border-[#32151F]">
                                                <p className="font-bold text-[#F4EFE6] truncate">{auth.user.name}</p>
                                                <p className="text-[11px] text-[#B99A65] truncate font-mono">{auth.user.email}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserDropdownOpen(false);
                                                    setPageView('history');
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-[#F4EFE6] hover:bg-[#32151F] transition-colors flex items-center gap-2"
                                            >
                                                <History className="w-3.5 h-3.5 text-[#D4B886]" />
                                                <span>Riwayat Reservasi Saya</span>
                                            </button>
                                            <Link
                                                href="/order"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="block px-4 py-2.5 text-[#F4EFE6] hover:bg-[#32151F] transition-colors"
                                            >
                                                Menu Pemesanan Makanan
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserDropdownOpen(false);
                                                    setIsLogoutModalOpen(true);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors border-t border-[#32151F] mt-1"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                <span>Keluar (Logout)</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-4 sm:px-5 py-2 text-xs font-semibold tracking-wider text-[#F4EFE6] hover:text-[#211D1B] bg-[#211D1B]/80 hover:bg-gradient-to-r hover:from-[#B99A65] hover:to-[#D4B886] border border-[#B99A65]/40 rounded-full transition-all shadow-md flex items-center gap-1.5"
                                >
                                    <UserIcon className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span>Log In</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
                {/* Tombol Navigasi Kembali ke Beranda (Ditaruh di Body Halaman di atas Card Reservasi) */}
                <div className="mb-6">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#B99A65]/40 bg-white hover:bg-[#32151F] text-[#32151F] hover:text-[#D4B886] text-xs font-semibold transition-all duration-300 shadow-xs hover:shadow-md group active:scale-98"
                        title="Kembali ke Beranda NUSARA"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#B99A65] transition-transform duration-300 group-hover:-translate-x-1" />
                        <span>Kembali ke Beranda</span>
                    </Link>
                </div>

                {pageView === 'booking' ? (
                    <div className="space-y-8">
                        {/* Stepper Progress Bar (App Shell Header) */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#32151F]/15 shadow-xs relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#32151F] before:via-[#B99A65] before:to-[#32151F]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#FAF6F0]">
                                <div>
                                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                        Reservasi Meja & Dining Experience
                                    </h1>
                                    <p className="text-xs sm:text-sm text-[#4A1525]/80 mt-1">
                                        Langkah demi langkah terstruktur. Lengkapi setiap tahap untuk mengamankan jamuan istimewa Anda.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-[#9E938B]">
                                        Langkah <strong className="text-[#32151F] text-base">{currentStep}</strong> dari 5
                                    </span>
                                    <div className="w-24 h-2 rounded-full bg-[#FAF6F0] overflow-hidden border border-[#E8DFD3]">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#32151F] via-[#4A1525] to-[#B99A65] transition-all duration-500"
                                            style={{ width: `${(currentStep / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stepper Dots & Labels */}
                            <div className="grid grid-cols-5 gap-2 sm:gap-4">
                                {stepsConfig.map((s) => {
                                    const isDone = s.step < currentStep;
                                    const isActive = s.step === currentStep;

                                    return (
                                        <button
                                            key={s.step}
                                            type="button"
                                            disabled={s.step > currentStep}
                                            onClick={() => setCurrentStep(s.step as BookingStep)}
                                            className={`flex flex-col items-center sm:items-start p-2 sm:p-3 rounded-2xl transition-all text-left group ${
                                                isActive 
                                                    ? 'bg-[#FAF6F0] border-2 border-[#32151F]/30 shadow-xs' 
                                                    : isDone
                                                    ? 'cursor-pointer hover:bg-[#FAF6F0]/60'
                                                    : 'opacity-40 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                    isActive 
                                                        ? 'bg-[#32151F] text-[#D4B886] ring-2 ring-[#B99A65]/50 shadow-sm' 
                                                        : isDone 
                                                        ? 'bg-[#4A1525] text-[#D4B886]' 
                                                        : 'bg-[#E8DFD3] text-[#6E625A]'
                                                }`}>
                                                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.step}
                                                </div>
                                                <span className={`hidden sm:inline text-xs font-bold ${
                                                    isActive ? 'text-[#32151F]' : isDone ? 'text-[#4A1525]' : 'text-[#6E625A]'
                                                }`}>
                                                    {s.title}
                                                </span>
                                            </div>
                                            <span className="hidden sm:inline text-[11px] text-[#9E938B] truncate w-full">
                                                {s.desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* FORM STEP CONTAINER (1 Tampilan per Langkah) */}
                        <form onSubmit={handleSubmitReservation} className="space-y-6">

                            {/* ========================================================
                                LANGKAH 1: TANGGAL & SESI WAKTU (REAL-TIME AVAILABILITY)
                            ======================================================== */}
                            {currentStep === 1 && (
                                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#32151F]/15 shadow-xs space-y-8 animate-fadeIn relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#32151F] before:via-[#B99A65] before:to-[#32151F]">
                                    <div>
                                        <span className="text-xs font-bold text-[#B99A65] uppercase tracking-wider block mb-1">
                                            Langkah 1 dari 5
                                        </span>
                                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                            Tentukan Tanggal & Jam Kedatangan
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#6E625A] mt-1">
                                            Sistem akan memeriksa ketersediaan meja dan status restoran secara langsung untuk memastikan waktu jamuan tidak tabrakan dengan tamu lain.
                                        </p>
                                    </div>

                                    {/* Real-Time Restaurant Status Banner */}
                                    {isTimeSlotBuyoutBlocked ? (
                                        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-4">
                                            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-sm">
                                                    Restoran Dipesan Penuh (Private Buyout)
                                                </h4>
                                                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                                                    Pada tanggal <strong>{data.date}</strong> pukul <strong>{data.time} WIB</strong>, seluruh restoran telah direservasi untuk acara privat (Sewa 1 Resto). Mohon pilih sesi jam lain atau tanggal berbeda.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-[#32151F]">
                                                        Ketersediaan Sesi Pukul {data.time} WIB
                                                    </h4>
                                                    <p className="text-xs text-[#6E625A]">
                                                        {availableTablesCount > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Sparkles className="w-3.5 h-3.5 text-[#B99A65] shrink-0" />
                                                                <span><strong>{availableTablesCount} dari 10 Meja Tersedia</strong> untuk dipilih.</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-rose-600 font-semibold">Semua meja penuh pada jam ini.</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-[#9E938B] bg-white px-3 py-1.5 rounded-xl border border-[#E8DFD3]">
                                                <Clock className="w-3.5 h-3.5 text-[#B99A65]" />
                                                <span>Durasi Santap: <strong>{selectedExpObj?.duration_minutes || 120} Menit</strong></span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Date Selector */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                            Pilih Tanggal Kedatangan
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <input
                                                type="date"
                                                min={nowJakarta?.date || new Date().toISOString().split('T')[0]}
                                                value={data.date}
                                                onChange={(e) => setData('date', e.target.value)}
                                                className="sm:col-span-2 px-4 py-3.5 rounded-2xl border border-[#E8DFD3] bg-[#FDFBF7] text-sm text-[#1A1615] font-semibold focus:outline-none focus:border-[#B99A65] focus:ring-1 focus:ring-[#B99A65]"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const todayStr = nowJakarta?.date || new Date().toISOString().split('T')[0];
                                                    setData('date', todayStr);
                                                }}
                                                className={`py-3.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                                                    isSelectedDateToday
                                                        ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-xs'
                                                        : 'bg-white border-[#E8DFD3] text-[#6E625A] hover:bg-[#FAF6F0]'
                                                }`}
                                            >
                                                Hari Ini
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 1);
                                                    setData('date', d.toISOString().split('T')[0]);
                                                }}
                                                className={`py-3.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                                                    !isSelectedDateToday
                                                        ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-xs'
                                                        : 'bg-white border-[#E8DFD3] text-[#6E625A] hover:bg-[#FAF6F0]'
                                                }`}
                                            >
                                                Besok / Hari Lain
                                            </button>
                                        </div>
                                        {isSelectedDateToday && (
                                            <p className="text-[11px] text-[#9E938B] italic">
                                                * Ketentuan Restoran: Reservasi untuk hari ini wajib dilakukan minimal 3 jam sebelumnya (WIB) untuk persiapan jamuan istimewa Anda.
                                            </p>
                                        )}
                                    </div>

                                    {/* Time Slots Selector */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                                Pilih Sesi Jam Kedatangan
                                            </label>
                                            <span className="text-xs text-[#9E938B]">
                                                Waktu Saat Ini: <strong>{currentTimeWib} WIB</strong>
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                                            {timeSlots.map(slot => {
                                                const isSelected = data.time === slot.time;
                                                return (
                                                    <button
                                                        key={slot.time}
                                                        type="button"
                                                        disabled={slot.isPastOrCutoff}
                                                        onClick={() => setData('time', slot.time)}
                                                        className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                                                            isSelected
                                                                ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-md ring-2 ring-[#B99A65]/40'
                                                                : slot.isPastOrCutoff
                                                                ? 'bg-[#FAF6F0]/60 border-[#E8DFD3]/60 text-[#A89E96] opacity-50 cursor-not-allowed'
                                                                : 'bg-white border-[#E8DFD3] hover:border-[#B99A65] text-[#1A1615]'
                                                        }`}
                                                    >
                                                        <span className="font-mono text-sm font-bold">
                                                            {slot.label}
                                                        </span>
                                                        <span className="text-[10px] mt-1">
                                                            {slot.isPastOrCutoff ? (
                                                                <span className="text-rose-500 font-medium">{slot.reason}</span>
                                                            ) : isSelected ? (
                                                                <span className="text-[#D4B886] font-semibold">Sesi Dipilih</span>
                                                            ) : (
                                                                <span className="text-emerald-600 font-medium">Tersedia</span>
                                                            )}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Bar Langkah 1 */}
                                    <div className="pt-6 border-t border-[#FAF6F0] flex items-center justify-between">
                                        <span className="text-xs text-[#6E625A]">
                                            Sesi: <strong>{data.date}</strong> pukul <strong>{data.time} WIB</strong>
                                        </span>

                                        <button
                                            type="button"
                                            disabled={!isStep1Valid}
                                            onClick={() => setCurrentStep(2)}
                                            className="px-6 py-3.5 rounded-full bg-[#32151F] hover:bg-[#4A1525] text-[#D4B886] hover:text-[#FAF6F0] border border-[#B99A65]/40 font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
                                        >
                                            <span>Lanjut: Pilih Meja & Tamu</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================
                                LANGKAH 2: JUMLAH TAMU & PEMILIHAN MEJA
                            ======================================================== */}
                            {currentStep === 2 && (
                                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#32151F]/15 shadow-xs space-y-8 animate-fadeIn relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#32151F] before:via-[#B99A65] before:to-[#32151F]">
                                    <div>
                                        <span className="text-xs font-bold text-[#B99A65] uppercase tracking-wider block mb-1">
                                            Langkah 2 dari 5
                                        </span>
                                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                            Tentukan Jumlah Tamu & Pilih Meja
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#6E625A] mt-1">
                                            Kapasitas 1 meja maksimal 5 orang. Untuk 6 hingga 10 tamu, sistem otomatis mewajibkan pemilihan minimal 2 meja berdampingan.
                                        </p>
                                    </div>

                                    {/* Input Jumlah Tamu */}
                                    <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD3] space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                                    Jumlah Tamu (Pax)
                                                </label>
                                                <p className="text-xs text-[#6E625A] mt-0.5">
                                                    Tentukan total rombongan tamu yang akan hadir.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    disabled={data.guest_count <= 1 || isAnyBuyout}
                                                    onClick={() => setData('guest_count', Math.max(1, data.guest_count - 1))}
                                                    className="w-10 h-10 rounded-xl bg-white border border-[#E8DFD3] text-[#32151F] font-bold flex items-center justify-center hover:bg-[#FAF6F0] disabled:opacity-40"
                                                >
                                                    -
                                                </button>

                                                <div className="px-5 py-2 rounded-xl bg-white border border-[#E8DFD3] text-center min-w-[90px]">
                                                    <span className="font-mono text-xl font-extrabold text-[#32151F]">
                                                        {data.guest_count}
                                                    </span>
                                                    <span className="text-[10px] text-[#9E938B] block uppercase tracking-wider">
                                                        Orang
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={data.guest_count >= 50 || isAnyBuyout}
                                                    onClick={() => setData('guest_count', Math.min(50, data.guest_count + 1))}
                                                    className="w-10 h-10 rounded-xl bg-white border border-[#E8DFD3] text-[#32151F] font-bold flex items-center justify-center hover:bg-[#FAF6F0] disabled:opacity-40"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dynamic Rule Alert */}
                                        <div className="pt-3 border-t border-[#E8DFD3] flex items-center gap-2 text-xs">
                                            {isAnyBuyout ? (
                                                <span className="px-3 py-1 rounded-full bg-[#32151F] text-[#D4B886] font-bold">
                                                    Eksklusif Buyout: Seluruh 10 Meja Restoran Diamankan
                                                </span>
                                            ) : data.guest_count > 5 ? (
                                                <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 w-full">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>Untuk <strong>{data.guest_count} Tamu</strong>, Anda <strong>wajib memilih 2 meja</strong> (kapasitas 1 meja maksimal 5 orang).</span>
                                                </div>
                                            ) : (
                                                <span className="text-emerald-700 font-semibold">
                                                    Kapasitas 1–5 orang: Cukup memilih 1 meja favorit Anda.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Denah & Pemilihan Meja Interaktif */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                                Pilih Meja Restoran ({selectedTableIds.length} dari {requiredTableCount} Meja Dipilih)
                                            </label>
                                            <span className="text-xs text-[#9E938B]">
                                                {requiredTableCount === 2 && selectedTableIds.length < 2 && (
                                                    <span className="text-amber-700 font-bold">Pilih 1 meja lagi</span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                                            {tables.map(table => {
                                                const avail = tableAvailabilityMap.get(table.id);
                                                const isAvailable = avail?.isAvailable;
                                                const isSelected = selectedTableIds.includes(table.id);

                                                return (
                                                    <button
                                                        key={table.id}
                                                        type="button"
                                                        disabled={!isAvailable || isAnyBuyout}
                                                        onClick={() => handleToggleTable(table.id)}
                                                        className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-36 ${
                                                            isSelected
                                                                ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-md ring-2 ring-[#B99A65]'
                                                                : !isAvailable
                                                                ? 'bg-[#FAF6F0] border-[#E8DFD3]/60 opacity-50 cursor-not-allowed'
                                                                : 'bg-white border-[#E8DFD3] hover:border-[#B99A65] text-[#1A1615]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="font-mono text-sm font-bold">
                                                                {table.table_number}
                                                            </span>
                                                            {isSelected && (
                                                                <span className="w-5 h-5 rounded-full bg-[#B99A65] text-[#32151F] flex items-center justify-center">
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs opacity-75">
                                                                <Users className="w-3.5 h-3.5" />
                                                                <span>Maks 5 Pax</span>
                                                            </div>
                                                            <span className="text-[10px] block opacity-60 truncate">
                                                                {table.table_number.includes('01') || table.table_number.includes('02') 
                                                                    ? 'Jendela Panorama'
                                                                    : table.table_number.includes('09') || table.table_number.includes('10')
                                                                    ? 'Veranda Taman'
                                                                    : 'Main Dining Hall'}
                                                            </span>
                                                        </div>

                                                        <div>
                                                            {!isAvailable ? (
                                                                <span className="text-[10px] text-rose-500 font-bold block truncate">
                                                                    Terisi ({avail?.bookedTime})
                                                                </span>
                                                            ) : isSelected ? (
                                                                <span className="text-[10px] text-[#D4B886] font-bold block">
                                                                    Meja Terpilih
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-emerald-600 font-bold block">
                                                                    Tersedia
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Bar Langkah 2 */}
                                    <div className="pt-6 border-t border-[#FAF6F0] flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(1)}
                                            className="px-5 py-3 rounded-full border border-[#E8DFD3] text-xs font-bold text-[#6E625A] hover:bg-[#FAF6F0] transition-all flex items-center gap-1.5"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>Kembali ke Jadwal</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!isStep2Valid}
                                            onClick={() => setCurrentStep(3)}
                                            className="px-6 py-3.5 rounded-full bg-[#32151F] hover:bg-[#4A1525] text-[#D4B886] hover:text-[#FAF6F0] border border-[#B99A65]/40 font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
                                        >
                                            <span>Lanjut: Pilih Paket & Menu</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================
                                LANGKAH 3: PAKET DINING & MENU NUSANTARA
                            ======================================================== */}
                            {currentStep === 3 && (
                                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#32151F]/15 shadow-xs space-y-8 animate-fadeIn relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#32151F] before:via-[#B99A65] before:to-[#32151F]">
                                    <div>
                                        <span className="text-xs font-bold text-[#B99A65] uppercase tracking-wider block mb-1">
                                            Langkah 3 dari 5
                                        </span>
                                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                            Pilihan Paket Jamuan & Menu Nusantara
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#6E625A] mt-1">
                                            Pilih paket kurasi istimewa Executive Chef atau lewati paket untuk menikmati santapan santai secara A La Carte (pesan langsung saat kedatangan).
                                        </p>
                                    </div>

                                    {/* Notice Hubungi Admin untuk Kebutuhan di Luar Paket */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-r from-[#32151F] via-[#2A131B] to-[#32151F] text-[#FDFBF7] border border-[#B99A65]/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[#D4B886] text-xs font-bold uppercase tracking-wider">
                                                <Sparkles className="w-4 h-4" />
                                                <span>Punya Permintaan Khusus di Luar Paket?</span>
                                            </div>
                                            <p className="text-xs text-[#F4EFE6]/80 leading-relaxed max-w-xl">
                                                Ingin sewa resto lebih dari 3 jam, kapasitas di atas 50 orang, setup panggung, dekorasi bunga khusus, atau menu khusus dari Chef?
                                            </p>
                                        </div>

                                        <Link
                                            href="/order?open_chat=1"
                                            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shrink-0 flex items-center justify-center gap-2 shadow"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>Hubungi Admin Sekarang</span>
                                        </Link>
                                    </div>

                                    {/* Category Filter Tabs */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                        {[
                                            { id: 'all', label: 'Semua Pilihan' },
                                            { id: 'chef', label: 'Paket Kurasi Chef' },
                                            { id: 'buyout', label: 'Sewa 1 Resto (Buyout)' },
                                            { id: 'alacarte', label: 'A La Carte Saja' },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setExpFilter(tab.id as any)}
                                                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                                    expFilter === tab.id
                                                        ? 'bg-[#32151F] text-[#D4B886] shadow-xs'
                                                        : 'bg-[#FAF6F0] text-[#6E625A] hover:text-[#1A1615] border border-[#E8DFD3]'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Experiences Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {/* Option: A La Carte Standard */}
                                        {(expFilter === 'all' || expFilter === 'alacarte') && (
                                            <div
                                                onClick={() => setData('experience_id', '')}
                                                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                    data.experience_id === ''
                                                        ? 'bg-[#FAF6F0] border-[#32151F] ring-2 ring-[#B99A65]'
                                                        : 'bg-white border-[#E8DFD3] hover:border-[#B99A65]'
                                                }`}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="px-2.5 py-1 rounded-full bg-stone-100 text-[#6E625A] text-[10px] font-bold uppercase tracking-wider">
                                                            Paling Fleksibel
                                                        </span>
                                                        {data.experience_id === '' && (
                                                            <span className="w-5 h-5 rounded-full bg-[#B99A65] text-[#32151F] flex items-center justify-center">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="font-heading text-lg font-bold text-[#32151F]">
                                                        A La Carte Standard
                                                    </h3>
                                                    <p className="text-xs text-[#6E625A] leading-relaxed">
                                                        Reservasi meja tanpa paket makanan awal. Anda bebas memesan seluruh hidangan dan minuman langsung saat santap di restoran.
                                                    </p>
                                                </div>

                                                <div className="pt-4 border-t border-[#E8DFD3] mt-4 flex items-center justify-between">
                                                    <span className="text-xs text-[#9E938B]">Biaya Paket Awal</span>
                                                    <span className="font-mono text-sm font-bold text-emerald-700">Rp 0 (Pesan di Tempat)</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Dining Experience Options */}
                                        {experiences
                                            .filter(exp => {
                                                if (expFilter === 'chef') return !exp.slug?.includes('sewa');
                                                if (expFilter === 'buyout') return exp.slug?.includes('sewa');
                                                return true;
                                            })
                                            .map(exp => {
                                                const isSelected = Number(data.experience_id) === exp.id;
                                                const isBuyout = exp.slug?.includes('sewa');

                                                return (
                                                    <div
                                                        key={exp.id}
                                                        onClick={() => setData('experience_id', exp.id)}
                                                        className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                            isSelected
                                                                ? 'bg-[#FAF6F0] border-[#32151F] ring-2 ring-[#B99A65]'
                                                                : 'bg-white border-[#E8DFD3] hover:border-[#B99A65]'
                                                        }`}
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                    isBuyout ? 'bg-[#32151F] text-[#D4B886]' : 'bg-[#FAF6F0] text-[#946E2D]'
                                                                }`}>
                                                                    {isBuyout ? 'Sewa 1 Resto' : 'Kurasi Chef'}
                                                                </span>
                                                                {isSelected && (
                                                                    <span className="w-5 h-5 rounded-full bg-[#B99A65] text-[#32151F] flex items-center justify-center">
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h3 className="font-heading text-lg font-bold text-[#32151F]">
                                                                {exp.name}
                                                            </h3>
                                                            <p className="text-xs text-[#6E625A] line-clamp-3 leading-relaxed">
                                                                {exp.description}
                                                            </p>
                                                        </div>

                                                        <div className="pt-4 border-t border-[#E8DFD3] mt-4 flex items-center justify-between">
                                                            <span className="text-xs text-[#9E938B]">
                                                                {isBuyout ? 'Paket Seluruh Resto' : 'Tarif per Tamu'}
                                                            </span>
                                                            <span className="font-mono text-sm font-bold text-[#4A1525]">
                                                                {formatRupiah(exp.price_per_person)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {/* Pratinjau Buku Menu Restoran */}
                                    {menus.length > 0 && (
                                        <div className="pt-6 border-t border-[#FAF6F0] space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <h4 className="font-heading text-base font-bold text-[#32151F]">
                                                        Buku Menu & Ragam Kuliner Nusantara
                                                    </h4>
                                                    <p className="text-xs text-[#6E625A]">
                                                        Jelajahi seluruh hidangan autentik Nusantara dan masakan khas daerah yang siap disajikan saat kunjungan Anda.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMenuCatalog(!showMenuCatalog)}
                                                    className="px-4 py-2 rounded-full border border-[#B99A65]/40 text-[#32151F] bg-[#FAF6F0] hover:bg-[#32151F] hover:text-[#D4B886] font-bold text-xs transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-xs"
                                                >
                                                    <Utensils className="w-3.5 h-3.5 text-[#B99A65]" />
                                                    <span>{showMenuCatalog ? 'Tutup Daftar Menu' : `Lihat Buku Menu (${menus.length})`}</span>
                                                </button>
                                            </div>

                                            {showMenuCatalog && (
                                                <div className="p-5 rounded-2xl bg-[#FAF6F0]/80 border border-[#E8DFD3] space-y-4 animate-fadeIn">
                                                    {/* Category pills */}
                                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                                        <button
                                                            type="button"
                                                            onClick={() => setMenuCatalogCategory('all')}
                                                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                                                menuCatalogCategory === 'all'
                                                                    ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                                                    : 'bg-white text-[#6E625A] hover:text-[#1A1615] border border-[#E8DFD3]'
                                                            }`}
                                                        >
                                                            Semua ({menus.length})
                                                        </button>
                                                        {categories.map(cat => {
                                                            const count = menus.filter(m => m.category_slug === cat.slug).length;
                                                            return (
                                                                <button
                                                                    key={cat.id}
                                                                    type="button"
                                                                    onClick={() => setMenuCatalogCategory(cat.slug)}
                                                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                                                        menuCatalogCategory === cat.slug
                                                                            ? 'bg-[#32151F] text-[#D4B886] font-bold shadow-xs'
                                                                            : 'bg-white text-[#6E625A] hover:text-[#1A1615] border border-[#E8DFD3]'
                                                                    }`}
                                                                >
                                                                    <span>{cat.name}</span>
                                                                    {count > 0 && (
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                                                            menuCatalogCategory === cat.slug
                                                                                ? 'bg-[#D4B886]/20 text-[#D4B886]'
                                                                                : 'bg-stone-100 text-stone-600'
                                                                        }`}>
                                                                            {count}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Menu grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1">
                                                        {menus
                                                            .filter(m => menuCatalogCategory === 'all' || m.category_slug === menuCatalogCategory)
                                                            .map(m => (
                                                                <div key={m.id} className="p-3 rounded-2xl bg-white border border-[#E8DFD3] flex gap-3 items-center hover:border-[#B99A65]/60 transition-all shadow-xs">
                                                                    <img
                                                                        src={getMenuImageUrl(m.image_path)}
                                                                        alt={m.name}
                                                                        onError={(e) => { e.currentTarget.src = '/images/menus/sate-lilit.jpg'; }}
                                                                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-100 border border-stone-200"
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <span className="text-[9px] uppercase font-bold tracking-wider text-[#B99A65] block truncate">
                                                                            {m.category_name}
                                                                        </span>
                                                                        <h5 className="font-heading text-xs font-bold text-[#32151F] truncate" title={m.name}>
                                                                            {m.name}
                                                                        </h5>
                                                                        <p className="text-[10px] text-[#6E625A] line-clamp-1 mt-0.5">
                                                                            {m.description}
                                                                        </p>
                                                                        <span className="font-mono text-xs font-bold text-[#946E2D] block mt-1">
                                                                            {formatRupiah(m.price)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Bar Langkah 3 */}
                                    <div className="pt-6 border-t border-[#FAF6F0] flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(2)}
                                            className="px-5 py-3 rounded-full border border-[#E8DFD3] text-xs font-bold text-[#6E625A] hover:bg-[#FAF6F0] transition-all flex items-center gap-1.5"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>Kembali ke Pilih Meja</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(4)}
                                            className="px-6 py-3.5 rounded-full bg-[#32151F] hover:bg-[#4A1525] text-[#D4B886] hover:text-[#FAF6F0] border border-[#B99A65]/40 font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
                                        >
                                            <span>Lanjut: Data Pemesan</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================
                                LANGKAH 4: DATA PEMESAN & PREFERENSI KHUSUS
                            ======================================================== */}
                            {currentStep === 4 && (
                                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#32151F]/15 shadow-xs space-y-8 animate-fadeIn relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#32151F] before:via-[#B99A65] before:to-[#32151F]">
                                    <div>
                                        <span className="text-xs font-bold text-[#B99A65] uppercase tracking-wider block mb-1">
                                            Langkah 4 dari 5
                                        </span>
                                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                            Informasi Pemesan & Catatan Khusus
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#6E625A] mt-1">
                                            Tiket konfirmasi dan pembaruan validasi kasir akan dikirimkan langsung ke nomor WhatsApp dan alamat email Anda.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Nama Pemesan */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                                Nama Lengkap Pemesan *
                                            </label>
                                            <div className="relative">
                                                <UserIcon className="w-4 h-4 text-[#9E938B] absolute left-4 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={data.customer_name}
                                                    onChange={(e) => setData('customer_name', e.target.value)}
                                                    placeholder="Nama lengkap Anda..."
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E8DFD3] bg-[#FDFBF7] text-sm text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                                />
                                            </div>
                                        </div>

                                        {/* Nomor WhatsApp */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                                Nomor WhatsApp / Telepon *
                                            </label>
                                            <div className="relative">
                                                <Phone className="w-4 h-4 text-[#9E938B] absolute left-4 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="tel"
                                                    required
                                                    value={data.customer_phone}
                                                    onChange={(e) => setData('customer_phone', e.target.value)}
                                                    placeholder="Contoh: 081234567890"
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E8DFD3] bg-[#FDFBF7] text-sm text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                                Alamat Email Konfirmasi
                                            </label>
                                            <input
                                                type="email"
                                                disabled
                                                value={auth.user.email}
                                                className="w-full px-4 py-3.5 rounded-2xl border border-[#E8DFD3] bg-stone-100 text-sm text-[#6E625A] cursor-not-allowed"
                                            />
                                        </div>

                                        {/* Catatan Khusus */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                                Permintaan Khusus & Catatan Alergi (Opsional)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={data.special_request}
                                                onChange={(e) => setData('special_request', e.target.value)}
                                                placeholder="Contoh: Perayaan ulang tahun, request baby chair, pantangan seafood/kacang, atau dekorasi meja..."
                                                className="w-full px-4 py-3 rounded-2xl border border-[#E8DFD3] bg-[#FDFBF7] text-sm text-[#1A1615] focus:outline-none focus:border-[#B99A65]"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Bar Langkah 4 */}
                                    <div className="pt-6 border-t border-[#FAF6F0] flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(3)}
                                            className="px-5 py-3 rounded-full border border-[#E8DFD3] text-xs font-bold text-[#6E625A] hover:bg-[#FAF6F0] transition-all flex items-center gap-1.5"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>Kembali ke Paket</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!isStep4Valid}
                                            onClick={() => setCurrentStep(5)}
                                            className="px-6 py-3.5 rounded-full bg-[#32151F] hover:bg-[#4A1525] text-[#D4B886] hover:text-[#FAF6F0] border border-[#B99A65]/40 font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
                                        >
                                            <span>Lanjut: Ringkasan & Pembayaran DP</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================
                                LANGKAH 5: KESIMPULAN LENGKAP & PEMBAYARAN DOWN PAYMENT
                            ======================================================== */}
                            {currentStep === 5 && (
                                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#32151F]/15 shadow-xs space-y-8 animate-fadeIn relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#32151F] before:via-[#B99A65] before:to-[#32151F]">
                                    <div>
                                        <span className="text-xs font-bold text-[#B99A65] uppercase tracking-wider block mb-1">
                                            Langkah 5 dari 5 (Langkah Terakhir)
                                        </span>
                                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                            Kesimpulan Pemesanan & Pembayaran DP
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#6E625A] mt-1">
                                            Periksa rincian reservasi Anda. Selesaikan uang muka (DP) agar meja aman, dan sisa pembayaran akan dilunasi di kasir restoran saat Anda hadir.
                                        </p>
                                    </div>

                                    {/* Ringkasan Lengkap Pemesanan (Kesimpulan) */}
                                    <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E8DFD3] space-y-5">
                                        <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD3]">
                                            <span className="text-xs font-bold text-[#32151F] uppercase tracking-wider">
                                                Rincian Reservasi Meja
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold uppercase">
                                                Status: Menunggu Validasi Kasir
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                            <div className="space-y-1">
                                                <span className="text-[#9E938B] block">Jadwal & Jam:</span>
                                                <strong className="text-[#1A1615] text-sm block">
                                                    {data.date}, {data.time} WIB
                                                </strong>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[#9E938B] block">Meja yang Diamankan:</span>
                                                <strong className="text-[#4A1525] text-sm block">
                                                    {selectedTableNamesString}
                                                </strong>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[#9E938B] block">Jumlah Tamu:</span>
                                                <strong className="text-[#1A1615] text-sm block">
                                                    {data.guest_count} Orang (Pax)
                                                </strong>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[#9E938B] block">Pilihan Paket:</span>
                                                <strong className="text-[#32151F] text-sm block">
                                                    {selectedExpObj?.name || 'A La Carte Standard (Pesan di Tempat)'}
                                                </strong>
                                            </div>
                                        </div>

                                        {data.special_request && (
                                            <div className="p-3 rounded-xl bg-white border border-[#E8DFD3] text-xs">
                                                <span className="text-[#9E938B] block mb-0.5">Catatan Khusus Tamu:</span>
                                                <span className="text-[#1A1615] italic">"{data.special_request}"</span>
                                            </div>
                                        )}

                                        {/* Financial Breakdown (DP & Pelunasan Kasir) */}
                                        <div className="pt-4 border-t border-[#E8DFD3] space-y-2.5">
                                            <div className="flex items-center justify-between text-xs text-[#6E625A]">
                                                <span>Estimasi Total Santap:</span>
                                                <span className="font-mono font-bold text-sm text-[#1A1615]">
                                                    {formatRupiah(estimatedTotal)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-[#6E625A]">
                                                <span>Pelunasan Sisa di Kasir Restoran:</span>
                                                <span className="font-mono font-medium text-[#6E625A]">
                                                    {formatRupiah(remainingBalance)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm sm:text-base font-bold bg-gradient-to-br from-[#32151F] via-[#3D1A27] to-[#211D1B] text-[#FAF6F0] p-5 rounded-2xl border border-[#B99A65]/40 shadow-md">
                                                <div className="space-y-0.5">
                                                    <span className="text-xs uppercase tracking-wider text-[#D4B886] block font-semibold">
                                                        Uang Muka (DP) yang Dibayar Sekarang
                                                    </span>
                                                    <span className="text-xs text-[#FAF6F0]/70 font-normal">
                                                        * Untuk penguncian alokasi meja & jadwal resmi
                                                    </span>
                                                </div>
                                                <span className="font-mono text-xl sm:text-2xl text-[#D4B886] font-extrabold">
                                                    {formatRupiah(calculatedDpAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metode Pembayaran DP (QRIS & Transfer Bank) */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-[#32151F] uppercase tracking-wider block">
                                            Pilih Metode Pembayaran DP
                                        </label>

                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'qris', label: 'QRIS Dinamis', sub: 'Semua e-Wallet & M-Banking' },
                                                { id: 'bca', label: 'Bank BCA', sub: 'Virtual Account / Transfer' },
                                                { id: 'mandiri', label: 'Bank Mandiri', sub: 'Virtual Account / Transfer' },
                                            ].map(method => (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => setData('dp_payment_method', method.id as any)}
                                                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                                                        data.dp_payment_method === method.id
                                                            ? 'bg-[#32151F] text-[#D4B886] border-[#32151F] shadow-xs'
                                                            : 'bg-[#FAF6F0] text-[#1A1615] border-[#E8DFD3] hover:bg-white'
                                                    }`}
                                                >
                                                    <span className="font-bold text-xs block">{method.label}</span>
                                                    <span className="text-[10px] opacity-75 block mt-0.5">{method.sub}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Container Tampilan Metode Pembayaran Terpilih */}
                                        <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E8DFD3]">
                                            {data.dp_payment_method === 'qris' && (
                                                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                                    <div className="p-3 bg-white rounded-2xl border border-[#E8DFD3] shadow-xs shrink-0">
                                                        {/* QR Code Illustration */}
                                                        <div className="w-36 h-36 bg-[#FDFBF7] flex flex-col items-center justify-center border border-dashed border-[#B99A65]/50 rounded-xl relative overflow-hidden">
                                                            <QrCode className="w-24 h-24 text-[#32151F]" />
                                                            <span className="text-[9px] font-mono font-bold text-[#946E2D] mt-1">
                                                                SCAN QRIS NUSARA
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-xs">
                                                        <h4 className="font-bold text-sm text-[#32151F]">
                                                            Pembayaran Instan via QRIS
                                                        </h4>
                                                        <p className="text-[#6E625A] leading-relaxed">
                                                            Buka aplikasi BCA Mobile, Livin' Mandiri, GoPay, OVO, Dana, atau ShopeePay Anda. Pindai kode QR di atas dengan nominal tepat <strong>{formatRupiah(calculatedDpAmount)}</strong>.
                                                        </p>
                                                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                                                            Batas Waktu Validasi: 15 Menit
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {data.dp_payment_method === 'bca' && (
                                                <div className="space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E8DFD3]">
                                                        <div>
                                                            <span className="text-[10px] text-[#9E938B] uppercase font-bold block">
                                                                Nomor Rekening BCA Resmi
                                                            </span>
                                                            <span className="font-mono text-lg font-bold text-[#32151F]">
                                                                8801 2345 6789 000
                                                            </span>
                                                            <span className="text-xs text-[#6E625A] block">
                                                                a.n. PT NUSARA INDONESIA KULINER
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard('880123456789000', 'bca')}
                                                            className="px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#32151F] hover:text-[#D4B886] text-xs font-bold text-[#32151F] border border-[#E8DFD3] transition-all flex items-center justify-center gap-1.5"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                            <span>{copiedAccount === 'bca' ? 'Tersalin!' : 'Salin Nomor'}</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] text-[#9E938B]">
                                                        * Cantumkan nama Anda pada berita transfer untuk mempercepat validasi staf kasir.
                                                    </p>
                                                </div>
                                            )}

                                            {data.dp_payment_method === 'mandiri' && (
                                                <div className="space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E8DFD3]">
                                                        <div>
                                                            <span className="text-[10px] text-[#9E938B] uppercase font-bold block">
                                                                Nomor Rekening Mandiri Resmi
                                                            </span>
                                                            <span className="font-mono text-lg font-bold text-[#32151F]">
                                                                1370 0987 6543 210
                                                            </span>
                                                            <span className="text-xs text-[#6E625A] block">
                                                                a.n. PT NUSARA INDONESIA KULINER
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard('137009876543210', 'mandiri')}
                                                            className="px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#32151F] hover:text-[#D4B886] text-xs font-bold text-[#32151F] border border-[#E8DFD3] transition-all flex items-center justify-center gap-1.5"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                            <span>{copiedAccount === 'mandiri' ? 'Tersalin!' : 'Salin Nomor'}</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] text-[#9E938B]">
                                                        * Cantumkan nama Anda pada berita transfer untuk mempercepat validasi staf kasir.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bantuan Konsierge & Persetujuan */}
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-4 h-4 text-amber-600 shrink-0" />
                                            <span>Butuh bantuan pembayaran atau perubahan mendadak?</span>
                                        </div>
                                        <Link
                                            href="/order?open_chat=1"
                                            className="font-bold underline text-amber-900 hover:text-amber-700 whitespace-nowrap"
                                        >
                                            Hubungi Admin Konsierge
                                        </Link>
                                    </div>

                                    <div className="pt-2">
                                        <label className="flex items-start gap-3 cursor-pointer text-xs text-[#6E625A]">
                                            <input
                                                type="checkbox"
                                                checked={isDpAgreed}
                                                onChange={(e) => setIsDpAgreed(e.target.checked)}
                                                className="w-4 h-4 mt-0.5 rounded text-[#32151F] focus:ring-[#B99A65] border-[#E8DFD3]"
                                            />
                                            <span>
                                                Saya telah melakukan pembayaran uang muka (DP) sebesar <strong>{formatRupiah(calculatedDpAmount)}</strong> dan memahami reservasi akan berstatus <strong>"Menunggu Validasi Kasir"</strong> hingga diverifikasi oleh kasir restoran. Sisa pembayaran akan saya selesaikan di kasir restoran saat kedatangan.
                                            </span>
                                        </label>
                                    </div>

                                    {/* Action Bar Langkah 5 */}
                                    <div className="pt-6 border-t border-[#FAF6F0] flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(4)}
                                            className="px-5 py-3 rounded-full border border-[#E8DFD3] text-xs font-bold text-[#6E625A] hover:bg-[#FAF6F0] transition-all flex items-center gap-1.5"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>Kembali ke Data Tamu</span>
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={!isStep5Valid}
                                            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#32151F] via-[#4A1525] to-[#32151F] text-[#D4B886] hover:text-[#FAF6F0] border border-[#B99A65]/50 hover:border-[#D4B886] font-bold text-xs uppercase tracking-wider transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
                                        >
                                            {processing ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    <span>Memproses Reservasi...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Kirim & Konfirmasi Reservasi</span>
                                                    <ShieldCheck className="w-4 h-4 text-[#D4B886] transition-transform group-hover:scale-110" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                ) : (
                    /* ========================================================
                        TAB RIWAYAT RESERVASI SAYA
                    ======================================================== */
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white rounded-3xl border border-[#E8DFD3]">
                            <div>
                                <span className="text-xs font-bold text-[#B99A65] uppercase tracking-wider block mb-1">
                                    Buku Tamu Saya
                                </span>
                                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#32151F]">
                                    Riwayat & Status Reservasi
                                </h2>
                                <p className="text-xs sm:text-sm text-[#6E625A] mt-1">
                                    Pantau status validasi kasir, detail meja, dan tiket kunjungan Anda.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPageView('booking')}
                                className="px-5 py-3 rounded-full bg-[#32151F] text-[#D4B886] font-bold text-xs uppercase tracking-wider hover:bg-[#4A1525] transition-all flex items-center gap-2 shadow-xs shrink-0"
                            >
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>Buat Reservasi Baru</span>
                            </button>
                        </div>

                        {customerReservations.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-3xl border border-[#E8DFD3] space-y-4">
                                <UtensilsCrossed className="w-12 h-12 text-[#B99A65] mx-auto opacity-60" />
                                <h3 className="font-heading text-xl font-bold text-[#32151F]">
                                    Belum Ada Riwayat Reservasi
                                </h3>
                                <p className="text-xs text-[#6E625A] max-w-md mx-auto">
                                    Anda belum memiliki riwayat reservasi meja di NUSARA. Klik tombol di bawah untuk membuat reservasi baru.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setPageView('booking')}
                                    className="px-6 py-3 rounded-full bg-[#32151F] hover:bg-[#4A1525] text-[#D4B886] hover:text-[#FAF6F0] border border-[#B99A65]/40 font-bold text-xs uppercase tracking-wider shadow transition-all"
                                >
                                    Mulai Buat Reservasi
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customerReservations.map(res => (
                                    <div
                                        key={res.id}
                                        className="p-6 rounded-3xl bg-white border border-[#E8DFD3] hover:border-[#D4B886] shadow-xs space-y-4 transition-all"
                                    >
                                        <div className="flex items-center justify-between pb-3 border-b border-[#FAF6F0]">
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] text-[#9E938B] uppercase font-bold block">
                                                    KODE BOOKING
                                                </span>
                                                <span className="font-mono text-base font-bold text-[#4A1525]">
                                                    #{res.reservation_code}
                                                </span>
                                            </div>

                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                res.status === 'Confirmed'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                    : res.status === 'Pending'
                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                                    : 'bg-stone-100 text-stone-700'
                                            }`}>
                                                {res.status === 'Pending' ? 'Menunggu Validasi Kasir' : res.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-[#9E938B] block">Jadwal & Jam:</span>
                                                <strong className="text-[#1A1615] block mt-0.5">
                                                    {res.reservation_datetime}
                                                </strong>
                                            </div>

                                            <div>
                                                <span className="text-[#9E938B] block">Meja Alokasi:</span>
                                                <strong className="text-[#32151F] block mt-0.5">
                                                    {res.table_number || 'Dalam Penataan Kasir'}
                                                </strong>
                                            </div>

                                            <div>
                                                <span className="text-[#9E938B] block">Jumlah Tamu:</span>
                                                <strong className="text-[#1A1615] block mt-0.5">
                                                    {res.guest_count} Orang
                                                </strong>
                                            </div>

                                            <div>
                                                <span className="text-[#9E938B] block">Paket Dining:</span>
                                                <strong className="text-[#946E2D] block mt-0.5 truncate">
                                                    {res.experience_name || 'A La Carte Standard'}
                                                </strong>
                                            </div>
                                        </div>

                                        {res.special_request && (
                                            <div className="p-3 rounded-xl bg-[#FAF6F0] text-[11px] text-[#6E625A]">
                                                {res.special_request}
                                            </div>
                                        )}

                                        <div className="pt-2 flex items-center justify-between text-xs border-t border-[#FAF6F0]">
                                            <span className="text-[10px] text-[#9E938B]">
                                                Dibuat: {res.created_at}
                                            </span>
                                            <Link
                                                href="/order?open_chat=1"
                                                className="text-[#4A1525] hover:text-[#B99A65] font-bold text-xs flex items-center gap-1"
                                            >
                                                <span>Hubungi Admin</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                userName={auth?.user?.name}
                userRole={auth?.user?.role}
            />
        </div>
    );
}
