import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { User } from '../types';
import { 
    PanelRight, 
    PanelRightClose, 
    X, 
    User as UserIcon, 
    LogOut, 
    Calendar, 
    QrCode, 
    ShoppingBag, 
    Sparkles, 
    PhoneCall,
    ShieldCheck,
    Utensils,
    BookOpen,
    MapPin,
    Clock,
    ArrowRight,
    Star,
    MessageSquare,
    Heart,
    ChevronRight,
    Compass
} from 'lucide-react';

interface Props {
    onOpenReservation?: () => void;
    onOpenOrderType?: () => void;
    onReplaySplash?: () => void;
}

export default function Navbar({ onOpenReservation, onOpenOrderType, onReplaySplash }: Props) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const [scrolled, setScrolled] = useState(false);
    const [sidePanelOpen, setSidePanelOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 30) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Listen to Escape key to close side panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && sidePanelOpen) {
                setSidePanelOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sidePanelOpen]);

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/logout');
    };

    const handleNavClick = (href: string) => {
        setSidePanelOpen(false);
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            {/* ========================================================
                MAIN HEADER (Ultra-clean: Logo, Pilih Menu, Reservasi, Log In, Side Panel)
            ======================================================== */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
                <nav 
                    className={`transition-all duration-300 ${
                        scrolled 
                            ? 'bg-[#1E1A18]/95 backdrop-blur-md shadow-2xl py-3 border-b border-[#B99A65]/20' 
                            : 'bg-gradient-to-b from-[#1E1A18]/95 via-[#1E1A18]/80 to-transparent py-4'
                    }`}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            {/* Logo NUSARA */}
                            <Link href="/" className="group flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border border-[#B99A65]/60 bg-[#171312] flex items-center justify-center text-[#D4B886] shadow-inner group-hover:border-[#B99A65] transition-colors">
                                    <span className="font-heading text-2xl font-bold tracking-tighter">N</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-heading text-2xl md:text-3xl font-bold tracking-widest text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors leading-none">
                                        NUSARA
                                    </span>
                                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#B99A65] mt-1 font-medium">
                                        Indonesian Dining
                                    </span>
                                </div>
                            </Link>

                            {/* Header Buttons: Hanya 4 tombol rapi sesuai instruksi:
                                1. Pilih Menu
                                2. Reservasi
                                3. Log In (atau nama user)
                                4. Button Side Panel (ala Chrome)
                            */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* 1. Tombol Pilih Menu */}
                                <a
                                    href="#menu"
                                    className="px-3 sm:px-4 py-2 text-xs font-semibold tracking-wider text-[#F4EFE6] border border-[#B99A65]/40 rounded-full hover:bg-[#B99A65]/15 hover:border-[#D4B886] transition-all flex items-center gap-1.5"
                                >
                                    <Utensils className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span>Pilih Menu</span>
                                </a>

                                {/* 2. Tombol Reservasi */}
                                <button
                                    onClick={onOpenReservation}
                                    className="px-3.5 sm:px-5 py-2 text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Reservasi</span>
                                </button>

                                {/* 3. Tombol Log In */}
                                {auth?.user ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171312] border border-[#B99A65]/50 text-[#F4EFE6] text-xs font-medium hover:border-[#D4B886] transition-colors"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[#32151F] text-[#D4B886] flex items-center justify-center font-bold text-xs">
                                                {auth.user.name.charAt(0)}
                                            </div>
                                            <span className="hidden md:inline max-w-[90px] truncate">{auth.user.name}</span>
                                            <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-[#B99A65]/20 text-[#D4B886]">
                                                {auth.user.role}
                                            </span>
                                        </button>

                                        {userDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-56 bg-[#211D1B] border border-[#B99A65]/40 rounded-xl shadow-2xl py-2 z-50 text-xs">
                                                <div className="px-4 py-2 border-b border-[#32151F]">
                                                    <p className="font-bold text-[#F4EFE6] truncate">{auth.user.name}</p>
                                                    <p className="text-[11px] text-[#B99A65] truncate">{auth.user.email}</p>
                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        <span className="uppercase tracking-wider">Role: {auth.user.role}</span>
                                                    </div>
                                                </div>
                                                <Link
                                                    href="/order"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="block px-4 py-2 text-[#F4EFE6] hover:bg-[#32151F] transition-colors"
                                                >
                                                    Dashboard Pemesanan
                                                </Link>
                                                {auth.user.role === 'admin' && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="block px-4 py-2 text-[#D4B886] hover:bg-[#32151F] transition-colors font-semibold"
                                                    >
                                                        Dashboard Admin
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors border-t border-[#32151F] mt-1"
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
                                        className="px-3 sm:px-4 py-2 text-xs font-semibold tracking-wider text-[#F4EFE6] hover:text-[#D4B886] border border-stone-700 rounded-full hover:border-[#B99A65]/50 transition-colors flex items-center gap-1.5"
                                    >
                                        <UserIcon className="w-3.5 h-3.5 text-[#B99A65]" />
                                        <span>Log In</span>
                                    </Link>
                                )}

                                {/* 4. Button Side Panel (Kaya di Chrome) */}
                                <button
                                    onClick={() => setSidePanelOpen(true)}
                                    className={`px-3 py-2 rounded-full border transition-all flex items-center gap-1.5 shadow-md ${
                                        sidePanelOpen 
                                            ? 'bg-[#B99A65] text-[#211D1B] border-[#B99A65]' 
                                            : 'bg-[#32151F] text-[#D4B886] border-[#B99A65]/50 hover:bg-[#B99A65]/20 hover:border-[#D4B886]'
                                    }`}
                                    title="Buka Side Panel Menu"
                                    aria-label="Buka Side Panel"
                                >
                                    <PanelRight className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-semibold tracking-wider">Side Panel</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            {/* ========================================================
                SIDE PANEL (Chrome-style sliding drawer from right)
            ======================================================== */}
            {/* Backdrop Blur Overlay */}
            {sidePanelOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990] transition-opacity duration-300 animate-in fade-in"
                    onClick={() => setSidePanelOpen(false)}
                />
            )}

            {/* Side Panel Drawer */}
            <aside 
                className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-[#1A1615] border-l border-[#B99A65]/30 z-[9995] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${
                    sidePanelOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                aria-label="Side Panel Menu"
            >
                {/* 1. Side Panel Header (Kaya di Chrome) */}
                <div className="p-4 sm:p-5 border-b border-[#32151F] flex items-center justify-between bg-[#151211]">
                    <div className="flex items-center gap-2 text-[#D4B886]">
                        <PanelRightClose className="w-5 h-5 text-[#B99A65]" />
                        <span className="font-heading text-lg font-bold tracking-wider text-[#F4EFE6]">
                            NUSARA <span className="text-[#D4B886] font-normal text-sm">Side Panel</span>
                        </span>
                    </div>

                    <button
                        onClick={() => setSidePanelOpen(false)}
                        className="p-1.5 rounded-full bg-[#211D1B] text-[#F4EFE6]/70 hover:text-[#D4B886] hover:bg-[#32151F] transition-colors border border-stone-800"
                        title="Tutup Side Panel (Esc)"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Side Panel Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                    {/* A. Pusat Dashboard (Jalur Utama) */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886]">
                                Pusat Dashboard
                            </span>
                            <span className="text-[10px] text-[#F4EFE6]/50">Akses Cepat</span>
                        </div>

                        {/* Customer Dashboard Card */}
                        <Link
                            href="/order"
                            onClick={() => setSidePanelOpen(false)}
                            className="group block p-3.5 rounded-2xl bg-gradient-to-r from-[#32151F]/80 to-[#211D1B] border border-[#B99A65]/40 hover:border-[#D4B886] transition-all shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-[#B99A65]/20 border border-[#B99A65]/40 flex items-center justify-center text-[#D4B886]">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-heading text-sm font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                            Dashboard Pemesanan
                                        </h4>
                                        <p className="text-[11px] text-[#F4EFE6]/70">
                                            Menu, Favorit, Request Koki, Chat & Rating
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#D4B886] group-hover:translate-x-1 transition-transform" />
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-[#32151F] flex items-center gap-2 text-[10px] text-[#D4B886]">
                                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> Favorit</span>
                                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-amber-400" /> Live Chat</span>
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-300 fill-amber-300" /> Ulasan Bintang 5</span>
                            </div>
                        </Link>

                        {/* Admin Dashboard Card */}
                        <Link
                            href="/admin"
                            onClick={() => setSidePanelOpen(false)}
                            className="group block p-3.5 rounded-2xl bg-[#171312] border border-stone-700 hover:border-[#B99A65]/60 transition-all shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-600 flex items-center justify-center text-[#D4B886]">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-heading text-sm font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                            Dashboard Operasional Admin
                                        </h4>
                                        <p className="text-[11px] text-[#F4EFE6]/70">
                                            Live Order Tracking Dapur, Meja QR, Stok
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[#D4B886] group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>

                    {/* B. Navigasi Halaman Restoran */}
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886] block">
                            Daftar Menu & Halaman
                        </span>

                        <div className="divide-y divide-[#32151F]/60 rounded-2xl bg-[#211D1B]/60 border border-stone-800 overflow-hidden">
                            <a
                                href="#menu"
                                onClick={() => handleNavClick('#menu')}
                                className="flex items-center justify-between p-3 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Utensils className="w-4 h-4 text-[#D4B886]" />
                                    <span>Menu Signature & Best Seller</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                            </a>

                            <a
                                href="#cerita"
                                onClick={() => handleNavClick('#cerita')}
                                className="flex items-center justify-between p-3 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <BookOpen className="w-4 h-4 text-[#D4B886]" />
                                    <span>Cerita & Filosofi 17.000 Rempah</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                            </a>

                            <a
                                href="#pengalaman"
                                onClick={() => handleNavClick('#pengalaman')}
                                className="flex items-center justify-between p-3 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Sparkles className="w-4 h-4 text-[#D4B886]" />
                                    <span>Dining Experience (Rijsttafel & VIP)</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                            </a>

                            <a
                                href="#alur-pesan"
                                onClick={() => handleNavClick('#alur-pesan')}
                                className="flex items-center justify-between p-3 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <QrCode className="w-4 h-4 text-[#D4B886]" />
                                    <span>Cara Memesan (Dine-in QR / Takeaway)</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                            </a>

                            <a
                                href="#kontak"
                                onClick={() => handleNavClick('#kontak')}
                                className="flex items-center justify-between p-3 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <MapPin className="w-4 h-4 text-[#D4B886]" />
                                    <span>Lokasi Flagship Senopati & Jam Buka</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                            </a>

                            <button
                                type="button"
                                onClick={() => {
                                    setSidePanelOpen(false);
                                    if (onReplaySplash) onReplaySplash();
                                }}
                                className="w-full flex items-center justify-between p-3 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#D4B886]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Sparkles className="w-4 h-4 text-[#B99A65]" />
                                    <span>Tonton Logo Reveal Splashscreen</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                            </button>
                        </div>
                    </div>

                    {/* C. Aksi Cepat Restoran */}
                    <div className="space-y-2 pt-1">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886] block">
                            Aksi Restoran
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setSidePanelOpen(false);
                                    onOpenOrderType?.();
                                }}
                                className="p-3 rounded-xl bg-stone-900 border border-stone-700 hover:border-[#B99A65] text-left space-y-1 transition-all"
                            >
                                <QrCode className="w-4 h-4 text-[#D4B886]" />
                                <p className="text-xs font-bold text-[#F4EFE6]">Scan Meja</p>
                                <p className="text-[10px] text-stone-400">Dine-in / Takeaway</p>
                            </button>

                            <button
                                onClick={() => {
                                    setSidePanelOpen(false);
                                    onOpenReservation?.();
                                }}
                                className="p-3 rounded-xl bg-[#32151F] border border-[#B99A65]/40 hover:border-[#D4B886] text-left space-y-1 transition-all"
                            >
                                <Calendar className="w-4 h-4 text-[#D4B886]" />
                                <p className="text-xs font-bold text-[#F4EFE6]">Reservasi</p>
                                <p className="text-[10px] text-[#D4B886]">Meja Tamu VIP</p>
                            </button>
                        </div>
                    </div>

                    {/* D. Akun Pengguna */}
                    <div className="p-3.5 rounded-2xl bg-[#171312] border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                                Status Akun
                            </span>
                            {auth?.user ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-400 font-semibold uppercase">
                                    {auth.user.role}
                                </span>
                            ) : (
                                <span className="text-[10px] text-stone-500">Tamu</span>
                            )}
                        </div>

                        {auth?.user ? (
                            <div className="flex items-center justify-between pt-1">
                                <div className="text-xs">
                                    <p className="font-bold text-[#F4EFE6]">{auth.user.name}</p>
                                    <p className="text-[11px] text-[#B99A65] truncate max-w-[200px]">{auth.user.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-900 text-rose-300 hover:bg-rose-900/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Keluar</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between pt-1">
                                <p className="text-xs text-[#F4EFE6]/70">Masuk untuk simpan riwayat & favorit</p>
                                <Link
                                    href="/login"
                                    onClick={() => setSidePanelOpen(false)}
                                    className="px-4 py-1.5 rounded-lg bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] text-xs font-semibold transition-all"
                                >
                                    Log In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Side Panel Footer */}
                <div className="p-4 border-t border-[#32151F] bg-[#151211] space-y-2 text-[11px] text-[#F4EFE6]/60">
                    <div className="flex items-center justify-between text-[#D4B886]">
                        <span className="font-semibold">Flagship Senopati</span>
                        <span>11:00 – 22:30 WIB</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Jl. Senopati No. 88, Jaksel</span>
                        <a href="tel:+622155678900" className="hover:text-[#D4B886] transition-colors">
                            +62 21 5567 8900
                        </a>
                    </div>
                </div>
            </aside>
        </>
    );
}
