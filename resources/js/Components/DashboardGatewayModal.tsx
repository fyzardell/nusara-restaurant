import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    ShoppingBag, 
    ShieldCheck, 
    Compass, 
    X, 
    Sparkles, 
    MessageSquare, 
    Heart, 
    Star, 
    ArrowRight,
    QrCode
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function DashboardGatewayModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div 
                className="relative w-full max-w-2xl bg-[#211D1B] text-[#F4EFE6] border border-[#B99A65]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full bg-[#32151F] text-[#F4EFE6]/70 hover:text-[#D4B886] hover:bg-[#32151F]/80 transition-colors"
                    aria-label="Tutup"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center space-y-3 pt-2">
                    <div className="flex justify-center">
                        <img 
                            src="/images/nusara-logo.png" 
                            alt="NUSARA — Nusantara & Rasa" 
                            className="h-9 sm:h-11 w-auto object-contain drop-shadow" 
                        />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#32151F]/90 border border-[#B99A65]/40 text-[#D4B886] text-[11px] font-semibold uppercase tracking-[0.2em]">
                        <Sparkles className="w-3.5 h-3.5 text-[#B99A65]" />
                        <span>Harmoni Telah Siap Dinikmati</span>
                    </div>

                    <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#F4EFE6]">
                        Selamat Datang di <span className="text-[#D4B886]">NUSARA</span>
                    </h2>

                    <p className="text-xs sm:text-sm text-[#F4EFE6]/75 max-w-md mx-auto">
                        Silakan pilih dashboard tujuan Anda untuk melanjutkan pengalaman gastronomi Nusantara kontemporer:
                    </p>
                </div>

                {/* Destination Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Card 1: Customer Ordering Dashboard */}
                    <div className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#32151F]/90 to-[#211D1B] border border-[#B99A65]/40 hover:border-[#D4B886] transition-all shadow-xl hover:shadow-[#B99A65]/20 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-[#B99A65]/20 border border-[#B99A65]/50 flex items-center justify-center text-[#D4B886]">
                                <ShoppingBag className="w-6 h-6" />
                            </div>

                            <div>
                                <span className="text-[10px] uppercase font-bold text-[#D4B886] tracking-wider block">
                                    Untuk Pelanggan & Tamu
                                </span>
                                <h3 className="font-heading text-lg font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                    Dashboard Pemesanan
                                </h3>
                            </div>

                            <p className="text-xs text-[#F4EFE6]/75 leading-relaxed">
                                Pengalaman pesan cepat modern (ala Kopi Kenangan): Pilih menu, catatan khusus chef, keranjang belanja, live chat concierge, dan ulasan bintang 5.
                            </p>

                            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] text-[#D4B886]">
                                <span className="px-2 py-0.5 rounded-full bg-[#B99A65]/10 border border-[#B99A65]/20 flex items-center gap-1">
                                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> Favorit
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-[#B99A65]/10 border border-[#B99A65]/20 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-amber-400" /> Live Chat
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-[#B99A65]/10 border border-[#B99A65]/20 flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-300 fill-amber-300" /> Rating
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/order"
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <span>Buka Dashboard Pemesanan</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Card 2: Operations / Admin Dashboard */}
                    <div className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#211D1B] to-[#171312] border border-stone-700 hover:border-[#B99A65]/60 transition-all shadow-xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-600 flex items-center justify-center text-[#D4B886]">
                                <ShieldCheck className="w-6 h-6" />
                            </div>

                            <div>
                                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                                    Manajemen & Staf (1 Cabang)
                                </span>
                                <h3 className="font-heading text-lg font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                    Dashboard Operasional Admin
                                </h3>
                            </div>

                            <p className="text-xs text-[#F4EFE6]/75 leading-relaxed">
                                Panel kontrol restoran Senopati: Tracking pesanan real-time (KDS), kontrol status sesi meja QR, pantau ketersediaan stok menu, dan status reservasi.
                            </p>

                            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] text-stone-300">
                                <span className="px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 flex items-center gap-1">
                                    <QrCode className="w-3 h-3 text-emerald-400" /> Tracking Meja
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-[#D4B886]" /> Dapur Live
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/admin"
                            className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#F4EFE6] border border-stone-600 hover:border-[#B99A65] font-semibold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <span>Buka Dashboard Admin</span>
                            <ArrowRight className="w-4 h-4 text-[#D4B886]" />
                        </Link>
                    </div>
                </div>

                {/* Option 3: Continue to Landing Page */}
                <div className="pt-2 text-center border-t border-[#32151F]">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 text-xs text-[#F4EFE6]/70 hover:text-[#D4B886] transition-colors py-1 px-3"
                    >
                        <Compass className="w-4 h-4" />
                        <span>Atau tetap jelajahi Beranda (Landing Page) & Cerita Kuliner</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
