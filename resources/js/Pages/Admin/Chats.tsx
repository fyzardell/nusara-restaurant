// resources/js/Pages/Admin/Chats.tsx
import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, ChevronRight, MessageSquare, Users, Sparkles } from 'lucide-react';
import { AdminHeader } from './Dashboard';
import { User } from '../../types';

interface Conversation {
    id: number;
    name: string;
    total: number;
    last_message: string;
    last_at: string;
}

interface Props {
    conversations: Conversation[];
    filters: { q: string | null };
    adminUser: User;
}

export default function Chats({ conversations, filters, adminUser }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');

    const totalMessages = useMemo(
        () => conversations.reduce((sum, c) => sum + c.total, 0),
        [conversations]
    );

    // Admin menerima chat baru: refresh daftar tiap 5 detik
    useEffect(() => {
        const t = setInterval(() => {
            router.reload({ only: ['conversations'] });
        }, 5000);
        return () => clearInterval(t);
    }, []);

    const search = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/chats', { q }, { preserveState: true, replace: true });
    };

    return (
        <div className="min-h-screen bg-[#181413] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title="Riwayat Chat — NUSARA Admin" />
            <AdminHeader adminUser={adminUser} active="chats" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886]">
                            Konsierge NUSARA
                        </span>
                        <h1 className="font-heading text-3xl sm:text-4xl font-bold mt-1">Riwayat Chat Customer</h1>
                        <p className="text-xs sm:text-sm text-[#F4EFE6]/75 mt-1 max-w-xl">
                            Pantau seluruh percakapan tamu dengan konsierge restoran. Daftar diperbarui otomatis setiap 5 detik.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="px-5 py-3 rounded-2xl bg-[#12100F]/60 border border-[#B99A65]/30 min-w-[130px]">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                <Users className="w-3.5 h-3.5" />
                                <span>Percakapan</span>
                            </div>
                            <div className="font-mono text-2xl font-bold mt-1">{conversations.length}</div>
                        </div>
                        <div className="px-5 py-3 rounded-2xl bg-[#12100F]/60 border border-[#B99A65]/30 min-w-[130px]">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#B99A65] font-semibold">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Total Pesan</span>
                            </div>
                            <div className="font-mono text-2xl font-bold mt-1 text-[#D4B886]">{totalMessages}</div>
                        </div>
                    </div>
                </div>

                {/* Search (compact) */}
                <form onSubmit={search} className="flex items-center gap-2 w-full max-w-sm">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-[#B99A65] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari nama customer..."
                            className="w-full pl-10 pr-3 py-2 rounded-xl bg-[#211D1B] border border-[#B99A65]/40 text-xs text-[#F4EFE6] placeholder-[#F4EFE6]/40 focus:outline-none focus:border-[#D4B886]"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#B99A65] text-[#211D1B] text-xs font-bold hover:bg-[#D4B886] transition-colors"
                    >
                        Cari
                    </button>
                </form>

                {/* List */}
                {conversations.length === 0 ? (
                    <div className="rounded-3xl bg-[#211D1B] border border-dashed border-[#B99A65]/30 py-16 px-6 text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#32151F] text-[#D4B886] flex items-center justify-center">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <p className="font-heading text-xl font-bold mt-4">Belum ada percakapan</p>
                        <p className="text-xs text-[#F4EFE6]/60 mt-1">
                            Chat dari customer akan muncul di sini begitu mereka mengirim pesan.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {conversations.map((cv) => (
                            <Link
                                key={cv.id}
                                href={`/admin/chats/${cv.id}`}
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-[#211D1B] border border-[#B99A65]/25 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#D4B886] hover:bg-[#32151F]/50"
                            >
                                <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#D4B886] to-[#987B49] text-[#211D1B] flex items-center justify-center font-heading text-xl font-bold shadow">
                                    {cv.name?.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-sm truncate">{cv.name}</span>
                                        <span className="text-[10px] text-stone-400 shrink-0">{cv.last_at}</span>
                                    </div>
                                    <div className="flex items-start gap-1.5 mt-1 text-xs text-[#F4EFE6]/65">
                                        <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-[#B99A65]" />
                                        <p className="line-clamp-2">{cv.last_message}</p>
                                    </div>
                                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[#32151F] border border-[#B99A65]/30 text-[10px] font-bold text-[#D4B886]">
                                        {cv.total} pesan
                                    </span>
                                </div>

                                <ChevronRight className="w-4 h-4 shrink-0 text-[#B99A65] transition-transform group-hover:translate-x-1" />
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}