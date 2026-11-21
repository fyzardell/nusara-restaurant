
import { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Send, UserRound } from 'lucide-react';
import { AdminHeader } from './Dashboard';
import { User } from '@/types';

interface Message {
    id: number;
    sender: 'customer' | 'admin';
    message: string;
    time: string;
}

interface Props {
    customer: {
        id: number;
        name: string;
    };
    messages: Message[];
    adminUser: User;
}

export default function ChatShow({
    customer,
    messages,
    adminUser,
}: Props) {
    const [message, setMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [messages]);

    useEffect(() => {
    const interval = setInterval(() => {
        router.reload({
            only: ['messages'],
        });
    }, 5000);

    return () => clearInterval(interval);
}, []);

    const sendMessage = async () => {
        if (!message.trim() || processing) return;

        setProcessing(true);

        try {
            const response = await fetch(
                `/admin/chats/${customer.id}/send`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]'
                            )?.content ?? '',
                    },
                    body: JSON.stringify({
                        message: message,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Gagal mengirim pesan');
            }

            setMessage('');

            router.reload({
                only: ['messages'],
            });
        } catch (error) {
            alert('Pesan gagal dikirim.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title={`Chat - ${customer.name}`} />

            <div className="min-h-screen bg-black text-white">
                <AdminHeader adminUser={adminUser} />

                <div className="mx-auto max-w-6xl px-4 py-6">
                    <div className="overflow-hidden rounded-2xl border border-gray-800 bg-[#121212] shadow-xl">

                        {/* Header Chat */}
                        <div className="flex items-center gap-4 border-b border-gray-800 bg-[#181818] px-5 py-4">

                            <Link
                                href="/admin/chats"
                                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                            >
                                <ArrowLeft size={22} />
                            </Link>

                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#32151F] text-[#D4B886]">
                                <UserRound size={22} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-white">
                                    {customer.name}
                                </h2>

                                <p className="text-xs text-gray-500">
                                    Customer NUSARA
                                </p>
                            </div>
                        </div>

                        {/* Area Pesan */}
                        <div className="flex h-[65vh] flex-col gap-4 overflow-y-auto bg-black px-5 py-6">

                            {messages.map((msg) => {
                                const isAdmin =
                                    msg.sender === 'admin';

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${
                                            isAdmin
                                                ? 'justify-end'
                                                : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                                isAdmin
                                                    ? 'rounded-br-md bg-[#32151F] text-white'
                                                    : 'rounded-bl-md bg-[#292929] text-white'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words text-sm">
                                                {msg.message}
                                            </p>

                                            <p
                                                className={`mt-2 text-right text-[10px] ${
                                                    isAdmin
                                                        ? 'text-[#D4B886]'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {msg.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Pesan */}
                        <div className="border-t border-gray-800 bg-[#181818] p-4">
                            <div className="flex items-end gap-3">

                                <textarea
                                    value={message}
                                    onChange={(e) =>
                                        setMessage(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' &&
                                            !e.shiftKey
                                        ) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Ketik pesan..."
                                    rows={1}
                                    className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-700 bg-[#252525] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4B886]"
                                />

                                <button
                                    onClick={sendMessage}
                                    disabled={
                                        processing ||
                                        !message.trim()
                                    }
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4B886] text-[#32151F] transition hover:bg-[#B99A65] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Send size={18} />
                                </button>
                            </div>

                            <p className="mt-2 text-xs text-gray-600">
                                Enter untuk mengirim · Shift + Enter untuk baris baru
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
