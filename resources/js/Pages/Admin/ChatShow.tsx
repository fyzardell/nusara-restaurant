import { useEffect, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Send, Utensils, Receipt, UserCheck, Shield } from 'lucide-react';
import AdminSidebar from '../../Components/AdminSidebar';
import { User } from '../../types';

interface Message {
    id: number;
    user_id: number;
    message: string;
    is_admin: boolean;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

interface Props {
    customer: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
        role?: string;
    };
    messages: Message[];
    adminUser: User;
}

export default function ChatShow({ customer, messages, adminUser }: Props) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data, setData, post, processing, reset } = useForm({
        message: '',
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Polling auto-refresh setiap 4 detik agar admin langsung melihat pesan pelanggan baru
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['messages'] });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.message.trim() || processing) return;

        post(`/admin/chats/${customer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('message');
                scrollToBottom();
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'waiter':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Utensils className="w-3 h-3" /> Waiter Staff
                    </span>
                );
            case 'cashier':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Receipt className="w-3 h-3" /> Kasir Restoran
                    </span>
                );
            case 'kitchen':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        <Utensils className="w-3 h-3" /> Dapur / Kitchen
                    </span>
                );
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[#B99A65]/20 text-[#D4B886] border border-[#B99A65]/40">
                        <Shield className="w-3 h-3" /> Rekan Admin
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-stone-700/50 text-stone-300 border border-stone-600/30">
                        <UserCheck className="w-3 h-3" /> Pelanggan / Tamu
                    </span>
                );
        }
    };

    const quickReplies = [
        'Baik, segera kami koordinasikan dengan tim operasional.',
        'Meja dan hidangan siap diproses.',
        'Terima kasih laporannya, sudah kami konfirmasi.',
        'Ada pesanan khusus atau alergi yang perlu dicatat?'
    ];

    return (
        <div className="h-screen w-screen bg-[#110F0E] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#110F0E] flex overflow-hidden">
            <Head title={`Chat ${customer.name} — NUSARA Admin`} />
            
            {/* Left Sidebar (App Shell 4 Persistent Sidebar) */}
            <AdminSidebar adminUser={adminUser} activeNav="chats" />

            {/* Main Chat Workspace */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#181413] p-4 sm:p-8 space-y-5">
                <div className="max-w-4xl mx-auto w-full space-y-5">
                    <Link
                        href="/admin/chats"
                        className="inline-flex items-center gap-1.5 text-xs text-[#D4B886] hover:text-[#F4EFE6] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Semua Percakapan</span>
                    </Link>

                    {/* Customer card */}
                    <div className="flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 shadow-2xl">
                        <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-[#D4B886] to-[#987B49] text-[#211D1B] flex items-center justify-center font-heading text-2xl font-bold shadow">
                            {customer.name?.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                {getRoleBadge(customer.role)}
                            </div>

                            <h1 className="font-heading text-2xl sm:text-3xl font-bold leading-tight mt-1 text-white truncate">
                                {customer.name}
                            </h1>

                            <p className="text-xs text-[#F4EFE6]/65 mt-0.5">
                                {messages.length} pesan dalam percakapan · {customer.email || 'Akun Restoran'}
                            </p>
                        </div>
                    </div>

                    {/* Chat Bubble Area */}
                    <div className="rounded-3xl bg-[#211D1B] border border-[#B99A65]/20 p-4 sm:p-6 min-h-[380px] max-h-[520px] overflow-y-auto space-y-3.5 shadow-inner">
                        {messages.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center text-stone-500">
                                <p className="text-sm">Belum ada percakapan dengan pengguna ini.</p>
                                <p className="text-xs text-stone-600 mt-1">Kirim pesan di bawah untuk memulai koordinasi.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isAdmin = msg.is_admin || msg.user?.role === 'admin';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-stone-400 px-1">
                                            <span className="font-medium text-stone-300">
                                                {isAdmin ? 'Anda (Admin)' : (msg.user?.name || customer.name)}
                                            </span>
                                            <span>·</span>
                                            <span>{formatTime(msg.created_at)}</span>
                                        </div>

                                        <div
                                            className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                isAdmin
                                                    ? 'bg-gradient-to-r from-[#B99A65] to-[#D4B886] text-[#211D1B] font-medium rounded-tr-none shadow-md'
                                                    : 'bg-[#181413] text-[#F4EFE6] border border-[#B99A65]/20 rounded-tl-none shadow'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Reply Suggestions */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                        {quickReplies.map((qr, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setData('message', qr)}
                                className="px-3 py-1.5 rounded-full bg-[#211D1B] border border-[#B99A65]/20 hover:border-[#D4B886] text-stone-300 hover:text-white whitespace-nowrap transition-colors"
                            >
                                {qr}
                            </button>
                        ))}
                    </div>

                    {/* Form kirim pesan admin */}
                    <form
                        onSubmit={sendMessage}
                        className="rounded-2xl bg-[#211D1B] border border-[#B99A65]/30 p-3 shadow-xl"
                    >
                        <div className="flex items-end gap-3">
                            <textarea
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ketik balasan koordinasi admin..."
                                rows={2}
                                disabled={processing}
                                className="flex-1 resize-none bg-[#181413] border border-[#B99A65]/20 rounded-xl px-4 py-3 text-sm text-[#F4EFE6] placeholder:text-stone-500 focus:outline-none focus:border-[#B99A65] disabled:opacity-50"
                            />

                            <button
                                type="submit"
                                disabled={processing || !data.message.trim()}
                                className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-[#D4B886] to-[#B99A65] text-[#211D1B] flex items-center justify-center hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex justify-between items-center mt-2 px-1">
                            <span className="text-[10px] text-stone-500">
                                Tekan Enter untuk mengirim · Shift + Enter untuk baris baru
                            </span>

                            {processing && (
                                <span className="text-[10px] text-[#D4B886]">
                                    Mengirim balasan...
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
