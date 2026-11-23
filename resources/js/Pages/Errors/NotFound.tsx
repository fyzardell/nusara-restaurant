import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, UtensilsCrossed, Calendar, Home, MessageSquare, Compass, Sparkles } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#141110] text-[#F4EFE6] font-body flex flex-col justify-between selection:bg-[#B99A65] selection:text-[#32151F] relative overflow-hidden">
            <Head title="404 — Halaman Tidak Ditemukan · NUSARA" />

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#32151F]/40 blur-[140px]" />
                <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-[#B99A65]/15 blur-[160px]" />
                <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-[#211D1B] blur-[120px]" />
            </div>

            {/* Top Navigation Bar Minimalist */}
            <header className="relative z-10 w-full px-6 py-5 border-b border-[#32151F]/50 flex items-center justify-between max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-3 group">
                    <img
                        src="/images/nusara-logo.png"
                        alt="NUSARA"
                        className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
                    />
                </Link>

                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="px-4 py-2 rounded-xl bg-[#211D1B] border border-[#B99A65]/30 text-stone-300 hover:text-white hover:border-[#D4B886] transition-colors text-xs font-semibold flex items-center gap-2"
                    >
                        <Home className="w-3.5 h-3.5 text-[#B99A65]" />
                        <span>Beranda</span>
                    </Link>
                </div>
            </header>

            {/* Main Content Card */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
                <div className="w-full max-w-xl text-center space-y-7 animate-fadeIn">
                    {/* Compass Icon Badge */}
                    <div className="relative inline-flex items-center justify-center">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#32151F] via-[#211D1B] to-[#141110] border-2 border-[#B99A65]/60 flex items-center justify-center shadow-2xl relative">
                            <Compass className="w-12 h-12 text-[#D4B886] animate-[spin_20s_linear_infinite]" />
                            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-tr from-[#B99A65] to-[#D4B886] flex items-center justify-center text-[#211D1B] shadow">
                                <Sparkles className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>

                    {/* Big 404 Headline */}
                    <div className="space-y-3">
                        <h1 className="font-heading text-7xl sm:text-9xl font-black tracking-tight bg-gradient-to-r from-[#B99A65] via-[#F4EFE6] to-[#D4B886] bg-clip-text text-transparent">
                            404
                        </h1>
                        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F4EFE6] tracking-tight">
                            Halaman Tidak Ditemukan
                        </h2>
                        <p className="text-sm sm:text-base text-stone-300 max-w-md mx-auto leading-relaxed">
                            Maaf, hidangan istimewa atau tautan yang Anda tuju telah berpindah atau belum tersedia di perjamuan rasa NUSARA.
                        </p>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                        <Link
                            href="/"
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#B99A65]/20"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Kembali ke Beranda</span>
                        </Link>

                        <Link
                            href="/order"
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#211D1B] border border-[#B99A65]/50 text-[#D4B886] hover:text-white hover:bg-[#32151F] font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            <span>Katalog Menu</span>
                        </Link>
                    </div>

                    {/* Quick Access Links */}
                    <div className="pt-4 border-t border-[#32151F]/40 flex flex-wrap items-center justify-center gap-4 text-xs text-[#9E938B]">
                        <Link href="/reservation" className="hover:text-[#D4B886] flex items-center gap-1.5 transition-colors">
                            <Calendar className="w-3.5 h-3.5 text-[#B99A65]" />
                            <span>Reservasi Meja</span>
                        </Link>
                        <span>·</span>
                        <a 
                            href="https://wa.me/6281299990000?text=Halo%20Concierge%20NUSARA,%20saya%20memerlukan%20bantuan%20navigasi%20di%20situs."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#D4B886] flex items-center gap-1.5 transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5 text-[#B99A65]" />
                            <span>Bantuan Concierge</span>
                        </a>
                    </div>
                </div>
            </main>

            {/* Footer Minimalist */}
            <footer className="relative z-10 py-5 px-6 text-center text-[11px] text-[#F4EFE6]/40 border-t border-[#32151F]/30">
                <p>© {new Date().getFullYear()} NUSARA Indonesian Dining Experience · Senopati Flagship, Jakarta Selatan</p>
            </footer>
        </div>
    );
}
