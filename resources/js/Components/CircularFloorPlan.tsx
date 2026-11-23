import React, { useState, useMemo } from 'react';
import { 
    Check, 
    Sparkles, 
    CheckCheck, 
    Clock, 
    X, 
    Users, 
    Calendar, 
    Info, 
    Lock,
    Table as TableIcon,
    ChevronRight,
    MapPin,
    AlertCircle
} from 'lucide-react';
import { RestaurantTable } from '../types';

interface TableSessionInfo {
    id: number;
    session_code: string;
    status: string;
    started_at?: string;
}

interface ActiveOrderInfo {
    order_code: string;
    customer_name: string;
    order_status: string;
    total: number;
}

interface TableWithSessionInfo extends RestaurantTable {
    active_session?: TableSessionInfo | null;
    active_orders_count?: number;
    active_order?: ActiveOrderInfo | null;
}

interface ReservationData {
    id: number;
    reservation_code: string;
    customer_name?: string;
    customer_phone?: string;
    reservation_datetime: string;
    guest_count: number;
    status: string;
    table_number?: string;
    table_id?: number;
    experience_name?: string | null;
}

interface Props {
    tables: TableWithSessionInfo[];
    reservations?: ReservationData[];
    selectedDate: Date;
    role: 'waiter' | 'cashier' | 'admin';
    statusFilter?: string;
    onFilterChange?: (filter: string) => void;
    onValidateTable?: (tableId: number) => void;
    onStartCleaning?: (tableId: number) => void;
    onFinishCleaning?: (tableId: number) => void;
    onUpdateStatus?: (tableId: number, status: string) => void;
}

export default function CircularFloorPlan({
    tables = [],
    reservations = [],
    selectedDate,
    role,
    statusFilter = 'all',
    onFilterChange,
    onValidateTable,
    onStartCleaning,
    onFinishCleaning,
    onUpdateStatus
}: Props) {
    const [selectedTable, setSelectedTable] = useState<TableWithSessionInfo | null>(null);

    // Format selected date YYYY-MM-DD
    const selectedDateStr = useMemo(() => {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [selectedDate]);

    // Check if selectedDate is today
    const isToday = useMemo(() => {
        const today = new Date();
        return (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        );
    }, [selectedDate]);

    // Ensure 10 tables sorted from Meja 01 to Meja 10
    const tenTables = useMemo(() => {
        const list = [...tables];
        list.sort((a, b) => {
            const numA = parseInt(a.table_number.replace(/\D/g, '') || '0', 10);
            const numB = parseInt(b.table_number.replace(/\D/g, '') || '0', 10);
            return numA - numB;
        });

        // Ensure 10 items
        if (list.length < 10) {
            for (let i = list.length + 1; i <= 10; i++) {
                list.push({
                    id: 900 + i,
                    table_number: `Meja ${String(i).padStart(2, '0')}`,
                    capacity: 5,
                    location: 'Main Dining Hall',
                    status: 'Available' as any,
                    is_active: true
                });
            }
        }
        return list.slice(0, 10);
    }, [tables]);

    // Map reservations on the selected date for each table
    const tableReservationsMap = useMemo(() => {
        const map = new Map<string, ReservationData[]>();
        reservations.forEach(r => {
            if (!r.reservation_datetime) return;
            const dateStr = (r.reservation_datetime.includes('T')
                ? r.reservation_datetime.split('T')[0]
                : r.reservation_datetime.split(' ')[0]).trim();
            if (dateStr === selectedDateStr && ['Pending', 'Confirmed', 'Seated'].includes(r.status)) {
                const key = r.table_number || (r.table_id ? `Meja ${String(r.table_id).padStart(2, '0')}` : '');
                if (key) {
                    if (!map.has(key)) map.set(key, []);
                    map.get(key)!.push(r);
                }
            }
        });
        return map;
    }, [reservations, selectedDateStr]);

    // Determine table visual status based on real-time vs selected date
    const getTableDisplayStatus = (tbl: TableWithSessionInfo) => {
        const dateResList = tableReservationsMap.get(tbl.table_number) || [];

        if (!isToday) {
            // Looking at a future/past date
            if (dateResList.length > 0) {
                return {
                    status: 'Reserved',
                    label: 'Reservasi',
                    customer: dateResList[0].customer_name,
                    time: new Date(dateResList[0].reservation_datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    bgClass: 'bg-amber-950/60 border-[#D4B886] text-amber-200 shadow-amber-950/40',
                    dotClass: 'bg-[#D4B886]',
                    badgeClass: 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40'
                };
            }
            return {
                status: 'Available',
                label: 'Kosong',
                customer: null,
                time: null,
                bgClass: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-emerald-950/30',
                dotClass: 'bg-emerald-400',
                badgeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
            };
        }

        // Looking at Today (live status)
        const rawStatus = tbl.status.toLowerCase();

        if (rawStatus === 'pending_validation' || rawStatus === 'pending validation') {
            return {
                status: 'Pending Validation',
                label: 'Perlu Validasi',
                customer: 'Tamu Datang',
                time: 'Saat ini',
                bgClass: 'bg-amber-950/70 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 animate-pulse',
                dotClass: 'bg-amber-400 animate-ping',
                badgeClass: 'bg-amber-950 text-amber-300 border border-amber-500 font-extrabold'
            };
        }

        // Check Occupied: either rawStatus is occupied OR table has active orders
        const hasActiveOrders = (tbl.active_orders_count && tbl.active_orders_count > 0) || rawStatus === 'occupied';

        if (hasActiveOrders) {
            const customerName = tbl.active_order?.customer_name || (tbl.active_session?.session_code ? `Sesi ${tbl.active_session.session_code}` : 'Tamu Santap');
            const timeInfo = tbl.active_order ? `Order #${tbl.active_order.order_code}` : (tbl.active_orders_count ? `${tbl.active_orders_count} Pesanan Aktif` : 'Santap di Tempat');

            return {
                status: 'Occupied',
                label: 'Terisi',
                customer: customerName,
                time: timeInfo,
                bgClass: 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-950/60 ring-2 ring-rose-500/50',
                dotClass: 'bg-rose-500 animate-pulse',
                badgeClass: 'bg-rose-950 text-rose-300 border border-rose-600 font-bold'
            };
        }

        if (rawStatus === 'cleaning') {
            return {
                status: 'Cleaning',
                label: 'Pembersihan',
                customer: 'Pramusaji',
                time: 'Sedang Dibersihkan',
                bgClass: 'bg-blue-950/60 border-blue-500/60 text-blue-200 shadow-blue-950/40 animate-pulse',
                dotClass: 'bg-blue-400 animate-ping',
                badgeClass: 'bg-blue-950 text-blue-300 border border-blue-600'
            };
        }

        if (rawStatus === 'reserved' || dateResList.length > 0) {
            const res = dateResList[0];
            return {
                status: 'Reserved',
                label: 'Reservasi',
                customer: res?.customer_name || 'Tamu Reservasi',
                time: res ? new Date(res.reservation_datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Hari Ini',
                bgClass: 'bg-amber-950/60 border-[#D4B886] text-amber-200 shadow-amber-950/40',
                dotClass: 'bg-[#D4B886]',
                badgeClass: 'bg-[#32151F] text-[#D4B886] border border-[#B99A65]/40'
            };
        }

        // Available
        return {
            status: 'Available',
            label: 'Kosong',
            customer: null,
            time: null,
            bgClass: 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300 hover:border-emerald-400',
            dotClass: 'bg-emerald-400',
            badgeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-800'
        };
    };

    // Helper normalisasi status
    const normalizeStatus = (s?: string) => (s || '').toLowerCase().replace(/[\s_-]+/g, '');

    const isTableMatchingFilter = (tbl: TableWithSessionInfo, displayStatus: string, filter: string) => {
        if (!filter || filter === 'all') return true;
        const normFilter = normalizeStatus(filter);
        const normDisplay = normalizeStatus(displayStatus);
        const normRaw = normalizeStatus(tbl.status);
        return normDisplay === normFilter || normRaw === normFilter;
    };

    // Hitung jumlah meja per status
    const counts = useMemo(() => {
        let cleaning = 0;
        let occupied = 0;
        let pending = 0;
        let available = 0;
        let reserved = 0;

        tenTables.forEach(t => {
            const d = getTableDisplayStatus(t);
            const norm = normalizeStatus(d.status);
            if (norm === 'cleaning') cleaning++;
            else if (norm === 'occupied') occupied++;
            else if (norm === 'pendingvalidation') pending++;
            else if (norm === 'reserved') reserved++;
            else available++;
        });

        return {
            all: tenTables.length,
            cleaning,
            occupied,
            pending,
            available,
            reserved
        };
    }, [tenTables, tableReservationsMap, isToday]);

    // Daftar nomor meja yang sesuai filter aktif
    const matchingTableNumbers = useMemo(() => {
        if (statusFilter === 'all') return [];
        return tenTables
            .filter(tbl => isTableMatchingFilter(tbl, getTableDisplayStatus(tbl).status, statusFilter))
            .map(tbl => tbl.table_number);
    }, [tenTables, statusFilter, tableReservationsMap, isToday]);

    const filterLabelMap: Record<string, string> = {
        all: 'Keseluruhan',
        cleaning: 'Pembersihan',
        occupied: 'Terisi',
        pending_validation: 'Perlu Validasi',
        available: 'Kosong / Available',
        reserved: 'Reservasi'
    };

    return (
        <div className="space-y-4">
            {/* Floor Plan Header & Legend */}
            <div className="p-4 rounded-2xl bg-[#161312] border border-[#241F1D] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <TableIcon className="w-4 h-4 text-[#B99A65]" />
                        <h3 className="font-heading font-bold text-sm text-white">
                            Denah Tata Letak Meja Nusantara (Meja 01 – Meja 10)
                        </h3>
                    </div>
                    <p className="text-[11px] text-[#9E938B]">
                        {isToday ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 inline-flex">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live Real-Time Hari Ini ({selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                            </span>
                        ) : (
                            <span className="text-[#D4B886] font-semibold flex items-center gap-1.5 inline-flex">
                                <Calendar className="w-3 h-3 text-[#D4B886]" />
                                Pratinjau Jadwal Kalender: {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        )}
                        {' · '}
                        {role === 'cashier' ? (
                            <span className="text-[#9E938B] italic">Mode Hanya-Lihat (Read-Only)</span>
                        ) : (
                            <span className="text-[#D4B886]">Klik meja untuk mengelola status sesi</span>
                        )}
                    </p>
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Kosong (Available)</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-950/60 border border-rose-800 text-rose-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Terisi (Occupied)</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-950/60 border border-blue-800 text-blue-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>Pembersihan</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4B886]" />
                        <span>Reservasi</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950 border border-amber-600 text-amber-300 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Perlu Validasi</span>
                    </div>
                </div>
            </div>

            {/* Mode Switch: Keseluruhan vs Filter Status (Hanya untuk Waiter / Admin, Cashier tetap Keseluruhan saja) */}
            {role !== 'cashier' && onFilterChange && (
                <div className="p-3 rounded-2xl bg-[#161312] border border-[#241F1D] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4B886] whitespace-nowrap">
                            Mode Denah:
                        </span>
                        <button
                            type="button"
                            onClick={() => onFilterChange('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-[#B99A65] text-[#110F0E] shadow-sm'
                                    : 'bg-[#211D1B] text-[#9E938B] hover:text-[#F4EFE6] border border-[#342D2A]'
                            }`}
                        >
                            Keseluruhan ({counts.all} Meja)
                        </button>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => onFilterChange('cleaning')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                statusFilter === 'cleaning'
                                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                                    : 'bg-[#211D1B] text-blue-300 hover:bg-blue-950/60 border border-blue-900/60'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span>Pembersihan ({counts.cleaning})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterChange('occupied')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                statusFilter === 'occupied'
                                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/50'
                                    : 'bg-[#211D1B] text-rose-300 hover:bg-rose-950/60 border border-rose-900/60'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            <span>Terisi ({counts.occupied})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterChange('pending_validation')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                statusFilter === 'pending_validation'
                                    ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400/50'
                                    : 'bg-[#211D1B] text-amber-300 hover:bg-amber-950/60 border border-amber-900/60'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span>Perlu Validasi ({counts.pending})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterChange('available')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                statusFilter === 'available'
                                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                                    : 'bg-[#211D1B] text-emerald-300 hover:bg-emerald-950/60 border border-emerald-900/60'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Kosong ({counts.available})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterChange('reserved')}
                            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                statusFilter === 'reserved'
                                    ? 'bg-[#B99A65] text-[#110F0E] shadow-md ring-2 ring-[#D4B886]/50'
                                    : 'bg-[#211D1B] text-[#D4B886] hover:bg-[#32151F] border border-[#B99A65]/40'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-[#D4B886]" />
                            <span>Reservasi ({counts.reserved})</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Active Alert Banner */}
            {statusFilter !== 'all' && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#211a19] via-[#1b1514] to-[#211a19] border border-[#B99A65]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#32151F] border border-[#B99A65]/40 flex items-center justify-center text-[#D4B886] shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">
                                Filter Aktif: <span className="text-[#D4B886] uppercase font-mono">{filterLabelMap[statusFilter] || statusFilter}</span>
                                {' — '}
                                {matchingTableNumbers.length > 0 ? (
                                    <span className="text-amber-300 font-mono font-bold">
                                        {matchingTableNumbers.join(', ')} ({matchingTableNumbers.length} Meja)
                                    </span>
                                ) : (
                                    <span className="text-stone-400 font-normal">Tidak ada meja dengan status ini</span>
                                )}
                            </p>
                            <p className="text-[11px] text-[#9E938B] mt-0.5">
                                Meja yang sesuai disorot terang dengan ring emas. Meja lainnya diredupkan agar posisi meja mudah dipantau.
                            </p>
                        </div>
                    </div>
                    {onFilterChange && (
                        <button
                            type="button"
                            onClick={() => onFilterChange('all')}
                            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#241F1D] hover:bg-[#32151F] text-xs font-bold text-[#D4B886] border border-[#B99A65]/40 hover:border-[#D4B886] transition-all shrink-0"
                        >
                            Tampilkan Keseluruhan (10 Meja)
                        </button>
                    )}
                </div>
            )}

            {/* 10 Circular Tables Blueprint Grid */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#161312] to-[#120F0E] border border-[#241F1D] shadow-2xl relative overflow-hidden">
                {/* Dining Hall Floor Grid Ambient Lines */}
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#D4B886 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 justify-items-center py-4">
                    {tenTables.map((tbl) => {
                        const display = getTableDisplayStatus(tbl);
                        const isMatch = statusFilter === 'all' || isTableMatchingFilter(tbl, display.status, statusFilter);

                        return (
                            <div 
                                key={tbl.id} 
                                className={`flex flex-col items-center group cursor-pointer transition-all duration-300 ${
                                    isMatch 
                                        ? 'scale-100 opacity-100 z-10' 
                                        : 'opacity-20 grayscale hover:opacity-60 hover:grayscale-0 scale-95'
                                }`}
                                onClick={() => setSelectedTable(tbl)}
                            >
                                {/* Outer Blueprint Circle with Surrounding Satellite Chairs */}
                                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                                    {/* 5 Circular Chairs around the Table */}
                                    <span className="absolute -top-1 w-4 h-4 rounded-full bg-[#211D1B] border border-[#3D332D] shadow" title="Kursi 1" />
                                    <span className="absolute top-4 -right-1 w-4 h-4 rounded-full bg-[#211D1B] border border-[#3D332D] shadow" title="Kursi 2" />
                                    <span className="absolute -bottom-1 right-3 w-4 h-4 rounded-full bg-[#211D1B] border border-[#3D332D] shadow" title="Kursi 3" />
                                    <span className="absolute -bottom-1 left-3 w-4 h-4 rounded-full bg-[#211D1B] border border-[#3D332D] shadow" title="Kursi 4" />
                                    <span className="absolute top-4 -left-1 w-4 h-4 rounded-full bg-[#211D1B] border border-[#3D332D] shadow" title="Kursi 5" />

                                    {/* Main Circular Table Surface */}
                                    <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex flex-col items-center justify-center p-2 text-center transition-all shadow-xl backdrop-blur-sm ${display.bgClass} ${
                                        isMatch && statusFilter !== 'all' ? 'ring-4 ring-[#D4B886] shadow-[0_0_25px_rgba(212,184,134,0.45)]' : ''
                                    }`}>
                                        {/* Table Number */}
                                        <span className="font-heading font-bold text-sm sm:text-base text-white tracking-wide">
                                            {tbl.table_number}
                                        </span>

                                        {/* Status in the Center */}
                                        <div className="my-0.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block ${display.badgeClass}`}>
                                                {display.label}
                                            </span>
                                        </div>

                                        {/* Details / Capacity */}
                                        {display.customer ? (
                                            <span className="text-[9px] font-medium text-stone-300 truncate max-w-[80px] block leading-tight">
                                                {display.customer}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] text-[#9E938B] block font-mono">
                                                {tbl.capacity} Kursi
                                            </span>
                                        )}

                                        {display.time && (
                                            <span className="text-[8px] text-[#D4B886] font-mono block">
                                                {display.time}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Table Subtitle */}
                                <div className="mt-2 text-center">
                                    <span className="text-[10px] text-[#9E938B] font-medium block">
                                        {tbl.location || 'Dining Hall'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Table Detail & Action Modal */}
            {selectedTable && (() => {
                const display = getTableDisplayStatus(selectedTable);
                const tableResList = tableReservationsMap.get(selectedTable.table_number) || [];

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-md bg-[#161312] border border-[#241F1D] rounded-3xl p-6 shadow-2xl text-[#F4EFE6] space-y-4">
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="absolute top-4 right-4 p-2 rounded-full text-[#9E938B] hover:text-white hover:bg-[#241F1D]"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center gap-3 pb-3 border-b border-[#241F1D]">
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-heading font-bold text-base shadow ${display.bgClass}`}>
                                    {selectedTable.table_number.replace(/\D/g, '')}
                                </div>
                                <div>
                                    <h3 className="font-heading text-lg font-bold text-white">
                                        {selectedTable.table_number}
                                    </h3>
                                    <p className="text-xs text-[#9E938B]">
                                        Kapasitas {selectedTable.capacity} Kursi · {selectedTable.location || 'Main Dining Hall'}
                                    </p>
                                </div>
                            </div>

                            {/* Current Status Info */}
                            <div className="space-y-2 text-xs">
                                <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#9E938B]">Status Operasional:</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${display.badgeClass}`}>
                                            {display.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#9E938B]">Tanggal Kalender:</span>
                                        <span className="font-semibold text-white">
                                            {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    {selectedTable.active_session && (
                                        <div className="flex justify-between items-center pt-1 border-t border-[#241F1D]">
                                            <span className="text-[#9E938B]">Kode Sesi Meja:</span>
                                            <span className="font-mono font-bold text-[#D4B886]">
                                                {selectedTable.active_session.session_code} ({selectedTable.active_session.status})
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Active Dine-in Order Information */}
                                {selectedTable.active_order && (
                                    <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-1.5 text-xs text-rose-100 animate-fadeIn">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                                                Pesanan Aktif di Meja Ini:
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-900 text-rose-200 border border-rose-700">
                                                {selectedTable.active_order.order_status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-white">#{selectedTable.active_order.order_code}</span>
                                            <span className="font-bold text-[#D4B886]">Rp {Number(selectedTable.active_order.total).toLocaleString('id-ID')}</span>
                                        </div>
                                        <p className="text-[11px] text-[#E8DFD3]/80">
                                            Pelanggan: <strong className="text-white">{selectedTable.active_order.customer_name}</strong>
                                        </p>
                                    </div>
                                )}

                                {/* Scheduled Reservations for this table */}
                                {tableResList.length > 0 && (
                                    <div className="p-3 rounded-xl bg-[#32151F]/40 border border-[#B99A65]/40 space-y-2">
                                        <span className="text-[10px] uppercase font-bold text-[#D4B886] tracking-wider block">
                                            Jadwal Reservasi Tamu:
                                        </span>
                                        {tableResList.map(r => (
                                            <div key={r.id} className="text-[11px] text-white flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold">{r.customer_name} ({r.guest_count} Pax)</p>
                                                    <p className="text-[10px] text-[#9E938B]">
                                                        {new Date(r.reservation_datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB · {r.experience_name || 'Reguler'}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                                                    {r.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Role Permission Branching */}
                            <div className="pt-2 border-t border-[#241F1D]">
                                {role === 'cashier' ? (
                                    // CASHIER: READ-ONLY NOTICE (cuma bisa liat aja)
                                    <div className="p-3 rounded-xl bg-[#141110] border border-[#241F1D] text-xs text-[#9E938B] flex items-start gap-2.5">
                                        <Lock className="w-4 h-4 text-[#B99A65] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-white">Akses Stasiun Kasir: Hanya-Lihat</p>
                                            <p className="text-[11px] text-[#9E938B] mt-0.5">
                                                Pengubahan status denah meja dan sesi pelanggan dikelola langsung oleh Pramusaji (Waiter) di lantai atau Admin HQ.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    // WAITER & ADMIN: FULL OPERATIONAL ACTIONS
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E938B] block">
                                            Aksi Operasional Meja:
                                        </span>

                                        {/* Validate Occupancy */}
                                        {(selectedTable.status.toLowerCase() === 'pending_validation' || selectedTable.status.toLowerCase() === 'pending validation') && onValidateTable && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onValidateTable(selectedTable.id);
                                                    setSelectedTable(null);
                                                }}
                                                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                                            >
                                                <Check className="w-4 h-4" />
                                                <span>Validasi Tamu Duduk (Occupied)</span>
                                            </button>
                                        )}

                                        {/* Start Cleaning */}
                                        {selectedTable.status.toLowerCase() === 'occupied' && onStartCleaning && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onStartCleaning(selectedTable.id);
                                                    setSelectedTable(null);
                                                }}
                                                className="w-full py-2.5 px-3 rounded-xl bg-[#211D1B] hover:bg-blue-950/60 text-blue-300 border border-blue-900/60 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Tamu Selesai · Mulai Pembersihan Meja</span>
                                            </button>
                                        )}

                                        {/* Finish Cleaning -> Available */}
                                        {selectedTable.status.toLowerCase() === 'cleaning' && onFinishCleaning && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onFinishCleaning(selectedTable.id);
                                                    setSelectedTable(null);
                                                }}
                                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                                            >
                                                <CheckCheck className="w-4 h-4" />
                                                <span>Selesai Bersih · Tandai Meja Kosong (Available)</span>
                                            </button>
                                        )}

                                        {/* If Available */}
                                        {selectedTable.status.toLowerCase() === 'available' && (
                                            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-emerald-300 text-xs text-center font-medium">
                                                Meja bersih dan siap digunakan oleh tamu walk-in atau reservasi.
                                            </div>
                                        )}

                                        {/* Admin direct status selector */}
                                        {role === 'admin' && onUpdateStatus && (
                                            <div className="pt-2">
                                                <label className="text-[10px] font-bold text-[#9E938B] block mb-1 uppercase">
                                                    Ubah Status Manual (Admin Desk):
                                                </label>
                                                <select
                                                    value={selectedTable.status}
                                                    onChange={(e) => {
                                                        onUpdateStatus(selectedTable.id, e.target.value);
                                                        setSelectedTable(null);
                                                    }}
                                                    className="w-full px-3 py-2 rounded-xl bg-[#141110] border border-[#241F1D] text-xs text-white focus:outline-none focus:border-[#B99A65]"
                                                >
                                                    <option value="Available">Available (Kosong)</option>
                                                    <option value="Occupied">Occupied (Terisi)</option>
                                                    <option value="Reserved">Reserved (Reservasi)</option>
                                                    <option value="Cleaning">Cleaning (Pembersihan)</option>
                                                    <option value="Inactive">Inactive (Ditutup)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
