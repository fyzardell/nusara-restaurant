
import { useEffect, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Sparkles, Send } from 'lucide-react';
import { AdminHeader } from './Dashboard';
import { User } from '../../types';

interface Message {
    id: number;
    sender: 'customer' | 'admin';
    message: string;
    time: string;
}

interface Props {
    customer: { id: number; name: string };
    messages: Message[];
    adminUser: User;
}

export default function ChatShow({ customer, messages, adminUser }: Props) {
    const boxRef = useRef<HTMLDivElement>(null);

    const { data, setData, post, processing, reset } = useForm({
        message: '',
    });

    // Scroll ke pesan terbaru
    useEffect(() => {
        const el = boxRef.current;
        if (el) {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages.length]);

    // Refresh pesan setiap 5 detik
    useEffect(() => {
        const t = setInterval(() => {
            router.reload({ only: ['messages'] });
        }, 5000);

        return () => clearInterval(t);
    }, []);

    // Kirim pesan admin
    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.message.trim() || processing) return;

        post(`/admin/chats/${customer.id}/send`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('message');
            },
        });
    };

    // Enter untuk kirim, Shift + Enter untuk baris baru
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            if (!processing && data.message.trim()) {
                post(`/admin/chats/${customer.id}/send`, {
                    preserveScroll: true,
                    onSuccess: () => reset('message'),
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#181413] text-[#F4EFE6] font-dashboard selection:bg-[#B99A65] selection:text-[#32151F]">
            <Head title={`Chat ${customer.name} — NUSARA Admin`} />
            <AdminHeader adminUser={adminUser} active="chats" />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
                <Link
                    href="/admin/chats"
                    className="inline-flex items-center gap-1.5 text-xs text-[#D4B886] hover:text-[#F4EFE6] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Semua Percakapan</span>
                </Link>

                {/* Customer card */}
                <div className="flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#32151F] via-[#211D1B] to-[#32151F] border border-[#B99A65]/40 shadow-2xl">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-[#D4B886] to-[#987B49] text-[#211D1B] flex items-center justify-center font-heading text-2xl font-bold shadow">
                        {customer.name?.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886]">
                            Customer
                        </span>

                        <h1 className="font-heading text-2xl sm:text-3xl font-bold leading-tight">
                            {customer.name}
                        </h1>

                        <p className="text-xs text-[#F4EFE6]/65">
                            {messages.length} pesan dalam percakapan ini
                        </p>
                    </div>
                </div>

                {/* Chat area */}
                <div
                    ref={boxRef}
                    className="flex max-h-[60vh] min-h-[300px] flex-col gap-4 overflow-y-auto rounded-3xl bg-[#211D1B] border border-[#B99A65]/30 p-5 sm:p-6 shadow-2xl"
                >
                    {messages.length === 0 && (
                        <div className="p-10 text-center text-xs text-stone-500">
                            Belum ada pesan.
                        </div>
                    )}

                    {messages.map((m) => {
                        const isCustomer = m.sender === 'customer';

                        return (
                            <div
                                key={m.id}
                                className={`flex items-end gap-2.5 ${
                                    isCustomer ? 'flex-row-reverse' : 'flex-row'
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                                        isCustomer
                                            ? 'bg-gradient-to-br from-[#D4B886] to-[#987B49] text-[#211D1B]'
                                            : 'bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886]'
                                    }`}
                                >
                                    {isCustomer ? (
                                        customer.name?.charAt(0).toUpperCase()
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                </div>

                                <div
                                    className={`max-w-[75%] ${
                                        isCustomer ? 'items-end' : 'items-start'
                                    } flex flex-col`}
                                >
                                    <span className="mb-1 text-[10px] text-stone-400">
                                        {isCustomer
                                            ? customer.name
                                            : 'Admin NUSARA'}{' '}
                                        · {m.time}
                                    </span>

                                    <div
                                        className={`px-4 py-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap shadow ${
                                            isCustomer
                                                ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-[#D4B886] to-[#B99A65] text-[#211D1B] font-medium'
                                                : 'rounded-2xl rounded-bl-md bg-[#32151F] border border-[#B99A65]/25 text-[#F4EFE6]'
                                        }`}
                                    >
                                        {m.message}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                            placeholder="Ketik pesan kepada customer..."
                            rows={2}
                            disabled={processing}
                            className="flex-1 resize-none bg-[#181413] border border-[#B99A65]/20 rounded-xl px-4 py-3 text-sm text-[#F4EFE6] placeholder:text-stone-500 focus:outline-none focus:border-[#B99A65] disabled:opacity-50"
                        />

                        <button
                            type="submit"
                            disabled={processing || !data.message.trim()}
                            className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-[#D4B886] to-[#B99A65] text-[#211D1B] flex items-center justify-center hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex justify-between items-center mt-2 px-1">
                        <span className="text-[10px] text-stone-500">
                            Enter untuk mengirim · Shift + Enter untuk baris baru
                        </span>

                        {processing && (
                            <span className="text-[10px] text-[#D4B886]">
                                Mengirim pesan...
                            </span>
                        )}
                    </div>
                </form>
            </main>
        </div>
);
}
