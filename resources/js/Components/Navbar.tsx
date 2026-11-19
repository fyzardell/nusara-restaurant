import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { User } from '../types';
import { 
    PanelLeft, 
    PanelLeftClose, 
    X, 
    User as UserIcon, 
    LogOut, 
    Calendar, 
    QrCode, 
    ShoppingBag, 
    Sparkles, 
    Utensils, 
    BookOpen, 
    MapPin, 
    Clock, 
    ArrowRight, 
    ChevronRight,
    UtensilsCrossed,
    CheckCircle2
} from 'lucide-react';

interface Props {
    sidePanelOpen: boolean;
    onToggleSidePanel: () => void;
    onCloseSidePanel: () => void;
    onOpenReservation?: () => void;
    onOpenOrderType?: () => void;
    onSelectDineIn?: () => void;
    onSelectTakeaway?: () => void;
    onReplaySplash?: () => void;
}

export default function Navbar({ 
    sidePanelOpen, 
    onToggleSidePanel, 
    onCloseSidePanel,
    onOpenReservation, 
    onOpenOrderType, 
    onSelectDineIn,
    onSelectTakeaway,
    onReplaySplash 
}: Props) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const [scrolled, setScrolled] = useState(false);
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
                onCloseSidePanel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sidePanelOpen, onCloseSidePanel]);

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/logout');
    };

    const handleNavClick = (href: string) => {
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            {/* ========================================================
                1. MAIN HEADER (Ultra-clean, shifts alongside page content)
                HANYA ADA: Tombol Side Panel, Logo, Pilih Menu, Reservasi, Log In
            ======================================================== */}
            <header 
                className={`fixed top-0 right-0 z-40 transition-all duration-300 ease-in-out ${
                    sidePanelOpen ? 'md:left-[350px] left-0' : 'left-0'
                }`}
            >
                <nav 
                    className={`transition-all duration-300 ${
                        scrolled 
                            ? 'bg-[#1E1A18]/95 backdrop-blur-md shadow-2xl py-3 border-b border-[#B99A65]/20' 
                            : 'bg-gradient-to-b from-[#1E1A18]/95 via-[#1E1A18]/80 to-transparent py-4'
                    }`}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            {/* Left Group: Button Side Panel (Chrome Style) + Logo NUSARA */}
                            <div className="flex items-center gap-3">
                                {/* Chrome-style Side Panel Toggle Button */}
                                <button
                                    onClick={onToggleSidePanel}
                                    className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 shadow-sm ${
                                        sidePanelOpen 
                                            ? 'bg-[#B99A65] text-[#211D1B] border-[#B99A65]' 
                                            : 'bg-[#2A221F] text-[#D4B886] border-[#B99A65]/40 hover:bg-[#32151F] hover:border-[#D4B886]'
                                    }`}
                                    title={sidePanelOpen ? 'Tutup Side Panel' : 'Buka Side Panel (Kaya di Chrome)'}
                                    aria-label="Toggle Side Panel"
                                >
                                    {sidePanelOpen ? (
                                        <PanelLeftClose className="w-4 h-4" />
                                    ) : (
                                        <PanelLeft className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline text-xs font-semibold tracking-wider">
                                        Side Panel
                                    </span>
                                </button>

                                {/* Logo NUSARA */}
                                <Link href="/" className="group flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full border border-[#B99A65]/60 bg-[#171312] flex items-center justify-center text-[#D4B886] shadow-inner group-hover:border-[#B99A65] transition-colors">
                                        <span className="font-heading text-xl font-bold tracking-tighter">N</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-heading text-xl sm:text-2xl font-bold tracking-widest text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors leading-none">
                                            NUSARA
                                        </span>
                                        <span className="text-[9px] uppercase tracking-[0.22em] text-[#B99A65] mt-0.5 font-medium">
                                            Indonesian Dining
                                        </span>
                                    </div>
                                </Link>
                            </div>

                            {/* Right Group: Sesuai permintaan: Hanya sisain:
                                1. Pilih Menu
                                2. Reservasi
                                3. Log In (atau profil pelanggan)
                            */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* 1. Tombol Pilih Menu */}
                                <a
                                    href="#menu"
                                    className="px-3.5 sm:px-4 py-2 text-xs font-semibold tracking-wider text-[#F4EFE6] border border-[#B99A65]/40 rounded-full hover:bg-[#B99A65]/15 hover:border-[#D4B886] transition-all flex items-center gap-1.5"
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
                                        </button>

                                        {userDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-52 bg-[#211D1B] border border-[#B99A65]/40 rounded-xl shadow-2xl py-2 z-50 text-xs">
                                                <div className="px-4 py-2 border-b border-[#32151F]">
                                                    <p className="font-bold text-[#F4EFE6] truncate">{auth.user.name}</p>
                                                    <p className="text-[11px] text-[#B99A65] truncate">{auth.user.email}</p>
                                                </div>
                                                <Link
                                                    href="/order"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="block px-4 py-2 text-[#F4EFE6] hover:bg-[#32151F] transition-colors"
                                                >
                                                    Menu Pemesanan Saya
                                                </Link>
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
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            {/* ========================================================
                2. LEFT DOCKED SIDE PANEL (Kaya di Chrome Desktop)
                Bukan pop-up, halaman bergeser ke kanan dan tetap interaktif!
            ======================================================== */}
            {/* Mobile backdrop overlay only (hidden on desktop so page stays 100% interactive) */}
            {sidePanelOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
                    onClick={onCloseSidePanel}
                />
            )}

            {/* Pinned Left Side Panel */}
            <aside 
                className={`fixed top-0 left-0 bottom-0 w-[320px] sm:w-[350px] bg-[#171312] border-r border-[#B99A65]/30 z-50 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out select-none ${
                    sidePanelOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                aria-label="Chrome-style Left Side Panel"
            >
                {/* A. Top Panel Header (Chrome desktop side panel toolbar style) */}
                <div className="p-3.5 sm:p-4 border-b border-[#32151F] flex items-center justify-between bg-[#130F0E]">
                    <div className="flex items-center gap-2 text-[#D4B886]">
                        <PanelLeftClose className="w-4 h-4 text-[#B99A65]" />
                        <span className="font-heading text-sm font-bold tracking-wider text-[#F4EFE6]">
                            NUSARA <span className="text-[#D4B886] font-normal text-xs">Side Panel</span>
                        </span>
                    </div>

                    <button
                        onClick={onCloseSidePanel}
                        className="p-1.5 rounded-lg bg-[#211D1B] text-[#F4EFE6]/70 hover:text-[#D4B886] hover:bg-[#32151F] transition-colors border border-stone-800"
                        title="Tutup Side Panel (Esc)"
                        aria-label="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* B. Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* 1. Pilihan Pemesanan: Dine In atau Takeaway */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886]">
                                Pilihan Pemesanan
                            </span>
                            <span className="text-[9px] text-[#F4EFE6]/50">Dine In / Takeaway</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {/* Card Dine In */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (onSelectDineIn) {
                                        onSelectDineIn();
                                    } else if (onOpenOrderType) {
                                        onOpenOrderType();
                                    }
                                }}
                                className="group p-3 rounded-xl bg-gradient-to-b from-[#32151F]/90 to-[#211D1B] border border-[#B99A65]/40 hover:border-[#D4B886] text-left space-y-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="w-7 h-7 rounded-lg bg-[#B99A65]/20 flex items-center justify-center text-[#D4B886]">
                                    <UtensilsCrossed className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                        Dine In
                                    </p>
                                    <p className="text-[10px] text-stone-300">
                                        Makan di Tempat (QR Meja)
                                    </p>
                                </div>
                            </button>

                            {/* Card Takeaway */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (onSelectTakeaway) {
                                        onSelectTakeaway();
                                    } else if (onOpenOrderType) {
                                        onOpenOrderType();
                                    }
                                }}
                                className="group p-3 rounded-xl bg-gradient-to-b from-[#211D1B] to-[#181413] border border-stone-700 hover:border-[#B99A65]/60 text-left space-y-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-[#D4B886]">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                        Takeaway
                                    </p>
                                    <p className="text-[10px] text-stone-300">
                                        Bawa Pulang (Siap Ambil)
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Direct Customer Order App Link (ala Kopi Kenangan) */}
                        <Link
                            href="/order"
                            className="group block p-3 rounded-xl bg-[#211D1B] border border-[#B99A65]/30 hover:border-[#D4B886] transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#B99A65]" />
                                    <span className="text-xs font-semibold text-[#F4EFE6] group-hover:text-[#D4B886] transition-colors">
                                        Buka Menu Pemesanan Lengkap
                                    </span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-[#D4B886] group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                                Favorit, catatan request koki, keranjang, live chat & rating bintang 5
                            </p>
                        </Link>
                    </div>

                    {/* 2. Daftar Halaman & Menu */}
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4B886] block">
                            Daftar Halaman & Menu
                        </span>

                        <div className="divide-y divide-[#32151F]/60 rounded-xl bg-[#211D1B]/70 border border-stone-800 overflow-hidden">
                            <a
                                href="#menu"
                                onClick={() => handleNavClick('#menu')}
                                className="flex items-center justify-between p-2.5 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2">
                                    <Utensils className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span>Menu Signature & Best Seller</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                            </a>

                            <a
                                href="#cerita"
                                onClick={() => handleNavClick('#cerita')}
                                className="flex items-center justify-between p-2.5 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span>Cerita & Filosofi 17.000 Rempah</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                            </a>

                            <a
                                href="#pengalaman"
                                onClick={() => handleNavClick('#pengalaman')}
                                className="flex items-center justify-between p-2.5 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span>Dining Experience (Rijsttafel & VIP)</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                            </a>

                            <a
                                href="#alur-pesan"
                                onClick={() => handleNavClick('#alur-pesan')}
                                className="flex items-center justify-between p-2.5 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span>Alur Pemesanan Meja QR</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                            </a>

                            <a
                                href="#kontak"
                                onClick={() => handleNavClick('#kontak')}
                                className="flex items-center justify-between p-2.5 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#F4EFE6]"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-[#D4B886]" />
                                    <span>Lokasi Restoran & Jam Buka</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                            </a>

                            <button
                                type="button"
                                onClick={() => {
                                    if (onReplaySplash) onReplaySplash();
                                }}
                                className="w-full flex items-center justify-between p-2.5 hover:bg-[#32151F]/40 transition-colors text-xs font-medium text-[#D4B886]"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#B99A65]" />
                                    <span>Tonton Logo Reveal Splashscreen</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                            </button>
                        </div>
                    </div>

                    {/* 3. Tombol Reservasi Meja Tamu */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={onOpenReservation}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#B99A65] via-[#D4B886] to-[#B99A65] text-[#211D1B] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Reservasi Meja Anda</span>
                        </button>
                    </div>

                    {/* 4. Status Akun Tamu / Pelanggan (Tanpa Admin) */}
                    <div className="p-3 rounded-xl bg-[#211D1B] border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase font-semibold">
                            <span>Akun Pelanggan</span>
                            {auth?.user && (
                                <span className="text-emerald-400">Terdaftar</span>
                            )}
                        </div>

                        {auth?.user ? (
                            <div className="flex items-center justify-between">
                                <div className="text-xs">
                                    <p className="font-bold text-[#F4EFE6] truncate max-w-[170px]">{auth.user.name}</p>
                                    <p className="text-[10px] text-[#B99A65] truncate max-w-[170px]">{auth.user.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-2.5 py-1 rounded bg-rose-950/40 border border-rose-900 text-rose-300 hover:bg-rose-900/40 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                    <LogOut className="w-3 h-3" />
                                    <span>Keluar</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] text-[#F4EFE6]/70">Masuk untuk simpan riwayat</p>
                                <Link
                                    href="/login"
                                    className="px-3 py-1 rounded bg-[#32151F] border border-[#B99A65]/40 text-[#D4B886] hover:bg-[#B99A65] hover:text-[#211D1B] text-xs font-semibold transition-all"
                                >
                                    Log In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* C. Side Panel Footer */}
                <div className="p-3.5 border-t border-[#32151F] bg-[#130F0E] space-y-1 text-[10px] text-[#F4EFE6]/60">
                    <div className="flex items-center justify-between text-[#D4B886]">
                        <span className="font-semibold">Flagship Senopati No. 88, Jaksel</span>
                        <span>11:00 – 22:30 WIB</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Layanan Meja & Reservasi</span>
                        <a href="tel:+622155678900" className="hover:text-[#D4B886] transition-colors">
                            +62 21 5567 8900
                        </a>
                    </div>
                </div>
            </aside>
        </>
    );
}
