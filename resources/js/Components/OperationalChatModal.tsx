import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { 
    Send, 
    X, 
    MessageSquare, 
    Sparkles, 
    Check, 
    CheckCheck,
    Clock,
    Shield,
    Users,
    UtensilsCrossed,
    Store,
    HelpCircle
} from 'lucide-react';

export interface ChatMessageItem {
    id: number;
    sender_type?: string;
    sender?: string;
    message: string;
    created_at?: string;
    time?: string;
    is_read?: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    role: 'waiter' | 'cashier' | 'customer';
    userName: string;
    messages?: ChatMessageItem[];
    onMessageSent?: () => void;
}

export default function OperationalChatModal({
    isOpen,
    onClose,
    role,
    userName,
    messages = [],
    onMessageSent
}: Props) {
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            // Mark messages as read
            fetch('/chat/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                }
            }).catch(() => {});
        }
    }, [isOpen, messages.length]);

    // Periodically refresh messages when open
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            router.reload({ only: ['chatMessages', 'unreadChatCount'] });
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const msg = inputMessage.trim();
        if (!msg || isSending) return;

        setIsSending(true);
        router.post('/chat/send', {
            message: msg
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setInputMessage('');
                setIsSending(false);
                scrollToBottom();
                if (onMessageSent) onMessageSent();
            },
            onError: () => {
                setIsSending(false);
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const quickTemplates = {
        waiter: [
            'Meja 03 konfirmasi tamu hadir & duduk',
            'Sajian Meja 05 telah berhasil diantar',
            'Meja 08 selesai makan & siap dibersihkan'
        ],
        cashier: [
            'Tamu konfirmasi pembayaran tunai',
            'Permintaan pembatalan pesanan untuk ACC Admin',
            'Tamu reservasi VIP telah tiba di stasiun'
        ],
        customer: [
            'Berapa lama estimasi pesanan saya disajikan?',
            'Bisa minta sambal dan sendok tambahan ke meja?',
            'Rekomendasi hidangan penutup yang khas hari ini'
        ]
    };

    const roleTitle = {
        waiter: 'Koordinasi Pramusaji & Admin HQ',
        cashier: 'Koordinasi Stasiun Kasir & Admin HQ',
        customer: 'Konsierge & Bantuan Admin NUSARA'
    };

    const roleIcon = {
        waiter: UtensilsCrossed,
        cashier: Store,
        customer: Sparkles
    };

    const HeaderIcon = roleIcon[role];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#161312] border border-[#241F1D] rounded-3xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-[#241F1D] bg-[#141110] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] flex items-center justify-center flex-shrink-0 shadow">
                            <HeaderIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-heading font-bold text-sm text-white truncate">
                                {roleTitle[role]}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#B99A65]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Admin Executive Siaga</span>
                                <span className="text-[#665C54]">·</span>
                                <span className="text-stone-300 truncate">{userName}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-[#9E938B] hover:text-white hover:bg-[#241F1D] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none bg-[#110F0E]">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#9E938B] space-y-2">
                            <MessageSquare className="w-10 h-10 text-[#B99A65]/40 mb-1" />
                            <p className="font-semibold text-white">Saluran Koordinasi Langsung</p>
                            <p className="max-w-xs text-[11px] leading-relaxed">
                                Kirim pesan atau koordinasi terkait pesanan, status meja, dan tamu kepada Admin Executive.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const senderType = msg.sender_type || msg.sender;
                            const isAdmin = senderType === 'admin';

                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                                >
                                    <span className="text-[9px] text-[#665C54] mb-1 px-1 font-mono">
                                        {isAdmin ? 'Admin Executive' : userName}
                                    </span>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-xs shadow-md leading-relaxed ${
                                            isAdmin
                                                ? 'bg-[#1E1A18] border border-[#2D2622] text-[#F4EFE6] rounded-tl-sm'
                                                : 'bg-gradient-to-r from-[#32151F] to-[#261017] border border-[#B99A65]/40 text-[#F4EFE6] rounded-tr-sm'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                        <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] font-mono ${isAdmin ? 'text-[#9E938B]' : 'text-[#D4B886]'}`}>
                                            <span>
                                                {msg.time || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '')}
                                            </span>
                                            {!isAdmin && <CheckCheck className="w-3 h-3 text-[#D4B886]" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Templates Bar */}
                <div className="px-3 py-2 border-t border-[#241F1D] bg-[#141110] flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
                    <span className="text-[10px] text-[#665C54] font-bold uppercase tracking-wider shrink-0 mr-1">
                        Cepat:
                    </span>
                    {quickTemplates[role].map((tmpl, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setInputMessage(tmpl)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#1E1A18] hover:bg-[#2A2421] text-[#9E938B] hover:text-[#F4EFE6] border border-[#2D2622] transition-colors whitespace-nowrap"
                        >
                            {tmpl}
                        </button>
                    ))}
                </div>

                {/* Input Footer */}
                <form onSubmit={handleSubmit} className="p-3 border-t border-[#241F1D] bg-[#161312] flex items-center gap-2 flex-shrink-0">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan koordinasi..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#110F0E] border border-[#241F1D] text-xs text-[#F4EFE6] placeholder-[#665C54] focus:outline-none focus:border-[#B99A65]"
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim() || isSending}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B99A65] to-[#D4B886] hover:brightness-110 text-[#110F0E] font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 shadow"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kirim</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
