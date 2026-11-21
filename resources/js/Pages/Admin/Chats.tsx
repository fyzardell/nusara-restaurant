// resources/js/Pages/Admin/Chats.tsx
import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, ChevronRight, MessageSquare, Users, Sparkles, Bell, Shield, UserCheck, Utensils, Receipt } from 'lucide-react';
import { AdminHeader } from './Dashboard';
import { User } from '../../types';

interface Conversation {
    id: number;
    name: string;
    email: string;
    role?: string;
    total: number;
    unread?: number;
    last_message: string;
    last_at: string;
}

interface Props {
    conversations: Conversation[];
    filters: { q: string | null; role: string | null };
    adminUser: User;
}

export default function Chats({ conversations, filters, adminUser }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const currentRole = filters?.role ?? 'all';

    const totalMessages = useMemo(
        () => conversations.reduce((sum, c) => sum + c.total, 0),
        [conversations]
    );

    const totalUnread = useMemo(
        () => conversations.reduce((sum, c) => sum + (c.unread ?? 0), 0),
        [conversations]
    );

    // Refresh daftar tiap 5 detik
    useEffect(() => {
        const t = setInterval(() => {
            router.reload({ only: ['conversations'] });
        }, 5000);
        return () => clearInterval(t);
    }, []);

    const search = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/chats', { q, role: currentRole }, { preserveState: true, replace: true });
    };

    const handleFilterRole = (role: string) => {
        router.get('/admin/chats', { q, role }, { preserveState: true, replace: true });
    };

    const getRoleBadge = (roleName?: string) => {
        switch (roleName) {
            case 'waiter':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                        <Utensils className="w-2.5 h-2.5" />
                        Pramusaji (Waiter)
                    </span>
                );
            case 'cashier':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/40 text-[10px] font-bold text-sky-300">
                        <Receipt className="w-2.5 h-2.5" />
                        Staf Kasir (Cashier)
                    </span>
                );
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-[10px] font-bold text-rose-300">
                        <Shield className="w-2.5 h-2.5" />
                        Admin Eksekutif
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/40 text-[10px] font-bold text-[#D4B886]">
                        <UserCheck className="w-2.5 h-2.5" />
                        Pelanggan / Order
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#181413] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Koordinasi & Riwayat Chat — NUSARA Admin" />
            <AdminHeader 
                adminUser={adminUser} 
                active="chats" 
                metrics={{ activeOrders: 0, pendingReservations: 0, unreadChatCount: totalUnread }} 
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#161312] border border-[#B99A65]/40 text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886]">
                                Pusat Komunikasi Operasional
                            </span>
                            {totalUnread > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold animate-pulse">
                                    <Bell className="w-3 h-3" />
                                    {totalUnread} Pesan Baru
                                </span>
                            )}
                        </div>
                        <h1 className="font-heading text-3xl sm:text-4xl font-bold mt-2">Koordinasi Chat Restoran</h1>
                        <p className="text-xs sm:text-sm text-[#F4EFE6]/75 mt-1 max-w-xl">
                            Komunikasi langsung antara Admin, Pelanggan (Order App), Tim Pramusaji (Waiter), dan Staf Kasir (Cashier).
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="px-5 py-3 rounded-2xl bg-[#12100F]/60 border border-[#B99A65]/30 min-w-[120px]">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                <Users className="w-3.5 h-3.5" />
                                <span>Kontak</span>
                            </div>
                            <div className="font-mono text-2xl font-bold mt-1">{conversations.length}</div>
                        </div>
                        <div className="px-5 py-3 rounded-2xl bg-[#12100F]/60 border border-[#B99A65]/30 min-w-[120px]">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                <Bell className="w-3.5 h-3.5" />
                                <span>Belum Dibaca</span>
                            </div>
                            <div className={`font-mono text-2xl font-bold mt-1 ${totalUnread > 0 ? 'text-rose-400' : 'text-stone-400'}`}>
                                {totalUnread}
                            </div>
                        </div>
                        <div className="px-5 py-3 rounded-2xl bg-[#12100F]/60 border border-[#B99A65]/30 min-w-[120px]">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Total Pesan</span>
                            </div>
                            <div className="font-mono text-2xl font-bold mt-1 text-[#D4B886]">{totalMessages}</div>
                        </div>
                    </div>
                </div>

                {/* Filter Roles & Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Role Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleFilterRole('all')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                currentRole === 'all'
                                    ? 'bg-[#D4B886] text-[#211D1B] shadow-md'
                                    : 'bg-[#211D1B] text-[#9E938B] hover:text-[#F4EFE6] border border-[#342D2A]'
                            }`}
                        >
                            Semua Kontak
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterRole('customer')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                currentRole === 'customer'
                                    ? 'bg-[#32151F] text-[#D4B886] border border-[#B99A65] shadow-md'
                                    : 'bg-[#211D1B] text-[#9E938B] hover:text-[#F4EFE6] border border-[#342D2A]'
                            }`}
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                            Pelanggan / Order
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterRole('waiter')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                currentRole === 'waiter'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500 shadow-md'
                                    : 'bg-[#211D1B] text-[#9E938B] hover:text-[#F4EFE6] border border-[#342D2A]'
                            }`}
                        >
                            <Utensils className="w-3.5 h-3.5" />
                            Pramusaji (Waiter)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterRole('cashier')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                currentRole === 'cashier'
                                    ? 'bg-sky-950/80 text-sky-300 border border-sky-500 shadow-md'
                                    : 'bg-[#211D1B] text-[#9E938B] hover:text-[#F4EFE6] border border-[#342D2A]'
                            }`}
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            Staf Kasir (Cashier)
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={search} className="flex items-center gap-2 w-full md:w-80">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-[#B99A65] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari nama atau email..."
                                className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#211D1B] border border-[#342D2A] text-xs text-[#F4EFE6] placeholder-[#9E938B] focus:outline-none focus:border-[#D4B886]"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-[#B99A65] text-[#211D1B] text-xs font-bold hover:bg-[#D4B886] transition-colors"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                {/* Conversation List */}
                {conversations.length === 0 ? (
                    <div className="rounded-3xl bg-[#211D1B] border border-dashed border-[#B99A65]/30 py-16 px-6 text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#32151F] text-[#D4B886] flex items-center justify-center">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <p className="font-heading text-xl font-bold mt-4">Belum ada percakapan</p>
                        <p className="text-xs text-[#F4EFE6]/60 mt-1">
                            Pesan dari pelanggan, waiter, atau kasir akan muncul di sini secara otomatis.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {conversations.map((cv) => {
                            const hasUnread = (cv.unread ?? 0) > 0;
                            return (
                                <Link
                                    key={cv.id}
                                    href={`/admin/chats/${cv.id}`}
                                    className={`group flex items-center gap-4 p-4 rounded-2xl border shadow-lg transition-all hover:-translate-y-0.5 ${
                                        hasUnread
                                            ? 'bg-[#241718] border-rose-500/50 hover:border-rose-400 hover:bg-[#2e191b]'
                                            : 'bg-[#211D1B] border-[#B99A65]/25 hover:border-[#D4B886] hover:bg-[#32151F]/40'
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#D4B886] to-[#987B49] text-[#211D1B] flex items-center justify-center font-heading text-xl font-bold shadow">
                                            {cv.name?.charAt(0).toUpperCase()}
                                        </div>
                                        {hasUnread && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-[#181413] flex items-center justify-center text-[9px] font-bold text-white">
                                                {cv.unread}
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-bold text-sm text-white truncate">{cv.name}</span>
                                                {getRoleBadge(cv.role)}
                                            </div>
                                            <span className="text-[10px] text-stone-400 shrink-0 font-mono">{cv.last_at}</span>
                                        </div>

                                        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-[#F4EFE6]/70">
                                            <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-[#B99A65]" />
                                            <p className="line-clamp-1">{cv.last_message}</p>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 rounded-full bg-[#161312] border border-[#B99A65]/30 text-[10px] font-mono font-bold text-[#D4B886]">
                                                {cv.total} total pesan
                                            </span>
                                            {hasUnread && (
                                                <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-[10px] font-bold text-rose-300 animate-pulse">
                                                    {cv.unread} pesan baru
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 shrink-0 text-[#B99A65] transition-transform group-hover:translate-x-1" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
